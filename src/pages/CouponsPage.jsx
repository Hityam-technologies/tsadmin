import React, { useEffect, useState } from 'react';
import { commerceService } from '../services/commerceService';
import { useToast } from '../context/ToastContext';

const EMPTY = {
  code: '',
  title: '',
  subtitle: '',
  type: 'percent',
  value: '',
  minOrder: '0',
  firstOrderOnly: false,
};

function shownValue(coupon) {
  if (coupon.type === 'percent') return String(Math.round(coupon.value * 100));
  return String(coupon.value);
}

export function CouponsPage() {
  const { showToast } = useToast();
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const res = await commerceService.coupons();
    if (res.success) setCoupons(res.data || []);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    const res = await commerceService.saveCoupon({
      code: form.code,
      title: form.title,
      subtitle: form.subtitle,
      type: form.type,
      value: Number(form.value),
      minOrder: Number(form.minOrder) || 0,
      firstOrderOnly: form.firstOrderOnly,
      isActive: true,
    }, editing);
    setSaving(false);
    if (!res.success) {
      showToast(res.error?.message || 'The coupon was not saved.', 'error');
      return;
    }
    setForm(EMPTY);
    setEditing(null);
    showToast('Coupon saved. Customers can use it in the app.', 'success');
    load();
  };

  const toggle = async (coupon) => {
    const res = await commerceService.setCouponActive(coupon.id, !coupon.isActive);
    if (!res.success) {
      showToast(res.error?.message || 'The coupon was not updated.', 'error');
      return;
    }
    load();
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-[22px] border border-sand-200 p-5">
        <h1 className="text-2xl font-bold text-charcoal-900">{editing ? 'Edit coupon' : 'Coupons'}</h1>
        <p className="text-sm text-charcoal-500 mt-1">
          These codes appear in the app bag. A percent value of 10 means 10% off. A flat value is rupees off.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
          <Field label="Code" value={form.code} onChange={(value) => setForm({ ...form, code: value.toUpperCase() })} />
          <Field label="Title" value={form.title} onChange={(value) => setForm({ ...form, title: value })} />
          <Field label="Short line" value={form.subtitle} onChange={(value) => setForm({ ...form, subtitle: value })} />
          <label className="text-xs font-semibold text-charcoal-700">
            Type
            <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} className="mt-1 block w-full rounded-xl border border-sand-300 px-3 py-2 text-sm">
              <option value="percent">Percent off</option>
              <option value="flat">Rupees off</option>
            </select>
          </label>
          <Field label={form.type === 'percent' ? 'Percent off' : 'Rupees off'} value={form.value} onChange={(value) => setForm({ ...form, value })} />
          <Field label="Minimum order (₹)" value={form.minOrder} onChange={(value) => setForm({ ...form, minOrder: value })} />
        </div>
        <label className="mt-3 flex items-center gap-2 text-xs text-charcoal-700">
          <input type="checkbox" checked={form.firstOrderOnly} onChange={(event) => setForm({ ...form, firstOrderOnly: event.target.checked })} />
          First order only
        </label>
        <button type="button" disabled={saving} onClick={save} className="mt-4 rounded-xl bg-gold-600 px-4 py-2 text-xs font-semibold text-white">
          {saving ? 'Saving…' : 'Save coupon'}
        </button>
      </div>

      <div className="bg-white rounded-[22px] border border-sand-200 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-sand-50 text-charcoal-500">
            <tr>
              {['Code', 'Offer', 'Minimum', 'Rule', ''].map((heading) => (
                <th key={heading} className="px-3 py-3 font-semibold">{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-sand-100">
            {coupons.map((coupon) => (
              <tr key={coupon.id}>
                <td className="px-3 py-3 font-semibold">{coupon.code}</td>
                <td className="px-3 py-3">
                  <div>{coupon.title}</div>
                  <div className="text-[11px] text-charcoal-500">
                    {coupon.type === 'percent' ? `${Math.round(coupon.value * 100)}% off` : `₹${coupon.value.toLocaleString('en-IN')} off`}
                  </div>
                </td>
                <td className="px-3 py-3">{coupon.minOrder ? `₹${coupon.minOrder.toLocaleString('en-IN')}` : 'None'}</td>
                <td className="px-3 py-3">{coupon.firstOrderOnly ? 'First order' : 'Any order'}</td>
                <td className="px-3 py-3 text-right space-x-2">
                  <button
                    type="button"
                    className="font-semibold text-charcoal-700"
                    onClick={() => {
                      setEditing(coupon.id);
                      setForm({
                        code: coupon.code,
                        title: coupon.title,
                        subtitle: coupon.subtitle || '',
                        type: coupon.type,
                        value: shownValue(coupon),
                        minOrder: String(coupon.minOrder || 0),
                        firstOrderOnly: Boolean(coupon.firstOrderOnly),
                      });
                    }}
                  >
                    Edit
                  </button>
                  <button type="button" className="font-semibold text-gold-700" onClick={() => toggle(coupon)}>
                    {coupon.isActive ? 'Turn off' : 'Turn on'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }) {
  return (
    <label className="text-xs font-semibold text-charcoal-700">
      {label}
      <input value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 block w-full rounded-xl border border-sand-300 px-3 py-2 text-sm font-medium" />
    </label>
  );
}
