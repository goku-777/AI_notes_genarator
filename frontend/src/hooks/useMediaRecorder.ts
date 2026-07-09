import { useCallback, useRef, useState } from 'react';
import { socket } from '@/services/socket';

export type RecordingState = 'idle' | 'recording' | 'paused' | 'stopped';

const SEGMENT_DURATION_MS = 3000;

/**
 * Determines the best supported audio MIME type for MediaRecorder.
 */
const getPreferredMimeType = (): string =>
  MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';

export const useMediaRecorder = () => {
  const [state, setState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Refs for the recording lifecycle
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const segmentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Whether the segmented recording loop should keep cycling
  const isRecordingRef = useRef(false);

  // Chunks for the CURRENT 3-second segment (sent to backend for transcription)
  const segmentChunksRef = useRef<Blob[]>([]);

  // ALL chunks across the entire session (used to build the final saved recording)
  const allChunksRef = useRef<Blob[]>([]);

  const mimeTypeRef = useRef<string>('audio/webm');

  // ──────────────────────────────────────────
  // Helpers
  // ──────────────────────────────────────────

  const clearDurationTimer = () => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  };

  const clearSegmentTimer = () => {
    if (segmentTimerRef.current) {
      clearTimeout(segmentTimerRef.current);
      segmentTimerRef.current = null;
    }
  };

  /**
   * Sends a completed segment blob to the backend for live transcription.
   */
  const emitSegment = (blob: Blob) => {
    if (blob.size > 0) {
      socket.emit('live-audio-segment', blob);
    }
  };

  /**
   * Creates and starts a new MediaRecorder on the existing stream.
   * Collects data into segmentChunksRef and allChunksRef.
   * When stopped, assembles a complete segment blob and emits it.
   *
   * @param onStopCallback  Called after the segment blob is emitted.
   *                         Used to chain the next segment start.
   */
  const createAndStartRecorder = (onStopCallback: () => void) => {
    const stream = streamRef.current;
    if (!stream) return;

    const mimeType = mimeTypeRef.current;
    segmentChunksRef.current = [];

    const recorder = new MediaRecorder(stream, { mimeType });
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e: BlobEvent) => {
      if (e.data.size > 0) {
        segmentChunksRef.current.push(e.data);
        allChunksRef.current.push(e.data);
      }
    };

    recorder.onstop = () => {
      // Build ONE complete WebM blob from this segment's chunks
      const segmentBlob = new Blob(segmentChunksRef.current, { type: mimeType });
      emitSegment(segmentBlob);
      onStopCallback();
    };

    recorder.start(); // no timeslice — records continuously until stopped
  };

  /**
   * Schedules the current recorder to stop after SEGMENT_DURATION_MS,
   * then immediately starts a new recorder (if still recording).
   */
  const scheduleSegmentCycle = () => {
    clearSegmentTimer();

    segmentTimerRef.current = setTimeout(() => {
      const recorder = mediaRecorderRef.current;

      if (!recorder || recorder.state === 'inactive') return;

      // Stop the current recorder. Its onstop will emit the segment
      // and call the onStopCallback which starts the next recorder.
      recorder.stop();
    }, SEGMENT_DURATION_MS);
  };

  // ──────────────────────────────────────────
  // Public API
  // ──────────────────────────────────────────

  const start = useCallback(async () => {
    try {
      setError(null);
      setAudioBlob(null);
      setAudioUrl(null);
      setDuration(0);
      allChunksRef.current = [];
      segmentChunksRef.current = [];
      isRecordingRef.current = true;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      mimeTypeRef.current = getPreferredMimeType();

      /**
       * The onStopCallback chains the next segment:
       *   recorder stops → blob emitted → if still recording → new recorder starts
       */
      const onSegmentStop = () => {
        if (isRecordingRef.current) {
          createAndStartRecorder(onSegmentStop);
          scheduleSegmentCycle();
        }
      };

      createAndStartRecorder(onSegmentStop);
      scheduleSegmentCycle();

      setState('recording');

      // Duration counter (1-second tick)
      durationIntervalRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } catch {
      setError('Microphone access was denied or is unavailable.');
      setState('idle');
    }
  }, []);

  const pause = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state !== 'recording') return;

    // Stop the segment timer so it doesn't fire while paused
    clearSegmentTimer();
    clearDurationTimer();

    // Stop the current recorder to flush & emit whatever was recorded so far
    isRecordingRef.current = false;
    recorder.stop();

    setState('paused');
  }, []);

  const resume = useCallback(() => {
    if (!streamRef.current) return;

    isRecordingRef.current = true;

    const onSegmentStop = () => {
      if (isRecordingRef.current) {
        createAndStartRecorder(onSegmentStop);
        scheduleSegmentCycle();
      }
    };

    createAndStartRecorder(onSegmentStop);
    scheduleSegmentCycle();

    setState('recording');

    durationIntervalRef.current = setInterval(() => {
      setDuration((d) => d + 1);
    }, 1000);
  }, []);

  const stop = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === 'inactive') return;

    // Prevent the segment cycle from restarting
    isRecordingRef.current = false;
    clearSegmentTimer();
    clearDurationTimer();

    // Override onstop to finalize the full recording
    const mimeType = mimeTypeRef.current;

    recorder.onstop = () => {
      // Emit the final partial segment for transcription
      const segmentBlob = new Blob(segmentChunksRef.current, { type: mimeType });
      emitSegment(segmentBlob);

      // Build the COMPLETE recording from all chunks across all segments
      const fullBlob = new Blob(allChunksRef.current, { type: mimeType });
      setAudioBlob(fullBlob);
      setAudioUrl(URL.createObjectURL(fullBlob));

      // Release the microphone
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };

    recorder.stop();
    setState('stopped');
  }, []);

  const reset = useCallback(() => {
    setState('idle');
    setDuration(0);
    setAudioBlob(null);
    setAudioUrl(null);
    allChunksRef.current = [];
    segmentChunksRef.current = [];
  }, []);

  return { state, duration, audioBlob, audioUrl, error, start, pause, resume, stop, reset };
};
