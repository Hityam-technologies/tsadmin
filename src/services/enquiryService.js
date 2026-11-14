import { apiRequest } from './apiClient';

export const enquiryService = {
  async getEnquiries(params = {}) {
    return apiRequest('/admin/enquiries', {
      method: 'GET',
      query: {
        status: params.status,
        search: params.search,
        page: params.page,
        limit: params.limit,
      },
    });
  },

  async getEnquiryById(id) {
    return apiRequest(`/admin/enquiries/${id}`, { method: 'GET' });
  },

  async updateStatus(id, newStatus) {
    return apiRequest(`/admin/enquiries/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus }),
    });
  },

  async addNote(id, text, _authorName = 'Staff Stylist') {
    return apiRequest(`/admin/enquiries/${id}/notes`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  },

  async exportCsv() {
    return apiRequest('/admin/enquiries/export', { method: 'GET' });
  },
};
