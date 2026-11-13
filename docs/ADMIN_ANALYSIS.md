# Tripuraa Sangrahah — Admin Panel Architecture & Domain Analysis

## Executive Summary
This document provides a comprehensive analysis of the luxury handloom saree mobile application **"Tripuraa Sangrahah"** (derived directly from the production React Native mobile codebase at `tripuraasangrahah`), identifying every piece of customer-facing data, state, and interaction that must be controlled dynamically through the Admin Panel.

The goal of this admin panel is to ensure that the mobile application remains evergreen, vibrant, and operationally self-sufficient without requiring code modifications or app store releases for inventory changes, merchandising, customer service, or regulatory compliance.

---

## 1. App Screen to Admin Page Mapping Table

| App Screen | Real Mobile File | Data & Assets Displayed | Admin Action Needed | Admin Page & Module |
|---|---|---|---|---|
| **Splash Screen** | `screens/public/splashScreen.jsx` | Brand monogram/wordmark, luxury aesthetic tone, version check & minimum app barrier | Configure minimum app version, manage force-update switch, maintenance banner | **System Settings** (`/settings`) |
| **Login Screen** | `screens/public/loginScreen.jsx` | Email, password fields, forgot password trigger, authentication status | Search users, toggle account active/blocked status, view login attempts & security audit trail | **Users** (`/users`), **Audit Logs** (`/audit-logs`) |
| **Registration & OTP** | `screens/public/registrationScreen.jsx`, `otpScreen.jsx` | Full name, email, phone number (`countryCodes.js`), OTP verification, Terms agreement | Verify customer identity, view registered phone numbers, re-send verification, role assignment | **Users** (`/users`), **Audit Logs** (`/audit-logs`) |
| **Home Screen (Hero)** | `screens/private/homeTab/homeScreen.jsx` | Featured video reel (`HERO_VIDEO` / `kausalya_edit.mp4`), fashion week showcase header | Update hero video URL / CDN stream, poster image, title overlay, active/inactive toggle | **Content Studio** (`/content/hero`) |
| **Home Screen (Stories)** | `components/categoryStoryBar.jsx`, `data/categories.js` | Horizontal category story pills: All, Kanchipuram, Banarasi, Bridal, Tissue, Paithani | Create/edit categories, upload luxury cover circular thumbnails, drag-to-reorder stories | **Categories** (`/categories`) |
| **Home Screen (Curated)** | `homeScreen.jsx`, `data/sareeCatalog.js` | "Top Picks for You", "Exclusive Weaves" saree cards, pricing, stock badges | Feature/unfeature sarees, update inventory flags ("1 Heritage Weave Left", "In Stock", "Handcrafted on Order") | **Saree Catalog** (`/sarees`), **Dashboard** (`/`) |
| **Collections Screen** | `screens/private/collectionTab/collectionsScreen.jsx` | Full master catalog, quick filter chips (All Weaves, Pure Zari, Handloom, Wedding Edit, Under ₹30K), sort dropdown | Manage saree listings, assign tags/categories, adjust pricing & MRP, real-time search & bulk activations | **Saree Catalog** (`/sarees`) |
| **Card Detail Screen** | `screens/private/cardDetailScreen.jsx` | High-res zoomable gallery, title, brand, price, MRP, weave specs (fabric, zari, origin), description, CTAs | Multi-photo upload with drag reorder, primary cover selection, flat image vs model try-on asset, stock status | **Saree Catalog Editor** (`/sarees/:id`) |
| **Virtual Try-On Studio** | `screens/private/wardrobeTab/tryOnScreen.jsx`, `tryOnContext.js` | User silhouette portrait, AI Drape simulation overlay, flat weave preview, scan animation | FASHN.ai automated generation telemetry, API quota tracking, drape sandbox testing, API key config | **FASHN.ai Try-On** (`/try-on-ai`), **System** (`/settings`) |
| **Wardrobe Screen** | `screens/private/wardrobeTab/wardrobeScreen.jsx` | Segmented views: "Saved Sarees" (Wishlist items) & "Try-On Looks" (Personal Lookbook) | Inspect customer interest metrics, popular wishlisted weaves, view user saved looks | **Dashboard** (`/`), **Users Detail** (`/users/:id`) |
| **Enquiries & Orders** | Triggered from Saree Detail & Concierge Support | Customer bespoke weaving inquiries, bridal trousseau booking requests, WhatsApp pings | Track inquiry lifecycle (New → Contacted → Confirmed → Closed → Cancelled), internal notes, WhatsApp/Call/Email actions, CSV export | **Enquiries & Orders** (`/enquiries`) |
| **Store Address Sheet** | `components/storeAddressBottomSheet.jsx`, `data/supportStoreData.js` | Flagship studio address (Road No. 36, Jubilee Hills, Hyderabad), landmark, open hours, GPS coordinates | Update store address lines, opening timings, Google Maps URL / query, landmark notes | **Content Studio** (`/content/store`) |
| **Support Sheet** | `components/supportBottomSheet.jsx`, `data/supportStoreData.js` | WhatsApp number (`+919876543210`), greeting message, Instagram handle, toll-free helpline | Add, remove, update and reorder support channels, edit pre-filled WhatsApp concierge text | **Content Studio** (`/content/support`) |
| **FAQ Screen** | `screens/private/accountTab/faqScreen.jsx`, `data/faqData.js` | 6 Handloom Q&As (Silk Mark authenticity, zari care, bridal consultation, shipping, AI Try-On privacy) | Add, edit, delete, and drag-and-drop reorder frequently asked questions | **Content Studio** (`/content/faq`) |
| **Terms of Service** | `termsOfServiceScreen.jsx`, `data/legalPolicies.js` | 6 legal clauses (Handloom Heritage, Bespoke Commissions, Pricing & Taxes, Transit Insurance, IP/Copyright) | Markdown / rich text clause editor, section addition, revision audit timestamp | **Content Studio** (`/content/terms`) |
| **Privacy Policy** | `userPolicyScreen.jsx`, `data/legalPolicies.js` | 5 privacy sections (Customer Data, Silk Mark Passport, AI Try-On data encryption, Payment security) | Update compliance clauses, privacy disclosures, data retention rules with live preview | **Content Studio** (`/content/policy`) |

