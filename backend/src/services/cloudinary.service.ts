import cloudinary from '../config/cloudinary';
import { ApiError } from '../utils/ApiError';
import { UploadApiResponse } from 'cloudinary';

interface UploadResult {
  url: string;
  publicId: string;
  duration?: number;
  bytes: number;
}

/**
 * Uploads a file buffer to Cloudinary under the given folder.
 * resourceType 'video' is used for audio files since Cloudinary
 * treats audio as part of its video pipeline (gives duration metadata).
 */
export const uploadBufferToCloudinary = (
  buffer: Buffer,
  folder: string,
  resourceType: 'video' | 'image' | 'auto' = 'auto'
): Promise<UploadResult> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (error, result?: UploadApiResponse) => {
        if (error || !result) {
          reject(ApiError.internal(`Cloudinary upload failed: ${error?.message || 'unknown error'}`));
          return;
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          duration: result.duration,
          bytes: result.bytes,
        });
      }
    );
    uploadStream.end(buffer);
  });
};

export const deleteFromCloudinary = async (
  publicId: string,
  resourceType: 'video' | 'image' = 'video'
): Promise<void> => {
  if (!publicId) return;
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
};
