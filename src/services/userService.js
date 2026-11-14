import { apiRequest } from './apiClient';

export const userService = {
  async getUsers(params = {}) {
    return apiRequest('/admin/users', {
      method: 'GET',
      query: {
        search: params.search,
        role: params.role,
        status: params.status,
        page: params.page,
        limit: params.limit,
      },
    });
  },

  async getUserById(id) {
    return apiRequest(`/admin/users/${id}`, { method: 'GET' });
  },

  async toggleBlockUser(id, isBlocked, reason = '') {
    return apiRequest(`/admin/users/${id}/block`, {
      method: 'PUT',
      body: JSON.stringify({ isBlocked, reason }),
    });
  },

  async changeRole(id, newRole) {
    return apiRequest(`/admin/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role: newRole }),
    });
  },
};
