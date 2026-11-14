import { apiRequest } from './apiClient';

export const sareeService = {
  async getSarees(params = {}) {
    return apiRequest('/admin/sarees', {
      method: 'GET',
      query: {
        search: params.search,
        category: params.category,
        stock: params.stockFilter || params.stock,
        status: params.status,
        sortBy: params.sortBy,
        page: params.page,
        limit: params.limit,
      },
    });
  },

  async getSareeById(id) {
    return apiRequest(`/admin/sarees/${id}`, { method: 'GET' });
  },

  async createSaree(data) {
    return apiRequest('/admin/sarees', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateSaree(id, data) {
    return apiRequest(`/admin/sarees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async addImageUrls(id, urls) {
    return apiRequest(`/admin/sarees/${id}/images/urls`, {
      method: 'POST',
      body: JSON.stringify({ urls }),
    });
  },

  async deleteImage(id, imageId) {
    return apiRequest(`/admin/sarees/${id}/images/${imageId}`, { method: 'DELETE' });
  },

  async duplicateSaree(id) {
    return apiRequest(`/admin/sarees/${id}/duplicate`, { method: 'POST' });
  },

  async deleteSaree(id) {
    return apiRequest(`/admin/sarees/${id}`, { method: 'DELETE' });
  },

  async bulkAction(ids, action) {
    return apiRequest('/admin/sarees/bulk', {
      method: 'POST',
      body: JSON.stringify({ ids, action }),
    });
  },
};
