import { describe, it, expect, beforeEach } from 'vitest';
import { billingService } from '../services/billingService';
import { db } from '../services/apiClient';

describe('Store Billing / POS System Workflow', () => {
  beforeEach(() => {
    billingService.clearStaffSession();
  });

  describe('1. 6-Digit Staff Security PIN Verification', () => {
    it('authenticates valid staff PIN (123456) and creates staff session', async () => {
      const res = await billingService.verifyPin('123456');
      expect(res.success).toBe(true);
      expect(res.staff.name).toBe('Radha Swaminathan');
      expect(res.staff.role).toBe('Senior Drape Specialist');
      expect(billingService.isAuthenticated()).toBe(true);
      expect(billingService.getStaffSession().name).toBe('Radha Swaminathan');
    });

    it('authenticates Store Manager PIN (987654)', async () => {
      const res = await billingService.verifyPin('987654');
      expect(res.success).toBe(true);
      expect(res.staff.name).toBe('Kavitha Iyer');
      expect(res.staff.role).toBe('Store Manager');
    });

    it('rejects invalid or non-6-digit PIN with helpful message', async () => {
      const resShort = await billingService.verifyPin('123');
      expect(resShort.success).toBe(false);
      expect(resShort.error).toContain('6-digit');

      const resWrong = await billingService.verifyPin('999999');
      expect(resWrong.success).toBe(false);
      expect(resWrong.error).toContain('Invalid 6-digit security PIN');
      expect(billingService.isAuthenticated()).toBe(false);
    });

    it('locking register removes staff session', async () => {
      await billingService.verifyPin('123456');
      expect(billingService.isAuthenticated()).toBe(true);

      billingService.clearStaffSession();
      expect(billingService.isAuthenticated()).toBe(false);
      expect(billingService.getStaffSession()).toBeNull();
    });
  });

  describe('2. Product Search & Identification', () => {
    it('finds saree by 6-digit product ID (100001)', async () => {
      const results = await billingService.searchProducts('100001');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].productCode).toBe('100001');
      expect(results[0].title).toBe('Swarna Kanchipuram Pure Zari Silk');
    });

    it('finds saree by title and weave keyword', async () => {
      const byTitle = await billingService.searchProducts('Kanchipuram');
      expect(byTitle.length).toBeGreaterThan(0);

      const byFabric = await billingService.searchProducts('Mulberry');
      expect(byFabric.length).toBeGreaterThan(0);
    });

    it('filters sarees by category', async () => {
      const bridalSarees = await billingService.searchProducts('', 'bridal');
      expect(bridalSarees.every((s) => s.category === 'bridal')).toBe(true);
    });
  });

  describe('3. Pricing Engine & Tax Calculation', () => {
    it('calculates gross total, 5% GST breakdown (CGST 2.5% + SGST 2.5%) correctly', () => {
      const items = [
        { price: 28500, quantity: 1 },
      ];
      const services = [
        { price: 350 }, // Fall & pico
      ];

      const totals = billingService.calculateTotals({ items, services });
      expect(totals.itemsSubtotal).toBe(28500);
      expect(totals.servicesSubtotal).toBe(350);
      expect(totals.grossTotal).toBe(28850);
      expect(totals.grandTotal).toBe(28850);
      expect(totals.gstRate).toBe(5);
      expect(totals.cgst + totals.sgst).toBe(totals.totalGst);
      expect(totals.totalGst).toBeGreaterThan(0);
    });

    it('applies HERITAGE10 privilege coupon (10% discount on items)', () => {
      const items = [{ price: 30000, quantity: 1 }];
      const totals = billingService.calculateTotals({
        items,
        couponCode: 'HERITAGE10',
      });

      expect(totals.discountTotal).toBe(3000);
      expect(totals.grandTotal).toBe(27000);
    });
  });

  describe('4. Invoice Generation & Inventory Synchronization', () => {
    it('creates invoice, deducts stock from db.sarees and updates stock status', async () => {
      await billingService.verifyPin('123456');

      const targetSaree = db.sarees.find((s) => s.id === 'saree-4');
      const initialStock = targetSaree.stockQuantity;

      const invoicePayload = {
        customer: {
          name: 'Ananya Deshmukh',
          phone: '+91 98234 56789',
          isWalkIn: false,
        },
        items: [
          {
            sareeId: 'saree-4',
            productCode: '100004',
            title: targetSaree.title,
            price: targetSaree.numericPrice,
            quantity: 1,
            subtotal: targetSaree.numericPrice,
          },
        ],
        services: [],
        pricing: {
          grossTotal: targetSaree.numericPrice,
          discountTotal: 0,
          taxableAmount: targetSaree.numericPrice / 1.05,
          cgst: 500,
          sgst: 500,
          totalGst: 1000,
          grandTotal: targetSaree.numericPrice,
        },
        payment: {
          mode: 'upi',
          referenceId: 'UPI/TEST/12345',
        },
      };

      const res = await billingService.createInvoice(invoicePayload);
      expect(res.success).toBe(true);
      expect(res.invoice.invoiceNumber).toMatch(/^TS-INV-2026-\d{4}$/);

      // Verify stock synchronization
      const updatedSaree = db.sarees.find((s) => s.id === 'saree-4');
      expect(updatedSaree.stockQuantity).toBe(initialStock - 1);
    });

    it('restores saree stock when return / refund is processed', async () => {
      const recentInvoice = db.invoices[0];
      const sareeId = recentInvoice.items[0].sareeId;
      const sareeBefore = db.sarees.find((s) => s.id === sareeId);
      const stockBefore = sareeBefore.stockQuantity;

      const res = await billingService.processReturn(recentInvoice.id, 'Patron color exchange');
      expect(res.success).toBe(true);
      expect(res.invoice.status).toBe('returned');

      const sareeAfter = db.sarees.find((s) => s.id === sareeId);
      expect(sareeAfter.stockQuantity).toBe(stockBefore + recentInvoice.items[0].quantity);
    });
  });

  describe('5. Held Bills Operations', () => {
    it('holds an active bill and resumes it back', () => {
      const holdPayload = {
        customer: { name: 'Priyamvada Varma', phone: '+91 99000 11222' },
        items: [{ sareeId: 'saree-1', price: 28500, quantity: 1, title: 'Swarna Kanchipuram' }],
        services: [],
      };

      const holdRes = billingService.holdBill(holdPayload);
      expect(holdRes.success).toBe(true);
      expect(billingService.getHeldBills().some((b) => b.id === holdRes.heldBill.id)).toBe(true);

      const resumed = billingService.resumeHeldBill(holdRes.heldBill.id);
      expect(resumed).not.toBeNull();
      expect(resumed.customer.name).toBe('Priyamvada Varma');
      expect(billingService.getHeldBills().some((b) => b.id === holdRes.heldBill.id)).toBe(false);
    });
  });

  describe('6. WhatsApp Digital Tax Receipt Delivery', () => {
    it('formats a polite luxury receipt with invoice number, items, and care instructions', () => {
      const sampleInvoice = db.invoices[0];
      const message = billingService.formatWhatsAppReceipt(sampleInvoice);

      expect(message).toContain('Tripuraa Sangrahah');
      expect(message).toContain(sampleInvoice.invoiceNumber);
      expect(message).toContain('Grand Total Paid');
      expect(message).toContain('Handloom Heritage Care');
      expect(message).toContain('https://tripuraa.in/invoices');
    });

    it('generates a direct click-to-chat WhatsApp URL with clean phone digits', () => {
      const sampleInvoice = db.invoices[0];
      const url = billingService.getWhatsAppShareUrl(sampleInvoice);

      expect(url).toContain('https://wa.me/');
      expect(url).toContain(encodeURIComponent('Tripuraa Sangrahah'));
    });
  });

  describe('7. Sold Out Items Archive and Restock', () => {
    it('retrieves sold out sarees and enriches them with last sale invoice', async () => {
      const soldOutList = await billingService.getSoldOutProducts();
      expect(soldOutList.length).toBeGreaterThan(0);

      // Verify every item in sold out list has stockQuantity <= 0
      soldOutList.forEach((s) => {
        expect(Number(s.stockQuantity) || 0).toBeLessThanOrEqual(0);
      });

      // Find saree-5 which was sold in TS-INV-2026-0040
      const tissueSaree = soldOutList.find((s) => s.id === 'saree-5');
      if (tissueSaree) {
        expect(tissueSaree.relatedInvoice).not.toBeNull();
        expect(tissueSaree.relatedInvoice.invoiceNumber).toBe('TS-INV-2026-0040');
      }
    });

    it('restocks a sold-out saree back into inventory and updates stock quantity', async () => {
      const restockRes = await billingService.restockProduct('saree-7', 2);
      expect(restockRes.success).toBe(true);
      expect(restockRes.newStock).toBe(2);

      const updatedSaree = db.sarees.find((s) => s.id === 'saree-7');
      expect(updatedSaree.stockQuantity).toBe(2);

      // Saree-7 should no longer be in the sold out list
      const freshSoldOut = await billingService.getSoldOutProducts();
      expect(freshSoldOut.some((s) => s.id === 'saree-7')).toBe(false);
    });
  });
});

