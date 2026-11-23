import React, { useCallback, useEffect, useState } from 'react';
import { Download, ArrowLeft } from 'lucide-react';
import { tryOnUsageService } from '../services/tryOnUsageService';
import { TableSkeleton } from '../components/common/Skeleton';
import { useToast } from '../context/ToastContext';
import { CustomerAvatar } from '../components/common/CustomerAvatar';

function money(value) {
  if (value == null || value === '') return '—';
  const negative = Number(value) < 0;
  const text = `₹${Math.abs(Number(value)).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  return negative ? `-${text}` : text;
}

function rupees(value) {
  if (value === '' || value == null) return null;
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return number;
}

export function TryOnUsagePage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [report, setReport] = useState(null);
  const [detail, setDetail] = useState(null);
  const [userId, setUserId] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [fashnPrice, setFashnPrice] = useState('');
  const [customerPrice, setCustomerPrice] = useState('20');
  const [freeTries, setFreeTries] = useState('3');
  const [pricesReady, setPricesReady] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await tryOnUsageService.list({ search, sort: 'lastTryOn', direction: 'desc', page, limit: 20 });
    if (res.success) setReport(res.data);
    setLoading(false);
  }, [search, page]);

  useEffect(() => {
    if (!userId) load();
  }, [userId, load]);

  useEffect(() => {
    const settings = report?.settings;
    if (!settings || pricesReady) return;
    setFashnPrice(settings.rupeesPerCredit == null ? '' : String(settings.rupeesPerCredit));
    setCustomerPrice(String(settings.paidTryOnPriceInr ?? 20));
    setFreeTries(String(settings.freeTryOnQuota ?? 3));
    setPricesReady(true);
  }, [report, pricesReady]);

  useEffect(() => {
    if (!userId) return undefined;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const res = await tryOnUsageService.detail(userId, false);
      if (!cancelled && res.success) setDetail(res.data);
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const fashn = rupees(fashnPrice);
  const customer = rupees(customerPrice);
  const profitEach = fashn == null || customer == null ? null : customer - fashn;

  const savePrices = async () => {
    if (customer == null || customer < 0) {
      showToast('Enter what the customer pays.', 'error');
      return;
    }
    const free = Number(freeTries);
    if (freeTries === '' || !Number.isInteger(free) || free < 0 || free > 100) {
      showToast('Free try-ons must be a whole number from 0 to 100.', 'error');
      return;
    }
    if (fashnPrice !== '' && (fashn == null || fashn < 0)) {
      showToast('Enter what FASHN charges you.', 'error');
      return;
    }
    setSaving(true);
    const body = {
      paidTryOnPriceInr: customer,
      freeTryOnQuota: free,
    };
    if (fashn != null) body.rupeesPerCredit = fashn;
    const res = await tryOnUsageService.saveSettings(body);
    setSaving(false);
    if (!res.success) {
      showToast(res.error?.message || 'The prices were not saved.', 'error');
      return;
    }
    showToast('Try-on prices saved. The app will show the customer price.', 'success');
    setPricesReady(false);
    load();
  };

  const download = async () => {
    try {
      const blob = await tryOnUsageService.exportCsv({ search, sort: 'lastTryOn', direction: 'desc' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'tryon-usage.csv';
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  if (userId) {
    const person = detail?.summary;
    return (
      <div className="space-y-4">
        <button type="button" onClick={() => setUserId(null)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-charcoal-600">
          <ArrowLeft className="w-4 h-4" /> All customers
        </button>
        {loading || !person ? <TableSkeleton rows={4} cols={4} /> : (
          <div className="bg-white rounded-[22px] border border-sand-200 p-5">
            <div className="flex items-center gap-3">
              <CustomerAvatar name={person.name} avatarUrl={person.avatarUrl} size="lg" />
              <div>
                <h1 className="text-xl font-bold text-charcoal-900">{person.name}</h1>
                <p className="text-xs text-charcoal-500 mt-1">{person.phone} · {person.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              <Stat label="Try-ons done" value={person.tryOnsCompleted} />
              <Stat label="Free left" value={person.freeRemaining} />
              <Stat label="They paid" value={money(person.moneyNetInr)} />
              <Stat label="Your cost" value={money(person.fashnCostInr)} />
              <Stat label="Profit" value={money(person.netMarginInr)} warn={person.marginNegative} />
            </div>
            {person.fashnCreditsUnknown > 0 ? (
              <p className="text-[11px] text-charcoal-500 mt-3">
                {person.fashnCreditsUnknown} try-ons have no FASHN credit count, so they are left out of the cost.
              </p>
            ) : null}
          </div>
        )}
      </div>
    );
  }

  const totals = report?.totals;
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-[22px] border border-sand-200 p-5">
        <h1 className="text-2xl font-bold text-charcoal-900">Try-On prices</h1>
        <p className="text-sm text-charcoal-500 mt-1">
          Enter what FASHN charges you, and what the customer pays in the app. Profit is the difference.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
          <Field label="What you pay FASHN (₹ per credit)" value={fashnPrice} onChange={setFashnPrice} hint="One try-on usually uses 1 credit. Use the price on your FASHN bill." />
          <Field label="What the customer pays (₹ per try-on)" value={customerPrice} onChange={setCustomerPrice} hint="This is the price shown in the app after the free try-ons." />
          <Field label="Free try-ons for each new customer" value={freeTries} onChange={setFreeTries} hint="Only customers who have not tried yet pick this up." />
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-charcoal-900">
            {profitEach == null
              ? 'Enter both prices to see the profit on one paid try-on.'
              : profitEach < 0
                ? `On one paid try-on you lose ${money(Math.abs(profitEach))}. The customer pays ${money(customer)} and FASHN costs you ${money(fashn)}.`
                : `On one paid try-on you keep ${money(profitEach)}. The customer pays ${money(customer)} and FASHN costs you ${money(fashn)}.`}
          </p>
          <button type="button" onClick={savePrices} disabled={saving} className="rounded-xl bg-gold-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60">
            {saving ? 'Saving…' : 'Save prices'}
          </button>
        </div>
        <p className="text-[11px] text-charcoal-500 mt-3">
          The ₹20 you saw before was the starting customer price. Change it here and save. The app shows this price. Payment collection is not turned on, so a try-on is not blocked when the free ones are used.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Try-ons done" value={totals?.tryOnsCompleted ?? '—'} />
        <Stat label="Customers paid" value={money(totals?.revenueInr)} />
        <Stat label="You paid FASHN" value={money(totals?.fashnCostInr)} />
        <Stat label="Profit so far" value={money(totals?.netMarginInr)} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <input
          value={search}
          onChange={(event) => { setPage(1); setSearch(event.target.value); }}
          placeholder="Search name or phone"
          className="rounded-xl border border-sand-300 px-3 py-2 text-sm"
        />
        <button type="button" onClick={download} className="inline-flex items-center gap-1.5 rounded-xl border border-sand-300 bg-white px-3 py-2 text-xs font-semibold text-charcoal-700">
          <Download className="w-3.5 h-3.5" /> Download
        </button>
      </div>

      <div className="bg-white rounded-[22px] border border-sand-200 overflow-hidden">
        {loading ? <TableSkeleton rows={8} cols={6} /> : (    
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-sand-50 text-charcoal-500">
                <tr>
                  {['Customer', 'Try-ons', 'Free left', 'They paid', 'Your cost', 'Profit'].map((heading) => (
                    <th key={heading} className="px-3 py-3 font-semibold">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-100">
                {(report?.items || []).map((row) => (
                  <tr key={row.userId} className="cursor-pointer hover:bg-sand-50" onClick={() => setUserId(row.userId)}>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2.5">
                        <CustomerAvatar name={row.name} avatarUrl={row.avatarUrl} size="sm" />
                        <div>
                          <div className="font-semibold text-charcoal-900">{row.name}</div>
                          <div className="text-[11px] text-charcoal-500">{row.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">{row.tryOnsCompleted}</td>
                    <td className="px-3 py-3">{row.freeRemaining}</td>
                    <td className="px-3 py-3">{money(row.moneyNetInr)}</td>
                    <td className="px-3 py-3">{money(row.fashnCostInr)}</td>
                    <td className={`px-3 py-3 font-semibold ${row.marginNegative ? 'text-maroon-700' : ''}`}>{money(row.netMarginInr)}</td>
                  </tr>
                ))}
                {(report?.items || []).length === 0 && (
                  <tr><td colSpan={6} className="px-3 py-8 text-center text-charcoal-500">No customers yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, hint }) {
  return (
    <label className="text-xs font-semibold text-charcoal-700">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        inputMode="decimal"
        className="mt-1 block w-full rounded-xl border border-sand-300 px-3 py-2 text-sm font-medium text-charcoal-900"
      />
      <span className="mt-1 block text-[11px] font-medium text-charcoal-500">{hint}</span>
    </label>
  );
}

function Stat({ label, value, warn = false }) {
  return (
    <div className="rounded-2xl bg-white border border-sand-200 px-3 py-3">
      <div className="text-[11px] text-charcoal-500">{label}</div>
      <div className={`mt-1 text-lg font-bold ${warn ? 'text-maroon-700' : 'text-charcoal-900'}`}>{value}</div>
    </div>
  );
}
