# Smart Inventory v3 — UI Architecture Rules

## Navigation System (Enforced in DashboardLayout)

| Device | Breakpoint | Navigation | Visible Elements |
|--------|-----------|------------|------------------|
| Desktop | ≥769px | Sidebar + Topbar | Sidebar (fixed left), Topbar (search + avatar) |
| Mobile | <769px | BottomNav only | BottomNav (3 tabs + More menu) |

**Rules:**
- Sidebar is **conditionally rendered** (not CSS-hidden) on desktop. It is NOT in the DOM on mobile.
- BottomNav is **conditionally rendered** on mobile. It is NOT in the DOM on desktop.
- Topbar provides search (Ctrl+K) and user menu on both devices.
- CommandPalette provides **quick actions only** — never navigation routes.

**Enforcement:** `DashboardLayout.jsx` uses `useMediaQuery('(min-width: 769px)')` to toggle `<Sidebar>` and `<BottomNav>`.

## Auth Pages

All auth pages (login, signup, forgot-password, reset-password) **MUST** use the shared `<AuthLayout>` wrapper:
- Gradient background with dual glow blobs (consistent with landing page)
- Centered branded card with `auth-card` / `auth-form` classes
- Form fields use the standard `.input-field` component classes

**No auth page** should define its own layout, container, or background.

## Layout Ownership

| Concern | Owner | File |
|---------|-------|------|
| Root wrapping | `App.jsx` | AuthProvider → OnboardingProvider → Routes |
| Dashboard shell | `DashboardLayout.jsx` | Sidebar, Topbar, BottomNav, CommandPalette |
| Auth page shell | `AuthLayout.jsx` | Gradient bg, brand card, form container |
| Page-level | Each page component | Content only — no layout/wrappers |

## Route Architecture

```
/                        → LandingPage (public)
/login                   → LoginPage (public, redirects if authed)
/signup                  → SignupPage (public, redirects if authed)
/forgot-password         → ForgotPasswordPage (public, redirects if authed)
/reset-password/:token   → ResetPasswordPage (public, redirects if authed)
/dashboard               → ProtectedRoute → DashboardLayout
  /dashboard             → DashboardPage
  /dashboard/products    → ProductsPage
  /dashboard/sales       → SalesPage
  /dashboard/insights    → InsightsPage
  /dashboard/activities  → ActivityLogPage
  /dashboard/reports     → ReportsPage
  /dashboard/settings    → SettingsPage
  /dashboard/users       → UserManagementPage (owner only)
  /dashboard/*           → NotFoundPage
*                        → redirect to /
```

## Component Hierarchy (Dashboard)

```
<AuthProvider>
  <OnboardingProvider>
    <Routes>
      <ProtectedRoute>
        <DashboardLayout>
          <Sidebar />              ← desktop only
          <Topbar />
          <main>                   ← <Outlet />
            <DashboardPage />      ← or ProductsPage, etc.
          </main>
          <BottomNav />            ← mobile only
        </DashboardLayout>
        <CommandPalette />         ← overlay, triggered by Ctrl+K
      </ProtectedRoute>
    </Routes>
    <OnboardingWizard />           ← overlay for owner onboarding
  </OnboardingProvider>
</AuthProvider>
```

## Role-Based Visibility

| Route | Owner | Manager | Cashier |
|-------|-------|---------|---------|
| Dashboard | Full stats + onboarding | Full stats | Simplified (3 stat cards) |
| Products | Full | Full | Full |
| Sales | Full | Full | Full |
| Insights | Full | Full | Hidden |
| Activities | Full | Full | Hidden |
| Reports | Full | Full | Full |
| Settings | Full | Full | Full |
| Users | Full | Hidden | Hidden |

## Key Restrictions

1. **Do NOT** add navigation routes to CommandPalette — it is for quick actions only.
2. **Do NOT** add hamburger menus, slide-out drawers, or overlay navigation on any device.
3. **Do NOT** create new layout wrapper components — use AuthLayout or DashboardLayout.
4. **Do NOT** modify backend files or API contracts from the frontend layer.
5. **Do NOT** add duplicate entry points for the same feature (e.g., two "Settings" links in the same view).
