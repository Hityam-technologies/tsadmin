import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import { AdminLayout } from '../components/layout/AdminLayout';
import { authService } from '../services/authService';
import { tokenStore } from '../services/apiClient';

describe('Admin Navigation & Admin Suite Visibility', () => {
  beforeEach(() => {
    localStorage.clear();
    tokenStore.clear();
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      const target = String(url);
      if (target.includes('/api/v1/admin/auth/login') || target.includes('/api/v1/admin/auth/refresh')) {
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
      return { ok: true, status: 200, json: async () => ({ success: true, data: {} }) };
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('displays full suite of navigation items to the Admin', async () => {
    await authService.login('admin@tripuraa.in', 'Password@123');

    render(
      <MemoryRouter initialEntries={['/']}>
        <ToastProvider>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<AdminLayout />}>
                <Route index element={<div>Dashboard Page</div>} />
              </Route>
            </Routes>
          </AuthProvider>
        </ToastProvider>
      </MemoryRouter>
    );

    expect((await screen.findAllByText('Dashboard')).length).toBeGreaterThan(0);
    expect(screen.getByText('Saree Catalog')).toBeInTheDocument();
    expect(screen.getByText('Categories')).toBeInTheDocument();
    expect(screen.getByText('Enquiries')).toBeInTheDocument();
    expect(screen.getByText('Customers')).toBeInTheDocument();
    expect(screen.getByText('Orders')).toBeInTheDocument();
    expect(screen.getByText('Coupons')).toBeInTheDocument();
    expect(screen.getByText('Referrals')).toBeInTheDocument();
    expect(screen.getByText('Try-On')).toBeInTheDocument();
    expect(screen.getByText('Content Studio')).toBeInTheDocument();
    expect(screen.getByText('System Settings')).toBeInTheDocument();
    expect(screen.getByText('Audit Logs')).toBeInTheDocument();
  });

  it('displays Admin badge and profile without complex role dropdowns', async () => {
    await authService.login('admin@tripuraa.in', 'Password@123');

    render(
      <MemoryRouter initialEntries={['/']}>
        <ToastProvider>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<AdminLayout />}>
                <Route index element={<div>Dashboard Page</div>} />
              </Route>
            </Routes>
          </AuthProvider>
        </ToastProvider>
      </MemoryRouter>
    );

    expect((await screen.findAllByText('Admin')).length).toBeGreaterThan(0);
    expect(await screen.findByText('Maharani Gayatri')).toBeInTheDocument();
  });

  it('renders Tripuraa Sangrahah brand logo with high-contrast gradient header badge', async () => {
    await authService.login('admin@tripuraa.in', 'Password@123');

    render(
      <MemoryRouter initialEntries={['/']}>
        <ToastProvider>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<AdminLayout />}>
                <Route index element={<div>Dashboard Page</div>} />
              </Route>
            </Routes>
          </AuthProvider>
        </ToastProvider>
      </MemoryRouter>
    );

    const logoImages = await screen.findAllByAltText('Tripuraa Sangrahah');
    expect(logoImages.length).toBeGreaterThan(0);
    expect(logoImages[0].getAttribute('src')).toContain('panel-logo');
  });
});
