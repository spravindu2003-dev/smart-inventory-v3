# Smart Inventory v3 — Comprehensive Technical Report

**Project:** Smart Inventory and Sales Data Management System  
**Author:** SP Ravindu  
**Repository:** `github.com/spravindu2003-dev/smart-inventory-v3`  
**Development Period:** June 22–27, 2026  
**Tag History:** `v1` → `v1.0-stable` → `v1-production-ready` → `v1.1-stable-ui` → `v1.2-stable-arch`  
**Current HEAD:** `1792f22` (main) — Merge pull request #1  

---

## 1. Project Overview & Objectives

### 1.1 Scope

Smart Inventory v3 is a full-stack web application for small-to-medium businesses to manage inventory, track sales, monitor business intelligence, and control user access. It serves as a capstone project demonstrating production-grade software engineering practices including:

- Role-based access control (RBAC) with three distinct permission tiers
- RESTful API design with comprehensive validation and error handling
- Transactional data integrity for sales and inventory operations
- Real-time cross-page event synchronization without WebSocket infrastructure
- Responsive mobile-first UI with device-specific navigation paradigms
- Serverless PostgreSQL persistence via Neon with Prisma ORM
- Cloudflare Tunnel integration for ephemeral backend exposure to Vercel-deployed frontend

### 1.2 Core Capabilities

- **Inventory Management:** Create, read, update, soft-remove (with reason), and filter products with stock tracking and expiry monitoring
- **Sales Processing:** Create, edit, and undo sales with transactional stock adjustments; cart-based sale creation with product search
- **User Administration:** Owner-only CRUD with role assignment, status toggling, and soft deletion
- **Business Intelligence:** Dashboard summaries, trend reports (revenue, sales, top products), stock distribution analysis, activity distribution
- **Activity Audit Trail:** Full action logging with search, date-range filtering, action-type filtering, and 10-second polling
- **Onboarding Flow:** 5-step guided wizard for new business owners with first-product and first-sale creation
- **Password Recovery:** Forgot/reset password flow with SHA256-hashed tokens and 15-minute expiry

---

## 2. Technology Stack

### 2.1 Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | ^18.2.0 | UI framework (functional components, hooks) |
| **React Router DOM** | ^6.20.0 | Client-side routing with nested routes, `<Outlet>`, `<NavLink>` |
| **Vite** | ^5.0.0 | Build tool and dev server (HMR, ES modules) |
| **@vitejs/plugin-react** | ^4.2.0 | React Fast Refresh, JSX transform |
| **Axios** | ^1.18.0 | HTTP client with interceptors (auth header injection, 401 handling) |
| **Recharts** | ^2.15.0 | Charting library (Line, Bar, Pie charts for reports) |
| **react-hot-toast** | ^2.6.0 | Toast notification system |

### 2.2 Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | — | JavaScript runtime |
| **Express** | ^4.18.2 | HTTP server and routing framework |
| **Prisma** | ^5.0.0 | ORM with schema management, migrations, and type-safe client |
| **PostgreSQL** | — | Database (Neon serverless) |
| **jsonwebtoken** | ^9.0.2 | JWT generation and verification (7-day expiry) |
| **bcryptjs** | ^2.4.3 | Password hashing (12 salt rounds) |
| **express-validator** | ^7.0.1 | Request body validation and sanitization |
| **express-rate-limit** | ^8.5.2 | Rate limiting (login: 8 req/min/IP) |
| **helmet** | ^7.1.0 | Security HTTP headers |
| **cors** | ^2.8.5 | Cross-Origin Resource Sharing with dynamic origin validation |
| **morgan** | ^1.10.0 | HTTP request logging |
| **nodemailer** | ^9.0.1 | Email transport (SMTP, currently logs to console in dev) |
| **dotenv** | ^16.3.1 | Environment variable loading |

### 2.3 Infrastructure

| Service | Purpose | Details |
|---------|---------|---------|
| **Neon (PostgreSQL)** | Database | Serverless PostgreSQL, AWS ap-southeast-1, SSL required |
| **Cloudflare Tunnel** | Backend exposure | Ephemeral tunnel URL for production API access |
| **Vercel** | Frontend hosting | SPA with rewrites to `index.html` |
| **GitHub** | Source control | All branches and tags mirrored |

---

## 3. Architecture & Design Pattern

### 3.1 Overall Structure

The project follows a **monorepo** layout:

