'use client';

import React, { useState } from 'react';
import { Search, ChevronLeft, ChevronRight, Clock, CheckCircle2, XCircle } from 'lucide-react';

interface AdjustmentRecord {
  id: string;
  adjustmentId: string;
  type: string;
  skuNumber: string;
  skuName: string;
  palletId: string;
  binLocation: string;
  prevQty: number;
  newQty: number;
  reason: string;
  remarks: string;
  adjustedBy: string;
  dateTime: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
}

const adjustmentTypes = [
  'Stock Count Correction',
  'Damage',
  'Missing',
  'Expired',
  'Manual Correction',
];

const mockHistory: AdjustmentRecord[] = [
  { id: 'adj-001', adjustmentId: 'ADJ-2026-001', type: 'Stock Count Correction', skuNumber: 'SKU-ELC-001', skuName: 'Kabel UTP Cat6 Box', palletId: 'PLT-20260510-001', binLocation: 'A-03-012', prevQty: 350, newQty: 340, reason: 'Physical count mismatch', remarks: 'Counted during cycle count', adjustedBy: 'Ahmad Fauzi', dateTime: '2026-05-10 10:00', approvalStatus: 'approved' },
  { id: 'adj-002', adjustmentId: 'ADJ-2026-002', type: 'Damage', skuNumber: 'SKU-TKN-044', skuName: 'Sensor Suhu PT100', palletId: 'PLT-20260510-006', binLocation: 'F-01-002', prevQty: 10, newQty: 5, reason: 'Items damaged during handling', remarks: 'Dropped from rack', adjustedBy: 'Budi Santoso', dateTime: '2026-05-10 13:30', approvalStatus: 'approved' },
  { id: 'adj-003', adjustmentId: 'ADJ-2026-003', type: 'Missing', skuNumber: 'SKU-CHM-007', skuName: 'Cairan Pembersih Industri 5L', palletId: 'PLT-20260510-003', binLocation: 'C-01-008', prevQty: 10, newQty: 8, reason: 'Items not found during audit', remarks: 'Reported to supervisor', adjustedBy: 'Dewi Rahayu', dateTime: '2026-05-09 15:00', approvalStatus: 'pending' },
  { id: 'adj-004', adjustmentId: 'ADJ-2026-004', type: 'Expired', skuNumber: 'SKU-CHM-009', skuName: 'Thinner A Special 1L', palletId: 'PLT-20260509-017', binLocation: 'C-02-003', prevQty: 72, newQty: 60, reason: 'Expired items removed', remarks: 'Batch expired 2026-04-30', adjustedBy: 'Eko Prasetyo', dateTime: '2026-05-08 09:00', approvalStatus: 'approved' },
  { id: 'adj-005', adjustmentId: 'ADJ-2026-005', type: 'Manual Correction', skuNumber: 'SKU-MET-003', skuName: 'Baut Hex M10 x 50mm', palletId: 'PLT-20260509-014', binLocation: 'A-01-005', prevQty: 1000, newQty: 1200, reason: 'System entry error correction', remarks: 'Corrected by warehouse manager', adjustedBy: 'Fitri Handayani', dateTime: '2026-05-07 14:00', approvalStatus: 'rejected' },
];

const approvalBadge: Record<string, { label: string; classes: string }> = {
  pending: { label: 'Pending', classes: 'bg-warning-soft text-warning border border-yellow-200' },
  approved: { label: 'Approved', classes: 'bg-success-soft text-success border border-green-200' },
  rejected: { label: 'Rejected', classes: 'bg-danger-soft text-danger border border-red-200' },
};

const ITEMS_PER_PAGE = 5;

