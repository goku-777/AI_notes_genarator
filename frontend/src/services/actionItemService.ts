import { apiClient } from './apiClient';
import type { ActionItem, ActionItemPriority, ActionItemStatus, ApiResponse } from '@/types';

export const actionItemService = {
  create: (
    summaryId: string,
    data: { task: string; assignee?: string; deadline?: string; priority?: ActionItemPriority }
  ) => apiClient.post<ApiResponse<{ actionItem: ActionItem }>>(`/action-items/${summaryId}`, data),

  update: (
    id: string,
    data: Partial<{
      task: string;
      status: ActionItemStatus;
      assignee: string;
      deadline: string;
      priority: ActionItemPriority;
    }>
  ) => apiClient.put<ApiResponse<{ actionItem: ActionItem }>>(`/action-items/${id}`, data),

  delete: (id: string) => apiClient.delete<ApiResponse<null>>(`/action-items/${id}`),
};
