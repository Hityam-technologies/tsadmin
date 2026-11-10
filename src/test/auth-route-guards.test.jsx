import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { authService } from '../services/authService';

function TestProtectedComponent() {
  return <div>Secret Atelier Dashboard</div>;
}

describe('Auth & Route Guards', () => {
  beforeEach(() => {
    authService.logout();
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

  it('blocks unauthenticated access and redirects to /login', () => {
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

    expect(screen.getByText('Login Screen Displayed')).toBeInTheDocument();
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

    expect(screen.getByText('Secret Atelier Dashboard')).toBeInTheDocument();
  });
});
