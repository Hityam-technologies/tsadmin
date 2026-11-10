import { apiRequest, db, recordAuditLog } from './apiClient';

export const lookService = {
  /**
   * Get Looks (Filtered by moderation status)
   * API: GET /admin/looks
   */
  async getLooks(params = {}) {
    return apiRequest('/admin/looks', {
      method: 'GET',
      query: { page: params.page, limit: params.limit },
    }, async () => {
      const { status = 'all', page = 1, limit = 12 } = params;

      let list = [...db.looks];

      if (status && status !== 'all') {
        list = list.filter((l) => l.moderationStatus === status);
      }

      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

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

  /**
   * Moderate Look (Approve, Flag, Remove)
   * API: PUT /admin/looks/:id/moderation
   */
  async moderateLook(id, action, reason = '') {
    return apiRequest(
      `/admin/looks/${id}/moderation`,
      { method: 'PUT', body: JSON.stringify({ action, reason }) },
      async () => {
        const look = db.looks.find((l) => l.id === id);
        if (!look) throw new Error(`Look ${id} not found`);

        if (action === 'approve') {
          look.moderationStatus = 'approved';
          look.flagReason = undefined;
        } else if (action === 'flag') {
          look.moderationStatus = 'flagged';
          look.flagReason = reason || 'Flagged for styling/content review';
        } else if (action === 'remove') {
          look.moderationStatus = 'removed';
          look.flagReason = reason || 'Removed by moderator';
        }

        recordAuditLog('MODERATE_LOOK', id, `Marked virtual look ${id} as ${look.moderationStatus}`);
        return look;
      }
    );
  },
};

