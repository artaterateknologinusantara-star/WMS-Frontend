import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Printer, CheckCircle, Loader2 } from 'lucide-react';
import Barcode from 'react-barcode';
import GeneralInfoForm from './GeneralInfoForm';
import StandardItemsTable, { StandardItem } from './StandardItemsTable';
import NonStandardItemsTable, { NonStandardItem } from './NonStandardItemsTable';
import ReceivingStatusTable from './ReceivingStatusTable';
import Modal from '@/components/ui/Modal';
import { submitReceiving, PalletInfo } from '@/lib/services/receiving.service';
import { getInventoryByCode } from '@/lib/services/inventory.service';
import { useAuth } from '@/lib/context/AuthContext';

export interface InboundFormData {
  supplierName: string;
  driverName: string;
  vehicleNumber: string;
  poNumber: string;
  warehouseLocation: string;
  referenceNumber: string;
  notes: string;
}

export default function InboundReceivingContent() {
  const { user } = useAuth();
  const { register, handleSubmit, formState: { errors }, reset } = useForm<InboundFormData>();
  const [now, setNow] = useState('');

  useEffect(() => {
    const fmt = () => new Date().toLocaleString('id-ID', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
    setNow(fmt());
    const t = setInterval(() => setNow(fmt()), 1000);
    return () => clearInterval(t);
  }, []);

  const [standardItems, setStandardItems] = useState<StandardItem[]>([
    { id: 'sku-init-001', skuNumber: '', quantity: 0, uom: '' },
  ]);
  const [nonStandardItems, setNonStandardItems] = useState<NonStandardItem[]>([
    { id: 'nonstd-init-001', itemName: '', quantity: 0, uom: '' },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [generatedPallets, setGeneratedPallets] = useState<PalletInfo[]>([]);

 const onSubmit = async (data: InboundFormData) => {
  setIsSubmitting(true);
  try {
    const details = [];

    for (const item of standardItems) {
      if (item.skuNumber && item.quantity > 0) {
        // ✅ Tidak perlu getInventoryByCode untuk receiving
        // Langsung pakai skuNumber sebagai reference
        details.push({
          skuCode: item.skuNumber,
          qty: item.quantity,
          uomId: 1,
        });
      }
    }

    if (details.length === 0) {
      alert('Tambahkan minimal 1 item dengan SKU dan quantity > 0.');
      setIsSubmitting(false);
      return;
    }

    const request = {
      supplierName: data.supplierName,
      driverName: data.driverName,
      vehicleNumber: data.vehicleNumber,
      poNumber: data.poNumber,
      warehouseLocation: data.warehouseLocation,
      referenceNumber: data.referenceNumber,
      notes: data.notes,
      receivedBy: user?.userId ?? 1,
      details,
    };

    const response = await submitReceiving(request);
    const pallets = response.data?.pallets ?? [];

    if (pallets.length === 0) {
      alert('Receiving berhasil dibuat tetapi tidak ada pallet yang di-generate.\nPastikan SKU Number yang dimasukkan terdaftar di Master SKU.');
      return;
    }

    setGeneratedPallets(pallets);
    setSuccessModal(true);
    reset();
    setStandardItems([{ id: 'sku-init-reset', skuNumber: '', quantity: 0, uom: '' }]);
    setNonStandardItems([{ id: 'nonstd-init-reset', itemName: '', quantity: 0, uom: '' }]);

  } catch (error) {
    console.error('Submit error:', error);
    alert(error instanceof Error ? error.message : 'Terjadi kesalahan saat submit.');
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <div className="min-h-screen bg-white relative">
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Page Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-border px-4 py-3 sm:px-6 lg:px-8 lg:py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-foreground">Inbound Receiving</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Log incoming shipments and generate pallet IDs</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded font-tabular">
              {now}
            </span>
            <span className="status-badge bg-info-soft text-info border border-blue-200">
              New Receiving
            </span>
          </div>
        </div>

        <div className="px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6 max-w-screen-2xl">
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
        <div className="fixed bottom-0 left-0 lg:left-[260px] right-0 bg-white border-t border-border px-4 py-3 sm:px-6 lg:px-8 lg:py-4 z-20">
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
        title="Pallet Labels Generated Successfully"
        size="lg"
        footer={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSuccessModal(false)}
              className="btn-secondary px-6 py-2"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="btn-primary px-6 py-2 flex items-center gap-2"
            >
              <Printer size={16} />
              Print Labels
            </button>
          </div>
        }
      >
        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-4">Receiving order submitted. Generated pallet labels:</p>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {generatedPallets.map((pallet, index) => (
              <div key={pallet.palletId} className="border border-border rounded-lg p-4 bg-muted/50 print:border print:border-black print:bg-white">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Pallet {index + 1}</p>
                    <p className="text-xs text-muted-foreground">ID: {pallet.palletId}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{pallet.skuNumber}</p>
                    <p className="text-xs text-muted-foreground">{pallet.itemName}</p>
                  </div>
                </div>
                <div className="flex justify-center mb-2">
                  <Barcode value={pallet.palletId} width={1.5} height={40} fontSize={12} />
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold">{pallet.palletId}</p>
                  <p className="text-sm">Qty: {pallet.qty}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            The putaway task has been created and assigned to the queue.
          </p>
        </div>
      </Modal>
    </div>
  );
}