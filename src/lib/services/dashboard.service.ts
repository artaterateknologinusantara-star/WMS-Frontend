const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';

function getToken(): string {
  try {
    const stored = localStorage.getItem('syntera_auth_user');
    if (!stored) return '';
    const user = JSON.parse(stored) as { token?: string };
    return user?.token ?? '';
  } catch {
    return '';
  }
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  };
}

export interface DashboardSummary {
  inbound: {
    pendingPutaway: number;
    draftReceivings: number;
    totalReceivings: number;
  };
  inventory: {
    activePallets: number;
    activeQty: number;
    stagingPallets: number;
    stagingQty: number;
  };
  outbound: {
    pendingPicks: number;
    completedPicksToday: number;
    pendingDispatches: number;
    dispatchedToday: number;
  };
  adjustments: {
    pending: number;
  };
  stockByZone: { zone: string; pallets: number; qty: number }[];
}

export interface ActivityItem {
  id: number;
  movementType: string;
  skuCode: string;
  skuName: string;
  qty: number;
  qtyBefore: number;
  qtyAfter: number;
  referenceNo: string;
  fromBin: string;
  toBin: string;
  remarks: string;
  createdAt: string;
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const res = await fetch(`${API_BASE}/dashboard/summary`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch dashboard summary');
  const payload = await res.json();
  return payload.data as DashboardSummary;
}

export async function getDashboardActivity(): Promise<ActivityItem[]> {
  const res = await fetch(`${API_BASE}/dashboard/activity`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch dashboard activity');
  const payload = await res.json();
  return (payload.data ?? []) as ActivityItem[];
}
