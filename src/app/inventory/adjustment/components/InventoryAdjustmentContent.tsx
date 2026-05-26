'use client';

import React, { useEffect, useState } from 'react';
import {
  Search, ChevronLeft, ChevronRight, Clock, CheckCircle2, XCircle,
  Package, MapPin, Loader2, AlertTriangle, Plus, X,
} from 'lucide-react';
import { getInventoryByCode, type InventoryLookupResult } from '@/lib/services/inventory.service';
import { useAuth } from '@/lib/context/AuthContext';
import {
  loadAdjustmentHistory,
  submitAdjustment,
  approveAdjustment,
  rejectAdjustment,
} from '@/lib/services/adjustment.service';

interface AdjustmentRecord {
  id: string;
  adjustmentNo: string;
  adjustmentType: string;
  skuId: number | null;
  skuNumber: string;
  skuName: string;
  palletId: string;
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

interface AdjustmentForm {
  type: string;
  skuNumber: string;
  palletId: string;
  binLocation: string;
  prevQty: string;
  newQty: string;
  reason: string;
  remarks: string;
}

interface ApprovalModal {
  open: boolean;
  mode: 'approve' | 'reject';
  record: AdjustmentRecord | null;
  rejectionReason: string;
  loading: boolean;
  error: string;
}

const adjustmentTypes = [
  'Stock Count Correction',
  'Damage',
  'Missing',
  'Expired',
  'Manual Correction',
];

const statusBadge: Record<string, { label: string; classes: string; icon: React.ReactNode }> = {
  pending:  { label: 'Pending',  classes: 'bg-warning-soft  text-warning border border-yellow-200', icon: <Clock       size={9} /> },
  approved: { label: 'Approved', classes: 'bg-success-soft  text-success border border-green-200',  icon: <CheckCircle2 size={9} /> },
  rejected: { label: 'Rejected', classes: 'bg-danger-soft   text-danger  border border-red-200',    icon: <XCircle      size={9} /> },
};

const ITEMS_PER_PAGE = 10;

const emptyForm: AdjustmentForm = {
  type: '', skuNumber: '', palletId: '', binLocation: '', prevQty: '', newQty: '', reason: '', remarks: '',
};

export default function InventoryAdjustmentContent() {
  const { user } = useAuth();
  const currentUserId = user?.userId ?? 1;
  const isAdmin = user?.role === 'SuperAdmin' || user?.role === 'WarehouseManager';

  // ── Form panel ───────────────────────────────────────────────────────
  const [panelOpen, setPanelOpen] = useState(false);
  const [form, setForm] = useState<AdjustmentForm>(emptyForm);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [skuLookupLoading, setSkuLookupLoading] = useState(false);
  const [skuLookupError, setSkuLookupError] = useState<string | null>(null);
  const [skuData, setSkuData] = useState<InventoryLookupResult | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  // ── History ──────────────────────────────────────────────────────────
  const [history, setHistory] = useState<AdjustmentRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [historyPage, setHistoryPage] = useState(1);

  // ── Approval modal ───────────────────────────────────────────────────
  const [approvalModal, setApprovalModal] = useState<ApprovalModal>({
    open: false, mode: 'approve', record: null, rejectionReason: '', loading: false, error: '',
  });

  // ── Helpers ──────────────────────────────────────────────────────────

  const normalizeRecord = (item: any): AdjustmentRecord => ({
    id: item.id?.toString() ?? '',
    adjustmentNo: item.adjustmentNo ?? '',
    adjustmentType: item.adjustmentType ?? '',
    skuId: item.skuId ?? null,
    skuNumber: item.skuNumber ?? '',
    skuName: item.skuName ?? '',
    palletId: item.palletId ?? '',
    prevQty: Number(item.prevQty ?? 0),
    newQty: Number(item.newQty ?? 0),
    diffQty: Number(item.diffQty ?? (Number(item.newQty ?? 0) - Number(item.prevQty ?? 0))),
    reason: item.reason ?? '',
    remarks: item.remarks ?? '',
    requestedBy: item.requestedBy ?? null,
    requestedAt: item.requestedAt ?? item.createdAt ?? '',
    approvalStatus: String(item.approvalStatus ?? 'Pending').trim(),
    approvedBy: item.approvedBy ?? null,
    approvedAt: item.approvedAt ?? '',
    rejectedReason: item.rejectedReason ?? '',
    isProcessed: Boolean(item.isProcessed ?? false),
    createdAt: item.createdAt ?? '',
  });

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const items = await loadAdjustmentHistory();
      setHistory(items.map(normalizeRecord));
      setHistoryPage(1);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => { loadHistory(); }, []);

