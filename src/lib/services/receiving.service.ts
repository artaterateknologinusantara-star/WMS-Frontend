const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';

export interface ReceivingDetailRequest {
  skuId?: number;
  skuCode?: string;
  qty: number;
  uomId?: number;
  palletId?: string;
}

export interface ReceivingSubmitRequest {
  supplierName: string;
  driverName: string;
  vehicleNumber: string;
  poNumber: string;
  warehouseLocation: string;
  referenceNumber: string;
  notes: string;
  receivedBy: number;
  details: ReceivingDetailRequest[];
}

export interface PalletInfo {
  palletId: string;
  skuNumber: string;
  qty: number;
  itemName: string;
}

export interface ReceivingSubmitResponse {
  success: boolean;
  data: {
    receivingNumber: string;
    pallets: PalletInfo[];
  };
  message?: string;
}

export async function submitReceiving(request: ReceivingSubmitRequest): Promise<ReceivingSubmitResponse> {
  const response = await fetch(`${API_BASE_URL}/receiving`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  const payload = await response.json();
  if (!response.ok || !payload?.success) {
    throw new Error(payload?.message ?? 'Failed to submit receiving.');
  }

  return payload as ReceivingSubmitResponse;
}