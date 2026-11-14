import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrandGradientBackground } from '../components/common/BrandGradientBackground';
import homeLogo from '../assets/homeLogo.png';
import { billingService } from '../services/billingService';
import { useAuth } from '../context/AuthContext';
import { SessionGate } from '../components/auth/SessionGate';
import { useToast } from '../context/ToastContext';
import {
  Lock,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Delete,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';

export function BillingAccessPage({ onPinSuccess }) {
  const navigate = useNavigate();
  const { currentUser, isRestoring, logout } = useAuth();
  const { showToast } = useToast();

  const [pinDigits, setPinDigits] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  const inputRefs = useRef([]);

  // Auto-focus first input box
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // The standalone PIN page is for the counter. An admin already signed in goes straight to the register.
  useEffect(() => {
    if (onPinSuccess || isRestoring || !currentUser) return;
    navigate('/billing', { replace: true });
  }, [onPinSuccess, isRestoring, currentUser, navigate]);

  const fullPin = pinDigits.join('');

  // Handle single digit changes & auto advance
  const handleDigitChange = (index, value) => {
    const char = value.replace(/[^0-9]/g, '').slice(-1);
    const newDigits = [...pinDigits];
    newDigits[index] = char;
    setPinDigits(newDigits);
    setError('');

    // Advance to next box if filled
    if (char && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }

    // Auto submit if 6th digit entered
    if (char && index === 5) {
      const completePin = newDigits.join('');
      if (completePin.length === 6) {
        verifyPinCode(completePin);
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !pinDigits[index] && index > 0) {
      // Move back on backspace if current is empty
      const prevIndex = index - 1;
      const newDigits = [...pinDigits];
      newDigits[prevIndex] = '';
      setPinDigits(newDigits);
      if (inputRefs.current[prevIndex]) {
        inputRefs.current[prevIndex].focus();
      }
    } else if (e.key === 'Enter' && fullPin.length === 6) {
      verifyPinCode(fullPin);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (!pasted) return;

    const newDigits = ['', '', '', '', '', ''];
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i];
    }
    setPinDigits(newDigits);

    if (pasted.length === 6) {
      verifyPinCode(pasted);
    } else if (inputRefs.current[pasted.length]) {
      inputRefs.current[pasted.length].focus();
    }
  };

  const verifyPinCode = async (pinToVerify) => {
    setIsLoading(true);
    setError('');

    try {
      const res = await billingService.verifyPin(pinToVerify);

      if (res.success) {
        setIsSuccess(true);
        showToast('Access Granted — Register Unlocked', 'success');
        setTimeout(() => {
          if (onPinSuccess) {
            onPinSuccess(res.staff);
          } else {
            navigate('/billing', { replace: true });
          }
        }, 350);
        return;
      }
      setError(res.error || 'Invalid 6-digit PIN. Please try again.');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      setPinDigits(['', '', '', '', '', '']);
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    } catch {
      setError('Verification service unavailable. Please retry.');
    }
    setIsLoading(false);
  };

  // On-screen Numpad click handler (tablet / touchscreen support)
  const handleNumpadPress = (digit) => {
    const firstEmpty = pinDigits.findIndex((d) => !d);
    if (firstEmpty !== -1) {
      handleDigitChange(firstEmpty, String(digit));
    }
  };

  const handleNumpadBackspace = () => {
    const lastFilled = pinDigits.map((d, i) => (d ? i : -1)).filter((i) => i !== -1).pop();
    if (lastFilled !== undefined) {
      const newDigits = [...pinDigits];
      newDigits[lastFilled] = '';
      setPinDigits(newDigits);
      if (inputRefs.current[lastFilled]) {
        inputRefs.current[lastFilled].focus();
      }
    }
  };

  const handleClearAll = () => {
    setPinDigits(['', '', '', '', '', '']);
    setError('');
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  };

  const handleQuickDemoPin = () => {
    const demo = ['1', '2', '3', '4', '5', '6'];
    setPinDigits(demo);
    verifyPinCode('123456');
  };

  if (isLoading || isSuccess || (!onPinSuccess && (isRestoring || currentUser))) {
    return <SessionGate message="Opening the register…" />;
  }

  return (
    <BrandGradientBackground idPrefix="billing_entry_">
      <div className="min-h-screen flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8 selection:bg-gold-200 font-sans">
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
                className="relative z-10 w-full max-w-[230px] h-auto max-h-20 object-contain brand-logo-on-saffron"
              />
            </div>
          </div>

          <h2 className="text-lg font-serif font-extrabold text-charcoal-900 tracking-tight">
            Store Billing Access
          </h2>
          <p className="text-xs uppercase tracking-widest text-gold-700 font-bold mt-1">
            Flagship Boutique &bull; Counter POS Terminal
          </p>
        </div>

        {/* PIN Entry Card */}
        <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
          <div
            className={`bg-white/95 backdrop-blur-xl py-7 px-6 shadow-xl rounded-2xl sm:px-10 border transition-all duration-300 ${
              isShaking ? 'border-maroon-400 animate-bounce' : 'border-gold-200'
            }`}
          >
            {/* Instruction */}
            <div className="text-center mb-5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sand-100 text-charcoal-700 border border-sand-200">
                <KeyRound className="w-3.5 h-3.5 text-gold-600" />
                <span>Enter 6-Digit Staff Security PIN</span>
              </span>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-maroon-50 border border-maroon-300 text-maroon-800 text-xs flex items-center gap-2">
                <span className="font-semibold">{error}</span>
              </div>
            )}

            {/* 6 Digit Input Boxes */}
            <div className="flex justify-center items-center gap-2 sm:gap-2.5 mb-6">
              {pinDigits.map((digit, idx) => (
                <div key={idx} className="relative">
                  <input
                    ref={(el) => (inputRefs.current[idx] = el)}
                    type="password"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    onPaste={handlePaste}
                    disabled={isLoading || isSuccess}
                    className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-mono font-bold rounded-xl border transition-all duration-200 outline-none ${
                      digit
                        ? 'border-gold-500 bg-gold-50/60 text-charcoal-900 shadow-sm ring-1 ring-gold-400/50'
                        : 'border-sand-300 bg-white hover:border-gold-300 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20'
                    }`}
                  />
                  {digit ? (
                    <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-charcoal-900 font-extrabold text-2xl">
                      &bull;
                    </span>
                  ) : null}
                </div>
              ))}
            </div>

            {/* Touch-Friendly On-Screen Numpad */}
            <div className="grid grid-cols-3 gap-2 max-w-[280px] mx-auto mb-5">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleNumpadPress(num)}
                  disabled={isLoading || isSuccess}
                  className="py-2.5 rounded-xl border border-sand-200 bg-white hover:bg-gold-50/70 active:bg-gold-100 text-charcoal-800 text-base font-bold font-mono shadow-2xs transition-all cursor-pointer"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={handleClearAll}
                disabled={isLoading || isSuccess}
                className="py-2.5 rounded-xl border border-sand-200 bg-sand-50 hover:bg-sand-100 text-charcoal-600 text-xs font-bold transition-all cursor-pointer"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => handleNumpadPress(0)}
                disabled={isLoading || isSuccess}
                className="py-2.5 rounded-xl border border-sand-200 bg-white hover:bg-gold-50/70 active:bg-gold-100 text-charcoal-800 text-base font-bold font-mono shadow-2xs transition-all cursor-pointer"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleNumpadBackspace}
                disabled={isLoading || isSuccess}
                className="py-2.5 rounded-xl border border-sand-200 bg-sand-50 hover:bg-sand-100 text-charcoal-600 text-xs font-bold transition-all flex items-center justify-center cursor-pointer"
              >
                <Delete className="w-4 h-4" />
              </button>
            </div>

            {/* Validate / Continue Button */}
            <button
              type="button"
              onClick={() => verifyPinCode(fullPin)}
              disabled={isLoading || fullPin.length !== 6 || isSuccess}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-extrabold text-white bg-gold-600 hover:bg-gold-700 disabled:opacity-40 shadow-md shadow-gold-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <span>Verifying PIN...</span>
              ) : isSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Access Granted</span>
                </>
              ) : (
                <>
                  <span>Unlock Billing Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* One-Click Quick Fill Demo PIN */}
            <div className="mt-4 pt-4 border-t border-sand-200 text-center">
              <button
                type="button"
                onClick={handleQuickDemoPin}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-gold-900 bg-gold-50/80 hover:bg-gold-100 border border-gold-300/80 transition-colors cursor-pointer shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-gold-600" />
                <span>Quick Fill Demo PIN (123456)</span>
              </button>
            </div>
          </div>

          {/* =========================================================================
              CRITICAL REQUIREMENT: Small, subtle "Admin Portal Login" link underneath PIN
             ========================================================================= */}
          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={async () => {
                billingService.clearStaffSession();
                await logout();
                navigate('/login', { replace: true });
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-charcoal-500 hover:text-charcoal-900 transition-colors group cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-gold-600 group-hover:scale-110 transition-transform" />
              <span>Admin Portal Login</span>
              <ArrowRight className="w-3 h-3 text-charcoal-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <div className="mt-4 text-center text-[11px] text-charcoal-400 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-gold-600" />
            <span>Tripuraa Sangrahah Weavers Guild &bull; Authorized Staff Terminal</span>
          </div>
        </div>
      </div>
    </BrandGradientBackground>
  );
}
