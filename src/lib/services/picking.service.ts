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

export interface PickingListItem {
  id: number;
  pickingId: string;
  assignedTo: string;
  skuNumber: string;
  skuName: string;
  requestedQty: number;
  pickedQty: number;
  recommendedBin: string;
  suggestedPalletId: string;
  stagingLocation: string;
  status: 'pending' | 'in-progress' | 'picked' | 'error';
}

// Picking List (planning) — user inputs SKU + qty only; system auto-suggests rack/pallet via FIFO
export interface CreatePickingRequest {
  skuCode: string;
  requestedQty: number;
  assignedTo: string;
}

// Picking Process (physical execution) — scan rack, scan pallet, confirm qty
export interface ConfirmPickRequest {
  scannedRackCode?: string;
  scannedPalletId?: string;
  pickedQty?: number;
  stagingLocationCode?: string;
  notes?: string;
}

export interface StockCheckResult {
  skuCode: string;
  skuName: string;
  availableQty: number;
  suggestedBin: string;
  suggestedPallet: string;
  bestAvailableQty: number;
}

export async function checkStock(skuCode: string): Promise<StockCheckResult | null> {
  const res = await fetch(`${API_BASE}/picking/check-stock?skuCode=${encodeURIComponent(skuCode)}`, {
    headers: authHeaders(),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to check stock');
  const payload = await res.json();
  return payload.data as StockCheckResult;
}

export interface StagingLocation {
  id: number;
  binCode: string;
  rack: string;
}

export async function getStagingLocations(): Promise<StagingLocation[]> {
  const res = await fetch(`${API_BASE}/picking/staging-locations`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch staging locations');
  const payload = await res.json();
  return (payload.data ?? []) as StagingLocation[];
}

export async function getPickingList(): Promise<PickingListItem[]> {
  const res = await fetch(`${API_BASE}/picking`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch picking list');
  const payload = await res.json();
  return (payload.data ?? []) as PickingListItem[];
}

export async function createPicking(request: CreatePickingRequest): Promise<PickingListItem[]> {
  const res = await fetch(`${API_BASE}/picking`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(request),
  });
  const payload = await res.json();
  if (!res.ok || !payload?.success) {
    throw new Error(payload?.message ?? 'Failed to create picking');
  }
  return payload.data as PickingListItem[];
}

export async function confirmPick(
  id: number,
  request: ConfirmPickRequest,
): Promise<PickingListItem> {
  const res = await fetch(`${API_BASE}/picking/${id}/confirm`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(request),
  });
  const payload = await res.json();
  if (!res.ok || !payload?.success) {
    throw new Error(payload?.message ?? 'Failed to confirm pick');
  }
  return payload.data as PickingListItem;
}
