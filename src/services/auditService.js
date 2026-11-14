import { apiRequest } from './apiClient';

export const auditService = {
  /**
   * Get Immutable Audit Logs
   * API: GET /admin/audit-logs
   */
  async getAuditLogs(params = {}) {
    return apiRequest('/admin/audit-logs', {
      method: 'GET',
      query: { search: params.search, action: params.action, page: params.page, limit: params.limit },
    });
  },
};

