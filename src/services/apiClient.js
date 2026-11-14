/**
 * Central API client for the Tripuraa Sangrahah admin panel.
 * All reads/writes go to the live backend — no in-memory mock database.
 */

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const SESSION_KEY = 'tsadmin.session';

let inMemoryAccessToken = null;
let inMemoryCurrentUser = null;

function browserStore() {
  if (typeof localStorage === 'undefined') return null;
  return localStorage;
}

function readSavedSession() {
  const store = browserStore();
  if (!store) return null;
  try {
    if (!store.getItem(SESSION_KEY) && typeof sessionStorage !== 'undefined') {
      const previous = sessionStorage.getItem(SESSION_KEY);
      if (previous) {
        store.setItem(SESSION_KEY, previous);
        sessionStorage.removeItem(SESSION_KEY);
      }
    }
    const saved = JSON.parse(store.getItem(SESSION_KEY) || 'null');
    if (!saved?.token || !saved?.user) return null;
    return saved;
  } catch {
    return null;
  }
}

function writeSavedSession() {
  const store = browserStore();
  if (!store) return;
  if (inMemoryAccessToken && inMemoryCurrentUser) {
    store.setItem(
      SESSION_KEY,
      JSON.stringify({
        token: inMemoryAccessToken,
        user: inMemoryCurrentUser,
      }),
    );
    return;
  }
  store.removeItem(SESSION_KEY);
}

/** Other tabs call this when the saved sign-in changes. */
export function syncSessionFromStorage() {
  const saved = readSavedSession();
  inMemoryAccessToken = saved?.token || null;
  inMemoryCurrentUser = saved?.user || null;
  return inMemoryCurrentUser;
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

let refreshFlight = null;
let sessionClosed = false;

export function closeAdminSession() {
  sessionClosed = true;
  tokenStore.clear();
}

export function openAdminSession() {
  sessionClosed = false;
}

function buildUrl(endpoint, query) {
  const path = endpoint.startsWith('/api/v1')
    ? endpoint
    : `/api/v1${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const base =
    API_BASE_URL ||
    (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000');
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
    refreshFlight = fetch(buildUrl('/api/v1/admin/auth/refresh'), {
      method: 'POST',
      credentials: 'include',
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    })
      .then(async (response) => {
        const json = await response.json().catch(() => ({}));
        if (sessionClosed || !response.ok || !json?.data?.token) {
          if (sessionClosed || (!tokenAtStart && tokenStore.getToken() === tokenAtStart)) {
            tokenStore.clear();
            sessionLostHandler?.();
          }
          return sessionClosed ? null : tokenStore.getUser();
        }
        if (sessionClosed) return null;
        tokenStore.setToken(json.data.token);
        return rememberAdmin(json.data.user);
      })
      .catch(() => {
        if (sessionClosed || (!tokenAtStart && tokenStore.getToken() === tokenAtStart)) {
          tokenStore.clear();
          sessionLostHandler?.();
        }
        return sessionClosed ? null : tokenStore.getUser();
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
    return {
      success: false,
      error: { code: 'NETWORK', message: 'The backend API is unreachable.' },
    };
  }

  if (
    response.status === 401 &&
    !retried &&
    !sessionClosed &&
    !endpoint.includes('/auth/login') &&
    !endpoint.includes('/auth/logout') &&
    !endpoint.includes('/auth/refresh')
  ) {
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

/** Send a request to the live backend API. */
export async function apiRequest(endpoint, options = {}) {
  return realRequest(endpoint, options);
}

export async function restoreAdminSession() {
  return refreshAdminSession();
}
