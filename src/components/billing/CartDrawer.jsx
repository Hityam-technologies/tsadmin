import React, { useState } from 'react';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  RotateCcw,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { formatINR } from '../../lib/utils';

export function CartDrawer({
  cartItems = [],
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onAddCustomItem,
  totals,
  onProceedToPayment,
}) {
  // Custom Add-on input state
  const [isCustomFormOpen, setIsCustomFormOpen] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customPrice, setCustomPrice] = useState('');

  const handleCustomItemSubmit = (e) => {
    e.preventDefault();
    const title = customTitle.trim();
    const price = Number(customPrice);
    if (!title || !price || price <= 0) return;

    if (onAddCustomItem) {
      onAddCustomItem({ title, price });
    }
    setCustomTitle('');
    setCustomPrice('');
    setIsCustomFormOpen(false);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 h-full max-h-full bg-white/95 backdrop-blur-xl rounded-[22px] border border-sand-200/90 shadow-[0_2px_14px_rgba(0,0,0,0.02)] p-4 sm:p-5 overflow-hidden">
      {/* =========================================================================
          FIXED TOP: Active Bill Header
         ========================================================================= */}
      <div className="flex-shrink-0 pb-3 mb-2.5 border-b border-sand-200 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gold-50 border border-gold-200 flex items-center justify-center text-gold-700 shadow-2xs">
            <ShoppingBag className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-charcoal-900 leading-tight">
              Active Bill
            </h3>
            <p className="text-[11px] text-charcoal-500 font-medium">
              {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in bill
            </p>
          </div>
        </div>

        {cartItems.length > 0 && (
          <button
            type="button"
            onClick={onClearCart}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-charcoal-500 hover:text-maroon-700 hover:bg-maroon-50 border border-sand-200 hover:border-maroon-200 transition-colors flex items-center gap-1 cursor-pointer"
            title="Clear active bill"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* =========================================================================
          SCROLLING AREA: Saree Items & Custom Add-ons
         ========================================================================= */}
      <div
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pr-1 space-y-2.5 billing-scrollbar"
        style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
      >
        {/* Saree & Add-on Items List */}
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-36 text-center p-4 rounded-xl border border-dashed border-sand-300 bg-sand-50/50">
            <ShoppingBag className="w-7 h-7 text-charcoal-300 mb-1.5" />
            <p className="text-sm font-bold text-charcoal-700">Bill is Empty</p>
            <p className="text-xs text-charcoal-400 mt-0.5 max-w-xs">
              Select sarees from the catalog or add a custom service to start billing.
            </p>
          </div>
        ) : (
          cartItems.map((item) => (
            <div
              key={item.sareeId}
              className={`p-2.5 rounded-xl border shadow-2xs flex items-center justify-between gap-3 transition-all ${
                item.isCustom
                  ? 'bg-gold-50/40 border-gold-300/80 hover:border-gold-400'
                  : 'bg-white border-sand-200/90 hover:border-gold-300'
              }`}
            >
              {/* Thumbnail: Portrait for Sarees, Gold Icon for Custom Add-ons */}
              {item.isCustom ? (
                <div className="w-11 h-13 rounded-lg bg-gold-50 border border-gold-300/80 flex flex-col items-center justify-center text-gold-800 flex-shrink-0 shadow-2xs">
                  <Sparkles className="w-4 h-4 text-gold-700 mb-0.5" />
                  <span className="text-[9px] font-bold uppercase tracking-wider text-gold-900 leading-none">
                    Add-on
                  </span>
                </div>
              ) : (
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-11 h-13 rounded-lg object-cover object-top border border-sand-200 flex-shrink-0"
                />
              )}

              {/* Title & Badge */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                      item.isCustom
                        ? 'text-gold-900 bg-gold-100/90 border-gold-300'
                        : 'text-gold-800 bg-gold-50 border-gold-200'
                    }`}
                  >
                    {item.isCustom ? '#CUSTOM' : `#${item.productCode || '100001'}`}
                  </span>
                </div>
                <h4 className="text-xs sm:text-sm font-semibold text-charcoal-900 truncate mt-1">
                  {item.title}
                </h4>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center gap-1 bg-sand-50 rounded-lg p-0.5 border border-sand-200">
                <button
                  type="button"
                  onClick={() => onUpdateQuantity(item.sareeId, item.quantity - 1)}
                  className="w-6 h-6 rounded flex items-center justify-center hover:bg-white text-charcoal-700 transition-colors cursor-pointer"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-5 text-center text-xs font-bold font-mono text-charcoal-900">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => onUpdateQuantity(item.sareeId, item.quantity + 1)}
                  disabled={item.quantity >= (item.availableStock || 99)}
                  className="w-6 h-6 rounded flex items-center justify-center hover:bg-white text-charcoal-700 disabled:opacity-30 transition-colors cursor-pointer"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {/* Row Total & Remove */}
              <div className="text-right flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold font-mono text-charcoal-900">
                  {formatINR(item.price * item.quantity)}
                </span>
                <button
                  type="button"
                  onClick={() => onRemoveItem(item.sareeId)}
                  className="p-1 rounded-lg text-charcoal-400 hover:text-maroon-700 hover:bg-maroon-50 transition-colors cursor-pointer"
                  title="Remove item"
                  aria-label="Remove item"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}

        {/* =====================================================================
            CUSTOM ADD-ON INPUT (Type custom service or charge directly)
           ===================================================================== */}
        <div className="p-2.5 rounded-xl bg-sand-50/70 border border-sand-200/90">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-charcoal-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-gold-600" />
              <span>Custom Service / Add-on</span>
            </span>
            {isCustomFormOpen && (
              <button
                type="button"
                onClick={() => setIsCustomFormOpen(false)}
                className="text-[11px] text-charcoal-500 hover:text-charcoal-800 font-semibold cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>

          {isCustomFormOpen ? (
            <form onSubmit={handleCustomItemSubmit} className="space-y-2 pt-1">
              <div>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Service / Add-on name (e.g. Blouse Stitching, Zari Work)"
                  className="w-full rounded-lg border border-sand-300 px-2.5 py-1.5 text-xs text-charcoal-900 bg-white placeholder:text-charcoal-400 focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
                  autoFocus
                />
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-charcoal-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="1"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    placeholder="Price (₹)"
                    className="w-full rounded-lg border border-sand-300 pl-6 pr-2.5 py-1.5 text-xs font-mono font-bold text-charcoal-900 bg-white placeholder:text-charcoal-400 focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!customTitle.trim() || !customPrice || Number(customPrice) <= 0}
                  className="px-3 py-1.5 rounded-lg bg-charcoal-900 hover:bg-black text-white text-xs font-bold transition-colors disabled:opacity-40 cursor-pointer whitespace-nowrap"
                >
                  + Add to Bill
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsCustomFormOpen(true)}
              className="w-full py-2 px-3 rounded-lg border border-dashed border-gold-300 bg-white hover:bg-gold-50/50 text-xs font-bold text-gold-900 hover:text-gold-950 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5 text-gold-600" />
              <span>+ Type Custom Item or Charge</span>
            </button>
          )}
        </div>
      </div>

      {/* =========================================================================
          FIXED BOTTOM: Financial Summary & Proceed to Checkout
         ========================================================================= */}
      <div className="flex-shrink-0 pt-2.5 mt-2 border-t border-sand-200 space-y-2">
        {/* Financial Summary */}
        <div className="space-y-1 text-xs bg-sand-50/80 p-3 rounded-xl border border-sand-200/80">
          <div className="flex justify-between text-xs text-charcoal-600 font-medium">
            <span>Subtotal</span>
            <span className="font-mono font-bold text-charcoal-900">
              {formatINR(totals.itemsSubtotal)}
            </span>
          </div>

          <div className="flex justify-between text-xs text-charcoal-500 pt-1 border-t border-sand-200/60">
            <span>GST (5%)</span>
            <span className="font-mono">₹{totals.totalGst.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-sm sm:text-base font-bold text-charcoal-900 pt-1 border-t border-sand-300">
            <span>Grand Total</span>
            <span className="font-mono font-extrabold text-charcoal-900">
              {formatINR(totals.grandTotal)}
            </span>
          </div>
        </div>

        {/* Proceed to Checkout / Collect Payment */}
        <button
          type="button"
          onClick={onProceedToPayment}
          disabled={cartItems.length === 0}
          className="w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-gold-600 hover:bg-gold-700 disabled:opacity-40 shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Proceed to Checkout</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
