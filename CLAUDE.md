# CLAUDE.md — SynteraWMS Frontend (Next.js 15)

## Project Overview

Warehouse Management System frontend built with Next.js 15 App Router, React 19, and TypeScript 5. Supports inbound receiving, putaway, inventory management, outbound operations, and adjustment approval workflows.

- **Dev port:** `4028`
- **API base URL:** `http://localhost:5000/api` (override via `NEXT_PUBLIC_API_URL`)
- **Backend:** `c:\Users\Administrator\WMS` (ASP.NET Core 8.0)

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 15.1.11 |
| UI Library | React | 19.0.3 |
| Language | TypeScript | 5 (strict) |
| Styling | Tailwind CSS | 3.4.6 |
| Icons | Lucide React | 1.7.0 |
| Icons (alt) | Heroicons | 2.2.0 |
| Charts | Recharts | 2.15.2 |
| Forms | React Hook Form | 7.75.0 |
| Barcode | react-barcode | 1.6.1 |

---

## Project Structure

```
src/
  app/                        → App Router pages (Next.js 15)
    layout.tsx                → Root layout (wraps all pages)
    page.tsx                  → Home = Inbound Receiving
    login/page.tsx            → Public login page
    dashboard/page.tsx        → Operations dashboard
    putaway/page.tsx          → Putaway tasks
    inventory/
      stock-on-hand/page.tsx  → SOH view
      adjustment/page.tsx     → Submit adjustment request
      adjustment-approval/    → Approve / reject adjustments
    outbound/
      picking/page.tsx
      packing/page.tsx
      dispatch/page.tsx
  components/
    AppLayout.tsx             → Main layout shell (Sidebar + content)
    Sidebar.tsx               → Nav menu (collapsible sections, search, user profile)
    ui/                       → Shared: Modal, StatusBadge, EmptyState
    AppLogo, AppImage, AppIcon
  lib/
    context/AuthContext.tsx   → Global auth state (useAuth hook)
    services/                 → Fetch-based API clients
      auth.service.ts
      receiving.service.ts
      putaway.service.ts
      inventory.service.ts
      adjustment.service.ts
  middleware.ts               → Route protection (cookie-based)
```

---

## Authentication

- **Storage:** `auth_user` in `localStorage` + `syntera_auth_token` cookie.
- **Middleware (`middleware.ts`):** Redirects to `/login` if no token cookie on protected routes.
- **Public routes:** `/login` only.
- **Context:** `AuthContext` provides `user`, `login()`, `logout()`. Access via `useAuth()`.
- **JWT claims returned from backend:** `UserId`, `Username`, `FullName`, `Role`.

```tsx
// Reading current user anywhere in client components
const { user, logout } = useAuth();
```

---

## API Service Pattern

All API calls live in `src/lib/services/`. Each service function:
1. Reads the token from `localStorage` (or cookie).
2. Calls `fetch()` with `Authorization: Bearer <token>`.
3. Returns typed data or throws on error.

```ts
// Pattern used across all services
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';

export async function getSomething(): Promise<SomeDto[]> {
  const token = localStorage.getItem('syntera_auth_token');
  const res = await fetch(`${API_BASE}/endpoint`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
```

Do **not** call `fetch()` directly in page or component files — always go through a service function.

---

## Routing (App Router)

| Route | Description |
|-------|-------------|
| `/login` | Public sign-in page |
| `/dashboard` | Dashboard with metrics and charts |
| `/` (home) | Inbound receiving |
| `/putaway` | Putaway assignment |
| `/inventory/stock-on-hand` | Stock on hand list |
| `/inventory/adjustment` | Submit adjustment request |
| `/inventory/adjustment-approval` | Approve/reject adjustments |
| `/outbound/picking` | Picking list |
| `/outbound/packing` | Packing operations |
| `/outbound/dispatch` | Dispatch management |

---

## Component Conventions

### Server vs Client Components
- **Server components** (default): `layout.tsx`, static page wrappers — no `useState`, no browser APIs.
- **Client components**: Add `'use client'` at top — for interactive pages, forms, hooks.
- Interactive feature pages should be client components. Wrap with `<AppLayout>` inside.

### Layout Shell
Every protected page renders inside `<AppLayout>`:
```tsx
'use client';
import AppLayout from '@/components/AppLayout';

export default function SomePage() {
  return (
    <AppLayout>
      {/* page content */}
    </AppLayout>
  );
}
```

### Shared UI Components
- `<Modal>` — reusable modal dialog
- `<StatusBadge status="...">` — colored status chips
- `<EmptyState>` — placeholder for empty lists

---

## Styling Conventions

- **Tailwind CSS** utility classes — do not write custom CSS unless absolutely necessary.
- **Dark theme:** Background `#0f172a` (slate-900). Use `bg-slate-900`, `bg-slate-800`, `text-slate-100` etc.
- **Responsive:** Mobile-first. Use `lg:` breakpoints for desktop layout changes.
- **Custom scrollbar:** `scrollbar-thin` class available globally.
- Do not add inline `style` props unless Tailwind cannot express the value.

---

## TypeScript Conventions

- **Strict mode** is enabled — no implicit `any`.
- Define types/interfaces for all API response shapes in the relevant service file or a co-located `types.ts`.
- Use path alias `@/*` for `src/*` (configured in `tsconfig.json`).
- Prefer `interface` for object shapes; `type` for unions and aliases.
- All async functions return `Promise<T>` with explicit type.

---

## Development Commands

```bash
# Start dev server (port 4028)
npm run dev

# Build for production
npm run build

# Type check
npm run type-check

# Lint
npm run lint

# Format
npm run format
```

---

## Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:5000/api` | Backend API base URL |

Create `.env.local` to override:
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## Business Workflow (Frontend Perspective)

1. **Receiving** (`/`) → Submit form → calls `receiving.service.ts → POST /api/receiving` → creates pallets (Draft, max 50 qty each). Stock is NOT yet active.
2. **Putaway** (`/putaway`) → Select pending task → confirm bin → calls `putaway.service.ts → POST /api/putaway/confirm` → activates stock.
3. **Inventory SOH** (`/inventory/stock-on-hand`) → Calls `inventory.service.ts → GET /api/inventory` → reads aggregated stock.
4. **Adjustment** (`/inventory/adjustment`) → Submit request (Pending state).
5. **Adjustment Approval** (`/inventory/adjustment-approval`) → Manager approves/rejects.

---

## Adding a New Page

1. Create `src/app/<route>/page.tsx` — add `'use client'` if interactive.
2. Wrap content with `<AppLayout>`.
3. Add navigation entry in `Sidebar.tsx`.
4. Create service function in `src/lib/services/` if a new API endpoint is needed.
5. Protect the route in `middleware.ts` if it is not already covered by the wildcard matcher.

---

## Security Notes

- Never store sensitive data beyond the JWT token in `localStorage`.
- Do not expose the raw token in rendered HTML or logs.
- API calls should always use `Authorization: Bearer` header — never embed credentials in URLs.
- The middleware enforces authentication on all non-public routes; do not bypass it.
