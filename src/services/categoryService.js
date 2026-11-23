import { apiRequest } from './apiClient';

export const categoryService = {
  /**
   * Get All Categories
   * API: GET /admin/categories
   */
  async getCategories() {
    return apiRequest('/admin/categories', { method: 'GET' });
  },

  /**
   * Create Category
   * API: POST /admin/categories
   */
  async createCategory(data) {
    return apiRequest('/admin/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update Category
   * API: PUT /admin/categories/:id
   */
  async updateCategory(id, data) {
    return apiRequest(`/admin/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete Category
   * API: DELETE /admin/categories/:id
   */
  async deleteCategory(id, options = {}) {
    const reassignTo = typeof options === 'string' ? options : options.reassignTo;
    const removeSarees = typeof options === 'object' && options.removeSarees === true;
    return apiRequest(`/admin/categories/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      query: {
        reassignTo: removeSarees ? undefined : reassignTo,
        removeSarees: removeSarees ? 'true' : undefined,
      },
      body: JSON.stringify({
        reassignTo: removeSarees ? '' : (reassignTo || ''),
        removeSarees,
      }),
    });
  },

  /**
   * Reorder Categories
   * API: PUT /admin/categories/reorder
   */
  async reorderCategories(orderedIds) {
    return apiRequest('/admin/categories/reorder', {
      method: 'PUT',
      body: JSON.stringify({ order: orderedIds }),
    });
  },
};