---

## 2. Administrative Architecture (Unified Single Admin Model)

Based on actual store workflow requirements, all administrative capabilities are consolidated into a unified **Admin** role (`role: 'admin'`). A single administrative credential (`admin@tripuraa.in` / `Password@123`) has full operational control over the entire platform without artificial role barriers:

### Full Admin Capabilities
- **Master Saree Catalog**: Full CRUD (Create, Read, Update, Delete, Duplicate), multi-photo drag-to-reorder, primary cover selection, flat image vs model drape designation, inventory status updates (`In Stock`, `1 Heritage Weave Left`, `2 Pieces Crafted`, `Handcrafted on Order`, `Out of Stock`), bulk actions, and low-stock monitoring.
- **Category Stories & Collections**: Create, edit, reorder, toggle active/inactive, and upload circular story thumbnails.
- **Concierge Inquiries & CRM**: Pipeline management (`New`, `Contacted`, `Confirmed`, `Closed`, `Cancelled`), append internal timestamped CRM notes, trigger one-click WhatsApp concierge chat, phone dialer, or email, and CSV export.
- **Client & Customer Security**: View customer profiles, wishlists, saved 3D looks, and suspend/reinstate fraudulent accounts.
- **FASHN.ai Try-On Studio**: Telemetry tracking, API quota monitoring, safety filter review, API key configuration, and interactive live drape testing sandbox.
- **Content Studio**: Live management of Hero video reel, Flagship Boutique store address, customer support channels, FAQ accordion, and legal terms/privacy markdown policies.
- **System Settings & App Governance**: Minimum mobile app version enforcement, emergency force-update toggle, feature flags (e.g., Enable FASHN.ai Try-On, Concierge WhatsApp), and API endpoints.
- **Immutable Audit Trail**: Cryptographic timestamped logging of every administrative update, price adjustment, and security action.

---

## 3. Administrative Operational Matrix

