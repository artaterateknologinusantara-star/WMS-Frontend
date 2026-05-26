const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';

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

export interface StagingLocation {
  id: number;
  binCode: string;
  rack: string;
}

export async function getStagingLocations(): Promise<StagingLocation[]> {
  const res = await fetch(`${API_BASE}/picking/staging-locations`);
  if (!res.ok) throw new Error('Failed to fetch staging locations');
  const payload = await res.json();
  return (payload.data ?? []) as StagingLocation[];
}

export async function getPickingList(): Promise<PickingListItem[]> {
  const res = await fetch(`${API_BASE}/picking`);
  if (!res.ok) throw new Error('Failed to fetch picking list');
  const payload = await res.json();
  return (payload.data ?? []) as PickingListItem[];
}

export async function createPicking(request: CreatePickingRequest): Promise<PickingListItem> {
  const res = await fetch(`${API_BASE}/picking`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  const payload = await res.json();
  if (!res.ok || !payload?.success) {
    throw new Error(payload?.message ?? 'Failed to create picking');
  }
  return payload.data as PickingListItem;
}

export async function confirmPick(
  id: number,
  request: ConfirmPickRequest,
): Promise<PickingListItem> {
  const res = await fetch(`${API_BASE}/picking/${id}/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  const payload = await res.json();
  if (!res.ok || !payload?.success) {
    throw new Error(payload?.message ?? 'Failed to confirm pick');
  }
  return payload.data as PickingListItem;
}
