import { apiRequest, db } from './apiClient';

export const auditService = {
  /**
   * Get Immutable Audit Logs
   * API: GET /admin/audit-logs
   */
  async getAuditLogs(params = {}) {
    return apiRequest('/admin/audit-logs', {
      method: 'GET',
      query: { search: params.search, action: params.action, page: params.page, limit: params.limit },
    }, async () => {
      const { search = '', action = 'all', page = 1, limit = 15 } = params;

      let list = [...db.auditLogs];

      if (search.trim()) {
        const q = search.toLowerCase().trim();
        list = list.filter(
          (l) =>
            l.actorName.toLowerCase().includes(q) ||
            l.description.toLowerCase().includes(q) ||
            l.resource.toLowerCase().includes(q) ||
            l.action.toLowerCase().includes(q)
        );
      }

      if (action && action !== 'all') {
        list = list.filter((l) => l.action === action);
      }

      list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      const total = list.length;
      const startIndex = (page - 1) * limit;
      const paginated = list.slice(startIndex, startIndex + limit);

      return {
        items: paginated,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      };
    });
  },
};

