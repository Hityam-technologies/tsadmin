import React from 'react';
import { formatINR } from '../../lib/utils';
import {
  PauseCircle,
  Play,
  Trash2,
  Clock,
  User,
} from 'lucide-react';

export function HeldBillsView({
  heldBills = [],
  onResumeBill,
  onDiscardBill,
}) {
  return (
    <div className="bg-white/90 backdrop-blur-xl rounded-[20px] border border-sand-200/90 shadow-[0_4px_20px_rgba(197,162,83,0.08)] p-4 sm:p-5 flex-1 h-full min-h-0 flex flex-col font-sans overflow-hidden">
      {/* Header (Pinned) */}
      <div className="flex-shrink-0 flex items-center justify-between mb-3">
        <div>
          <h2 className="text-base font-serif font-extrabold text-charcoal-900 tracking-tight flex items-center gap-2">
            <PauseCircle className="w-4 h-4 text-gold-600" />
            <span>Held Bills Register</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-saffron-100 text-saffron-900 border border-saffron-200">
              {heldBills.length} Active
            </span>
          </h2>
          <p className="text-xs text-charcoal-500 mt-0.5">
            Bills placed on hold during customer fitting or saree selections. Resume directly back into the cart.
          </p>
        </div>
      </div>

      {/* Main Body (Scrolls internally) */}
      {heldBills.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 text-center p-8 border border-dashed border-sand-300 rounded-2xl bg-sand-50/40">
          <PauseCircle className="w-10 h-10 text-charcoal-300 mb-2" />
          <h3 className="text-sm font-bold text-charcoal-700">No Bills Currently on Hold</h3>
          <p className="text-xs text-charcoal-400 mt-1 max-w-sm">
            When a customer pauses their billing, click "Hold Bill" in the cart to store their basket here.
          </p>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto pr-1">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pb-2">
            {heldBills.map((bill) => {
              const totalAmount = bill.items.reduce(
                (sum, it) => sum + it.price * it.quantity,
                0
              ) + (bill.services || []).reduce((sum, s) => sum + s.price, 0);

              return (
                <div
                  key={bill.id}
                  className="p-4 rounded-2xl bg-white border border-sand-200 shadow-2xs hover:border-gold-400 transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Top Bar: Patron & Time */}
                    <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-sand-200">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gold-100 text-gold-800 flex items-center justify-center font-bold text-xs">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-charcoal-900">
                            {bill.customer?.name || 'Walk-in Guest'}
                          </h4>
                          <p className="text-[10px] text-charcoal-400 font-mono">
                            {bill.customer?.phone || 'No Phone'}
                          </p>
                        </div>
                      </div>

                      <span className="text-[10px] text-charcoal-400 flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-gold-600" />
                        {new Date(bill.heldAt).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {/* Saree Items Summary */}
                    <div className="py-2.5 space-y-1.5">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-charcoal-400">
                        Sarees in Cart ({bill.items.length}):
                      </span>
                      <ul className="space-y-1 text-xs text-charcoal-700">
                        {bill.items.map((it, idx) => (
                          <li key={idx} className="flex items-center justify-between text-[11px]">
                            <span className="truncate pr-2">• {it.title} (x{it.quantity})</span>
                            <span className="font-mono font-bold flex-shrink-0">
                              {formatINR(it.price * it.quantity)}
                            </span>
                          </li>
                        ))}
                      </ul>

                      {bill.note && (
                        <p className="text-[10px] italic text-charcoal-500 bg-sand-50 p-1.5 rounded-lg border border-sand-200 mt-2">
                          Note: {bill.note}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions & Total */}
                  <div className="pt-2.5 border-t border-sand-200 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] text-charcoal-400 block">Est. Subtotal</span>
                      <span className="text-xs font-extrabold font-mono text-charcoal-900">
                        {formatINR(totalAmount)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onDiscardBill(bill.id)}
                        className="p-1.5 rounded-lg border border-sand-300 hover:bg-maroon-50 text-charcoal-400 hover:text-maroon-700 transition-colors cursor-pointer"
                        title="Discard held bill"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onResumeBill(bill.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gold-600 hover:bg-gold-700 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Resume</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
