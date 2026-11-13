import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { formatINR } from '../../lib/utils';
import { billingService } from '../../services/billingService';
import {
  Banknote,
  QrCode,
  CreditCard,
  Split,
  CheckCircle2,
  ShieldCheck,
  Phone,
  UserCheck,
  UserPlus,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';

export function PaymentModal({
  isOpen,
  onClose,
  grandTotal,
  customer: _initialCustomer,
  onConfirmPayment,
}) {
  // Stepper: 'customer' (Step 1: Phone check) -> 'payment' (Step 2: Collect payment)
  const [step, setStep] = useState('customer');

  // Customer Verification State
  const [phoneInput, setPhoneInput] = useState('');
  const [detectedCustomer, setDetectedCustomer] = useState(null);
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerCity, setNewCustomerCity] = useState('Hyderabad');
  const [isWalkIn, setIsWalkIn] = useState(false);

  // Payment Recording State
  const [paymentMode, setPaymentMode] = useState('cash'); // 'cash' | 'upi' | 'card' | 'split'
  const [isProcessing, setIsProcessing] = useState(false);

  // Cash state
  const [cashReceived, setCashReceived] = useState('');
  // UPI state
  const [upiReference, setUpiReference] = useState('');
  // Card state
  const [cardNetwork, setCardNetwork] = useState('Visa');
  const [cardLast4, setCardLast4] = useState('');
  const [cardAuthCode, setCardAuthCode] = useState('');
  // Split state
  const [splitCash, setSplitCash] = useState('');
  const [splitUpi, setSplitUpi] = useState('');
  const [splitCard, setSplitCard] = useState('');

  // Reset inputs when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('customer');
      setPhoneInput('');
      setDetectedCustomer(null);
      setIsExistingUser(false);
      setNewCustomerName('');
      setNewCustomerCity('Hyderabad');
      setIsWalkIn(false);

      setPaymentMode('cash');
      setCashReceived(String(grandTotal));
      setUpiReference(`UPI/${Date.now().toString().slice(-8)}/ICICI`);
      setCardLast4('');
      setCardAuthCode(`AUTH-${Math.floor(100000 + Math.random() * 900000)}`);
      setSplitCash(String(Math.floor(grandTotal / 2)));
      setSplitUpi(String(grandTotal - Math.floor(grandTotal / 2)));
      setSplitCard('0');
      setIsProcessing(false);
    }
  }, [isOpen, grandTotal]);

  // Live phone number detection
  const handlePhoneChange = (val) => {
    const cleanDigits = val.replace(/\D/g, '').slice(0, 10);
    setPhoneInput(cleanDigits);
    setIsWalkIn(false);

    if (cleanDigits.length >= 7) {
      const applyLookup = (result) => {
        if (!result?.found) {
          setDetectedCustomer(null);
          setIsExistingUser(false);
          return;
        }
        setDetectedCustomer(result.customer);
        setIsExistingUser(true);
        setNewCustomerName(result.customer.name);
      };
      const result = billingService.lookupCustomerByPhone(cleanDigits);
      if (result && typeof result.then === 'function') result.then(applyLookup);
      else applyLookup(result);
    } else {
      setDetectedCustomer(null);
      setIsExistingUser(false);
    }
  };

  // Demo shortcut chip
  const selectDemoCustomer = (phone) => {
    handlePhoneChange(phone);
  };

  // Skip as Walk-in
  const handleProceedAsWalkIn = () => {
    setIsWalkIn(true);
    setDetectedCustomer({
      name: 'Walk-in Guest',
      phone: '',
      city: 'Hyderabad',
      isWalkIn: true,
    });
    setStep('payment');
  };

  // Proceed to Payment Step
  const handleProceedToPayment = () => {
    if (isExistingUser && detectedCustomer) {
      setStep('payment');
    } else if (phoneInput.length >= 10 && newCustomerName.trim()) {
      // New customer registered
      const newCust = {
        name: newCustomerName.trim(),
        phone: `+91 ${phoneInput}`,
        city: newCustomerCity || 'Hyderabad',
        isNew: true,
        isWalkIn: false,
      };
      setDetectedCustomer(newCust);
      setStep('payment');
    } else if (!phoneInput) {
      handleProceedAsWalkIn();
    } else {
      setStep('payment');
    }
  };

  // Current active customer summary
  const activeCustomer = detectedCustomer || {
    name: newCustomerName.trim() || 'Walk-in Guest',
    phone: phoneInput ? `+91 ${phoneInput}` : '',
    city: newCustomerCity || 'Hyderabad',
    isWalkIn: isWalkIn || (!phoneInput && !newCustomerName.trim()),
  };

  // Cash calculations
  const numericCashReceived = Number(cashReceived) || 0;
  const cashChange = Math.max(0, numericCashReceived - grandTotal);
  const isCashInsufficient = numericCashReceived < grandTotal;

  // Split calculations
  const numericSplitCash = Number(splitCash) || 0;
  const numericSplitUpi = Number(splitUpi) || 0;
  const numericSplitCard = Number(splitCard) || 0;
  const totalSplitSum = numericSplitCash + numericSplitUpi + numericSplitCard;
  const splitRemaining = grandTotal - totalSplitSum;

  const handleConfirm = async (e) => {
    e.preventDefault();

    if (paymentMode === 'cash' && isCashInsufficient) {
      return;
    }
    if (paymentMode === 'split' && splitRemaining !== 0) {
      return;
    }

    setIsProcessing(true);
    await new Promise((res) => setTimeout(res, 300));

    let paymentDetails = {
      mode: paymentMode,
      status: 'paid',
      amountReceived: grandTotal,
      changeGiven: 0,
      referenceId: '',
    };

    if (paymentMode === 'cash') {
      paymentDetails = {
        mode: 'cash',
        status: 'paid',
        amountReceived: numericCashReceived,
        changeGiven: cashChange,
        referenceId: `CASH-${Date.now().toString().slice(-6)}`,
      };
    } else if (paymentMode === 'upi') {
      paymentDetails = {
        mode: 'upi',
        status: 'paid',
        amountReceived: grandTotal,
        changeGiven: 0,
        referenceId: upiReference || `UPI/${Date.now().toString().slice(-8)}/ICICI`,
      };
    } else if (paymentMode === 'card') {
      paymentDetails = {
        mode: 'card',
        status: 'paid',
        amountReceived: grandTotal,
        changeGiven: 0,
        cardNetwork,
        cardLast4: cardLast4 || '4288',
        referenceId: cardAuthCode || `TXN-${Date.now().toString().slice(-6)}`,
      };
    } else if (paymentMode === 'split') {
      paymentDetails = {
        mode: 'split',
        status: 'paid',
        amountReceived: grandTotal,
        changeGiven: 0,
        referenceId: `SPLIT-${Date.now().toString().slice(-6)}`,
        splitDetails: {
          cash: numericSplitCash,
          upi: numericSplitUpi,
          card: numericSplitCard,
        },
      };
    }

    setIsProcessing(false);
    onConfirmPayment(paymentDetails, activeCustomer);
  };

  const tenderPresets = [
    { label: 'Exact', value: grandTotal },
    { label: '₹500', value: 500 },
    { label: '₹2,000', value: 2000 },
    { label: '₹5,000', value: 5000 },
    { label: 'Round ₹50k', value: Math.ceil(grandTotal / 50000) * 50000 || 50000 },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={step === 'customer' ? 'Customer Phone Verification' : 'Store Payment & Tax Invoice'}
      subtitle={`Net Payable: ${formatINR(grandTotal)} • 5% Handloom Silk GST Inclusive`}
      maxWidth="max-w-xl"
    >
      <div className="space-y-4 pt-1 font-sans">
        {/* =====================================================================
            FLOW STEPPER: 1. Phone Verification -> 2. Payment & Invoice
           ===================================================================== */}
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-sand-50/90 border border-sand-200 text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[11px] ${
                step === 'customer'
                  ? 'bg-gold-600 text-white'
                  : 'bg-emerald-600 text-white'
              }`}
            >
              {step === 'customer' ? '1' : '✓'}
            </span>
            <span
              className={`font-semibold ${
                step === 'customer' ? 'text-charcoal-900 font-bold' : 'text-emerald-800'
              }`}
            >
              Customer Phone
            </span>
          </div>

          <div className="w-12 h-0.5 bg-sand-300" />

          <div className="flex items-center gap-2">
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[11px] ${
                step === 'payment'
                  ? 'bg-gold-600 text-white'
                  : 'bg-sand-200 text-charcoal-400'
              }`}
            >
              2
            </span>
            <span
              className={`font-semibold ${
                step === 'payment' ? 'text-charcoal-900 font-bold' : 'text-charcoal-400'
              }`}
            >
              Payment &amp; Invoice
            </span>
          </div>
        </div>

        {/* =====================================================================
            STAGE 1: CUSTOMER PHONE NUMBER & AUTOMATIC DATABASE DETECTION
           ===================================================================== */}
        {step === 'customer' && (
          <div className="space-y-3.5">
            {/* Phone Input Box */}
            <div className="p-3.5 rounded-2xl bg-white border border-sand-300 shadow-2xs space-y-3">
              <div>
                <label className="block text-xs font-bold text-charcoal-800 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-gold-600" />
                    <span>Enter Customer Mobile Number</span>
                  </span>
                  <span className="text-[11px] text-charcoal-400 font-normal">
                    Auto-detects database membership
                  </span>
                </label>

                <div className="relative flex items-center">
                  <div className="absolute left-3 flex items-center gap-1 text-charcoal-500 font-semibold text-xs pointer-events-none">
                    <span>🇮🇳 +91</span>
                    <span className="text-sand-300">|</span>
                  </div>

                  <input
                    type="tel"
                    value={phoneInput}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="98234 56789"
                    maxLength={10}
                    autoFocus
                    className="w-full pl-20 pr-4 py-2.5 rounded-xl border border-sand-300 text-base font-mono font-bold text-charcoal-900 placeholder:text-charcoal-300 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 bg-sand-50/30"
                  />
                </div>
              </div>

              {/* Instant Status 1: ALREADY USER DETECTED IN DATABASE */}
              {isExistingUser && detectedCustomer && (
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-gold-50 via-amber-50/70 to-sand-50 border border-gold-300 shadow-xs space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-gold-600 text-white shadow-2xs">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Already User (In Database)</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <h4 className="text-base font-serif font-extrabold text-charcoal-900">
                        {detectedCustomer.name}
                      </h4>
                      <p className="text-xs font-mono text-charcoal-600">
                        {detectedCustomer.phone} &bull; {detectedCustomer.city || 'Hyderabad'}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-charcoal-800">
                        {detectedCustomer.visitsCount || 1} Previous Purchases
                      </div>
                      <div className="text-[11px] text-charcoal-500 font-mono">
                        Spend: {formatINR(detectedCustomer.lifetimeSpend || 0)}
                      </div>
                    </div>
                  </div>

                  <div className="pt-1.5 border-t border-gold-200/80 flex items-center gap-1.5 text-[11px] text-gold-950 font-medium">
                    <Sparkles className="w-3.5 h-3.5 text-gold-600 flex-shrink-0" />
                    <span>Patron recognized automatically. Billing history will be linked.</span>
                  </div>
                </div>
              )}

              {/* Instant Status 2: NEW CUSTOMER (NOT IN DATABASE) */}
              {!isExistingUser && phoneInput.length === 10 && (
                <div className="p-3.5 rounded-xl bg-sand-50 border border-sand-300 space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-charcoal-800 text-white">
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>New Patron (Not in Database)</span>
                    </span>
                    <span className="text-[11px] text-charcoal-500">
                      First-time customer registration
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                      Customer Full Name *
                    </label>
                    <input
                      type="text"
                      value={newCustomerName}
                      onChange={(e) => setNewCustomerName(e.target.value)}
                      placeholder="e.g. Meenakshi Sundaram"
                      className="w-full rounded-xl border border-sand-300 px-3 py-2 text-xs font-medium text-charcoal-900 bg-white focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
                    />
                  </div>

                  <p className="text-[11px] text-charcoal-500">
                    This patron will be automatically saved to Tripuraa Sangrahah database upon billing.
                  </p>
                </div>
              )}

              {/* Quick Select Demo Chips */}
              <div className="pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal-400 block mb-1.5">
                  Or Test with Demo Registered Patrons:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { name: 'Ananya Deshmukh', phone: '9823456789' },
                    { name: 'Sunita Reddy', phone: '9440122334' },
                    { name: 'Padmavathi Chetty', phone: '9701122334' },
                  ].map((patron) => (
                    <button
                      key={patron.phone}
                      type="button"
                      onClick={() => selectDemoCustomer(patron.phone)}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium bg-sand-100 hover:bg-gold-50 text-charcoal-700 hover:text-gold-900 border border-sand-200 hover:border-gold-300 transition-colors cursor-pointer"
                    >
                      {patron.name} ({patron.phone})
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Step 1 Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-sand-200">
              <button
                type="button"
                onClick={handleProceedAsWalkIn}
                className="px-3.5 py-2 rounded-xl border border-sand-300 text-xs font-semibold text-charcoal-600 hover:text-charcoal-900 hover:bg-sand-50 transition-colors cursor-pointer"
              >
                Skip / Walk-in Guest
              </button>

              <button
                type="button"
                onClick={handleProceedToPayment}
                disabled={phoneInput.length > 0 && phoneInput.length < 10}
                className="px-5 py-2.5 rounded-xl bg-gold-600 hover:bg-gold-700 disabled:opacity-40 text-white text-xs font-extrabold shadow-md shadow-gold-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Continue to Payment</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* =====================================================================
            STAGE 2: WHOLE BILLING & PAYMENT FLOW
           ===================================================================== */}
        {step === 'payment' && (
          <div className="space-y-4">
            {/* Customer Summary Bar with Change Button */}
            <div className="p-3 rounded-xl bg-sand-50 border border-sand-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-gold-100 border border-gold-300 flex items-center justify-center text-gold-800 font-bold text-xs flex-shrink-0">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-charcoal-900 truncate">
                      {activeCustomer.name}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-charcoal-500">
                    {activeCustomer.phone || 'Anonymous Walk-in'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStep('customer')}
                className="text-xs font-bold text-gold-800 hover:text-gold-950 underline cursor-pointer flex-shrink-0"
              >
                Change Phone
              </button>
            </div>

            {/* Grand Total Highlight Banner */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-gold-50 via-sand-50 to-gold-50 border border-gold-300 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-gold-800">
                  Total Amount Payable
                </span>
                <h3 className="text-2xl font-serif font-extrabold text-charcoal-900">
                  {formatINR(grandTotal)}
                </h3>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-white/90 border border-gold-300 text-xs font-bold text-gold-900 shadow-2xs flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-gold-600" />
                <span>5% Silk GST Inclusive</span>
              </div>
            </div>

            {/* Payment Mode Selector Tabs */}
            <div>
              <label className="block text-xs font-bold text-charcoal-700 mb-1.5">
                Select Payment Method:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'cash', label: 'Cash', icon: Banknote },
                  { id: 'upi', label: 'UPI / QR', icon: QrCode },
                  { id: 'card', label: 'Card (POS)', icon: CreditCard },
                  { id: 'split', label: 'Split Pay', icon: Split },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isSelected = paymentMode === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setPaymentMode(tab.id)}
                      className={`py-2.5 px-2 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                        isSelected
                          ? 'bg-gold-600 text-white border-gold-600 shadow-xs ring-2 ring-gold-500/30'
                          : 'bg-white hover:bg-sand-50 text-charcoal-700 border-sand-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* TAB 1: CASH PAYMENT */}
            {paymentMode === 'cash' && (
              <div className="space-y-3 p-3.5 rounded-2xl bg-sand-50/70 border border-sand-200">
                <div>
                  <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                    Cash Tendered / Received (₹)
                  </label>
                  <input
                    type="number"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    autoFocus
                    className="w-full rounded-xl border border-sand-300 px-3 py-2 text-sm font-mono font-bold text-charcoal-900 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 bg-white"
                    placeholder="Enter amount received"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-bold text-charcoal-400">Quick Fill:</span>
                  {tenderPresets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCashReceived(String(preset.value))}
                      className="px-2 py-0.5 rounded-lg text-xs font-bold font-mono bg-white hover:bg-gold-50 text-charcoal-700 border border-sand-300 hover:border-gold-300"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <div className="pt-2 border-t border-sand-200 flex items-center justify-between text-xs">
                  <span className="font-semibold text-charcoal-700">Change to Return:</span>
                  <span
                    className={`text-sm font-extrabold font-mono ${
                      isCashInsufficient ? 'text-maroon-700' : 'text-emerald-700'
                    }`}
                  >
                    {isCashInsufficient
                      ? `Short by ${formatINR(grandTotal - numericCashReceived)}`
                      : formatINR(cashChange)}
                  </span>
                </div>
              </div>
            )}

            {/* TAB 2: UPI PAYMENT & DYNAMIC QR */}
            {paymentMode === 'upi' && (
              <div className="p-3.5 rounded-2xl bg-sand-50/70 border border-sand-200 flex flex-col sm:flex-row items-center gap-4">
                <div className="p-3 rounded-2xl bg-white border border-gold-300 shadow-sm flex flex-col items-center text-center flex-shrink-0">
                  <div className="w-28 h-28 bg-sand-100 rounded-xl flex items-center justify-center border border-sand-200 relative overflow-hidden">
                    <svg viewBox="0 0 100 100" className="w-24 h-24 text-charcoal-900">
                      <rect x="5" y="5" width="25" height="25" rx="3" fill="none" stroke="currentColor" strokeWidth="6" />
                      <rect x="12" y="12" width="11" height="11" fill="currentColor" />
                      <rect x="70" y="5" width="25" height="25" rx="3" fill="none" stroke="currentColor" strokeWidth="6" />
                      <rect x="77" y="12" width="11" height="11" fill="currentColor" />
                      <rect x="5" y="70" width="25" height="25" rx="3" fill="none" stroke="currentColor" strokeWidth="6" />
                      <rect x="12" y="77" width="11" height="11" fill="currentColor" />
                      <rect x="42" y="10" width="16" height="6" fill="#C5A253" />
                      <rect x="42" y="24" width="10" height="10" fill="currentColor" />
                      <rect x="42" y="42" width="16" height="16" fill="#C5A253" />
                      <rect x="10" y="42" width="16" height="16" fill="currentColor" />
                      <rect x="70" y="42" width="20" height="8" fill="currentColor" />
                      <rect x="42" y="70" width="10" height="20" fill="currentColor" />
                      <rect x="62" y="65" width="28" height="28" rx="2" fill="currentColor" opacity="0.85" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-gold-900 mt-1">
                    Scan via GPay / PhonePe
                  </span>
                  <span className="text-[9px] text-charcoal-400 font-mono">
                    tripuraa@icici
                  </span>
                </div>

                <div className="flex-1 w-full space-y-2">
                  <div>
                    <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                      Bank UTR / Transaction Reference ID
                    </label>
                    <input
                      type="text"
                      value={upiReference}
                      onChange={(e) => setUpiReference(e.target.value)}
                      className="w-full rounded-xl border border-sand-300 px-3 py-2 text-xs font-mono font-bold text-charcoal-900 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 bg-white"
                      placeholder="UPI/xxxxxxxxxxxx/BANK"
                    />
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Store Soundbox linked &bull; Instant confirmation ready</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: CARD PAYMENT */}
            {paymentMode === 'card' && (
              <div className="p-3.5 rounded-2xl bg-sand-50/70 border border-sand-200 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                      Card Network
                    </label>
                    <select
                      value={cardNetwork}
                      onChange={(e) => setCardNetwork(e.target.value)}
                      className="w-full rounded-xl border border-sand-300 px-3 py-2 text-xs text-charcoal-900 focus:border-gold-500 bg-white"
                    >
                      <option value="Visa">Visa</option>
                      <option value="Mastercard">Mastercard</option>
                      <option value="RuPay">RuPay (Domestic Silk)</option>
                      <option value="Amex">American Express</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                      Last 4 Digits of Card
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      value={cardLast4}
                      onChange={(e) => setCardLast4(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="e.g. 4288"
                      className="w-full rounded-xl border border-sand-300 px-3 py-2 text-xs font-mono text-charcoal-900 focus:border-gold-500 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal-800 mb-1">
                    EDC POS Machine Auth / Approval Code
                  </label>
                  <input
                    type="text"
                    value={cardAuthCode}
                    onChange={(e) => setCardAuthCode(e.target.value)}
                    placeholder="AUTH-928103"
                    className="w-full rounded-xl border border-sand-300 px-3 py-2 text-xs font-mono text-charcoal-900 focus:border-gold-500 bg-white"
                  />
                </div>
              </div>
            )}

            {/* TAB 4: SPLIT PAYMENT */}
            {paymentMode === 'split' && (
              <div className="p-3.5 rounded-2xl bg-sand-50/70 border border-sand-200 space-y-3">
                <p className="text-[11px] text-charcoal-500">
                  Divide total across multiple tender methods:
                </p>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-charcoal-700 mb-1">
                      Cash Portion (₹)
                    </label>
                    <input
                      type="number"
                      value={splitCash}
                      onChange={(e) => setSplitCash(e.target.value)}
                      className="w-full rounded-xl border border-sand-300 px-2.5 py-1.5 text-xs font-mono font-bold text-charcoal-900 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-charcoal-700 mb-1">
                      UPI Portion (₹)
                    </label>
                    <input
                      type="number"
                      value={splitUpi}
                      onChange={(e) => setSplitUpi(e.target.value)}
                      className="w-full rounded-xl border border-sand-300 px-2.5 py-1.5 text-xs font-mono font-bold text-charcoal-900 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-charcoal-700 mb-1">
                      Card Portion (₹)
                    </label>
                    <input
                      type="number"
                      value={splitCard}
                      onChange={(e) => setSplitCard(e.target.value)}
                      className="w-full rounded-xl border border-sand-300 px-2.5 py-1.5 text-xs font-mono font-bold text-charcoal-900 bg-white"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-sand-200 flex items-center justify-between text-xs">
                  <span className="font-semibold text-charcoal-700">Remaining Balance:</span>
                  <span
                    className={`font-mono font-extrabold ${
                      splitRemaining === 0 ? 'text-emerald-700' : 'text-maroon-700'
                    }`}
                  >
                    {splitRemaining === 0
                      ? 'Matched Perfectly (₹0)'
                      : `${splitRemaining > 0 ? 'Remaining' : 'Excess'}: ${formatINR(
                          Math.abs(splitRemaining)
                        )}`}
                  </span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-sand-200">
              <button
                type="button"
                onClick={() => setStep('customer')}
                disabled={isProcessing}
                className="px-3.5 py-2.5 rounded-xl border border-sand-300 text-xs font-bold text-charcoal-700 hover:bg-sand-100 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Customer</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isProcessing}
                  className="px-4 py-2.5 rounded-xl border border-sand-300 text-xs font-bold text-charcoal-700 hover:bg-sand-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={
                    isProcessing ||
                    (paymentMode === 'cash' && isCashInsufficient) ||
                    (paymentMode === 'split' && splitRemaining !== 0)
                  }
                  className="px-5 py-2.5 rounded-xl bg-gold-600 hover:bg-gold-700 disabled:opacity-40 text-white text-xs font-extrabold shadow-md shadow-gold-600/20 transition-all flex items-center gap-2 cursor-pointer"
                >
                  {isProcessing ? (
                    <span>Recording Payment...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm Payment &amp; Generate Invoice</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