```
smart-inventory-v3/
├── backend/                  # Express API server
│   ├── src/
│   │   ├── index.js          # Entry point
│   │   ├── app.js            # Express app configuration
│   │   ├── config/env.js     # Environment configuration
│   │   ├── middleware/        # auth, errorHandler
│   │   ├── controllers/      # 7 controllers (auth, user, product, sale, activity, insight, report)
│   │   ├── routes/           # 7 route modules
│   │   └── utils/            # AppError, asyncHandler, activityLogger, mail, prisma
│   └── prisma/               # Schema, migrations, seed
├── frontend/                 # React SPA
│   ├── src/
│   │   ├── main.jsx          # Entry point
│   │   ├── App.jsx           # Root component + routing
│   │   ├── context/          # AuthContext, OnboardingContext
│   │   ├── components/       # Layout, navigation, onboarding, UI library
│   │   ├── pages/            # 14 page components
│   │   ├── api/              # Axios client + 9 API modules
│   │   ├── hooks/            # useFetch, useMediaQuery
│   │   ├── utils/            # eventBus (EventTarget pub/sub)
│   │   └── styles/           # index.css (2839 lines, design tokens)
│   └── dist/                 # Build output (gitignored)
└── docs/                     # Architecture rules, technical report
```

### 3.2 Layer Separation (Backend)

```
HTTP Request
  → helmet / morgan / cors / express.json
    → Route (method + path matching)
      → Middleware chain (authenticate → authorize → validate)
        → Controller (business logic)
          → Prisma Client (database queries)
            → PostgreSQL (Neon)
          ← Prisma response
        ← Controller response (res.json)
      ← Middleware chain
    ← Auto success wrapper (2xx only)
  ← Global error handler (Prisma/JWT/generic errors)
→ HTTP Response
```

### 3.3 Layer Separation (Frontend)

```
Browser
  → React Router (path matching)
    → ProtectedRoute (auth guard + 300ms shield)
      → DashboardLayout (responsive nav shell)
        → Page component (data fetching + business logic)
          → API module (Axios call)
            → Request interceptor (Bearer token)
              → Backend API
            ← Response interceptor (401 redirect)
          ← API response
        ← Page renders via JSX
      ← Layout renders via Outlet
    ← Context updates (AuthContext, OnboardingContext)
  ← Event bus cross-page updates
→ DOM
```

### 3.4 State Management

The application does not use a global state library (Redux, Zustand). Instead, it uses:

1. **React Context** for two shared concerns:
   - `AuthContext`: Manages `user` object and `loading` state. On mount, checks `localStorage` for token; if present, calls `GET /api/auth/me` with a 15-second AbortController timeout. Provides `login(email, password)` and `logout()` actions.
   - `OnboardingContext`: Manages a 5-step onboarding wizard state persisted to `localStorage('onboarding_state')`. Provides step navigation, progress tracking, and completion flags. Only active for `owner` role.

2. **Event Bus (`utils/eventBus.js`)**: A lightweight pub/sub system built on the native `EventTarget` API. Events emitted include `PRODUCT_UPDATED`, `SALE_UPDATED`, `ACTIVITY_UPDATED`, and `DASHBOARD_REFRESH`. Pages subscribe to relevant events on mount and refetch data when notified. This avoids the complexity of WebSockets while keeping cross-page state synchronized.

3. **Local Component State**: All page-level data fetching uses the custom `useFetch` hook, which manages `loading` and `error` states and supports abort controller-based cancellation on unmount or re-fetch.

### 3.5 Routing Architecture

```
<AuthProvider>
  <Toaster />
  <OnboardingProvider>
    <BrowserRouter>
      <Routes>
        ── PUBLIC ──────────────────────────────
        /                        → LandingPage
        /login                   → LoginPage          [redirect if authed]
        /signup                  → SignupPage         [redirect if authed]
        /forgot-password         → ForgotPasswordPage [redirect if authed]
        /reset-password/:token   → ResetPasswordPage  [redirect if authed]

        ── PROTECTED ────────────────────────────
        /dashboard/*             → ProtectedRoute
                                   → DashboardLayout
                                     ├── Sidebar (desktop only)
                                     ├── Topbar (always)
                                     ├── <Outlet>
                                     │   ├── /dashboard           → DashboardPage
                                     │   ├── /dashboard/products  → ProductsPage
                                     │   ├── /dashboard/sales     → SalesPage
                                     │   ├── /dashboard/insights  → InsightsPage
                                     │   ├── /dashboard/activities → ActivityLogPage
                                     │   ├── /dashboard/reports   → ReportsPage
                                     │   ├── /dashboard/settings  → SettingsPage
                                     │   ├── /dashboard/users     → UserManagementPage [owner only]
                                     │   └── /dashboard/*        → NotFoundPage
                                     └── BottomNav (mobile only)
        ── CATCH ALL ────────────────────────────
        *                        → Navigate to /
      </Routes>
      <OnboardingWizard />  <!-- overlay when active -->
    </BrowserRouter>
  </OnboardingProvider>
</AuthProvider>
```

### 3.6 Navigation System

The application enforces a strict device-specific navigation architecture via the `useMediaQuery` hook (breakpoint: 769px):

