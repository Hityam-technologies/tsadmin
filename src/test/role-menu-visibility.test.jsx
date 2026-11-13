import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import { AdminLayout } from '../components/layout/AdminLayout';
import { authService } from '../services/authService';

describe('Admin Navigation & Admin Suite Visibility', () => {
  beforeEach(() => {
    authService.logout();
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

    expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0);
    expect(screen.getByText('Saree Catalog')).toBeInTheDocument();
    expect(screen.getByText('Categories')).toBeInTheDocument();
    expect(screen.getByText('Enquiries')).toBeInTheDocument();
    expect(screen.getByText('Customers')).toBeInTheDocument();
    expect(screen.getByText('FASHN.ai Try-On')).toBeInTheDocument();
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

    // Header Admin indicator pill
    expect(screen.getAllByText('Admin').length).toBeGreaterThan(0);
    // User name
    expect(screen.getByText('Maharani Gayatri')).toBeInTheDocument();
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

    const logoImages = screen.getAllByAltText('Tripuraa Sangrahah');
    expect(logoImages.length).toBeGreaterThan(0);
    // Primary desktop sidebar logo has the saffron contrast shadow applied for clear visibility
    expect(logoImages[0]).toHaveClass('brand-logo-on-saffron');
  });
});

