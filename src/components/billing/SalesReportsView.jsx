import React from 'react';
import { formatINR } from '../../lib/utils';
import {
  BarChart3,
  Calendar,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export function SalesReportsView({ todaySummary }) {
  const paymentBreakdownData = [
    { name: 'Cash', value: todaySummary?.cashTotal || 0, color: '#C5A253' },
    { name: 'UPI / QR', value: todaySummary?.upiTotal || 0, color: '#10B981' },
    { name: 'Card (POS)', value: todaySummary?.cardTotal || 0, color: '#BF5B21' },
  ];

  const hourlyTrendsData = [
    { hour: '10 AM', sales: 36750, bills: 1 },
    { hour: '11 AM', sales: 29350, bills: 1 },
    { hour: '12 PM', sales: 0, bills: 0 },
    { hour: '1 PM', sales: 42000, bills: 1 },
    { hour: '2 PM', sales: 18500, bills: 1 },
    { hour: '3 PM', sales: 52000, bills: 2 },
    { hour: '4 PM', sales: 28500, bills: 1 },
  ];

  return (
    <div className="bg-white/95 backdrop-blur-xl rounded-[22px] border border-sand-200/90 shadow-[0_2px_14px_rgba(0,0,0,0.02)] p-4 sm:p-5 flex-1 h-full min-h-0 flex flex-col font-sans overflow-hidden">
      {/* Top Banner (Pinned) */}
      <div className="flex-shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-sand-200">
        <div>
          <h2 className="text-base font-serif font-extrabold text-charcoal-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-gold-600" />
            <span>Store Sales & Velocity Reports</span>
          </h2>
          <p className="text-xs text-charcoal-500 mt-0.5">
            Real-time cashier register performance and payment channel audit.
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sand-50 border border-sand-200 text-xs text-charcoal-700">
          <Calendar className="w-3.5 h-3.5 text-gold-600" />
          <span className="font-semibold">Today's Audit Cycle</span>
        </div>
      </div>

      {/* Content Area (Scrolls internally) */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-4 pt-1">
        {/* 4 Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-gold-50/90 to-sand-50 border border-gold-200/90">
            <span className="text-xs font-bold uppercase tracking-wider text-gold-800">
              Total Revenue Today
            </span>
            <h3 className="text-xl font-serif font-extrabold text-charcoal-900 mt-1 font-mono">
              {formatINR(todaySummary?.totalRevenue || 0)}
            </h3>
            <p className="text-xs text-charcoal-500 mt-0.5">
              From {todaySummary?.billsCount || 0} completed invoices
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-sand-200">
            <span className="text-xs font-bold uppercase tracking-wider text-charcoal-500">
              Cash in Drawer
            </span>
            <h3 className="text-xl font-serif font-extrabold text-charcoal-900 mt-1 font-mono">
              {formatINR(todaySummary?.cashTotal || 0)}
            </h3>
            <p className="text-xs text-charcoal-500 mt-0.5">Ready for day closing count</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-sand-200">
            <span className="text-xs font-bold uppercase tracking-wider text-charcoal-500">
              UPI / Digital Collections
            </span>
            <h3 className="text-xl font-serif font-extrabold text-emerald-800 mt-1 font-mono">
              {formatINR(todaySummary?.upiTotal || 0)}
            </h3>
            <p className="text-xs text-charcoal-500 mt-0.5">Soundbox confirmed</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-sand-200">
            <span className="text-xs font-bold uppercase tracking-wider text-charcoal-500">
              Card POS Machine
            </span>
            <h3 className="text-xl font-serif font-extrabold text-saffron-800 mt-1 font-mono">
              {formatINR(todaySummary?.cardTotal || 0)}
            </h3>
            <p className="text-xs text-charcoal-500 mt-0.5">EDC settlement active</p>
          </div>
        </div>

        {/* 2 Graphs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Payment Mode Share */}
          <div className="p-4 rounded-2xl bg-white border border-sand-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-700 mb-3">
              Collections by Tender Mode
            </h4>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paymentBreakdownData} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E0D8" />
                  <XAxis type="number" tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <YAxis dataKey="name" type="category" width={85} tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(val) => [formatINR(val), 'Amount']}
                    contentStyle={{ borderRadius: 12, border: '1px solid #E5E0D8', fontSize: 12 }}
                  />
                  <Bar dataKey="value" fill="#C5A253" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Hourly Billing Velocity */}
          <div className="p-4 rounded-2xl bg-white border border-sand-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-700 mb-3">
              Hourly Billing Velocity (₹ Sales)
            </h4>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyTrendsData} margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E0D8" />
                  <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(val) => [formatINR(val), 'Sales']}
                    contentStyle={{ borderRadius: 12, border: '1px solid #E5E0D8', fontSize: 12 }}
                  />
                  <Bar dataKey="sales" fill="#BF5B21" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
