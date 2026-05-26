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

export interface StagingItem {
  pickingDetailId: number;
  pickingNumber: string;
  skuCode: string;
  skuName: string;
  qty: number;
  stagingBinCode: string;
  palletId: string;
}

export interface DispatchItem {
  id: number;
  skuCode: string;
  skuName: string;
  qty: number;
  stagingBinCode: string;
  palletId: string;
  status: string;
}

export interface DispatchRecord {
  id: number;
  dispatchNumber: string;
  driverName: string;
  vehicleNumber: string;
  status: 'pending' | 'dispatched';
  notes: string;
  createdAt: string;
  items: DispatchItem[];
}

export interface CreateDispatchRequest {
  driverName: string;
  vehicleNumber: string;
  notes?: string;
  pickingDetailIds: number[];
}

export interface ConfirmDispatchRequest {
  notes?: string;
}

export async function getStagingItems(): Promise<StagingItem[]> {
  const res = await fetch(`${API_BASE}/dispatch/staging-items`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch staging items');
  const payload = await res.json();
  return (payload.data ?? []) as StagingItem[];
}

export async function getDispatchList(): Promise<DispatchRecord[]> {
  const res = await fetch(`${API_BASE}/dispatch`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch dispatch list');
  const payload = await res.json();
  return (payload.data ?? []) as DispatchRecord[];
}

export async function createDispatch(request: CreateDispatchRequest): Promise<DispatchRecord> {
  const res = await fetch(`${API_BASE}/dispatch`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(request),
  });
  const payload = await res.json();
  if (!res.ok || !payload?.success) throw new Error(payload?.message ?? 'Failed to create dispatch');
  return payload.data as DispatchRecord;
}

export async function confirmDispatch(
  id: number,
  request: ConfirmDispatchRequest = {},
): Promise<DispatchRecord> {
  const res = await fetch(`${API_BASE}/dispatch/${id}/confirm`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(request),
  });
  const payload = await res.json();
  if (!res.ok || !payload?.success) throw new Error(payload?.message ?? 'Failed to confirm dispatch');
  return payload.data as DispatchRecord;
}
