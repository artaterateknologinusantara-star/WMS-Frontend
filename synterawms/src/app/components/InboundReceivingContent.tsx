'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Printer, CheckCircle, Loader2 } from 'lucide-react';
import GeneralInfoForm from './GeneralInfoForm';
import StandardItemsTable, { StandardItem } from './StandardItemsTable';
import NonStandardItemsTable, { NonStandardItem } from './NonStandardItemsTable';
import ReceivingStatusTable from './ReceivingStatusTable';
import Modal from '@/components/ui/Modal';

export interface InboundFormData {
  supplierName: string;
  driverName: string;
  vehicleNumber: string;
  poNumber: string;
}

export default function InboundReceivingContent() {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<InboundFormData>();

  const [standardItems, setStandardItems] = useState<StandardItem[]>([
    { id: 'sku-init-001', skuNumber: '', quantity: 0, uom: '' },
  ]);
  const [nonStandardItems, setNonStandardItems] = useState<NonStandardItem[]>([
    { id: 'nonstd-init-001', itemName: '', quantity: 0, uom: '' },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [generatedPalletId, setGeneratedPalletId] = useState('');

  const onSubmit = async (data: InboundFormData) => {
    setIsSubmitting(true);
    // Backend integration point: POST /api/receiving with form data + items
    await new Promise(r => setTimeout(r, 1800));
    const palletId = `PLT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Math.floor(Math.random() * 900) + 100)}`;
    setGeneratedPalletId(palletId);
    setIsSubmitting(false);
    setSuccessModal(true);
    reset();
    setStandardItems([{ id: 'sku-init-reset', skuNumber: '', quantity: 0, uom: '' }]);
    setNonStandardItems([{ id: 'nonstd-init-reset', itemName: '', quantity: 0, uom: '' }]);
  };

  return (
    <div className="min-h-screen bg-white relative">
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Page Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-border px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-foreground">Inbound Receiving</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Log incoming shipments and generate pallet IDs</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
              2026-05-10 18:32
            </span>
            <span className="status-badge bg-info-soft text-info border border-blue-200">
              Draft
            </span>
          </div>
        </div>

        <div className="px-8 py-6 max-w-screen-2xl">
          {/* General Information */}
          <GeneralInfoForm register={register} errors={errors} />

          {/* Standard Items */}
          <StandardItemsTable items={standardItems} onChange={setStandardItems} />

          {/* Non-Standard Items */}
          <NonStandardItemsTable items={nonStandardItems} onChange={setNonStandardItems} />

          {/* Receiving Status Table */}
          <ReceivingStatusTable />
        </div>

        {/* Sticky Submit Button */}
        <div className="fixed bottom-0 left-[260px] right-0 bg-white border-t border-border px-8 py-4 z-20">
          <button
            type="submit"
            disabled={isSubmitting}
            className="submit-gradient text-gray-900 font-bold text-base px-8 py-3.5 rounded-lg flex items-center gap-3 transition-all duration-150 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Generating Pallet ID...
              </>
            ) : (
              <>
                <Printer size={18} />
                Submit and Generate Pallet ID
              </>
            )}
          </button>
        </div>
      </form>

      {/* Success Modal */}
      <Modal
        open={successModal}
        onClose={() => setSuccessModal(false)}
        title="Pallet ID Generated Successfully"
        size="sm"
        footer={
          <button
            onClick={() => setSuccessModal(false)}
            className="btn-primary px-6 py-2"
          >
            Close
          </button>
        }
      >
        <div className="flex flex-col items-center py-4 text-center">
          <div className="w-14 h-14 rounded-full bg-success-soft flex items-center justify-center mb-4">
            <CheckCircle size={28} className="text-success" />
          </div>
          <p className="text-sm text-muted-foreground mb-3">Receiving order submitted. Pallet ID assigned:</p>
          <div className="bg-muted rounded-lg px-6 py-3">
            <p className="text-lg font-bold text-foreground font-tabular">{generatedPalletId}</p>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            The putaway task has been created and assigned to the queue.
          </p>
        </div>
      </Modal>
    </div>
  );
}