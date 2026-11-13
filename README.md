# Tripuraa Sangrahah — Admin Portal & Store POS System

> A bespoke, luxury administration portal for **"Tripuraa Sangrahah"** (Indian Luxury Handloom Sarees: Kanchipuram, Banarasi Katan, Paithani, Tissue Organza, and Bridal Weaves).
> Derived directly from the real mobile application (`tripuraasangrahah`) and built with React, Vite, JavaScript, Tailwind CSS, TanStack Query, and Recharts.

---

## 🏛️ Quick Start & Setup

### 1. Installation
```bash
# Navigate to the admin portal directory
cd c:\hityam\TS\tsadmin

# Install dependencies (already executed)
npm install
```

### 2. Running in Development
```bash
npm run dev
```
The admin portal will launch at `http://localhost:5173`.

### 3. Running Production Build & Preview
```bash
# Build production bundle into /dist
npm run build

# Preview production build locally
npm run preview
```

### 4. Running the Automated Test Suite
```bash
npm run test
```
Executes 50 Vitest + React Testing Library tests across 8 test suites covering authentication, route guards, saree form validation, table filters, pagination, enquiry lifecycle, role-based menu visibility, billing workflow, POS security PIN verification, invoice modal crash prevention, sold out archive, and layout responsiveness.

### 5. Running Lint
```bash
npm run lint
```

---

## 🔐 Administrative Access Credentials

The portal is governed by a unified **Admin** role alongside counter cashier staff profiles for the POS billing module:

| Role / Surface | Identity / Email | Password / PIN | Primary Clearance & Capabilities |
|---|---|---|---|
| **Admin** | `admin@tripuraa.in` | `Password@123` | Full access: Saree catalog CRUD, Category stories, Concierge inquiries CRM, Customer security, FASHN.ai studio, Content studio, System config, and Audit logs. |
| **Cashier / POS** | Radha Swaminathan (Counter 01) | PIN: `123456` | Counter billing, product catalog POS lookup, invoice generation, customer receipts, and shift day closing. (Alternate demo PINs: `987654`, `555888`) |

> **Security Note**: Authentication tokens and POS cashier session credentials are maintained strictly in memory (`tokenStore` in `src/services/apiClient.js` & `billingService.js`) and never saved in persistent storage or cookies.

---

## 🔌 Switching from In-Memory Mock to Real Backend API

The application has a zero-backend decoupling layer. All data requests route through `src/services/*`.

To connect to a live backend (such as `tripuraabackend` on port 5000):
1. Create or edit `.env` (derived from `.env.example`):
   ```env
   VITE_USE_MOCK=false
   VITE_API_BASE_URL=http://localhost:5000
   ```
2. Restart the Vite dev server (`npm run dev`).
3. For the complete backend request/response schemas, refer to [`docs/ADMIN_API_CONTRACT.md`](./docs/ADMIN_API_CONTRACT.md).

---

## 📄 Pages Built

1. **Portal Login (`/login`)**
   - Luxury temple gold styling, brand crest, input validation.
   - Quick one-click test credentials for Super Admin, Catalog Lead, and Support Agent.
   - Forgot Password modal with email link dispatch simulation.

2. **Executive Store Dashboard (`/`)**
   - **Authentic Brand Color Palette & Manrope Typography**: Clean, high-end production layout styled with Google Font **Manrope** (`font-sans`), large high-contrast bold typography, soft warm stone canvas (`#F6F5F2`), floating rounded sidebar (`rounded-[28px]`) with official `homeLogo.png`, left-edge active gold accent bar, real-time pulsing clock and date, and top navigation bar with search pill and `⌘ F` shortcut. Strict brand luxury palette: **Antique Temple Gold** (`#C5A253`), **Burnt Saffron** (`#BF5B21`), and **Royal Maroon** (`#6B1728`) — **zero green accents**.
   - **Top 4 KPI Bento Cards**: Metric cards (`Registered Clients: 2,959`, `Master Saree Catalog: 48`, `Concierge Inquiries: 14`, `AI Try-On Drape Looks: 38`) with large bold numbers (`text-4xl sm:text-5xl`), `↗` action links, and progress pills.
   - **Dual Side-by-Side Responsive Analytics Graphs**:
     - **Customer Engagement & Try-On Activity**: Responsive AreaChart tracking mobile wardrobe telemetry — AI virtual fittings (FASHN.ai) vs customer wishlist saves across 6 months in **Temple Gold** & **Burnt Saffron**.
     - **Saree Catalog by Weave Category**: Responsive BarChart showing retail inventory valuation (₹ Lakhs) across mobile app category stories (Kanchipuram, Banarasi Katan, Paithani, Tissue Organza, Bridal) in **Temple Gold**.
   - **Recent Concierge Inquiries Feed**: Live customer lead pipeline showing inquiries received from WhatsApp and Phone Helpline with customer names, phone numbers, saree titles, prices, channels, and status badges.
   - **Low Stock Sarees in Catalog**: Real-time catalog alert showing sarees with 2 or fewer pieces in inventory, with high-res thumbnails, prices, stock levels, and quick catalog inspection links.