| Module / Action | Admin | Description |
|---|:---:|---|
| **Dashboard Metrics & Trends** | Full Access | Live counts, inquiry pipeline charts, category valuation |
| **Saree Catalog (Create / Edit / Pricing)** | Full Access | Full listing editor, pricing, weave attributes |
| **Saree Catalog (Bulk Actions & Stock Toggle)** | Full Access | Bulk feature, bulk activate/deactivate, delete |
| **Saree Catalog (Permanent Deletion)** | Full Access | Complete removal with confirmation modal |
| **Categories & Stories (Reorder & Edit)** | Full Access | Circular story ordering, cover image upload |
| **Enquiries (View / Status Update / Notes)** | Full Access | Inquiry lifecycle, CRM notes, WhatsApp dialer |
| **Enquiries (Export CSV)** | Full Access | Download client inquiry sheet |
| **Users (View Profiles & Wishlists)** | Full Access | Inspect client wishlists, 3D try-on looks, inquiry history |
| **Users (Block / Unblock)** | Full Access | Fraud prevention, suspension management |
| **FASHN.ai Try-On (Telemetry, Sandbox, Quota)** | Full Access | Monitor generation logs, sandbox testing |
| **FASHN.ai Config (API Key, Model Parameters)** | Full Access | Manage FASHN.ai integration and credentials |
| **Content Studio (Hero Video, Address, Support)**| Full Access | Live updates to mobile hero reel, store address, support |
| **Content Studio (FAQ Editor)** | Full Access | Q&A creation, ordering, active switch |
| **Content Studio (Legal Terms & Privacy)** | Full Access | Markdown legal clause editor with live preview |
| **System Settings (Min Version, Flags)** | Full Access | Minimum app barrier, force update switch, feature flags |
| **Audit Logs (View History)** | Full Access | Cryptographic timeline of all administrative actions |

---

## 4. Key Data Models Derived from App

1. **Saree Product Entity**:
   - `id`: Unique identifier (e.g., `saree-1`)
   - `brand`: Brand/Collection label (e.g., `Tripuraa Heritage`, `Varanasi Royal`)
   - `title`: Saree title
   - `slug`: URL slug
   - `category`: Category slug (`sarees`, `katan`, `bridal`, `tissue`, `paithani`)
   - `price`: Formatted Indian Rupee string (`₹28,500`)
   - `numericPrice`: Number (e.g., `28500`)
   - `mrp`: Formatted Indian Rupee MRP string (`₹34,000`)
   - `numericMrp`: Number (`34000`)
   - `weave`: Specific weaving technique (`Kanchipuram Handloom`, `Banarasi Katan Silk`)
   - `fabric`: Base fabric composition (`Pure Mulberry Silk`, `Pure Katan Silk`)
   - `zari`: Tested zari specification (`Gold & Silver Zari`, `Antique Tested Zari`)
   - `origin`: Geographical origin cluster (`Kanchipuram, Tamil Nadu`)
   - `colorTheme`: Dominant color code / theme (`gold`, `emerald`, `crimson`, `pink`, `blue`, `silver`)
   - `images`: Array of high-res image URLs
   - `image`: Primary display image URL
   - `tryOnImage`: Model silhouette or transparent drape PNG used in 3D fitting
   - `description`: Rich narrative detailing craft, motifs, and pedigree
   - `stock`: Current availability badge text (`In Stock`, `1 Heritage Weave Left`, etc.)
   - `stockQuantity`: Integer inventory count
   - `isFeatured`: Boolean
   - `isActive`: Boolean

2. **Customer Enquiry / Bespoke Commission Entity**:
   - `id`: e.g., `ENQ-1042`
   - `customerName`: string
   - `customerPhone`: string
   - `customerEmail`: string
   - `sareeId`: string
   - `sareeTitle`: string
   - `sareePrice`: string
   - `status`: `'new' | 'contacted' | 'confirmed' | 'closed' | 'cancelled'`
   - `channel`: `'whatsapp' | 'call' | 'app_inquiry' | 'bridal_consultation'`
   - `notes`: Array of internal staff notes `{ id, author, text, createdAt }`
   - `createdAt`: ISO Date timestamp
   - `updatedAt`: ISO Date timestamp

3. **Virtual Try-On Look Entity**:
   - `id`: e.g., `look-9021`
   - `userId`: string
   - `userName`: string
   - `userPortraitUrl`: string
   - `sareeId`: string
   - `sareeTitle`: string
   - `drapeImageUrl`: string
   - `moderationStatus`: `'approved' | 'pending' | 'flagged' | 'removed'`
   - `flagReason`: string (optional)
   - `createdAt`: ISO Date timestamp

