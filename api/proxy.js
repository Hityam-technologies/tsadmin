/**
 * API proxy.
 *
 * Every /api call on the admin site is handed to this one function.
 * It calls the atelier API and copies the session cookie onto this site,
 * so a reload opens the dashboard instead of the login screen.
 */

const UPSTREAM = 'https://tripuraabackend.onrender.com';

const SKIP = new Set([
  'host',
  'connection',
  'content-length',
  'transfer-encoding',
  'content-encoding',
]);

export const config = {
  api: {
    bodyParser: false,
  },
};

function readBody(req) {
  if (req.method === 'GET' || req.method === 'HEAD') return Promise.resolve(undefined);
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function stickToThisSite(setCookie) {
  let cookie = String(setCookie).replace(/;\s*Domain=[^;]*/gi, '');
  cookie = /;\s*Path=/i.test(cookie)
    ? cookie.replace(/;\s*Path=[^;]*/i, '; Path=/api')
    : `${cookie}; Path=/api`;
  cookie = /;\s*SameSite=/i.test(cookie)
    ? cookie.replace(/;\s*SameSite=[^;]*/i, '; SameSite=Lax')
    : `${cookie}; SameSite=Lax`;
  if (!/;\s*Secure/i.test(cookie)) cookie += '; Secure';
  if (!/;\s*HttpOnly/i.test(cookie)) cookie += '; HttpOnly';
  return cookie;
}

function upstreamUrl(req) {
  const incoming = new URL(req.url, 'https://tsadmin.local');
  const forwarded = incoming.searchParams.get('path');
  if (forwarded) {
    const search = new URLSearchParams(incoming.search);
    search.delete('path');
    const extra = search.toString();
    return new URL(`/api/${forwarded}${extra ? `?${extra}` : ''}`, UPSTREAM);
  }
  return new URL(incoming.pathname + incoming.search, UPSTREAM);
}

export default async function handler(req, res) {
  try {
    const headers = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (!value || SKIP.has(key.toLowerCase())) continue;
      headers[key] = Array.isArray(value) ? value.join(', ') : value;
    }

    const upstream = await fetch(upstreamUrl(req), {
      method: req.method,
      headers,
      body: await readBody(req),
      redirect: 'manual',
    });

    const cookies = typeof upstream.headers.getSetCookie === 'function'
      ? upstream.headers.getSetCookie()
      : [];

    upstream.headers.forEach((value, key) => {
      const name = key.toLowerCase();
      if (name === 'set-cookie' || SKIP.has(name)) return;
      res.setHeader(key, value);
    });

    if (cookies.length) {
      res.setHeader('Set-Cookie', cookies.map(stickToThisSite));
    }
    res.setHeader('Cache-Control', 'no-store');

    const payload = Buffer.from(await upstream.arrayBuffer());
    res.status(upstream.status).send(payload);
  } catch {
    res.status(502).json({
      success: false,
      error: { code: 'NETWORK', message: 'The atelier API is unreachable.' },
    });
  }
}