| Device | Breakpoint | Navigation | Unused Components | DOM Status |
|--------|-----------|------------|-------------------|------------|
| Desktop | ≥769px | Sidebar (fixed left, 240px) + Topbar | BottomNav | Not rendered |
| Mobile | <769px | Topbar + BottomNav (3 tabs + More) | Sidebar | Not rendered |

The `CommandPalette` (Ctrl+K) provides **quick actions only** (Add Product, Create Sale, View Insights, Open Reports) — it does not duplicate navigation routes.

---

## 4. Database Architecture

### 4.1 Entity-Relationship Diagram

```
  ┌──────────┐          ┌──────────┐
  │   User   │          │ Product  │
  ├──────────┤          ├──────────┤
  │ id (PK)  │─┐        │ id (PK)  │─┐
  │ username │ │        │ sku (UQ) │ │
  │ email    │ │        │ name     │ │
  │ password │ │        │ price    │ │
  │ role     │ │        │ stock    │ │
  │ isActive │ │        │ category │ │
  │ deletedAt│ │        │ expiryDate│ │
  │ createdAt│ │        │ removalRsn│ │
  │ updatedAt│ │        │ removedAt│ │
  └──────────┘ │        └──────────┘ │
               │                     │
    ┌──────────┘    ┌────────────────┘
    ▼               ▼
  ┌──────────────────────┐     ┌──────────────┐
  │       Sale           │     │   SaleItem   │
  ├──────────────────────┤     ├──────────────┤
  │ id (PK)      │       │     │ id (PK)      │
  │ total        │       │     │ saleId (FK)  │──┘
  │ userId (FK)  │──┐    │     │ productId(FK)│──┘
  │ createdAt    │  │    │     │ quantity     │
  │ updatedAt    │  │    │     │ unitPrice    │
  └──────────────┘  │    │     │ subtotal     │
                    │    │     │ userId (FK)  │──┐
  ┌──────────────┐  │    │     └──────────────┘  │
  │ ActivityLog  │  │    │                        │
  ├──────────────┤  │    │                        │
  │ id (PK)      │  │    │                        │
  │ action       │  │    │                        │
  │ entity       │  │    │                        │
  │ entityId     │  │    │                        │
  │ description  │  │    │                        │
  │ userId (FK)  │──┘    └────────────────────────┘
  │ createdAt    │
  └──────────────┘

Key: (PK) = Primary Key, (FK) = Foreign Key, (UQ) = Unique
```

### 4.2 Table Specifications

#### `User`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `Int` (serial) | PK, autoincrement | — |
| `username` | `String` | NOT NULL, UNIQUE | Login identifier |
| `email` | `String` | NOT NULL, UNIQUE | Contact + password reset |
| `password` | `String` | NOT NULL | bcrypt hash, 12 rounds |
| `firstName` | `String?` | nullable | Display name component |
| `lastName` | `String?` | nullable | Display name component |
| `role` | `Role` (enum) | NOT NULL, default `cashier` | `owner`, `manager`, `cashier` |
| `isActive` | `Boolean` | NOT NULL, default `true` | Account disable flag |
| `deletedAt` | `DateTime?` | nullable | Soft delete timestamp |
| `resetToken` | `String?` | nullable | SHA256 hash of reset token |
| `resetTokenExpiry` | `DateTime?` | nullable | 15-minute expiry |
| `createdAt` | `DateTime` | NOT NULL, default `now()` | — |
| `updatedAt` | `DateTime` | NOT NULL, auto-update | — |

#### `Product`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `Int` (serial) | PK, autoincrement | — |
| `name` | `String` | NOT NULL | Product display name |
| `description` | `String?` | nullable | Product details |
| `price` | `Decimal(10,2)` | NOT NULL | Monetary precision |
| `stock` | `Int` | NOT NULL, default `0` | Current inventory count |
| `sku` | `String` | NOT NULL, UNIQUE | Stock-keeping unit |
| `category` | `String?` | nullable | Product grouping |
| `expiryDate` | `DateTime?` | nullable | Added in migration 2 |
| `removalReason` | `RemovalReason?` (enum) | nullable | `expired`, `damaged`, `low_demand` |
| `removedAt` | `DateTime?` | nullable | Soft-removal timestamp |
| `createdAt` | `DateTime` | NOT NULL, default `now()` | — |
| `updatedAt` | `DateTime` | NOT NULL, auto-update | — |

#### `Sale`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `Int` (serial) | PK, autoincrement | — |
| `total` | `Decimal(12,2)` | NOT NULL | Computed at creation |
| `userId` | `Int` | NOT NULL, FK → `User.id` | (RESTRICT delete, CASCADE update) |
| `createdAt` | `DateTime` | NOT NULL, default `now()` | — |
| `updatedAt` | `DateTime` | NOT NULL, auto-update | — |

