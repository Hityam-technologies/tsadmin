const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const TOKEN_KEY = 'ts_billing_access_token';

export function readBillingToken() {
  if (typeof localStorage === 'undefined') return '';
  try {
    return localStorage.getItem(TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

export function writeBillingToken(token) {
  if (typeof localStorage === 'undefined') return;
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // storage unavailable
  }
}

function buildUrl(path, query) {
  const base = API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000');
  const url = new URL(`/api/v1/billing${path}`, base);
  Object.entries(query || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '' || value === 'all') return;
    url.searchParams.set(key, String(value));
  });
  return url.toString();
}

export async function billingRequest(path, { method = 'GET', query, body, token } = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  };
  const sessionToken = token || readBillingToken();
  if (sessionToken) headers.Authorization = `Bearer ${sessionToken}`;
  let response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    return { success: false, error: 'The billing register could not reach the server.' };
  }
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    return { success: false, error: json?.error?.message || `Request failed (${response.status}).` };
  }
  return { success: true, data: json.data };
}
