import React, { useCallback, useEffect, useState } from 'react';
import { commerceService } from '../services/commerceService';
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
  CONFIRMED: [
    { status: 'PROCESSING', label: 'Start packaging' },
    { status: 'CANCELLED', label: 'Cancel order' },
  ],
  PROCESSING: [
    { status: 'IN_TRANSIT', label: 'Send for delivery' },
    { status: 'CANCELLED', label: 'Cancel order' },
  ],
  IN_TRANSIT: [{ status: 'DELIVERED', label: 'Mark delivered' }],
  DELIVERED: [],
  CANCELLED: [],
};

function rupees(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

export function OrdersPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await commerceService.orders({ search, status, page: 1, limit: 30 });
    if (res.success) setReport(res.data);
    setLoading(false);
  }, [search, status]);

  useEffect(() => { load(); }, [load]);

  const move = async (nextStatus) => {
    if (!selected) return;
    setSaving(true);
    const res = await commerceService.setStatus(selected.id, nextStatus);
    setSaving(false);
    if (!res.success) {
      showToast(res.error?.message || 'The order was not updated.', 'error');
      return;
    }
    setSelected(res.data);
    showToast(`${res.data.orderNumber} is now ${res.data.statusLabel}.`, 'success');
    load();
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-[22px] border border-sand-200 p-5">
        <h1 className="text-2xl font-bold text-charcoal-900">Orders</h1>
        <p className="text-sm text-charcoal-500 mt-1">
          Cash on delivery orders from the app. Move each order through packaging, delivery, and handover.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search order, name, or phone"
            className="rounded-xl border border-sand-300 px-3 py-2 text-sm"
          />
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setStatus(item.id)}
              className={`rounded-xl px-3 py-2 text-xs font-semibold ${status === item.id ? 'bg-charcoal-900 text-white' : 'bg-sand-50 text-charcoal-700'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 bg-white rounded-[22px] border border-sand-200 overflow-hidden">
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
                {(report?.items || []).map((order) => (
                  <tr key={order.id} className="cursor-pointer hover:bg-sand-50" onClick={() => setSelected(order)}>
                    <td className="px-3 py-3">
                      <div className="font-semibold text-charcoal-900">{order.orderNumber}</div>
                      <div className="text-[11px] text-charcoal-500">{order.dateFormatted}</div>
                    </td>
                    <td className="px-3 py-3">
                      <div>{order.customerName}</div>
                      <div className="text-[11px] text-charcoal-500">{order.shippingAddress?.city}</div>
                    </td>
                    <td className="px-3 py-3">{rupees(order.totalAmount)}</td>
                    <td className="px-3 py-3">{order.statusLabel}</td>
                  </tr>
                ))}
                {(report?.items || []).length === 0 && (
                  <tr><td colSpan={4} className="px-3 py-8 text-center text-charcoal-500">No orders yet.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className="lg:col-span-2 bg-white rounded-[22px] border border-sand-200 p-4">
          {!selected ? <p className="text-sm text-charcoal-500">Select an order to pack, dispatch, or cancel it.</p> : (
            <div className="space-y-3">
              <div>
                <h2 className="text-lg font-bold text-charcoal-900">{selected.orderNumber}</h2>
                <p className="text-xs text-charcoal-500">{selected.customerName} · {selected.customerPhone}</p>
                <p className="text-xs text-charcoal-500 mt-1">
                  {selected.shippingAddress?.addressLine1}, {selected.shippingAddress?.city} {selected.shippingAddress?.postalCode}
                </p>
              </div>
              <ul className="space-y-1 text-xs text-charcoal-800">
                {selected.items.map((item) => (
                  <li key={item.productId}>{item.title} · {item.quantity} · {rupees(item.price * item.quantity)}</li>
                ))}
              </ul>
              <p className="text-sm font-semibold text-charcoal-900">
                {rupees(selected.totalAmount)}
                {selected.discountAmount ? ` after ${rupees(selected.discountAmount)} off` : ''}
                {' · '}
                {selected.paymentMethod === 'COD' ? 'Cash on delivery' : 'Online'}
              </p>
              <div className="flex flex-wrap gap-2">
                {(NEXT[selected.status] || []).map((action) => (
                  <button
                    key={action.status}
                    type="button"
                    disabled={saving}
                    onClick={() => move(action.status)}
                    className={`rounded-xl px-3 py-2 text-xs font-semibold text-white ${action.status === 'CANCELLED' ? 'bg-maroon-700' : 'bg-gold-600'}`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