#### `SaleItem`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `Int` (serial) | PK, autoincrement | — |
| `saleId` | `Int` | NOT NULL, FK → `Sale.id` | (CASCADE delete, CASCADE update) |
| `productId` | `Int` | NOT NULL, FK → `Product.id` | (RESTRICT delete, CASCADE update) |
| `quantity` | `Int` | NOT NULL | Units sold |
| `unitPrice` | `Decimal(10,2)` | NOT NULL | Price snapshot at sale time |
| `subtotal` | `Decimal(12,2)` | NOT NULL | quantity × unitPrice |
| `userId` | `Int` | NOT NULL, FK → `User.id` | (RESTRICT delete, CASCADE update) |

**Composite Unique:** `@@unique([saleId, productId])` — prevents duplicate product entries per sale.

#### `ActivityLog`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `Int` (serial) | PK, autoincrement | — |
| `action` | `String` | NOT NULL | e.g., `LOGIN_SUCCESS`, `SALE_CREATED` |
| `entity` | `String?` | nullable | `User`, `Product`, `Sale` |
| `entityId` | `Int?` | nullable | ID of related entity |
| `description` | `String?` | nullable | Human-readable detail |
| `userId` | `Int` | NOT NULL, FK → `User.id` | (RESTRICT delete, CASCADE update) |
| `createdAt` | `DateTime` | NOT NULL, default `now()` | — |

### 4.3 Normalization Assessment (3NF)

- **1NF:** Achieved — all columns are atomic; each table has a primary key.
- **2NF:** Achieved — no partial dependencies; all tables have single-column primary keys except SaleItem where the composite key `(saleId, productId)` is functionally complete.
- **3NF:** Achieved — no transitive dependencies. All non-key attributes depend solely on their primary key. The only intentional denormalization is `SaleItem.unitPrice`, which stores a price snapshot at sale time for historical accuracy — this is a standard transactional data pattern, not a normalization violation.

### 4.4 Foreign Key Integrity Rules

| FK | On Delete | On Update | Rationale |
|----|-----------|-----------|-----------|
| `Sale.userId → User.id` | RESTRICT | CASCADE | Prevent orphan sales |
| `SaleItem.saleId → Sale.id` | CASCADE | CASCADE | Items deleted with sale |
| `SaleItem.productId → Product.id` | RESTRICT | CASCADE | Prevent removal of sold products |
| `SaleItem.userId → User.id` | RESTRICT | CASCADE | Audit trail integrity |
| `ActivityLog.userId → User.id` | RESTRICT | CASCADE | Audit trail integrity |

### 4.5 Database Transactions

Sale operations (create, update, undo) are wrapped in Prisma `$transaction` to guarantee atomicity:

- **Creating a sale:** Creates Sale row + SaleItem rows + decrements each Product's stock in a single transaction.
- **Updating a sale:** Reads existing items, restores old stock quantities, validates new stock against deltas, deletes old SaleItems, creates new ones, updates stock — all in one transaction.
- **Undoing a sale:** Restores product stock for each item, deletes all SaleItems, deletes the Sale — atomic.

---

## 5. Component Breakdown

### 5.1 Authentication Module

**Frontend:** `LoginPage`, `SignupPage`, `ForgotPasswordPage`, `ResetPasswordPage` — all wrapped in `AuthLayout`.  
**Backend:** `authRoutes.js` + `authController.js`.

| Endpoint | Method | Auth | Rate-Limited | Purpose |
|----------|--------|------|-------------|---------|
| `/api/auth/register` | POST | Owner only | No | Create owner account |
| `/api/auth/login` | POST | None | Yes (8/min) | Authenticate, return JWT |
| `/api/auth/me` | GET | Required | No | Get current user profile |
| `/api/auth/change-password` | PUT | Required | No | Change password (requires current) |
| `/api/auth/forgot-password` | POST | None | No | Send reset token email |
| `/api/auth/reset-password/:token` | POST | None | No | Complete password reset |

**Key security details:**
- JWT payload: `{ id, username, email, role }` — 7-day expiry
- Token stored in `localStorage`, injected via Axios request interceptor
- Password reset uses 256-bit random token → SHA256 hash stored in DB (raw token never persisted)
- Reset token expiry: 15 minutes
- Forgot password returns generic message regardless of email existence (prevents enumeration)
- Inactive accounts cannot log in (403 on login attempt)

### 5.2 User Management Module

**Frontend:** `UserManagementPage` — owner-only route with `<ProtectedRoute roles={['owner']}>`.  
**Backend:** `userRoutes.js` + `userController.js`.

| Endpoint | Method | Auth | Role | Purpose |
|----------|--------|------|------|---------|
| `/api/users/me` | GET | Required | Any | Get own profile |
| `/api/users/me` | PUT | Required | Any | Update own profile |
| `/api/users` | GET | Required | Owner | Paginated user list |
| `/api/users` | POST | Required | Owner | Create user (manager/cashier) |
| `/api/users/:id` | PUT | Required | Owner | Update user |
| `/api/users/:id/status` | PATCH | Required | Owner | Toggle active/inactive |
| `/api/users/:id` | DELETE | Required | Owner | Soft delete user |

