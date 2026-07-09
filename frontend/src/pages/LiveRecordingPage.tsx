import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mic, Pause, Play, Square, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useMediaRecorder } from '@/hooks/useMediaRecorder';
import { meetingService } from '@/services/meetingService';
import { recordingService } from '@/services/recordingService';
import { getErrorMessage } from '@/services/apiClient';
import { socket } from '@/services/socket';

const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

const LiveRecordingPage = () => {
  const navigate = useNavigate();
  const { state, duration, audioBlob, audioUrl, error, start, pause, resume, stop, reset } =
    useMediaRecorder();
  const [title, setTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  useEffect(() => {
 const handleTranscript = (text: string) => {
  console.log('📢 Live Transcript:', text);

  setLiveTranscript((prev) =>
    prev ? `${prev} ${text}` : text
  );
};

  socket.on('live-transcript', handleTranscript);

  return () => {
    socket.off('live-transcript', handleTranscript);
  };
}, []);

  const handleSave = async () => {
    if (!audioBlob) return;
    setIsSaving(true);
    try {
      const { data: meetingData } = await meetingService.create({
        title: title || `Live Recording - ${new Date().toLocaleDateString()}`,
      });
      const meeting = meetingData.data!.meeting;

      await recordingService.saveLive(meeting._id, audioBlob, duration);

      toast.success('Recording saved successfully!');
      navigate(`/meetings/${meeting._id}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-[var(--color-charcoal)]">Live Recording</h1>
      <p className="mt-1 text-sm text-[var(--color-silver)]">
        Record your meeting directly in the browser.
      </p>

      <Card className="mt-6 flex flex-col items-center py-12">
        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-[var(--radius-md)] bg-red-50 px-4 py-3 text-sm text-[var(--color-danger)]">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <motion.div
          animate={
            state === 'recording'
              ? { scale: [1, 1.06, 1] }
              : { scale: 1 }
          }
          transition={{ repeat: state === 'recording' ? Infinity : 0, duration: 1.6 }}
          className={`flex h-28 w-28 items-center justify-center rounded-full ${
            state === 'recording'
              ? 'bg-red-50 text-[var(--color-danger)]'
              : 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
          }`}
        >
          <Mic className="h-10 w-10" />
        </motion.div>

        <p className="mt-6 font-mono text-4xl font-bold tabular-nums text-[var(--color-charcoal)]">
          {formatDuration(duration)}
        </p>
        <p className="mt-1 text-xs font-medium uppercase tracking-wide text-[var(--color-silver)]">
          {state === 'idle' && 'Ready to record'}
          {state === 'recording' && 'Recording...'}
          {state === 'paused' && 'Paused'}
          {state === 'stopped' && 'Recording complete'}
        </p>

        <div className="mt-8 flex items-center gap-3">
          {state === 'idle' && (
            <Button size="lg" leftIcon={<Mic className="h-4 w-4" />} onClick={start}>
              Start Recording
            </Button>
          )}
          {state === 'recording' && (
            <>
              <Button variant="outline" leftIcon={<Pause className="h-4 w-4" />} onClick={pause}>
                Pause
              </Button>
              <Button variant="danger" leftIcon={<Square className="h-4 w-4" />} onClick={stop}>
                Stop
              </Button>
            </>
          )}
          {state === 'paused' && (
            <>
              <Button leftIcon={<Play className="h-4 w-4" />} onClick={resume}>
                Resume
              </Button>
              <Button variant="danger" leftIcon={<Square className="h-4 w-4" />} onClick={stop}>
                Stop
              </Button>
            </>
          )}
        </div>

          {liveTranscript && (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="mt-8 w-full"
  >
    <Card className="p-5">
      <h3 className="mb-3 text-lg font-semibold text-[var(--color-charcoal)]">
        Live Subtitles
      </h3>

      <div className="max-h-48 overflow-y-auto rounded-lg bg-gray-50 p-4">
        <p className="whitespace-pre-wrap text-base leading-7 text-gray-800">
          {liveTranscript}
        </p>
      </div>
    </Card>
  </motion.div>
)}

        {state === 'stopped' && audioUrl && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 w-full"
          >
            <audio src={audioUrl} controls className="w-full rounded-full" />

            <Input
              label="Meeting title"
              placeholder="e.g. Daily Standup"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-5"
            />

            <div className="mt-5 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={reset} disabled={isSaving}>
                Discard
              </Button>
              <Button
                className="flex-1"
                onClick={handleSave}
                isLoading={isSaving}
                leftIcon={!isSaving ? undefined : <Loader2 className="h-4 w-4 animate-spin" />}
              >
                Save Recording
              </Button>
            </div>
          </motion.div>
        )}
      </Card>
    </div>
  );
};

export default LiveRecordingPage;
