import { apiRequest, db, recordAuditLog } from './apiClient';

export const userService = {
  /**
   * Get Users
   * API: GET /admin/users
   */
  async getUsers(params = {}) {
    return apiRequest('/admin/users', {
      method: 'GET',
      query: { search: params.search, status: params.status, page: params.page, limit: params.limit },
    }, async () => {
      const { search = '', role = 'all', status = 'all', page = 1, limit = 10 } = params;

      let list = [...db.users];

      if (search.trim()) {
        const q = search.toLowerCase().trim();
        list = list.filter(
          (u) =>
            u.name.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q) ||
            u.phone.toLowerCase().includes(q)
        );
      }

      if (role && role !== 'all') {
        list = list.filter((u) => u.role === role);
      }

      if (status === 'blocked') {
        list = list.filter((u) => u.isBlocked);
      } else if (status === 'active') {
        list = list.filter((u) => !u.isBlocked);
      }

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
   * Get User by ID (with enriched wishlist, looks, enquiries)
   * API: GET /admin/users/:id
   */
  async getUserById(id) {
    return apiRequest(`/admin/users/${id}`, { method: 'GET' }, async () => {
      const user = db.users.find((u) => u.id === id);
      if (!user) throw new Error(`User ${id} not found`);

      // Enrich wishlist sarees
      const wishlistSarees = db.sarees.filter((s) => (user.wishlist || []).includes(s.id));

      // Enrich saved looks
      const userLooks = db.looks.filter((l) => l.userId === id);

      // Enrich customer enquiries
      const userEnquiries = db.enquiries.filter(
        (e) => e.customerEmail.toLowerCase() === user.email.toLowerCase()
      );

      return {
        ...user,
        wishlistSarees,
        userLooks,
        userEnquiries,
      };
    });
  },

  /**
   * Toggle Block / Unblock User
   * API: PUT /admin/users/:id/block
   */
  async toggleBlockUser(id, isBlocked, reason = '') {
    return apiRequest(
      `/admin/users/${id}/block`,
      { method: 'PUT', body: JSON.stringify({ isBlocked, reason }) },
      async () => {
        const user = db.users.find((u) => u.id === id);
        if (!user) throw new Error(`User ${id} not found`);

        user.isBlocked = isBlocked;
        user.blockReason = isBlocked ? reason : undefined;

        recordAuditLog(
          isBlocked ? 'BLOCK_USER' : 'UNBLOCK_USER',
          id,
          `${isBlocked ? 'Blocked' : 'Unblocked'} account for ${user.name}`
        );
        return user;
      }
    );
  },

  /**
   * Change Role (Super Admin only)
   * API: PUT /admin/users/:id/role
   */
  async changeRole(id, newRole) {
    return apiRequest(
      `/admin/users/${id}/role`,
      { method: 'PUT', body: JSON.stringify({ role: newRole }) },
      async () => {
        const user = db.users.find((u) => u.id === id);
        if (!user) throw new Error(`User ${id} not found`);

        const oldRole = user.role;
        user.role = newRole;

        recordAuditLog(
          'CHANGE_USER_ROLE',
          id,
          `Changed role of ${user.name} from ${oldRole} to ${newRole}`
        );
        return user;
      }
    );
  },
};