export default function InventoryAdjustmentContent() {
  const [form, setForm] = useState({
    type: '',
    skuNumber: '',
    palletId: '',
    binLocation: '',
    prevQty: '',
    newQty: '',
    reason: '',
    remarks: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [historySearch, setHistorySearch] = useState('');
  const [historyPage, setHistoryPage] = useState(1);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.type) e.type = 'Required';
    if (!form.skuNumber) e.skuNumber = 'Required';
    if (!form.palletId) e.palletId = 'Required';
    if (!form.binLocation) e.binLocation = 'Required';
    if (!form.prevQty) e.prevQty = 'Required';
    if (!form.newQty) e.newQty = 'Required';
    if (!form.reason) e.reason = 'Required';
    return e;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setForm({ type: '', skuNumber: '', palletId: '', binLocation: '', prevQty: '', newQty: '', reason: '', remarks: '' });
    }, 3000);
  };

  const filteredHistory = mockHistory.filter(h =>
    h.skuNumber.toLowerCase().includes(historySearch.toLowerCase()) ||
    h.adjustmentId.toLowerCase().includes(historySearch.toLowerCase()) ||
    h.type.toLowerCase().includes(historySearch.toLowerCase())
  );
  const totalPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE);
  const paginatedHistory = filteredHistory.slice((historyPage - 1) * ITEMS_PER_PAGE, historyPage * ITEMS_PER_PAGE);

  const diff = form.prevQty && form.newQty ? Number(form.newQty) - Number(form.prevQty) : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b border-border px-8 py-4 sticky top-0 z-10">
        <h1 className="text-lg font-bold text-foreground">Inventory Adjustment</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Manual stock correction with audit trail</p>
      </div>

      <div className="px-6 py-5 max-w-screen-xl">
        <div className="grid grid-cols-3 gap-5">
          {/* Form */}
          <div className="col-span-1">
            <div className="card p-4">
              <h2 className="text-sm font-bold text-foreground mb-3 pb-3 border-b border-border">New Adjustment</h2>
              {submitted && (
                <div className="mb-3 bg-success-soft border border-green-200 rounded px-3 py-2 flex items-center gap-2 text-success text-xs font-semibold">
                  <CheckCircle2 size={14} />
                  Adjustment saved successfully
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="form-label text-xs">Adjustment Type <span className="text-danger">*</span></label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={`form-input text-xs py-1.5 ${errors.type ? 'border-danger' : ''}`}>
                    <option value="">Select type...</option>
                    {adjustmentTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  {errors.type && <p className="text-xs text-danger mt-0.5">{errors.type}</p>}
                </div>

                <div>
                  <label className="form-label text-xs">SKU Number <span className="text-danger">*</span></label>
                  <input type="text" placeholder="Scan or enter SKU..." value={form.skuNumber} onChange={e => setForm(f => ({ ...f, skuNumber: e.target.value }))} className={`form-input text-xs py-1.5 ${errors.skuNumber ? 'border-danger' : ''}`} />
                  {errors.skuNumber && <p className="text-xs text-danger mt-0.5">{errors.skuNumber}</p>}
                </div>

                <div>
                  <label className="form-label text-xs">Pallet ID <span className="text-danger">*</span></label>
                  <input type="text" placeholder="Scan pallet barcode..." value={form.palletId} onChange={e => setForm(f => ({ ...f, palletId: e.target.value }))} className={`form-input text-xs py-1.5 ${errors.palletId ? 'border-danger' : ''}`} />
                  {errors.palletId && <p className="text-xs text-danger mt-0.5">{errors.palletId}</p>}
                </div>

                <div>
                  <label className="form-label text-xs">Bin Location <span className="text-danger">*</span></label>
                  <input type="text" placeholder="e.g. A-03-012" value={form.binLocation} onChange={e => setForm(f => ({ ...f, binLocation: e.target.value }))} className={`form-input text-xs py-1.5 ${errors.binLocation ? 'border-danger' : ''}`} />
                  {errors.binLocation && <p className="text-xs text-danger mt-0.5">{errors.binLocation}</p>}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="form-label text-xs">Prev Qty <span className="text-danger">*</span></label>
                    <input type="number" placeholder="0" value={form.prevQty} onChange={e => setForm(f => ({ ...f, prevQty: e.target.value }))} className={`form-input text-xs py-1.5 ${errors.prevQty ? 'border-danger' : ''}`} />
                    {errors.prevQty && <p className="text-xs text-danger mt-0.5">{errors.prevQty}</p>}
                  </div>
                  <div>
                    <label className="form-label text-xs">New Qty <span className="text-danger">*</span></label>
                    <input type="number" placeholder="0" value={form.newQty} onChange={e => setForm(f => ({ ...f, newQty: e.target.value }))} className={`form-input text-xs py-1.5 ${errors.newQty ? 'border-danger' : ''}`} />
                    {errors.newQty && <p className="text-xs text-danger mt-0.5">{errors.newQty}</p>}
                  </div>
                </div>

                {diff !== null && (
                  <div className={`text-xs font-semibold px-2 py-1.5 rounded ${diff > 0 ? 'bg-success-soft text-success' : diff < 0 ? 'bg-danger-soft text-danger' : 'bg-muted text-muted-foreground'}`}>
                    Difference: {diff > 0 ? '+' : ''}{diff} units
                  </div>
                )}

                <div>
                  <label className="form-label text-xs">Reason <span className="text-danger">*</span></label>
                  <input type="text" placeholder="Reason for adjustment..." value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} className={`form-input text-xs py-1.5 ${errors.reason ? 'border-danger' : ''}`} />
                  {errors.reason && <p className="text-xs text-danger mt-0.5">{errors.reason}</p>}
                </div>

                <div>
                  <label className="form-label text-xs">Remarks</label>
                  <textarea rows={2} placeholder="Additional notes..." value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} className="form-input text-xs py-1.5 resize-none" />
                </div>

                <button type="submit" className="btn-primary w-full justify-center text-xs py-2">
                  Save Adjustment
                </button>
              </form>
            </div>
          </div>

          {/* History */}
          <div className="col-span-2">
            <div className="card overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <h2 className="text-sm font-bold text-foreground">Adjustment History</h2>
                <div className="relative w-56">
                  <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="text" placeholder="Search adjustments..." value={historySearch} onChange={e => { setHistorySearch(e.target.value); setHistoryPage(1); }} className="form-input pl-7 text-xs py-1.5" />
                </div>
              </div>
              {/* Compact table — no overflow-x-auto, fits content area */}
              <table className="w-full table-fixed">
                <colgroup>
                  <col style={{ width: '13%' }} />
                  <col style={{ width: '14%' }} />
                  <col style={{ width: '14%' }} />
                  <col style={{ width: '9%' }} />
                  <col style={{ width: '8%' }} />
                  <col style={{ width: '9%' }} />
                  <col style={{ width: '14%' }} />
                  <col style={{ width: '11%' }} />
                  <col style={{ width: '8%' }} />
                </colgroup>
                <thead>
                  <tr className="bg-muted border-b border-border">
                    {['Adj. ID', 'Type', 'SKU', 'Bin', 'Prev', 'New', 'Adjusted By', 'Date', 'Status'].map(col => (
                      <th key={col} className="text-left px-2 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide truncate">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedHistory.length === 0 ? (
                    <tr><td colSpan={9} className="px-3 py-8 text-center text-sm text-muted-foreground">No adjustment records found.</td></tr>
                  ) : paginatedHistory.map(rec => {
                    const badge = approvalBadge[rec.approvalStatus];
                    const qtyDiff = rec.newQty - rec.prevQty;
                    return (
                      <tr key={rec.id} className="border-b border-border last:border-0 row-hover">
                        <td className="px-2 py-2 text-xs font-semibold text-info font-tabular truncate">{rec.adjustmentId}</td>
                        <td className="px-2 py-2 text-xs text-foreground truncate" title={rec.type}>{rec.type}</td>
                        <td className="px-2 py-2 text-xs font-tabular text-foreground truncate" title={rec.skuNumber}>{rec.skuNumber}</td>
                        <td className="px-2 py-2 text-xs font-tabular text-foreground truncate">{rec.binLocation}</td>
                        <td className="px-2 py-2 text-xs font-tabular text-right text-muted-foreground">{rec.prevQty}</td>
                        <td className="px-2 py-2 text-xs font-tabular text-right">
                          <span className={`font-semibold ${qtyDiff > 0 ? 'text-success' : qtyDiff < 0 ? 'text-danger' : 'text-foreground'}`}>{rec.newQty}</span>
                          <span className={`ml-0.5 text-xs ${qtyDiff > 0 ? 'text-success' : qtyDiff < 0 ? 'text-danger' : 'text-muted-foreground'}`}>({qtyDiff > 0 ? '+' : ''}{qtyDiff})</span>
                        </td>
                        <td className="px-2 py-2 text-xs text-foreground truncate" title={rec.adjustedBy}>{rec.adjustedBy}</td>
                        <td className="px-2 py-2 text-xs text-muted-foreground font-tabular truncate">{rec.dateTime}</td>
                        <td className="px-2 py-2">
                          <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium border ${badge.classes}`}>
                            {rec.approvalStatus === 'pending' && <Clock size={9} />}
                            {rec.approvalStatus === 'approved' && <CheckCircle2 size={9} />}
                            {rec.approvalStatus === 'rejected' && <XCircle size={9} />}
                            <span className="truncate">{badge.label}</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="flex items-center justify-between px-3 py-2.5 border-t border-border bg-muted/30">
                <p className="text-xs text-muted-foreground">
                  Showing {filteredHistory.length === 0 ? 0 : (historyPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(historyPage * ITEMS_PER_PAGE, filteredHistory.length)} of {filteredHistory.length}
                </p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setHistoryPage(p => Math.max(1, p - 1))} disabled={historyPage === 1} className="p-1.5 rounded hover:bg-muted disabled:opacity-40">
                    <ChevronLeft size={13} />
                  </button>
                  {Array.from({ length: Math.max(1, totalPages) }, (_, i) => i + 1).map(page => (
                    <button key={page} onClick={() => setHistoryPage(page)} className={`w-6 h-6 rounded text-xs font-semibold ${page === historyPage ? 'bg-primary text-white' : 'hover:bg-muted text-muted-foreground'}`}>{page}</button>
                  ))}
                  <button onClick={() => setHistoryPage(p => Math.min(totalPages, p + 1))} disabled={historyPage === totalPages || totalPages === 0} className="p-1.5 rounded hover:bg-muted disabled:opacity-40">
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
