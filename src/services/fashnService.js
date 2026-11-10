/**
 * FASHN.ai Virtual Try-On Integration Service
 * 
 * Based on official FASHN.ai API documentation (docs.fashn.ai):
 * - Endpoint: https://api.fashn.ai/v1/run
 * - Models: 'tryon-max' (optimized for complex Indian drapes, pleats & zari) & 'tryon-v1.6'
 * - Automated end-to-end drape physics; no manual human moderation required.
 */

import { apiRequest, recordAuditLog, USE_MOCK } from './apiClient';

const INITIAL_FASHN_CONFIG = {
  apiKeyMasked: 'fn_live_9a7d••••••••••••3f81',
  modelName: 'tryon-max',
  mode: 'quality', // 'performance' | 'balanced' | 'quality'
  category: 'one-pieces', // Sarees mapped to one-pieces
  nsfwFilter: true,
  autoBackgroundCleanup: true,
  creditsTotal: 2500,
  creditsUsed: 1080,
  apiEndpoint: 'https://api.fashn.ai/v1/run',
  status: 'operational',
  lastPing: '2026-11-09T18:15:00Z',
};

const INITIAL_GENERATION_LOGS = [
  {
    id: 'fashn-run-8421',
    customerName: 'Samyuktha Rao',
    customerId: 'usr-1',
    sareeId: 'saree-1',
    sareeTitle: 'Swarna Kanchipuram Pure Zari Silk',
    productImage: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=900&auto=format&fit=crop&q=80',
    modelImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&auto=format&fit=crop&q=80',
    outputImage: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=900&auto=format&fit=crop&q=80',
    modelName: 'tryon-max',
    status: 'completed',
    latencySeconds: 4.2,
    creditsCost: 1,
    createdAt: '2026-11-09T17:42:00Z',
  },
  {
    id: 'fashn-run-8419',
    customerName: 'Ananya Deshmukh',
    customerId: 'usr-2',
    sareeId: 'saree-2',
    sareeTitle: 'Emerald Brocade Royal Zari Drape',
    productImage: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=900&auto=format&fit=crop&q=80',
    modelImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&auto=format&fit=crop&q=80',
    outputImage: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=900&auto=format&fit=crop&q=80',
    modelName: 'tryon-max',
    status: 'completed',
    latencySeconds: 3.8,
    creditsCost: 1,
    createdAt: '2026-11-09T16:10:00Z',
  },
  {
    id: 'fashn-run-8414',
    customerName: 'Venkata Krishna Reddy',
    customerId: 'usr-3',
    sareeId: 'saree-8',
    sareeTitle: 'Sindhuri Scarlet Bridal Trousseau',
    productImage: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=900&auto=format&fit=crop&q=80',
    modelImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
    outputImage: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=900&auto=format&fit=crop&q=80',
    modelName: 'tryon-max',
    status: 'completed',
    latencySeconds: 4.6,
    creditsCost: 1,
    createdAt: '2026-11-09T14:35:00Z',
  },
  {
    id: 'fashn-run-8408',
    customerName: 'Radha Sundaram',
    customerId: 'usr-5',
    sareeId: 'saree-5',
    sareeTitle: 'Royal Bridal Gold Tissue Drape',
    productImage: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=900&auto=format&fit=crop&q=80',
    modelImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
    outputImage: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=900&auto=format&fit=crop&q=80',
    modelName: 'tryon-max',
    status: 'completed',
    latencySeconds: 5.1,
    creditsCost: 1,
    createdAt: '2026-11-09T11:20:00Z',
  },
  {
    id: 'fashn-run-8395',
    customerName: 'Kavita Menon',
    customerId: 'usr-6',
    sareeId: 'saree-6',
    sareeTitle: 'Peacock Blue Paithani Silk Saree',
    productImage: 'https://images.unsplash.com/photo-1610030469668-9655ecdd3f42?w=900&auto=format&fit=crop&q=80',
    modelImage: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&auto=format&fit=crop&q=80',
    outputImage: null,
    modelName: 'tryon-max',
    status: 'failed',
    errorMessage: 'Low lighting in user silhouette portrait. Guided user to re-capture.',
    latencySeconds: 2.1,
    creditsCost: 0,
    createdAt: '2026-11-08T18:05:00Z',
  },
];

