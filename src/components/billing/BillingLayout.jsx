import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrandGradientBackground } from '../common/BrandGradientBackground';
import homeLogo from '../../assets/homeLogo.png';
import {
  LogOut,
  Receipt,
  Users,
  BarChart3,
  CalendarCheck2,
  ShoppingBag,
  Lock,
  LayoutDashboard,
} from 'lucide-react';
import { billingService } from '../../services/billingService';

export function BillingLayout({
  activeTab,
  setActiveTab,
  heldBillsCount: _heldBillsCount = 0,
  currentUser,
  onLogout,
  onLockPos,
  todaySummary: _todaySummary,
  children,
}) {
  const navigate = useNavigate();
  const [timeString, setTimeString] = useState('');
  const [dateString, setDateString] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
      setDateString(
        now.toLocaleDateString('en-IN', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const navTabs = [
    { id: 'pos', label: 'New Bill (POS)', icon: ShoppingBag },
    { id: 'recent', label: 'Recent Bills', icon: Receipt },
    { id: 'customers', label: 'Customer Search', icon: Users },
    { id: 'reports', label: 'Sales Reports', icon: BarChart3 },
  ];

  return (
    <div className="billing-app-root fixed inset-0 w-full h-full max-h-screen overflow-hidden flex flex-col font-sans text-charcoal-900 selection:bg-gold-200">
      <BrandGradientBackground idPrefix="billing_" className="w-full h-full max-h-screen flex flex-col overflow-hidden">
        <div className="relative z-10 max-w-[1720px] mx-auto w-full px-3 sm:px-5 pt-2 pb-2.5 flex-1 flex flex-col min-h-0 h-full max-h-full overflow-hidden">
          {/* =========================================================================
              TOP ROW: Standalone Big Brand Medallion (Left) + Cut Nav Bar (Right)
             ========================================================================= */}
          <header className="flex-shrink-0 mb-2 flex items-center gap-2.5 sm:gap-3 w-full">
            {/* 1. SEPARATE BIG BRAND LOGO (Outside the bar on the same line) */}
            <div className="flex-shrink-0">
              <div className="h-15 sm:h-16 md:h-17 px-5 sm:px-6 md:px-7 rounded-2xl sm:rounded-[22px] bg-gradient-to-br from-[#DE7335] via-[#BF5B21] to-[#752809] border border-gold-300/70 shadow-[0_6px_20px_rgba(186,79,26,0.25)] flex items-center justify-center transition-all hover:scale-[1.02]">
                <img
                  src={homeLogo}
                  alt="Tripuraa Sangrahah"
                  className="h-11 sm:h-12 md:h-13 w-auto max-w-[240px] sm:max-w-[280px] md:max-w-[320px] object-contain brand-logo-on-saffron drop-shadow-sm"
                />
              </div>
            </div>

            {/* 2. THE CUT WHITE TOP BAR: Nav Pills & Actions (starts after logo) */}
            <div className="flex-1 min-w-0 h-15 sm:h-16 md:h-17 bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-[22px] border border-sand-200/90 shadow-[0_2px_14px_rgba(0,0,0,0.02)] px-4 sm:px-5 flex items-center justify-between gap-3">
              {/* Center: Navigation Pills */}
              <nav className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5">
                {navTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                        isActive
                          ? 'bg-charcoal-900 text-white shadow-xs'
                          : 'bg-sand-50/80 hover:bg-white text-charcoal-700 hover:text-charcoal-900 border border-sand-200/80 shadow-2xs'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-gold-400' : 'text-charcoal-400'}`} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>

              {/* Right: Clock & Action Icon Buttons */}
              <div className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0">
                {currentUser && (
                  <button
                    type="button"
                    onClick={() => navigate('/', { replace: true })}
                    title="Admin portal"
                    className="flex items-center gap-1.5 h-9.5 sm:h-10 px-3 rounded-xl border border-sand-200 bg-white hover:bg-sand-50 text-charcoal-800 text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
                  >
                    <LayoutDashboard className="w-4 h-4 text-gold-700" />
                    <span>Admin portal</span>
                  </button>
                )}

                {/* Real-time Clock and Date (Stacked up and down like Admin Portal) */}
                <div className="hidden sm:flex flex-col text-right leading-tight pr-3 border-r border-sand-200">
                  <div className="flex items-center justify-end gap-1.5 text-xs sm:text-sm font-extrabold text-charcoal-900 tracking-tight font-mono">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                    <span>{timeString || '-'}</span>
                  </div>
                  <span className="text-[10px] sm:text-xs text-charcoal-500 font-bold">
                    {dateString || '-'}
                  </span>
                </div>

                {/* Day Closing Icon Button */}
                <button
                  onClick={() => setActiveTab('close')}
                  title="Day Closing Register"
                  className="w-9.5 h-9.5 sm:w-10 sm:h-10 rounded-xl border border-gold-300/80 bg-gold-50/80 hover:bg-gold-100 flex items-center justify-center text-gold-900 transition-colors shadow-2xs cursor-pointer"
                  aria-label="Day Closing"
                >
                  <CalendarCheck2 className="w-4.5 h-4.5 text-gold-700" />
                </button>

                {/* Lock POS Terminal */}
                <button
                  onClick={onLockPos || (() => {
                    billingService.clearStaffSession();
                    navigate('/billing-access');
                  })}
                  title="Lock POS Terminal (PIN Required to Unlock)"
                  className="w-9.5 h-9.5 sm:w-10 sm:h-10 rounded-xl border border-sand-200 bg-white hover:bg-sand-100 flex items-center justify-center text-charcoal-600 hover:text-charcoal-900 transition-colors shadow-2xs cursor-pointer"
                  aria-label="Lock POS"
                >
                  <Lock className="w-4.5 h-4.5 text-gold-600" />
                </button>

                {/* Sign Out */}
                {onLogout && (
                  <button
                    onClick={onLogout}
                    title="Sign out of portal"
                    className="w-9.5 h-9.5 sm:w-10 sm:h-10 rounded-xl border border-sand-200 bg-white hover:bg-maroon-50 hover:border-maroon-200 flex items-center justify-center text-charcoal-500 hover:text-maroon-700 transition-colors shadow-2xs cursor-pointer"
                    aria-label="Sign Out"
                  >
                    <LogOut className="w-4.5 h-4.5" />
                  </button>
                )}
              </div>
            </div>
          </header>

          {/* =========================================================================
              MAIN WORKSPACE: Fits exact remaining height, never scrolls outer window
             ========================================================================= */}
          <main className="flex-1 min-h-0 h-0 flex flex-col overflow-hidden">{children}</main>
        </div>
      </BrandGradientBackground>
    </div>
  );
}
