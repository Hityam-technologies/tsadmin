import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { GuestRoute } from '../components/auth/GuestRoute';
import { authService } from '../services/authService';
import { tokenStore } from '../services/apiClient';

function TestProtectedComponent() {
  return <div>Secret Store Dashboard</div>;
}

describe('Auth & Route Guards', () => {
  let hasCookieSession = false;

  beforeEach(() => {
    hasCookieSession = false;
    localStorage.clear();
    tokenStore.clear();
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init = {}) => {
      const target = String(url);
      if (target.includes('/api/v1/admin/auth/login')) {
        const body = JSON.parse(init.body || '{}');
        if (body.email === 'admin@tripuraa.in' && body.password === 'Password@123') {
          hasCookieSession = true;
          return {
            ok: true,
            status: 200,
            json: async () => ({
              success: true,
              data: {
                token: 'jwt-admin-token',
                user: { id: 'adm-1', name: 'Maharani Gayatri', email: 'admin@tripuraa.in', role: 'admin' },
              },
            }),
          };
        }
        return {
          ok: false,
          status: 401,
          json: async () => ({
            success: false,
            error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' },
          }),
        };
      }
      if (target.includes('/api/v1/admin/auth/refresh')) {
        if (!hasCookieSession) {
          return {
            ok: false,
            status: 401,
            json: async () => ({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not signed in' } }),
          };
        }
        return {
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            data: {
              token: 'jwt-admin-refreshed',
              user: { id: 'adm-1', name: 'Maharani Gayatri', email: 'admin@tripuraa.in', role: 'admin' },
            },
          }),
        };
      }
      if (target.includes('/api/v1/admin/auth/reset-password')) {
        const body = JSON.parse(init.body || '{}');
        if (body.code === '123456') {
          return { ok: true, status: 200, json: async () => ({ success: true, data: { message: 'Password updated.' } }) };
        }
        return { ok: false, status: 400, json: async () => ({ success: false, error: { message: 'Invalid code.' } }) };
      }
      return { ok: true, status: 200, json: async () => ({ success: true, data: {} }) };
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('authenticates valid admin credentials successfully', async () => {
    const res = await authService.login('admin@tripuraa.in', 'Password@123');
    expect(res.success).toBe(true);
    expect(res.data.user.role).toBe('admin');
    expect(authService.isAuthenticated()).toBe(true);
  });

  it('rejects invalid email or credentials with informative error', async () => {
    const res = await authService.login('intruder@unknown.com', 'wrongpassword');
    expect(res.success).toBe(false);
    expect(res.error.message).toContain('Invalid credentials');
  });

  it('submits admin reset password code and new password cleanly', async () => {
    const ok = await authService.resetPassword('admin@tripuraa.in', '123456', 'Strong@123');
    expect(ok.success).toBe(true);
    const bad = await authService.resetPassword('admin@tripuraa.in', '000000', 'Strong@123');
    expect(bad.success).toBe(false);
  });

  it('blocks unauthenticated access and redirects to /login', async () => {
    render(
      <MemoryRouter initialEntries={['/secret']}>
        <AuthProvider>
          <Routes>
            <Route
              path="/secret"
              element={
                <ProtectedRoute>
                  <TestProtectedComponent />
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<div>Login Screen Displayed</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText('Login Screen Displayed')).toBeInTheDocument();
  });

  it('allows access to protected routes when authenticated as admin', async () => {
    await authService.login('admin@tripuraa.in', 'Password@123');

    render(
      <MemoryRouter initialEntries={['/secret']}>
        <AuthProvider>
          <Routes>
            <Route
              path="/secret"
              element={
                <ProtectedRoute>
                  <TestProtectedComponent />
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<div>Login Screen Displayed</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText('Secret Store Dashboard')).toBeInTheDocument();
  });

  it('skips the login screen when a session is already saved', async () => {
    await authService.login('admin@tripuraa.in', 'Password@123');

    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <Routes>
            <Route
              path="/login"
              element={
                <GuestRoute>
                  <div>Login Screen Displayed</div>
                </GuestRoute>
              }
            />
            <Route path="/" element={<div>Secret Store Dashboard</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText('Secret Store Dashboard')).toBeInTheDocument();
  });
});
