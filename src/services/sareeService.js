import { apiRequest, db, recordAuditLog } from './apiClient';

export const sareeService = {
  /**
   * Get Sarees (Paginated, Searchable, Filterable, Sortable)
   * API: GET /admin/sarees
   */
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
    }, async () => {
      const {
        search = '',
        category = 'all',
        stockFilter = 'all',
        status = 'all',
        sortBy = 'newest',
        page = 1,
        limit = 8,
      } = params;

      let list = [...db.sarees];

      // Search
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        list = list.filter(
          (s) =>
            s.title?.toLowerCase().includes(q) ||
            s.brand?.toLowerCase().includes(q) ||
            s.weave?.toLowerCase().includes(q) ||
            s.origin?.toLowerCase().includes(q) ||
            s.zari?.toLowerCase().includes(q)
        );
      }

      // Category filter
      if (category && category !== 'all') {
        list = list.filter((s) => s.category === category);
      }

      // Stock status filter
      if (stockFilter === 'in_stock') {
        list = list.filter((s) => s.stockQuantity > 2);
      } else if (stockFilter === 'low_stock') {
        list = list.filter((s) => s.stockQuantity > 0 && s.stockQuantity <= 2);
      } else if (stockFilter === 'out_of_stock') {
        list = list.filter((s) => s.stockQuantity === 0);
      }

      // Active / Inactive filter
      if (status === 'active') {
        list = list.filter((s) => s.isActive);
      } else if (status === 'inactive') {
        list = list.filter((s) => !s.isActive);
      }

      // Sorting
      if (sortBy === 'price_asc') {
        list.sort((a, b) => (a.numericPrice || 0) - (b.numericPrice || 0));
      } else if (sortBy === 'price_desc') {
        list.sort((a, b) => (b.numericPrice || 0) - (a.numericPrice || 0));
      } else if (sortBy === 'title_asc') {
        list.sort((a, b) => a.title.localeCompare(b.title));
      } else {
        // newest
        list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      }

      const total = list.length;
      const startIndex = (page - 1) * limit;
      const paginatedItems = list.slice(startIndex, startIndex + limit);

      return {
        items: paginatedItems,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      };
    });
  },

  /**
   * Get Saree by ID
   * API: GET /admin/sarees/:id
   */
  async getSareeById(id) {
    return apiRequest(`/admin/sarees/${id}`, { method: 'GET' }, async () => {
      const found = db.sarees.find((s) => s.id === id);
      if (!found) throw new Error(`Saree ${id} not found`);
      return found;
    });
  },

  /**
   * Create Saree
   * API: POST /admin/sarees
   */
  async createSaree(data) {
    return apiRequest(
      '/admin/sarees',
      { method: 'POST', body: JSON.stringify(data) },
      async () => {
        const id = `saree-${Date.now()}`;
        const newSaree = {
          ...data,
          id,
          createdAt: new Date().toISOString(),
          numericPrice: Number(data.numericPrice) || 0,
          numericMrp: Number(data.numericMrp) || Number(data.numericPrice) || 0,
          price: `₹${(Number(data.numericPrice) || 0).toLocaleString('en-IN')}`,
          mrp: `₹${(Number(data.numericMrp) || Number(data.numericPrice) || 0).toLocaleString('en-IN')}`,
          stockQuantity: Number(data.stockQuantity) || 1,
          images: data.images && data.images.length > 0 ? data.images : [data.image],
        };

        db.sarees.unshift(newSaree);
        recordAuditLog('CREATE_SAREE', id, `Created luxury drape: ${newSaree.title}`);
        return newSaree;
      }
    );
  },

  /**
   * Update Saree
   * API: PUT /admin/sarees/:id
   */
  async updateSaree(id, data) {
    return apiRequest(
      `/admin/sarees/${id}`,
      { method: 'PUT', body: JSON.stringify(data) },
      async () => {
        const idx = db.sarees.findIndex((s) => s.id === id);
        if (idx === -1) throw new Error(`Saree ${id} not found`);

        const images = Array.isArray(data.images)
          ? data.images.map((item) => (typeof item === 'string' ? item : item?.url)).filter(Boolean)
          : db.sarees[idx].images;

        const updated = {
          ...db.sarees[idx],
          ...data,
          numericPrice: Number(data.numericPrice) || db.sarees[idx].numericPrice,
          numericMrp: Number(data.numericMrp) || db.sarees[idx].numericMrp,
          price: `₹${(Number(data.numericPrice) || db.sarees[idx].numericPrice).toLocaleString('en-IN')}`,
          mrp: `₹${(Number(data.numericMrp) || db.sarees[idx].numericMrp).toLocaleString('en-IN')}`,
          stockQuantity: data.stockQuantity !== undefined ? Number(data.stockQuantity) : db.sarees[idx].stockQuantity,
          images,
          image: images[0] || data.image || db.sarees[idx].image,
          tryOnImage: data.tryOnImage || images[0] || db.sarees[idx].tryOnImage,
          updatedAt: new Date().toISOString(),
        };

        db.sarees[idx] = updated;
        recordAuditLog('UPDATE_SAREE', id, `Updated drape specs & pricing for ${updated.title}`);
        return updated;
      }
    );
  },

  /**
   * Append image URLs to a saree gallery
   * API: POST /admin/sarees/:id/images/urls
   */
  async addImageUrls(id, urls) {
    return apiRequest(
      `/admin/sarees/${id}/images/urls`,
      { method: 'POST', body: JSON.stringify({ urls }) },
      async () => {
        const idx = db.sarees.findIndex((s) => s.id === id);
        if (idx === -1) throw new Error(`Saree ${id} not found`);
        const nextImages = [...(db.sarees[idx].images || []), ...urls.filter(Boolean)];
        db.sarees[idx] = {
          ...db.sarees[idx],
          images: nextImages,
          image: nextImages[0] || db.sarees[idx].image,
          updatedAt: new Date().toISOString(),
        };
        recordAuditLog('ADD_SAREE_IMAGE_URLS', id, `Added ${urls.length} image URL(s)`);
        return db.sarees[idx];
      },
    );
  },

  /**
   * Delete one gallery image by id
   * API: DELETE /admin/sarees/:id/images/:imageId
   */
  async deleteImage(id, imageId) {
    return apiRequest(`/admin/sarees/${id}/images/${imageId}`, { method: 'DELETE' }, async () => {
      const idx = db.sarees.findIndex((s) => s.id === id);
      if (idx === -1) throw new Error(`Saree ${id} not found`);
      const images = (db.sarees[idx].images || []).filter((img) => {
        if (typeof img === 'string') return img !== imageId;
        return String(img.id) !== String(imageId) && img.url !== imageId;
      });
      db.sarees[idx] = {
        ...db.sarees[idx],
        images,
        image: typeof images[0] === 'string' ? images[0] : images[0]?.url || '',
        updatedAt: new Date().toISOString(),
      };
      recordAuditLog('DELETE_SAREE_IMAGE', id, `Removed image ${imageId}`);
      return db.sarees[idx];
    });
  },

  /**
   * Duplicate Saree
   * API: POST /admin/sarees/:id/duplicate
   */
  async duplicateSaree(id) {
    return apiRequest(`/admin/sarees/${id}/duplicate`, { method: 'POST' }, async () => {
      const source = db.sarees.find((s) => s.id === id);
      if (!source) throw new Error(`Saree ${id} not found`);

      const newId = `saree-${Date.now()}`;
      const clone = {
        ...source,
        id: newId,
        title: `${source.title} (Copy)`,
        slug: `${source.slug}-copy-${Math.floor(Math.random() * 1000)}`,
        isFeatured: false,
        createdAt: new Date().toISOString(),
      };

      db.sarees.unshift(clone);
      recordAuditLog('DUPLICATE_SAREE', newId, `Cloned saree from ${source.title}`);
      return clone;
    });
  },

  /**
   * Delete Saree
   * API: DELETE /admin/sarees/:id
   */
  async deleteSaree(id) {
    return apiRequest(`/admin/sarees/${id}`, { method: 'DELETE' }, async () => {
      const target = db.sarees.find((s) => s.id === id);
      db.sarees = db.sarees.filter((s) => s.id !== id);
      recordAuditLog('DELETE_SAREE', id, `Deleted saree listing: ${target?.title || id}`);
      return { success: true, id };
    });
  },

  /**
   * Bulk Actions on Sarees
   * API: POST /admin/sarees/bulk
   */
  async bulkAction(ids, action) {
    return apiRequest(
      '/admin/sarees/bulk',
      { method: 'POST', body: JSON.stringify({ ids, action }) },
      async () => {
        db.sarees = db.sarees.map((s) => {
          if (!ids.includes(s.id)) return s;
          if (action === 'activate') return { ...s, isActive: true };
          if (action === 'deactivate') return { ...s, isActive: false };
          if (action === 'feature') return { ...s, isFeatured: true };
          if (action === 'unfeature') return { ...s, isFeatured: false };
          return s;
        });

        if (action === 'delete') {
          db.sarees = db.sarees.filter((s) => !ids.includes(s.id));
        }

        recordAuditLog('BULK_ACTION', 'sarees', `Performed ${action} on ${ids.length} sarees`);
        return { success: true, count: ids.length, action };
      }
    );
  },
};

