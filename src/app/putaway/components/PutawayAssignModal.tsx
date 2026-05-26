'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { Loader2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';

interface PutawayTask {
  id: string;
  palletId: string;
  orderId: string;
  supplier: string;
  skuCount: number;
  totalQty: number;
  uom: string;
  sourceZone: string;
}

interface AssignFormData {
  targetBin: string;
  assignedTo: string;
  notes: string;
}

interface BinOption { binCode: string; zone: string; }

interface PutawayAssignModalProps {
  open: boolean;
  task: PutawayTask | null;
  binOptions: BinOption[];
  onClose: () => void;
  onAssign: (taskId: string, bin: string, operator: string) => void;
}

const operators = [
  'Ahmad Fauzi',
  'Budi Santoso',
  'Dewi Rahayu',
  'Eko Prasetyo',
  'Fitri Handayani',
  'Gunawan Hadi',
  'Hendra Wijaya',
  'Indah Permata',
  'Joko Susanto',
  'Kartini Dewi',
];

export default function PutawayAssignModal({ open, task, binOptions, onClose, onAssign }: PutawayAssignModalProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<AssignFormData>();

  const onSubmit = async (data: AssignFormData) => {
    // Backend integration point: PATCH /api/putaway/:taskId { targetBin, assignedTo, notes }
    await new Promise(r => setTimeout(r, 800));
    onAssign(task!.id, data.targetBin, data.assignedTo);
    reset();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Assign Bin Location"
      size="md"
      footer={
        <>
          <button type="button" onClick={handleClose} className="btn-ghost border border-border px-4 py-2">
            Cancel
          </button>
          <button
            form="assign-form"
            type="submit"
            disabled={isSubmitting}
            className="btn-primary px-5 py-2"
          >
            {isSubmitting ? (
              <><Loader2 size={14} className="animate-spin" /> Assigning...</>
            ) : (
              'Confirm Assignment'
            )}
          </button>
        </>
      }
    >
      {task && (
        <form id="assign-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Task Summary */}
          <div className="bg-muted rounded-lg p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Pallet ID</span>
              <span className="text-sm font-bold text-info font-tabular">{task.palletId}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Order</span>
              <span className="text-sm font-semibold text-foreground font-tabular">{task.orderId}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Supplier</span>
              <span className="text-sm text-foreground">{task.supplier}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Contents</span>
              <span className="text-sm text-foreground">{task.skuCount} SKU — {task.totalQty} {task.uom}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Source Zone</span>
              <span className="text-xs bg-muted-foreground/10 px-2 py-0.5 rounded text-foreground">{task.sourceZone}</span>
            </div>
          </div>

          {/* Target Bin */}
          <div>
            <label className="form-label" htmlFor="targetBin">Target Bin Location</label>
            <p className="text-xs text-muted-foreground mb-1">Format: Zone-Row-Position (e.g. A-03-012)</p>
            <input
              id="targetBin"
              type="text"
              placeholder="e.g. B-02-015"
              list="bin-suggestions"
              className="form-input"
              {...register('targetBin', {
                required: 'Bin location is required',
                pattern: { value: /^[A-Z]-\d{2}-\d{3}$/, message: 'Format must be X-00-000 (e.g. A-03-012)' },
              })}
            />
            <datalist id="bin-suggestions">
              {binOptions.map(b => (
                <option key={`bin-opt-${b.binCode}`} value={b.binCode}>{b.zone}</option>
              ))}
            </datalist>
            {errors.targetBin && <p className="text-xs text-danger mt-1">{errors.targetBin.message}</p>}
          </div>

          {/* Assigned Operator */}
          <div>
            <label className="form-label" htmlFor="assignedTo">Assigned Operator</label>
            <select
              id="assignedTo"
              className="form-input"
              {...register('assignedTo', { required: 'Select an operator' })}
            >
              <option value="">Select operator</option>
              {operators.map(op => (
                <option key={`op-${op}`} value={op}>{op}</option>
              ))}
            </select>
            {errors.assignedTo && <p className="text-xs text-danger mt-1">{errors.assignedTo.message}</p>}
          </div>

          {/* Notes */}
          <div>
            <label className="form-label" htmlFor="notes">Notes (optional)</label>
            <textarea
              id="notes"
              placeholder="Any special handling instructions..."
              rows={2}
              className="form-input resize-none"
              {...register('notes')}
            />
          </div>
        </form>
      )}
    </Modal>
  );
}