3. **Master Saree Catalog (`/sarees`)**
   - Search by title, weave technique, origin, or zari purity.
   - Dynamic filters: Category story, stock level (`In Stock`, `Low Stock`, `Out of Stock`), active/inactive status.
   - Sorting: Newest, Price Low to High, Price High to Low, Title A-Z.
   - Paginated table with high-res thumbnails, price, MRP, weave details, and stock indicators.
   - **Batch Bulk Actions**: Activate, Deactivate, Mark Featured, Delete.
   - **Create / Edit Drawer**:
     - Saree Title, Brand, Slug, Category, Selling Price (₹), MRP (₹), Stock Quantity.
     - Handloom Specs: Weaving Technique, Fabric Composition, Zari Purity, Origin Cluster, Color Theme, Availability Badge Text.
     - **Multi-Image Uploader**: Drag/move up & down, primary cover selection, remove image, append URL.
     - Separate 3D Model Try-On image asset selector for virtual fitting.
     - Feature star and live catalog publish toggles.
   - **Duplicate Saree**: Instant 1-click clone with `(Copy)` suffix.
   - **Delete Confirmation Dialog**: Destructive action confirmation barrier.

4. **Category Stories & Collections (`/categories`)**
   - Direct control of the circular Instagram-style story bar on the customer app home screen.
   - Move Up / Move Down buttons to reorder the mobile display sequence.
   - Active visibility toggle switch to hide/reveal categories dynamically.
   - Add/Edit Category modal with cover image and item counts.
   - Delete confirmation dialog.

5. **Customer Inquiries & Bespoke Orders (`/enquiries`)**
   - Horizontal pipeline tabs: All, New, Contacted, Confirmed, Closed, Cancelled.
   - Real-time search across customer names, phones, emails, and saree titles.
   - **1-Click Export CSV Report** for courier and logistics coordination.
   - **Interactive Inquiry Detail Drawer**:
     - Customer details with 1-tap **Call**, **WhatsApp** (with pre-filled customized message), and **Email** actions.
     - Saree details and customer notes.
     - Status progression selector (New → Contacted → Confirmed → Closed → Cancelled).
     - Internal CRM staff notes thread with timestamps and author attribution.

6. **Customer & Staff Directory (`/users`)**
   - Search by name, email, phone; filter by role and active/blocked status.
   - User table showing role badges, contact info, wishlist counts, and saved 3D looks count.
   - **User Detail Modal**:
     - Profile overview, contact links.
     - Grid of customer's wishlisted sarees.
     - Gallery of saved virtual try-on looks.
     - **Super Admin Role Elevation**: Promote/demote staff roles.
     - **Account Suspension / Reinstatement**: Block customer with reason prompt to prevent chargeback fraud.

7. **FASHN.ai Virtual Try-On Studio (`/try-on-ai`)**
   - **Automated AI Pipeline**: Built around FASHN.ai's Try-On API (`https://api.fashn.ai/v1/run`, model `tryon-max` / `tryon-v1.6`). Eliminates manual approval bottlenecks since predictions are machine-moderated and generated asynchronously via webhooks.
   - **Real-Time Telemetry Logs**: Searchable, filterable generation runs with status (`completed`, `in_progress`, `failed`), run IDs, model version, execution latency, and full-resolution model/garment/output lightbox inspector.
   - **Quota & Credit Tracker**: Live tracking of API credit consumption (e.g., 842 / 1,000 requests used).
   - **Interactive Drape Testing Sandbox**: Allows admins to test virtual drape combinations with any catalog saree and custom model photography before publishing.
   - **API & NSFW Safety Configuration**: Live control over API keys, default model engine (`tryon-max`), category mode (`one-pieces`), and automated NSFW filtering.

