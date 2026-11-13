import { apiRequest, db, recordAuditLog } from './apiClient';

export const contentService = {
  // --- 1. HERO VIDEO ---
  async getHeroVideo() {
    return apiRequest('/admin/content/hero', { method: 'GET' }, async () => {
      return db.heroVideo;
    });
  },

  async updateHeroVideo(data) {
    return apiRequest(
      '/admin/content/hero',
      { method: 'PUT', body: JSON.stringify(data) },
      async () => {
        db.heroVideo = { ...db.heroVideo, ...data, updatedAt: new Date().toISOString() };
        recordAuditLog('UPDATE_HERO_VIDEO', 'content', `Updated hero showcase reel: ${db.heroVideo.title}`);
        return db.heroVideo;
      }
    );
  },

  // --- 2. Store Address ---
  async getStoreAddress() {
    return apiRequest('/admin/content/store', { method: 'GET' }, async () => {
      return db.storeDetails;
    });
  },

  async updateStoreAddress(data) {
    return apiRequest(
      '/admin/content/store',
      { method: 'PUT', body: JSON.stringify(data) },
      async () => {
        db.storeDetails = { ...db.storeDetails, ...data };
        recordAuditLog('UPDATE_STORE_ADDRESS', 'content', 'Updated Jubilee Hills boutique store coordinates and hours');
        return db.storeDetails;
      }
    );
  },

  // --- 3. SUPPORT CHANNELS ---
  async getSupportChannels() {
    return apiRequest('/admin/content/support', { method: 'GET' }, async () => {
      return [...db.supportChannels].sort((a, b) => (a.order || 0) - (b.order || 0));
    });
  },

  async updateSupportChannels(channels) {
    return apiRequest(
      '/admin/content/support',
      { method: 'PUT', body: JSON.stringify({ channels }) },
      async () => {
        db.supportChannels = channels;
        recordAuditLog('UPDATE_SUPPORT_CHANNELS', 'content', 'Updated concierge communication channels');
        return db.supportChannels;
      }
    );
  },

  // --- 4. FAQS ---
  async getFaqs() {
    return apiRequest('/admin/content/faq', { method: 'GET' }, async () => {
      return [...db.faqs].sort((a, b) => (a.order || 0) - (b.order || 0));
    });
  },

  async createFaq(data) {
    return apiRequest(
      '/admin/content/faq',
      { method: 'POST', body: JSON.stringify(data) },
      async () => {
        const newFaq = {
          ...data,
          id: `faq-${Date.now()}`,
          order: db.faqs.length + 1,
          isActive: true,
        };
        db.faqs.push(newFaq);
        recordAuditLog('CREATE_FAQ', newFaq.id, `Created FAQ: ${newFaq.question}`);
        return newFaq;
      }
    );
  },

  async updateFaq(id, data) {
    return apiRequest(
      `/admin/content/faq/${id}`,
      { method: 'PUT', body: JSON.stringify(data) },
      async () => {
        const idx = db.faqs.findIndex((f) => f.id === id);
        if (idx === -1) throw new Error(`FAQ ${id} not found`);
        db.faqs[idx] = { ...db.faqs[idx], ...data };
        recordAuditLog('UPDATE_FAQ', id, `Updated FAQ ${id}`);
        return db.faqs[idx];
      }
    );
  },

  async deleteFaq(id) {
    return apiRequest(`/admin/content/faq/${id}`, { method: 'DELETE' }, async () => {
      db.faqs = db.faqs.filter((f) => f.id !== id);
      recordAuditLog('DELETE_FAQ', id, `Deleted FAQ ${id}`);
      return { success: true, id };
    });
  },

  async reorderFaqs(orderedIds) {
    return apiRequest(
      '/admin/content/faq/reorder',
      { method: 'PUT', body: JSON.stringify({ order: orderedIds }) },
      async () => {
        db.faqs.forEach((faq) => {
          const idx = orderedIds.indexOf(faq.id);
          if (idx !== -1) faq.order = idx + 1;
        });
        db.faqs.sort((a, b) => a.order - b.order);
        recordAuditLog('REORDER_FAQS', 'content', 'Reordered FAQ list');
        return db.faqs;
      }
    );
  },

  // --- 5. LEGAL POLICIES (Terms of Service & Privacy Policy) ---
  async getLegal(type) {
    return apiRequest(`/admin/content/legal/${type}`, { method: 'GET' }, async () => {
      if (type === 'terms') return db.legalTerms;
      if (type === 'policy') return db.legalPolicy;
      throw new Error(`Invalid legal type: ${type}`);
    });
  },

  async updateLegal(type, sections) {
    return apiRequest(
      `/admin/content/legal/${type}`,
      { method: 'PUT', body: JSON.stringify({ sections }) },
      async () => {
        if (type === 'terms') db.legalTerms = sections;
        else if (type === 'policy') db.legalPolicy = sections;
        recordAuditLog('UPDATE_LEGAL', type, `Updated legal document: ${type}`);
        return sections;
      }
    );
  },
};

