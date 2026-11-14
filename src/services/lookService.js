import { apiRequest } from './apiClient';

export const lookService = {
  async getLooks(params = {}) {
    return apiRequest('/admin/looks', {
      method: 'GET',
      query: {
        status: params.status,
        page: params.page,
        limit: params.limit,
      },
    });
  },

  async moderateLook(id, action, reason = '') {
    return apiRequest(`/admin/looks/${id}/moderation`, {
      method: 'PUT',
      body: JSON.stringify({ action, reason }),
    });
  },
};
