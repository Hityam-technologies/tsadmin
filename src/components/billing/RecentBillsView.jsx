import React, { useState, useEffect, useCallback } from 'react';
import { billingService } from '../../services/billingService';
import { formatINR } from '../../lib/utils';
import { TableSkeleton } from '../common/Skeleton';
import {
  Search,
  Share2,
  RotateCcw,
  Eye,
  FileText,
  Archive,
  Plus,
  Check,
  AlertCircle,
} from 'lucide-react';

export function RecentBillsView({
  onViewInvoice,
  onOpenWhatsApp,
  onProcessReturn,
  onRestockSuccess,
}) {
  const [activeSection, setActiveSection] = useState('invoices'); // 'invoices' | 'sold_out'

  // =========================================================================
  // SECTION 1: INVOICES AUDIT LOG STATE
  // =========================================================================
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [search, setSearch] = useState('');
  const [paymentMode, setPaymentMode] = useState('all');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // =========================================================================
  // SECTION 2: SOLD OUT ITEMS STATE (HIDDEN FROM POS, ONLY SHOWN HERE)
  // =========================================================================
  const [soldOutItems, setSoldOutItems] = useState([]);
  const [soldOutSearch, setSoldOutSearch] = useState('');
  const [soldOutCategory, setSoldOutCategory] = useState('all');
  const [restockedIds, setRestockedIds] = useState([]);

  // Load Invoices
  const loadInvoices = useCallback(async () => {
    setLoadingInvoices(true);
    try {
      const res = await billingService.getInvoices({
        search,
        paymentMode,
        status,
        page,
        limit: 10,
      });
      setInvoices(res.items || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } finally {
      setLoadingInvoices(false);
    }
  }, [search, paymentMode, status, page]);

  // Load Sold Out Items
  const loadSoldOutItems = useCallback(async () => {
    const items = await billingService.getSoldOutProducts({
      search: soldOutSearch,
      category: soldOutCategory,
    });
    setSoldOutItems(items);
  }, [soldOutSearch, soldOutCategory]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  useEffect(() => {
    loadSoldOutItems();
  }, [loadSoldOutItems]);

  // Handle Quick Restock of a Sold Out Saree
  const handleRestock = async (sareeId, quantity = 1) => {
    const res = await billingService.restockProduct(sareeId, quantity);
    if (res.success) {
      setRestockedIds((prev) => [...prev, sareeId]);
      setTimeout(() => {
        setRestockedIds((prev) => prev.filter((id) => id !== sareeId));
      }, 2000);
      loadSoldOutItems();
      loadInvoices();
      if (onRestockSuccess) onRestockSuccess(res.saree);
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-xl rounded-[22px] border border-sand-200/90 shadow-[0_2px_14px_rgba(0,0,0,0.02)] p-4 sm:p-5 flex-1 h-full min-h-0 flex flex-col font-sans overflow-hidden">
      {/* =====================================================================
          2-SECTION SEGMENTED SWITCHER (RECENT BILLS & SOLD OUT ITEMS)
         ===================================================================== */}
      <div className="flex-shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 mb-3 border-b border-sand-200">
        <div className="flex items-center gap-2">
          {/* Section 1: Recent Store Invoices */}
          <button
            type="button"
            onClick={() => setActiveSection('invoices')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeSection === 'invoices'
                ? 'bg-charcoal-900 text-white shadow-sm'
                : 'bg-sand-100 hover:bg-sand-200/80 text-charcoal-700'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-gold-400" />
            <span>Recent Store Invoices</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                activeSection === 'invoices'
                  ? 'bg-gold-500 text-charcoal-950'
                  : 'bg-sand-200 text-charcoal-800'
              }`}
            >
              {total || invoices.length}
            </span>
          </button>

          {/* Section 2: Sold Out Items (Exclusive to this screen) */}
          <button
            type="button"
            onClick={() => setActiveSection('sold_out')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeSection === 'sold_out'
                ? 'bg-charcoal-900 text-white shadow-sm'
                : 'bg-sand-100 hover:bg-sand-200/80 text-charcoal-700'
            }`}
          >
            <Archive className="w-3.5 h-3.5 text-saffron-400" />
            <span>Sold Out Items</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                activeSection === 'sold_out'
                  ? 'bg-maroon-600 text-white'
                  : 'bg-maroon-100 text-maroon-800'
              }`}
            >
              {soldOutItems.length} Sold Out
            </span>
          </button>
        </div>

        {/* Contextual Subtitle */}
        <p className="text-xs text-charcoal-500 hidden sm:block">
          {activeSection === 'invoices'
            ? 'Audit log of all counter billing transactions, reprints & customer receipts'
            : 'Weaves sold out at counter • Exclusively archived here & hidden from POS catalog'}
        </p>
      </div>

      {/* =====================================================================
          VIEW A: RECENT STORE INVOICES (ACTIVE WHEN SECTION === 'invoices')
         ===================================================================== */}
      {activeSection === 'invoices' && (
        <>
          {/* Top Filter & Search Bar */}
          <div className="flex-shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-3">
            <div>
              <h2 className="text-sm sm:text-base font-serif font-extrabold text-charcoal-900 tracking-tight">
                Recent Store Invoices
              </h2>
              <p className="text-[11px] text-charcoal-500 mt-0.5">
                Audit log of all counter billing transactions, reprints & customer receipts
              </p>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search Invoice # or Patron Phone..."
                  className="rounded-xl border border-sand-300 pl-8 pr-3 py-1.5 text-xs text-charcoal-900 placeholder:text-charcoal-400 focus:outline-none focus:border-gold-500 bg-white"
                />
              </div>

              {/* Payment Mode Filter */}
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="rounded-xl border border-sand-300 px-2.5 py-1.5 text-xs text-charcoal-900 bg-white focus:outline-none focus:border-gold-500"
              >
                <option value="all">All Payment Modes</option>
                <option value="cash">Cash</option>
                <option value="upi">UPI / QR</option>
                <option value="card">Card (POS)</option>
                <option value="split">Split Payment</option>
              </select>

              {/* Status Filter */}
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="rounded-xl border border-sand-300 px-2.5 py-1.5 text-xs text-charcoal-900 bg-white focus:outline-none focus:border-gold-500"
              >
                <option value="all">All Statuses</option>
                <option value="completed">Completed / Paid</option>
                <option value="returned">Returned / Refunded</option>
              </select>
            </div>
          </div>

          {/* Invoices Table */}
          <div className="flex-1 min-h-0 overflow-auto border border-sand-200 rounded-xl bg-white">
            {loadingInvoices ? (
              <TableSkeleton rows={8} cols={6} />
            ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-sand-100/80 text-charcoal-700 font-bold text-xs uppercase tracking-wider sticky top-0 z-10">
                <tr>
                  <th className="p-3">Invoice Number</th>
                  <th className="p-3">Date & Time</th>
                  <th className="p-3">Patron Name</th>
                  <th className="p-3 text-center">Items</th>
                  <th className="p-3 text-right">Net Amount</th>
                  <th className="p-3 text-center">Tender</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-200 bg-white">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-charcoal-400">
                      No invoices found matching your filters.
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr
                      key={inv.id}
                      onClick={() => onViewInvoice(inv)}
                      className="hover:bg-gold-50/50 transition-colors cursor-pointer group"
                    >
                      <td className="p-3 font-mono font-bold text-gold-900">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewInvoice(inv);
                          }}
                          className="text-left font-mono font-bold text-gold-900 group-hover:text-gold-700 hover:underline cursor-pointer"
                        >
                          {inv.invoiceNumber || 'TS-INV'}
                        </button>
                      </td>
                      <td className="p-3 text-charcoal-600">
                        <span className="font-semibold text-charcoal-800">
                          {new Date(inv.date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>{' '}
                        <span className="text-xs text-charcoal-400">
                          {new Date(inv.date).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </td>
                      <td className="p-3">
                        <p className="font-bold text-charcoal-900">{inv.customer?.name || 'Walk-in Guest'}</p>
                        <p className="text-xs text-charcoal-400 font-mono">
                          {inv.customer?.phone || 'Walk-in'}
                        </p>
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-charcoal-700">
                        {(inv.items || []).reduce((sum, it) => sum + (it.quantity || 1), 0)}
                      </td>
                      <td className="p-3 text-right font-mono font-extrabold text-charcoal-900">
                        {formatINR(inv.pricing?.grandTotal)}
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-mono font-bold uppercase bg-sand-100 text-charcoal-800 border border-sand-200">
                          {inv.payment?.mode || 'cash'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {inv.status === 'returned' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-maroon-50 text-maroon-700 border border-maroon-200">
                            Returned
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Paid
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <div
                          className="flex items-center justify-end gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewInvoice(inv);
                            }}
                            title="View & Print Invoice"
                            className="p-1.5 rounded-lg border border-sand-300 hover:bg-gold-50 hover:text-gold-900 text-charcoal-600 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenWhatsApp(inv);
                            }}
                            title="Send WhatsApp Receipt"
                            className="p-1.5 rounded-lg border border-emerald-200 hover:bg-emerald-50 text-emerald-700 transition-colors cursor-pointer"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>

                          {inv.status !== 'returned' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onProcessReturn(inv);
                              }}
                              title="Process Return & Restore Stock"
                              className="p-1.5 rounded-lg border border-sand-300 hover:bg-maroon-50 hover:text-maroon-700 text-charcoal-400 transition-colors cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex-shrink-0 pt-3 border-t border-sand-200 flex items-center justify-between text-xs text-charcoal-500">
              <span>Total {total} invoices recorded</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-2.5 py-1 rounded-lg border border-sand-300 bg-white disabled:opacity-40 cursor-pointer"
                >
                  Previous
                </button>
                <span className="font-mono font-bold text-charcoal-800 px-2">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-2.5 py-1 rounded-lg border border-sand-300 bg-white disabled:opacity-40 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* =====================================================================
          VIEW B: SOLD OUT ITEMS (EXCLUSIVE ARCHIVE - NEVER SHOWN IN POS)
         ===================================================================== */}
      {activeSection === 'sold_out' && (
        <>
          {/* Top Filter & Search Bar for Sold Out Sarees */}
          <div className="flex-shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-serif font-extrabold text-charcoal-900 tracking-tight">
                  Sold Out Sarees Archive
                </h2>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-maroon-50 text-maroon-700 border border-maroon-200">
                  Hidden From POS Catalog
                </span>
              </div>
              <p className="text-[11px] text-charcoal-500 mt-0.5">
                These handloom pieces are completely sold out and excluded from the billing catalog. Shown only here.
              </p>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-charcoal-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={soldOutSearch}
                  onChange={(e) => setSoldOutSearch(e.target.value)}
                  placeholder="Search by code, title, weave..."
                  className="rounded-xl border border-sand-300 pl-8 pr-3 py-1.5 text-xs text-charcoal-900 placeholder:text-charcoal-400 focus:outline-none focus:border-gold-500 bg-white w-48 sm:w-60"
                />
              </div>

              {/* Category Filter */}
              <select
                value={soldOutCategory}
                onChange={(e) => setSoldOutCategory(e.target.value)}
                className="rounded-xl border border-sand-300 px-2.5 py-1.5 text-xs text-charcoal-900 bg-white focus:outline-none focus:border-gold-500"
              >
                <option value="all">All Categories</option>
                <option value="kanchipuram">Kanchipuram</option>
                <option value="katan">Banarasi Katan</option>
                <option value="paithani">Paithani</option>
                <option value="tissue">Tissue Organza</option>
                <option value="bridal">Bridal Weaves</option>
              </select>
            </div>
          </div>

          {/* Sold Out Items Table */}
          <div className="flex-1 min-h-0 overflow-auto border border-sand-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-sand-100/80 text-charcoal-700 font-bold text-xs uppercase tracking-wider sticky top-0 z-10">
                <tr>
                  <th className="p-3">Saree & Product Code</th>
                  <th className="p-3">Weave Technique & Origin</th>
                  <th className="p-3 text-right">Retail Price</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3">Sale Record / Invoice</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-200 bg-white">
                {soldOutItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-charcoal-400">
                      <div className="max-w-sm mx-auto flex flex-col items-center">
                        <AlertCircle className="w-8 h-8 text-charcoal-300 mb-2" />
                        <p className="font-bold text-charcoal-800 text-sm">No Sold Out Sarees Found</p>
                        <p className="text-xs text-charcoal-500 mt-1">
                          All curated weaves currently have stock in the catalog, or no items match your search filter.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  soldOutItems.map((saree) => {
                    const isRestocked = restockedIds.includes(saree.id);
                    const image =
                      (typeof saree.images?.[0] === 'string'
                        ? saree.images[0]
                        : saree.images?.[0]?.url) ||
                      saree.image ||
                      '';

                    return (
                      <tr
                        key={saree.id}
                        className="hover:bg-sand-50/70 transition-colors"
                      >
                        {/* Saree Thumbnail & Info */}
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            {image ? (
                              <img
                                src={image}
                                alt={saree.title}
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                                className="w-12 h-15 rounded-lg object-cover object-top border border-sand-200 flex-shrink-0 shadow-2xs"
                              />
                            ) : (
                              <div className="w-12 h-15 rounded-lg bg-sand-200 border border-sand-200 flex-shrink-0" />
                            )}
                            <div>
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-charcoal-900 text-white">
                                  #{saree.productCode || '100000'}
                                </span>
                                <span className="text-[10px] font-bold text-charcoal-500 uppercase tracking-wider">
                                  {saree.brand || 'Tripuraa'}
                                </span>
                              </div>
                              <p className="font-bold text-charcoal-900 text-xs sm:text-sm line-clamp-1">
                                {saree.title}
                              </p>
                              <p className="text-[11px] text-charcoal-500 line-clamp-1">
                                {saree.fabric || 'Pure Silk'} • {saree.colorTheme || 'Bespoke'}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Weave Technique & Origin */}
                        <td className="p-3">
                          <p className="font-bold text-charcoal-800">{saree.weave || 'Heritage Loom'}</p>
                          <p className="text-[11px] text-charcoal-500">{saree.origin || 'India'}</p>
                          {saree.zari && (
                            <span className="inline-block mt-1 text-[10px] font-semibold text-gold-800 bg-gold-50 border border-gold-200/60 px-1.5 py-0.5 rounded">
                              {saree.zari}
                            </span>
                          )}
                        </td>

                        {/* Retail Price */}
                        <td className="p-3 text-right">
                          <span className="font-mono font-extrabold text-charcoal-900 text-sm block">
                            {formatINR(saree.numericPrice || saree.price)}
                          </span>
                          {saree.mrp && (
                            <span className="text-[10px] text-charcoal-400 line-through font-mono">
                              {formatINR(saree.numericMrp || saree.mrp)}
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="p-3 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-maroon-100 text-maroon-800 border border-maroon-200">
                            Sold Out (0 Left)
                          </span>
                          <span className="block text-[10px] text-charcoal-400 mt-0.5 font-medium">
                            Not in Billing Catalog
                          </span>
                        </td>

                        {/* Sale Record / Invoice */}
                        <td className="p-3">
                          {saree.relatedInvoice ? (
                            <div>
                              <button
                                type="button"
                                onClick={() => onViewInvoice && onViewInvoice(saree.relatedInvoice)}
                                className="font-mono font-bold text-xs text-gold-900 hover:text-gold-700 hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <span>{saree.relatedInvoice.invoiceNumber}</span>
                                <Eye className="w-3 h-3" />
                              </button>
                              <p className="text-[11px] text-charcoal-700 font-semibold mt-0.5">
                                Patron: {saree.relatedInvoice.customer?.name || 'Walk-in Guest'}
                              </p>
                              <p className="text-[10px] text-charcoal-400">
                                {new Date(saree.relatedInvoice.date).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </p>
                            </div>
                          ) : (
                            <div>
                              <span className="text-xs text-charcoal-600 font-semibold block">
                                Counter Depleted Weave
                              </span>
                              <span className="text-[10px] text-charcoal-400">
                                Single artisanal piece sold
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* View Bill Receipt */}
                            {saree.relatedInvoice && (
                              <button
                                type="button"
                                onClick={() => onViewInvoice && onViewInvoice(saree.relatedInvoice)}
                                title="View Customer Receipt"
                                className="px-2.5 py-1.5 rounded-xl border border-sand-300 hover:bg-gold-50 text-charcoal-700 hover:text-gold-900 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>View Bill</span>
                              </button>
                            )}

                            {/* Quick Restock Action */}
                            <button
                              type="button"
                              onClick={() => handleRestock(saree.id, 1)}
                              disabled={isRestocked}
                              title="Restock +1 unit (Restores to POS catalog)"
                              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                                isRestocked
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-sand-100 hover:bg-sand-200 border border-sand-300 text-charcoal-800'
                              }`}
                            >
                              {isRestocked ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Restocked!</span>
                                </>
                              ) : (
                                <>
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Restock +1</span>
                                </>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Bottom Summary Bar for Sold Out Sarees */}
          <div className="flex-shrink-0 pt-3 border-t border-sand-200 flex items-center justify-between text-xs text-charcoal-500">
            <span>
              Total <strong className="text-charcoal-800">{soldOutItems.length}</strong> sold-out sarees exclusively archived here
            </span>
            <span className="text-[11px] text-charcoal-400">
              Restocking a piece immediately restores it to the active POS counter catalog
            </span>
          </div>
        </>
      )}
    </div>
  );
}
