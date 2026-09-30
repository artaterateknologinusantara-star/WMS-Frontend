# CLAUDE.md — SynteraWMS Frontend (Next.js 15)

## Project Overview

Warehouse Management System frontend built with Next.js 15 App Router, React 19, and TypeScript 5. Supports inbound receiving, putaway, inventory management, outbound picking, dispatch (with BAST document), adjustment approval, and an operations dashboard.

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
  app/                              → App Router pages (Next.js 15)
    layout.tsx                      → Root layout (wraps all pages)
    page.tsx                        → Home = Inbound Receiving
    not-found.tsx
    login/page.tsx                  → Public login page
    dashboard/
      page.tsx
      DashboardContent.tsx
      components/
        DashboardActivityFeed.tsx
        DashboardChartsRow.tsx
        DashboardMetricsBento.tsx
        ReceivingVolumeChart.tsx
        SupplierSkuBarChart.tsx
    putaway/
      page.tsx
      components/
        PutawayContent.tsx
        PutawayAssignModal.tsx
    inventory/
      stock-on-hand/
        page.tsx
        components/StockOnHandContent.tsx
      adjustment/
        page.tsx
        components/InventoryAdjustmentContent.tsx
      adjustment-approval/page.tsx
    outbound/
      picking/
        page.tsx
        components/
          PickingListContent.tsx    → Picking list table + Create Picking modal
          PickingProcessModal.tsx   → Physical picking execution (scan rack, scan pallet)
      packing/
        page.tsx
        components/PackingContent.tsx
      dispatch/
        page.tsx
        components/DispatchContent.tsx  → Dispatch list + New Dispatch slide-over + BAST modal
    components/                     → Page-level components (inbound)
      GeneralInfoForm.tsx
      InboundReceivingContent.tsx
      NonStandardItemsTable.tsx
      ReceivingStatusTable.tsx
      StandardItemsTable.tsx
  components/
    AppLayout.tsx                   → Main layout shell (Sidebar + content area)
    Sidebar.tsx                     → Nav menu (collapsible sections, search, user profile)
    ui/
      AppIcon.tsx
      AppImage.tsx
      AppLogo.tsx
      EmptyState.tsx
      Modal.tsx
      StatusBadge.tsx
  lib/
    context/AuthContext.tsx         → Global auth state (useAuth hook)
    services/                       → Fetch-based API clients (8 files)
      auth.service.ts
      receiving.service.ts
      putaway.service.ts
      inventory.service.ts
      adjustment.service.ts
      picking.service.ts
      dispatch.service.ts
      dashboard.service.ts
  middleware.ts                     → Route protection (cookie-based)
```

---

## Authentication

- **Storage:** User object (including JWT token) stored as JSON in `localStorage` key `syntera_auth_user`.
- **Cookie:** `syntera_auth_token` cookie used by `middleware.ts` for server-side route protection.
- **Middleware (`middleware.ts`):** Redirects unauthenticated requests to `/login` on protected routes.
- **Public routes:** `/login` only.
- **Context:** `AuthContext` provides `user`, `login()`, `logout()`. Access via `useAuth()`.
- **JWT claims returned from backend:** `UserId`, `Username`, `FullName`, `Role`.

```tsx
const { user, logout } = useAuth();
```

### Getting the Token in Services
```ts
function getToken(): string {
  try {
    const stored = localStorage.getItem('syntera_auth_user');
    if (!stored) return '';
    const user = JSON.parse(stored) as { token?: string };
    return user?.token ?? '';
  } catch { return ''; }
}
```

---

## API Service Pattern

All API calls live in `src/lib/services/`. Each service file:
1. Defines TypeScript interfaces for request/response shapes.
2. Reads the JWT token from `localStorage` key `syntera_auth_user`.
3. Calls `fetch()` with `Authorization: Bearer <token>` and `Content-Type: application/json`.
4. Returns typed data or throws on error.

```ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';

