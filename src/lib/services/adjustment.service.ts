const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';

export interface AdjustmentSubmitRequest {
  SKUId?: number;
  SKUCode: string;
  PalletId?: string;
  NewQty: number;
  AdjustmentType: string;
  Reason: string;
  Remarks?: string;
  RequestedBy: number;
}

export interface AdjustmentSubmitResponse {
  success: boolean;
  data: {
    adjustmentId: number;
    adjustmentNo: string;
    skuId: number;
    skuCode: string;
    prevQty: number;
    newQty: number;
    status: string;
    message: string;
  };
}

export interface AdjustmentHistoryResult {
  id: string;
  adjustmentNo: string;
  adjustmentType: string;
  skuId: number | null;
  skuNumber: string;
  skuName: string;
  palletId: string;
  binLocation: string;
  prevQty: number;
  newQty: number;
  diffQty: number;
  reason: string;
  remarks: string;
  requestedBy: number | null;
  requestedAt: string;
  approvalStatus: string;
  approvedBy: number | null;
  approvedAt: string;
  rejectedReason: string;
  isProcessed: boolean;
  createdAt: string;
}

export interface ApprovalResult {
  success: boolean;
  adjustmentNo: string;
  skuCode: string;
  prevQty: number;
  newQty: number;
  qtyChange: number;
  approvalStatus: string;
  message: string;
}

export async function submitAdjustment(request: AdjustmentSubmitRequest): Promise<AdjustmentSubmitResponse> {
  const response = await fetch(`${API_BASE_URL}/inventoryadjustment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  const payload = await response.json();
  if (!response.ok || !payload?.success) {
    throw new Error(payload?.message ?? 'Failed to submit adjustment.');
  }

  return payload as AdjustmentSubmitResponse;
}

export async function loadAdjustmentHistory(): Promise<AdjustmentHistoryResult[]> {
  const response = await fetch(`${API_BASE_URL}/inventoryadjustment`);
  if (!response.ok) throw new Error('Unable to load adjustment history.');
  const payload = await response.json();
  return Array.isArray(payload?.data) ? (payload.data as AdjustmentHistoryResult[]) : [];
}

export async function approveAdjustment(id: number, approvedBy: number): Promise<ApprovalResult> {
  const response = await fetch(`${API_BASE_URL}/inventoryadjustment/${id}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ approvedBy }),
  });

  const payload = await response.json();
  if (!response.ok || !payload?.success) {
    throw new Error(payload?.message ?? 'Approval failed.');
  }

  return payload.data as ApprovalResult;
}

export async function rejectAdjustment(
  id: number,
  rejectedBy: number,
  rejectionReason: string
): Promise<ApprovalResult> {
  const response = await fetch(`${API_BASE_URL}/inventoryadjustment/${id}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rejectedBy, rejectionReason }),
  });

  const payload = await response.json();
  if (!response.ok || !payload?.success) {
    throw new Error(payload?.message ?? 'Rejection failed.');
  }

  return payload.data as ApprovalResult;
}