**Key details:**
- Owner-only: Users cannot create/edit/delete other owners
- Self-deletion prevention: Users cannot deactivate or delete their own account
- Soft delete: Sets `deletedAt` timestamp and `isActive=false`
- Role constraint on creation: Only `manager` or `cashier` can be assigned (owner created via registration)
- Client-side validation: Real-time field validation with field-level error mapping from server

### 5.3 Inventory Module

**Frontend:** `ProductsPage` — full CRUD with All/Active/Removed filter tabs.  
**Backend:** `productRoutes.js` + `productController.js`.

| Endpoint | Method | Auth | Role | Purpose |
|----------|--------|------|------|---------|
| `/api/products` | GET | Required | Any | List all products |
| `/api/products/:id` | GET | Required | Any | Get single product |
| `/api/products` | POST | Required | Owner/Manager | Create product |
| `/api/products/:id` | PUT | Required | Owner/Manager | Update product |
| `/api/products/:id` | DELETE | Required | Owner/Manager | Hard delete product |
| `/api/products/:id/remove` | PATCH | Required | Owner/Manager | Soft remove with reason |

**Key details:**
- Stock levels color-coded in UI: 0 = danger red, ≤10 = warning amber, >10 = ok green
- Expiry dates shown with warning badge if expired
- Soft removal (PATCH) sets stock=0, records reason (`expired`/`damaged`/`low_demand`) and timestamp — product remains in DB for historical reporting
- Cashier role has view-only access (no create/edit/delete actions rendered)

### 5.4 Sales Module

**Frontend:** `SalesPage` — cart-based sale creation, edit with quantity adjustment, undo with confirmation.  
**Backend:** `saleRoutes.js` + `saleController.js`.

| Endpoint | Method | Auth | Role | Purpose |
|----------|--------|------|------|---------|
| `/api/sales` | POST | Required | Any | Create sale (transactional) |
| `/api/sales` | GET | Required | Any | List sales (paginated) |
| `/api/sales/:id` | GET | Required | Any | Get single sale with items |
| `/api/sales/:id` | PUT | Required | Any | Update sale items (transactional) |
| `/api/sales/:id/undo` | POST | Required | Any | Reverse sale (transactional) |

**Key details:**
- All mutations use Prisma `$transaction` for ACID compliance
- Stock validation: checked before creation, adjusted on edit (restore old + apply new), restored on undo
- Cart-based UI: product selector + quantity input + dynamic subtotal
- Edit mode: displays existing items with editable quantities, validates stock deltas

### 5.5 Business Intelligence Module

**Frontend:** `DashboardPage`, `InsightsPage`, `ReportsPage`.  
**Backend:** `insightsRoutes.js`/`insightsController.js`, `reportsRoutes.js`/`reportsController.js`, `activityRoutes.js`/`activityController.js`.

#### Dashboard Summary (`GET /api/insights/summary`)
Returns aggregated data: total products, total stock, low stock (≤10), dead stock (no sales), activities today, total revenue, total sales, total units sold, top 5 products, 10 recent sales, plus prioritized alerts (low stock 1–10, out of stock 0, expired).

#### Reports (7 endpoints)
| Endpoint | Returns | Format |
|----------|---------|--------|
| `GET /reports/sales-trend?days=N` | Daily sales counts | `[{date, count}]` |
| `GET /reports/revenue-trend?days=N` | Daily revenue sums | `[{date, revenue}]` |
| `GET /reports/top-products` | Products sorted by total sold | Paginated |
| `GET /reports/stock-distribution` | Stock status counts | `{inStock, lowStock, outOfStock, expired}` |
| `GET /reports/category-distribution` | Products per category | `[{category, count}]` |
| `GET /reports/quick-insights` | Best seller, low stock alerts, expired count, avg sale value, revenue trend direction | Composite |
| `GET /reports/activity-distribution` | Action frequency counts | `[{action, count}]` sorted desc |

**Frontend visualization:** Recharts library — Line chart (revenue), Bar chart (sales), horizontal Bar (top products), Pie/Donut (category, stock, activity distribution), Quick Insights grid cards.

### 5.6 Activity Log Module

**Frontend:** `ActivityLogPage` — 10-second polling, search, filter by action/date range.  
**Backend:** `activityController.js`.

- 30+ action types with distinct badge colors (mapped in CSS at 2800+ lines)
- Summary stats: total, today, logins today, sales today
- Pagination cap: 100 items per page maximum
- Filters: search (username, action, description), action type dropdown, date range (start/end)

### 5.7 Onboarding System

**Frontend:** `OnboardingWizard` (5-step) + `OnboardingTour` (4-step) + `OnboardingContext`.

