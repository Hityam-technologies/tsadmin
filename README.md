# Tripuraa Sangrahah — Heritage Atelier Admin Portal

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
The atelier portal will launch at `http://localhost:5173`.

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
Executes 17 Vitest + React Testing Library tests covering authentication, route guards, saree form validation, table filters, pagination, enquiry lifecycle, and role-based menu visibility.

### 5. Running Lint
```bash
npm run lint
```

---

## 🔐 Administrative Access Credentials

The portal is governed by a unified **Admin** role with full operational clearance across all 9 atelier modules:

| Role | Email | Password | Primary Clearance & Capabilities |
|---|---|---|---|
| **Admin** | `admin@tripuraa.in` | `Password@123` | Full access: Saree catalog CRUD, Category stories, Concierge inquiries CRM, Customer security, FASHN.ai studio, Content studio, System config, and Audit logs. |

> **Security Note**: Authentication tokens are maintained strictly in memory (`tokenStore` in `src/services/apiClient.js`) and never saved in `localStorage` or cookies.

> **Security Note**: Authentication tokens are maintained strictly in memory (`tokenStore` in `src/services/apiClient.js`) and never saved in `localStorage` or cookies.

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

1. **Atelier Login (`/login`)**
   - Luxury temple gold styling, brand crest, input validation.
   - Quick one-click test credentials for Super Admin, Catalog Lead, and Support Agent.
   - Forgot Password modal with email link dispatch simulation.

2. **Executive Atelier Dashboard (`/`)**
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
   - Tab 2: **Store Atelier Address** — flagship studio coordinates (Road No. 36, Jubilee Hills, Hyderabad), landmark, operating hours, and Google Maps intent query.
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

---

## 🔍 Known Gaps & Future Enhancements

1. **Live WebSockets for Inquiries**: Current enquiries refresh on user interaction or manual fetch; adding WebSocket or Server-Sent Events (SSE) will push instant audio chimes when a customer books a high-value bridal inquiry.
2. **Direct S3 / Cloudinary Binary Upload**: The image uploader currently accepts image URLs and local mock image references. In Phase 2 backend integration, an AWS S3 presigned URL uploader can be hooked directly into `src/services/sareeService.js`.
3. **Advanced Bulk CSV Import**: Bulk export is implemented; bulk upload via CSV spreadsheet for batch importing 500+ sarees at seasonal launch can be added to the Saree Catalog toolbar.