8. **Content Studio (`/content`)**
   - Tab 1: **Hero Video Reel** — video URL, title, subtitle, poster fallback, autoplay/loop toggles, and live HTML5 video player preview.
   - Tab 2: **Store Address** — flagship studio coordinates (Road No. 36, Jubilee Hills, Hyderabad), landmark, operating hours, and Google Maps intent query.
   - Tab 3: **Support Concierge Channels** — manage WhatsApp phone & prefilled greeting, Instagram handle, toll-free helpline, with drag reordering.
   - Tab 4: **FAQ Manager** — add, edit, delete, and reorder Q&A items displayed on the customer app FAQ screen.
   - Tab 5: **Legal Terms & Policy Editor** — edit Terms of Service and Privacy Policy clauses with live side-by-side preview.

9. **System Configuration (`/settings`)** *(Super Admin Only)*
   - Mobile minimum required app version barrier (SemVer gate).
   - Force Update toggle switch.
   - Loom Maintenance Mode toggle with customizable client notice.
   - **Dynamic Live Feature Flags**:
     - `enableTryOn`: Enable AI 3D Virtual Try-On Studio.
     - `enableBespokeConcierge`: Direct WhatsApp Concierge.
     - `enableInternationalShipping`: International customs and dispatch.
     - `enableWishlistSharing`: Wishlist & lookbook deep links.
     - `enableVideoReelsAutoplay`: Fashion week video autoplay.

10. **Immutable Audit Trail (`/audit-logs`)** *(Super Admin Only)*
    - Searchable, filterable event log recording every action: actor name, role, IP address, timestamp, resource target, and detailed change description.

