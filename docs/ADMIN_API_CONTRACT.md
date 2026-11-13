# Tripuraa Sangrahah — Admin API Specification & Contract

## Overview
This document specifies the standard RESTful contract between the **Tripuraa Sangrahah Admin Panel** and the backend services. The frontend UI utilizes typed service adapters (`src/services/*`) backed by an in-memory mock repository by default (`VITE_USE_MOCK=true`). When toggled to `VITE_USE_MOCK=false`, all service modules issue standard HTTP fetch requests to `VITE_API_BASE_URL` adhering strictly to this contract.

---

## 1. Global Conventions

### Base URL
* Default development: `http://localhost:5000`
* Prefix: `/api/v1` or `/admin` as routed below.

### Headers
* `Content-Type: application/json`
* `Authorization: Bearer <in_memory_access_token>`

### Standard Success Response Envelope
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful",
  "meta": {
    "total": 48,
    "page": 1,
    "limit": 10
  }
}
```

### Standard Error Envelope
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Saree with ID 'saree-99' was not found.",
    "details": []
  }
}
```

---

## 2. Authentication & Admin Session

### `POST /api/v1/admin/auth/login`
Authenticates an administrator and returns an ephemeral access token with staff profile and RBAC role.
* **Request Body**:
  ```json
  {
    "email": "admin@tripuraa.in",
    "password": "Password@123"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "token": "eyJh...jwt_token",
      "user": {
        "id": "adm-01",
        "name": "Maharani Gayatri",
        "email": "admin@tripuraa.in",
        "role": "super-admin",
        "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
      }
    }
  }
  ```

### `POST /api/v1/admin/auth/forgot-password`
* **Request Body**: `{ "email": "admin@tripuraa.in" }`
* **Response (200 OK)**: `{ "success": true, "message": "Password reset instructions dispatched." }`

---

## 3. Dashboard Statistics

