import { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, RotateCcw, RotateCw } from 'lucide-react';
import { motion } from 'framer-motion';

interface AudioPlayerProps {
  src: string;
}

const formatTime = (seconds: number) => {
  if (!isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${m}:${s}`;
};

export const AudioPlayer = ({ src }: AudioPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
    };
  }, [src]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const time = Number(e.target.value);
    audio.currentTime = time;
    setCurrentTime(time);
  };

  const skip = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.min(Math.max(audio.currentTime + seconds, 0), duration);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="glass-card flex items-center gap-4 p-4">
      <audio ref={audioRef} src={src} preload="metadata" />

      <button
        onClick={() => skip(-10)}
        className="rounded-full p-2 text-[var(--color-graphite)] hover:bg-black/5"
        aria-label="Rewind 10 seconds"
      >
        <RotateCcw className="h-4 w-4" />
      </button>

      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={togglePlay}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-charcoal)] text-white shadow-[var(--shadow-glass-sm)]"
      >
        {isPlaying ? <Pause className="h-4.5 w-4.5" /> : <Play className="h-4.5 w-4.5 translate-x-0.5" />}
      </motion.button>

      <button
        onClick={() => skip(10)}
        className="rounded-full p-2 text-[var(--color-graphite)] hover:bg-black/5"
        aria-label="Forward 10 seconds"
      >
        <RotateCw className="h-4 w-4" />
      </button>

      <span className="w-10 shrink-0 text-right font-mono text-xs text-[var(--color-silver)]">
        {formatTime(currentTime)}
      </span>

      <input
        type="range"
        min={0}
        max={duration || 0}
        value={currentTime}
        onChange={handleSeek}
        className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-[var(--color-silver-soft)] accent-[var(--color-accent)]"
        style={{
          background: `linear-gradient(to right, var(--color-accent) ${progressPercent}%, var(--color-silver-soft) ${progressPercent}%)`,
        }}
      />

      <span className="w-10 shrink-0 font-mono text-xs text-[var(--color-silver)]">
        {formatTime(duration)}
      </span>

      <button
        onClick={toggleMute}
        className="shrink-0 rounded-full p-2 text-[var(--color-graphite)] hover:bg-black/5"
      >
        {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      </button>
    </div>
  );
};
