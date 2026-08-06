import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { config } from '../config/env';

// ── Types ────────────────────────────────────────────────────────────────────

interface PendingRequest {
  resolve: (text: string) => void;
  reject: (err: Error) => void;
}

// ── Module state ─────────────────────────────────────────────────────────────

let worker: ChildProcess | null = null;
let workerReady = false;
let workerError: string | null = null;
let respawnTimer: ReturnType<typeof setTimeout> | null = null;

/** FIFO queue — each transcribeChunk() call pushes a pending item; stdout
 *  responses are matched in order. */
const pending: PendingRequest[] = [];

/** Buffer for partial stdout reads (the length-prefixed frame may arrive
 *  across multiple 'data' events). */
let stdoutBuffer = Buffer.alloc(0);

const WORKER_SCRIPT = path.resolve(
  __dirname,
  '../../whisper_worker/live_worker.py'
);

// ── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Process buffered stdout data, resolving pending requests as complete
 * length-prefixed frames arrive.
 */
function drainStdout(): void {
  // Each frame: 4-byte big-endian length + <length> bytes of UTF-8 text
  while (stdoutBuffer.length >= 4) {
    const frameLen = stdoutBuffer.readUInt32BE(0);
    const totalLen = 4 + frameLen;

    if (stdoutBuffer.length < totalLen) {
      // Incomplete frame — wait for more data
      break;
    }

    const text = stdoutBuffer.subarray(4, totalLen).toString('utf-8');
    stdoutBuffer = stdoutBuffer.subarray(totalLen);

    const req = pending.shift();
    if (req) {
      req.resolve(text);
    }
  }
}

/**
 * Reject all pending requests (e.g. when the worker crashes).
 */
function rejectAllPending(reason: string): void {
  while (pending.length > 0) {
    const req = pending.shift();
    req?.reject(new Error(reason));
  }
}

/**
 * Spawn (or respawn) the Python worker process.
 */
function spawnWorker(): void {
  if (worker) {
    // Kill any lingering process before respawning
    try {
      worker.kill('SIGKILL');
    } catch {
      // ignore
    }
    worker = null;
  }

  workerReady = false;
  workerError = null;
  stdoutBuffer = Buffer.alloc(0);

  const pythonBin = config.whisper.pythonBin;

  console.log(
    `[liveCaptionWorker] Spawning worker: ${pythonBin} ${WORKER_SCRIPT}`
  );

  const child = spawn(pythonBin, [WORKER_SCRIPT], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: {
      ...process.env,
      WHISPER_MODEL: config.whisper.model,
      PYTHONUTF8: '1',
    },
  });

  child.on('error', (err: NodeJS.ErrnoException) => {
    const msg =
      err.code === 'ENOENT'
        ? `Python executable not found: "${pythonBin}". Install Python 3 and ensure it is on PATH.`
        : `Worker spawn error: ${err.message}`;

    console.error(`[liveCaptionWorker] ${msg}`);
    workerError = msg;
    workerReady = false;
    rejectAllPending(msg);
    scheduleRespawn();
  });

  child.on('exit', (code, signal) => {
    console.warn(
      `[liveCaptionWorker] Worker exited (code=${code}, signal=${signal}). Will respawn.`
    );
    workerReady = false;
    worker = null;
    rejectAllPending(`Worker exited (code=${code})`);
    scheduleRespawn();
  });

  // ── stdout: length-prefixed transcription responses ──────────────────────

  child.stdout!.on('data', (chunk: Buffer) => {
    stdoutBuffer = Buffer.concat([stdoutBuffer, chunk]);
    drainStdout();
  });

  // ── stderr: informational logs from the Python worker ────────────────────

  let stderrAccum = '';
  child.stderr!.on('data', (chunk: Buffer) => {
    const text = chunk.toString();
    stderrAccum += text;
    // Print each complete line
    const lines = stderrAccum.split('\n');
    stderrAccum = lines.pop() || '';
    for (const line of lines) {
      if (line.trim()) {
        console.log(`[liveCaptionWorker:py] ${line}`);
      }
      // Detect the "Ready" sentinel from the Python worker
      if (line.includes('loaded successfully. Ready.')) {
        workerReady = true;
        workerError = null;
        console.log('[liveCaptionWorker] Worker is ready.');
      }
      // Detect fatal errors from the Python worker
      if (line.includes('FATAL:')) {
        workerError = line.replace(/^\[live_worker\]\s*FATAL:\s*/, '').trim();
      }
    }
  });

  worker = child;
}

/**
 * Schedule a respawn after a short delay (avoids tight crash loops).
 */
function scheduleRespawn(): void {
  if (respawnTimer) return;
  respawnTimer = setTimeout(() => {
    respawnTimer = null;
    console.log('[liveCaptionWorker] Respawning worker...');
    spawnWorker();
  }, 3000);
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Initialise the worker. Safe to call multiple times — only the first
 * call actually spawns the process.
 */
export function initWorker(): void {
  if (!worker) {
    spawnWorker();
  }
}

/**
 * Returns the current worker status for health-check / error reporting.
 */
export function getWorkerStatus(): {
  ready: boolean;
  error: string | null;
} {
  return { ready: workerReady, error: workerError };
}

/**
 * Send an audio chunk to the persistent Whisper worker and receive the
 * transcribed text.
 *
 * The chunk is written to the worker's stdin as a length-prefixed frame:
 *   [4 bytes: big-endian uint32 length] [N bytes: raw audio data]
 *
 * The response is read from stdout in the same format.
 *
 * If the worker is not ready (still loading the model), this rejects
 * immediately with an informative error.
 */
export function transcribeChunk(audioBuffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!worker || !worker.stdin || worker.stdin.destroyed) {
      return reject(
        new Error(
          workerError ||
            'Live transcription worker is not available. It may still be loading.'
        )
      );
    }

    if (!workerReady) {
      return reject(
        new Error(
          workerError ||
            'Live transcription worker is still loading the Whisper model. Please wait.'
        )
      );
    }

    // Enqueue the pending callback
    pending.push({ resolve, reject });

    // Write the length-prefixed audio chunk to stdin
    const header = Buffer.alloc(4);
    header.writeUInt32BE(audioBuffer.length, 0);

    try {
      worker.stdin.write(header);
      worker.stdin.write(audioBuffer);
    } catch (err: any) {
      // If writing fails, remove the pending entry and reject
      const idx = pending.findIndex((p) => p.resolve === resolve);
      if (idx !== -1) pending.splice(idx, 1);
      reject(new Error(`Failed to write to worker stdin: ${err.message}`));
    }
  });
}

/**
 * Gracefully shut down the worker process (used during server shutdown).
 */
export function shutdownWorker(): void {
  if (respawnTimer) {
    clearTimeout(respawnTimer);
    respawnTimer = null;
  }

  if (worker) {
    console.log('[liveCaptionWorker] Shutting down worker...');
    try {
      worker.stdin?.end();
      worker.kill('SIGTERM');
    } catch {
      // ignore
    }
    worker = null;
    workerReady = false;
  }

  rejectAllPending('Worker shut down');
}
