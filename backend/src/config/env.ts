import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface Config {
  nodeEnv: string;
  port: number;
  clientUrl: string;
  mongodbUri: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  jwtRefreshSecret: string;
  jwtRefreshExpiresIn: string;
  geminiApiKey: string;
  geminiModel: string;
  // openaiApiKey removed — transcription now uses local Whisper via Python
  whisper: {
    // Path to the Python executable. Defaults to 'python3' (assumes it is on PATH).
    // Override with WHISPER_PYTHON_BIN if your setup uses a virtualenv or conda env.
    pythonBin: string;
    // Whisper model size: tiny | base | small | medium | large
    // 'base' is a good default: ~140 MB, reasonable accuracy, fast on CPU.
    // Override with WHISPER_MODEL in .env if you want higher accuracy.
    model: string;
  };
  cloudinary: {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
  };
  smtp: {
    host: string;
    port: number;
    user: string;
    pass: string;
    emailFrom: string;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
}

const required = (key: string, fallback?: string): string => {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    // eslint-disable-next-line no-console
    console.warn(`[config] Warning: environment variable ${key} is not set.`);
    return '';
  }
  return value;
};

export const config: Config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  mongodbUri: required('MONGODB_URI', 'mongodb://localhost:27017/ai-notes-generator'),
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  jwtRefreshSecret: required('JWT_REFRESH_SECRET'),
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  geminiApiKey: required('GEMINI_API_KEY'),
  geminiModel: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
  whisper: {
    pythonBin: process.env.WHISPER_PYTHON_BIN || 'python3',
    model: process.env.WHISPER_MODEL || 'base',
  },
  cloudinary: {
    cloudName: required('CLOUDINARY_CLOUD_NAME'),
    apiKey: required('CLOUDINARY_API_KEY'),
    apiSecret: required('CLOUDINARY_API_SECRET'),
  },
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    emailFrom: process.env.EMAIL_FROM || 'AI Notes Generator <no-reply@ainotes.com>',
  },
  rateLimit: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    maxRequests: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 200,
  },
};
