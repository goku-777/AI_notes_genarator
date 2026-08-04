# Use Node.js 20
FROM node:20

# Install Python, pip and FFmpeg
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Install OpenAI Whisper
RUN pip3 install --break-system-packages openai-whisper

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Copy project files
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 10000

# Start server
CMD ["npm", "start"]