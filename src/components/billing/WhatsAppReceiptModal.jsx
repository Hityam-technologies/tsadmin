import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { billingService } from '../../services/billingService';
import {
  Copy,
  Check,
  Send,
  MessageCircle,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

export function WhatsAppReceiptModal({
  isOpen,
  onClose,
  invoice,
}) {
  const [copied, setCopied] = useState(false);
  const [phone, setPhone] = useState(() => (invoice?.customer?.phone || '').replace(/[^0-9]/g, ''));
  const [dispatchStatus, setDispatchStatus] = useState(null);

  useEffect(() => {
    if (invoice?.customer?.phone) {
      setPhone(invoice.customer.phone.replace(/[^0-9]/g, ''));
    } else {
      setPhone('');
    }
  }, [invoice]);

  if (!isOpen || !invoice) return null;

  const messageText = billingService.formatWhatsAppReceipt(invoice);

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLaunchWhatsApp = () => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const phoneParam = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const url = `https://wa.me/${phoneParam}?text=${encodeURIComponent(messageText)}`;
    window.open(url, '_blank');
    setDispatchStatus('launched');
  };

  const handleSimulateDispatch = async () => {
    setDispatchStatus('sending');
    await billingService.simulateWhatsAppDispatch(invoice.id);
    setDispatchStatus('sent');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="WhatsApp Digital Tax Receipt"
      subtitle={`Invoice ${invoice.invoiceNumber || 'TS-INV'} • Recipient: ${invoice.customer?.name || 'Walk-in Guest'}`}
      maxWidth="max-w-xl"
    >
      <div className="space-y-4 pt-1 font-sans">
        {/* Recipient Phone Bar */}
        <div>
          <label className="block text-xs font-semibold text-charcoal-800 mb-1">
            Recipient WhatsApp Mobile Number (10 digits)
          </label>
          <div className="flex gap-2">
            <span className="inline-flex items-center px-3 rounded-xl border border-sand-300 bg-sand-100 text-xs font-bold text-charcoal-700">
              🇮🇳 +91
            </span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="e.g. 9823456789"
              maxLength={10}
              className="flex-1 rounded-xl border border-sand-300 px-3 py-2 text-xs font-mono font-bold text-charcoal-900 focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
            />
          </div>
        </div>

        {/* Message Preview Box */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-charcoal-500 flex items-center gap-1.5">
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              Receipt Message Preview:
            </label>
            <button
              type="button"
              onClick={handleCopy}
              className="text-xs font-bold text-gold-700 hover:text-gold-900 flex items-center gap-1 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span className="text-emerald-700">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy Text</span>
                </>
              )}
            </button>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 max-h-56 overflow-y-auto font-mono text-[11px] leading-relaxed text-charcoal-800 whitespace-pre-wrap">
            {messageText}
          </div>
        </div>

        {/* Delivery Status Toast */}
        {dispatchStatus === 'sent' && (
          <div className="p-3 rounded-xl bg-emerald-100/80 border border-emerald-300 text-xs text-emerald-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700 flex-shrink-0" />
            <span className="font-semibold">
              WhatsApp receipt successfully dispatched to +91 {phone || invoice.customer.phone}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-sand-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-sand-300 text-xs font-bold text-charcoal-700 hover:bg-sand-100 transition-colors"
          >
            Close
          </button>

          <button
            type="button"
            onClick={handleSimulateDispatch}
            className="px-4 py-2 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-xs font-bold text-emerald-800 transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Mark Dispatched</span>
          </button>

          <button
            type="button"
            onClick={handleLaunchWhatsApp}
            disabled={!phone && !invoice.customer?.phone}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-extrabold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open in WhatsApp</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
