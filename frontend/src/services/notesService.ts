import { apiClient } from './apiClient';
import type { ApiResponse, Meeting, Notes } from '@/types';

export const notesService = {
  get: (meetingId: string) => apiClient.get<ApiResponse<{ notes: Notes }>>(`/notes/${meetingId}`),

  update: (meetingId: string, noteContent: string) =>
    apiClient.put<ApiResponse<{ notes: Notes }>>(`/notes/${meetingId}`, { noteContent }),

  generateShareLink: (meetingId: string) =>
    apiClient.post<ApiResponse<{ shareUrl: string; shareToken: string }>>(
      `/notes/${meetingId}/share`
    ),

  revokeShareLink: (meetingId: string) =>
    apiClient.delete<ApiResponse<null>>(`/notes/${meetingId}/share`),

  emailShareLink: (meetingId: string, recipientEmail: string) =>
    apiClient.post<ApiResponse<{ shareUrl: string }>>(`/notes/${meetingId}/share/email`, {
      recipientEmail,
    }),

  getShared: (shareToken: string) =>
    apiClient.get<ApiResponse<{ notes: Notes; meeting: Meeting }>>(`/notes/shared/${shareToken}`),
};
