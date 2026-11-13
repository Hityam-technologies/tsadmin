import React, { useRef } from 'react';
import { Modal } from '../common/Modal';
import { formatINR } from '../../lib/utils';
import homeLogo from '../../assets/homeLogo.png';
import {
  Printer,
  Download,
  Share2,
  Plus,
} from 'lucide-react';

function numberToWordsINR(amount) {
  const num = Number(amount) || 0;
  const roundAmt = Math.round(num);
  if (roundAmt <= 0) return 'Zero Rupees Only';

  const singleDigits = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertTwoDigits(n) {
    if (n < 10) return singleDigits[n];
    if (n >= 10 && n < 20) return teens[n - 10];
    return `${tens[Math.floor(n / 10)]} ${singleDigits[n % 10]}`.trim();
  }

  function convertThreeDigits(n) {
    const hundred = Math.floor(n / 100);
    const rest = n % 100;
    let str = '';
    if (hundred > 0) str += `${singleDigits[hundred]} Hundred `;
    if (rest > 0) str += convertTwoDigits(rest);
    return str.trim();
  }

  const crore = Math.floor(roundAmt / 10000000);
  const lakh = Math.floor((roundAmt % 10000000) / 100000);
  const thousand = Math.floor((roundAmt % 100000) / 1000);
  const remaining = roundAmt % 1000;

  let result = '';
  if (crore > 0) result += `${convertTwoDigits(crore % 100)} Crore `;
  if (lakh > 0) result += `${convertTwoDigits(lakh)} Lakh `;
  if (thousand > 0) result += `${convertTwoDigits(thousand)} Thousand `;
  if (remaining > 0) result += convertThreeDigits(remaining);

  return `${result.trim()} Rupees Only`;
}

