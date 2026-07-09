import http from 'http';
import { Server, Socket } from 'socket.io';

import app from './app';
import { config } from './config/env';
import { connectDB } from './config/database';
import { setSocketIO } from './socket';
import { transcribeLiveBuffer } from './services/liveTranscription.service';

// ── Transcription Queue ──────────────────────────────────────────────

interface QueueItem {
  socketId: string;
  socket: Socket;
  audio: Buffer;
}

const whisperQueue: QueueItem[] = [];
let processingQueue = false;

async function processQueue(): Promise<void> {
  if (processingQueue) return;

  processingQueue = true;

  while (whisperQueue.length > 0) {
    const job = whisperQueue.shift();

    if (!job) continue;

    try {
      console.log(
        `[queue] Processing segment (${whisperQueue.length} remaining)`
      );

      const transcript = await transcribeLiveBuffer(job.audio);

      if (transcript) {
        job.socket.emit('live-transcript', transcript);
      }
    } catch (err) {
      console.error('[queue] Whisper failed:', err);
    }
  }

  processingQueue = false;
}

// ── Server Bootstrap ─────────────────────────────────────────────────

const startServer = async (): Promise<void> => {
  await connectDB();

  const httpServer = http.createServer(app);

  const io = new Server(httpServer, {
    cors: {
      origin: config.clientUrl,
      methods: ['GET', 'POST'],
    },
    maxHttpBufferSize: 5 * 1024 * 1024, // 5 MB — enough for 3-second WebM segments
  });

  setSocketIO(io);

  io.on('connection', (socket) => {
    console.log(`[socket] Client connected: ${socket.id}`);

    // ── Live audio segment handler ────────────────────────────────
    // Each segment is a COMPLETE, independently playable WebM file.
    // No buffering, no concatenation — straight into the queue.
    socket.on('live-audio-segment', (segmentBlob: ArrayBuffer | Buffer) => {
      const audioBuffer = Buffer.isBuffer(segmentBlob)
        ? segmentBlob
        : Buffer.from(segmentBlob);

      if (audioBuffer.length === 0) return;

      console.log(
        `[socket] ${socket.id}: received segment (${audioBuffer.length} bytes)`
      );

      whisperQueue.push({
        socketId: socket.id,
        socket,
        audio: audioBuffer,
      });

      processQueue();
    });

    socket.on('disconnect', () => {
      console.log(`[socket] Client disconnected: ${socket.id}`);
    });
  });

  const server = httpServer.listen(config.port, () => {
    console.log(
      `[server] AI Notes Generator API running in ${config.nodeEnv} mode on port ${config.port}`
    );
  });

  const shutdown = (signal: string) => {
    console.log(`[server] Received ${signal}. Shutting down gracefully...`);

    server.close(() => {
      console.log('[server] Server closed.');

      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  process.on('unhandledRejection', (reason) => {
    console.error('[server] Unhandled Rejection:', reason);
  });
};

startServer().catch((err) => {
  console.error('[server] Failed to start server:', err);

  process.exit(1);
});