export async function getSomething(): Promise<SomeDto[]> {
  const res = await fetch(`${API_BASE}/endpoint`, {
    headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to fetch');
  const payload = await res.json();
  return (payload.data ?? []) as SomeDto[];
}
```

Do **not** call `fetch()` directly in page or component files — always go through a service function.

---

## Routing (App Router)

| Route | Component | Description |
|-------|-----------|-------------|
| `/login` | login/page.tsx | Public sign-in page |
| `/dashboard` | DashboardContent.tsx | Metrics bento, charts, activity feed |
| `/` (home) | InboundReceivingContent.tsx | Inbound receiving form |
| `/putaway` | PutawayContent.tsx | Putaway task list + confirm modal |
| `/inventory/stock-on-hand` | StockOnHandContent.tsx | SOH table |
| `/inventory/adjustment` | InventoryAdjustmentContent.tsx | Submit adjustment request |
| `/inventory/adjustment-approval` | adjustment-approval/page.tsx | Approve/reject adjustments |
| `/outbound/picking` | PickingListContent.tsx | Picking list + Create Picking modal |
| `/outbound/packing` | PackingContent.tsx | Picking process execution (scan rack/pallet) |
| `/outbound/dispatch` | DispatchContent.tsx | Dispatch list + New Dispatch panel + BAST |

---

## Services Reference

| Service File | Functions | Backend Endpoint |
|---|---|---|
| auth.service.ts | `login()`, `logout()` | POST /api/auth/login |
| receiving.service.ts | `submitReceiving()`, `getReceivingHistory()` | /api/receiving |
| putaway.service.ts | `getPendingTasks()`, `confirmPutaway()`, `getStockByPallet()` | /api/putaway |
| inventory.service.ts | `getAll()`, `getByCode()`, `getStocksByCode()`, `getUOM()` | /api/inventory |
| adjustment.service.ts | `getAdjustments()`, `submitAdjustment()`, `approve()`, `reject()` | /api/inventoryadjustment *(koreksi 2026-07-15 — sebelumnya salah tertulis `/api/adjustment`; lihat `adjustment.service.ts` yang memanggil `${API_BASE_URL}/inventoryadjustment`, cocok dengan route ASP.NET Core `api/[controller]` untuk `InventoryAdjustmentController`)* |
| picking.service.ts | `checkStock()`, `getStagingLocations()`, `getPickingList()`, `createPicking()`, `confirmPick()` | /api/picking |
| dispatch.service.ts | `getStagingItems()`, `getDispatchList()`, `createDispatch()`, `confirmDispatch()` | /api/dispatch |
| dashboard.service.ts | `getDashboardSummary()`, `getDashboardActivity()` | /api/dashboard |

---

## Key TypeScript Interfaces

### Picking
```ts
interface PickingListItem {
  id: number; pickingId: string; assignedTo: string;
  skuNumber: string; skuName: string;
  requestedQty: number; pickedQty: number;
  recommendedBin: string; suggestedPalletId: string;
  stagingLocation: string;
  status: 'pending' | 'in-progress' | 'picked' | 'error';
}
interface CreatePickingRequest { skuCode: string; requestedQty: number; assignedTo: string; }
interface ConfirmPickRequest {
  scannedRackCode?: string; scannedPalletId?: string;
  pickedQty?: number; stagingLocationCode?: string; notes?: string;
}
interface StockCheckResult {
  skuCode: string; skuName: string; availableQty: number;
  suggestedBin: string; suggestedPallet: string; bestAvailableQty: number;
}
```

### Dispatch
```ts
interface StagingItem {
  pickingDetailId: number; pickingNumber: string;
  skuCode: string; skuName: string; qty: number;
  stagingBinCode: string; palletId: string;
}
interface DispatchRecord {
  id: number; dispatchNumber: string; driverName: string; vehicleNumber: string;
  status: 'pending' | 'dispatched'; notes: string; createdAt: string;
  items: DispatchItem[];
}
interface CreateDispatchRequest {
  driverName: string; vehicleNumber: string; notes?: string;
  pickingDetailIds: number[];
}
```

### Dashboard
```ts
interface DashboardSummary {
  inbound: { pendingPutaway: number; draftReceivings: number; totalReceivings: number; };
  inventory: { activePallets: number; activeQty: number; stagingPallets: number; stagingQty: number; };
  outbound: { pendingPicks: number; completedPicksToday: number; pendingDispatches: number; dispatchedToday: number; };
  adjustments: { pending: number; };
  stockByZone: { zone: string; pallets: number; qty: number }[];
}
```

---

## Component Conventions

### Server vs Client Components
- **Server components** (default): `layout.tsx`, page shell wrappers — no `useState`, no browser APIs.
- **Client components**: Add `'use client'` at top — for interactive pages, forms, hooks, event handlers.
- All feature content components are client components.

### Layout Shell
Every protected page renders inside `<AppLayout>`:
```tsx
'use client';
import AppLayout from '@/components/AppLayout';
export default function SomePage() {
  return <AppLayout>{/* page content */}</AppLayout>;
}
```

### Modal Patterns
- **Inline modal** (small forms): render conditionally in the same component file.
- **Slide-over panel** (Dispatch New): fixed right panel with backdrop overlay.
- **BAST modal** (Dispatch confirm result): full document view with print support via `window.print()`.

### Shared UI Components
- `<Modal>` — reusable modal dialog
- `<StatusBadge status="...">` — colored status chips
- `<EmptyState>` — placeholder for empty lists

---

## Outbound UI Features

### Picking List (`/outbound/picking`)
- Table showing all picking tasks with status badges.
- **Create Picking modal:** SKU input with live stock check (debounced 600ms `GET /api/picking/check-stock`). Shows available qty, suggested bin, suggested pallet before submit.
- System info banner: "System will auto-select rack & pallet (FIFO). No need to scan pallet at this stage."
- On success: shows per-task breakdown (pallet ID + bin + qty).

### Picking Process (`/outbound/packing` — PickingProcessModal)
- User opens a pending/in-progress picking task.
- Scans rack barcode → validated against `recommendedBin`.
- Scans pallet barcode → validated against `suggestedPalletId`.
- Enters picked qty.
- Selects staging location (from `GET /api/picking/staging-locations`).
- On confirm: calls `POST /api/picking/{id}/confirm`.

### Dispatch (`/outbound/dispatch`)
- History table showing all dispatch records.
- **New Dispatch slide-over:** enter DriverName + VehicleNumber + Notes, select staged items (checklist from `GET /api/dispatch/staging-items`).
- **Confirm Dispatch modal:** summary of items, driver, vehicle — calls `POST /api/dispatch/{id}/confirm`.
- **BAST modal** auto-opens after dispatch confirmation: displays Berita Acara Serah Terima with SKU, pallet, staging bin, qty, driver, vehicle, date, plus print button.
- All status badges: `pending` (yellow), `dispatched` (green).

---

## Styling Conventions

- **Tailwind CSS** utility classes only — no custom CSS unless Tailwind cannot express it.
- **Dark theme background:** `#0f172a` (slate-900). Use `bg-slate-900`, `bg-slate-800`, `text-slate-100`.
- **Responsive:** Mobile-first. `lg:` breakpoints for desktop layout.
- **Custom scrollbar:** `scrollbar-thin` class available globally.
- No inline `style` props unless Tailwind cannot express the value.

---

## TypeScript Conventions

- **Strict mode** enabled — no implicit `any`.
- Define interfaces for all API response shapes in the relevant service file.
- Use path alias `@/*` for `src/*` (configured in `tsconfig.json`).
- Prefer `interface` for object shapes; `type` for unions and aliases.
- All async functions return explicit `Promise<T>`.

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

1. **Receiving** (`/`) → Submit form → `receiving.service.ts → POST /api/receiving` → creates pallets (Draft). Stock NOT yet active.
2. **Putaway** (`/putaway`) → Select task → scan bin → `putaway.service.ts → POST /api/putaway/confirm` → activates `InventoryStock`.
3. **Inventory SOH** (`/inventory/stock-on-hand`) → `inventory.service.ts → GET /api/inventory` → aggregated stock view.
4. **Adjustment** (`/inventory/adjustment`) → Submit request (Pending state).
5. **Adjustment Approval** (`/inventory/adjustment-approval`) → Manager approves/rejects.
6. **Picking List** (`/outbound/picking`) → Enter SKU + Qty → `picking.service.ts → POST /api/picking` → planning task created with rack/pallet suggestion.
7. **Picking Process** (`/outbound/packing`) → Scan rack → scan pallet → confirm qty → `picking.service.ts → POST /api/picking/{id}/confirm` → inventory moves to staging.
8. **Dispatch** (`/outbound/dispatch`) → Select staged items + driver/vehicle → `dispatch.service.ts → POST /api/dispatch` → then `POST /api/dispatch/{id}/confirm` → inventory dispatched, BAST generated.
9. **Dashboard** (`/dashboard`) → `dashboard.service.ts → GET /api/dashboard/summary + /activity` → real-time KPIs and stock movement feed.

---

## Adding a New Page

1. Create `src/app/<route>/page.tsx` — add `'use client'` if interactive.
2. Create content component in `src/app/<route>/components/`.
3. Wrap with `<AppLayout>` in the page file.
4. Add navigation entry in `Sidebar.tsx`.
5. Create service function(s) in `src/lib/services/` for new API endpoints.
6. Verify route is protected by `middleware.ts` (already covers all non-`/login` routes).

---

## Security Notes

- Never store sensitive data beyond the JWT token in `localStorage`.
- Do not expose the raw token in rendered HTML or console logs.
- API calls must always use `Authorization: Bearer` header — never embed credentials in URLs.
- The middleware enforces authentication on all non-public routes; do not bypass it.
