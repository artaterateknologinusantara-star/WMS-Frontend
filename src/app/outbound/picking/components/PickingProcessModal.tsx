'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, ScanLine, CheckCircle2, AlertTriangle, Package, MapPin, Hash } from 'lucide-react';
import { confirmPick, type PickingListItem } from '@/lib/services/picking.service';

interface Props {
  item: PickingListItem;
  onClose: () => void;
  onConfirmed: (updated: PickingListItem) => void;
}

interface FieldError {
  palletId?: string;
  binCode?: string;
  pickedQty?: string;
}

export default function PickingProcessModal({ item, onClose, onConfirmed }: Props) {
  const [scannedPallet, setScannedPallet] = useState('');
  const [scannedBin, setScannedBin] = useState('');
  const [pickedQty, setPickedQty] = useState(String(item.requestedQty));
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<FieldError>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');
  const palletRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    palletRef.current?.focus();
  }, []);

  const validate = (): boolean => {
    const errs: FieldError = {};

    if (!scannedPallet.trim()) {
      errs.palletId = 'Pallet ID wajib di-scan.';
    } else if (scannedPallet.trim() !== item.palletId) {
      errs.palletId = `Pallet tidak cocok. Ekspektasi: ${item.palletId}`;
    }

    if (item.recommendedBin) {
      if (!scannedBin.trim()) {
        errs.binCode = 'Bin Code wajib di-scan.';
      } else if (scannedBin.trim() !== item.recommendedBin) {
        errs.binCode = `Bin tidak cocok. Ekspektasi: ${item.recommendedBin}`;
      }
    }

    const qty = Number(pickedQty);
    if (!pickedQty || isNaN(qty) || qty <= 0) {
      errs.pickedQty = 'Kuantitas harus lebih dari 0.';
    } else if (qty > item.requestedQty) {
      errs.pickedQty = `Kuantitas melebihi permintaan (maks: ${item.requestedQty}).`;
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleConfirm = async () => {
    setApiError('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      const updated = await confirmPick(item.id, Number(pickedQty), notes.trim() || undefined);
      onConfirmed(updated);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Gagal mengkonfirmasi pick.');
    } finally {
      setSubmitting(false);
    }
  };

  const isPartial = Number(pickedQty) < item.requestedQty && Number(pickedQty) > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl border border-border shadow-xl w-full max-w-lg mx-4 animate-fade-in">

        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-foreground">Picking Process</h3>
            <p className="text-xs text-muted-foreground mt-0.5 font-tabular">{item.pickingId}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted">
            <X size={16} />
          </button>
        </div>

        {/* Task Info */}
        <div className="px-5 pt-4 pb-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Informasi Task</p>
          <div className="bg-muted/40 rounded-lg p-3 grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
            <div>
              <span className="text-muted-foreground">SKU Number</span>
              <p className="font-semibold font-tabular text-foreground">{item.skuNumber}</p>
            </div>
            <div>
              <span className="text-muted-foreground">SKU Name</span>
              <p className="font-semibold text-foreground truncate">{item.skuName}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <Hash size={11} className="text-muted-foreground" />
              <span className="text-muted-foreground">Requested Qty</span>
              <p className="font-bold text-foreground ml-auto font-tabular">{item.requestedQty}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin size={11} className="text-muted-foreground" />
              <span className="text-muted-foreground">Recommended Bin</span>
              <p className="font-semibold text-foreground ml-auto font-tabular">{item.recommendedBin || '—'}</p>
            </div>
            <div className="col-span-2 flex items-center gap-1.5">
              <Package size={11} className="text-muted-foreground" />
              <span className="text-muted-foreground">Pallet ID</span>
              <p className="font-semibold font-tabular text-foreground ml-2">{item.palletId}</p>
            </div>
          </div>
        </div>

        {/* Scan & Verify */}
        <div className="px-5 pb-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <ScanLine size={12} /> Scan & Verifikasi
          </p>

          {/* Scan Pallet */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Scan Pallet ID <span className="text-danger">*</span>
            </label>
            <input
              ref={palletRef}
              type="text"
              placeholder="Scan barcode pallet..."
              value={scannedPallet}
              onChange={e => { setScannedPallet(e.target.value); setErrors(v => ({ ...v, palletId: undefined })); }}
              className={`form-input text-sm font-tabular ${errors.palletId ? 'border-danger' : scannedPallet === item.palletId && scannedPallet ? 'border-success' : ''}`}
            />
            {errors.palletId && (
              <p className="mt-1 text-xs text-danger flex items-center gap-1">
                <AlertTriangle size={11} /> {errors.palletId}
              </p>
            )}
            {scannedPallet === item.palletId && scannedPallet && !errors.palletId && (
              <p className="mt-1 text-xs text-success flex items-center gap-1">
                <CheckCircle2 size={11} /> Pallet cocok
              </p>
            )}
          </div>

          {/* Scan Bin — hanya jika ada recommendedBin */}
          {item.recommendedBin && (
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Scan Bin Code <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                placeholder="Scan barcode bin location..."
                value={scannedBin}
                onChange={e => { setScannedBin(e.target.value); setErrors(v => ({ ...v, binCode: undefined })); }}
                className={`form-input text-sm font-tabular ${errors.binCode ? 'border-danger' : scannedBin === item.recommendedBin && scannedBin ? 'border-success' : ''}`}
              />
              {errors.binCode && (
                <p className="mt-1 text-xs text-danger flex items-center gap-1">
                  <AlertTriangle size={11} /> {errors.binCode}
                </p>
              )}
              {scannedBin === item.recommendedBin && scannedBin && !errors.binCode && (
                <p className="mt-1 text-xs text-success flex items-center gap-1">
                  <CheckCircle2 size={11} /> Bin cocok
                </p>
              )}
            </div>
          )}

          {/* Picked Qty */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Jumlah Picked <span className="text-danger">*</span>
            </label>
            <input
              type="number"
              min={1}
              max={item.requestedQty}
              value={pickedQty}
              onChange={e => { setPickedQty(e.target.value); setErrors(v => ({ ...v, pickedQty: undefined })); }}
              className={`form-input text-sm font-tabular ${errors.pickedQty ? 'border-danger' : ''}`}
            />
            {errors.pickedQty && (
              <p className="mt-1 text-xs text-danger flex items-center gap-1">
                <AlertTriangle size={11} /> {errors.pickedQty}
              </p>
            )}
            {isPartial && !errors.pickedQty && (
              <p className="mt-1 text-xs text-warning flex items-center gap-1">
                <AlertTriangle size={11} /> Partial pick — status akan tetap <strong>In Progress</strong>
              </p>
            )}
          </div>

          {/* Notes (opsional) */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Catatan <span className="text-muted-foreground">(opsional)</span></label>
            <input
              type="text"
              placeholder="Tambahkan catatan jika ada..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="form-input text-sm"
            />
          </div>

          {/* API Error */}
          {apiError && (
            <div className="rounded-lg bg-danger/10 border border-danger/20 px-3 py-2 flex items-start gap-2">
              <AlertTriangle size={14} className="text-danger mt-0.5 shrink-0" />
              <p className="text-xs text-danger">{apiError}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border flex justify-end gap-2">
          <button onClick={onClose} disabled={submitting} className="btn-ghost text-sm border border-border">
            Batal
          </button>
          <button
            onClick={handleConfirm}
            disabled={submitting}
            className="btn-primary text-sm flex items-center gap-1.5 disabled:opacity-50"
          >
            <CheckCircle2 size={14} />
            {submitting ? 'Memproses...' : 'Konfirmasi Pick'}
          </button>
        </div>
      </div>
    </div>
  );
}
