import { apiClient } from './apiClient';
import type { ApiResponse, DashboardStats, User } from '@/types';

export const userService = {
  updateProfile: (data: { name?: string; email?: string }) =>
    apiClient.put<ApiResponse<{ user: User }>>('/users/profile', data),

  updatePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiClient.put<ApiResponse<null>>('/users/password', data),

  updateProfilePicture: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return apiClient.put<ApiResponse<{ user: User }>>('/users/profile-picture', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  deleteAccount: () => apiClient.delete<ApiResponse<null>>('/users/account'),

  getStats: () => apiClient.get<ApiResponse<DashboardStats>>('/users/stats'),
};
