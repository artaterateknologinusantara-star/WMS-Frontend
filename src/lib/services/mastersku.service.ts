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

export interface SKURecord {
  id: number;
  skuCode: string;
  skuName: string;
  categoryId: number | null;
  categoryName: string;
  requiresFEFO: boolean;
  uomId: number | null;
  uomCode: string;
  isActive: boolean;
  qty: number;
}

export interface CategoryOption {
  id: number;
  categoryCode: string;
  categoryName: string;
  requiresFEFO: boolean;
}

export interface UOMOption {
  id: number;
  uomCode: string;
  uomName: string;
}

export interface SaveSKURequest {
  skuCode: string;
  skuName: string;
  categoryId?: number;
  uomId?: number;
}

export async function getSKUList(): Promise<SKURecord[]> {
  const res = await fetch(`${API_BASE}/mastersku`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch SKU list');
  const payload = await res.json();
  return (payload.data ?? []) as SKURecord[];
}

export async function getCategories(): Promise<CategoryOption[]> {
  const res = await fetch(`${API_BASE}/mastersku/categories`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch categories');
  const payload = await res.json();
  return (payload.data ?? []) as CategoryOption[];
}

export async function getUOMList(): Promise<UOMOption[]> {
  const res = await fetch(`${API_BASE}/inventory/uom`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch UOM list');
  const payload = await res.json();
  return (payload.data ?? []) as UOMOption[];
}

export async function createSKU(request: SaveSKURequest): Promise<SKURecord> {
  const res = await fetch(`${API_BASE}/mastersku`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(request),
  });
  const payload = await res.json();
  if (!res.ok || !payload?.success) throw new Error(payload?.message ?? 'Failed to create SKU');
  return payload.data as SKURecord;
}

export async function updateSKU(id: number, request: SaveSKURequest): Promise<void> {
  const res = await fetch(`${API_BASE}/mastersku/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(request),
  });
  const payload = await res.json();
  if (!res.ok || !payload?.success) throw new Error(payload?.message ?? 'Failed to update SKU');
}

export async function deactivateSKU(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/mastersku/${id}/deactivate`, {
    method: 'PATCH',
    headers: authHeaders(),
  });
  const payload = await res.json();
  if (!res.ok || !payload?.success) throw new Error(payload?.message ?? 'Failed to deactivate SKU');
}
