/**
 * Store Billing / POS Service
 * Pure frontend stateful service operating on live mutable in-memory db tables,
 * supporting PIN verification, real-time catalog search, inventory synchronization,
 * invoice generation, held bills, and WhatsApp receipt delivery.
 */

import { apiRequest, db, recordAuditLog, USE_MOCK } from './apiClient';
import { INITIAL_BILLING_SERVICES } from './mockData';
import { billingRequest, readBillingToken, writeBillingToken } from './billingApi';

let activeGstRate = 5;
let liveServices = INITIAL_BILLING_SERVICES;

const BILLING_SESSION_KEY = 'ts_billing_staff_session';

export const billingService = {
  /**
   * 1. Staff Security PIN Verification
   * Accepts 6-digit PIN (Default demo PINs: 123456, 987654, 555888)
   */
  async verifyPin(pin) {
    if (!USE_MOCK) {
      const cleanPin = String(pin).trim();
      if (!/^\d{6}$/.test(cleanPin)) {
        return { success: false, error: 'Security PIN must be a valid 6-digit numeric code.' };
      }
      const res = await billingRequest('/auth/pin', { method: 'POST', body: { pin: cleanPin } });
      if (!res.success) return { success: false, error: res.error };
      writeBillingToken(res.data.token);
      this.setStaffSession({ ...res.data.staff, loginAt: new Date().toISOString() });
      await this.refreshRegister();
      return { success: true, staff: this.getStaffSession() };
    }
    // Artificial 200ms debounce/delay for realistic verification feedback
    await new Promise((res) => setTimeout(res, 200));

    const cleanPin = String(pin).trim();
    if (!/^\d{6}$/.test(cleanPin)) {
      return {
        success: false,
        error: 'Security PIN must be a valid 6-digit numeric code.',
      };
    }

    const matchedStaff = db.billingStaff.find((s) => s.pin === cleanPin);

    if (matchedStaff) {
      const sessionData = {
        ...matchedStaff,
        loginAt: new Date().toISOString(),
      };
      this.setStaffSession(sessionData);
      recordAuditLog('BILLING_LOGIN', 'billing', `Staff ${matchedStaff.name} unlocked Register (${matchedStaff.register})`);
      return { success: true, staff: sessionData };
    }

    // Fallback: If master admin PIN '123456' is used even if staff record modified
    if (cleanPin === '123456') {
      const defaultStaff = {
        id: 'stf-1',
        name: 'Radha Swaminathan',
        role: 'Senior Drape Specialist',
        register: 'Counter 01 - Flagship Boutique',
        phone: '+91 98450 11223',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
        loginAt: new Date().toISOString(),
      };
      this.setStaffSession(defaultStaff);
      recordAuditLog('BILLING_LOGIN', 'billing', `Staff Radha Swaminathan unlocked Register`);
      return { success: true, staff: defaultStaff };
    }

    return {
      success: false,
      error: 'Invalid 6-digit security PIN. Please enter an authorized staff PIN (Demo: 123456).',
    };
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
      if (staff) {
        localStorage.setItem(BILLING_SESSION_KEY, JSON.stringify(staff));
      } else {
        localStorage.removeItem(BILLING_SESSION_KEY);
      }
    } catch {
      // storage unavailable
    }
  },

  clearStaffSession() {
    if (!USE_MOCK) {
      const token = readBillingToken();
      writeBillingToken('');
      if (token) {
        billingRequest('/auth/logout', { method: 'POST', token }).catch(() => null);
      }
    }
    const current = this.getStaffSession();
    if (current) {
      recordAuditLog('BILLING_LOGOUT', 'billing', `Staff ${current.name} locked the register`);
    }
    this.setStaffSession(null);
  },

  isAuthenticated() {
    return Boolean(this.getStaffSession());
  },

  /**
   * An admin who is already signed in opens the register directly.
   * The cashier PIN stays for the counter, and is not asked again here.
   */
  async openFromAdmin() {
    if (USE_MOCK) {
      const staff = {
        id: 'stf-admin',
        name: 'Admin',
        role: 'Admin',
        register: 'Admin Portal',
        loginAt: new Date().toISOString(),
      };
      this.setStaffSession(staff);
      return { success: true, staff };
    }
    const res = await apiRequest('/admin/billing/session', { method: 'POST', body: '{}' });
    if (!res?.success || !res.data?.token) {
      return { success: false, error: res?.error?.message || 'The register could not be opened.' };
    }
    writeBillingToken(res.data.token);
    this.setStaffSession({ ...res.data.staff, loginAt: new Date().toISOString() });
    return { success: true, staff: this.getStaffSession() };
  },

  async fetchRegisterCatalog() {
    if (USE_MOCK) {
      return {
        products: await this.searchProducts(),
        categories: await Promise.resolve(this.listCategories()),
        error: '',
      };
    }
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
    }, async () => {
      const staff = {
        id: `stf-${Date.now()}`,
        name: input.name.trim(),
        role: input.role || 'Cashier',
        register: input.register || 'Counter 01',
        phone: input.phone || '',
        pin: input.pin,
      };
      db.billingStaff.unshift(staff);
      return {
        staff: {
          id: staff.id,
          name: staff.name,
          role: staff.role,
          register: staff.register,
          phone: staff.phone,
        },
      };
    });
  },

  /**
   * 2. Product Search & Catalog Lookup
   * Searches by 6-digit Product Code, Title, Weave, Fabric, or Category
   */
  async refreshRegister() {
    if (USE_MOCK) return { gstRate: activeGstRate };
    const settings = await billingRequest('/settings');
    if (settings.success && Number.isFinite(Number(settings.data?.gstRate))) {
      activeGstRate = Number(settings.data.gstRate);
    }
    const services = await billingRequest('/services');
    if (services.success && Array.isArray(services.data?.services)) {
      liveServices = services.data.services;
    }
    return { gstRate: activeGstRate };
  },

  async listCategories() {
    if (!USE_MOCK) {
      const res = await billingRequest('/categories');
      return res.success ? res.data.categories || [] : [];
    }
    return db.categories || [];
  },

  async searchProducts(query = '', category = 'all', stockFilter = 'all') {
    if (!USE_MOCK) {
      const res = await billingRequest('/products', {
        query: { search: query, category, stock: stockFilter },
      });
      return res.success ? res.data.products || [] : [];
    }
    let list = [...db.sarees];

    // Filter active items
    list = list.filter((s) => s.isActive !== false);

    // Search query: 6-digit ID, barcode, title, fabric
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((s) => {
        const code = String(s.productCode || '').toLowerCase();
        const title = (s.title || '').toLowerCase();
        const brand = (s.brand || '').toLowerCase();
        const weave = (s.weave || '').toLowerCase();
        const fabric = (s.fabric || '').toLowerCase();
        return (
          code.includes(q) ||
          title.includes(q) ||
          brand.includes(q) ||
          weave.includes(q) ||
          fabric.includes(q)
        );
      });
    }

    // Category filter
    if (category && category !== 'all') {
      list = list.filter((s) => s.category === category);
    }

    // Stock availability filter
    if (stockFilter === 'in_stock') {
      list = list.filter((s) => (s.stockQuantity || 0) > 0);
    } else if (stockFilter === 'low_stock') {
      list = list.filter((s) => (s.stockQuantity || 0) > 0 && (s.stockQuantity || 0) <= 2);
    } else if (stockFilter === 'out_of_stock') {
      list = list.filter((s) => (s.stockQuantity || 0) === 0);
    }

    return list;
  },

  getProductByIdOrCode(identifier) {
    const clean = String(identifier).trim().toLowerCase();
    return db.sarees.find(
      (s) =>
        s.id.toLowerCase() === clean ||
        String(s.productCode || '').toLowerCase() === clean
    );
  },

  getAvailableServices() {
    return USE_MOCK ? INITIAL_BILLING_SERVICES : liveServices;
  },

  /**
   * 3. Cart & Tax Calculation Engine
   * GST 5% for Indian Pure Silk Handlooms (CGST 2.5% + SGST 2.5%)
   */
  calculateTotals({ items = [], services = [], discountType = 'none', discountValue = 0, couponCode = '' }) {
    const itemsSubtotal = items.reduce(
      (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
      0
    );

    const servicesSubtotal = services.reduce(
      (sum, srv) => sum + (srv.price || 0),
      0
    );

    const grossTotal = itemsSubtotal + servicesSubtotal;

    let discountTotal = 0;
    const cleanCoupon = String(couponCode).trim().toUpperCase();
    if (cleanCoupon === 'HERITAGE10') {
      discountTotal = Math.round(itemsSubtotal * 0.10);
    } else if (cleanCoupon === 'ROYAL5') {
      discountTotal = Math.round(itemsSubtotal * 0.05);
    } else if (cleanCoupon === 'FESTIVE2000') {
      discountTotal = Math.min(2000, itemsSubtotal);
    } else if (discountType === 'percent') {
      const pct = Math.min(100, Math.max(0, Number(discountValue) || 0));
      discountTotal = Math.round((itemsSubtotal * pct) / 100);
    } else if (discountType === 'flat') {
      discountTotal = Math.min(grossTotal, Math.max(0, Number(discountValue) || 0));
    }

    const netBeforeTax = Math.max(0, grossTotal - discountTotal);

    // GST is inclusive in retail handloom price (5% total: 2.5% CGST + 2.5% SGST)
    const rate = Math.min(100, Math.max(0, Number(activeGstRate) || 0));
    const taxableAmount = rate === 0 ? netBeforeTax : Math.round((netBeforeTax / (1 + rate / 100)) * 100) / 100;
    const totalGst = Math.round((netBeforeTax - taxableAmount) * 100) / 100;
    const cgst = Math.round((totalGst / 2) * 100) / 100;
    const sgst = Math.round((totalGst - cgst) * 100) / 100;

    const grandTotal = netBeforeTax;

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
      grandTotal,
    };
  },

  /**
   * 4. Complete Invoice Generation & Inventory Synchronization
   */
  async createInvoice(invoicePayload) {
    if (!USE_MOCK) {
      const res = await billingRequest('/invoices', { method: 'POST', body: invoicePayload });
      if (!res.success) return { success: false, error: res.error };
      return { success: true, invoice: res.data.invoice };
    }
    const {
      customer,
      items,
      services = [],
      pricing,
      payment,
      notes = '',
    } = invoicePayload;

    if (!items || items.length === 0) {
      return { success: false, error: 'Cannot generate invoice for an empty cart.' };
    }

    // 1. Validate Stock Availability
    for (const item of items) {
      if (item.isCustom) continue;
      const saree = db.sarees.find((s) => s.id === item.sareeId);
      if (!saree) {
        return { success: false, error: `Saree "${item.title}" could not be found.` };
      }
      if ((saree.stockQuantity || 0) < item.quantity) {
        return {
          success: false,
          error: `Insufficient inventory for "${saree.title}". Available stock: ${saree.stockQuantity || 0}.`,
        };
      }
    }

    // 2. Synchronize Inventory: Deduct stock from db.sarees
    for (const item of items) {
      if (item.isCustom) continue;
      const saree = db.sarees.find((s) => s.id === item.sareeId);
      if (saree) {
        const remaining = Math.max(0, (saree.stockQuantity || 0) - item.quantity);
        saree.stockQuantity = remaining;
        if (remaining === 0) {
          saree.stockStatus = 'Out of Stock';
        } else if (remaining <= 2) {
          saree.stockStatus = `${remaining} Left in Stock`;
        }
      }
    }

    // 3. Generate Sequential Invoice Number: TS-INV-2026-XXXX
    const nextSeq = String(db.invoices.length + 43).padStart(4, '0');
    const invoiceNumber = `TS-INV-2026-${nextSeq}`;

    const staffSession = this.getStaffSession() || {
      staffId: 'stf-1',
      name: 'Radha Swaminathan',
      role: 'Senior Drape Specialist',
      register: 'Counter 01',
    };

    const newInvoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber,
      date: new Date().toISOString(),
      customer: {
        name: customer.name || 'Walk-in Guest',
        phone: customer.phone || '',
        email: customer.email || '',
        city: customer.city || 'Hyderabad',
        address: customer.address || '',
        gstin: customer.gstin || '',
        isWalkIn: Boolean(customer.isWalkIn),
      },
      items: items.map((i) => ({
        sareeId: i.sareeId,
        productCode: i.productCode || (i.isCustom ? 'ADDON' : ''),
        title: i.title,
        weave: i.weave || (i.isCustom ? 'Custom Add-on' : ''),
        fabric: i.fabric || '',
        price: i.price,
        mrp: i.mrp || i.price,
        quantity: i.quantity,
        hsnCode: i.hsnCode || '5007',
        discount: i.discount || 0,
        subtotal: i.subtotal || i.price * i.quantity,
        image: i.image || '',
        isCustom: Boolean(i.isCustom),
      })),
      services: services.map((s) => ({
        name: s.name,
        price: s.price,
      })),
      pricing,
      payment: {
        mode: payment.mode || 'cash',
        status: 'paid',
        referenceId: payment.referenceId || `TXN-${Date.now().toString().slice(-6)}`,
        amountReceived: payment.amountReceived || pricing.grandTotal,
        changeGiven: payment.changeGiven || 0,
        cardNetwork: payment.cardNetwork || '',
        cardLast4: payment.cardLast4 || '',
        splitDetails: payment.splitDetails || null,
      },
      staff: {
        staffId: staffSession.id || staffSession.staffId || 'stf-1',
        name: staffSession.name || 'Radha Swaminathan',
        role: staffSession.role || 'Senior Drape Specialist',
        register: staffSession.register || 'Counter 01',
      },
      status: 'completed',
      whatsappDelivery: {
        status: customer.phone ? 'sent' : 'pending',
        sentAt: customer.phone ? new Date().toISOString() : null,
        phone: customer.phone || '',
      },
      notes,
    };

    // Prepend to mutable in-memory invoices table
    db.invoices.unshift(newInvoice);

    // Record audit log
    recordAuditLog(
      'CREATE_INVOICE',
      'billing',
      `Generated Invoice ${invoiceNumber} for ${customer.name || 'Walk-in'} (₹${pricing.grandTotal.toLocaleString('en-IN')}) via ${payment.mode.toUpperCase()}`
    );

    return { success: true, invoice: newInvoice };
  },

  /**
   * 5. Held Bills Management
   */
  getHeldBills() {
    if (!USE_MOCK) {
      return billingRequest('/held').then((res) => (res.success ? res.data.heldBills || [] : []));
    }
    return [...db.heldBills];
  },

  holdBill(billData) {
    if (!USE_MOCK) {
      return billingRequest('/held', { method: 'POST', body: billData }).then((res) => (
        res.success ? { success: true, heldBill: res.data.heldBill } : { success: false, error: res.error }
      ));
    }
    const heldItem = {
      id: `hold-${Date.now()}`,
      customer: billData.customer,
      items: billData.items,
      services: billData.services || [],
      heldAt: new Date().toISOString(),
      note: billData.note || 'Held by cashier on counter',
    };
    db.heldBills.unshift(heldItem);
    recordAuditLog('HOLD_BILL', 'billing', `Held bill for ${billData.customer?.name || 'Walk-in Guest'} (${billData.items.length} items)`);
    return { success: true, heldBill: heldItem };
  },

  resumeHeldBill(id) {
    if (!USE_MOCK) {
      return billingRequest(`/held/${id}/resume`, { method: 'POST' }).then((res) => (res.success ? res.data.heldBill : null));
    }
    const idx = db.heldBills.findIndex((b) => b.id === id);
    if (idx === -1) return null;
    const [resumed] = db.heldBills.splice(idx, 1);
    recordAuditLog('RESUME_BILL', 'billing', `Resumed held bill for ${resumed.customer?.name || 'Walk-in Guest'}`);
    return resumed;
  },

  discardHeldBill(id) {
    if (!USE_MOCK) {
      return billingRequest(`/held/${id}`, { method: 'DELETE' }).then((res) => res.success);
    }
    const idx = db.heldBills.findIndex((b) => b.id === id);
    if (idx !== -1) {
      db.heldBills.splice(idx, 1);
      return true;
    }
    return false;
  },

  /**
   * 6. Past Invoices & Return/Refund
   */
  async getInvoices(params = {}) {
    if (!USE_MOCK) {
      const res = await billingRequest('/invoices', { query: params });
      if (!res.success) return { items: [], total: 0, page: 1, limit: 10, totalPages: 1 };
      return res.data;
    }
    const {
      search = '',
      paymentMode = 'all',
      status = 'all',
      page = 1,
      limit = 10,
    } = params;

    let list = [...db.invoices];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (inv) =>
          (inv.invoiceNumber || '').toLowerCase().includes(q) ||
          (inv.customer?.name || '').toLowerCase().includes(q) ||
          (inv.customer?.phone || '').includes(q)
      );
    }

    if (paymentMode !== 'all') {
      list = list.filter((inv) => (inv.payment?.mode || '').toLowerCase() === paymentMode.toLowerCase());
    }

    if (status !== 'all') {
      list = list.filter((inv) => (inv.status || '').toLowerCase() === status.toLowerCase());
    }

    const total = list.length;
    const startIndex = (page - 1) * limit;
    const paginated = list.slice(startIndex, startIndex + limit);

    return {
      items: paginated,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  },

  getInvoiceById(id) {
    return db.invoices.find((i) => i.id === id || i.invoiceNumber === id);
  },

  /**
   * Process Return & Restore Inventory Stock
   */
  async processReturn(invoiceId, reason = 'Customer exchange / return') {
    if (!USE_MOCK) {
      const res = await billingRequest(`/invoices/${invoiceId}/return`, { method: 'POST', body: { reason } });
      if (!res.success) return { success: false, error: res.error };
      return { success: true, invoice: res.data.invoice };
    }
    const invoice = db.invoices.find((i) => i.id === invoiceId || i.invoiceNumber === invoiceId);
    if (!invoice) return { success: false, error: 'Invoice not found.' };

    if (invoice.status === 'returned') {
      return { success: false, error: 'Invoice has already been returned / refunded.' };
    }

    // Restore stock in db.sarees
    for (const item of invoice.items) {
      const saree = db.sarees.find((s) => s.id === item.sareeId);
      if (saree) {
        saree.stockQuantity = (saree.stockQuantity || 0) + item.quantity;
        if (saree.stockQuantity > 0) {
          saree.stockStatus = saree.stockQuantity > 2 ? 'In Stock' : `${saree.stockQuantity} Left in Stock`;
        }
      }
    }

    invoice.status = 'returned';
    invoice.returnDetails = {
      returnedAt: new Date().toISOString(),
      reason,
      refundedAmount: invoice.pricing.grandTotal,
    };

    recordAuditLog(
      'RETURN_INVOICE',
      'billing',
      `Processed return for Invoice ${invoice.invoiceNumber}. Restored inventory for ${invoice.items.length} items.`
    );

    return { success: true, invoice };
  },

  /**
   * 7. Sold Out Items Archive
   * Retrieves products that got sold out (stockQuantity <= 0).
   * Enriches each item with sales history (which invoice it was sold in, patron name, date).
   */
  async getSoldOutProducts(params = {}) {
    if (!USE_MOCK) {
      const res = await billingRequest('/sold-out', { query: params });
      return res.success ? res.data.products || [] : [];
    }
    const { search = '', category = 'all' } = params;

    let list = (db.sarees || []).filter((s) => (Number(s.stockQuantity) || 0) <= 0);

    if (category && category !== 'all') {
      list = list.filter((s) => s.category === category);
    }

    const q = (search || '').trim().toLowerCase();
    if (q) {
      list = list.filter(
        (s) =>
          String(s.productCode || '').toLowerCase().includes(q) ||
          (s.title || '').toLowerCase().includes(q) ||
          (s.weave || '').toLowerCase().includes(q) ||
          (s.fabric || '').toLowerCase().includes(q) ||
          (s.origin || '').toLowerCase().includes(q)
      );
    }

    return list.map((saree) => {
      // Find matching invoice
      const relatedInvoice = (db.invoices || []).find((inv) =>
        (inv.items || []).some(
          (it) => it.sareeId === saree.id || String(it.productCode || '') === String(saree.productCode || '')
        )
      );

      return {
        ...saree,
        soldOutAt: relatedInvoice?.date || saree.updatedAt || saree.createdAt || new Date().toISOString(),
        relatedInvoice: relatedInvoice || null,
      };
    });
  },

  /**
   * Restock a sold-out saree back into inventory
   */
  async restockProduct(sareeId, quantity = 1) {
    if (!USE_MOCK) {
      const res = await billingRequest(`/products/${sareeId}/restock`, { method: 'POST', body: { quantity } });
      if (!res.success) return { success: false, error: res.error };
      return { success: true, saree: res.data.saree, newStock: res.data.newStock };
    }
    const saree = (db.sarees || []).find((s) => s.id === sareeId);
    if (!saree) {
      return { success: false, error: 'Saree not found.' };
    }
    const newQty = (Number(saree.stockQuantity) || 0) + quantity;
    saree.stockQuantity = newQty;
    saree.stockStatus = newQty > 2 ? 'In Stock' : `${newQty} Left in Stock`;
    saree.stock = `${newQty} Pieces Available`;
    recordAuditLog(
      'INVENTORY_RESTOCK',
      'sarees',
      `Restocked "${saree.title}" with +${quantity} units. Current stock: ${newQty}`
    );
    return { success: true, saree, newStock: newQty };
  },

  /**
   * 8. Customers Directory & Fast Phone Lookup
   */
  lookupCustomerByPhone(phone) {
    if (!USE_MOCK) {
      return billingRequest('/customers/lookup', { query: { phone } }).then((res) => (
        res.success ? res.data : { found: false, customer: null }
      ));
    }
    if (!phone) return { found: false, customer: null };
    const cleanDigits = String(phone).replace(/\D/g, '');
    if (cleanDigits.length < 5) return { found: false, customer: null };

    const last10 = cleanDigits.slice(-10);
    const found = db.billingCustomers.find((c) => {
      const cDigits = String(c.phone || '').replace(/\D/g, '');
      return cDigits.endsWith(last10) || last10.endsWith(cDigits);
    });

    if (found) {
      return { found: true, customer: found };
    }
    return { found: false, customer: null };
  },

  async getCustomers(search = '') {
    if (!USE_MOCK) {
      const res = await billingRequest('/customers', { query: { search } });
      return res.success ? res.data.customers || [] : [];
    }
    let list = [...db.billingCustomers];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          (c.email && c.email.toLowerCase().includes(q))
      );
    }
    return list;
  },

  async createCustomer(customerData) {
    if (!USE_MOCK) {
      const res = await billingRequest('/customers', { method: 'POST', body: customerData });
      if (!res.success) throw new Error(res.error);
      return res.data.customer;
    }
    const newCustomer = {
      id: `cust-${Date.now()}`,
      name: customerData.name.trim(),
      phone: customerData.phone.trim(),
      email: (customerData.email || '').trim().toLowerCase(),
      city: customerData.city || 'Hyderabad',
      visitsCount: 1,
      lifetimeSpend: 0,
      preferredWeaves: [],
    };
    db.billingCustomers.unshift(newCustomer);
    return newCustomer;
  },

  /**
   * 8. Day Summary / Register Closing
   */
  getTodaySummary() {
    if (!USE_MOCK) {
      return billingRequest('/summary/today').then((res) => (res.success ? res.data : null));
    }
    const todayStr = new Date().toISOString().split('T')[0];
    const todayBills = db.invoices.filter((inv) =>
      inv.date.startsWith(todayStr) && inv.status !== 'returned'
    );

    const totalRevenue = todayBills.reduce((sum, inv) => sum + inv.pricing.grandTotal, 0);
    const billsCount = todayBills.length;

    let cashTotal = 0;
    let upiTotal = 0;
    let cardTotal = 0;

    todayBills.forEach((inv) => {
      if (inv.payment.mode === 'cash') cashTotal += inv.pricing.grandTotal;
      else if (inv.payment.mode === 'upi') upiTotal += inv.pricing.grandTotal;
      else if (inv.payment.mode === 'card') cardTotal += inv.pricing.grandTotal;
      else if (inv.payment.mode === 'split' && inv.payment.splitDetails) {
        cashTotal += inv.payment.splitDetails.cash || 0;
        upiTotal += inv.payment.splitDetails.upi || 0;
        cardTotal += inv.payment.splitDetails.card || 0;
      }
    });

    return {
      date: todayStr,
      billsCount,
      totalRevenue,
      cashTotal,
      upiTotal,
      cardTotal,
      averageOrderValue: billsCount > 0 ? Math.round(totalRevenue / billsCount) : 0,
      heldBillsCount: db.heldBills.length,
    };
  },

  /**
   * 9. WhatsApp Receipt Formatting & Direct Share
   */
  formatWhatsAppReceipt(invoice) {
    if (!invoice) return '';

    const customer = invoice.customer || {};
    const items = Array.isArray(invoice.items) ? invoice.items : [];
    const services = Array.isArray(invoice.services) ? invoice.services : [];
    const pricing = invoice.pricing || {};
    const payment = invoice.payment || {};

    const itemsList = items
      .map((it) => `• ${it.title || 'Saree'} (x${it.quantity || 1}) — ₹${Number(it.subtotal ?? it.price ?? 0).toLocaleString('en-IN')}`)
      .join('\n');

    const servicesList = services.length
      ? '\n✨ Finishing Services:\n' +
        services.map((s) => `• ${s.name} — ₹${Number(s.price || 0).toLocaleString('en-IN')}`).join('\n')
      : '';

    const grossTotal = Number(pricing.grossTotal ?? pricing.grandTotal ?? 0);
    const discountTotal = Number(pricing.discountTotal || 0);
    const totalGst = Number(pricing.totalGst ?? pricing.totalTax ?? ((pricing.cgst || 0) * 2)) || 0;
    const grandTotal = Number(pricing.grandTotal ?? grossTotal);
    const paymentMode = String(payment.mode || 'CASH').toUpperCase();
    const refId = payment.referenceId || 'N/A';

    const dateObj = invoice.date ? new Date(invoice.date) : new Date();
    const dateStr = !isNaN(dateObj)
      ? dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      : 'Today';
    const timeStr = !isNaN(dateObj)
      ? dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      : '';

    return `*Namaste ${customer.name || 'Valued Patron'} Ji,* 🙏

Thank you for gracing *Tripuraa Sangrahah*, Banjara Hills.

Here is your official digital tax invoice for your cherished heritage handloom selection:

━━━━━━━━━━━━━━━━━━━━
📄 *Invoice No:* ${invoice.invoiceNumber || 'TS-INV'}
🗓 *Date:* ${dateStr}
⏰ *Time:* ${timeStr}
━━━━━━━━━━━━━━━━━━━━

🛍 *Handloom Silks Purchased:*
${itemsList || '• Heritage Handloom Drape'}
${servicesList}
💰 *Subtotal:* ₹${grossTotal.toLocaleString('en-IN')}
${discountTotal ? `🎁 *Privilege Discount:* -₹${discountTotal.toLocaleString('en-IN')}\n` : ''}🏛 *GST (5% Pure Silk):* ₹${totalGst.toLocaleString('en-IN')}
💎 *Grand Total Paid:* ₹${grandTotal.toLocaleString('en-IN')}
💳 *Payment Mode:* ${paymentMode} (Ref: ${refId})

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
    const phoneParam = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const text = encodeURIComponent(this.formatWhatsAppReceipt(invoice));
    return `https://wa.me/${phoneParam}?text=${text}`;
  },

  async simulateWhatsAppDispatch(invoiceId) {
    if (!USE_MOCK) {
      const res = await billingRequest(`/invoices/${invoiceId}/whatsapp`, { method: 'POST' });
      return { success: res.success };
    }
    await new Promise((res) => setTimeout(res, 300));
    const inv = db.invoices.find((i) => i.id === invoiceId || i.invoiceNumber === invoiceId);
    if (inv) {
      inv.whatsappDelivery = {
        status: 'sent',
        sentAt: new Date().toISOString(),
        phone: inv.customer.phone,
      };
    }
    return { success: true };
  },
};

