import { apiClient } from './apiClient';
import type { ApiResponse, Meeting, MeetingFullDetail, MeetingStatus } from '@/types';

export interface GetMeetingsParams {
  search?: string;
  status?: MeetingStatus;
  sortBy?: string;
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  includeDeleted?: boolean;
}

export const meetingService = {
  create: (data: { title?: string; date?: string }) =>
    apiClient.post<ApiResponse<{ meeting: Meeting }>>('/meetings', data),

  getAll: (params: GetMeetingsParams = {}) =>
    apiClient.get<ApiResponse<Meeting[]>>('/meetings', { params }),

  getById: (id: string) => apiClient.get<ApiResponse<MeetingFullDetail>>(`/meetings/${id}`),

  update: (id: string, data: { title?: string; date?: string; tags?: string[] }) =>
    apiClient.put<ApiResponse<{ meeting: Meeting }>>(`/meetings/${id}`, data),

  delete: (id: string) => apiClient.delete<ApiResponse<null>>(`/meetings/${id}`),

  restore: (id: string) =>
    apiClient.patch<ApiResponse<{ meeting: Meeting }>>(`/meetings/${id}/restore`),

  permanentlyDelete: (id: string) =>
    apiClient.delete<ApiResponse<null>>(`/meetings/${id}/permanent`),
};
