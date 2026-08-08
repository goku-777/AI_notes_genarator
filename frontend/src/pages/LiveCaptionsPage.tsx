import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  MicOff,
  Wifi,
  WifiOff,
  Loader2,
  AlertTriangle,
  Captions,
  Trash2,
} from 'lucide-react';
import { tokenStorage } from '@/services/apiClient';

// ── Types ────────────────────────────────────────────────────────────────────

type ConnectionStatus = 'idle' | 'connecting' | 'live' | 'disconnected' | 'error';

interface CaptionLine {
  id: number;
  text: string;
  timestamp: number;
}

interface ServerMessage {
  type: 'caption' | 'error';
  text?: string;
  message?: string;
  timestamp?: number;
}

// ── Constants ────────────────────────────────────────────────────────────────

const WS_BASE =
  import.meta.env.VITE_WS_BASE_URL ||
  (import.meta.env.VITE_API_BASE_URL
    ? import.meta.env.VITE_API_BASE_URL.replace('/api', '').replace('http', 'ws')
    : window.location.origin.replace('http', 'ws'));

const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_BASE_DELAY_MS = 1000;
const VISIBLE_LINES = 6;
const AUDIO_TIMESLICE_MS = 3000;

// ── Component ────────────────────────────────────────────────────────────────

export default function LiveCaptionsPage() {
  // ── State ────────────────────────────────────────────────────────────────

  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  const [captions, setCaptions] = useState<CaptionLine[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [micError, setMicError] = useState<string | null>(null);

  // ── Refs (mutable across renders, no re-render on change) ────────────────

  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const captionIdRef = useRef(0);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isActiveRef = useRef(false);
  const captionsEndRef = useRef<HTMLDivElement>(null);

  // Keep the ref in sync with state so callbacks can read it
  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  // Auto-scroll captions to bottom
  useEffect(() => {
    captionsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [captions]);

  // ── WebSocket lifecycle ──────────────────────────────────────────────────

  const connectWs = useCallback(() => {
    const token = tokenStorage.getAccessToken();
    if (!token) {
      setErrorMessage('You must be logged in to use live captions.');
      setStatus('error');
      return;
    }

    setStatus('connecting');
    setErrorMessage(null);

    const ws = new WebSocket(`${WS_BASE}/ws/live-captions?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[LiveCaptions] WebSocket connected');
      setStatus('live');
      reconnectAttemptRef.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const msg: ServerMessage = JSON.parse(event.data);

        if (msg.type === 'caption' && msg.text) {
          const line: CaptionLine = {
            id: ++captionIdRef.current,
            text: msg.text,
            timestamp: msg.timestamp || Date.now(),
          };
          setCaptions((prev) => [...prev, line]);
        }

        if (msg.type === 'error') {
          setErrorMessage(msg.message || 'Unknown transcription error');
        }
      } catch {
        // ignore non-JSON messages
      }
    };

    ws.onclose = (event) => {
      console.log(`[LiveCaptions] WebSocket closed (code=${event.code})`);

      if (isActiveRef.current) {
        // Unexpected disconnect — try to reconnect
        setStatus('disconnected');
        attemptReconnect();
      } else {
        setStatus('idle');
      }
    };

    ws.onerror = () => {
      console.error('[LiveCaptions] WebSocket error');
      // onclose will fire after this
    };
  }, []);

  const attemptReconnect = useCallback(() => {
    if (reconnectAttemptRef.current >= MAX_RECONNECT_ATTEMPTS) {
      setStatus('error');
      setErrorMessage(
        'Unable to reconnect to the live captions server. Please try again.'
      );
      return;
    }

    const delay =
      RECONNECT_BASE_DELAY_MS * Math.pow(2, reconnectAttemptRef.current);
    reconnectAttemptRef.current++;

    console.log(
      `[LiveCaptions] Reconnecting in ${delay}ms (attempt ${reconnectAttemptRef.current}/${MAX_RECONNECT_ATTEMPTS})`
    );

    reconnectTimerRef.current = setTimeout(() => {
      if (isActiveRef.current) {
        connectWs();
      }
    }, delay);
  }, [connectWs]);

  // ── Mic + MediaRecorder lifecycle ────────────────────────────────────────

  const startCapturing = useCallback(async () => {
    setMicError(null);
    setErrorMessage(null);

    // Request mic permission
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });
    } catch (err: any) {
      const msg =
        err.name === 'NotAllowedError'
          ? 'Microphone permission was denied. Please allow microphone access in your browser settings and try again.'
          : err.name === 'NotFoundError'
            ? 'No microphone found. Please connect a microphone and try again.'
            : `Could not access microphone: ${err.message}`;
      setMicError(msg);
      return;
    }

    streamRef.current = stream;
    setIsActive(true);
    isActiveRef.current = true;

    // Connect WebSocket
    connectWs();

    // Start MediaRecorder with 3-second timeslice
    const recorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus',
    });

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(event.data);
      }
    };

    recorder.onerror = () => {
      console.error('[LiveCaptions] MediaRecorder error');
    };

    recorder.start(AUDIO_TIMESLICE_MS);
    mediaRecorderRef.current = recorder;
  }, [connectWs]);

  const stopCapturing = useCallback(() => {
    isActiveRef.current = false;
    setIsActive(false);

    // Clear reconnect timer
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    reconnectAttemptRef.current = 0;

    // Stop MediaRecorder
    if (mediaRecorderRef.current) {
      try {
        if (mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
      } catch {
        // ignore
      }
      mediaRecorderRef.current = null;
    }

    // Stop mic stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setStatus('idle');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCapturing();
    };
  }, [stopCapturing]);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const clearCaptions = () => setCaptions([]);

  const statusConfig: Record<
    ConnectionStatus,
    { color: string; label: string; icon: React.ReactNode }
  > = {
    idle: {
      color: 'bg-gray-400',
      label: 'Ready',
      icon: <WifiOff className="h-3.5 w-3.5" />,
    },
    connecting: {
      color: 'bg-yellow-400 animate-pulse',
      label: 'Connecting…',
      icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
    },
    live: {
      color: 'bg-emerald-500 animate-pulse',
      label: 'Live',
      icon: <Wifi className="h-3.5 w-3.5" />,
    },
    disconnected: {
      color: 'bg-orange-400 animate-pulse',
      label: 'Reconnecting…',
      icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
    },
    error: {
      color: 'bg-red-500',
      label: 'Error',
      icon: <AlertTriangle className="h-3.5 w-3.5" />,
    },
  };

  const currentStatus = statusConfig[status];

  // Which captions to show (last N for the visible window)
  const visibleCaptions = captions.slice(-VISIBLE_LINES * 3); // keep more for fade

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Live Captions
          </h1>
          <p className="mt-1 text-sm text-[var(--color-silver)]">
            Real-time speech-to-text powered by Whisper AI
          </p>
        </div>

        {/* Status badge */}
        <div className="flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 shadow-sm backdrop-blur-sm border border-[var(--color-silver-soft)]">
          <span
            className={`inline-block h-2.5 w-2.5 rounded-full ${currentStatus.color}`}
          />
          <span className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-graphite)]">
            {currentStatus.icon}
            {currentStatus.label}
          </span>
        </div>
      </div>

      {/* ── Error banners ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {micError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-start gap-3 rounded-[var(--radius-md)] border border-red-200 bg-red-50 p-4"
          >
            <MicOff className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
            <div>
              <p className="text-sm font-medium text-red-800">
                Microphone Access Required
              </p>
              <p className="mt-0.5 text-xs text-red-600">{micError}</p>
            </div>
            <button
              onClick={() => setMicError(null)}
              className="ml-auto text-red-400 hover:text-red-600 text-lg leading-none"
            >
              ×
            </button>
          </motion.div>
        )}

        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-start gap-3 rounded-[var(--radius-md)] border border-amber-200 bg-amber-50 p-4"
          >
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                Transcription Issue
              </p>
              <p className="mt-0.5 text-xs text-amber-600">{errorMessage}</p>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="ml-auto text-amber-400 hover:text-amber-600 text-lg leading-none"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Captions display ────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-[var(--radius-xl)] shadow-[var(--shadow-glass-lg)]">
        {/* Dark caption background */}
        <div className="min-h-[340px] bg-gradient-to-b from-[#1a1a2e] to-[#16213e] p-6 sm:p-8">
          {/* Empty state */}
          {captions.length === 0 && (
            <div className="flex h-[280px] flex-col items-center justify-center text-center">
              <div className="mb-4 rounded-full bg-white/5 p-4">
                <Captions className="h-10 w-10 text-white/30" />
              </div>
              <p className="text-base font-medium text-white/40">
                {isActive
                  ? 'Listening… speak now'
                  : 'Press Start to begin live captioning'}
              </p>
              <p className="mt-1 text-xs text-white/20">
                Captions will appear here in real time
              </p>
            </div>
          )}

          {/* Caption lines */}
          {captions.length > 0 && (
            <div className="flex h-[280px] flex-col justify-end overflow-hidden">
              <div className="scrollbar-thin space-y-2 overflow-y-auto pr-2">
                <AnimatePresence initial={false}>
                  {visibleCaptions.map((line, idx) => {
                    // Fade older lines
                    const distFromEnd = visibleCaptions.length - idx;
                    const opacity =
                      distFromEnd <= VISIBLE_LINES
                        ? 1
                        : Math.max(0.15, 1 - (distFromEnd - VISIBLE_LINES) * 0.2);

                    return (
                      <motion.div
                        key={line.id}
                        initial={{ opacity: 0, y: 20, scale: 0.97 }}
                        animate={{ opacity, y: 0, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.35, ease: 'easeOut' }}
                        className="rounded-lg bg-white/[0.07] px-4 py-3 backdrop-blur-sm"
                      >
                        <p className="text-sm font-medium leading-relaxed text-white/90 sm:text-base">
                          {line.text}
                        </p>
                        <p className="mt-1 text-[10px] text-white/25">
                          {new Date(line.timestamp).toLocaleTimeString()}
                        </p>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                <div ref={captionsEndRef} />
              </div>
            </div>
          )}
        </div>

        {/* Live indicator bar */}
        {isActive && status === 'live' && (
          <div className="absolute bottom-0 left-0 right-0 h-1">
            <div className="h-full animate-pulse bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500" />
          </div>
        )}
      </div>

      {/* ── Controls ────────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
        {!isActive ? (
          <button
            onClick={startCapturing}
            className="btn-ripple group flex items-center gap-2.5 rounded-full bg-[var(--color-charcoal)] px-8 py-3.5 text-sm font-semibold text-white shadow-[var(--shadow-glass-md)] transition-all duration-300 hover:shadow-[var(--shadow-glass-lg)] hover:scale-[1.03] active:scale-[0.98]"
          >
            <Mic className="h-5 w-5 transition-transform group-hover:scale-110" />
            Start Captioning
          </button>
        ) : (
          <button
            onClick={stopCapturing}
            className="btn-ripple group flex items-center gap-2.5 rounded-full bg-red-600 px-8 py-3.5 text-sm font-semibold text-white shadow-[var(--shadow-glass-md)] transition-all duration-300 hover:bg-red-700 hover:shadow-[var(--shadow-glass-lg)] hover:scale-[1.03] active:scale-[0.98]"
          >
            <MicOff className="h-5 w-5 transition-transform group-hover:scale-110" />
            Stop Captioning
          </button>
        )}

        {captions.length > 0 && (
          <button
            onClick={clearCaptions}
            className="flex items-center gap-2 rounded-full border border-[var(--color-silver-soft)] bg-white/80 px-5 py-2.5 text-xs font-medium text-[var(--color-graphite)] shadow-sm backdrop-blur-sm transition-all duration-200 hover:bg-white hover:shadow-md"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear Captions
          </button>
        )}
      </div>

      {/* ── Info section ────────────────────────────────────────────────── */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-silver-soft)] bg-white/60 p-5 backdrop-blur-sm">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-silver)]">
          How it works
        </h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {[
            {
              step: '1',
              title: 'Capture',
              desc: 'Audio is captured in 3-second chunks from your microphone',
            },
            {
              step: '2',
              title: 'Transcribe',
              desc: 'Each chunk is sent to the Whisper AI engine for transcription',
            },
            {
              step: '3',
              title: 'Display',
              desc: 'Captions appear in real-time, like Teams or Zoom live captions',
            },
          ].map((item) => (
            <div key={item.step} className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-xs font-bold text-[var(--color-accent)]">
                {item.step}
              </span>
              <div>
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-[var(--color-silver)]">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