**Flow:**
1. Owner registers and logs in for the first time
2. `DashboardPage` detects `onboarding.status === 'not_started'` → shows `GuidedEmptyState` with "Set Up Your Business" CTA
3. Clicking CTA → `startOnboarding()` → `OnboardingWizard` renders as full-screen overlay
4. **Step 1 (Welcome):** Introduction with checklist of what will be configured
5. **Step 2 (Business):** Business name + category input → saved to localStorage
6. **Step 3 (Product):** Create first product (name, price, stock, SKU) → calls `POST /api/products`
7. **Step 4 (Sale):** Create first sale (select product, enter quantity) → calls `POST /api/sales`
8. **Step 5 (Tour):** Summary of completed steps → launches `OnboardingTour`
9. **Tour:** 4 tooltips (Welcome Card, Quick Stats, Recent Sales, Top Products) with scroll-to-view
10. Tour completed → `onboarding.status = 'completed'` → system enters normal operation mode

**Skip/Resume:** Users can skip the wizard at any point; they can resume later from the `GuidedEmptyState` card.

### 5.8 UI Component Library

**Primitives** (under `src/components/ui/`):

| Component | Props | Variants |
|-----------|-------|----------|
| `Button` | children, onClick, variant, size, loading, disabled, type, className | `primary`, `danger`, `ghost`; `sm`, `md`, `lg` |
| `Input` | label, name, type, value, onChange, error, placeholder, textarea | With error state |
| `Select` | label, name, value, onChange, options, error | Native select |
| `Modal` | open, onClose, title, size, children | `sm`, `md` (default) |
| `Card` | children, padding, className | Surface container |
| `Badge` | children, variant | `default`, `warn`, `danger`, `ok`, `role`, `action` |
| `StatCard` | value, label, variant | `default`, `warn`, `danger`, `success` |
| `Skeleton` | width, height, count, borderRadius | Shimmer animation |
| `EmptyState` | icon, message, children | Centered layout |

### 5.9 Design System

**CSS Custom Properties** (`:root` in `index.css`):

| Category | Tokens |
|----------|--------|
| Colors | `--color-bg`, `--color-surface`, `--color-primary`, `--color-primary-hover`, `--color-primary-light`, `--color-success`, `--color-warning`, `--color-error`, `--color-text`, `--color-text-secondary`, `--color-text-muted`, `--color-border`, `--color-muted` |
| Shadows | `--shadow-sm`, `--shadow`, `--shadow-md`, `--shadow-lg`, `--shadow-xl` |
| Radii | `--radius-sm` (6px), `--radius` (8px), `--radius-md` (10px), `--radius-lg` (12px), `--radius-xl` (16px), `--radius-full` (9999px) |
| Spacing | `--space-1` through `--space-12` (4px–48px, 8px scale) |
| Transitions | `--transition-fast` (0.15s), `--transition-normal` (0.25s), `--transition-slow` (0.35s) |
| Layout | `--sidebar-width` (240px), `--topbar-height` (56px), `--bottomnav-height` (64px) |

**Responsive breakpoints:** 480px (mobile form layout), 640px (tablet grids), 769px (desktop nav switch), 1024px (wide desktop).

---

## 6. Security Measures Implemented

### 6.1 Authentication & Authorization

| Layer | Implementation | Details |
|-------|---------------|---------|
| **Password hashing** | bcrypt, 12 rounds | Applied on register, user create, password change, password reset |
| **JWT tokens** | jsonwebtoken, 7-day expiry | Payload: `{id, username, email, role}`. Secret: 256-bit hex string |
| **Auth middleware** | `authenticate` | Extracts Bearer token, verifies with `jwt.verify`, attaches `req.user` |
| **Role middleware** | `authorize(...roles)` | Factory: checks `req.user.role` is in allowed list; returns 403 if not |
| **Frontend guard** | `ProtectedRoute` | 300ms minimum shield animation, redirect to `/` if no user, role check with redirect |
| **API client guard** | Axios 401 interceptor | Removes token from localStorage, redirects to `/login` on 401 response |

### 6.2 Rate Limiting

| Endpoint | Window | Max Requests | Response |
|----------|--------|-------------|----------|
| `POST /api/auth/login` | 60 seconds | 8 per IP | `429 Too Many Requests` |

### 6.3 Input Validation & Sanitization

- **express-validator** on all mutation endpoints
- Email normalization: `normalizeEmail()` to canonicalize email addresses
- String trimming and `notEmpty()` checks on all text fields
- Numeric range validation: `isFloat({ min: 0 })` for prices, `isInt({ min: 0 })` for stock
- Array validation: `isArray({ min: 1 })` for sale items
- Enum validation: `isIn(['manager', 'cashier'])` for role assignment

### 6.4 CORS Configuration

