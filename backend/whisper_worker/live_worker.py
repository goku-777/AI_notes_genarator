#!/usr/bin/env python3
"""
Persistent Whisper transcription worker for live captioning.

Loads the Whisper model ONCE at startup, then enters a long-lived loop:
  - Reads audio chunks from stdin  (4-byte big-endian length prefix + raw bytes)
  - Transcribes each chunk
  - Writes the result to stdout    (4-byte big-endian length prefix + UTF-8 text)

Errors on individual chunks are caught and logged to stderr;
the worker returns an empty string for that chunk and keeps running.
"""

import os
import sys
import struct
import tempfile
import traceback

# ---------------------------------------------------------------------------
# 1. Load Whisper model (once, at startup)
# ---------------------------------------------------------------------------

MODEL_NAME = os.environ.get("WHISPER_MODEL", "base")

try:
    import whisper  # type: ignore
except ImportError:
    sys.stderr.write(
        "[live_worker] FATAL: 'openai-whisper' is not installed. "
        "Run:  pip install openai-whisper\n"
    )
    sys.stderr.flush()
    sys.exit(1)

sys.stderr.write(f"[live_worker] Loading Whisper model '{MODEL_NAME}'...\n")
sys.stderr.flush()

try:
    model = whisper.load_model(MODEL_NAME)
except Exception as exc:
    sys.stderr.write(f"[live_worker] FATAL: Failed to load model '{MODEL_NAME}': {exc}\n")
    sys.stderr.flush()
    sys.exit(1)

sys.stderr.write(f"[live_worker] Model '{MODEL_NAME}' loaded successfully. Ready.\n")
sys.stderr.flush()

# ---------------------------------------------------------------------------
# 2. Helper: read exactly N bytes from stdin (binary mode)
# ---------------------------------------------------------------------------

# Force binary mode on stdin/stdout (Windows compatibility)
if hasattr(sys.stdin, "buffer"):
    stdin_bin = sys.stdin.buffer
else:
    stdin_bin = sys.stdin

if hasattr(sys.stdout, "buffer"):
    stdout_bin = sys.stdout.buffer
else:
    stdout_bin = sys.stdout


def read_exact(stream, n: int) -> bytes:
    """Read exactly n bytes from stream, or raise EOFError."""
    buf = b""
    while len(buf) < n:
        chunk = stream.read(n - len(buf))
        if not chunk:
            raise EOFError("stdin closed")
        buf += chunk
    return buf


# ---------------------------------------------------------------------------
# 3. Helper: write a length-prefixed response
# ---------------------------------------------------------------------------

def write_response(text: str) -> None:
    """Write a 4-byte big-endian length prefix + UTF-8 encoded text to stdout."""
    encoded = text.encode("utf-8")
    header = struct.pack(">I", len(encoded))
    stdout_bin.write(header + encoded)
    stdout_bin.flush()


# ---------------------------------------------------------------------------
# 4. Main loop
# ---------------------------------------------------------------------------

def main() -> None:
    while True:
        try:
            # Read 4-byte length prefix
            length_bytes = read_exact(stdin_bin, 4)
            length = struct.unpack(">I", length_bytes)[0]

            if length == 0:
                write_response("")
                continue

            # Read the audio chunk
            audio_data = read_exact(stdin_bin, length)

            # Write to a temporary file for Whisper
            tmp_fd, tmp_path = tempfile.mkstemp(suffix=".webm")
            try:
                os.write(tmp_fd, audio_data)
                os.close(tmp_fd)

                # Transcribe
                result = model.transcribe(
                    tmp_path,
                    fp16=False,
                    language=None,  # auto-detect
                )
                text = (result.get("text") or "").strip()
            finally:
                # Always clean up the temp file
                try:
                    os.unlink(tmp_path)
                except OSError:
                    pass

            write_response(text)

        except EOFError:
            # Parent process closed stdin — exit cleanly
            sys.stderr.write("[live_worker] stdin closed, exiting.\n")
            sys.stderr.flush()
            break

        except Exception:
            # Log the error but keep the worker alive
            sys.stderr.write(f"[live_worker] Chunk error:\n{traceback.format_exc()}")
            sys.stderr.flush()
            try:
                write_response("")
            except Exception:
                # If even writing the response fails, bail out
                sys.stderr.write("[live_worker] Failed to write error response, exiting.\n")
                sys.stderr.flush()
                break


if __name__ == "__main__":
    main()
