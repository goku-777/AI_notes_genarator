# ── Stage: Production Image ───────────────────────────────────────────────────
FROM node:20

# System dependencies for local Whisper transcription
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Install OpenAI Whisper (Python package for speech-to-text)
RUN pip3 install --break-system-packages openai-whisper

WORKDIR /app

# ── Root dependencies ─────────────────────────────────────────────────────────
COPY package*.json ./
RUN npm install --omit=dev

# ── Frontend: install, build ──────────────────────────────────────────────────
COPY frontend/package*.json ./frontend/
RUN npm install --prefix frontend
COPY frontend/ ./frontend/
RUN npm run build --prefix frontend

# ── Backend: install, build ───────────────────────────────────────────────────
COPY backend/package*.json ./backend/
RUN npm install --prefix backend
COPY backend/ ./backend/
RUN npm run build --prefix backend

# Render uses port 10000 by default
EXPOSE 10000

# Start the server
CMD ["node", "backend/dist/server.js"]
