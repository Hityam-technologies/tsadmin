import { apiRequest, db, recordAuditLog } from './apiClient';

export const categoryService = {
  /**
   * Get All Categories
   * API: GET /admin/categories
   */
  async getCategories() {
    return apiRequest('/admin/categories', { method: 'GET' }, async () => {
      return [...db.categories].sort((a, b) => (a.order || 0) - (b.order || 0));
    });
  },

  /**
   * Create Category
   * API: POST /admin/categories
   */
  async createCategory(data) {
    return apiRequest(
      '/admin/categories',
      { method: 'POST', body: JSON.stringify(data) },
      async () => {
        const id = data.slug || `cat-${Date.now()}`;
        const newCat = {
          ...data,
          id,
          itemCount: 0,
          order: db.categories.length + 1,
          isActive: data.isActive !== undefined ? data.isActive : true,
        };
        db.categories.push(newCat);
        recordAuditLog('CREATE_CATEGORY', id, `Created category story: ${newCat.label}`);
        return newCat;
      }
    );
  },

  /**
   * Update Category
   * API: PUT /admin/categories/:id
   */
  async updateCategory(id, data) {
    return apiRequest(
      `/admin/categories/${id}`,
      { method: 'PUT', body: JSON.stringify(data) },
      async () => {
        const idx = db.categories.findIndex((c) => c.id === id);
        if (idx === -1) throw new Error(`Category ${id} not found`);

        db.categories[idx] = { ...db.categories[idx], ...data };
        recordAuditLog('UPDATE_CATEGORY', id, `Updated category ${db.categories[idx].label}`);
        return db.categories[idx];
      }
    );
  },

  /**
   * Delete Category
   * API: DELETE /admin/categories/:id
   */
  async deleteCategory(id) {
    return apiRequest(`/admin/categories/${id}`, { method: 'DELETE' }, async () => {
      const cat = db.categories.find((c) => c.id === id);
      db.categories = db.categories.filter((c) => c.id !== id);
      recordAuditLog('DELETE_CATEGORY', id, `Deleted category ${cat?.label || id}`);
      return { success: true, id };
    });
  },

  /**
   * Reorder Categories
   * API: PUT /admin/categories/reorder
   */
  async reorderCategories(orderedIds) {
    return apiRequest(
      '/admin/categories/reorder',
      { method: 'PUT', body: JSON.stringify({ order: orderedIds }) },
      async () => {
        db.categories.forEach((cat) => {
          const newOrder = orderedIds.indexOf(cat.id);
          if (newOrder !== -1) {
            cat.order = newOrder + 1;
          }
        });
        db.categories.sort((a, b) => a.order - b.order);
        recordAuditLog('REORDER_CATEGORIES', 'categories', 'Reordered category story bar');
        return db.categories;
      }
    );
  },
};

