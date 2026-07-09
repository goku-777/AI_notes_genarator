import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';

import { runWhisper } from './whisperRunner';

/**
 * Transcribes a single complete WebM audio buffer using local Whisper.
 *
 * Each invocation creates a unique temporary directory:
 *   temp/live-whisper/<uuid>/audio.webm
 *   temp/live-whisper/<uuid>/audio.txt   (Whisper output)
 *
 * The directory is cleaned up after successful transcription.
 */
export const transcribeLiveBuffer = async (
  audioBuffer: Buffer
): Promise<string> => {
  const id = crypto.randomUUID();
  const tempDir = path.join(os.tmpdir(), 'live-whisper', id);
  fs.mkdirSync(tempDir, { recursive: true });

  const audioPath = path.join(tempDir, 'audio.webm');
  fs.writeFileSync(audioPath, audioBuffer);

  console.log(`[whisper] Segment ${id}: ${audioBuffer.length} bytes`);

  await runWhisper(audioPath, tempDir);

  const transcriptPath = path.join(tempDir, 'audio.txt');

  const transcript = fs.existsSync(transcriptPath)
    ? fs.readFileSync(transcriptPath, 'utf8').trim()
    : '';

  if (transcript) {
    console.log(`[whisper] Segment ${id}: "${transcript}"`);
  } else {
    console.log(`[whisper] Segment ${id}: (empty transcript)`);
  }

  // Cleanup temporary files
  try {
    fs.unlinkSync(audioPath);

    if (fs.existsSync(transcriptPath)) {
      fs.unlinkSync(transcriptPath);
    }

    fs.rmdirSync(tempDir);
  } catch {
    // best effort cleanup
  }

  return transcript;
};