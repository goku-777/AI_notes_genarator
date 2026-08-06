import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import url from 'url';
import { verifyAccessToken } from '../utils/jwt';
import {
  initWorker,
  transcribeChunk,
  getWorkerStatus,
} from '../services/liveCaptionWorker.service';

// ── Constants ────────────────────────────────────────────────────────────────

const WS_PATH = '/ws/live-captions';

// ── Setup ────────────────────────────────────────────────────────────────────

/**
 * Attach a WebSocket server for live captions to the given HTTP server.
 *
 * Uses `noServer` mode so we can handle the `upgrade` request ourselves,
 * validate the JWT, and route only requests matching our path.
 */
export function setupLiveCaptionsWs(httpServer: http.Server): void {
  // Start the persistent Python Whisper worker
  initWorker();

  const wss = new WebSocketServer({ noServer: true });

  // ── Handle HTTP upgrade requests ─────────────────────────────────────────

  httpServer.on('upgrade', (req, socket, head) => {
    const parsed = url.parse(req.url || '', true);

    // Only handle our specific path — let other upgrade handlers (e.g.
    // Socket.IO) handle theirs.
    if (parsed.pathname !== WS_PATH) {
      return;
    }

    // ── JWT Authentication ───────────────────────────────────────────────
    const token = parsed.query.token as string | undefined;

    if (!token) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    try {
      verifyAccessToken(token);
    } catch {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    // ── Complete the WebSocket handshake ──────────────────────────────────
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req);
    });
  });

  // ── Handle WebSocket connections ─────────────────────────────────────────

  wss.on('connection', (ws: WebSocket) => {
    console.log('[liveCaptions:ws] Client connected');

    // Check if the worker is healthy and report any issues immediately
    const status = getWorkerStatus();
    if (status.error) {
      ws.send(
        JSON.stringify({
          type: 'error',
          message: `Live transcription engine unavailable: ${status.error}`,
        })
      );
    }

    // ── Incoming messages (binary audio chunks) ──────────────────────────

    ws.on('message', async (data: Buffer | ArrayBuffer | Buffer[], isBinary: boolean) => {
      if (!isBinary) {
        // We only accept binary audio data; ignore text messages.
        return;
      }

      const audioBuffer = Buffer.isBuffer(data)
        ? data
        : Buffer.from(data as ArrayBuffer);

      if (audioBuffer.length === 0) return;

      try {
        const text = await transcribeChunk(audioBuffer);

        // Only send non-empty captions
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: 'caption',
              text: text || '',
              timestamp: Date.now(),
            })
          );
        }
      } catch (err: any) {
        console.error('[liveCaptions:ws] Transcription error:', err.message);

        if (ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: 'error',
              message: `Transcription failed: ${err.message}`,
            })
          );
        }
      }
    });

    // ── Client disconnect ────────────────────────────────────────────────

    ws.on('close', () => {
      console.log('[liveCaptions:ws] Client disconnected');
    });

    ws.on('error', (err) => {
      console.error('[liveCaptions:ws] WebSocket error:', err.message);
    });
  });

  console.log(`[liveCaptions:ws] WebSocket server listening on path ${WS_PATH}`);
}
