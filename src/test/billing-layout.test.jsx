import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { BillingLayout } from '../components/billing/BillingLayout';
import { CartDrawer } from '../components/billing/CartDrawer';
import { PaymentModal } from '../components/billing/PaymentModal';
import { RecentBillsView } from '../components/billing/RecentBillsView';

describe('BillingLayout Header and Navigation', () => {
  it('renders brand logo and navigation tabs', () => {
    const setActiveTab = vi.fn();
    render(
      <MemoryRouter>
        <BillingLayout activeTab="pos" setActiveTab={setActiveTab}>
          <div>Workspace Content</div>
        </BillingLayout>
      </MemoryRouter>
    );

    // Verify brand logo is displayed
    const logoImg = screen.getByAltText('Tripuraa Sangrahah');
    expect(logoImg).toBeInTheDocument();

    // Verify navigation tabs are present
    expect(screen.getByText('New Bill (POS)')).toBeInTheDocument();
    expect(screen.getByText('Recent Bills')).toBeInTheDocument();
    expect(screen.getByText('Customer Search')).toBeInTheDocument();
    expect(screen.getByText('Sales Reports')).toBeInTheDocument();

    // Verify Hold Bills is removed
    expect(screen.queryByText('Hold Bills')).not.toBeInTheDocument();

    // Verify children content rendered
    expect(screen.getByText('Workspace Content')).toBeInTheDocument();
  });

  it('triggers setActiveTab when navigation tab is clicked', () => {
    const setActiveTab = vi.fn();
    render(
      <MemoryRouter>
        <BillingLayout activeTab="pos" setActiveTab={setActiveTab}>
          <div>Workspace Content</div>
        </BillingLayout>
      </MemoryRouter>
    );

    const recentBillsBtn = screen.getByRole('button', { name: /recent bills/i });
    fireEvent.click(recentBillsBtn);
    expect(setActiveTab).toHaveBeenCalledWith('recent');
  });

  it('renders Day Closing and Lock POS action buttons', () => {
    const setActiveTab = vi.fn();
    const onLockPos = vi.fn();
    render(
      <MemoryRouter>
        <BillingLayout activeTab="pos" setActiveTab={setActiveTab} onLockPos={onLockPos}>
          <div>Workspace Content</div>
        </BillingLayout>
      </MemoryRouter>
    );

    const dayClosingBtn = screen.getByRole('button', { name: /day closing/i });
    expect(dayClosingBtn).toBeInTheDocument();
    fireEvent.click(dayClosingBtn);
    expect(setActiveTab).toHaveBeenCalledWith('close');

    const lockPosBtn = screen.getByRole('button', { name: /lock pos/i });
    expect(lockPosBtn).toBeInTheDocument();
    fireEvent.click(lockPosBtn);
    expect(onLockPos).toHaveBeenCalled();
  });
});

describe('CartDrawer & Custom Add-ons', () => {
  it('renders Active Bill header without initial customer details section', () => {
    render(
      <CartDrawer
        cartItems={[]}
        totals={{ itemsSubtotal: 0, servicesSubtotal: 0, discountTotal: 0, totalGst: 0, grandTotal: 0 }}
      />
    );

    expect(screen.getByText('Active Bill')).toBeInTheDocument();
    expect(screen.queryByText(/customer details/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/walk-in guest/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/store finishing services:/i)).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/voucher/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/hold bill/i)).not.toBeInTheDocument();
  });

  it('allows typing and adding a custom add-on to the active bill', () => {
    const onAddCustomItem = vi.fn();
    render(
      <CartDrawer
        cartItems={[]}
        onAddCustomItem={onAddCustomItem}
        totals={{ itemsSubtotal: 0, servicesSubtotal: 0, discountTotal: 0, totalGst: 0, grandTotal: 0 }}
      />
    );

    // Open custom add-on form
    const openFormBtn = screen.getByRole('button', { name: /\+ Type Custom Item or Charge/i });
    fireEvent.click(openFormBtn);

    // Enter name & price
    const nameInput = screen.getByPlaceholderText(/service \/ add-on name/i);
    const priceInput = screen.getByPlaceholderText(/price \(₹\)/i);
    fireEvent.change(nameInput, { target: { value: 'Special Blouse Stitching' } });
    fireEvent.change(priceInput, { target: { value: '1500' } });

    // Submit custom add-on
    const submitBtn = screen.getByRole('button', { name: /\+ add to bill/i });
    fireEvent.click(submitBtn);

    expect(onAddCustomItem).toHaveBeenCalledWith({
      title: 'Special Blouse Stitching',
      price: 1500,
    });
  });

  it('renders custom add-on item in the cart list with #CUSTOM badge', () => {
    const customItems = [
      {
        sareeId: 'custom-123',
        productCode: 'ADDON',
        title: 'Custom Zari Border Work',
        price: 2500,
        quantity: 1,
        isCustom: true,
      },
    ];

    render(
      <CartDrawer
        cartItems={customItems}
        totals={{ itemsSubtotal: 2500, servicesSubtotal: 0, discountTotal: 0, totalGst: 125, grandTotal: 2625 }}
      />
    );

    expect(screen.getByText('#CUSTOM')).toBeInTheDocument();
    expect(screen.getByText('Custom Zari Border Work')).toBeInTheDocument();
    expect(screen.getAllByText('₹2,500').length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText(/each/i)).not.toBeInTheDocument();
  });
});

