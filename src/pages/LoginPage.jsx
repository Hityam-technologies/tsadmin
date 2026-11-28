import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { BrandGradientBackground } from '../components/common/BrandGradientBackground';
import homeLogo from '../assets/homeLogo.png';
import { Mail, Lock, ShieldCheck, ArrowRight, Sparkles, Store } from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { billingService } from '../services/billingService';

export function LoginPage() {
  const { login, forgotPassword, isLoading } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetStep, setResetStep] = useState('email');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please provide both administrative email and password.');
      return;
    }

    const res = await login(email, password);
    if (res.success) {
      showToast('Welcome to Tripuraa Sangrahah', 'success');
      const origin = location.state?.from?.pathname || '/';
      navigate(origin, { replace: true });
    } else {
      setError(res.error || 'Invalid credentials or unauthorized role.');
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setResetError('');
    if (!resetEmail.trim()) {
      setResetError('Please enter your email.');
      return;
    }
    setResetSubmitting(true);
    try {
      const res = await forgotPassword(resetEmail.trim());
      if (!res?.success) {
        setResetError(res?.error?.message || 'Unable to send reset code.');
        return;
      }
      setResetCode('');
      setNewPassword('');
      setResetStep('verify');
      showToast(`Reset code dispatched to ${resetEmail.trim()}`, 'info');
    } finally {
      setResetSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetError('');
    const cleanCode = resetCode.trim();
    if (!/^\d{6}$/.test(cleanCode)) {
      setResetError('Enter the 6-digit verification code sent to your email.');
      return;
    }
    if (newPassword.length < 8 || !/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      setResetError('Password must be at least 8 characters and include a special character.');
      return;
    }
    setResetSubmitting(true);
    try {
      const { authService } = await import('../services/authService');
      const res = await authService.resetPassword(resetEmail.trim(), cleanCode, newPassword);
      if (!res?.success) {
        setResetError(res?.error?.message || 'The code is invalid or expired.');
        return;
      }
      showToast('Password updated. Please sign in.', 'success');
      setIsForgotPasswordOpen(false);
      setResetStep('email');
      setEmail(resetEmail.trim());
      setPassword('');
    } finally {
      setResetSubmitting(false);
    }
  };


  return (
    <BrandGradientBackground idPrefix="login_">
      <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-gold-200">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          {/* Brand Logo in Royal Saffron Silk Gradient Badge */}
          <div className="flex justify-center mb-4 px-4">
            <div className="relative rounded-2xl p-4 bg-gradient-to-br from-[#DE7335] via-[#BF5B21] to-[#752809] border border-gold-300/60 shadow-[0_8px_28px_rgba(191,91,33,0.32)] flex items-center justify-center overflow-hidden">
              <div
                className="absolute inset-0 pointer-events-none opacity-35"
                style={{
                  background: 'radial-gradient(ellipse at 50% 20%, rgba(255, 235, 195, 0.6) 0%, transparent 70%)',
                }}
              />
              <img
                src={homeLogo}
                alt="Tripuraa Sangrahah"
                className="relative z-10 w-full max-w-[240px] h-auto max-h-24 object-contain brand-logo-on-saffron"
              />
            </div>
          </div>
          <p className="text-xs uppercase tracking-widest text-gold-700 font-bold font-sans">
            Heritage Handloom Store &bull; Management Portal
          </p>
        </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl sm:px-10 border border-gold-200">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3.5 rounded-xl bg-maroon-50 border border-maroon-300 text-maroon-800 text-xs flex items-center gap-2">
                <span className="font-semibold">{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                Admin Email
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-4 w-4 text-charcoal-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@tripuraa.in"
                  className="block w-full rounded-xl border border-sand-300 pl-10 pr-3 py-2.5 text-xs text-charcoal-900 placeholder:text-charcoal-400 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-charcoal-800">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setResetStep('email');
                    setResetError('');
                    setResetCode('');
                    setNewPassword('');
                    setResetEmail(email);
                    setIsForgotPasswordOpen(true);
                  }}
                  className="text-[11px] font-medium text-gold-700 hover:text-gold-800"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative rounded-xl shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-4 w-4 text-charcoal-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="block w-full rounded-xl border border-sand-300 pl-10 pr-3 py-2.5 text-xs text-charcoal-900 placeholder:text-charcoal-400 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-gold-600 hover:bg-gold-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500 shadow-md shadow-gold-600/20 transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  'Authenticating...'
                ) : (
                  <>
                    Sign In to Portal <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

        </div>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => {
              billingService.clearStaffSession();
              navigate('/billing-access');
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gold-50/80 hover:bg-gold-100 border border-gold-300 text-xs font-bold text-gold-900 transition-all shadow-2xs cursor-pointer"
          >
            <Store className="w-4 h-4 text-gold-700" />
            <span>Store Billing Access</span>
            <ArrowRight className="w-3.5 h-3.5 text-gold-700" />
          </button>
        </div>

        <div className="mt-4 text-center text-xs text-charcoal-500 flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-gold-600" />
          <span>Tripuraa Sangrahah Weavers Guild &bull; Authorized Personnel Only</span>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        title="Administrative Password Recovery"
        subtitle={
          resetStep === 'verify'
            ? `Enter the 6-digit code sent to ${resetEmail}`
            : 'Send a 6-digit recovery code to your registered email'
        }
        maxWidth="max-w-md"
      >
        {resetStep === 'verify' ? (
          <form onSubmit={handleResetPassword} className="space-y-4 pt-2">
            <div className="rounded-xl bg-gold-50/70 border border-gold-200 px-3.5 py-2.5 flex items-center gap-2 text-xs text-charcoal-700">
              <Sparkles className="w-4 h-4 text-gold-700 flex-shrink-0" />
              <span>
                Check <span className="font-semibold text-charcoal-900">{resetEmail}</span> (and spam) for your 6-digit code.
              </span>
            </div>
            {resetError && (
              <div className="p-3 rounded-xl bg-maroon-50 border border-maroon-300 text-maroon-800 text-xs font-semibold">
                {resetError}
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                6-Digit Verification Code
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                placeholder="123456"
                className="w-full rounded-xl border border-sand-300 px-3.5 py-2 text-xs tracking-widest font-mono text-charcoal-900 focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="At least 8 characters + 1 special symbol"
                className="w-full rounded-xl border border-sand-300 px-3.5 py-2 text-xs text-charcoal-900 focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
              />
            </div>
            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setResetStep('email');
                  setResetError('');
                }}
                className="text-xs font-medium text-charcoal-600 hover:text-charcoal-900"
              >
                Change email
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsForgotPasswordOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-sand-300 text-xs text-charcoal-700 hover:bg-sand-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetSubmitting}
                  className="px-4 py-2 rounded-xl bg-gold-600 hover:bg-gold-700 text-white text-xs font-semibold shadow-sm disabled:opacity-50"
                >
                  {resetSubmitting ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <form onSubmit={handleForgotPassword} className="space-y-4 pt-2">
            {resetError && (
              <div className="p-3 rounded-xl bg-maroon-50 border border-maroon-300 text-maroon-800 text-xs font-semibold">
                {resetError}
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                Registered Work Email
              </label>
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
                placeholder="admin@tripuraa.in"
                className="w-full rounded-xl border border-sand-300 px-3.5 py-2 text-xs text-charcoal-900 focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsForgotPasswordOpen(false)}
                className="px-3.5 py-2 rounded-xl border border-sand-300 text-xs text-charcoal-700 hover:bg-sand-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={resetSubmitting}
                className="px-4 py-2 rounded-xl bg-gold-600 hover:bg-gold-700 text-white text-xs font-semibold shadow-sm disabled:opacity-50"
              >
                {resetSubmitting ? 'Sending...' : 'Send Code'}
              </button>
            </div>
          </form>
        )}
      </Modal>
      </div>
    </BrandGradientBackground>
  );
}
