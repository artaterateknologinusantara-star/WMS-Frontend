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

export interface BinRecord {
  id: number;
  binCode: string;
  zone: string;
  rack: string;
  capacityQty: number;
  isActive: boolean;
  isOccupied: boolean;
}

export interface CreateBinRequest {
  binCode: string;
  zone: string;
  rack?: string;
  capacityQty: number;
}

export async function getBinList(): Promise<BinRecord[]> {
  const res = await fetch(`${API_BASE}/binlocation`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch bin locations');
  const payload = await res.json();
  return (payload.data ?? []) as BinRecord[];
}

export async function createBin(request: CreateBinRequest): Promise<BinRecord> {
  const res = await fetch(`${API_BASE}/binlocation`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(request),
  });
  const payload = await res.json();
  if (!res.ok || !payload?.success) throw new Error(payload?.message ?? 'Failed to create bin location');
  return payload.data as BinRecord;
}

export async function toggleBinActive(id: number): Promise<{ isActive: boolean }> {
  const res = await fetch(`${API_BASE}/binlocation/${id}/toggle-active`, {
    method: 'PATCH',
    headers: authHeaders(),
  });
  const payload = await res.json();
  if (!res.ok || !payload?.success) throw new Error(payload?.message ?? 'Failed to toggle bin status');
  return payload.data as { isActive: boolean };
}