export function InvoiceModal({
  isOpen,
  onClose,
  invoice,
  onNewBill,
  onOpenWhatsApp,
}) {
  const printRef = useRef(null);

  if (!isOpen || !invoice) return null;

  const customer = invoice.customer || {};
  const items = Array.isArray(invoice.items) ? invoice.items : [];
  const services = Array.isArray(invoice.services) ? invoice.services : [];
  const pricing = invoice.pricing || {};
  const payment = invoice.payment || {};
  const staff = invoice.staff || {};

  const grossTotal = Number(pricing.grossTotal ?? pricing.grandTotal ?? 0);
  const grandTotal = Number(pricing.grandTotal ?? grossTotal);
  const discountTotal = Number(pricing.discountTotal || 0);

  // Safe tax calculations
  const taxableAmount = Number(pricing.taxableAmount ?? (grandTotal > 0 ? grandTotal / 1.05 : 0)) || 0;
  const totalGst = Number(pricing.totalGst ?? pricing.totalTax ?? (grandTotal - taxableAmount)) || 0;

  const paymentMode = String(payment.mode || 'CASH').toUpperCase();
  const paymentRef = payment.referenceId || 'N/A';

  const invoiceDate = invoice.date ? new Date(invoice.date) : new Date();
  const dateFormatted = !isNaN(invoiceDate)
    ? invoiceDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'N/A';
  const timeFormatted = !isNaN(invoiceDate)
    ? invoiceDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : '';

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    const element = document.createElement('a');
    const invoiceSummary = `Tripuraa Sangrahah - Store Receipt\n` +
      `Invoice: ${invoice.invoiceNumber || 'TS-INV'}\n` +
      `Date: ${dateFormatted} ${timeFormatted}\n` +
      `Customer: ${customer.name || 'Walk-in Guest'} (${customer.phone || 'N/A'})\n` +
      `Cashier: ${staff.name || 'Staff'}\n\n` +
      items.map((it) => `${it.title || 'Saree'} x${it.quantity || 1} - INR ${it.subtotal || it.price || 0}`).join('\n') +
      (services.length ? '\n' + services.map((s) => `${s.name} - INR ${s.price}`).join('\n') : '') +
      `\n\nSubtotal: INR ${grossTotal}\n` +
      (discountTotal > 0 ? `Discount: -INR ${discountTotal}\n` : '') +
      `GST (5% incl.): INR ${totalGst}\n` +
      `Total: INR ${grandTotal}\n` +
      `Payment: Paid via ${paymentMode} (Ref: ${paymentRef})\n\n` +
      `Store Policy: No Exchange • No Return\n` +
      `Goods once sold will not be taken back or exchanged.\n` +
      `Thank you for shopping with us!`;

    const file = new Blob([invoiceSummary], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${invoice.invoiceNumber || 'receipt'}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Store Receipt"
      subtitle={`Receipt #${invoice.invoiceNumber || 'TS-INV'} • Cashier: ${staff.name || 'Staff'}`}
      maxWidth="max-w-xl"
    >
      <div className="space-y-4 font-sans text-charcoal-900">
        {/* =====================================================================
            TOP ACTIONS: Print, Download, Send WhatsApp, New Bill
           ===================================================================== */}
        <div className="flex items-center justify-end gap-2 pb-3 border-b border-sand-200 no-print">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-sand-300 bg-white hover:bg-sand-50 text-xs font-bold text-charcoal-800 transition-colors shadow-2xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-gold-700" />
            <span>Print</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPdf}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-sand-300 bg-white hover:bg-sand-50 text-xs font-bold text-charcoal-800 transition-colors shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-gold-700" />
            <span>Download</span>
          </button>

          {onOpenWhatsApp && (
            <button
              type="button"
              onClick={() => onOpenWhatsApp(invoice)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-2xs cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
          )}

          {onNewBill && (
            <button
              type="button"
              onClick={onNewBill}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gold-600 hover:bg-gold-700 text-white text-xs font-extrabold transition-colors shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Bill</span>
            </button>
          )}
        </div>

        {/* =====================================================================
            AUTHENTIC STORE RECEIPT (PRINTABLE)
           ===================================================================== */}
        <div
          ref={printRef}
          className="p-5 sm:p-6 rounded-2xl bg-white border border-sand-300 shadow-sm space-y-4 print:border-none print:shadow-none print:p-0 text-xs text-charcoal-800"
        >
          {/* 1. Header: Centered Store Info */}
          <div className="text-center space-y-1 pb-3 border-b border-dashed border-sand-300">
            <div className="inline-flex p-1.5 rounded-xl bg-gradient-to-br from-[#DE7335] via-[#BF5B21] to-[#752809] border border-gold-300 items-center justify-center mb-1">
              <img
                src={homeLogo}
                alt="Tripuraa Sangrahah"
                className="h-7 w-auto object-contain brand-logo-on-saffron"
              />
            </div>
            <h2 className="text-base font-serif font-extrabold text-charcoal-900 tracking-tight">
              Tripuraa Sangrahah
            </h2>
            <p className="text-[11px] text-charcoal-500">
              Road No. 10, Banjara Hills, Hyderabad • Ph: +91 40 2335 8899
            </p>
            <p className="text-[10px] font-mono text-charcoal-600 font-bold">
              GSTIN: 36AABCT1332L1Z5
            </p>
          </div>

          {/* 2. Metadata: Compact 2 Columns */}
          <div className="grid grid-cols-2 gap-3 text-xs pb-3 border-b border-dashed border-sand-300">
            <div>
              <p className="text-charcoal-500 text-[11px]">Invoice #</p>
              <p className="font-mono font-bold text-charcoal-900">{invoice.invoiceNumber || 'N/A'}</p>
              <p className="text-charcoal-500 text-[11px] mt-1">Date & Time</p>
              <p className="text-charcoal-800 font-medium">
                {dateFormatted} {timeFormatted && <span>• {timeFormatted}</span>}
              </p>
            </div>
            <div>
              <p className="text-charcoal-500 text-[11px]">Customer</p>
              <p className="font-bold text-charcoal-900">{customer.name || 'Walk-in Guest'}</p>
              <p className="font-mono text-charcoal-600 text-[11px]">
                {customer.phone || 'Walk-in'}
              </p>
              <p className="text-charcoal-500 text-[11px] mt-1">Cashier: <span className="text-charcoal-800 font-semibold">{staff.name || 'Radha'}</span></p>
            </div>
          </div>

          {/* 3. Items: Clean Standard Receipt Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-sand-300 text-charcoal-600 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2 w-6 text-center">#</th>
                  <th className="py-2">Item Description</th>
                  <th className="py-2 text-center w-12">Qty</th>
                  <th className="py-2 text-right w-24">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-100">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-charcoal-400">
                      No items on this receipt.
                    </td>
                  </tr>
                ) : (
                  items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2 text-center font-mono text-charcoal-400 font-semibold">
                        {idx + 1}
                      </td>
                      <td className="py-2 pr-2">
                        <p className="font-semibold text-charcoal-900">{item.title || 'Saree'}</p>
                      </td>
                      <td className="py-2 text-center font-mono text-charcoal-700">
                        {item.quantity || 1}
                      </td>
                      <td className="py-2 text-right font-mono font-bold text-charcoal-900">
                        {formatINR(item.subtotal || item.price * (item.quantity || 1))}
                      </td>
                    </tr>
                  ))
                )}

                {/* Finishing Services (if any) */}
                {services.length > 0 && (
                  services.map((srv, sIdx) => (
                    <tr key={`srv-${sIdx}`}>
                      <td className="py-1.5 text-center text-charcoal-400">•</td>
                      <td className="py-1.5 italic text-charcoal-700 pr-2">
                        Finishing: {srv.name}
                      </td>
                      <td className="py-1.5 text-center font-mono text-charcoal-600">1</td>
                      <td className="py-1.5 text-right font-mono font-semibold text-charcoal-800">
                        {formatINR(srv.price)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 4. Totals: Clean Standard Receipt Summary */}
          <div className="pt-2 border-t border-dashed border-sand-300 space-y-1.5">
            <div className="flex justify-between text-charcoal-600">
              <span>Subtotal</span>
              <span className="font-mono">{formatINR(grossTotal)}</span>
            </div>

            {discountTotal > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Discount</span>
                <span className="font-mono">-{formatINR(discountTotal)}</span>
              </div>
            )}

            <div className="flex justify-between text-charcoal-500 text-[11px]">
              <span>GST (5% inclusive)</span>
              <span className="font-mono">{formatINR(totalGst)}</span>
            </div>

            <div className="flex justify-between text-sm font-extrabold text-charcoal-900 pt-2 border-t border-charcoal-800">
              <span>Total Amount</span>
              <span className="font-mono text-base text-gold-900">
                {formatINR(grandTotal)}
              </span>
            </div>

            <div className="flex justify-between items-center text-[11px] text-charcoal-600 pt-1">
              <span>Paid via {paymentMode}</span>
              <span className="font-mono text-charcoal-500">Ref: {paymentRef}</span>
            </div>

            <p className="text-[10px] text-charcoal-500 italic pt-1 text-right">
              {numberToWordsINR(grandTotal)}
            </p>
          </div>

          {/* 5. Clean Footer */}
          <div className="pt-3 border-t border-dashed border-sand-300 text-center space-y-0.5 text-[10px] text-charcoal-500">
            <p className="font-bold text-charcoal-700 uppercase tracking-widest text-[9.5px]">
              No Exchange &bull; No Return
            </p>
            <p className="text-[10px] text-charcoal-400">
              Goods once sold will not be taken back or exchanged.
            </p>
            <p className="font-medium text-charcoal-600 pt-0.5">
              Thank you for shopping with us!
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
