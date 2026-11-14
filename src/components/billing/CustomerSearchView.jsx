import React, { useState, useEffect, useCallback } from 'react';
import { billingService } from '../../services/billingService';
import { formatINR } from '../../lib/utils';
import { TableSkeleton } from '../common/Skeleton';
import {
  Users,
  Search,
  UserPlus,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  List,
  LayoutGrid,
  X,
} from 'lucide-react';

export function CustomerSearchView({
  onSelectCustomer,
  onOpenNewCustomer,
}) {
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const list = await billingService.getCustomers(search);
      setCustomers(list || []);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  return (
    <div className="bg-white/95 backdrop-blur-xl rounded-[22px] border border-sand-200/90 shadow-[0_2px_14px_rgba(0,0,0,0.02)] p-4 sm:p-5 flex-1 h-full min-h-0 flex flex-col font-sans overflow-hidden">
      {/* Top Filter & Search Controls */}
      <div className="flex-shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-3">
        <div>
          <h2 className="text-base font-serif font-extrabold text-charcoal-900 tracking-tight flex items-center gap-2">
            <Users className="w-4 h-4 text-gold-600" />
            <span>Customer Directory</span>
          </h2>
          <p className="text-xs text-charcoal-500 mt-0.5">
            Search customer profiles, purchase history, and select for active billing
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-72">
            <Search className="w-3.5 h-3.5 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Name, Phone, or City..."
              className="w-full rounded-xl border border-sand-300 pl-8 pr-7 py-1.5 text-xs text-charcoal-900 placeholder:text-charcoal-400 focus:outline-none focus:border-gold-500 bg-white"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-charcoal-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* View Mode Toggle: Table (default) / Grid */}
          <div className="flex items-center p-0.5 rounded-xl border border-sand-300 bg-sand-50/70">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              title="Table View"
              className={`p-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-charcoal-900 shadow-2xs font-bold'
                  : 'text-charcoal-500 hover:text-charcoal-800'
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              title="Grid View"
              className={`p-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-charcoal-900 shadow-2xs font-bold'
                  : 'text-charcoal-500 hover:text-charcoal-800'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Add Customer Button */}
          <button
            type="button"
            onClick={onOpenNewCustomer}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-charcoal-900 hover:bg-black text-white text-xs font-bold transition-all shadow-2xs hover:shadow-sm cursor-pointer flex-shrink-0"
          >
            <UserPlus className="w-3.5 h-3.5 text-gold-400" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex-1 min-h-0 overflow-auto border border-sand-200 rounded-xl bg-white">
          <TableSkeleton rows={8} cols={4} />
        </div>
      ) : customers.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center border border-sand-200 rounded-xl bg-white">
          <div className="w-12 h-12 rounded-full bg-sand-100 flex items-center justify-center text-charcoal-400 mb-3">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-charcoal-800">No Customers Found</h3>
          <p className="text-xs text-charcoal-500 max-w-sm mt-1 mb-4">
            {search
              ? `No registered profiles match "${search}". You can quickly add them as a new customer.`
              : 'No customer profiles are currently registered in the database.'}
          </p>
          <button
            type="button"
            onClick={onOpenNewCustomer}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gold-600 hover:bg-gold-700 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Register New Customer</span>
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW (Default - Matches Admin Portal & RecentBillsView Style) */
        <div className="flex-1 min-h-0 overflow-auto border border-sand-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-sand-100/80 text-charcoal-700 font-bold text-xs uppercase tracking-wider sticky top-0 z-10">
              <tr>
                <th className="p-3">Customer</th>
                <th className="p-3">Contact</th>
                <th className="p-3">City</th>
                <th className="p-3 text-center">Visits</th>
                <th className="p-3 text-right">Lifetime Spend</th>
                <th className="p-3">Preferred Weaves</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-200 bg-white">
              {customers.map((cust) => (
                <tr
                  key={cust.id}
                  onClick={() => onSelectCustomer(cust)}
                  className="hover:bg-gold-50/50 transition-colors cursor-pointer group"
                >
                  <td className="p-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-sand-100 border border-gold-300 flex items-center justify-center text-xs font-serif font-extrabold text-gold-900 flex-shrink-0 group-hover:bg-gold-100 transition-colors">
                        {(cust.name || 'G').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-charcoal-900 group-hover:text-gold-900 transition-colors">
                          {cust.name}
                        </p>
                        <p className="text-[10px] font-mono text-charcoal-400">
                          ID: #{cust.id.replace('cust-', '')}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="p-3">
                    <p className="font-mono font-bold text-charcoal-800 text-xs">
                      {cust.phone}
                    </p>
                    {cust.email && (
                      <p className="text-[11px] text-charcoal-400 truncate max-w-[180px]">
                        {cust.email}
                      </p>
                    )}
                  </td>

                  <td className="p-3">
                    <span className="inline-flex items-center gap-1 text-charcoal-700 font-medium">
                      <MapPin className="w-3 h-3 text-gold-600 flex-shrink-0" />
                      <span>{cust.city || 'Hyderabad'}</span>
                    </span>
                  </td>

                  <td className="p-3 text-center font-mono font-bold text-charcoal-700">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-sand-100 text-charcoal-800 border border-sand-200">
                      {cust.visitsCount || 1} {cust.visitsCount === 1 ? 'visit' : 'visits'}
                    </span>
                  </td>

                  <td className="p-3 text-right font-mono font-extrabold text-charcoal-900">
                    {formatINR(cust.lifetimeSpend || 0)}
                  </td>

                  <td className="p-3">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {cust.preferredWeaves && cust.preferredWeaves.length > 0 ? (
                        cust.preferredWeaves.map((w, wIdx) => (
                          <span
                            key={wIdx}
                            className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-sand-50 text-charcoal-700 border border-sand-200 font-medium"
                          >
                            {w}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-charcoal-400 italic">Silk Handloom</span>
                      )}
                    </div>
                  </td>

                  <td className="p-3 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCustomer(cust);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-charcoal-900 hover:bg-gold-700 text-white text-xs font-bold transition-all shadow-2xs hover:shadow-sm cursor-pointer"
                    >
                      <span>Select for Bill</span>
                      <ArrowRight className="w-3 h-3 text-gold-400 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* GRID VIEW (Compact & Proportional Boutique Cards) */
        <div className="flex-1 min-h-0 overflow-y-auto pr-1">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 pb-2">
            {customers.map((cust) => (
              <div
                key={cust.id}
                onClick={() => onSelectCustomer(cust)}
                className="p-4 rounded-2xl bg-white border border-sand-200 hover:border-gold-400 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between cursor-pointer group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-sand-100 border border-gold-300 flex items-center justify-center text-xs font-serif font-extrabold text-gold-900 flex-shrink-0 group-hover:bg-gold-100 transition-colors">
                        {(cust.name || 'G').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-charcoal-900 group-hover:text-gold-900 transition-colors">
                          {cust.name}
                        </h4>
                        <p className="text-[11px] text-charcoal-500 font-mono flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-gold-600" />
                          <span>{cust.phone}</span>
                        </p>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-sand-50 text-charcoal-700 border border-sand-200">
                      <MapPin className="w-2.5 h-2.5 text-gold-600" />
                      <span>{cust.city || 'Hyderabad'}</span>
                    </span>
                  </div>

                  {cust.email && (
                    <p className="text-xs text-charcoal-400 flex items-center gap-1 mb-2.5 truncate">
                      <Mail className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{cust.email}</span>
                    </p>
                  )}

                  <div className="p-2.5 rounded-xl bg-sand-50/70 border border-sand-200/80 flex items-center justify-between text-xs mb-2.5">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-charcoal-400 block">Visits</span>
                      <span className="font-mono font-bold text-charcoal-800">
                        {cust.visitsCount || 1} {cust.visitsCount === 1 ? 'Visit' : 'Visits'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-charcoal-400 block">Total Spend</span>
                      <span className="font-mono font-bold text-gold-900">
                        {formatINR(cust.lifetimeSpend || 0)}
                      </span>
                    </div>
                  </div>

                  {cust.preferredWeaves && cust.preferredWeaves.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-1">
                      {cust.preferredWeaves.map((w, wIdx) => (
                        <span
                          key={wIdx}
                          className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-sand-50 text-charcoal-700 border border-sand-200 font-medium"
                        >
                          {w}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-2.5 border-t border-sand-100">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectCustomer(cust);
                    }}
                    className="w-full py-1.5 px-3 rounded-xl bg-charcoal-900 group-hover:bg-gold-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                  >
                    <span>Select for Bill</span>
                    <ArrowRight className="w-3.5 h-3.5 text-gold-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pinned Bottom Status Bar */}
      <div className="flex-shrink-0 pt-2.5 border-t border-sand-200 flex items-center justify-between text-xs text-charcoal-500">
        <span>Showing {customers.length} registered {customers.length === 1 ? 'customer' : 'customers'}</span>
        <span className="text-[11px] text-charcoal-400 hidden sm:inline">
          Click any customer row to instantly attach them to the active counter bill
        </span>
      </div>
    </div>
  );
}
