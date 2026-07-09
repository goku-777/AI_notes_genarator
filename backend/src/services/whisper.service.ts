

import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import { config } from '../config/env';
import { ApiError } from '../utils/ApiError';

// ─── helpers ─────────────────────────────────────────────────────────────────

/**
 * Downloads a remote URL to a local temp file.
 * Returns the full path of the written file.
 */
const downloadToTemp = async (url: string, ext: string): Promise<string> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw ApiError.badRequest(
      `Could not download audio for transcription (HTTP ${response.status})`
    );
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const uniqueName = `whisper_in_${crypto.randomBytes(8).toString('hex')}${ext}`;
  const tmpPath = path.join(os.tmpdir(), uniqueName);
  fs.writeFileSync(tmpPath, buffer);
  return tmpPath;
};

/**
 * Resolves the file extension to use for the downloaded temp file.
 * Falls back to .mp3 when the original name has no recognisable extension.
 */
const resolveExt = (fileName: string): string => {
  const known = ['.mp3', '.mp4', '.wav', '.m4a', '.aac', '.webm', '.ogg', '.flac'];
  const ext = path.extname(fileName).toLowerCase();
  return known.includes(ext) ? ext : '.mp3';
};

/**
 * Wraps child_process.spawn as a Promise.
 * Resolves with { stdout, stderr } on exit-code 0.
 * Rejects with an Error whose message includes stderr on any other exit code
 * or a spawn error (e.g. ENOENT when python3 is not installed).
 */
const spawnAsync = (
  command: string,
  args: string[]
): Promise<{ stdout: string; stderr: string }> =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        PYTHONUTF8: '1'
      }
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (d: Buffer) => (stdout += d.toString()));
    child.stderr.on('data', (d: Buffer) => (stderr += d.toString()));

    child.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'ENOENT') {
        reject(
          new Error(
            `Python executable not found: "${command}". ` +
              `Install Python 3 and ensure it is on your PATH, ` +
              `or set WHISPER_PYTHON_BIN in .env to the full path.`
          )
        );
      } else {
        reject(new Error(`Failed to spawn "${command}": ${err.message}`));
      }
    });

    child.on('close', (code: number | null) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        // Whisper prints progress to stderr; include it so the operator can diagnose.
        reject(
          new Error(
            `Whisper exited with code ${code ?? 'null'}.\n` +
              `stderr:\n${stderr.slice(-2000)}`
          )
        );
      }
    });
  });

/**
 * Checks whether the openai-whisper Python package is importable.
 * Returns true/false rather than throwing so the caller can give a better error.
 */
const isWhisperInstalled = async (pythonBin: string): Promise<boolean> => {
  try {
    await spawnAsync(pythonBin, ['-c', 'import whisper']);
    return true;
  } catch {
    return false;
  }
};

// ─── public API ──────────────────────────────────────────────────────────────

export interface TranscriptionResult {
  text: string;
  language?: string;
}

/**
 * Transcribes an audio file from a remote URL using local Whisper.
 *
 * @param audioUrl       Cloudinary (or any accessible HTTPS) URL of the audio.
 * @param fileName       Original file name — used to determine the temp file extension.
 * @returns              Resolved transcript text and detected language.
 */
