import { apiRequest, db, recordAuditLog } from './apiClient';

export const systemService = {
  /**
   * Get System Configuration & Feature Flags
   * API: GET /admin/system-config
   */
  async getConfig() {
    return apiRequest('/admin/system-config', { method: 'GET' }, async () => {
      return db.systemConfig;
    });
  },

  /**
   * Update System Configuration & Feature Flags
   * API: PUT /admin/system-config
   */
  async updateConfig(data) {
    return apiRequest(
      '/admin/system-config',
      { method: 'PUT', body: JSON.stringify(data) },
      async () => {
        db.systemConfig = {
          ...db.systemConfig,
          ...data,
          featureFlags: {
            ...db.systemConfig.featureFlags,
            ...(data.featureFlags || {}),
          },
          updatedAt: new Date().toISOString(),
        };

        recordAuditLog(
          'UPDATE_SYSTEM_CONFIG',
          'system',
          `Modified app config: minVersion=${db.systemConfig.minAppVersion}, forceUpdate=${db.systemConfig.forceUpdate}`
        );
        return db.systemConfig;
      }
    );
  },
};

