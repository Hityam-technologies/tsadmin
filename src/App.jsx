import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
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
              {/* Public Auth Routes */}
              <Route path="/login" element={<LoginPage />} />

              {/* Protected Administration Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                {/* 1. Dashboard */}
                <Route index element={<DashboardPage />} />

                {/* 2. Saree Master Catalog */}
                <Route path="sarees" element={<SareesPage />} />

                {/* 3. Category Stories */}
                <Route path="categories" element={<CategoriesPage />} />

                {/* 4. Client Enquiries & Bespoke Orders */}
                <Route path="enquiries" element={<EnquiriesPage />} />

                {/* 5. Customers & Atelier Directory */}
                <Route path="users" element={<UsersPage />} />

                {/* 6. FASHN.ai Virtual Try-On Studio (Automated AI Engine) */}
                <Route path="try-on-ai" element={<TryOnAIPage />} />
                <Route path="try-on-moderation" element={<Navigate to="/try-on-ai" replace />} />

                {/* 7. Content Studio */}
                <Route path="content" element={<ContentStudioPage />} />

                {/* 8. System Configuration */}
                <Route path="settings" element={<SystemSettingsPage />} />

                {/* 9. Immutable Audit Trail */}
                <Route path="audit-logs" element={<AuditLogsPage />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;