let liveFashnConfig = { ...INITIAL_FASHN_CONFIG };
let liveGenerationLogs = [...INITIAL_GENERATION_LOGS];

export const fashnService = {
  /**
   * Get FASHN.ai Configuration & Quota Status
   */
  async getConfig() {
    if (!USE_MOCK) {
      const [config, credits] = await Promise.all([
        apiRequest('/admin/system-config', { method: 'GET' }, async () => ({})),
        apiRequest('/admin/try-on/credits', { method: 'GET' }, async () => ({})),
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
          status: credits.data?.unavailable ? 'unknown' : credits.data?.lowCredits ? 'low' : 'operational',
          apiKeyMasked: 'Stored on the server',
        },
      };
    }
    return apiRequest('/admin/system-config', { method: 'GET' }, async () => liveFashnConfig);
  },

  /**
   * Update FASHN.ai API Parameters
   */
  async updateConfig(data) {
    return apiRequest('/admin/system-config', { method: 'PUT', body: JSON.stringify({
      tryOnModel: data.modelName || data.tryOnModel,
      tryOnEnabled: data.tryOnEnabled,
      tryOnDailyLimitPerUser: data.tryOnDailyLimitPerUser,
    }) }, async () => {
      liveFashnConfig = { ...liveFashnConfig, ...data };
      recordAuditLog('UPDATE_FASHN_CONFIG', 'fashn-ai', `Updated FASHN.ai configuration: model=${data.modelName || liveFashnConfig.modelName}`);
      return liveFashnConfig;
    });
  },

  /**
   * Get Telemetry & Generation Run Logs
   */
  async getGenerationLogs(params = {}) {
    const response = await apiRequest('/admin/try-on/jobs', {
      method: 'GET',
      query: { status: params.status, page: params.page, limit: params.limit },
    }, async () => {
      const { status = 'all', search = '', page = 1, limit = 10 } = params;

      let list = [...liveGenerationLogs];

      if (status && status !== 'all') {
        list = list.filter((l) => l.status === status);
      }

      if (search.trim()) {
        const q = search.toLowerCase().trim();
        list = list.filter(
          (l) =>
            l.customerName.toLowerCase().includes(q) ||
            l.sareeTitle.toLowerCase().includes(q) ||
            l.id.toLowerCase().includes(q)
        );
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
        stats: {
          totalRuns: liveGenerationLogs.length,
          completed: liveGenerationLogs.filter((l) => l.status === 'completed').length,
          failed: liveGenerationLogs.filter((l) => l.status === 'failed').length,
          successRate: '96.8%',
          avgLatency: '4.4s',
        },
      };
    });
    if (USE_MOCK || !response.success) return response;
    const data = response.data || {};
    const byStatus = data.stats?.byStatus || {};
    const totalRuns = Object.values(byStatus).reduce((sum, count) => sum + Number(count || 0), 0);
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
          modelImage: null,
          outputImage: null,
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

  /**
   * Trigger Test Drape Run via FASHN.ai (Admin Playground Sandbox)
   */
  async runTestTryOn(payload) {
    if (!USE_MOCK) {
      return {
        success: false,
        error: { message: 'Test runs stay off so this panel does not spend FASHN credits. Customers generate drapes in the app.' },
      };
    }
    return apiRequest('/admin/try-on/jobs', { method: 'GET' }, async () => {
      const newRun = {
        id: `fashn-run-${Date.now().toString().slice(-4)}`,
        customerName: 'Atelier Stylist (Sandbox)',
        customerId: 'admin-sandbox',
        sareeId: payload.sareeId,
        sareeTitle: payload.sareeTitle,
        productImage: payload.productImage,
        modelImage: payload.modelImage,
        outputImage: payload.productImage, // In mock, outputs high-res drape render
        modelName: liveFashnConfig.modelName,
        status: 'completed',
        latencySeconds: 3.9,
        creditsCost: 1,
        createdAt: new Date().toISOString(),
      };

      liveGenerationLogs.unshift(newRun);
      liveFashnConfig.creditsUsed += 1;
      recordAuditLog('FASHN_TEST_RUN', newRun.id, `Simulated FASHN.ai drape run for ${payload.sareeTitle}`);
      return newRun;
    });
  },
};

