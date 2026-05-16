const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';

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

  const response = await fetch(`${API_BASE_URL}/inventory/by-code/${encodeURIComponent(skuCode.trim())}`);

  if (!response.ok) {
    return null;
  }

  const payload = await response.json();
  if (!payload?.success || !payload?.data) {
    return null;
  }

  return payload.data as InventoryLookupResult;
}

export async function getInventoryList(): Promise<InventoryListResult[]> {
  const response = await fetch(`${API_BASE_URL}/inventory`);

  if (!response.ok) {
    throw new Error('Failed to load inventory list');
  }

  const payload = await response.json();
  if (!payload?.success || !Array.isArray(payload?.data)) {
    throw new Error('Invalid response format');
  }

  return payload.data as InventoryListResult[];
}
