import { beforeEach, describe, expect, it, vi } from 'vitest';

const billingApi = vi.hoisted(() => ({
  billingRequest: vi.fn(),
  readBillingToken: vi.fn(() => ''),
  writeBillingToken: vi.fn(),
}));

vi.mock('../services/billingApi', () => billingApi);

import { billingService } from '../services/billingService';

describe('Store Billing API workflow', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    billingApi.readBillingToken.mockReturnValue('');
    billingApi.billingRequest.mockImplementation(async (path, options = {}) => {
      if (path === '/auth/pin') {
        return {
          success: true,
          data: {
            token: 'billing-token',
            staff: { id: 'staff-1', name: 'Radha', role: 'Cashier' },
          },
        };
      }
      if (path === '/settings') return { success: true, data: { gstRate: 5 } };
      if (path === '/services') return { success: true, data: { services: [] } };
      if (path === '/products') {
        return {
          success: true,
          data: {
            products: [
              {
                id: 'saree-1',
                productCode: '100001',
                title: 'Swarna Kanchipuram',
                category: 'bridal',
              },
            ],
          },
        };
      }
      if (path === '/categories') {
        return { success: true, data: { categories: [{ id: 'bridal', label: 'Bridal' }] } };
      }
      if (path === '/invoices' && options.method === 'POST') {
        return {
          success: true,
          data: { invoice: { id: 'inv-1', invoiceNumber: 'TS-INV-2026-0001' } },
        };
      }
      if (path === '/invoices') {
        return { success: true, data: { items: [], total: 0, page: 1, totalPages: 1 } };
      }
      return { success: true, data: {} };
    });
  });

  it('validates a PIN before calling the API', async () => {
    const result = await billingService.verifyPin('123');

    expect(result.success).toBe(false);
    expect(result.error).toContain('6-digit');
    expect(billingApi.billingRequest).not.toHaveBeenCalled();
  });

  it('authenticates staff through the billing API and stores the session', async () => {
    const result = await billingService.verifyPin('123456');

    expect(result.success).toBe(true);
    expect(result.staff.name).toBe('Radha');
    expect(billingApi.writeBillingToken).toHaveBeenCalledWith('billing-token');
    expect(billingService.isAuthenticated()).toBe(true);
  });

  it('loads products and categories from API endpoints', async () => {
    const catalog = await billingService.fetchRegisterCatalog();

    expect(catalog.products[0].productCode).toBe('100001');
    expect(catalog.categories[0].id).toBe('bridal');
    expect(billingApi.billingRequest).toHaveBeenCalledWith('/products');
    expect(billingApi.billingRequest).toHaveBeenCalledWith('/categories');
  });

  it('calculates inclusive GST and discounts locally', () => {
    const totals = billingService.calculateTotals({
      items: [{ price: 30000, quantity: 1 }],
      services: [{ price: 350 }],
      couponCode: 'HERITAGE10',
    });

    expect(totals.grossTotal).toBe(30350);
    expect(totals.discountTotal).toBe(3000);
    expect(totals.grandTotal).toBe(27350);
    expect(totals.cgst + totals.sgst).toBe(totals.totalGst);
  });

  it('creates invoices through the billing API', async () => {
    const payload = {
      customer: { name: 'Ananya' },
      items: [{ sareeId: 'saree-1', price: 30000, quantity: 1 }],
    };
    const result = await billingService.createInvoice(payload);

    expect(result.invoice.invoiceNumber).toBe('TS-INV-2026-0001');
    expect(billingApi.billingRequest).toHaveBeenCalledWith('/invoices', {
      method: 'POST',
      body: payload,
    });
  });
});
