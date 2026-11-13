import React from 'react';
import { Modal } from '../common/Modal';
import { formatINR } from '../../lib/utils';
import { CalendarCheck2 } from 'lucide-react';

export function DayClosingModal({
  isOpen,
  onClose,
  todaySummary,
  staff,
  onCompleteClosing,
}) {
  if (!isOpen) return null;

  const handleCloseRegister = () => {
    if (onCompleteClosing) {
      onCompleteClosing();
    } else {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Store Register Day Closing"
      subtitle={`Register: ${staff?.register || 'Counter 01'} • Cashier: ${staff?.name || 'Staff'}`}
      maxWidth="max-w-md"
    >
      <div className="space-y-4 pt-1 font-sans text-charcoal-900">
        {/* Today's Register Summary */}
        <div className="p-4 rounded-2xl bg-sand-50/80 border border-sand-200 space-y-3">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-charcoal-400 block">
            Today's Register Summary
          </span>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-charcoal-500 block text-[11px]">Total Revenue</span>
              <span className="font-extrabold text-charcoal-900 font-mono text-base">
                {formatINR(todaySummary?.totalRevenue || 0)}
              </span>
            </div>
            <div>
              <span className="text-charcoal-500 block text-[11px]">Total Bills</span>
              <span className="font-extrabold text-charcoal-900 font-mono text-base">
                {todaySummary?.billsCount || 0} Invoices
              </span>
            </div>
          </div>

          <div className="pt-2.5 border-t border-sand-200 grid grid-cols-3 gap-2 text-xs">
            <div>
              <span className="block text-charcoal-400 text-[10px] uppercase font-bold">Cash</span>
              <span className="font-mono font-bold text-charcoal-800">{formatINR(todaySummary?.cashTotal || 0)}</span>
            </div>
            <div>
              <span className="block text-charcoal-400 text-[10px] uppercase font-bold">UPI</span>
              <span className="font-mono font-bold text-emerald-700">{formatINR(todaySummary?.upiTotal || 0)}</span>
            </div>
            <div>
              <span className="block text-charcoal-400 text-[10px] uppercase font-bold">Card</span>
              <span className="font-mono font-bold text-saffron-700">{formatINR(todaySummary?.cardTotal || 0)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons: Just Close & Cancel */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-sand-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-sand-300 text-xs font-bold text-charcoal-700 hover:bg-sand-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleCloseRegister}
            className="px-4 py-2 rounded-xl bg-gold-600 hover:bg-gold-700 text-white text-xs font-extrabold shadow-md shadow-gold-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <CalendarCheck2 className="w-3.5 h-3.5" />
            <span>Close Register</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
