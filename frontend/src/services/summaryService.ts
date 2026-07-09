import { apiClient } from './apiClient';
import type { ActionItem, ApiResponse, Meeting, Notes, Summary } from '@/types';

export const summaryService = {
  generate: (meetingId: string) =>
    apiClient.post<ApiResponse<{ summary: Summary; actionItems: ActionItem[]; notes: Notes; meeting: Meeting }>>(
      `/summaries/${meetingId}/generate`
    ),

  get: (meetingId: string) =>
    apiClient.get<ApiResponse<{ summary: Summary; actionItems: ActionItem[] }>>(
      `/summaries/${meetingId}`
    ),

  update: (meetingId: string, data: Partial<Summary>) =>
    apiClient.put<ApiResponse<{ summary: Summary }>>(`/summaries/${meetingId}`, data),
};
