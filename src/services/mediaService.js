import { apiRequest } from './apiClient';

export const mediaService = {
  async uploadSareeImages(files) {
    const body = new FormData();
    Array.from(files || []).forEach((file) => body.append('images', file));
    return apiRequest('/media/upload/saree', { method: 'POST', body });
  },

  async uploadImage(file, folder) {
    const body = new FormData();
    body.append('image', file);
    return apiRequest('/media/upload/image', {
      method: 'POST',
      body,
      query: { folder },
    });
  },

  async uploadHeroVideo(file) {
    const body = new FormData();
    body.append('video', file);
    return apiRequest('/media/upload/hero-video', { method: 'POST', body });
  },
};
