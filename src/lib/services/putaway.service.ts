const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';

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
  const response = await fetch(`${API_BASE_URL}/putaway/pending`);
  if (!response.ok) throw new Error('Failed to fetch putaway tasks.');
  const payload = await response.json();
  return (payload.data ?? []) as PutawayTaskItem[];
}

export async function confirmPutaway(request: PutawayConfirmRequest): Promise<PutawayConfirmResult> {
  const response = await fetch(`${API_BASE_URL}/putaway/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  const payload = await response.json();

  if (!response.ok || !payload?.success) {
    throw new Error(payload?.message ?? 'Putaway confirmation failed.');
  }

  return payload.data as PutawayConfirmResult;
}