  // Close panel on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setPanelOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const openPanel = () => {
    setForm(emptyForm);
    setSkuData(null);
    setSkuLookupError(null);
    setErrors({});
    setSubmitError('');
    setSubmitted(false);
    setPanelOpen(true);
  };

  // ── SKU lookup ────────────────────────────────────────────────────────

  const lookupSku = async (skuCode: string) => {
    if (!skuCode?.trim()) { setSkuLookupError(null); setSkuData(null); return; }
    setSkuLookupLoading(true);
    setSkuLookupError(null);
    try {
      const inv = await getInventoryByCode(skuCode);
      if (!inv) { setSkuLookupError('SKU not found.'); setSkuData(null); return; }
      setSkuData(inv);
      setForm(f => ({ ...f, skuNumber: inv.skuCode, palletId: inv.palletId, binLocation: inv.binLocation, prevQty: inv.qty.toString() }));
    } catch {
      setSkuLookupError('Unable to load SKU details.');
      setSkuData(null);
    } finally {
      setSkuLookupLoading(false);
    }
  };

  // ── Submit ────────────────────────────────────────────────────────────

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.type)        e.type        = 'Required';
    if (!form.skuNumber)   e.skuNumber   = 'Required';
    if (!form.palletId)    e.palletId    = 'Required';
    if (!form.binLocation) e.binLocation = 'Required';
    if (!form.prevQty)     e.prevQty     = 'Required';
    if (!form.newQty)      e.newQty      = 'Required';
    if (!form.reason)      e.reason      = 'Required';
    return e;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setSubmitError('');
    setSubmitLoading(true);
    try {
      await submitAdjustment({
        SKUId: skuData?.skuId,
        SKUCode: form.skuNumber,
        PalletId: form.palletId,
        NewQty: Number(form.newQty),
        AdjustmentType: form.type,
        Reason: form.reason,
        Remarks: form.remarks,
        RequestedBy: currentUserId,
      });
      setSubmitted(true);
      setForm(emptyForm);
      setSkuData(null);
      setSkuLookupError(null);
      await loadHistory();
      setTimeout(() => {
        setSubmitted(false);
        setPanelOpen(false);
      }, 1800);
    } catch (err: any) {
      setSubmitError(err?.message ?? 'Unable to save adjustment. Please try again.');
    } finally {
      setSubmitLoading(false);
    }
  };

  // ── Approval ──────────────────────────────────────────────────────────

  const openApprove = (rec: AdjustmentRecord) =>
    setApprovalModal({ open: true, mode: 'approve', record: rec, rejectionReason: '', loading: false, error: '' });

  const openReject = (rec: AdjustmentRecord) =>
    setApprovalModal({ open: true, mode: 'reject', record: rec, rejectionReason: '', loading: false, error: '' });

  const closeModal = () => setApprovalModal(m => ({ ...m, open: false, error: '' }));

  const handleApproveConfirm = async () => {
    if (!approvalModal.record) return;
    setApprovalModal(m => ({ ...m, loading: true, error: '' }));
    try {
      await approveAdjustment(Number(approvalModal.record.id), currentUserId);
      setApprovalModal(m => ({ ...m, open: false, loading: false }));
      await loadHistory();
    } catch (err: any) {
      setApprovalModal(m => ({ ...m, loading: false, error: err?.message ?? 'Approval failed.' }));
    }
  };

  const handleRejectConfirm = async () => {
    if (!approvalModal.record) return;
    if (!approvalModal.rejectionReason.trim()) {
      setApprovalModal(m => ({ ...m, error: 'Rejection reason is required.' }));
      return;
    }
    setApprovalModal(m => ({ ...m, loading: true, error: '' }));
    try {
      await rejectAdjustment(Number(approvalModal.record.id), currentUserId, approvalModal.rejectionReason);
      setApprovalModal(m => ({ ...m, open: false, loading: false }));
      await loadHistory();
    } catch (err: any) {
      setApprovalModal(m => ({ ...m, loading: false, error: err?.message ?? 'Rejection failed.' }));
    }
  };

  // ── Filtering / Pagination ────────────────────────────────────────────

  const normalizedSearch = historySearch.trim().toLowerCase();
  const filteredHistory = history.filter(rec =>
    [rec.adjustmentNo, rec.adjustmentType, rec.skuNumber, rec.skuName, rec.approvalStatus, rec.palletId]
      .some(v => v?.toLowerCase().includes(normalizedSearch))
  );
  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / ITEMS_PER_PAGE));
  const paginatedHistory = filteredHistory.slice((historyPage - 1) * ITEMS_PER_PAGE, historyPage * ITEMS_PER_PAGE);

  useEffect(() => {
    if (historyPage > totalPages) setHistoryPage(totalPages);
  }, [historyPage, totalPages]);

  const diff = form.prevQty && form.newQty ? Number(form.newQty) - Number(form.prevQty) : null;

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">

      {/* ── Approval / Reject Modal ── */}
      {approvalModal.open && approvalModal.record && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-lg border border-border shadow-lg w-full max-w-md mx-4">

            <div className={`px-5 py-4 border-b border-border flex items-center gap-2 ${approvalModal.mode === 'approve' ? 'text-success' : 'text-danger'}`}>
              {approvalModal.mode === 'approve' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
              <h3 className="text-sm font-bold text-foreground">
                {approvalModal.mode === 'approve' ? 'Approve Adjustment' : 'Reject Adjustment'}
              </h3>
            </div>

            <div className="px-5 py-4 space-y-4">
              <div className="bg-muted rounded-lg p-3 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Adj. No</span>
                  <span className="font-bold text-info font-tabular">{approvalModal.record.adjustmentNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SKU</span>
                  <span className="font-semibold text-foreground">{approvalModal.record.skuNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pallet</span>
                  <span className="font-tabular text-foreground">{approvalModal.record.palletId || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Qty Change</span>
                  <span className={`font-bold font-tabular ${approvalModal.record.diffQty >= 0 ? 'text-success' : 'text-danger'}`}>
                    {approvalModal.record.prevQty} → {approvalModal.record.newQty}
                    &nbsp;({approvalModal.record.diffQty >= 0 ? '+' : ''}{approvalModal.record.diffQty})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reason</span>
                  <span className="text-foreground max-w-[60%] text-right">{approvalModal.record.reason}</span>
                </div>
              </div>

              {approvalModal.mode === 'reject' && (
                <div>
                  <label className="form-label text-xs">Rejection Reason <span className="text-danger">*</span></label>
                  <textarea
                    rows={3}
                    placeholder="Enter the reason for rejection..."
                    value={approvalModal.rejectionReason}
                    onChange={e => setApprovalModal(m => ({ ...m, rejectionReason: e.target.value, error: '' }))}
                    className="form-input text-xs resize-none"
                    autoFocus
                  />
                </div>
              )}

              {approvalModal.mode === 'approve' && (
                <p className="text-xs text-muted-foreground">
                  Approving will update the InventoryStock and create a StockMovement audit record. This action cannot be undone.
                </p>
              )}

              {approvalModal.error && (
                <div className="flex items-center gap-2 bg-danger-soft border border-red-200 rounded px-3 py-2 text-danger text-xs">
                  <AlertTriangle size={13} />
                  {approvalModal.error}
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-border flex justify-end gap-2">
              <button onClick={closeModal} disabled={approvalModal.loading} className="btn-ghost border border-border px-4 py-1.5 text-xs disabled:opacity-50">
                Cancel
              </button>
              {approvalModal.mode === 'approve' ? (
                <button onClick={handleApproveConfirm} disabled={approvalModal.loading} className="bg-success text-white text-xs font-semibold px-4 py-1.5 rounded hover:bg-success/90 transition-colors flex items-center gap-2 disabled:opacity-50">
                  {approvalModal.loading ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                  Approve
                </button>
              ) : (
                <button onClick={handleRejectConfirm} disabled={approvalModal.loading} className="bg-danger text-white text-xs font-semibold px-4 py-1.5 rounded hover:bg-danger/90 transition-colors flex items-center gap-2 disabled:opacity-50">
                  {approvalModal.loading ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                  Reject
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── New Adjustment Slide-over Panel ── */}
      {panelOpen && (
        <div className="fixed inset-0 z-40 flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setPanelOpen(false)}
          />

          {/* Panel */}
          <div className="relative w-full max-w-md bg-white shadow-2xl flex flex-col h-full overflow-hidden">
            {/* Panel Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-white flex-shrink-0">
              <div>
                <h2 className="text-sm font-bold text-foreground">New Adjustment</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Submit a stock correction for approval</p>
              </div>
              <button
                onClick={() => setPanelOpen(false)}
                className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground"
              >
                <X size={16} />
              </button>
            </div>

            {/* Panel Body — scrollable */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {submitted && (
                <div className="bg-success-soft border border-green-200 rounded-lg px-4 py-3 flex items-center gap-2 text-success text-sm font-semibold">
                  <CheckCircle2 size={16} />
                  Adjustment submitted — awaiting approval
                </div>
              )}
              {submitError && (
                <div className="bg-danger-soft border border-red-200 rounded-lg px-4 py-3 flex items-start gap-2 text-danger text-xs">
                  <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                  {submitError}
                </div>
              )}

              <form id="adj-form" onSubmit={handleSubmit} className="space-y-4">
                {/* Type */}
                <div>
                  <label className="form-label text-xs">Adjustment Type <span className="text-danger">*</span></label>
                  <select
                    value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    className={`form-input text-sm py-2 ${errors.type ? 'border-danger' : ''}`}
                  >
                    <option value="">Select type...</option>
                    {adjustmentTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  {errors.type && <p className="text-xs text-danger mt-1">{errors.type}</p>}
                </div>

                {/* SKU lookup */}
                <div>
                  <label className="form-label text-xs">SKU Number <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    placeholder="Scan or enter SKU..."
                    value={form.skuNumber}
                    onChange={e => setForm(f => ({ ...f, skuNumber: e.target.value }))}
                    onBlur={() => lookupSku(form.skuNumber)}
                    className={`form-input text-sm py-2 ${errors.skuNumber ? 'border-danger' : ''}`}
                  />
                  {skuLookupLoading && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Loader2 size={11} className="animate-spin" /> Loading SKU details...
                    </p>
                  )}
                  {skuLookupError && <p className="text-xs text-danger mt-1">{skuLookupError}</p>}
                  {errors.skuNumber && <p className="text-xs text-danger mt-1">{errors.skuNumber}</p>}
                </div>

                {/* SKU info card */}
                {skuData && (
                  <div className="rounded-lg border border-border bg-muted/50 px-4 py-3 text-xs space-y-1.5">
                    <div className="font-semibold text-foreground">{skuData.skuCode} — {skuData.skuName}</div>
                    <div className="flex flex-wrap gap-3 text-muted-foreground">
                      <span>Qty: <strong className="text-foreground">{skuData.qty}</strong></span>
                      <span className="flex items-center gap-1"><Package size={11} />{skuData.palletId || 'N/A'}</span>
                      <span className="flex items-center gap-1"><MapPin size={11} />{skuData.binLocation || 'N/A'}</span>
                    </div>
                  </div>
                )}

                {/* Pallet ID */}
                <div>
                  <label className="form-label text-xs">Pallet ID <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    placeholder="Scan pallet barcode..."
                    value={form.palletId}
                    onChange={e => setForm(f => ({ ...f, palletId: e.target.value }))}
                    className={`form-input text-sm py-2 ${errors.palletId ? 'border-danger' : ''}`}
                  />
                  {errors.palletId && <p className="text-xs text-danger mt-1">{errors.palletId}</p>}
                </div>

                {/* Bin Location */}
                <div>
                  <label className="form-label text-xs">Bin Location <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    placeholder="e.g. A-03-012"
                    value={form.binLocation}
                    onChange={e => setForm(f => ({ ...f, binLocation: e.target.value }))}
                    className={`form-input text-sm py-2 ${errors.binLocation ? 'border-danger' : ''}`}
                  />
                  {errors.binLocation && <p className="text-xs text-danger mt-1">{errors.binLocation}</p>}
                </div>

                {/* Qty fields */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label text-xs">Prev Qty <span className="text-danger">*</span></label>
                    <input
                      type="number"
                      placeholder="0"
                      value={form.prevQty}
                      onChange={e => setForm(f => ({ ...f, prevQty: e.target.value }))}
                      className={`form-input text-sm py-2 ${errors.prevQty ? 'border-danger' : ''}`}
                    />
                    {errors.prevQty && <p className="text-xs text-danger mt-1">{errors.prevQty}</p>}
                  </div>
                  <div>
                    <label className="form-label text-xs">New Qty <span className="text-danger">*</span></label>
                    <input
                      type="number"
                      placeholder="0"
                      value={form.newQty}
                      onChange={e => setForm(f => ({ ...f, newQty: e.target.value }))}
                      className={`form-input text-sm py-2 ${errors.newQty ? 'border-danger' : ''}`}
                    />
                    {errors.newQty && <p className="text-xs text-danger mt-1">{errors.newQty}</p>}
                  </div>
                </div>

                {/* Diff indicator */}
                {diff !== null && (
                  <div className={`text-xs font-semibold px-3 py-2 rounded-lg ${diff > 0 ? 'bg-success-soft text-success' : diff < 0 ? 'bg-danger-soft text-danger' : 'bg-muted text-muted-foreground'}`}>
                    Selisih: {diff > 0 ? '+' : ''}{diff} unit
                  </div>
                )}

                {/* Reason */}
                <div>
                  <label className="form-label text-xs">Reason <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    placeholder="Reason for adjustment..."
                    value={form.reason}
                    onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                    className={`form-input text-sm py-2 ${errors.reason ? 'border-danger' : ''}`}
                  />
                  {errors.reason && <p className="text-xs text-danger mt-1">{errors.reason}</p>}
                </div>

                {/* Remarks */}
                <div>
                  <label className="form-label text-xs">Remarks</label>
                  <textarea
                    rows={3}
                    placeholder="Additional notes (optional)..."
                    value={form.remarks}
                    onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))}
                    className="form-input text-sm py-2 resize-none"
                  />
                </div>
              </form>
            </div>

            {/* Panel Footer — sticky */}
            <div className="flex-shrink-0 px-5 py-4 border-t border-border bg-white flex gap-3">
              <button
                type="button"
                onClick={() => setPanelOpen(false)}
                className="flex-1 btn-ghost border border-border py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="adj-form"
                disabled={submitLoading}
                className="flex-1 btn-primary justify-center py-2 text-sm disabled:opacity-60"
              >
                {submitLoading
                  ? <><Loader2 size={14} className="animate-spin" /> Saving...</>
                  : 'Submit Adjustment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Page Header ── */}
      <div className="bg-white border-b border-border px-4 py-3 sm:px-6 lg:px-8 lg:py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-foreground">Inventory Adjustment</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Manual stock correction with approval workflow and audit trail</p>
          </div>
          <button
            onClick={openPanel}
            className="btn-primary flex items-center gap-2 px-4 py-2 text-sm"
          >
            <Plus size={15} />
            New Adjustment
          </button>
        </div>
      </div>

      {/* ── Main Content: Full-width History Table ── */}
      <div className="px-4 py-4 sm:px-6 sm:py-5 lg:px-8 max-w-screen-xl">
        <div className="card overflow-hidden">
          {/* Table header */}
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-foreground">Adjustment History</h2>
              {isAdmin && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Approve or reject pending adjustments directly from this table
                </p>
              )}
            </div>
            <div className="relative w-60">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search adjustments..."
                value={historySearch}
                onChange={e => { setHistorySearch(e.target.value); setHistoryPage(1); }}
                className="form-input pl-7 text-xs py-1.5"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="bg-muted border-b border-border">
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[160px]">Adj. No</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[130px]">Type</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">SKU / Pallet</th>
                  <th className="text-right px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-14">Prev</th>
                  <th className="text-right px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-14">New</th>
                  <th className="text-right px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-14">Diff</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[110px]">Requested</th>
                  <th className="text-center px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[90px]">Status</th>
                  {isAdmin && (
                    <th className="text-center px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[120px]">Action</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {historyLoading ? (
                  Array.from({ length: 6 }, (_, i) => (
                    <tr key={i} className="border-b border-border">
                      {Array.from({ length: isAdmin ? 9 : 8 }, (_, j) => (
                        <td key={j} className="px-3 py-3">
                          <div className="h-3.5 bg-muted animate-pulse rounded" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : paginatedHistory.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 9 : 8} className="px-3 py-14 text-center text-sm text-muted-foreground">
                      No adjustment records found.
                    </td>
                  </tr>
                ) : (
                  paginatedHistory.map(rec => {
                    const statusKey = rec.approvalStatus?.toLowerCase() ?? 'pending';
                    const badge = statusBadge[statusKey] ?? statusBadge.pending;
                    const qtyDiff = (rec.newQty ?? 0) - (rec.prevQty ?? 0);
                    const isPending = statusKey === 'pending';
                    const dtParts = (rec.requestedAt || rec.createdAt || '').split(' ');

                    return (
                      <tr key={rec.id} className="border-b border-border last:border-0 row-hover">
                        <td className="px-3 py-3 text-xs font-semibold text-info font-tabular whitespace-nowrap">
                          {rec.adjustmentNo}
                        </td>
                        <td className="px-3 py-3 text-xs text-foreground truncate max-w-[130px]" title={rec.adjustmentType}>
                          {rec.adjustmentType}
                        </td>
                        <td className="px-3 py-3 text-xs">
                          <span className="font-semibold text-foreground font-tabular">{rec.skuNumber}</span>
                          {rec.skuName && (
                            <p className="text-muted-foreground text-[10px] truncate max-w-[160px]">{rec.skuName}</p>
                          )}
                          {rec.palletId && (
                            <p className="text-muted-foreground text-[10px] font-tabular truncate max-w-[160px]">{rec.palletId}</p>
                          )}
                        </td>
                        <td className="px-3 py-3 text-xs font-tabular text-right text-muted-foreground">
                          {rec.prevQty}
                        </td>
                        <td className={`px-3 py-3 text-xs font-tabular text-right font-semibold ${qtyDiff > 0 ? 'text-success' : qtyDiff < 0 ? 'text-danger' : 'text-foreground'}`}>
                          {rec.newQty}
                        </td>
                        <td className={`px-3 py-3 text-xs font-tabular text-right font-semibold ${qtyDiff > 0 ? 'text-success' : qtyDiff < 0 ? 'text-danger' : 'text-muted-foreground'}`}>
                          {qtyDiff > 0 ? '+' : ''}{qtyDiff}
                        </td>
                        <td className="px-3 py-3 text-xs text-muted-foreground font-tabular">
                          <div>{dtParts[0] ?? '—'}</div>
                          {dtParts[1] && <div className="text-[10px] opacity-70">{dtParts[1]}</div>}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border whitespace-nowrap ${badge.classes}`}>
                            {badge.icon}
                            {badge.label}
                          </span>
                        </td>
                        {isAdmin && (
                          <td className="px-3 py-3 text-center">
                            {isPending ? (
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => openApprove(rec)}
                                  className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-success hover:bg-success-soft px-1.5 py-0.5 rounded transition-colors whitespace-nowrap border border-green-200"
                                >
                                  <CheckCircle2 size={10} />
                                  Approve
                                </button>
                                <button
                                  onClick={() => openReject(rec)}
                                  className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-danger hover:bg-danger-soft px-1.5 py-0.5 rounded transition-colors whitespace-nowrap border border-red-200"
                                >
                                  <XCircle size={10} />
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">—</span>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30">
            <p className="text-xs text-muted-foreground">
              {filteredHistory.length === 0
                ? 'No records'
                : `Showing ${(historyPage - 1) * ITEMS_PER_PAGE + 1}–${Math.min(historyPage * ITEMS_PER_PAGE, filteredHistory.length)} of ${filteredHistory.length}`}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                disabled={historyPage === 1}
                className="p-1.5 rounded hover:bg-muted disabled:opacity-40"
              >
                <ChevronLeft size={13} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = totalPages <= 5
                  ? i + 1
                  : Math.max(1, Math.min(historyPage - 2, totalPages - 4)) + i;
                return (
                  <button
                    key={page}
                    onClick={() => setHistoryPage(page)}
                    className={`w-7 h-7 rounded text-xs font-semibold ${page === historyPage ? 'bg-primary text-white' : 'hover:bg-muted text-muted-foreground'}`}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                onClick={() => setHistoryPage(p => Math.min(totalPages, p + 1))}
                disabled={historyPage === totalPages || totalPages === 0}
                className="p-1.5 rounded hover:bg-muted disabled:opacity-40"
              >
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
