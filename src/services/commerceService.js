import { apiRequest } from './apiClient';

export const commerceService = {
  orders(params = {}) {
    return apiRequest('/admin/orders', { method: 'GET', query: params });
  },
  order(id) {
    return apiRequest(`/admin/orders/${id}`, { method: 'GET' });
  },
  setStatus(id, status) {
    return apiRequest(`/admin/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
  coupons() {
    return apiRequest('/admin/coupons', { method: 'GET' });
  },
  saveCoupon(body, id) {
    return apiRequest(id ? `/admin/coupons/${id}` : '/admin/coupons', {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(body),
    });
  },
  setCouponActive(id, isActive) {
    return apiRequest(`/admin/coupons/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    });
  },
  referralSettings() {
    return apiRequest('/admin/referrals/settings', { method: 'GET' });
  },
  saveReferralSettings(body) {
    return apiRequest('/admin/referrals/settings', {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },
  referrals(params = {}) {
    return apiRequest('/admin/referrals', { method: 'GET', query: params });
  },
};
