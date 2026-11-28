import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { GuestRoute } from './components/auth/GuestRoute';
import { SessionGate } from './components/auth/SessionGate';
import { AdminLayout } from './components/layout/AdminLayout';
import { LoginPage } from './pages/LoginPage';
import { BillingAccessPage } from './pages/BillingAccessPage';

const lazyNamed = (loader, name) => lazy(() => loader().then((mod) => ({ default: mod[name] })));

const DashboardPage = lazyNamed(() => import('./pages/DashboardPage'), 'DashboardPage');
const SareesPage = lazyNamed(() => import('./pages/SareesPage'), 'SareesPage');
const CategoriesPage = lazyNamed(() => import('./pages/CategoriesPage'), 'CategoriesPage');
const EnquiriesPage = lazyNamed(() => import('./pages/EnquiriesPage'), 'EnquiriesPage');
const UsersPage = lazyNamed(() => import('./pages/UsersPage'), 'UsersPage');
const TryOnAIPage = lazyNamed(() => import('./pages/TryOnAIPage'), 'TryOnAIPage');
const OrdersPage = lazyNamed(() => import('./pages/OrdersPage'), 'OrdersPage');
const CouponsPage = lazyNamed(() => import('./pages/CouponsPage'), 'CouponsPage');
const ReferralsPage = lazyNamed(() => import('./pages/ReferralsPage'), 'ReferralsPage');
const ContentStudioPage = lazyNamed(() => import('./pages/ContentStudioPage'), 'ContentStudioPage');
const SystemSettingsPage = lazyNamed(() => import('./pages/SystemSettingsPage'), 'SystemSettingsPage');
const AuditLogsPage = lazyNamed(() => import('./pages/AuditLogsPage'), 'AuditLogsPage');
const BillingWorkspacePage = lazyNamed(() => import('./pages/BillingWorkspacePage'), 'BillingWorkspacePage');

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
    },
  },
});

function RootGate() {
  const { currentUser, isRestoring } = useAuth();

  if (isRestoring) return <SessionGate />;

  // If signed in, display the Executive Dashboard inside AdminLayout
  if (currentUser) {
    return (
      <AdminLayout>
        <DashboardPage />
      </AdminLayout>
    );
  }

  // Initial landing screen: Store Billing Access with 6-digit PIN entry
  return <BillingAccessPage />;
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Suspense fallback={<SessionGate />}>
              <Routes>
              {/* Root Gate */}
              <Route path="/" element={<RootGate />} />

              {/* Store Billing Access (PIN Entry) */}
              <Route path="/billing-access" element={<BillingAccessPage />} />

              {/* Store Billing / POS Interface */}
              <Route path="/billing" element={<BillingWorkspacePage />} />

              {/* Signed-out only. A saved session skips this screen. */}
              <Route
                path="/login"
                element={
                  <GuestRoute>
                    <LoginPage />
                  </GuestRoute>
                }
              />

              {/* Signed-in Admin routes */}
              <Route
                element={
                  <ProtectedRoute>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="sarees" element={<SareesPage />} />
                <Route path="categories" element={<CategoriesPage />} />
                <Route path="enquiries" element={<EnquiriesPage />} />
                <Route path="users" element={<UsersPage />} />
                <Route path="orders" element={<OrdersPage />} />
                <Route path="coupons" element={<CouponsPage />} />
                <Route path="referrals" element={<ReferralsPage />} />
                <Route path="try-on" element={<TryOnAIPage />} />
                <Route path="try-on-ai" element={<Navigate to="/try-on" replace />} />
                <Route path="try-on-usage" element={<Navigate to="/try-on" replace />} />
                <Route path="try-on-usage/:userId" element={<Navigate to="/try-on" replace />} />
                <Route path="try-on-moderation" element={<Navigate to="/try-on" replace />} />
                <Route path="content" element={<ContentStudioPage />} />
                <Route path="settings" element={<SystemSettingsPage />} />
                <Route path="audit-logs" element={<AuditLogsPage />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;
