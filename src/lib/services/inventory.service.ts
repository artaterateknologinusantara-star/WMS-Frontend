const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';

function getToken(): string {
  try {
    const stored = localStorage.getItem('syntera_auth_user');
    if (!stored) return '';
    return (JSON.parse(stored) as { token?: string })?.token ?? '';
  } catch { return ''; }
}

function authHeaders() {
  return { Authorization: `Bearer ${getToken()}` };
}

export interface InventoryLookupResult {
  skuId: number;
  skuCode: string;
  skuName: string;
  qty: number;
  binLocation: string;
  palletId: string;
  uom: string;
  status: string;
  lastMovementDate: string;
}

export interface InventoryListResult {
  id: number;
  skuNumber: string;
  skuName: string;
  category: string;
  palletId: string;
  binLocation: string;
  quantity: number;
  uom: string;
  status: string;
  lastMovement: string;
}

export async function getInventoryByCode(skuCode: string): Promise<InventoryLookupResult | null> {
  if (!skuCode?.trim()) {
    return null;
  }

  const response = await fetch(`${API_BASE_URL}/inventory/by-code/${encodeURIComponent(skuCode.trim())}`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    return null;
  }

  const payload = await response.json();
  if (!payload?.success || !payload?.data) {
    return null;
  }

  return payload.data as InventoryLookupResult;
}

export async function getInventoryPalletsByCode(skuCode: string): Promise<InventoryLookupResult[]> {
  if (!skuCode?.trim()) return [];

  const response = await fetch(
    `${API_BASE_URL}/inventory/by-code/${encodeURIComponent(skuCode.trim())}/pallets`,
    { headers: authHeaders() }
  );

  if (!response.ok) return [];

  const payload = await response.json();
  if (!payload?.success || !Array.isArray(payload?.data)) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (payload.data as Array<any>).map(item => ({
    skuId: item.skuId,
    skuCode: item.skuCode ?? '',
    skuName: item.skuName ?? '',
    qty: item.qty ?? 0,
    binLocation: item.binLocation ?? '',
    palletId: item.palletId ?? '',
    uom: item.uom ?? '',
    status: item.status ?? '',
    lastMovementDate: item.lastMovementDate ?? '',
  }));
}

export async function getInventoryList(): Promise<InventoryListResult[]> {
  const response = await fetch(`${API_BASE_URL}/inventory`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to load inventory list');
  }

  const payload = await response.json();
  if (!payload?.success || !Array.isArray(payload?.data)) {
    throw new Error('Invalid response format');
  }

  return payload.data as InventoryListResult[];
}
