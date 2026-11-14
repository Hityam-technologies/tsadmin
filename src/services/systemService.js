import { apiRequest } from './apiClient';

export const systemService = {
  /**
   * Get System Configuration & Feature Flags
   * API: GET /admin/system-config
   */
  async getConfig() {
    return apiRequest('/admin/system-config', { method: 'GET' });
  },

  /**
   * Update System Configuration & Feature Flags
   * API: PUT /admin/system-config
   */
  async updateConfig(data) {
    return apiRequest('/admin/system-config', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