```
Allowed origins in production:
- http://localhost:5173, http://localhost:3000, http://127.0.0.1:5173
- *.vercel.app (any Vercel deployment)
- *.trycloudflare.com (any Cloudflare Tunnel)
- Custom comma-separated origins from CORS_ORIGIN env var
```

- Credentials enabled (allows Bearer token headers)
- In development mode: all origins accepted with console warning

### 6.5 HTTP Security Headers (Helmet)

Standard security headers applied globally:
- `X-Frame-Options: DENY` (clickjacking prevention)
- `X-Content-Type-Options: nosniff` (MIME sniffing prevention)
- `Strict-Transport-Security` (HSTS)
- `Content-Security-Policy` (default restrictions)
- `X-XSS-Protection: 0` (disables outdated XSS filter)

### 6.6 Additional Protections

- **SQL injection:** Prevented by Prisma's parameterized query interface
- **User enumeration:** Password reset returns generic success message regardless of email existence
- **Self-deletion prevention:** Users cannot deactivate or delete their own account
- **Account deactivation check:** Inactive accounts rejected at login (403)
- **Soft delete:** User records preserved with `deletedAt` flag rather than hard removal
- **Password reset token:** 256-bit random token → SHA256 hash (raw token never stored)
- **Password reset expiry:** 15-minute window
- **Error sanitization:** Global error handler translates Prisma/JWT internals into user-safe messages
- **Production error handling:** Non-operational errors return generic 500 without stack traces

---

## 7. Technical Debt & Outstanding Challenges

### 7.1 Deployment Configuration

| Issue | Severity | Details | Resolution |
|-------|----------|---------|------------|
| **Vercel env vars not set** | Critical | `VITE_API_URL` must be configured in Vercel Dashboard for production API connectivity | Set env var to Cloudflare tunnel URL |
| **Vercel project name mismatch** | Medium | Vercel project is `smart-inventory` (not `smart-inventory-v3`), serving old CRA build | Project may need re-provisioning or redeployment from `main` branch |
| **Vercel build command** | Medium | May be set to `react-scripts build` (from CRA era) instead of `vite build` | Verify in Vercel Dashboard: build command = `cd frontend && npm run build`, output = `frontend/dist` |
| **Cloudflare Tunnel ephemeral** | Medium | Tunnel URL changes each time it's restarted, requiring Vercel env var update | Consider Cloudflare Tunnel with DNS record for stable URL, or implement auto-update mechanism |
| **Missing .env.production tracking** | Low | Removed from git tracking; must be set manually in Vercel Dashboard | Acceptable — env vars in production should come from deployment platform, not committed files |
| **Backend not deployed** | High | Currently runs locally behind Cloudflare Tunnel; no permanent hosting | Deploy to Railway, Render, Fly.io, or similar for stable production URL |

### 7.2 Frontend Issues

| Issue | Severity | Location | Details |
|-------|----------|----------|---------|
| **Duplicate response helpers** | Low | `safeResponse.js` and `responseHandler.js` serve identical purposes | Consolidate into single utility file |
| **onboarding uses direct API calls** | Low | `OnboardingWizard.jsx` imports `createProduct`, `createSale` directly instead of going through a service layer | Minor refactoring opportunity |
| **Chunk size warning** | Low | Vite build: main JS bundle is 735 kB (210 kB gzip) — exceeds 500 kB recommendation | Consider code-splitting via `React.lazy()` for report charts, activity log, user management |
| **Onboarding localStorage keys** | Low | Onboarding state key is `'onboarding_state'` — potential collision | Namespace prefix: `'smart_inventory_'` |
| **CSS file size** | Low | 2839 lines in single file | Consider CSS modules or component-scoped styles for maintainability |

### 7.3 Backend Issues

| Issue | Severity | Location | Details |
|-------|----------|----------|---------|
| **SMTP not configured** | Medium | `.env` has no SMTP credentials | Password reset emails are logged to console in dev; production requires SMTP setup |
| **No refresh token** | Medium | JWT is single long-lived token (7 days) | No rotation mechanism; token cannot be revoked server-side (no blacklist) |
| **Rate limiting only on login** | Medium | No rate limiting on other endpoints | Consider rate limiting on product/sale creation and password reset |
| **No request logging in production** | Low | Morgan uses `'dev'` format | Switch to `'combined'` format with file transport in production |
| **No input rate limiting** | Low | No size limits on request bodies | Consider `express.json({ limit: '1mb' })` |
| **No database query timeout** | Low | No max query execution time | Consider `statement_timeout` in PostgreSQL connection |

### 7.4 Database Issues

| Issue | Severity | Details |
|-------|----------|---------|
| **No indexes on foreign keys** | Low | FK columns (Sale.userId, SaleItem.productId, etc.) lack explicit indexes | Prisma auto-creates indexes on FK columns for PostgreSQL, but verify with `\di` |
| **No full-text search** | Low | Product search is basic (no pg_trgm or full-text index) | Acceptable for current scale |
| **No cascade delete for users** | Low | User deletion restricted by Sale/SaleItem/ActivityLog FKs | Soft delete mitigates this — never truly deleted |

