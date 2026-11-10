/**
 * Central API Client & In-Memory Storage Adapter
 *
 * Implements strict memory-only token storage (never localStorage for access token).
 * Seamlessly toggles between local in-memory simulation and real backend HTTP endpoints
 * via VITE_USE_MOCK environment variable.
 */

import {
  INITIAL_SAREES,
  INITIAL_CATEGORIES,
  INITIAL_ENQUIRIES,
  INITIAL_USERS,
  INITIAL_LOOKS,
  INITIAL_HERO_VIDEO,
  INITIAL_STORE_DETAILS,
  INITIAL_SUPPORT_CHANNELS,
  INITIAL_FAQS,
  INITIAL_LEGAL_TERMS,
  INITIAL_LEGAL_POLICY,
  INITIAL_SYSTEM_CONFIG,
  INITIAL_AUDIT_LOGS,
} from './mockData';

export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');

// In-Memory Security Token (Never persisted to localStorage or sessionStorage)
let inMemoryAccessToken = null;
let inMemoryCurrentUser = null;

export const tokenStore = {
  getToken: () => inMemoryAccessToken,
  setToken: (token) => {
    inMemoryAccessToken = token;
  },
  getUser: () => inMemoryCurrentUser,
  setUser: (user) => {
    inMemoryCurrentUser = user;
  },
  clear: () => {
    inMemoryAccessToken = null;
    inMemoryCurrentUser = null;
  },
};

// In-Memory Live Mutable Database State
export const db = {
  sarees: JSON.parse(JSON.stringify(INITIAL_SAREES)),
  categories: JSON.parse(JSON.stringify(INITIAL_CATEGORIES)),
  enquiries: JSON.parse(JSON.stringify(INITIAL_ENQUIRIES)),
  users: JSON.parse(JSON.stringify(INITIAL_USERS)),
  looks: JSON.parse(JSON.stringify(INITIAL_LOOKS)),
  heroVideo: JSON.parse(JSON.stringify(INITIAL_HERO_VIDEO)),
  storeDetails: JSON.parse(JSON.stringify(INITIAL_STORE_DETAILS)),
  supportChannels: JSON.parse(JSON.stringify(INITIAL_SUPPORT_CHANNELS)),
  faqs: JSON.parse(JSON.stringify(INITIAL_FAQS)),
  legalTerms: JSON.parse(JSON.stringify(INITIAL_LEGAL_TERMS)),
  legalPolicy: JSON.parse(JSON.stringify(INITIAL_LEGAL_POLICY)),
  systemConfig: JSON.parse(JSON.stringify(INITIAL_SYSTEM_CONFIG)),
  auditLogs: JSON.parse(JSON.stringify(INITIAL_AUDIT_LOGS)),
};

/**
 * Log helper to record user actions into audit logs
 */
export function recordAuditLog(action, resource, description) {
  const user = tokenStore.getUser() || { name: 'Admin', role: 'admin' };
  const newLog = {
    id: `log-${Date.now()}`,
    actorName: user.name,
    actorRole: user.role,
    action,
    resource,
    description,
    ipAddress: '103.21.144.12',
    timestamp: new Date().toISOString(),
  };
  db.auditLogs.unshift(newLog);
  return newLog;
}

/**
 * Centralized fetcher that respects VITE_USE_MOCK
 */
export async function apiRequest(endpoint, options = {}, mockHandler) {
  if (USE_MOCK) {
    // Artificial latency for authentic UI feedback (skeletons, spinners)
    await new Promise((res) => setTimeout(res, 120));
    try {
      const result = await mockHandler();
      return { success: true, data: result };
    } catch (err) {
      return {
        success: false,
        error: {
          code: err.code || 'MOCK_ERROR',
          message: err.message || 'Operation failed in mock adapter',
        },
      };
    }
  }

  return realRequest(endpoint, options);
}

let refreshFlight = null;

function buildUrl(endpoint, query) {
  const path = endpoint.startsWith('/api/v1')
    ? endpoint
    : `/api/v1${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const url = new URL(`${API_BASE_URL}${path}`);
  Object.entries(query || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '' || value === 'all') return;
    url.searchParams.set(key, String(value));
  });
  return url.toString();
}

async function refreshAdminSession() {
  if (!refreshFlight) {
    refreshFlight = fetch(`${API_BASE_URL}/api/v1/admin/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    })
      .then(async (response) => {
        const json = await response.json().catch(() => ({}));
        if (!response.ok || !json?.data?.token) {
          tokenStore.clear();
          return null;
        }
        tokenStore.setToken(json.data.token);
        tokenStore.setUser(json.data.user);
        return json.data.user;
      })
      .catch(() => {
        tokenStore.clear();
        return null;
      })
      .finally(() => {
        refreshFlight = null;
      });
  }
  return refreshFlight;
}

async function realRequest(endpoint, options = {}, retried = false) {
  const headers = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    'X-Requested-With': 'XMLHttpRequest',
    ...(tokenStore.getToken() ? { Authorization: `Bearer ${tokenStore.getToken()}` } : {}),
    ...(options.headers || {}),
  };
  let response;
  try {
    response = await fetch(buildUrl(endpoint, options.query), {
      method: options.method || 'GET',
      headers,
      body: options.body,
      credentials: 'include',
    });
  } catch {
    return { success: false, error: { code: 'NETWORK', message: 'The atelier API is unreachable.' } };
  }

  if (response.status === 401 && !retried && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
    const user = await refreshAdminSession();
    if (user) return realRequest(endpoint, options, true);
  }

  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    return {
      success: false,
      error: json?.error || { code: 'HTTP_ERROR', message: `Request failed (${response.status}).` },
    };
  }
  return json;
}

export async function restoreAdminSession() {
  if (USE_MOCK) return tokenStore.getUser();
  return refreshAdminSession();
}

