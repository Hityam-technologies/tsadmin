import { apiRequest } from './apiClient';

export const dashboardService = {
  /**
   * Get Dashboard Aggregates & Trends
   * API: GET /admin/dashboard/stats
   */
  async getStats() {
    return apiRequest('/admin/dashboard/stats', { method: 'GET' });
  },
};

