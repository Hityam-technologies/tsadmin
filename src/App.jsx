import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { GuestRoute } from './components/auth/GuestRoute';
import { AdminLayout } from './components/layout/AdminLayout';

// Pages
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { SareesPage } from './pages/SareesPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { EnquiriesPage } from './pages/EnquiriesPage';
import { UsersPage } from './pages/UsersPage';
import { TryOnAIPage } from './pages/TryOnAIPage';
import { ContentStudioPage } from './pages/ContentStudioPage';
import { SystemSettingsPage } from './pages/SystemSettingsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Signed-out only. A saved session skips this screen. */}
              <Route
                path="/login"
                element={
                  <GuestRoute>
                    <LoginPage />
                  </GuestRoute>
                }
              />

              {/* Signed-in pages. "/" is the dashboard, the home of the portal. */}
              <Route
                element={
                  <ProtectedRoute>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardPage />} />
                <Route path="sarees" element={<SareesPage />} />
                <Route path="categories" element={<CategoriesPage />} />
                <Route path="enquiries" element={<EnquiriesPage />} />
                <Route path="users" element={<UsersPage />} />
                <Route path="try-on-ai" element={<TryOnAIPage />} />
                <Route path="try-on-moderation" element={<Navigate to="/try-on-ai" replace />} />
                <Route path="content" element={<ContentStudioPage />} />
                <Route path="settings" element={<SystemSettingsPage />} />
                <Route path="audit-logs" element={<AuditLogsPage />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;
