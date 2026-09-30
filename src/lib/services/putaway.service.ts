const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';

function getToken(): string {
  try {
    const stored = localStorage.getItem('syntera_auth_user');
    if (!stored) return '';
    return (JSON.parse(stored) as { token?: string })?.token ?? '';
  } catch { return ''; }
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  };
}

export interface PutawayTaskItem {
  palletId: string;
  skuId: number;
  skuCode: string;
  skuName: string;
  qty: number;
  receivingNumber: string;
  supplierName: string;
  status: string;
  createdAt: string;
  qcStatus: 'Pending' | 'Passed' | 'Failed';
  qcRemarks?: string | null;
}

export interface QCCheckRequest {
  palletId: string;
  result: 'Passed' | 'Failed';
  remarks?: string;
  checkedBy: number;
}

export interface PutawayConfirmRequest {
  palletId: string;
  binCode: string;
  confirmedBy: number;
}

export interface PutawayConfirmResult {
  success: boolean;
  palletId: string;
  skuCode: string;
  qty: number;
  binCode: string;
  message: string;
}

export async function getPendingPutawayTasks(): Promise<PutawayTaskItem[]> {
  const response = await fetch(`${API_BASE_URL}/putaway/pending`, {
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch putaway tasks.');
  const payload = await response.json();
  return (payload.data ?? []) as PutawayTaskItem[];
}

export async function submitQCCheck(request: QCCheckRequest): Promise<PutawayTaskItem> {
  const response = await fetch(`${API_BASE_URL}/putaway/qc-check`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(request),
  });

  const payload = await response.json();

  if (!response.ok || !payload?.success) {
    throw new Error(payload?.message ?? 'QC check submission failed.');
  }

  return payload.data as PutawayTaskItem;
}

export async function confirmPutaway(request: PutawayConfirmRequest): Promise<PutawayConfirmResult> {
  const response = await fetch(`${API_BASE_URL}/putaway/confirm`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(request),
  });

  const payload = await response.json();

  if (!response.ok || !payload?.success) {
    throw new Error(payload?.message ?? 'Putaway confirmation failed.');
  }

  return payload.data as PutawayConfirmResult;
}
