FROM node:20-slim

# Install Python and FFmpeg (required for Whisper)
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Create a virtual environment and install whisper
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install --no-cache-dir openai-whisper

WORKDIR /app

# Install Node dependencies
COPY package*.json ./
RUN npm ci

# Copy application source
COPY . .

# Build the TypeScript project
RUN npm run build

# Expose the application port
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
