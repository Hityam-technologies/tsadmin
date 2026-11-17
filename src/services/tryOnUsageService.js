import { apiRequest, tokenStore } from './apiClient';

const empty = {
  items: [],
  total: 0,
  page: 1,
  limit: 20,
  totalPages: 1,
  totals: {
    users: 0,
    tryOnsCompleted: 0,
    tryOnsFailed: 0,
    cacheHits: 0,
    fashnCreditsUsed: 0,
    fashnCostInr: null,
    freeQuotaCostInr: null,
    revenueInr: 0,
    netMarginInr: null,
  },
  settings: {
    rupeesPerCredit: null,
    asOf: null,
    rateConfigured: false,
    freeTryOnQuota: 3,
    paidTryOnPriceInr: 20,
    chargeEnforced: false,
  },
  groups: [],
};

export const tryOnUsageService = {
  list(params) {
    return apiRequest('/admin/try-on/users', { method: 'GET', query: params }, async () => empty);
  },
  detail(userId, photos = false) {
    return apiRequest(`/admin/try-on/users/${userId}`, {
      method: 'GET',
      query: { photos: photos ? 'true' : 'false' },
    }, async () => null);
  },
  settings() {
    return apiRequest('/admin/try-on/settings', { method: 'GET' }, async () => empty.settings);
  },
  saveSettings(body) {
    return apiRequest('/admin/try-on/settings', { method: 'PUT', body: JSON.stringify(body) }, async () => ({
      ...empty.settings,
      ...body,
      rateConfigured: body.rupeesPerCredit != null,
    }));
  },
  async exportCsv(params) {
    const query = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value) query.set(key, String(value));
    });
    const response = await fetch(`/api/v1/admin/try-on/users/export?${query.toString()}`, {
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        ...(tokenStore.getToken() ? { Authorization: `Bearer ${tokenStore.getToken()}` } : {}),
      },
      credentials: 'include',
    });
    if (!response.ok) throw new Error('The usage file could not be downloaded.');
    return response.blob();
  },
};
