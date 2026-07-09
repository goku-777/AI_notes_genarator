import multer from 'multer';
import { Request } from 'express';
import { ApiError } from '../utils/ApiError';

const ALLOWED_MIME_TYPES = [
  'audio/mpeg', // mp3
  'audio/mp4', // mp4/m4a
  'audio/wav',
  'audio/x-wav',
  'audio/wave',
  'audio/aac',
  'audio/x-m4a',
  'audio/webm', // browser live recording
  'video/mp4', // mp4 file containing audio
];

const storage = multer.memoryStorage();

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  callback: multer.FileFilterCallback
): void => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    callback(null, true);
  } else {
    callback(
      new ApiError(
        400,
        `Unsupported file type: ${file.mimetype}. Allowed formats: MP3, MP4, WAV, AAC, M4A.`
      ) as any
    );
  }
};

export const uploadAudio = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 200 * 1024 * 1024, // 200 MB max
  },
});

export const uploadProfilePicture = multer({
  storage,
  fileFilter: (_req, file, callback) => {
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedImageTypes.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(new ApiError(400, 'Only JPEG, PNG, and WEBP images are allowed.') as any);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max
  },
});