11. **Store Billing / POS System (`/billing`)**
    - **Purpose & Scope**: A high-speed, luxury in-store counter billing and Point of Sale (POS) system designed specifically for the flagship boutique counters of **Tripuraa Sangrahah**. Operates fully client-side with zero-backend decoupling via `billingService.js`.
    - **6-Digit Staff Security PIN Barrier (`/billing`)**:
      - Pinpad verification modal requiring authorized 6-digit PIN (`123456`, `987654`, `555888`).
      - Cashier profile binding (e.g. *Radha Swaminathan • Counter 01*).
      - In-memory session tracking with fast lock/unlock and switch cashier workflows.
      - Immutable audit logging for every register access event.
    - **Top Navigation & Live Register Bar (`BillingLayout.jsx`)**:
      - Official luxury medallion logo (`homeLogo.png`) and store banner.
      - Real-time live digital clock and calendar date (`font-mono`).
      - Quick actions: Switch Cashier / Lock PIN, Day Closing modal trigger, Fullscreen toggle, and direct navigation back to the Admin Portal (`/`).
      - Navigation tabs: `New Bill (POS)`, `Recent Bills`, `Customer Search`, and `Sales Reports`.
    - **Product Catalog & Saree Selection (`ProductCatalog.jsx`)**:
      - High-contrast visual saree card grid optimized for quick counter discovery.
      - **Luxury Card Design**: Full-bleed drape photography with a smooth bottom gradient overlay displaying saree title, weave technique, pricing badge (₹), and `+ Add` button.
      - Live search across saree title, weave technique, fabric, or product code (`#100001`, `#100002`).
      - Category filter pills: *All Sarees, Banarasi, Kanchipuram, Paithani, Organza, Bridal Weaves*.
      - Real-time inventory badges (e.g. *Only 1 Left*).
      - **Boutique-Centric Workflow**: Barcode scanning button cleanly removed in favor of instant visual and code search tailored to luxury handloom consultation.
    - **Cart & Tender Calculation Engine (`CartDrawer.jsx`, `BillingWorkspacePage.jsx`)**:
      - Active billing cart with line item quantities, increment/decrement controls, and item removal.
      - **Handloom Finishing Add-ons**: Silk Tassels (*Kuchu*), Fall & Pico, Blouse Stitching, and Heavy Zari Tassels with per-item pricing.
      - **Patron Assignment**: One-click *Walk-in Guest* toggle or linked CRM patron profile (name, phone, email, and GSTIN).
      - **Boutique Discounting**: Percentage (`%`) or Flat (`₹`) privilege discount with instant recalculation.
      - **Tax Computation**: Standard 5% inclusive GST handloom silk rate, taxable value breakdown, and Net Grand Total.
      - **Multi-Tender Payment**: Cash, UPI (dynamic QR reference generation), Card (POS terminal swipe reference), and Split Tender payment modes.
      - **Park & Held Bills (`HeldBillsView.jsx`)**: Save in-progress counter consultations and restore them instantly without losing cart selections.
    - **Store Receipt & Invoice Generation (`InvoiceModal.jsx`, `WhatsAppReceiptModal.jsx`)**:
      - Clean luxury store receipt layout stripped of redundant technical tax boxes, duplicate headers, and confusing tax codes.
      - Itemized receipt table: Line number (`#`), Saree Description, Quantity (`Qty`), and Amount (`₹`).
      - Summary breakdown: Subtotal, Privilege Discount, GST (5% inclusive), and Net Total.
      - Formal Amount in Words and payment tender reference.
      - **Store Policy**: Strictly enforces `"No Exchange • No Return. Goods once sold will not be taken back or exchanged."`
      - **Multi-Channel Actions**:
        - **Print Receipt**: Direct printer output formatted with `@media print` CSS rules.
        - **Download**: Plain text store bill (`.txt`) formatted for archival and thermal printers.
        - **Send WhatsApp**: Pre-populated customer phone number and formatted digital bill text.
        - **New Bill**: Clears the register cart and resets for the next patron.
    - **Patron Directory (`CustomerSearchView.jsx`)**:
      - Admin Portal styled customer directory with Table / Grid layout switcher.
      - Patron Monogram avatar medallion, name, customer ID, phone, email, and city with MapPin icon.
      - Customer metrics: Visits count (`visitsCount`) and Lifetime spend (`lifetimeSpend`).
      - Preferred weave tags (e.g. *Kanchipuram, Banarasi*) and 1-tap **"Select for Bill"** action.
    - **Dual-Section Recent Bills & Sold Out Archive (`RecentBillsView.jsx`)**:
      - **Section 1: Recent Store Invoices**:
        - Real-time searchable history of all store invoices.
        - Filter by payment mode (Cash, UPI, Card, Split) and invoice status (Paid, Refunded, Cancelled).
        - Quick actions to re-open receipt modal, share on WhatsApp, print, or process return & restore stock.
      - **Section 2: Sold Out Items Archive**:
        - Exclusively archives weaves that have completely sold out (`stockQuantity <= 0`).
        - **Strict POS Catalog Exclusion**: Sold out items are completely hidden from the active counter catalog (`ProductCatalog.jsx`) so cashiers never see depleted items during billing.
        - Enriched with last sale invoice details (Invoice number, patron name, transaction date).
        - Direct **"View Bill"** action to inspect the sale invoice receipt.
        - One-click **"Restock +1"** action to restore inventory when fresh artisanal looms arrive, immediately making them available in the POS catalog.
    - **Sales Telemetry & Register Day Closing (`SalesReportsView.jsx`, `DayClosingModal.jsx`)**:
      - Real-time KPIs: Today's Revenue, Average Order Value (AOV), Total Bills, Top Payment Tender.
      - Tender distribution summary (Cash, UPI, Card).
      - **Streamlined Day-End Closing**: Displays Today's Register Summary with an instant, one-click **"Close Register"** button (eliminated tedious physical cash counting, reconciliation variance, and fake network delays).
    - **Stability, Error Boundary & Crash Prevention**:
      - Wrapped with React `ErrorBoundary` to gracefully catch and display errors without turning the screen blank.
      - Defensive fallback resolution for invoice pricing (`totalGst ?? totalTax`) and optional customer phone numbers.
    - **Automated Vitest Test Suites**:
      - `src/test/billing-workflow.test.jsx`: 16 tests for staff PIN validation, cart operations, finishing add-ons, discounts, split payments, and sold-out archive retrieval & restock.
      - `src/test/billing-layout.test.jsx`: 10 tests for header rendering, clock, tab switching, dual-section recent bills, and navigation.
      - `src/test/invoice-modal-crash.test.jsx`: 5 tests verifying crash-free rendering of mock invoices and receipt modals.

---

## 🔍 Known Gaps & Future Enhancements

1. **Live WebSockets for Inquiries**: Current enquiries refresh on user interaction or manual fetch; adding WebSocket or Server-Sent Events (SSE) will push instant audio chimes when a customer books a high-value bridal inquiry.
2. **Direct S3 / Cloudinary Binary Upload**: The image uploader currently accepts image URLs and local mock image references. In Phase 2 backend integration, an AWS S3 presigned URL uploader can be hooked directly into `src/services/sareeService.js`.
3. **Advanced Bulk CSV Import**: Bulk export is implemented; bulk upload via CSV spreadsheet for batch importing 500+ sarees at seasonal launch can be added to the Saree Catalog toolbar.
