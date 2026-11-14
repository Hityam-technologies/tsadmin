import { apiRequest } from './apiClient';

export const contentService = {
  // --- 1. HERO VIDEO ---
  async getHeroVideo() {
    return apiRequest('/admin/content/hero', { method: 'GET' });
  },

  async updateHeroVideo(data) {
    return apiRequest('/admin/content/hero', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // --- 2. Store Address ---
  async getStoreAddress() {
    return apiRequest('/admin/content/store', { method: 'GET' });
  },

  async updateStoreAddress(data) {
    return apiRequest('/admin/content/store', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // --- 3. SUPPORT CHANNELS ---
  async getSupportChannels() {
    return apiRequest('/admin/content/support', { method: 'GET' });
  },

  async updateSupportChannels(channels) {
    return apiRequest('/admin/content/support', {
      method: 'PUT',
      body: JSON.stringify({ channels }),
    });
  },

  // --- 4. FAQS ---
  async getFaqs() {
    return apiRequest('/admin/content/faq', { method: 'GET' });
  },

  async createFaq(data) {
    return apiRequest('/admin/content/faq', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateFaq(id, data) {
    return apiRequest(`/admin/content/faq/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteFaq(id) {
    return apiRequest(`/admin/content/faq/${id}`, { method: 'DELETE' });
  },

  async reorderFaqs(orderedIds) {
    return apiRequest('/admin/content/faq/reorder', {
      method: 'PUT',
      body: JSON.stringify({ order: orderedIds }),
    });
  },

  // --- 5. LEGAL POLICIES (Terms of Service & Privacy Policy) ---
  async getLegal(type) {
    return apiRequest(`/admin/content/legal/${type}`, { method: 'GET' });
  },

  async updateLegal(type, sections) {
    const title = type === 'terms' ? 'Terms & Conditions' : 'Privacy & Data Protection';
    return apiRequest(`/admin/content/legal/${type}`, {
      method: 'PUT',
      body: JSON.stringify({ title, sections }),
    });
  },
};

