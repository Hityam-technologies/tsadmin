import React, { useEffect, useState } from 'react';
import { commerceService } from '../services/commerceService';
import { useToast } from '../context/ToastContext';
import { CustomerAvatar } from '../components/common/CustomerAvatar';

function money(amount) {
  return `₹${Number(amount || 0).toLocaleString('en-IN')}`;
}

function when(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function ReferralsPage() {
  const { showToast } = useToast();
  const [settings, setSettings] = useState({
    enabled: true,
    refereeSignupBonus: '500',
    referrerOrderReward: '500',
  });
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const load = React.useCallback(async (nextStatus = status, nextSearch = search) => {
    const [settingsResult, listResult] = await Promise.all([
      commerceService.referralSettings(),
      commerceService.referrals({ status: nextStatus, search: nextSearch }),
    ]);
    if (settingsResult.success && settingsResult.data) {
      setSettings({
        enabled: settingsResult.data.enabled !== false,
        refereeSignupBonus: String(settingsResult.data.refereeSignupBonus ?? 0),
        referrerOrderReward: String(settingsResult.data.referrerOrderReward ?? 0),
      });
    }
    if (listResult.success) setRows(listResult.data?.items || []);
  }, [status, search]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    const result = await commerceService.saveReferralSettings({
      enabled: settings.enabled,
      refereeSignupBonus: Number(settings.refereeSignupBonus) || 0,
      referrerOrderReward: Number(settings.referrerOrderReward) || 0,
    });
    setSaving(false);
    if (!result.success) {
      showToast(result.error?.message || 'Referral settings were not saved.', 'error');
      return;
    }
    showToast('Referral cash updated. New signups use these amounts.', 'success');
    load();
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-[22px] border border-sand-200 p-5">
        <h1 className="text-2xl font-bold text-charcoal-900">Referrals</h1>
        <p className="text-sm text-charcoal-500 mt-1">
          A new customer who enters a friend’s code gets store cash as soon as the email code is verified.
          The friend gets store cash when that customer places a first order of any amount.
          Amounts already promised stay as they were. Turning rewards off stops new codes and new payouts.
          A first order placed while rewards are off does not pay the referrer later.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
          <label className="text-xs font-semibold text-charcoal-700">
            Signup cash for the new customer (₹)
            <input
              value={settings.refereeSignupBonus}
              onChange={(event) => setSettings({ ...settings, refereeSignupBonus: event.target.value.replace(/[^\d]/g, '') })}
              className="mt-1 block w-full rounded-xl border border-sand-300 px-3 py-2 text-sm font-medium"
            />
          </label>
          <label className="text-xs font-semibold text-charcoal-700">
            Cash for the referrer on first order (₹)
            <input
              value={settings.referrerOrderReward}
              onChange={(event) => setSettings({ ...settings, referrerOrderReward: event.target.value.replace(/[^\d]/g, '') })}
              className="mt-1 block w-full rounded-xl border border-sand-300 px-3 py-2 text-sm font-medium"
            />
          </label>
          <label className="text-xs font-semibold text-charcoal-700 flex items-end gap-2 pb-2">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(event) => setSettings({ ...settings, enabled: event.target.checked })}
            />
            Rewards are on
          </label>
        </div>
        <button type="button" disabled={saving} onClick={save} className="mt-4 rounded-xl bg-gold-600 px-4 py-2 text-xs font-semibold text-white">
          {saving ? 'Saving…' : 'Save referral cash'}
        </button>
      </div>

      <div className="bg-white rounded-[22px] border border-sand-200 p-5">
        <div className="flex flex-col md:flex-row gap-3 md:items-end">
          <label className="text-xs font-semibold text-charcoal-700 flex-1">
            Search name, email, phone, or code
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="mt-1 block w-full rounded-xl border border-sand-300 px-3 py-2 text-sm font-medium"
            />
          </label>
          <label className="text-xs font-semibold text-charcoal-700">
            Status
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                load(event.target.value, search);
              }}
              className="mt-1 block w-full rounded-xl border border-sand-300 px-3 py-2 text-sm"
            >
              <option value="all">All</option>
              <option value="PENDING">Pending</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </label>
          <button type="button" onClick={() => load()} className="rounded-xl border border-sand-300 px-4 py-2 text-xs font-semibold">
            Search
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[22px] border border-sand-200 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-sand-50 text-charcoal-500">
            <tr>
              {['New customer', 'Referrer', 'Signup cash', 'Order reward', 'Status', 'Joined'].map((heading) => (
                <th key={heading} className="px-3 py-3 font-semibold">{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-sand-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-charcoal-500">No referrals yet.</td>
              </tr>
            ) : rows.map((row) => (
              <tr key={row.id}>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <CustomerAvatar name={row.referee?.name} avatarUrl={row.referee?.avatarUrl} size="sm" />
                    <div>
                      <div className="font-semibold">{row.referee?.name}</div>
                      <div className="text-[11px] text-charcoal-500">{row.referee?.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <CustomerAvatar name={row.referrer?.name} avatarUrl={row.referrer?.avatarUrl} size="sm" />
                    <div>
                      <div className="font-semibold">{row.referrer?.name}</div>
                      <div className="text-[11px] text-charcoal-500">{row.referrer?.code}</div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3">{money(row.refereeSignupBonus)}</td>
                <td className="px-3 py-3">{money(row.referrerReward)}</td>
                <td className="px-3 py-3">{row.statusLabel}</td>
                <td className="px-3 py-3">{when(row.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
