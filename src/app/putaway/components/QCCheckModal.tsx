'use client';

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';

interface QCCheckTask {
  id: string;
  palletId: string;
  skuCode: string;
  skuName: string;
  totalQty: number;
}

interface QCCheckModalProps {
  open: boolean;
  task: QCCheckTask | null;
  submitting: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (result: 'Passed' | 'Failed', remarks: string) => void;
}

export default function QCCheckModal({ open, task, submitting, error, onClose, onSubmit }: QCCheckModalProps) {
  const [result, setResult] = useState<'Passed' | 'Failed'>('Passed');
  const [remarks, setRemarks] = useState('');

  const handleClose = () => {
    setResult('Passed');
    setRemarks('');
    onClose();
  };

  const handleSubmit = () => {
    onSubmit(result, remarks);
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="QC Check"
      size="md"
      footer={
        <>
          <button type="button" onClick={handleClose} disabled={submitting} className="btn-ghost border border-border px-4 py-2">
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-primary px-5 py-2"
          >
            {submitting ? (
              <><Loader2 size={14} className="animate-spin" /> Menyimpan...</>
            ) : (
              'Submit QC Check'
            )}
          </button>
        </>
      }
    >
      {task && (
        <div className="space-y-4">
          <div className="bg-muted rounded-lg p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Pallet ID</span>
              <span className="text-sm font-bold text-info font-tabular">{task.palletId}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">SKU</span>
              <span className="text-sm font-semibold text-foreground">{task.skuCode} — {task.skuName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Qty</span>
              <span className="text-sm font-bold text-foreground font-tabular">{task.totalQty}</span>
            </div>
          </div>

          <div>
            <label className="form-label">Hasil QC</label>
            <div className="flex gap-2 mt-1">
              <button
                type="button"
                onClick={() => setResult('Passed')}
                className={`flex-1 text-sm font-semibold px-3 py-2 rounded border transition-colors ${
                  result === 'Passed'
                    ? 'bg-success text-white border-success'
                    : 'bg-white text-foreground border-border hover:bg-muted'
                }`}
              >
                Passed
              </button>
              <button
                type="button"
                onClick={() => setResult('Failed')}
                className={`flex-1 text-sm font-semibold px-3 py-2 rounded border transition-colors ${
                  result === 'Failed'
                    ? 'bg-danger text-white border-danger'
                    : 'bg-white text-foreground border-border hover:bg-muted'
                }`}
              >
                Failed
              </button>
            </div>
          </div>

          <div>
            <label className="form-label" htmlFor="qc-remarks">
              Catatan {result === 'Failed' ? '(disarankan diisi — alasan gagal QC)' : '(opsional)'}
            </label>
            <textarea
              id="qc-remarks"
              rows={3}
              placeholder={result === 'Failed' ? 'mis. Kemasan rusak, ada indikasi bocor...' : 'Catatan tambahan...'}
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              className="form-input resize-none"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-danger/10 border border-danger/20 px-3 py-2">
              <p className="text-xs text-danger">{error}</p>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
