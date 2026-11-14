import { apiRequest } from './apiClient';
import { billingRequest, readBillingToken, writeBillingToken } from './billingApi';

const BILLING_SESSION_KEY = 'ts_billing_staff_session';

let activeGstRate = 5;
let liveServices = [];

export const billingService = {
  async verifyPin(pin) {
    const cleanPin = String(pin).trim();
    if (!/^\d{6}$/.test(cleanPin)) {
      return { success: false, error: 'Security PIN must be a valid 6-digit numeric code.' };
    }

    const response = await billingRequest('/auth/pin', {
      method: 'POST',
      body: { pin: cleanPin },
    });
    if (!response.success) return { success: false, error: response.error };

    writeBillingToken(response.data.token);
    this.setStaffSession({ ...response.data.staff, loginAt: new Date().toISOString() });
    await this.refreshRegister();
    return { success: true, staff: this.getStaffSession() };
  },

  getStaffSession() {
    if (typeof localStorage === 'undefined') return null;
    try {
      const saved = localStorage.getItem(BILLING_SESSION_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  },

  setStaffSession(staff) {
    if (typeof localStorage === 'undefined') return;
    try {
      if (staff) localStorage.setItem(BILLING_SESSION_KEY, JSON.stringify(staff));
      else localStorage.removeItem(BILLING_SESSION_KEY);
    } catch {
      // Storage may be unavailable in private browsing or tests.
    }
  },

  clearStaffSession() {
    const token = readBillingToken();
    writeBillingToken('');
    this.setStaffSession(null);
    if (token) {
      billingRequest('/auth/logout', { method: 'POST', token }).catch(() => null);
    }
  },

  isAuthenticated() {
    return Boolean(this.getStaffSession());
  },

  async openFromAdmin() {
    const response = await apiRequest('/admin/billing/session', {
      method: 'POST',
      body: '{}',
    });
    if (!response?.success || !response.data?.token) {
      return {
        success: false,
        error: response?.error?.message || 'The register could not be opened.',
      };
    }

    writeBillingToken(response.data.token);
    this.setStaffSession({ ...response.data.staff, loginAt: new Date().toISOString() });
    return { success: true, staff: this.getStaffSession() };
  },

  async fetchRegisterCatalog() {
    const [products, categories] = await Promise.all([
      billingRequest('/products'),
      billingRequest('/categories'),
    ]);
    if (!products.success) {
      return {
        products: [],
        categories: [],
        error: products.error || 'The saree list could not be loaded.',
      };
    }
    return {
      products: products.data?.products || [],
      categories: categories.success ? categories.data?.categories || [] : [],
      error: '',
    };
  },

  async createCashier(input) {
    return apiRequest('/admin/billing/staff', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async refreshRegister() {
    const [settings, services] = await Promise.all([
      billingRequest('/settings'),
      billingRequest('/services'),
    ]);
    if (settings.success && Number.isFinite(Number(settings.data?.gstRate))) {
      activeGstRate = Number(settings.data.gstRate);
    }
    if (services.success && Array.isArray(services.data?.services)) {
      liveServices = services.data.services;
    }
    return { gstRate: activeGstRate };
  },

  async listCategories() {
    const response = await billingRequest('/categories');
    return response.success ? response.data?.categories || [] : [];
  },

  async searchProducts(query = '', category = 'all', stockFilter = 'all') {
    const response = await billingRequest('/products', {
      query: { search: query, category, stock: stockFilter },
    });
    return response.success ? response.data?.products || [] : [];
  },

  async getProductByIdOrCode(identifier) {
    const response = await billingRequest('/products', {
      query: { search: String(identifier).trim() },
    });
    if (!response.success) return null;
    const products = response.data?.products || [];
    const clean = String(identifier).trim().toLowerCase();
    return (
      products.find(
        (product) =>
          String(product.id).toLowerCase() === clean ||
          String(product.productCode || '').toLowerCase() === clean,
      ) || null
    );
  },

  getAvailableServices() {
    return liveServices;
  },

  calculateTotals({
    items = [],
    services = [],
    discountType = 'none',
    discountValue = 0,
    couponCode = '',
  }) {
    const itemsSubtotal = items.reduce(
      (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
      0,
    );
    const servicesSubtotal = services.reduce((sum, service) => sum + (service.price || 0), 0);
    const grossTotal = itemsSubtotal + servicesSubtotal;

    let discountTotal = 0;
    const cleanCoupon = String(couponCode).trim().toUpperCase();
    if (cleanCoupon === 'HERITAGE10') {
      discountTotal = Math.round(itemsSubtotal * 0.1);
    } else if (cleanCoupon === 'ROYAL5') {
      discountTotal = Math.round(itemsSubtotal * 0.05);
    } else if (cleanCoupon === 'FESTIVE2000') {
      discountTotal = Math.min(2000, itemsSubtotal);
    } else if (discountType === 'percent') {
      const percentage = Math.min(100, Math.max(0, Number(discountValue) || 0));
      discountTotal = Math.round((itemsSubtotal * percentage) / 100);
    } else if (discountType === 'flat') {
      discountTotal = Math.min(grossTotal, Math.max(0, Number(discountValue) || 0));
    }

    const netBeforeTax = Math.max(0, grossTotal - discountTotal);
    const rate = Math.min(100, Math.max(0, Number(activeGstRate) || 0));
    const taxableAmount =
      rate === 0 ? netBeforeTax : Math.round((netBeforeTax / (1 + rate / 100)) * 100) / 100;
    const totalGst = Math.round((netBeforeTax - taxableAmount) * 100) / 100;
    const cgst = Math.round((totalGst / 2) * 100) / 100;
    const sgst = Math.round((totalGst - cgst) * 100) / 100;

    return {
      itemsSubtotal,
      servicesSubtotal,
      grossTotal,
      discountTotal,
      taxableAmount,
      gstRate: rate,
      cgst,
      sgst,
      totalGst,
      grandTotal: netBeforeTax,
    };
  },

  async createInvoice(invoicePayload) {
    const response = await billingRequest('/invoices', {
      method: 'POST',
      body: invoicePayload,
    });
    if (!response.success) return { success: false, error: response.error };
    return { success: true, invoice: response.data.invoice };
  },

  async getHeldBills() {
    const response = await billingRequest('/held');
    return response.success ? response.data?.heldBills || [] : [];
  },

  async holdBill(billData) {
    const response = await billingRequest('/held', { method: 'POST', body: billData });
    return response.success
      ? { success: true, heldBill: response.data.heldBill }
      : { success: false, error: response.error };
  },

  async resumeHeldBill(id) {
    const response = await billingRequest(`/held/${id}/resume`, { method: 'POST' });
    return response.success ? response.data.heldBill : null;
  },

  async discardHeldBill(id) {
    const response = await billingRequest(`/held/${id}`, { method: 'DELETE' });
    return response.success;
  },

  async getInvoices(params = {}) {
    const response = await billingRequest('/invoices', { query: params });
    if (!response.success) {
      return { items: [], total: 0, page: 1, limit: 10, totalPages: 1 };
    }
    return response.data;
  },

  async getInvoiceById(id) {
    const response = await billingRequest(`/invoices/${id}`);
    return response.success ? response.data?.invoice || null : null;
  },

  async processReturn(invoiceId, reason = 'Customer exchange / return') {
    const response = await billingRequest(`/invoices/${invoiceId}/return`, {
      method: 'POST',
      body: { reason },
    });
    if (!response.success) return { success: false, error: response.error };
    return { success: true, invoice: response.data.invoice };
  },

  async getSoldOutProducts(params = {}) {
    const response = await billingRequest('/sold-out', { query: params });
    return response.success ? response.data?.products || [] : [];
  },

  async restockProduct(sareeId, quantity = 1) {
    const response = await billingRequest(`/products/${sareeId}/restock`, {
      method: 'POST',
      body: { quantity },
    });
    if (!response.success) return { success: false, error: response.error };
    return {
      success: true,
      saree: response.data.saree,
      newStock: response.data.newStock,
    };
  },

  async lookupCustomerByPhone(phone) {
    const response = await billingRequest('/customers/lookup', { query: { phone } });
    return response.success ? response.data : { found: false, customer: null };
  },

  async getCustomers(search = '') {
    const response = await billingRequest('/customers', { query: { search } });
    return response.success ? response.data?.customers || [] : [];
  },

  async createCustomer(customerData) {
    const response = await billingRequest('/customers', {
      method: 'POST',
      body: customerData,
    });
    if (!response.success) throw new Error(response.error);
    return response.data.customer;
  },

  async getTodaySummary() {
    const response = await billingRequest('/summary/today');
    return response.success ? response.data : null;
  },

  formatWhatsAppReceipt(invoice) {
    if (!invoice) return '';

    const customer = invoice.customer || {};
    const items = Array.isArray(invoice.items) ? invoice.items : [];
    const services = Array.isArray(invoice.services) ? invoice.services : [];
    const pricing = invoice.pricing || {};
    const payment = invoice.payment || {};
    const itemsList = items
      .map(
        (item) =>
          `• ${item.title || 'Saree'} (x${item.quantity || 1}) — ₹${Number(
            item.subtotal ?? item.price ?? 0,
          ).toLocaleString('en-IN')}`,
      )
      .join('\n');
    const servicesList = services.length
      ? `\n✨ Finishing Services:\n${services
          .map(
            (service) =>
              `• ${service.name} — ₹${Number(service.price || 0).toLocaleString('en-IN')}`,
          )
          .join('\n')}`
      : '';
    const grossTotal = Number(pricing.grossTotal ?? pricing.grandTotal ?? 0);
    const discountTotal = Number(pricing.discountTotal || 0);
    const totalGst =
      Number(pricing.totalGst ?? pricing.totalTax ?? (pricing.cgst || 0) * 2) || 0;
    const grandTotal = Number(pricing.grandTotal ?? grossTotal);
    const paymentMode = String(payment.mode || 'CASH').toUpperCase();
    const referenceId = payment.referenceId || 'N/A';
    const date = invoice.date ? new Date(invoice.date) : new Date();
    const validDate = !Number.isNaN(date.getTime());
    const dateText = validDate
      ? date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      : 'Today';
    const timeText = validDate
      ? date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      : '';

    return `*Namaste ${customer.name || 'Valued Patron'} Ji,* 🙏

Thank you for gracing *Tripuraa Sangrahah*, Banjara Hills.

Here is your official digital tax invoice for your cherished heritage handloom selection:

━━━━━━━━━━━━━━━━━━━━
📄 *Invoice No:* ${invoice.invoiceNumber || 'TS-INV'}
🗓 *Date:* ${dateText}
⏰ *Time:* ${timeText}
━━━━━━━━━━━━━━━━━━━━

🛍 *Handloom Silks Purchased:*
${itemsList || '• Heritage Handloom Drape'}
${servicesList}
💰 *Subtotal:* ₹${grossTotal.toLocaleString('en-IN')}
${discountTotal ? `🎁 *Privilege Discount:* -₹${discountTotal.toLocaleString('en-IN')}\n` : ''}🏛 *GST (5% Pure Silk):* ₹${totalGst.toLocaleString('en-IN')}
💎 *Grand Total Paid:* ₹${grandTotal.toLocaleString('en-IN')}
💳 *Payment Mode:* ${paymentMode} (Ref: ${referenceId})

━━━━━━━━━━━━━━━━━━━━
🔗 *Digital Invoice View:*
https://tripuraa.in/invoices/${invoice.invoiceNumber || ''}

🌿 *Handloom Heritage Care:*
Store your pure silk saree wrapped in breathable unbleached muslin fabric. Gentle dry clean only.

📌 *Store Policy:* No Exchange • No Return. Goods once sold will not be taken back or exchanged.

With Warm Regards,
*Tripuraa Sangrahah Weavers Guild*
Flagship Boutique &bull; Banjara Hills, Hyderabad
Tel: +91 40 2335 8899 | WhatsApp: +91 98450 11223`;
  },

  getWhatsAppShareUrl(invoice) {
    if (!invoice) return '#';
    const cleanPhone = String(invoice.customer?.phone || '').replace(/[^0-9]/g, '');
    const phone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    return `https://wa.me/${phone}?text=${encodeURIComponent(this.formatWhatsAppReceipt(invoice))}`;
  },

  async simulateWhatsAppDispatch(invoiceId) {
    const response = await billingRequest(`/invoices/${invoiceId}/whatsapp`, {
      method: 'POST',
    });
    return { success: response.success };
  },
};
