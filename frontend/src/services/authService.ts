import { apiClient } from './apiClient';
import type { ApiResponse, AuthTokens, User } from '@/types';

export const authService = {
  register: (data: { name: string; email: string; password: string }) =>
    apiClient.post<ApiResponse<{ user: User } & AuthTokens>>('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    apiClient.post<ApiResponse<{ user: User } & AuthTokens>>('/auth/login', data),

  logout: () => apiClient.post<ApiResponse<null>>('/auth/logout'),

  getMe: () => apiClient.get<ApiResponse<{ user: User }>>('/auth/me'),

  forgotPassword: (email: string) =>
    apiClient.post<ApiResponse<null>>('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    apiClient.post<ApiResponse<AuthTokens>>(`/auth/reset-password/${token}`, { password }),
};
