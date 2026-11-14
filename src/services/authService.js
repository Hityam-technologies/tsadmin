import {
  apiRequest,
  tokenStore,
  rememberAdmin,
  closeAdminSession,
  openAdminSession,
} from './apiClient';

export const authService = {
  /**
   * Admin Login
   * API: POST /api/v1/admin/auth/login
   */
  async login(email, password) {
    const result = await apiRequest('/api/v1/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (result.success && result.data?.token) {
      openAdminSession();
      tokenStore.setToken(result.data.token);
      rememberAdmin(result.data.user);
    }
    return result;
  },

  /**
   * Forgot Password
   * API: POST /api/v1/admin/auth/forgot-password
   */
  async forgotPassword(email) {
    return apiRequest('/api/v1/admin/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async changePassword(currentPassword, newPassword) {
    return apiRequest('/api/v1/admin/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  /**
   * Logout
   */
  async logout() {
    try {
      await apiRequest('/api/v1/admin/auth/logout', { method: 'POST' });
    } finally {
      closeAdminSession();
    }
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

