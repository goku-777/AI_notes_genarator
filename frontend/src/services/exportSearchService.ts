import { apiClient } from './apiClient';
import type { ApiResponse, Meeting } from '@/types';

export type ExportFormat = 'pdf' | 'docx' | 'txt' | 'md';

export const exportService = {
  /**
   * Downloads a file export by triggering a blob download in the browser.
   */
  download: async (meetingId: string, format: ExportFormat, fileName: string) => {
    const response = await apiClient.get(`/export/${meetingId}/${format}`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${fileName}.${format}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

export const searchService = {
  search: (params: { q: string; from?: string; to?: string; status?: string }) =>
    apiClient.get<ApiResponse<{ query: string; results: Meeting[]; count: number }>>('/search', {
      params,
    }),
};
