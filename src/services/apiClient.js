/**
 * Central API Client.
 *
 * The short-lived sign-in is kept in this browser tab (sessionStorage) so a reload
 * stays on the dashboard. The httpOnly cookie is what extends that sign-in.
 * Mock mode keeps everything in memory for tests.
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

// Empty means "this same website". Vite (local) and Vercel (live) forward /api.
const API_BASE_URL = '';
const SESSION_KEY = 'tsadmin.session';

let inMemoryAccessToken = null;
let inMemoryCurrentUser = null;

function readSavedSession() {
  if (USE_MOCK || typeof sessionStorage === 'undefined') return null;
  try {
    const saved = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
    if (!saved?.token || !saved?.user) return null;
    return saved;
  } catch {
    return null;
  }
}

function writeSavedSession() {
  if (USE_MOCK || typeof sessionStorage === 'undefined') return;
  if (inMemoryAccessToken && inMemoryCurrentUser) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
      token: inMemoryAccessToken,
      user: inMemoryCurrentUser,
    }));
    return;
  }
  sessionStorage.removeItem(SESSION_KEY);
}

const savedSession = readSavedSession();
if (savedSession) {
  inMemoryAccessToken = savedSession.token;
  inMemoryCurrentUser = savedSession.user;
}

export const tokenStore = {
  getToken: () => inMemoryAccessToken,
  setToken: (token) => {
    inMemoryAccessToken = token;
    writeSavedSession();
  },
  getUser: () => inMemoryCurrentUser,
  setUser: (user) => {
    inMemoryCurrentUser = user;
    writeSavedSession();
  },
  clear: () => {
    inMemoryAccessToken = null;
    inMemoryCurrentUser = null;
    writeSavedSession();
  },
};

let sessionLostHandler = null;

export function setSessionLostHandler(handler) {
  sessionLostHandler = handler;
}

/** This portal only admits admins, even if the API omits the role field. */
export function rememberAdmin(user) {
  if (!user) {
    tokenStore.setUser(null);
    return null;
  }
  const admin = { ...user, role: user.role || 'admin' };
  tokenStore.setUser(admin);
  return admin;
}

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
  // An empty base means "this same website". new URL needs a full base either way.
  const base = API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000');
  const url = new URL(path, base);
  Object.entries(query || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '' || value === 'all') return;
    url.searchParams.set(key, String(value));
  });
  return url.toString();
}

async function refreshAdminSession() {
  if (!refreshFlight) {
    const tokenAtStart = tokenStore.getToken();
    refreshFlight = fetch(`${API_BASE_URL}/api/v1/admin/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    })
      .then(async (response) => {
        const json = await response.json().catch(() => ({}));
        if (!response.ok || !json?.data?.token) {
          // A reload still has the saved sign-in. Only wipe it when there was none.
          if (!tokenAtStart && tokenStore.getToken() === tokenAtStart) {
            tokenStore.clear();
            sessionLostHandler?.();
          }
          return tokenStore.getUser();
        }
        tokenStore.setToken(json.data.token);
        return rememberAdmin(json.data.user);
      })
      .catch(() => {
        if (!tokenAtStart && tokenStore.getToken() === tokenAtStart) {
          tokenStore.clear();
          sessionLostHandler?.();
        }
        return tokenStore.getUser();
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
    const tokenBeforeRefresh = tokenStore.getToken();
    const user = await refreshAdminSession();
    if (user && tokenStore.getToken() && tokenStore.getToken() !== tokenBeforeRefresh) {
      return realRequest(endpoint, options, true);
    }
    tokenStore.clear();
    sessionLostHandler?.();
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

