import { apiRequest } from './apiClient';

export const fashnService = {
  async getConfig() {
    const [config, credits] = await Promise.all([
      apiRequest('/admin/system-config', { method: 'GET' }),
      apiRequest('/admin/try-on/credits', { method: 'GET' }),
    ]);
    if (!config.success) return config;

    const flags = config.data.featureFlags || {};
    return {
      success: true,
      data: {
        modelName: config.data.tryOnModel,
        tryOnEnabled: flags.tryOnEnabled,
        tryOnDailyLimitPerUser: config.data.tryOnDailyLimitPerUser,
        creditsTotal: credits.data?.credits ?? null,
        creditsUsed: 0,
        creditsRemaining: credits.data?.credits ?? null,
        lowCredits: Boolean(credits.data?.lowCredits),
        status: credits.data?.unavailable
          ? 'unknown'
          : credits.data?.lowCredits
            ? 'low'
            : 'operational',
        apiKeyMasked: 'Stored on the server',
      },
    };
  },

  async updateConfig(data) {
    return apiRequest('/admin/system-config', {
      method: 'PUT',
      body: JSON.stringify({
        tryOnModel: data.modelName || data.tryOnModel,
        tryOnEnabled: data.tryOnEnabled,
        tryOnDailyLimitPerUser: data.tryOnDailyLimitPerUser,
      }),
    });
  },

  async getGenerationLogs(params = {}) {
    const response = await apiRequest('/admin/try-on/jobs', {
      method: 'GET',
      query: {
        status: params.status,
        search: params.search,
        page: params.page,
        limit: params.limit,
      },
    });
    if (!response.success) return response;

    const data = response.data || {};
    const byStatus = data.stats?.byStatus || {};
    const totalRuns = Object.values(byStatus).reduce(
      (sum, count) => sum + Number(count || 0),
      0,
    );
    const completed = Number(byStatus.completed || 0);
    const failed = Number(byStatus.failed || 0);

    return {
      success: true,
      data: {
        ...data,
        items: (data.items || []).map((job) => ({
          id: job.id,
          customerName: job.customerName || '-',
          customerId: job.userId || '',
          sareeId: job.sareeId,
          sareeTitle: job.sareeTitle,
          status: job.status,
          errorMessage: job.errorMessage || '',
          createdAt: job.createdAt,
          latencySeconds: job.durationMs ? (job.durationMs / 1000).toFixed(1) : '-',
          modelImage: job.modelImage || null,
          outputImage: job.outputImage || null,
        })),
        stats: {
          totalRuns,
          completed,
          failed,
          successRate: totalRuns ? `${Math.round((completed / totalRuns) * 100)}%` : '-',
          avgLatency: '-',
          creditsUsedToday: data.stats?.creditsUsedToday,
          failureRate: data.stats?.failureRate,
        },
      },
    };
  },

  async runTestTryOn(payload) {
    return apiRequest('/admin/try-on/jobs', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
