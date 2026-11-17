import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Download, ArrowLeft } from 'lucide-react';
import { tryOnUsageService } from '../services/tryOnUsageService';
import { TableSkeleton } from '../components/common/Skeleton';
import { useToast } from '../context/ToastContext';

function money(value) {
  if (value == null) return 'Set rate';
  const negative = Number(value) < 0;
  const text = `₹${Math.abs(Number(value)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return negative ? `-${text}` : text;
}

function when(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const PRESETS = [
  { id: '', label: 'All users' },
  { id: 'free', label: 'Only free users' },
  { id: 'paying', label: 'Only paying users' },
  { id: 'negative', label: 'Negative margin' },
  { id: 'never', label: 'Never tried' },
  { id: 'high', label: 'High usage' },
  { id: 'spenders', label: 'Top spenders' },
  { id: 'cost', label: 'Top FASHN cost' },
  { id: 'abuse', label: 'Free-quota abuse' },
];

export function TryOnUsagePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [detail, setDetail] = useState(null);
  const [search, setSearch] = useState('');
  const [preset, setPreset] = useState('');
  const [sort, setSort] = useState('lastTryOn');
  const [page, setPage] = useState(1);
  const [rate, setRate] = useState('');
  const [reason, setReason] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const res = await tryOnUsageService.list({ search, preset, sort, direction: 'desc', page, limit: 20 });
    if (res.success) setReport(res.data);
    setLoading(false);
  }, [search, preset, sort, page]);

  useEffect(() => {
    if (rate === '' && report?.settings?.rupeesPerCredit != null) {
      setRate(String(report.settings.rupeesPerCredit));
    }
  }, [report, rate]);

  useEffect(() => {
    if (!userId) load();
  }, [userId, load]);

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

  const saveRate = async () => {
    const res = await tryOnUsageService.saveSettings({
      rupeesPerCredit: Number(rate),
      reason,
    });
    if (!res.success) {
      showToast(res.error?.message || 'The rate was not saved.', 'error');
      return;
    }
    setReason('');
    showToast('FASHN rupee rate saved. Costs were recalculated.', 'success');
    load();
  };

  const download = async () => {
    try {
      const blob = await tryOnUsageService.exportCsv({ search, preset, sort, direction: 'desc' });
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
        <button type="button" onClick={() => navigate('/try-on-usage')} className="inline-flex items-center gap-1.5 text-xs font-semibold text-charcoal-600">
          <ArrowLeft className="w-4 h-4" /> All users
        </button>
        {loading || !person ? <TableSkeleton rows={6} cols={4} /> : (
          <>
            <div className="bg-white rounded-[22px] border border-sand-200 p-5">
              <h1 className="text-xl font-bold text-charcoal-900">{person.name}</h1>
              <p className="text-xs text-charcoal-500 mt-1">{person.phone} · {person.email}</p>
              <p className="text-xs text-charcoal-500 mt-1">Joined {when(person.joinedAt)} · First try-on {when(person.firstTryOnAt)} · Last try-on {when(person.lastTryOnAt)}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 text-sm">
                <Stat label="Completed" value={person.tryOnsCompleted} />
                <Stat label="Failed and released" value={person.tryOnsFailed} />
                <Stat label="Cache hits" value={person.cacheHits} />
                <Stat label="FASHN credits" value={person.fashnCreditsUsed} />
                <Stat label="Free left" value={person.freeRemaining} />
                <Stat label="Paid left" value={person.paidRemaining} />
                <Stat label="Net paid" value={money(person.moneyNetInr)} />
                <Stat label="Net margin" value={money(person.netMarginInr)} warn={person.marginNegative} />
              </div>
              <p className="text-[11px] text-charcoal-500 mt-3">
                Net margin = net money paid minus FASHN credits × ₹{detail.settings?.rupeesPerCredit ?? 'rate not set'} per credit
                {detail.settings?.asOf ? ` (as of ${when(detail.settings.asOf)})` : ''}.
                {person.fashnCreditsUnknown > 0 ? ` ${person.fashnCreditsUnknown} jobs have an unknown FASHN credit header and are not guessed.` : ''}
                {person.marginNegative ? ' This margin is negative because the FASHN cost is higher than the money collected.' : ''}
              </p>
            </div>
            <Panel title="Ledger">
              <Rows rows={detail.ledger} empty="No wallet events yet." render={(entry) => (
                <span>{entry.type} · {entry.bucket} · {entry.tryOns} try-ons · {entry.fashnCredits} FASHN credits · {money(entry.amountInr)} · {when(entry.createdAt)}</span>
              )} />
            </Panel>
            <Panel title="Payments">
              <Rows rows={detail.payments} empty="No try-on payments yet. Saree bills are not included here." render={(entry) => (
                <span>{entry.type} · {entry.tryOns} try-ons · {money(entry.amountInr)} · {entry.note || '-'} · {when(entry.createdAt)}</span>
              )} />
            </Panel>
            <Panel title="Jobs">
              <Rows rows={detail.jobs} empty="No try-on jobs." render={(job) => (
                <span>{job.status}{job.cacheHit ? ' · cache hit' : ''} · {job.model} · {job.customerBucket} · {job.fashnCreditsKnown ? `${job.fashnCreditsUsed} FASHN credits` : 'FASHN credits unknown'} · {when(job.createdAt)}</span>
              )} />
            </Panel>
          </>
        )}
      </div>
    );
  }

  const totals = report?.totals;
  const settings = report?.settings;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-charcoal-900">Try-on usage</h1>
          <p className="text-xs text-charcoal-500 mt-1">Customer try-ons and the FASHN credits you pay are kept separate.</p>
        </div>
        <button type="button" onClick={download} className="inline-flex items-center gap-1.5 rounded-xl bg-charcoal-900 px-3 py-2 text-xs font-semibold text-white">
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>

      <div className="bg-white rounded-[22px] border border-sand-200 p-4 flex flex-wrap gap-3 items-end">
        <label className="text-xs text-charcoal-600">
          Rupees per FASHN credit
          <input value={rate} onChange={(event) => setRate(event.target.value)} className="mt-1 block w-36 rounded-xl border border-sand-300 px-3 py-2 text-sm" />
        </label>
        <label className="text-xs text-charcoal-600 flex-1 min-w-[220px]">
          Reason
          <input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Why this rate applies" className="mt-1 block w-full rounded-xl border border-sand-300 px-3 py-2 text-sm" />
        </label>
        <button type="button" onClick={saveRate} className="rounded-xl bg-gold-600 px-3 py-2 text-xs font-semibold text-white">Save rate</button>
        <p className="w-full text-[11px] text-charcoal-500">
          {settings?.rateConfigured
            ? `Using ₹${settings.rupeesPerCredit} per credit${settings.asOf ? `, as of ${when(settings.asOf)}` : ''}. Free quota ${settings.freeTryOnQuota}. Listed paid price ₹${settings.paidTryOnPriceInr}.`
            : 'No FASHN rupee rate is set, so INR cost and margin stay blank instead of showing a guessed number.'}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <Stat label="Users" value={totals?.users ?? '-'} />
        <Stat label="Completed try-ons" value={totals?.tryOnsCompleted ?? '-'} />
        <Stat label="FASHN credits" value={totals?.fashnCreditsUsed ?? '-'} />
        <Stat label="FASHN cost" value={money(totals?.fashnCostInr)} />
        <Stat label="Revenue" value={money(totals?.revenueInr)} />
        <Stat label="Net margin" value={money(totals?.netMarginInr)} />
      </div>
      <p className="text-[11px] text-charcoal-500">Free-quota FASHN cost: {money(totals?.freeQuotaCostInr)}. Formula: cost = known FASHN credits × rupees per credit. Net margin = net money paid − that cost.</p>

      <div className="flex flex-wrap gap-2">
        <input value={search} onChange={(event) => { setPage(1); setSearch(event.target.value); }} placeholder="Search name, phone, email, or id" className="rounded-xl border border-sand-300 px-3 py-2 text-sm" />
        {PRESETS.map((item) => (
          <button key={item.id} type="button" onClick={() => { setPage(1); setPreset(item.id); }} className={`rounded-xl px-3 py-2 text-xs font-semibold ${preset === item.id ? 'bg-charcoal-900 text-white' : 'bg-white border border-sand-200 text-charcoal-700'}`}>
            {item.label}
          </button>
        ))}
        <select value={sort} onChange={(event) => setSort(event.target.value)} className="rounded-xl border border-sand-300 px-3 py-2 text-xs">
          <option value="lastTryOn">Last try-on</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="fashnCredits">FASHN credits</option>
          <option value="fashnCost">FASHN cost</option>
          <option value="revenue">Revenue</option>
          <option value="margin">Margin</option>
          <option value="freeUsed">Free used</option>
          <option value="paidUsed">Paid used</option>
        </select>
      </div>

      <div className="bg-white rounded-[22px] border border-sand-200 overflow-hidden">
        {loading ? <TableSkeleton rows={8} cols={6} /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-sand-50 text-charcoal-500 uppercase tracking-wider">
                <tr>
                  {['User', 'Try-ons', 'Free', 'Paid', 'Money', 'FASHN', 'Margin'].map((heading) => (
                    <th key={heading} className="px-3 py-3">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-100">
                {(report?.items || []).map((row) => (
                  <tr key={row.userId} className="cursor-pointer hover:bg-sand-50" onClick={() => navigate(`/try-on-usage/${row.userId}`)}>
                    <td className="px-3 py-3">
                      <div className="font-semibold text-charcoal-900">{row.name}</div>
                      <div className="text-[11px] text-charcoal-500">{row.phone}</div>
                    </td>
                    <td className="px-3 py-3">{row.tryOnsCompleted} done · {row.tryOnsFailed} failed · {row.cacheHits} cached</td>
                    <td className="px-3 py-3">{row.freeUsed} used · {row.freeRemaining} left</td>
                    <td className="px-3 py-3">{row.paidUsed} used · {row.paidRemaining} left</td>
                    <td className="px-3 py-3">{money(row.moneyNetInr)}</td>
                    <td className="px-3 py-3">{row.fashnCreditsUsed} · {money(row.fashnCostInr)}</td>
                    <td className={`px-3 py-3 font-semibold ${row.marginNegative ? 'text-maroon-700' : ''}`}>{money(row.netMarginInr)}</td>
                  </tr>
                ))}
                {(report?.items || []).length === 0 && (
                  <tr><td colSpan={7} className="px-3 py-8 text-center text-charcoal-500">No users match this view.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {(report?.groups || []).length > 0 && (
        <Panel title="Shared IPs on free try-ons">
          <Rows rows={report.groups} empty="" render={(group) => <span>{group.ip} · {group.users} accounts · {group.jobs} free try-ons</span>} />
        </Panel>
      )}
    </div>
  );
}

function Stat({ label, value, warn = false }) {
  return (
    <div className="rounded-2xl bg-white border border-sand-200 px-3 py-3">
      <div className="text-[11px] uppercase tracking-wide text-charcoal-500">{label}</div>
      <div className={`mt-1 text-lg font-bold ${warn ? 'text-maroon-700' : 'text-charcoal-900'}`}>{value}</div>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <section className="bg-white rounded-[22px] border border-sand-200 p-4">
      <h2 className="text-sm font-bold text-charcoal-900 mb-2">{title}</h2>
      {children}
    </section>
  );
}

function Rows({ rows, empty, render }) {
  if (!rows?.length) return <p className="text-xs text-charcoal-500">{empty}</p>;
  return (
    <ul className="space-y-1.5 text-xs text-charcoal-700">
      {rows.map((row) => <li key={row.id || row.ip}>{render(row)}</li>)}
    </ul>
  );
}