export const transcribeAudioFromUrl = async (
  audioUrl: string,
  fileName = 'audio.mp3'
): Promise<TranscriptionResult> => {
  const { pythonBin, model } = config.whisper;

  // ── 1. Pre-flight: verify Python & Whisper are available ─────────────────
  // We do this before downloading the audio so the user gets a clear error
  // immediately rather than after waiting for a potentially large download.
  const whisperAvailable = await isWhisperInstalled(pythonBin).catch(() => false);
  if (!whisperAvailable) {
    throw ApiError.internal(
      `Local Whisper is not installed or not importable by "${pythonBin}". ` +
        `Run:  pip install openai-whisper  ` +
        `(and ensure you are using the same Python that your backend uses). ` +
        `To use a specific Python, set WHISPER_PYTHON_BIN in .env.`
    );
  }

  // ── 2. Download audio to a unique temp file ───────────────────────────────
  const ext = resolveExt(fileName);
  let tmpAudioPath = '';
  const tmpOutputDir = "Z:\\MINI Project\\ai-notes-generator\\backend\\whisper_output";

  try {
    tmpAudioPath = await downloadToTemp(audioUrl, ext);
    fs.mkdirSync(tmpOutputDir, { recursive: true });

    // ── 3. Run local Whisper ────────────────────────────────────────────────
    //
    // Command equivalent:
    //   python3 -m whisper <audio> --model base --output_format txt --output_dir <dir>
    //
    // Whisper writes:
    //   <dir>/<audioBasename>.txt   — plain transcript
    //   <dir>/<audioBasename>.json  — detailed segments (we don't need this here)
    //   (and .vtt / .srt if you add those formats — we don't)
    //
    const result = await spawnAsync(pythonBin, [
      '-m', 'whisper',
      tmpAudioPath,
      '--model', model,
      '--output_format', 'txt',
      '--output_dir', tmpOutputDir,
      '--fp16', 'False',
    ]);

    console.log("========== WHISPER STDOUT ==========");
    console.log(result.stdout);

    console.log("========== WHISPER STDERR ==========");
    console.log(result.stderr);

    console.log("Output directory exists:", fs.existsSync(tmpOutputDir));
    console.log("Output directory:", tmpOutputDir);

    if (fs.existsSync(tmpOutputDir)) {
      console.log("Files in directory:", fs.readdirSync(tmpOutputDir));
    }

    // ── 4. Locate the transcript file Whisper produced ────────────────────
    // Whisper names output files based on the input filename. The exact
    // convention can vary (e.g. `name.txt` or `name.mp3.txt`), so instead
    // of guessing we just find the .txt file in our dedicated output dir.
    const outputFiles = fs.readdirSync(tmpOutputDir);
    console.log("Output directory:", tmpOutputDir);
    console.log("Files:", outputFiles);

    const txtFile = outputFiles.find((f) => f.endsWith('.txt'));
    if (!txtFile) {
      throw ApiError.internal(
        `Whisper ran successfully but did not produce a .txt transcript file. ` +
          `Files found in output dir: [${outputFiles.join(', ')}]`
      );
    }
    const txtPath = path.join(tmpOutputDir, txtFile);
    const baseName = path.basename(txtFile, '.txt');

    const text = fs.readFileSync(txtPath, 'utf-8').trim();

    // Whisper does not write the detected language into the txt output —
    // it appears in JSON output only.  We attempt to read the JSON sidecar
    // if present; otherwise we leave language undefined (the model field in
    // the DB has a sensible default of 'en').
    let language: string | undefined;
    const jsonPath = path.join(tmpOutputDir, `${baseName}.json`);
    if (fs.existsSync(jsonPath)) {
      try {
        const json = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
        language = json.language as string | undefined;
      } catch {
        // Non-critical — language is optional metadata.
      }
    }

    return { text, language };
  } catch (error: any) {
    // Re-throw ApiErrors as-is; wrap everything else as a 500.
    if (error instanceof ApiError) throw error;
    throw ApiError.internal(`Local Whisper transcription failed: ${error.message ?? 'Unknown error'}`);
  } finally {
    // ── 5. Always clean up temp files ──────────────────────────────────────
    try {
      if (tmpAudioPath && fs.existsSync(tmpAudioPath)) fs.unlinkSync(tmpAudioPath);
    } catch { /* best-effort */ }

    try {
      if (fs.existsSync(tmpOutputDir)) {
        fs.readdirSync(tmpOutputDir).forEach((f) =>
          fs.unlinkSync(path.join(tmpOutputDir, f))
        );
        fs.rmdirSync(tmpOutputDir);
      }
    } catch { /* best-effort */ }
  }
};