### `GET /admin/dashboard/stats`
Aggregated high-level metrics, inventory warnings, and recent activity.
* **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "counts": {
        "totalUsers": 1284,
        "totalSarees": 48,
        "openEnquiries": 14,
        "savedLooks": 342,
        "lowStockCount": 3
      },
      "trends": {
        "monthlyEnquiries": [
          { "month": "Jun", "enquiries": 42, "conversions": 28 },
          { "month": "Jul", "enquiries": 58, "conversions": 41 },
          { "month": "Aug", "enquiries": 74, "conversions": 52 },
          { "month": "Sep", "enquiries": 65, "conversions": 48 },
          { "month": "Oct", "enquiries": 92, "conversions": 68 },
          { "month": "Nov", "enquiries": 118, "conversions": 84 }
        ],
        "categoryBreakdown": [
          { "category": "Kanchipuram", "count": 18, "value": 520000 },
          { "category": "Banarasi Katan", "count": 12, "value": 440000 },
          { "category": "Bridal Trousseau", "count": 8, "value": 390000 },
          { "category": "Tissue Organza", "count": 6, "value": 240000 },
          { "category": "Paithani", "count": 4, "value": 150000 }
        ]
      },
      "recentEnquiries": [ ... ],
      "lowStockSarees": [ ... ]
    }
  }
  ```

---

## 4. Saree Catalog Management

### `GET /admin/sarees`
Searchable, filterable, sortable, paginated saree listing.
* **Query Parameters**:
  * `search` (string): Search in title, brand, weave, origin
  * `category` (string): e.g. `sarees`, `katan`, `bridal`, `tissue`, `paithani`
  * `stock` (string): `in_stock`, `low_stock`, `out_of_stock`
  * `status` (string): `all`, `active`, `inactive`
  * `sortBy` (string): `price_asc`, `price_desc`, `newest`, `title_asc`
  * `page` (number): 1-indexed (default `1`)
  * `limit` (number): items per page (default `10`)

### `GET /admin/sarees/:id`
Retrieves full details of an individual saree.

### `POST /admin/sarees`
Creates a new luxury saree.
* **Request Body**:
  ```json
  {
    "title": "Ratna Prabha Gold Kanchipuram Pure Zari",
    "brand": "Tripuraa Heritage",
    "slug": "ratna-prabha-gold-kanchipuram",
    "category": "sarees",
    "numericPrice": 38500,
    "numericMrp": 44000,
    "weave": "Kanchipuram Korvai Pitloom",
    "fabric": "Pure Mulberry Silk",
    "zari": "Certified Pure Gold Zari",
    "origin": "Kanchipuram, Tamil Nadu",
    "colorTheme": "gold",
    "description": "Authentic ceremonial wedding weave featuring peacock and chakra korvai borders...",
    "stock": "1 Heritage Weave Left",
    "stockQuantity": 1,
    "images": [
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=900"
    ],
    "image": "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=900",
    "tryOnImage": "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=900",
    "isFeatured": true,
    "isActive": true
  }
  ```

### `PUT /admin/sarees/:id`
Updates an existing saree listing.

### `DELETE /admin/sarees/:id`
Deletes or archives a saree.

### `POST /admin/sarees/bulk`
Performs batch operations on selected IDs.
* **Request Body**:
  ```json
  {
    "ids": ["saree-1", "saree-2"],
    "action": "activate" | "deactivate" | "feature" | "unfeature" | "delete"
  }
  ```

### `POST /admin/sarees/:id/duplicate`
Clones an existing saree with `-copy` suffix for rapid cataloging.

---

## 5. Category Management

### `GET /admin/categories`
Lists all category story nodes with cover imagery and order.

### `POST /admin/categories`
Creates a new collection category.

### `PUT /admin/categories/:id`
Updates category label, cover image, or active toggle.

### `PUT /admin/categories/reorder`
* **Request Body**:
  ```json
  {
    "order": ["all", "sarees", "katan", "bridal", "tissue", "paithani"]
  }
  ```

---

## 6. Enquiries & Bespoke Orders

### `GET /admin/enquiries`
Query params: `status`, `search`, `page`, `limit`.

### `PUT /admin/enquiries/:id/status`
* **Request Body**:
  ```json
  {
    "status": "contacted" | "confirmed" | "closed" | "cancelled"
  }
  ```

### `POST /admin/enquiries/:id/notes`
* **Request Body**:
  ```json
  {
    "text": "Called client. Scheduled Jubilee Hills studio viewing for Saturday 4 PM."
  }
  ```

### `GET /admin/enquiries/export`
Returns CSV stream with columns: ID, Customer Name, Phone, Email, Saree, Price, Status, Channel, Date.

---

## 7. Customer & User Management

### `GET /admin/users`
Query params: `search`, `role`, `status`, `page`, `limit`.

### `GET /admin/users/:id`
Returns user profile, wishlisted saree references, saved try-on looks, and past enquiries.

### `PUT /admin/users/:id/block`
* **Request Body**: `{ "isBlocked": true, "reason": "Chargeback dispute pending" }`

### `PUT /admin/users/:id/role` (Super Admin Only)
* **Request Body**: `{ "role": "catalog-manager" | "support-agent" | "customer" }`

---

## 8. FASHN.ai Virtual Try-On Pipeline

### `GET /admin/fashn/logs`
Returns telemetry for all virtual try-on generations.
* **Query Parameters**:
  - `search`: Filter by Saree title or customer user ID
  - `status`: `all` | `completed` | `in_progress` | `failed`
  - `page`: Page index (default: 1)
  - `limit`: Page size (default: 8)
* **Response**:
  ```json
  {
    "success": true,
    "data": {
      "items": [
        {
          "id": "run-fashn-101",
          "sareeId": "saree-1",
          "sareeTitle": "Kanchipuram Pure Zari Silk Saree",
          "userPortrait": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500",
          "productGarment": "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=900",
          "outputImage": "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=900",
          "status": "completed",
          "model": "tryon-max",
          "durationMs": 4820,
          "nsfwDetected": false,
          "createdAt": "2026-11-09T14:22:00Z"
        }
      ],
      "stats": {
        "totalRuns": 1248,
        "successRate": "98.4%",
        "avgLatency": "4.8s",
        "quotaUsed": 842,
        "quotaTotal": 1000
      },
      "total": 1248,
      "page": 1,
      "totalPages": 156
    }
  }
  ```

### `GET /admin/fashn/config`
Fetches current FASHN.ai API configuration and safety defaults.

### `PUT /admin/fashn/config`
Updates FASHN.ai credentials and model parameters.
* **Request Body**:
  ```json
  {
    "apiKey": "fa-live-********************",
    "model": "tryon-max" | "tryon-v1.6",
    "category": "one-pieces" | "tops" | "bottoms",
    "mode": "quality" | "performance",
    "nsfwFilter": true
  }
  ```

### `POST /admin/fashn/run-test`
Executes an interactive test drape sandbox run.
* **Request Body**:
  ```json
  {
    "sareeId": "saree-1",
    "sareeTitle": "Kanchipuram Pure Zari Silk Saree",
    "productImage": "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=900",
    "modelImage": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500"
  }
  ```

---

## 9. Content Studio

### `GET /admin/content/hero` & `PUT /admin/content/hero`
Hero video metadata: URL, title, subtitle, poster image, isActive.

### `GET /admin/content/store` & `PUT /admin/content/store`
Store details: name, address lines, landmark, timings, latitude, longitude, mapsQuery.

### `GET /admin/content/support` & `PUT /admin/content/support`
Channels array: WhatsApp, Instagram, Helpline phone, display label, order.

### `GET /admin/content/faq` & `PUT /admin/content/faq`
CRUD & reordering of FAQs: id, question, answer, category.

### `GET /admin/content/legal/:type` & `PUT /admin/content/legal/:type`
Type: `terms` or `policy`. Sections array with title and markdown content.

---

## 10. System Configuration

### `GET /admin/system-config` & `PUT /admin/system-config`
* **Schema**:
  ```json
  {
    "minAppVersion": "1.2.0",
    "forceUpdate": false,
    "maintenanceMode": false,
    "featureFlags": {
      "enableTryOn": true,
      "enableBespokeConcierge": true,
      "enableInternationalShipping": false
    }
  }
  ```

---

## 11. Immutable Audit Logs

### `GET /admin/audit-logs`
Query params: `actorId`, `resource`, `action`, `startDate`, `endDate`, `page`, `limit`.
* **Record Schema**:
  ```json
  {
    "id": "log-5821",
    "actor": {
      "id": "adm-01",
      "name": "Maharani Gayatri",
      "role": "super-admin"
    },
    "action": "UPDATE_PRICE",
    "resource": "saree-1",
    "description": "Updated price of Swarna Kanchipuram from ₹26,500 to ₹28,500",
    "ipAddress": "103.21.144.12",
    "timestamp": "2026-11-09T11:42:00Z"
  }
  ```

