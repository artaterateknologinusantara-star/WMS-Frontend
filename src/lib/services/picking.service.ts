const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';

export interface PickingListItem {
  id: number;
  pickingId: string;
  skuNumber: string;
  skuName: string;
  requestedQty: number;
  recommendedBin: string;
  palletId: string;
  pickedQty: number;
  status: 'pending' | 'in-progress' | 'picked' | 'error';
}

export interface CreatePickingRequest {
  skuCode: string;
  palletId: string;
  requestedQty: number;
  assignedTo: string;
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
  pickedQty?: number,
  notes?: string,
): Promise<PickingListItem> {
  const res = await fetch(`${API_BASE}/picking/${id}/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pickedQty, notes }),
  });
  const payload = await res.json();
  if (!res.ok || !payload?.success) {
    throw new Error(payload?.message ?? 'Failed to confirm pick');
  }
  return payload.data as PickingListItem;
}
