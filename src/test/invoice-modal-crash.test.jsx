import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { InvoiceModal } from '../components/billing/InvoiceModal';
import { WhatsAppReceiptModal } from '../components/billing/WhatsAppReceiptModal';
import { RecentBillsView } from '../components/billing/RecentBillsView';
import { db } from '../services/apiClient';

describe('Invoice and Receipt rendering crash prevention', () => {
  it('renders InvoiceModal for each invoice in db without crashing', () => {
    for (const inv of db.invoices) {
      const { unmount } = render(
        <InvoiceModal
          isOpen={true}
          onClose={() => {}}
          invoice={inv}
          onNewBill={() => {}}
          onOpenWhatsApp={() => {}}
        />
      );
      expect(screen.getByText('Store Receipt')).toBeInTheDocument();
      expect(screen.getAllByText(new RegExp(inv.invoiceNumber, 'i')).length).toBeGreaterThan(0);
      unmount();
    }
  });

  it('renders WhatsAppReceiptModal for each invoice in db without crashing', () => {
    for (const inv of db.invoices) {
      const { unmount } = render(
        <WhatsAppReceiptModal
          isOpen={true}
          onClose={() => {}}
          invoice={inv}
        />
      );
      expect(screen.getByText('WhatsApp Digital Tax Receipt')).toBeInTheDocument();
      unmount();
    }
  });

  it('safely handles sparse or partially undefined invoice objects in InvoiceModal', () => {
    const minimalInvoice = {
      id: 'inv-sparse',
      invoiceNumber: 'TS-INV-2026-SPARSE',
      date: new Date().toISOString(),
    };

    const { unmount } = render(
      <InvoiceModal
        isOpen={true}
        onClose={() => {}}
        invoice={minimalInvoice}
      />
    );

    expect(screen.getByText('Store Receipt')).toBeInTheDocument();
    expect(screen.getAllByText(new RegExp('TS-INV-2026-SPARSE', 'i')).length).toBeGreaterThan(0);
    expect(screen.getByText('Walk-in Guest')).toBeInTheDocument();
    unmount();
  });

  it('safely handles sparse or partially undefined invoice objects in WhatsAppReceiptModal', () => {
    const minimalInvoice = {
      id: 'inv-sparse',
      invoiceNumber: 'TS-INV-2026-SPARSE',
      date: new Date().toISOString(),
    };

    const { unmount } = render(
      <WhatsAppReceiptModal
        isOpen={true}
        onClose={() => {}}
        invoice={minimalInvoice}
      />
    );

    expect(screen.getByText('WhatsApp Digital Tax Receipt')).toBeInTheDocument();
    unmount();
  });

  it('allows clicking recent invoice row and action buttons in RecentBillsView', async () => {
    const onViewInvoice = vi.fn();
    const onOpenWhatsApp = vi.fn();
    const onProcessReturn = vi.fn();

    render(
      <RecentBillsView
        onViewInvoice={onViewInvoice}
        onOpenWhatsApp={onOpenWhatsApp}
        onProcessReturn={onProcessReturn}
      />
    );

    // Wait for invoices to load
    await waitFor(() => {
      expect(screen.getByText('TS-INV-2026-0042')).toBeInTheDocument();
    });

    // Click invoice number
    const invBtn = screen.getByText('TS-INV-2026-0042');
    fireEvent.click(invBtn);
    expect(onViewInvoice).toHaveBeenCalledWith(expect.objectContaining({ invoiceNumber: 'TS-INV-2026-0042' }));

    // Click Eye button
    const eyeBtns = screen.getAllByTitle('View & Print Invoice');
    expect(eyeBtns.length).toBeGreaterThan(0);
    fireEvent.click(eyeBtns[0]);
    expect(onViewInvoice).toHaveBeenCalledTimes(2);

    // Click WhatsApp Share button
    const waBtns = screen.getAllByTitle('Send WhatsApp Receipt');
    expect(waBtns.length).toBeGreaterThan(0);
    fireEvent.click(waBtns[0]);
    expect(onOpenWhatsApp).toHaveBeenCalled();
  });
});
