import { apiClient } from './apiClient';
import type { ApiResponse, Transcript } from '@/types';

export const transcriptService = {
  generate: (meetingId: string) =>
    apiClient.post<ApiResponse<{ transcript: Transcript }>>(`/transcripts/${meetingId}/generate`),

  get: (meetingId: string) =>
    apiClient.get<ApiResponse<{ transcript: Transcript }>>(`/transcripts/${meetingId}`),

  update: (meetingId: string, transcriptText: string) =>
    apiClient.put<ApiResponse<{ transcript: Transcript }>>(`/transcripts/${meetingId}`, {
      transcriptText,
    }),
};
