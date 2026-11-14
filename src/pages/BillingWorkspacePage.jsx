import React, { useState, useEffect, useCallback, useRef } from 'react';
import { billingService } from '../services/billingService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { BillingLayout } from '../components/billing/BillingLayout';
import { ProductCatalog } from '../components/billing/ProductCatalog';
import { CartDrawer } from '../components/billing/CartDrawer';
import { PaymentModal } from '../components/billing/PaymentModal';
import { InvoiceModal } from '../components/billing/InvoiceModal';
import { WhatsAppReceiptModal } from '../components/billing/WhatsAppReceiptModal';
import { RecentBillsView } from '../components/billing/RecentBillsView';
import { HeldBillsView } from '../components/billing/HeldBillsView';
import { CustomerSearchView } from '../components/billing/CustomerSearchView';
import { SalesReportsView } from '../components/billing/SalesReportsView';
import { DayClosingModal } from '../components/billing/DayClosingModal';
import { NewCustomerModal } from '../components/billing/NewCustomerModal';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { BillingAccessPage } from './BillingAccessPage';

export function BillingWorkspacePage() {
  const { currentUser, logout } = useAuth();
  const { showToast } = useToast();

  const [isUnlocked, setIsUnlocked] = useState(() => billingService.isAuthenticated());


  // Keep state synchronized
  useEffect(() => {
    setIsUnlocked(billingService.isAuthenticated());
  }, []);

  const handleLockPos = () => {
    billingService.clearStaffSession();
    setIsUnlocked(false);
    showToast('Register Locked', 'info');
  };

  const [activeTab, setActiveTab] = useState('pos'); // 'pos' | 'recent' | 'held' | 'customers' | 'reports' | 'close'

  // Catalog State
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  // Live Bill / Cart State
  const [cartItems, setCartItems] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [customer, setCustomer] = useState({
    name: 'Walk-in Guest',
    phone: '',
    email: '',
    city: 'Hyderabad',
    gstin: '',
    isWalkIn: true,
  });

  // Held Bills State
  const [heldBills, setHeldBills] = useState([]);

  // Modals State
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false);
  const [isDayClosingOpen, setIsDayClosingOpen] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState(null);

  // Day summary ticker
  const [todaySummary, setTodaySummary] = useState(null);

  // Load catalog and summary
  const refreshData = useCallback(async () => {
    setCatalogLoading(true);
    try {
      await billingService.refreshRegister();
      const items = await billingService.searchProducts();
      setProducts(items);
      setCategories(await Promise.resolve(billingService.listCategories()));
      setHeldBills(await Promise.resolve(billingService.getHeldBills()));
      setTodaySummary(await Promise.resolve(billingService.getTodaySummary()));
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Dynamic totals calculation
  const totals = billingService.calculateTotals({
    items: cartItems,
    services: selectedServices,
  });

  // Cart Operations
  const handleAddToCart = (product) => {
    const available = product.stockQuantity || 0;
    if (available <= 0) {
      showToast(`"${product.title}" is out of stock`, 'warning');
      return;
    }

    setCartItems((prev) => {
      const existing = prev.find((item) => item.sareeId === product.id);
      if (existing) {
        if (existing.quantity >= available) {
          showToast(`Cannot add more. Only ${available} in stock.`, 'warning');
          return prev;
        }
        return prev.map((item) =>
          item.sareeId === product.id
            ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.price }
            : item
        );
      }
      return [
        ...prev,
        {
          sareeId: product.id,
          productCode: product.productCode || '100001',
          title: product.title,
          weave: product.weave || '',
          fabric: product.fabric || '',
          price: product.numericPrice || product.price,
          mrp: product.numericMrp || product.mrp || product.price,
          quantity: 1,
          availableStock: available,
          image: (product.images && product.images[0]) || product.image,
          hsnCode: '5007',
          discount: 0,
          subtotal: product.numericPrice || product.price,
        },
      ];
    });

    showToast(`Added "${product.title}" to bill`, 'info');
  };

  const handleUpdateQuantity = (sareeId, newQty) => {
    if (newQty <= 0) {
      handleRemoveItem(sareeId);
      return;
    }

    setCartItems((prev) =>
      prev.map((item) => {
        if (item.sareeId === sareeId) {
          const clamped = Math.min(newQty, item.availableStock || 99);
          return {
            ...item,
            quantity: clamped,
            subtotal: clamped * item.price,
          };
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (sareeId) => {
    setCartItems((prev) => prev.filter((item) => item.sareeId !== sareeId));
    showToast('Item removed from active bill', 'info');
  };

  // Add Custom Item / Service Add-on directly by typing
  const handleAddCustomItem = ({ title, price }) => {
    const numPrice = Number(price) || 0;
    if (!title.trim() || numPrice <= 0) return;
    const newItem = {
      sareeId: `custom-${Date.now()}`,
      productCode: 'ADDON',
      title: title.trim(),
      weave: 'Custom Add-on',
      fabric: 'Special Service / Add-on',
      price: numPrice,
      mrp: numPrice,
      quantity: 1,
      availableStock: 99,
      image: '',
      hsnCode: '9988',
      discount: 0,
      subtotal: numPrice,
      isCustom: true,
    };
    setCartItems((prev) => [...prev, newItem]);
    showToast(`Added custom add-on: "${title}" (₹${numPrice})`, 'info');
  };

  const handleClearCart = () => {
    setCartItems([]);
    setSelectedServices([]);
    setCustomer({
      name: 'Walk-in Guest',
      phone: '',
      email: '',
      city: 'Hyderabad',
      gstin: '',
      isWalkIn: true,
    });
    showToast('Active bill cleared', 'info');
  };

  const _handleToggleService = (service) => {
    setSelectedServices((prev) => {
      const exists = prev.some((s) => s.id === service.id);
      if (exists) {
        return prev.filter((s) => s.id !== service.id);
      }
      return [...prev, service];
    });
  };

  // Hold Bill
  const saleKey = useRef('');

  const _handleHoldBill = async () => {
    if (cartItems.length === 0) return;
    await Promise.resolve(billingService.holdBill({
      customer,
      items: cartItems,
      services: selectedServices,
      note: `Held with ${cartItems.length} sarees at ${new Date().toLocaleTimeString('en-IN')}`,
    }));
    setHeldBills(await Promise.resolve(billingService.getHeldBills()));
    handleClearCart();
    showToast('Bill successfully placed on hold', 'info');
  };

  // Resume Held Bill
  const handleResumeHeldBill = async (holdId) => {
    const resumed = await Promise.resolve(billingService.resumeHeldBill(holdId));
    if (resumed) {
      setCartItems(resumed.items);
      setSelectedServices(resumed.services || []);
      setCustomer(resumed.customer || { name: 'Walk-in Guest', isWalkIn: true });
      setHeldBills(await Promise.resolve(billingService.getHeldBills()));
      setActiveTab('pos');
      showToast(`Resumed bill for ${resumed.customer?.name || 'Patron'}`, 'success');
    }
  };

  const handleDiscardHeldBill = async (holdId) => {
    await Promise.resolve(billingService.discardHeldBill(holdId));
    setHeldBills(await Promise.resolve(billingService.getHeldBills()));
    showToast('Held bill discarded', 'info');
  };

  // Confirm Payment & Complete Sale
  const handleConfirmPayment = async (paymentDetails, finalizedCustomer) => {
    setIsPaymentOpen(false);

    const billCustomer = finalizedCustomer || customer;
    if (billCustomer) {
      setCustomer(billCustomer);
    }

    if (!saleKey.current) saleKey.current = crypto.randomUUID();
    const invoicePayload = {
      customer: billCustomer,
      items: cartItems,
      services: selectedServices.map((service) => ({ id: service.id, name: service.name, price: service.price })),
      pricing: totals,
      payment: paymentDetails,
      idempotencyKey: saleKey.current,
      cashier: currentUser?.name || 'Store Cashier',
    };

    const res = await billingService.createInvoice(invoicePayload);

    if (res.success) {
      setActiveInvoice(res.invoice);
      setIsInvoiceOpen(true);
      saleKey.current = '';
      showToast(`Invoice ${res.invoice.invoiceNumber} Generated!`, 'success');

      // Refresh stock & summary
      refreshData();

      // Reset cart
      setCartItems([]);
      setSelectedServices([]);
      setCustomer({
        name: 'Walk-in Guest',
        phone: '',
        email: '',
        city: 'Hyderabad',
        gstin: '',
        isWalkIn: true,
      });
    } else {
      showToast(res.error || 'Failed to complete transaction', 'error');
    }
  };

  // Process Return
  const handleProcessReturn = async (inv) => {
    if (window.confirm(`Are you sure you want to process a return for ${inv.invoiceNumber}? Stock will be restored to inventory.`)) {
      const res = await billingService.processReturn(inv.id);
      if (res.success) {
        showToast(`Return processed. Saree stock restored to catalog.`, 'success');
        refreshData();
      } else {
        showToast(res.error, 'error');
      }
    }
  };

  const handleLogout = async () => {
    billingService.clearStaffSession();
    setIsUnlocked(false);
    await logout();
    showToast('Signed out. The admin portal will ask for the password.', 'info');
  };

  if (!isUnlocked) {
    return (
      <BillingAccessPage
        onPinSuccess={() => {
          setIsUnlocked(true);
        }}
      />
    );
  }

  return (
    <BillingLayout
      activeTab={activeTab === 'close' ? 'pos' : activeTab}
      setActiveTab={(tab) => {
        if (tab === 'close') setIsDayClosingOpen(true);
        else setActiveTab(tab);
      }}
      heldBillsCount={heldBills.length}
      currentUser={currentUser}
      onLogout={handleLogout}
      onLockPos={handleLockPos}
      todaySummary={todaySummary}
    >
      {/* =====================================================================
          TAB 1: LIVE POS & PRODUCT CATALOG WORKSPACE
         ===================================================================== */}
      {activeTab === 'pos' && (
        <div className="flex flex-col lg:flex-row gap-3 flex-1 min-h-0 h-full max-h-full overflow-hidden">
          {/* Left/Center: Saree Catalog */}
          <div className="flex-1 lg:flex-[7] xl:flex-[8] min-w-0 min-h-0 h-full max-h-full flex flex-col overflow-hidden">
            <ProductCatalog
              products={products}
              cartItems={cartItems}
              onAddToCart={handleAddToCart}
              categories={categories}
              loading={catalogLoading}
            />
          </div>

          {/* Right: Live Cart & Invoice Drawer */}
          <div className="w-full lg:w-[410px] xl:w-[440px] flex-shrink-0 min-h-0 h-full max-h-full flex flex-col overflow-hidden">
            <CartDrawer
              cartItems={cartItems}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
              onClearCart={handleClearCart}
              onAddCustomItem={handleAddCustomItem}
              totals={totals}
              onProceedToPayment={() => setIsPaymentOpen(true)}
            />
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 2: RECENT BILLS / INVOICES
         ===================================================================== */}
      {activeTab === 'recent' && (
        <RecentBillsView
          onViewInvoice={(inv) => {
            setActiveInvoice(inv);
            setIsInvoiceOpen(true);
          }}
          onOpenWhatsApp={(inv) => {
            setActiveInvoice(inv);
            setIsWhatsAppOpen(true);
          }}
          onProcessReturn={handleProcessReturn}
          onRestockSuccess={() => {
            refreshData();
            showToast('Saree Restocked! Added back to POS Catalog.', 'success');
          }}
        />
      )}

      {/* =====================================================================
          TAB 3: HELD BILLS
         ===================================================================== */}
      {activeTab === 'held' && (
        <HeldBillsView
          heldBills={heldBills}
          onResumeBill={handleResumeHeldBill}
          onDiscardBill={handleDiscardHeldBill}
        />
      )}

      {/* =====================================================================
          TAB 4: CUSTOMER SEARCH & DIRECTORY
         ===================================================================== */}
      {activeTab === 'customers' && (
        <CustomerSearchView
          onSelectCustomer={(cust) => {
            setCustomer({
              name: cust.name,
              phone: cust.phone,
              email: cust.email || '',
              city: cust.city || 'Hyderabad',
              isWalkIn: false,
            });
            setActiveTab('pos');
            showToast(`Patron "${cust.name}" selected for billing`, 'success');
          }}
          onOpenNewCustomer={() => setIsNewCustomerOpen(true)}
        />
      )}

      {/* =====================================================================
          TAB 5: SALES REPORTS & VELOCITY
         ===================================================================== */}
      {activeTab === 'reports' && (
        <SalesReportsView todaySummary={todaySummary} />
      )}

      {/* =====================================================================
          TAB 6: TRANSACTIONS (Reuses RecentBills with auto-focus on tender ledger)
         ===================================================================== */}
      {activeTab === 'transactions' && (
        <RecentBillsView
          onViewInvoice={(inv) => {
            setActiveInvoice(inv);
            setIsInvoiceOpen(true);
          }}
          onOpenWhatsApp={(inv) => {
            setActiveInvoice(inv);
            setIsWhatsAppOpen(true);
          }}
          onProcessReturn={handleProcessReturn}
          onRestockSuccess={() => {
            refreshData();
            showToast('Saree Restocked! Added back to POS Catalog.', 'success');
          }}
        />
      )}

      {/* =====================================================================
          MODALS
         ===================================================================== */}
      <ErrorBoundary onReset={() => {
        setIsInvoiceOpen(false);
        setIsWhatsAppOpen(false);
        setIsPaymentOpen(false);
      }}>
        <PaymentModal
          isOpen={isPaymentOpen}
          onClose={() => setIsPaymentOpen(false)}
          grandTotal={totals.grandTotal}
          customer={customer}
          onConfirmPayment={handleConfirmPayment}
        />

        <InvoiceModal
          isOpen={isInvoiceOpen}
          onClose={() => setIsInvoiceOpen(false)}
          invoice={activeInvoice}
          onNewBill={() => {
            setIsInvoiceOpen(false);
            setActiveTab('pos');
          }}
          onOpenWhatsApp={(inv) => {
            setIsInvoiceOpen(false);
            setActiveInvoice(inv);
            setIsWhatsAppOpen(true);
          }}
        />

        <WhatsAppReceiptModal
          isOpen={isWhatsAppOpen}
          onClose={() => setIsWhatsAppOpen(false)}
          invoice={activeInvoice}
        />

        <NewCustomerModal
          isOpen={isNewCustomerOpen}
          onClose={() => setIsNewCustomerOpen(false)}
          onCustomerCreated={(newCust) => {
            setCustomer({
              name: newCust.name,
              phone: newCust.phone,
              email: newCust.email || '',
              city: newCust.city || 'Hyderabad',
              isWalkIn: false,
            });
            showToast(`Patron "${newCust.name}" registered and assigned to active bill`, 'success');
          }}
        />

        <DayClosingModal
          isOpen={isDayClosingOpen}
          onClose={() => setIsDayClosingOpen(false)}
          todaySummary={todaySummary}
          staff={currentUser || { name: 'Administrator', role: 'Store Manager' }}
          onCompleteClosing={() => {
            setIsDayClosingOpen(false);
          }}
        />
      </ErrorBoundary>
    </BillingLayout>
  );
}
