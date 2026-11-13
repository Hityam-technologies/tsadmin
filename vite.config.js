import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = (env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    server: {
      // The browser talks to this dev site only. Vite forwards /api to the backend API
      // and keeps the sign-in cookie here, so a reload does not ask for the password again.
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: true,
          configure(proxy) {
            proxy.on('proxyRes', (proxyRes) => {
              const raw = proxyRes.headers['set-cookie'];
              if (!raw) return;
              const list = Array.isArray(raw) ? raw : [raw];
              proxyRes.headers['set-cookie'] = list.map((cookie) => {
                let next = cookie.replace(/;\s*Domain=[^;]*/gi, '').replace(/;\s*Secure/gi, '');
                next = /;\s*SameSite=/i.test(next)
                  ? next.replace(/;\s*SameSite=[^;]*/i, '; SameSite=Lax')
                  : `${next}; SameSite=Lax`;
                return next;
              });
            });
          },
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.js',
      css: false,
    },
  };
});
