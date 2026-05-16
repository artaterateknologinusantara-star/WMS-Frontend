import { redirect } from 'next/navigation';

// Approval is now handled inline on the Inventory Adjustment page.
export default function AdjustmentApprovalPage() {
  redirect('/inventory/adjustment');
}
