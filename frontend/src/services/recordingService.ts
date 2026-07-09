import { apiClient } from './apiClient';
import type { ApiResponse, Recording } from '@/types';

export const recordingService = {
  upload: (meetingId: string, file: File, onProgress?: (percent: number) => void) => {
    const formData = new FormData();
    formData.append('audio', file);
    return apiClient.post<ApiResponse<{ recording: Recording }>>(
      `/recordings/${meetingId}/upload`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (event) => {
          if (onProgress && event.total) {
            onProgress(Math.round((event.loaded * 100) / event.total));
          }
        },
      }
    );
  },

  saveLive: (
    meetingId: string,
    blob: Blob,
    duration: number,
    onProgress?: (percent: number) => void
  ) => {
    const formData = new FormData();
    formData.append('audio', blob, 'live-recording.webm');
    formData.append('duration', String(duration));
    return apiClient.post<ApiResponse<{ recording: Recording }>>(
      `/recordings/${meetingId}/live`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (event) => {
          if (onProgress && event.total) {
            onProgress(Math.round((event.loaded * 100) / event.total));
          }
        },
      }
    );
  },

  get: (meetingId: string) =>
    apiClient.get<ApiResponse<{ recording: Recording }>>(`/recordings/${meetingId}`),

  delete: (meetingId: string) => apiClient.delete<ApiResponse<null>>(`/recordings/${meetingId}`),
};