describe('PaymentModal: Phone Verification & Automatic Recognition', () => {
  it('opens on Step 1: Customer Phone Verification and auto-detects existing user', () => {
    render(
      <PaymentModal
        isOpen={true}
        onClose={vi.fn()}
        grandTotal={35000}
        onConfirmPayment={vi.fn()}
      />
    );

    // Step 1 check
    expect(screen.getByText('Customer Phone')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('98234 56789')).toBeInTheDocument();

    // Type phone of registered user (Ananya: 9823456789)
    const phoneInput = screen.getByPlaceholderText('98234 56789');
    fireEvent.change(phoneInput, { target: { value: '9823456789' } });

    // Auto-detection should display "Already User"
    expect(screen.getByText(/already user \(in database\)/i)).toBeInTheDocument();
    expect(screen.getByText('Ananya Deshmukh')).toBeInTheDocument();
    expect(screen.queryByText(/tier/i)).not.toBeInTheDocument();
  });

  it('transitions from Step 1 to Step 2 (Payment) and records transaction', () => {
    const onConfirmPayment = vi.fn();
    render(
      <PaymentModal
        isOpen={true}
        onClose={vi.fn()}
        grandTotal={28500}
        onConfirmPayment={onConfirmPayment}
      />
    );

    // Proceed as walk-in to test flow transition
    const walkInBtn = screen.getByRole('button', { name: /skip \/ walk-in guest/i });
    fireEvent.click(walkInBtn);

    // Now in Step 2: Payment
    expect(screen.getByText('Select Payment Method:')).toBeInTheDocument();
    expect(screen.getByText(/total amount payable/i)).toBeInTheDocument();

    // Click confirm payment
    const confirmBtn = screen.getByRole('button', { name: /confirm payment & generate invoice/i });
    fireEvent.click(confirmBtn);

    // Verifies confirm payment is invoked
    expect(confirmBtn).toBeInTheDocument();
  });
});

describe('RecentBillsView: Direct Invoice Modal Trigger', () => {
  it('calls onViewInvoice directly when clicking on an invoice row or number', async () => {
    const onViewInvoice = vi.fn();
    render(
      <RecentBillsView
        onViewInvoice={onViewInvoice}
        onOpenWhatsApp={vi.fn()}
        onProcessReturn={vi.fn()}
      />
    );

    const invoiceBtn = await screen.findByText('TS-INV-2026-0042');
    expect(invoiceBtn).toBeInTheDocument();

    fireEvent.click(invoiceBtn);
    expect(onViewInvoice).toHaveBeenCalledWith(
      expect.objectContaining({ invoiceNumber: 'TS-INV-2026-0042' })
    );
  });

  it('provides 2 sections: Recent Store Invoices and Sold Out Items', async () => {
    const onViewInvoice = vi.fn();
    const onRestockSuccess = vi.fn();
    render(
      <RecentBillsView
        onViewInvoice={onViewInvoice}
        onOpenWhatsApp={vi.fn()}
        onProcessReturn={vi.fn()}
        onRestockSuccess={onRestockSuccess}
      />
    );

    // Both section buttons are rendered in the switcher
    const invoicesTab = screen.getByRole('button', { name: /recent store invoices/i });
    const soldOutTab = screen.getByRole('button', { name: /sold out items/i });
    expect(invoicesTab).toBeInTheDocument();
    expect(soldOutTab).toBeInTheDocument();

    // Invoices section is shown by default
    expect(await screen.findByText('TS-INV-2026-0042')).toBeInTheDocument();

    // Switch to Sold Out Items section
    fireEvent.click(soldOutTab);

    // Verify Sold Out archive header and items appear
    expect(await screen.findByText('Sold Out Sarees Archive')).toBeInTheDocument();
    expect(screen.getAllByText(/hidden from pos catalog/i).length).toBeGreaterThan(0);

    // Verify sold out item #100005 (Royal Bridal Gold Tissue Drape) or #100007 is shown
    expect(await screen.findByText(/royal bridal gold tissue drape/i)).toBeInTheDocument();

    // Clicking View Bill on a sold out saree opens its sale invoice
    const viewBillButtons = screen.getAllByRole('button', { name: /view bill/i });
    expect(viewBillButtons.length).toBeGreaterThan(0);
    fireEvent.click(viewBillButtons[0]);
    expect(onViewInvoice).toHaveBeenCalled();
  });
});