### 7.5 Architecture Concerns

| Concern | Severity | Details | Recommendation |
|---------|----------|---------|----------------|
| **Single admin setup** | Low | Only one `owner` account can be created (register endpoint is owner-only) | Consider allowing owner to invite other owners for multi-admin scenarios |
| **No pagination on product GET** | Low | `GET /api/products` returns all products without pagination | Add pagination for scalability (refer to user/sale pattern) |
| **Activity logger coupling** | Low | `activityLogger.js` is imported directly in controllers | Consider middleware-based logging for cross-cutting concern |
| **Onboarding tour DOM query** | Low | `OnboardingTour.jsx` uses `document.querySelector` to find tour targets | Use React refs passed up from DashboardPage |
| **No error boundary** | Medium | No React error boundary wrapping the application tree | Add `<ErrorBoundary>` at App level to prevent blank screens on uncaught render errors |

### 7.6 Missing Features

| Feature | Priority | Details |
|---------|----------|---------|
| **Inventory stock adjustments** | Medium | No endpoint for bulk stock adjustments (add/remove stock without sale) | Currently requires sale creation or direct DB edit |
| **Bulk product import/export** | Low | No CSV/Excel import/export for products | Common SMB requirement |
| **Dashboard date range filter** | Low | Dashboard shows all-time data | Add date range selector for time-bound views |
| **Session management** | Low | No "active sessions" view or remote logout capability | Enhancement for multi-device usage |
| **WebSocket-based real-time** | Low | EventBus uses `EventTarget` (in-memory, not cross-tab) | Consider SSE or WebSocket for cross-tab/multi-user sync |

### 7.7 Repository Health

| Item | Status | Note |
|------|--------|------|
| **Root README** | Missing | Only `backend/README.md` and `frontend/README.md` exist |
| **CI/CD pipeline** | None | No GitHub Actions, Vercel auto-deploy, or other CI configured |
| **Test coverage** | None | No unit, integration, or E2E tests in the repository |
| **TypeScript** | Not used | Entire codebase is JavaScript — no type safety |
| **Docker/containerization** | None | No Dockerfile or docker-compose.yml |
| **Linting** | Not configured | No ESLint or Prettier configuration in either frontend or backend |

---

## Appendix A: Git Branch & Tag Reference

### Tags

| Tag | Commit | Description |
|-----|--------|-------------|
| `v1` | `7b04546` | First stable release: auth + products + sales + dashboard |
| `v1.0-stable` | `b6577a4` | Pre-deployment: skeleton loading, pagination, cleanup |
| `v1-production-ready` | `917bf3c` | Production hardening: rate limiting, JWT, validation |
| `v1-stable-backup` | `8be9663` | Backup before Cloudflare deployment fix |
| `v1.1-stable-ui` | `7327829` | Product Experience: onboarding, command palette, landing page |
| `v1.2-stable-arch` | `a137c8a` | Architecture Lock: auth layout, nav separation, CSS cleanup |
| `v2-dual-mode-stable` | `c8d2b1e` | Dual-mode auth, CORS, env system, Vercel config |

### Branches

| Branch | HEAD | Purpose |
|--------|------|---------|
| `main` | `1792f22` (merge) | Primary integration branch |
| `pre-cloudflare-fix-stable` | `0200083` | Env production gitignore fix |
| `stable/ui-freeze` | `7327829` | UI freeze at v1.1-stable-ui |
| `production-stable-v1` | `917bf3c` | v1-production-hardening |
| `stable-dual-mode-auth` | `c8d2b1e` | v2-dual-mode-auth |
| `pre-deploy-stable-v1` | `b6577a4` | v1.0-stable |

---

## Appendix B: Frontend Bundle Size

| Asset | Size | Gzipped |
|-------|------|---------|
| `index.html` | 0.41 kB | 0.28 kB |
| `index.js` (Vite bundle) | 735.50 kB | 210.59 kB |
| `index.css` | 37.89 kB | 6.80 kB |
| **Total** | **773.80 kB** | **217.67 kB** |

**Bundle composition (estimated):**
- React + React DOM: ~130 kB
- React Router DOM: ~50 kB
- Axios: ~30 kB
- Recharts: ~200 kB (largest single dependency)
- Application code: ~325 kB

**Recommendation:** Implement code-splitting via `React.lazy()` for heavy pages (ReportsPage with Recharts, ActivityLogPage) to reduce initial bundle size.

---

*This report was generated on June 27, 2026, at commit `1792f22` (main). The project comprises 33 commits across 6 branches and 7 tags, developed over approximately 5 days.*
