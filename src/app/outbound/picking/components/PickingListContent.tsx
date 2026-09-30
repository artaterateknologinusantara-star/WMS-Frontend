'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Search, Download, RefreshCw, Plus, ChevronLeft, ChevronRight, AlertTriangle, CheckCircle2, XCircle, X, PlayCircle, Loader2, Package, MapPin } from 'lucide-react';
import {
  getPickingList,
  createPicking,
  checkStock,
  type PickingListItem,
  type CreatePickingRequest,
  type StockCheckResult,
} from '@/lib/services/picking.service';


const statusBadge: Record<string, { label: string; classes: string }> = {
  pending: { label: 'Pending', classes: 'bg-warning-soft text-warning border border-yellow-200' },
  'in-progress': { label: 'In Progress', classes: 'bg-info-soft text-info border border-blue-200' },
  picked: { label: 'Picked', classes: 'bg-success-soft text-success border border-green-200' },
  error: { label: 'Error', classes: 'bg-danger-soft text-danger border border-red-200' },
};

const ITEMS_PER_PAGE = 8;

interface CreateFormState {
  skuNumber: string;
  requestedQty: string;
  assignedTo: string;
}

export default function PickingListContent() {
  const [items, setItems] = useState<PickingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [loadError, setLoadError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<CreateFormState>({
    skuNumber: '',
    requestedQty: '',
    assignedTo: '',
  });
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [skuCheck, setSkuCheck] = useState<StockCheckResult | null | 'not-found'>(null);
  const [skuChecking, setSkuChecking] = useState(false);
  const [createSuccess, setCreateSuccess] = useState<PickingListItem[] | null>(null);
  const skuDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadPickingList = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPickingList();
      setItems(data);
    } catch {
      setLoadError('Failed to load picking list. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPickingList();
  }, [loadPickingList]);

  const filtered = items.filter(i => {
    const matchSearch =
      i.pickingId.toLowerCase().includes(search.toLowerCase()) ||
      i.skuNumber.toLowerCase().includes(search.toLowerCase()) ||
      i.skuName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || i.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleSkuChange = (value: string) => {
    setCreateForm(f => ({ ...f, skuNumber: value }));
    setCreateErrors(e => ({ ...e, skuNumber: '' }));
    setSkuCheck(null);
    if (skuDebounceRef.current) clearTimeout(skuDebounceRef.current);
    if (!value.trim()) return;
    skuDebounceRef.current = setTimeout(async () => {
      setSkuChecking(true);
      try {
        const result = await checkStock(value.trim());
        setSkuCheck(result ?? 'not-found');
      } catch {
        setSkuCheck('not-found');
      } finally {
        setSkuChecking(false);
      }
    }, 600);
  };

  const handleCreateSubmit = async () => {
    const errs: Record<string, string> = {};
    const qty = Number(createForm.requestedQty);

    if (!createForm.skuNumber.trim()) errs.skuNumber = 'SKU Number wajib diisi';
    else if (skuCheck === 'not-found') errs.skuNumber = `SKU '${createForm.skuNumber}' tidak ditemukan di sistem`;
    else if (skuCheck === null && !skuChecking) errs.skuNumber = 'Ketik kode SKU dan tunggu validasi';

    if (!createForm.requestedQty || qty <= 0) {
      errs.requestedQty = 'Jumlah harus lebih dari 0';
    } else if (skuCheck && skuCheck !== 'not-found' && qty > skuCheck.availableQty) {
      errs.requestedQty = `Stok tidak mencukupi. Total tersedia: ${skuCheck.availableQty} units untuk SKU ini`;
    }

    if (!createForm.assignedTo.trim()) errs.assignedTo = 'Assigned To wajib diisi';

    if (Object.keys(errs).length > 0) {
      setCreateErrors(errs);
      return;
    }

    setSubmitting(true);
    try {
      const req: CreatePickingRequest = {
        skuCode: createForm.skuNumber.trim(),
        requestedQty: qty,
        assignedTo: createForm.assignedTo.trim(),
      };
      const newItems = await createPicking(req);
      setItems(prev => [...newItems, ...prev]);
      setCreateSuccess(newItems);
      setCreateErrors({});
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create picking';
      setCreateErrors({ submit: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setCreateForm({ skuNumber: '', requestedQty: '', assignedTo: '' });
    setCreateErrors({});
    setSkuCheck(null);
    setSkuChecking(false);
    setCreateSuccess(null);
    if (skuDebounceRef.current) clearTimeout(skuDebounceRef.current);
  };

  const summary = {
    total: items.length,
    pending: items.filter(i => i.status === 'pending').length,
    inProgress: items.filter(i => i.status === 'in-progress').length,
    picked: items.filter(i => i.status === 'picked').length,
    error: items.filter(i => i.status === 'error').length,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b border-border px-4 py-3 sm:px-6 lg:px-8 lg:py-4 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-lg font-bold text-foreground">Picking List</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Outbound picking tasks and barcode validation</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-4 text-xs">
            <span className="text-muted-foreground">Pending: <strong className="text-warning">{summary.pending}</strong></span>
            <span className="text-muted-foreground">In Progress: <strong className="text-info">{summary.inProgress}</strong></span>
            <span className="text-muted-foreground">Picked: <strong className="text-success">{summary.picked}</strong></span>
            {summary.error > 0 && <span className="text-muted-foreground">Error: <strong className="text-danger">{summary.error}</strong></span>}
          </div>
          <button onClick={loadPickingList} className="btn-ghost text-xs border border-border flex items-center gap-1.5">
            <RefreshCw size={13} />
            Refresh
          </button>
          <button className="btn-ghost text-xs border border-border flex items-center gap-1.5">
            <Download size={13} />
            Export
          </button>
          <button onClick={() => setShowCreateModal(true)} className="btn-accent text-xs flex items-center gap-1.5">
            <Plus size={13} />
            Create Picking
          </button>
        </div>
      </div>

      <div className="px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6 max-w-screen-2xl">
        {loadError && (
          <div className="mb-4 rounded-lg bg-danger/10 border border-danger/20 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-danger">
              <AlertTriangle size={14} /> {loadError}
            </div>
            <button onClick={() => setLoadError('')} className="text-danger/60 hover:text-danger"><X size={14} /></button>
          </div>
        )}
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search picking ID, SKU..."
              value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
              className="form-input pl-9 text-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="form-input text-sm py-2 w-auto min-w-[140px]"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="picked">Picked</option>
            <option value="error">Error</option>
          </select>
          <span className="text-xs text-muted-foreground ml-auto">{filtered.length} items</span>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="bg-muted border-b border-border">
                  {['Picking ID', 'SKU Number', 'SKU Name', 'Requested Qty', 'Recommended Bin', 'Pallet ID', 'Picked Qty', 'Picking Status', 'Action'].map(col => (
                    <th key={col} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-sm text-muted-foreground">
                      Loading picking list...
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-sm text-muted-foreground">
                      No picking items found.
                    </td>
                  </tr>
                ) : paginated.map(item => {
                  const badge = statusBadge[item.status] ?? { label: item.status, classes: '' };
                  return (
                    <tr key={item.id} className="border-b border-border last:border-0 row-hover">
                      <td className="px-4 py-3 text-sm font-semibold text-info font-tabular">{item.pickingId}</td>
                      <td className="px-4 py-3 text-sm font-tabular text-foreground">{item.skuNumber}</td>
                      <td className="px-4 py-3 text-sm text-foreground max-w-[160px]"><span className="truncate block">{item.skuName}</span></td>
                      <td className="px-4 py-3 text-sm font-bold font-tabular text-right text-foreground">{item.requestedQty}</td>
                      <td className="px-4 py-3 text-sm font-semibold font-tabular text-foreground">{item.recommendedBin || '—'}</td>
                      <td className="px-4 py-3 text-sm font-tabular text-foreground">{item.suggestedPalletId}</td>
                      <td className="px-4 py-3 text-sm font-tabular text-right">
                        <span className={item.pickedQty === item.requestedQty ? 'text-success font-bold' : 'text-muted-foreground'}>
                          {item.pickedQty}
                        </span>
                        <span className="text-muted-foreground text-xs"> / {item.requestedQty}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`status-badge ${badge.classes}`}>{badge.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="row-actions flex items-center gap-1">
                          {(item.status === 'pending' || item.status === 'in-progress') && (
                            <Link
                              href="/outbound/packing"
                              className="text-xs font-semibold text-primary hover:bg-primary/10 px-2 py-1 rounded transition-colors flex items-center gap-1"
                            >
                              <PlayCircle size={12} />
                              Proses
                            </Link>
                          )}
                          {item.status === 'error' && (
                            <span className="text-xs text-danger px-2 flex items-center gap-1">
                              <XCircle size={12} /> Error
                            </span>
                          )}
                          {item.status === 'picked' && (
                            <span className="flex items-center gap-1 text-xs text-success px-2">
                              <CheckCircle2 size={12} /> Staging: <strong>{item.stagingLocation || '—'}</strong>
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30">
            <p className="text-xs text-muted-foreground">
              Showing {filtered.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 rounded hover:bg-muted disabled:opacity-40">
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: Math.max(1, totalPages) }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-7 h-7 rounded text-xs font-semibold ${page === currentPage ? 'bg-primary text-white' : 'hover:bg-muted text-muted-foreground'}`}
                >
                  {page}
                </button>
              ))}
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="p-1.5 rounded hover:bg-muted disabled:opacity-40">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Create Picking Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-lg border border-border shadow-lg w-full max-w-md mx-4 animate-fade-in">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">
                {createSuccess ? 'Picking List Dibuat' : 'Create Picking List'}
              </h3>
              <button onClick={handleCloseModal} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
            </div>

            {createSuccess ? (
              /* ── Success state ── */
              <div className="px-5 py-5 space-y-4">
                <div className="flex items-center gap-2 text-success">
                  <CheckCircle2 size={20} />
                  <span className="text-sm font-semibold">
                    {createSuccess.length === 1
                      ? 'Picking berhasil dibuat!'
                      : `Picking berhasil dibuat — ${createSuccess.length} task dari ${createSuccess.length} pallet`}
                  </span>
                </div>

                {/* Summary header row */}
                <div className="rounded-lg border border-border bg-muted/30 divide-y divide-border text-sm">
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Picking ID</span>
                    <span className="font-bold text-info font-tabular">{createSuccess[0].pickingId}</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">SKU</span>
                    <span className="font-semibold text-foreground">{createSuccess[0].skuNumber}</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Total Qty</span>
                    <span className="font-bold text-foreground font-tabular">
                      {createSuccess.reduce((s, i) => s + i.requestedQty, 0)} units
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Assigned To</span>
                    <span className="font-semibold text-foreground">{createSuccess[0].assignedTo}</span>
                  </div>
                </div>

                {/* Per-pallet breakdown */}
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pallet &amp; Bin</p>
                  {createSuccess.map((item, idx) => (
                    <div key={item.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 bg-white text-xs">
                      <span className="text-muted-foreground font-medium">Task {idx + 1}</span>
                      <span className="flex items-center gap-2 text-foreground">
                        <span className="flex items-center gap-1 font-tabular"><Package size={11} />{item.suggestedPalletId || '—'}</span>
                        <span className="text-muted-foreground">→</span>
                        <span className="flex items-center gap-1 font-tabular"><MapPin size={11} />{item.recommendedBin || '—'}</span>
                        <span className="font-bold text-primary">{item.requestedQty} pcs</span>
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => {
                      setCreateSuccess(null);
                      setCreateForm({ skuNumber: '', requestedQty: '', assignedTo: '' });
                      setSkuCheck(null);
                    }}
                    className="btn-ghost text-sm border border-border flex-1 justify-center"
                  >
                    Buat Lagi
                  </button>
                  <button onClick={handleCloseModal} className="btn-primary text-sm flex-1 justify-center">
                    Selesai
                  </button>
                </div>
              </div>
            ) : (
              /* ── Form state ── */
              <>
                <div className="px-5 py-4 space-y-3">
                  {/* Info banner */}
                  <div className="rounded-lg bg-info/10 border border-info/20 px-3 py-2 text-xs text-info">
                    Sistem akan otomatis memilih rack &amp; pallet terbaik (FIFO). Tidak perlu scan pallet di tahap ini.
                  </div>

                  {/* Submit error */}
                  {createErrors.submit && (
                    <div className="rounded-lg bg-danger/10 border border-danger/20 px-3 py-2 text-xs text-danger flex items-start gap-1.5">
                      <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                      {createErrors.submit}
                    </div>
                  )}

                  {/* SKU Number */}
                  <div>
                    <label className="form-label text-xs">SKU Number <span className="text-danger">*</span></label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Scan atau ketik kode SKU..."
                        value={createForm.skuNumber}
                        onChange={e => handleSkuChange(e.target.value)}
                        className={`form-input text-sm pr-8 ${createErrors.skuNumber ? 'border-danger' : skuCheck && skuCheck !== 'not-found' ? 'border-success' : ''}`}
                      />
                      {skuChecking && (
                        <Loader2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground" />
                      )}
                      {!skuChecking && skuCheck && skuCheck !== 'not-found' && (
                        <CheckCircle2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-success" />
                      )}
                      {!skuChecking && skuCheck === 'not-found' && (
                        <XCircle size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-danger" />
                      )}
                    </div>
                    {createErrors.skuNumber && (
                      <p className="text-xs text-danger mt-1 flex items-center gap-1"><AlertTriangle size={11} />{createErrors.skuNumber}</p>
                    )}
                    {!createErrors.skuNumber && skuCheck && skuCheck !== 'not-found' && (
                      <p className="text-xs text-success mt-1 flex items-center gap-1">
                        <CheckCircle2 size={11} />
                        <strong>{skuCheck.skuName}</strong> — Stok tersedia: <strong>{skuCheck.availableQty} units</strong>
                      </p>
                    )}
                  </div>

                  {/* Requested Quantity */}
                  <div>
                    <label className="form-label text-xs">Requested Quantity <span className="text-danger">*</span></label>
                    {createErrors.requestedQty && (
                      <p className="text-xs text-danger mb-1 flex items-center gap-1"><AlertTriangle size={11} />{createErrors.requestedQty}</p>
                    )}
                    <input
                      type="number"
                      placeholder="0"
                      min={1}
                      value={createForm.requestedQty}
                      onChange={e => {
                        setCreateForm(f => ({ ...f, requestedQty: e.target.value }));
                        setCreateErrors(er => ({ ...er, requestedQty: '' }));
                      }}
                      className={`form-input text-sm ${createErrors.requestedQty ? 'border-danger' : ''}`}
                    />
                    {!createErrors.requestedQty && skuCheck && skuCheck !== 'not-found' && createForm.requestedQty && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Package size={11} />
                        Sistem akan otomatis split pallet jika dibutuhkan (FIFO)
                      </p>
                    )}
                  </div>

                  {/* Assigned To */}
                  <div>
                    <label className="form-label text-xs">Assigned To <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      placeholder="Nama operator..."
                      value={createForm.assignedTo}
                      onChange={e => {
                        setCreateForm(f => ({ ...f, assignedTo: e.target.value }));
                        setCreateErrors(er => ({ ...er, assignedTo: '' }));
                      }}
                      className={`form-input text-sm ${createErrors.assignedTo ? 'border-danger' : ''}`}
                    />
                    {createErrors.assignedTo && <p className="text-xs text-danger mt-1 flex items-center gap-1"><AlertTriangle size={11} />{createErrors.assignedTo}</p>}
                  </div>
                </div>
                <div className="px-5 py-4 border-t border-border flex justify-end gap-2">
                  <button onClick={handleCloseModal} disabled={submitting} className="btn-ghost text-sm border border-border">Cancel</button>
                  <button
                    onClick={handleCreateSubmit}
                    disabled={submitting || skuChecking}
                    className="btn-primary text-sm disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {submitting && <Loader2 size={13} className="animate-spin" />}
                    {submitting ? 'Membuat...' : 'Buat Picking'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
