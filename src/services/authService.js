import { apiRequest, tokenStore, db, recordAuditLog, USE_MOCK } from './apiClient';

export const authService = {
  /**
   * Admin Login
   * API: POST /api/v1/admin/auth/login
   */
  async login(email, password) {
    const result = await apiRequest(
      '/api/v1/admin/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      },
      async () => {
        const found = db.users.find(
          (u) => u.email.toLowerCase() === email.trim().toLowerCase()
        );

        if (!found || found.role === 'customer') {
          // If not in seeded users, allow default admin credentials
          if (email.trim().toLowerCase() === 'admin@tripuraa.in' && password === 'Password@123') {
            const adminUser = {
              id: 'adm-01',
              name: 'Maharani Gayatri',
              email: 'admin@tripuraa.in',
              role: 'admin',
              avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            };
            const token = `ts_jwt_${Date.now()}`;
            tokenStore.setToken(token);
            tokenStore.setUser(adminUser);
            recordAuditLog('LOGIN', 'auth', `Admin logged in as ${adminUser.name}`);
            return { token, user: adminUser };
          }
          throw new Error('Invalid credentials. Sign in with admin@tripuraa.in / Password@123');
        }

        if (found.role !== 'admin') {
          throw new Error('Unauthorized. Only administrative accounts can access this panel.');
        }

        if (found.isBlocked) {
          throw new Error('This administrative account has been suspended.');
        }

        const token = `ts_jwt_${Date.now()}_${found.id}`;
        tokenStore.setToken(token);
        tokenStore.setUser(found);
        recordAuditLog('LOGIN', 'auth', `Admin ${found.name} authenticated successfully`);
        return { token, user: found };
      }
    );
    if (result.success && result.data?.token) {
      tokenStore.setToken(result.data.token);
      tokenStore.setUser(result.data.user);
    }
    return result;
  },

  /**
   * Forgot Password
   * API: POST /api/v1/admin/auth/forgot-password
   */
  async forgotPassword(email) {
    return apiRequest(
      '/api/v1/admin/auth/forgot-password',
      {
        method: 'POST',
        body: JSON.stringify({ email }),
      },
      async () => {
        recordAuditLog('PASSWORD_RESET_REQUEST', 'auth', `Password reset dispatched for ${email}`);
        return { message: `Password reset verification link has been sent to ${email}` };
      }
    );
  },

  async changePassword(currentPassword, newPassword) {
    return apiRequest(
      '/api/v1/admin/auth/change-password',
      {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword }),
      },
      async () => ({ message: 'Password updated in the local preview.' })
    );
  },

  /**
   * Logout
   */
  logout() {
    const user = tokenStore.getUser();
    if (USE_MOCK && user) {
      recordAuditLog('LOGOUT', 'auth', `${user.name} logged out`);
    }
    if (!USE_MOCK && tokenStore.getToken()) {
      apiRequest('/api/v1/admin/auth/logout', { method: 'POST' }, async () => ({})).catch(() => null);
    }
    tokenStore.clear();
    return true;
  },

  /**
   * Get Current In-Memory User
   */
  getCurrentUser() {
    return tokenStore.getUser();
  },

  /**
   * Check if authenticated
   */
  isAuthenticated() {
    return !!tokenStore.getToken() && !!tokenStore.getUser();
  },
};

