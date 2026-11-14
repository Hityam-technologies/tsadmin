import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { BrandGradientBackground } from '../common/BrandGradientBackground';
import homeLogo from '../../assets/homeLogo.png';
import {
  LayoutDashboard,
  Layers,
  Sparkles,
  ShoppingBag,
  Users,
  FileText,
  Sliders,
  History,
  LogOut,
  Menu,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Zap,
  Store,
} from 'lucide-react';

export function AdminLayout({ children }) {
  const { currentUser, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Live real-time clock matching screenshot (e.g. ● 06:06:07 PM, Monday, Nov 9, 2026)
  const [timeString, setTimeString] = useState('');
  const [dateString, setDateString] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
      setDateString(
        now.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await logout();
    showToast('Signed out. Sign in again with your password.', 'info');
    navigate('/login', { replace: true });
  };

  // Resolve current active page title for the search pill tag
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    if (path.startsWith('/sarees')) return 'Sarees';
    if (path.startsWith('/categories')) return 'Categories';
    if (path.startsWith('/enquiries')) return 'Enquiries';
    if (path.startsWith('/users')) return 'Customers';
    if (path.startsWith('/try-on-ai')) return 'FASHN.ai';
    if (path.startsWith('/content')) return 'Content';
    if (path.startsWith('/settings')) return 'Settings';
    if (path.startsWith('/audit-logs')) return 'Audit';
    return 'Dashboard';
  };

  const navItems = [
    {
      label: 'Dashboard',
      path: '/',
      icon: LayoutDashboard,
      allowed: true,
    },
    {
      label: 'Store Billing / POS',
      path: '/billing',
      icon: Store,
      allowed: true,
    },
    {
      label: 'Saree Catalog',
      path: '/sarees',
      icon: ShoppingBag,
      allowed: true,
    },
    {
      label: 'Categories',
      path: '/categories',
      icon: Layers,
      allowed: true,
    },
    {
      label: 'Enquiries',
      path: '/enquiries',
      icon: Sparkles,
      allowed: true,
    },
    {
      label: 'Customers',
      path: '/users',
      icon: Users,
      allowed: true,
    },
    {
      label: 'FASHN.ai Try-On',
      path: '/try-on-ai',
      icon: Zap,
      allowed: true,
    },
    {
      label: 'Content Studio',
      path: '/content',
      icon: FileText,
      allowed: true,
    },
    {
      label: 'System Settings',
      path: '/settings',
      icon: Sliders,
      allowed: true,
    },
    {
      label: 'Audit Logs',
      path: '/audit-logs',
      icon: History,
      allowed: true,
    },
  ];

  return (
    <BrandGradientBackground idPrefix="admin_">
      <div className="min-h-screen p-3 sm:p-4 lg:p-5 flex gap-5 font-sans antialiased text-charcoal-900 selection:bg-gold-200">
        {/* =========================================================================
            LEFT SIDEBAR: Floating Rounded Card with Frosted Luxury Glass
           ========================================================================= */}
        <aside className="hidden lg:flex w-72 rounded-[28px] bg-white/85 backdrop-blur-xl border border-sand-200/90 shadow-[0_12px_36px_rgba(197,162,83,0.10)] p-5 flex-col justify-between flex-shrink-0 sticky top-5 h-[calc(100vh-2.5rem)]">
          <div>
            {/* Top Brand Header Badge with Royal Saffron Silk Gradient */}
            <div className="pt-1 pb-5 px-0.5">
              <div className="relative rounded-2xl p-4 bg-gradient-to-br from-[#DE7335] via-[#BF5B21] to-[#752809] border border-gold-300/60 shadow-[0_8px_24px_rgba(191,91,33,0.32),0_2px_6px_rgba(0,0,0,0.12)] flex items-center justify-center overflow-hidden group">
                <div
                  className="absolute inset-0 pointer-events-none opacity-35"
                  style={{
                    background: 'radial-gradient(ellipse at 50% 20%, rgba(255, 235, 195, 0.6) 0%, transparent 70%)',
                  }}
                />
                <img
                  src={homeLogo}
                  alt="Tripuraa Sangrahah"
                  className="relative z-10 w-full max-w-[215px] h-auto max-h-20 object-contain brand-logo-on-saffron transition-transform hover:scale-[1.02]"
                />
              </div>
            </div>

            {/* Section Header */}
            <div className="px-3 mb-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-charcoal-400">
                MAIN MENU
              </span>
            </div>

            {/* Nav Items List */}
            <nav className="space-y-1.5">
              {navItems.map((item) => {
                if (!item.allowed) return null;
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/'}
                    replace={item.path === '/billing'}
                    className={({ isActive }) =>
                      `flex items-center px-3.5 py-3 rounded-2xl text-sm transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-white via-white to-sand-50/90 shadow-[0_2px_12px_rgba(197,162,83,0.12)] border border-gold-300/80 font-extrabold text-charcoal-900'
                          : 'text-charcoal-600 hover:text-charcoal-900 hover:bg-sand-50/80 font-bold'
                      }`
                    }
                  >
                  {({ isActive }) => (
                    <>
                      {/* Active Indicator Bar on left edge */}
                      {isActive ? (
                        <span className="w-1.5 h-6 bg-gold-600 rounded-full mr-3 flex-shrink-0" />
                      ) : (
                        <span className="w-1.5 h-6 mr-3 flex-shrink-0" />
                      )}

                      <Icon
                        className={`w-5 h-5 mr-3 flex-shrink-0 ${
                          isActive ? 'text-gold-700 stroke-[2.5]' : 'text-charcoal-400 stroke-2'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sidebar: Status + User Profile Card */}
        <div className="space-y-3 pt-3">
          {/* Status Pill Badge */}
          <div className="rounded-full border border-sand-200/90 bg-sand-50/80 px-3.5 py-2 flex items-center justify-between text-xs text-charcoal-700">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-gold-500 animate-pulse" />
              <span className="font-extrabold text-charcoal-900">Store Online</span>
            </div>
            <span className="text-xs text-charcoal-500 font-mono font-bold px-2 py-0.5 rounded-full bg-white border border-sand-200">
              v1.2
            </span>
          </div>

          {/* User Profile Card */}
          <div className="rounded-2xl border border-sand-200/90 bg-white p-3.5 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-gold-100 border border-gold-300 flex items-center justify-center font-extrabold text-xs text-gold-900 flex-shrink-0">
                {currentUser?.name?.charAt(0) || '-'}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-charcoal-900 truncate">
                  {currentUser?.name || '-'}
                </div>
                <div className="text-[11px] font-semibold text-charcoal-500 uppercase tracking-wider">
                  Admin
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-xl hover:bg-sand-100 text-charcoal-400 hover:text-maroon-700 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* =========================================================================
          RIGHT MAIN CONTAINER: Top Floating Nav Bar + Main View Area
         ========================================================================= */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Floating Top Bar with Frosted Glass */}
        <header className="rounded-[24px] bg-white/85 backdrop-blur-xl border border-sand-200/90 shadow-[0_4px_20px_rgba(197,162,83,0.06)] px-5 sm:px-7 py-3.5 sm:py-4 mb-6 flex items-center justify-between gap-4 sticky top-5 z-30">
          {/* Left: Mobile Toggle + Nav Chevrons + Search Input Pill */}
          <div className="flex items-center gap-3.5 min-w-0">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-charcoal-600 hover:bg-sand-100"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Back / Forward round buttons */}
            <div className="hidden sm:flex items-center gap-1.5">
              <button
                onClick={() => navigate(-1)}
                className="w-9 h-9 rounded-full border border-sand-200 bg-white hover:bg-sand-50 flex items-center justify-center text-charcoal-600 hover:text-charcoal-900 transition-colors shadow-2xs cursor-pointer"
                title="Go back"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigate(1)}
                className="w-9 h-9 rounded-full border border-sand-200 bg-white hover:bg-sand-50 flex items-center justify-center text-charcoal-600 hover:text-charcoal-900 transition-colors shadow-2xs cursor-pointer"
                title="Go forward"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Modern Search Input Pill with Page Chip & Keyboard Shortcut */}
            <div className="relative flex items-center rounded-full bg-sand-50/90 hover:bg-sand-50 border border-sand-200/90 px-4 py-2.5 text-sm text-charcoal-700 w-60 sm:w-80 md:w-96 lg:w-[420px] shadow-2xs transition-colors">
              <Search className="w-4.5 h-4.5 text-charcoal-400 mr-2.5 flex-shrink-0" />
              <span className="px-3 py-1 rounded-full bg-white border border-sand-200 text-xs font-extrabold text-gold-900 mr-2.5 flex-shrink-0 shadow-2xs">
                {getPageTitle()}
              </span>
              <input
                type="text"
                placeholder="Search catalog, clients, actions..."
                className="bg-transparent border-none outline-none text-sm font-semibold text-charcoal-900 placeholder:text-charcoal-400 placeholder:font-normal w-full"
              />
              <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-md bg-sand-200/60 border border-sand-300/40 text-[11px] text-charcoal-500 font-mono font-bold ml-2 flex-shrink-0">
                ⌘ F
              </span>
            </div>
          </div>

          {/* Right: Admin Pill + Live Clock + Date */}
          <div className="flex items-center gap-4 flex-shrink-0">
            {/* Admin Badge Pill */}
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-sand-50 border border-sand-200 text-sm font-extrabold text-charcoal-800 shadow-2xs">
              <ShieldCheck className="w-4.5 h-4.5 text-gold-600" />
              <span>Admin</span>
            </div>

            {/* Real-time Clock and Date (matching screenshot) */}
            <div className="hidden md:flex flex-col text-right">
              <div className="flex items-center justify-end gap-2 text-sm sm:text-base font-extrabold text-charcoal-900 tracking-tight font-mono">
                <span className="w-2.5 h-2.5 rounded-full bg-gold-500 animate-pulse" />
                <span>{timeString || '-'}</span>
              </div>
              <span className="text-xs text-charcoal-500 font-bold">
                {dateString || '-'}
              </span>
            </div>

            {/* User Avatar & Logout */}
            <div className="flex items-center gap-2.5 pl-3 border-l border-sand-200">
              <div className="w-9 h-9 rounded-full bg-sand-100 ring-2 ring-gold-400/80 flex items-center justify-center text-xs font-bold text-charcoal-500">
                {currentUser?.name?.charAt(0) || '-'}
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl text-charcoal-400 hover:text-maroon-700 hover:bg-sand-100 transition-colors cursor-pointer"
                title="Sign out"
              >
                <LogOut className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>
        </header>

        {/* Mobile Navigation Sheet */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div
              className="fixed inset-0 bg-charcoal-900/50 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 w-72 bg-[#FFFDF0]/95 backdrop-blur-xl p-5 shadow-2xl flex flex-col justify-between border-r border-gold-200/80">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-sand-200/80 mb-4">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-[#DE7335] via-[#BF5B21] to-[#752809] border border-gold-300/60 shadow-[0_6px_20px_rgba(191,91,33,0.28)] flex-1 mr-3 flex items-center justify-center relative overflow-hidden">
                    <img
                      src={homeLogo}
                      alt="Tripuraa Sangrahah"
                      className="relative z-10 max-h-12 w-auto max-w-[170px] object-contain brand-logo-on-saffron"
                    />
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-1.5 rounded-xl text-charcoal-500 hover:bg-sand-100/80 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <nav className="space-y-1">
                  {navItems.map((item) => {
                    if (!item.allowed) return null;
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === '/'}
                        replace={item.path === '/billing'}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold ${
                            isActive
                              ? 'bg-gold-50 text-gold-900 border border-gold-300 shadow-2xs'
                              : 'text-charcoal-600 hover:bg-sand-100'
                          }`
                        }
                      >
                        <Icon className="w-4 h-4 text-gold-600" />
                        <span>{item.label}</span>
                      </NavLink>
                    );
                  })}
                </nav>
              </div>

              <div className="pt-4 border-t border-sand-200">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-maroon-700 hover:bg-maroon-50 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Router Outlet */}
        <main className="flex-1 min-w-0">
          {children || <Outlet />}
        </main>
      </div>
      </div>
    </BrandGradientBackground>
  );
}
