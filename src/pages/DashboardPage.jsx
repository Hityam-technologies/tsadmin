import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardService } from '../services/dashboardService';
import { Skeleton } from '../components/common/Skeleton';
import { dash, formatINR } from '../lib/utils';
import { Badge } from '../components/common/Badge';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import {
  ArrowUpRight,
  Sparkles,
  ShoppingBag,
  Users,
  ChevronRight,
  Calendar,
  BarChart2,
  MessageCircle,
  Phone,
  Zap,
} from 'lucide-react';

function CustomChartTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-md border border-sand-200 rounded-2xl p-3.5 shadow-lg text-xs font-sans min-w-[190px]">
        <p className="font-bold text-charcoal-900 mb-2 flex items-center gap-1.5 border-b border-sand-100 pb-1.5 text-xs">
          <Calendar className="w-3.5 h-3.5 text-gold-600" />
          <span>{label} 2026</span>
        </p>
        <div className="space-y-1.5">
          {payload.map((entry, idx) => (
            <div key={idx} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-charcoal-600 font-medium text-xs">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: entry.color }}
                />
                {entry.name}:
              </span>
              <span className="font-bold text-charcoal-900 font-mono text-xs">
                {entry.name.toLowerCase().includes('value') || entry.name.toLowerCase().includes('revenue')
                  ? `₹${(entry.value / 100000).toFixed(1)}L`
                  : entry.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
}

export function DashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      const res = await dashboardService.getStats();
      if (res.success) {
        setData(res.data);
      }
      setLoading(false);
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-5 animate-pulse font-sans">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-[22px]" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Skeleton className="h-[360px] rounded-[22px]" />
          <Skeleton className="h-[360px] rounded-[22px]" />
        </div>
      </div>
    );
  }

  const { counts, recentEnquiries, lowStockSarees, trends } = data || {};
  const monthlyTrends = trends?.monthlyTrends || [];
  const categoryBreakdown = trends?.categoryBreakdown || [];

  // 4 Top Metric Cards (Refined, Proportional Sizes)
  const showCount = (value) =>
    typeof value === 'number' && Number.isFinite(value) ? value.toLocaleString('en-IN') : '-';
  const sumTrend = (key) => monthlyTrends.reduce((sum, row) => sum + (Number(row[key]) || 0), 0);
  const catalogValue = categoryBreakdown.reduce((sum, row) => sum + (Number(row.value) || 0), 0);
  const topCategory = categoryBreakdown.reduce(
    (best, row) => ((Number(row.value) || 0) > (Number(best?.value) || 0) ? row : best),
    null,
  );

  const metricCards = [
    {
      title: 'Registered Clients',
      value: showCount(counts?.totalUsers),
      change: '-',
      path: '/users',
      icon: Users,
      badgeColor: 'bg-gold-500',
    },
    {
      title: 'Master Saree Catalog',
      value: showCount(counts?.totalSarees),
      change: '-',
      path: '/sarees',
      icon: ShoppingBag,
      badgeColor: 'bg-saffron-500',
    },
    {
      title: 'Concierge Inquiries',
      value: showCount(counts?.openEnquiries),
      change: '-',
      path: '/enquiries',
      icon: Sparkles,
      badgeColor: 'bg-maroon-500',
    },
    {
      title: 'AI Try-On Drape Looks',
      value: showCount(counts?.savedLooks),
      change: '-',
      path: '/try-on-ai',
      icon: Zap,
      badgeColor: 'bg-gold-600',
    },
  ];

  return (
    <div className="space-y-6 font-sans text-charcoal-900 animate-in fade-in duration-300">
      {/* Title Header with Refined Typography */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal-900 tracking-tight">
            Atelier Dashboard
          </h1>
          <p className="text-xs sm:text-sm font-medium text-charcoal-500 mt-0.5">
            Tripuraa Sangrahah mobile catalog, virtual try-on activity & concierge support.
          </p>
        </div>

        {/* Live Status Pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-sand-200/90 shadow-2xs text-xs">
          <span className="w-2 h-2 rounded-full bg-gold-500 animate-pulse" />
          <span className="font-bold text-charcoal-800">Atelier Live Operations</span>
          <span className="text-sand-300">|</span>
          <span className="font-mono text-[11px] font-semibold text-charcoal-500">v1.2.0</span>
        </div>
      </div>

      {/* =========================================================================
          ROW 1: 4 Metric Cards (Clean, Balanced Sizes)
         ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((card, idx) => (
          <div
            key={idx}
            onClick={() => navigate(card.path)}
            className="bg-white rounded-[22px] border border-sand-200/90 shadow-[0_2px_14px_rgba(0,0,0,0.02)] p-4 sm:p-5 hover:shadow-md hover:border-sand-300 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-charcoal-500 mb-2 tracking-wide">
                <span>{card.title}</span>
                <div className="w-6 h-6 rounded-full bg-sand-50 border border-sand-200 flex items-center justify-center group-hover:bg-gold-50 group-hover:border-gold-300 transition-colors">
                  <ArrowUpRight className="w-3.5 h-3.5 text-charcoal-500 group-hover:text-gold-700 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-charcoal-900 tracking-tight">
                {card.value}
              </div>
            </div>

            <div className="mt-3.5 pt-2.5 border-t border-sand-100 flex items-center gap-2 text-[11px] sm:text-xs text-charcoal-500 font-semibold">
              <span className={`w-1.5 h-1.5 rounded-full ${card.badgeColor} flex-shrink-0`} />
              <span className="truncate">{card.change}</span>
            </div>
          </div>
        ))}
      </div>

      {/* =========================================================================
          ROW 2: Real App Analytics (Wishlist & AI Try-On AreaChart + Category BarChart)
          Balanced proportional heights (270px) and clean typography
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* GRAPH 1: Mobile App Customer Engagement (Wishlist Saves & AI Try-On Looks) */}
        <div className="bg-white rounded-[22px] border border-sand-200/90 shadow-[0_2px_14px_rgba(0,0,0,0.02)] p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-sand-100">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-charcoal-900 tracking-tight">
                    Customer Engagement & Try-On
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-sand-50 border border-sand-200 text-[10px] font-bold text-charcoal-600 uppercase tracking-wider">
                    6 Months
                  </span>
                </div>
                <p className="text-xs text-charcoal-500 mt-0.5 font-medium">
                  Mobile wardrobe activity: AI virtual fittings vs wishlisted sarees
                </p>
              </div>

              {/* Legend with Brand Gold and Saffron */}
              <div className="flex items-center gap-2.5 self-start sm:self-auto text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#C5A253]" />
                  <span className="text-charcoal-700">Wishlist</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#BF5B21]" />
                  <span className="text-charcoal-700">AI Try-On</span>
                </div>
              </div>
            </div>

            {/* Quick KPI Strip */}
            <div className="grid grid-cols-3 gap-2.5 my-3 py-2 px-3 rounded-xl bg-[#FAF8F5] border border-sand-200/60 text-center">
              <div>
                <span className="text-[10px] text-charcoal-500 font-semibold block">Wishlist Saves</span>
                <span className="text-sm sm:text-base font-extrabold text-gold-700 font-mono">
                  {monthlyTrends.length ? sumTrend('wishlistSaves').toLocaleString('en-IN') : '-'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-charcoal-500 font-semibold block">AI Try-On Drapes</span>
                <span className="text-sm sm:text-base font-extrabold text-saffron-600 font-mono">
                  {monthlyTrends.length ? sumTrend('tryOnLooks').toLocaleString('en-IN') : '-'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-charcoal-500 font-semibold block">Concierge Leads</span>
                <span className="text-sm sm:text-base font-extrabold text-charcoal-900 font-mono">
                  {monthlyTrends.length ? sumTrend('enquiries').toLocaleString('en-IN') : '-'}
                </span>
              </div>
            </div>

            {/* Proportional AreaChart in Temple Gold & Burnt Saffron */}
            <div className="w-full h-[250px] sm:h-[270px] mt-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={monthlyTrends}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="goldAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C5A253" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#C5A253" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="saffronAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#BF5B21" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#BF5B21" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EFEAE1" />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6B5E51', fontSize: 11, fontWeight: 600, fontFamily: 'Manrope' }}
                    dy={6}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#898078', fontSize: 11, fontWeight: 500, fontFamily: 'Manrope' }}
                  />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="wishlistSaves"
                    name="Wishlist Saves"
                    stroke="#C5A253"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#goldAreaGrad)"
                    activeDot={{ r: 5, fill: '#C5A253', stroke: '#fff', strokeWidth: 2 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="tryOnLooks"
                    name="AI Try-On Looks"
                    stroke="#BF5B21"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#saffronAreaGrad)"
                    activeDot={{ r: 5, fill: '#BF5B21', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-sand-100 flex items-center justify-between text-xs font-semibold text-charcoal-500">
            <span>Customer app Wardrobe & Virtual Try-On telemetry</span>
            <span className="text-saffron-700 font-bold">-</span>
          </div>
        </div>

        {/* GRAPH 2: Master Saree Catalog Distribution by Weave (BarChart) */}
        <div className="bg-white rounded-[22px] border border-sand-200/90 shadow-[0_2px_14px_rgba(0,0,0,0.02)] p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-sand-100">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-charcoal-900 tracking-tight">
                    Saree Catalog by Weave Category
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-sand-50 border border-sand-200 text-[10px] font-bold text-charcoal-600 uppercase tracking-wider">
                    Retail Value
                  </span>
                </div>
                <p className="text-xs text-charcoal-500 mt-0.5 font-medium">
                  Inventory value across Kanchipuram, Banarasi, Paithani & Bridal
                </p>
              </div>

              <div className="flex items-center gap-1.5 self-start sm:self-auto text-xs font-bold text-gold-700">
                <BarChart2 className="w-3.5 h-3.5" />
                <span>₹ INR (Lakhs)</span>
              </div>
            </div>

            {/* Quick KPI Strip */}
            <div className="grid grid-cols-3 gap-2.5 my-3 py-2 px-3 rounded-xl bg-[#FAF8F5] border border-sand-200/60 text-center">
              <div>
                <span className="text-[10px] text-charcoal-500 font-semibold block">Total Catalog Value</span>
                <span className="text-sm sm:text-base font-extrabold text-charcoal-900 font-mono">
                  {categoryBreakdown.length ? formatINR(catalogValue) : '-'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-charcoal-500 font-semibold block">Weave Categories</span>
                <span className="text-sm sm:text-base font-extrabold text-charcoal-900 font-mono">
                  {categoryBreakdown.length ? categoryBreakdown.length : '-'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-charcoal-500 font-semibold block">Top Category</span>
                <span className="text-sm sm:text-base font-extrabold text-gold-700 font-mono">
                  {dash(topCategory?.category)}
                </span>
              </div>
            </div>

            {/* Proportional BarChart in Antique Temple Gold */}
            <div className="w-full h-[250px] sm:h-[270px] mt-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryBreakdown}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EFEAE1" />
                  <XAxis
                    dataKey="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6B5E51', fontSize: 11, fontWeight: 600, fontFamily: 'Manrope' }}
                    dy={6}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#898078', fontSize: 11, fontWeight: 500, fontFamily: 'Manrope' }}
                    tickFormatter={(val) => `₹${(val / 100000).toFixed(0)}L`}
                  />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Bar
                    dataKey="value"
                    name="Category Valuation"
                    fill="#C5A253"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={48}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-sand-100 flex items-center justify-between text-xs font-semibold text-charcoal-500">
            <span>Directly mapped to mobile Home Category Story Bar</span>
            <span className="text-charcoal-800 font-mono font-bold">-</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          ROW 3: Real App Features (Recent Concierge Inquiries + Low Stock Sarees)
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Inquiries Table (WhatsApp & Phone Concierge Leads) */}
        <div className="lg:col-span-2 bg-white rounded-[22px] border border-sand-200/90 shadow-[0_2px_14px_rgba(0,0,0,0.02)] p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-charcoal-900 tracking-tight">
                  Recent Concierge Inquiries
                </h3>
                <p className="text-xs text-charcoal-500 mt-0.5 font-medium">
                  Customer consultations via WhatsApp and Helpline
                </p>
              </div>

              <button
                onClick={() => navigate('/enquiries')}
                className="px-3.5 py-1.5 rounded-full border border-sand-200 bg-sand-50 hover:bg-gold-50 text-xs font-bold text-charcoal-800 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5 text-gold-700" />
              </button>
            </div>

            {/* Inquiries table with clean, readable text */}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-sand-200 text-[11px] font-bold text-charcoal-500 uppercase tracking-wider">
                    <th className="pb-2.5 px-2">Customer</th>
                    <th className="pb-2.5 px-2">Saree Inquired</th>
                    <th className="pb-2.5 px-2">Price</th>
                    <th className="pb-2.5 px-2">Channel</th>
                    <th className="pb-2.5 px-2">Status</th>
                    <th className="pb-2.5 px-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-100">
                  {(recentEnquiries || []).slice(0, 5).map((enq) => (
                    <tr key={enq.id} className="hover:bg-sand-50/70 transition-colors">
                      <td className="py-3 px-2">
                        <div className="font-bold text-xs sm:text-sm text-charcoal-900">{enq.userName}</div>
                        <div className="text-[11px] font-medium text-charcoal-500">{enq.phone}</div>
                      </td>
                      <td className="py-3 px-2">
                        <span className="font-semibold text-xs sm:text-sm text-charcoal-800 line-clamp-1">
                          {enq.sareeTitle}
                        </span>
                      </td>
                      <td className="py-3 px-2 font-mono font-bold text-xs sm:text-sm text-charcoal-900">
                        {enq.sareePrice}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-charcoal-600 capitalize">
                          {enq.channel === 'whatsapp' && (
                            <MessageCircle className="w-3.5 h-3.5 text-gold-600 flex-shrink-0" />
                          )}
                          {enq.channel === 'call' && (
                            <Phone className="w-3.5 h-3.5 text-saffron-600 flex-shrink-0" />
                          )}
                          {enq.channel === 'app_inquiry' && (
                            <Sparkles className="w-3.5 h-3.5 text-gold-600 flex-shrink-0" />
                          )}
                          <span>{enq.channel.replace('_', ' ')}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <Badge variant={enq.status}>{enq.status}</Badge>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <button
                          onClick={() => navigate('/enquiries')}
                          className="px-3 py-1 rounded-full bg-sand-100 hover:bg-gold-50 border border-sand-200 text-xs font-semibold text-charcoal-800 hover:text-gold-900 transition-colors cursor-pointer"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Low Stock Handloom Weaves Alert */}
        <div className="bg-white rounded-[22px] border border-sand-200/90 shadow-[0_2px_14px_rgba(0,0,0,0.02)] p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-charcoal-900 tracking-tight">
                  Low Stock Sarees
                </h3>
                <p className="text-xs text-charcoal-500 mt-0.5 font-medium">
                  Heritage pieces with 2 or fewer remaining
                </p>
              </div>

              <span className="w-7 h-7 rounded-full bg-saffron-50 text-saffron-800 border border-saffron-200 flex items-center justify-center font-bold text-xs">
                {lowStockSarees?.length || 0}
              </span>
            </div>

            {/* List of Low Stock items */}
            <div className="space-y-3 pt-1">
              {(lowStockSarees || []).slice(0, 4).map((saree) => (
                <div
                  key={saree.id}
                  className="p-3 rounded-2xl border border-sand-200 bg-sand-50/50 hover:bg-sand-100/50 transition-colors flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {saree.image ? (
                      <img
                        src={saree.image}
                        alt={saree.title || '-'}
                        className="w-11 h-11 rounded-xl object-cover border border-sand-200 flex-shrink-0"
                      />
                    ) : (
                      <span className="w-11 h-11 rounded-xl border border-sand-200 flex items-center justify-center text-charcoal-400 flex-shrink-0">-</span>
                    )}
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-charcoal-900 truncate">
                        {dash(saree.title)}
                      </h4>
                      <p className="text-xs font-semibold text-gold-700">{dash(saree.price)}</p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="px-2 py-0.5 rounded-full bg-saffron-50 text-saffron-800 text-[11px] font-bold border border-saffron-200">
                      {saree.stockQuantity} Left
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => navigate('/sarees')}
            className="w-full mt-5 py-2.5 rounded-full bg-charcoal-900 hover:bg-black text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
          >
            <span>Manage Saree Catalog</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
