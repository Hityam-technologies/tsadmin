import React, { useCallback, useEffect, useState } from 'react';
import { commerceService } from '../services/commerceService';
import { systemService } from '../services/systemService';
import { TableSkeleton } from '../components/common/Skeleton';
import { useToast } from '../context/ToastContext';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'CONFIRMED', label: 'Confirmed' },
  { id: 'PROCESSING', label: 'Packaging' },
  { id: 'IN_TRANSIT', label: 'Out for delivery' },
  { id: 'DELIVERED', label: 'Delivered' },
  { id: 'CANCELLED', label: 'Cancelled' },
];

const NEXT = {
  CONFIRMED: { status: 'PROCESSING', label: 'Packaging done' },
  PROCESSING: { status: 'IN_TRANSIT', label: 'Send for delivery' },
  IN_TRANSIT: { status: 'DELIVERED', label: 'Mark delivered' },
};

function rupees(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

export function OrdersPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [selectedId, setSelectedId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [orderLimit, setOrderLimit] = useState('99');
  const [savingLimit, setSavingLimit] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await commerceService.orders({ search, status, page: 1, limit: 30 });
    if (res.success) setOrders(res.data?.items || []);
    else showToast(res.error?.message || 'Orders could not be loaded.', 'error');
    setLoading(false);
  }, [search, status, showToast]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    async function loadLimit() {
      const res = await systemService.getConfig();
      if (res.success && res.data?.maxOrderQuantity) {
        setOrderLimit(String(res.data.maxOrderQuantity));
      }
    }
    loadLimit();
  }, []);

  const saveLimit = async () => {
    const next = Math.floor(Number(orderLimit));
    if (!Number.isFinite(next) || next < 1 || next > 999) {
      showToast('Enter a whole number from 1 to 999.', 'error');
      return;
    }
    setSavingLimit(true);
    const res = await systemService.updateConfig({ maxOrderQuantity: next });
    setSavingLimit(false);
    if (!res.success) {
      showToast(res.error?.message || 'The order limit was not saved.', 'error');
      return;
    }
    setOrderLimit(String(res.data.maxOrderQuantity));
    showToast(`Customers can choose up to ${res.data.maxOrderQuantity} of one item.`, 'success');
  };

  const selected = orders.find((order) => order.id === selectedId) || null;

  const move = async (nextStatus) => {
    if (!selected) return;
    setSaving(true);
    const res = await commerceService.setStatus(selected.id, nextStatus);
    setSaving(false);
    if (!res.success) {
      showToast(res.error?.message || 'The order was not updated.', 'error');
      return;
    }
    showToast(`${res.data.orderNumber} is now ${res.data.statusLabel}. The app tracking follows this.`, 'success');
    await load();
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-[22px] border border-sand-200 p-5">
        <h1 className="text-2xl font-bold text-charcoal-900">Orders</h1>
        <p className="text-sm text-charcoal-500 mt-1">
          Open an order, then move it. The customer’s tracking screen uses the same steps.
        </p>
        <div className="mt-4 flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="flex-1 max-w-xs">
            <label className="block text-xs font-semibold text-charcoal-800 mb-1">
              Maximum pieces of one item
            </label>
            <input
              type="number"
              min="1"
              max="999"
              step="1"
              value={orderLimit}
              onChange={(event) => setOrderLimit(event.target.value)}
              className="w-full rounded-xl border border-sand-300 px-3 py-2 text-sm"
            />
            <p className="text-[11px] text-charcoal-500 mt-1">
              The shop bag and the billing counter stop at this number.
            </p>
          </div>
          <button
            type="button"
            disabled={savingLimit}
            onClick={saveLimit}
            className="rounded-xl bg-charcoal-900 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
          >
            {savingLimit ? 'Saving…' : 'Save limit'}
          </button>
        </div>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search order, name, or phone"
          className="mt-4 w-full max-w-sm rounded-xl border border-sand-300 px-3 py-2 text-sm"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setStatus(item.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${status === item.id ? 'bg-charcoal-900 text-white' : 'bg-sand-50 text-charcoal-700'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
        <div className="lg:col-span-3 bg-white rounded-[22px] border border-sand-200 overflow-x-auto">
          {loading ? <TableSkeleton rows={6} cols={4} /> : (
            <table className="w-full text-left text-xs">
              <thead className="bg-sand-50 text-charcoal-500">
                <tr>
                  {['Order', 'Customer', 'Total', 'Status'].map((heading) => (
                    <th key={heading} className="px-3 py-3 font-semibold">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-100">
                {orders.map((order) => (
                  <tr key={order.id} className={`cursor-pointer hover:bg-sand-50 ${selectedId === order.id ? 'bg-sand-50' : ''}`} onClick={() => setSelectedId(order.id)}>
                    <td className="px-3 py-3">
                      <div className="font-semibold text-charcoal-900">{order.orderNumber}</div>
                      <div className="text-[11px] text-charcoal-500">{order.dateFormatted}</div>
                    </td>
                    <td className="px-3 py-3">
                      <div>{order.customerName}</div>
                      <div className="text-[11px] text-charcoal-500">{order.shippingAddress?.city || '-'}</div>
                    </td>
                    <td className="px-3 py-3">{rupees(order.totalAmount)}</td>
                    <td className="px-3 py-3">{order.statusLabel}</td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr><td colSpan={4} className="px-3 py-8 text-center text-charcoal-500">No orders yet.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className="lg:col-span-2 bg-white rounded-[22px] border border-sand-200 p-5 lg:sticky lg:top-5">
          {!selected ? <p className="text-sm text-charcoal-500">Select an order to see the steps.</p> : (
            <>
              <div>
                <h2 className="text-lg font-bold text-charcoal-900">{selected.orderNumber}</h2>
                <p className="text-sm font-semibold text-charcoal-900 mt-1">{rupees(selected.totalAmount)} · {selected.paymentMethod === 'COD' ? 'Cash on delivery' : 'Online'}</p>
                <p className="text-xs text-charcoal-500 mt-2">{selected.customerName} · {selected.customerPhone}</p>
                <p className="text-xs text-charcoal-500">
                  {selected.shippingAddress?.addressLine1}, {selected.shippingAddress?.city} {selected.shippingAddress?.postalCode}
                </p>
              </div>
              <ul className="mt-3 space-y-1 text-xs text-charcoal-800">
                {selected.items.map((item) => (
                  <li key={`${item.productId}-${item.quantity}`}>{item.title} · Qty {item.quantity} · {rupees(item.price * item.quantity)}</li>
                ))}
              </ul>
              <ol className="mt-4 space-y-2">
                {(selected.trackingSteps || []).map((step) => (
                  <li key={step.title} className="flex items-center gap-2 text-sm">
                    <span className={`h-2.5 w-2.5 rounded-full ${step.completed || step.current ? 'bg-gold-600' : 'bg-sand-300'}`} />
                    <span className="font-semibold text-charcoal-900">{step.title}</span>
                    {step.current ? <span className="text-[11px] font-semibold text-gold-700">Now</span> : null}
                  </li>
                ))}
              </ol>
              <div className="mt-4 flex flex-wrap gap-2">
                {NEXT[selected.status] ? (
                  <button type="button" disabled={saving} onClick={() => move(NEXT[selected.status].status)} className="rounded-xl bg-gold-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60">
                    {saving ? 'Saving…' : NEXT[selected.status].label}
                  </button>
                ) : (
                  <p className="text-xs text-charcoal-500">{selected.statusLabel}</p>
                )}
                {selected.status === 'CONFIRMED' || selected.status === 'PROCESSING' ? (
                  <button type="button" disabled={saving} onClick={() => move('CANCELLED')} className="rounded-xl border border-sand-300 px-4 py-2 text-xs font-semibold text-charcoal-700">
                    Cancel order
                  </button>
                ) : null}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
