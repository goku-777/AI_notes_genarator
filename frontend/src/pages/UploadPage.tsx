import { useState, useRef } from 'react';
import type { DragEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UploadCloud, FileAudio, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { meetingService } from '@/services/meetingService';
import { recordingService } from '@/services/recordingService';
import { getErrorMessage } from '@/services/apiClient';

const ACCEPTED_TYPES = ['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/x-wav', 'audio/aac', 'audio/x-m4a', 'video/mp4'];
const ACCEPTED_EXTENSIONS = '.mp3,.mp4,.wav,.aac,.m4a';

const UploadPage = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selected: File | null) => {
    if (!selected) return;
    if (!ACCEPTED_TYPES.includes(selected.type)) {
      toast.error('Unsupported file type. Please use MP3, MP4, WAV, AAC, or M4A.');
      return;
    }
    if (selected.size > 200 * 1024 * 1024) {
      toast.error('File is too large. Maximum size is 200MB.');
      return;
    }
    setFile(selected);
    if (!title) {
      setTitle(selected.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files[0] || null);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    setIsUploading(true);
    setProgress(0);

    try {
      const { data: meetingData } = await meetingService.create({
        title: title || file.name.replace(/\.[^/.]+$/, ''),
      });
      const meeting = meetingData.data!.meeting;

      await recordingService.upload(meeting._id, file, setProgress);

      toast.success('Recording uploaded successfully!');
      navigate(`/meetings/${meeting._id}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-[var(--color-charcoal)]">Upload Recording</h1>
      <p className="mt-1 text-sm text-[var(--color-silver)]">
        Upload an audio or video file to generate AI-powered notes.
      </p>

      <Card className="mt-6">
        <Input
          label="Meeting title"
          placeholder="e.g. Q3 Planning Sync"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mb-5"
        />

        {!file ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-[var(--radius-lg)] border-2 border-dashed p-12 text-center transition-colors ${
              isDragging
                ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)]'
                : 'border-[var(--color-silver-soft)] hover:border-[var(--color-silver)]'
            }`}
          >
            <motion.div
              animate={{ y: isDragging ? -4 : 0 }}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-accent-soft)]"
            >
              <UploadCloud className="h-6 w-6 text-[var(--color-accent)]" />
            </motion.div>
            <p className="mt-4 font-semibold text-[var(--color-charcoal)]">
              Drop your file here, or click to browse
            </p>
            <p className="mt-1 text-xs text-[var(--color-silver)]">
              Supports MP3, MP4, WAV, AAC, M4A — up to 200MB
            </p>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_EXTENSIONS}
              className="hidden"
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleFileSelect(e.target.files?.[0] || null)}
            />
          </div>
        ) : (
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-silver-soft)] bg-white/70 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent-soft)]">
                <FileAudio className="h-5 w-5 text-[var(--color-accent)]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[var(--color-charcoal)]">
                  {file.name}
                </p>
                <p className="text-xs text-[var(--color-silver)]">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
              {!isUploading && (
                <button
                  onClick={() => setFile(null)}
                  className="rounded-full p-1.5 text-[var(--color-silver)] hover:bg-black/5"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {isUploading && (
              <div className="mt-4">
                <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-silver-soft)]">
                  <motion.div
                    className="h-full rounded-full bg-[var(--color-accent)]"
                    style={{ width: `${progress}%` }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
                <p className="mt-2 flex items-center gap-1.5 text-xs text-[var(--color-silver)]">
                  <Loader2 className="h-3 w-3 animate-spin" /> Uploading... {progress}%
                </p>
              </div>
            )}
          </div>
        )}

        <Button
          className="mt-6 w-full"
          size="lg"
          disabled={!file}
          isLoading={isUploading}
          onClick={handleUpload}
        >
          Upload &amp; Continue
        </Button>
      </Card>
    </div>
  );
};

export default UploadPage;
