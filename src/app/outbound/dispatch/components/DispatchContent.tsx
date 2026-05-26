'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Truck, CheckCircle2, Clock, ChevronLeft, ChevronRight,
  Plus, X, AlertTriangle, Loader2, Package, MapPin, FileText, RefreshCw,
} from 'lucide-react';
import {
  getStagingItems, getDispatchList, createDispatch, confirmDispatch,
  type StagingItem, type DispatchRecord,
} from '@/lib/services/dispatch.service';

// ── Status badge config ───────────────────────────────────────────────

const statusBadge: Record<string, { label: string; classes: string; icon: React.ReactNode }> = {
  pending:    { label: 'Pending',    classes: 'bg-warning-soft text-warning border border-yellow-200',  icon: <Clock        size={9} /> },
  dispatched: { label: 'Dispatched', classes: 'bg-success-soft text-success border border-green-200',   icon: <CheckCircle2 size={9} /> },
};

const ITEMS_PER_PAGE = 8;

// ── Helpers ───────────────────────────────────────────────────────────

function formatDate(s: string) {
  if (!s) return '—';
  const parts = s.split(' ');
  return (
    <span>
      {parts[0]}
      {parts[1] && <span className="block text-[10px] opacity-60">{parts[1]}</span>}
    </span>
  );
}

// ══════════════════════════════════════════════════════════════════════

export default function DispatchContent() {
  // ── History ──────────────────────────────────────────────────────────
  const [dispatches, setDispatches]       = useState<DispatchRecord[]>([]);
  const [loading, setLoading]             = useState(false);
  const [page, setPage]                   = useState(1);
  const [search, setSearch]               = useState('');

  // ── New dispatch panel ────────────────────────────────────────────────
  const [panelOpen, setPanelOpen]         = useState(false);
  const [stagingItems, setStagingItems]   = useState<StagingItem[]>([]);
  const [stagingLoading, setStagingLoading] = useState(false);
  const [selectedIds, setSelectedIds]     = useState<Set<number>>(new Set());
  const [driverName, setDriverName]       = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [notes, setNotes]                 = useState('');
  const [panelError, setPanelError]       = useState('');
  const [panelSubmitting, setPanelSubmitting] = useState(false);

  // ── Confirm modal ─────────────────────────────────────────────────────
  const [confirmModal, setConfirmModal]   = useState<{ open: boolean; record: DispatchRecord | null; submitting: boolean; error: string }>({
    open: false, record: null, submitting: false, error: '',
  });

  // ── BAST modal ────────────────────────────────────────────────────────
  const [bastRecord, setBastRecord]       = useState<DispatchRecord | null>(null);

  // ── Load list ─────────────────────────────────────────────────────────

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDispatchList();
      setDispatches(data);
      setPage(1);
    } catch {
      setDispatches([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadList(); }, [loadList]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') { setPanelOpen(false); setConfirmModal(m => ({ ...m, open: false })); setBastRecord(null); } };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  // ── Open panel ────────────────────────────────────────────────────────

  const openPanel = async () => {
    setDriverName(''); setVehicleNumber(''); setNotes('');
    setSelectedIds(new Set()); setPanelError('');
    setPanelOpen(true);
    setStagingLoading(true);
    try {
      const items = await getStagingItems();
      setStagingItems(items);
    } catch {
      setStagingItems([]);
    } finally {
      setStagingLoading(false);
    }
  };

  const toggleItem = (id: number) =>
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  // ── Submit dispatch ───────────────────────────────────────────────────

  const handleCreateDispatch = async () => {
    if (!driverName.trim())     { setPanelError('Driver name is required.'); return; }
    if (!vehicleNumber.trim())  { setPanelError('Vehicle number is required.'); return; }
    if (selectedIds.size === 0) { setPanelError('Select at least one item to dispatch.'); return; }
    setPanelError(''); setPanelSubmitting(true);
    try {
      await createDispatch({
        driverName: driverName.trim(),
        vehicleNumber: vehicleNumber.trim(),
        notes: notes.trim() || undefined,
        pickingDetailIds: [...selectedIds],
      });
      setPanelOpen(false);
      await loadList();
    } catch (err: any) {
      setPanelError(err?.message ?? 'Failed to create dispatch.');
    } finally {
      setPanelSubmitting(false);
    }
  };

  // ── Confirm dispatch ──────────────────────────────────────────────────

  const handleConfirmDispatch = async () => {
    if (!confirmModal.record) return;
    setConfirmModal(m => ({ ...m, submitting: true, error: '' }));
    try {
      const updated = await confirmDispatch(confirmModal.record.id);
      setConfirmModal({ open: false, record: null, submitting: false, error: '' });
      await loadList();
      setBastRecord(updated);
    } catch (err: any) {
      setConfirmModal(m => ({ ...m, submitting: false, error: err?.message ?? 'Failed to confirm dispatch.' }));
    }
  };

  // ── Table filtering ───────────────────────────────────────────────────

  const q = search.trim().toLowerCase();
  const filtered = dispatches.filter(d =>
    [d.dispatchNumber, d.driverName, d.vehicleNumber, d.status]
      .some(v => v?.toLowerCase().includes(q))
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated  = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">

      {/* ── BAST Modal ── */}
      {bastRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl border border-border shadow-2xl w-full max-w-lg">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2 text-success">
                <FileText size={16} />
                <h3 className="text-sm font-bold text-foreground">Berita Acara Serah Terima (BAST)</h3>
              </div>
              <button onClick={() => setBastRecord(null)} className="p-1 rounded hover:bg-muted text-muted-foreground">
                <X size={16} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4 text-xs">
              {/* Header info */}
              <div className="grid grid-cols-2 gap-3 bg-muted rounded-lg p-4">
                <div>
                  <p className="text-muted-foreground">Dispatch No.</p>
                  <p className="font-bold text-info font-tabular">{bastRecord.dispatchNumber}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p className="font-semibold font-tabular">{bastRecord.createdAt}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Driver</p>
                  <p className="font-semibold">{bastRecord.driverName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Vehicle</p>
                  <p className="font-semibold font-tabular">{bastRecord.vehicleNumber}</p>
                </div>
                {bastRecord.notes && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Notes</p>
                    <p className="text-foreground">{bastRecord.notes}</p>
                  </div>
                )}
              </div>

              {/* Items */}
              <table className="w-full text-xs border border-border rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-muted">
                    <th className="text-left px-3 py-2 font-semibold text-muted-foreground uppercase tracking-wide">SKU</th>
                    <th className="text-left px-3 py-2 font-semibold text-muted-foreground uppercase tracking-wide">Pallet</th>
                    <th className="text-left px-3 py-2 font-semibold text-muted-foreground uppercase tracking-wide">Staging</th>
                    <th className="text-right px-3 py-2 font-semibold text-muted-foreground uppercase tracking-wide">Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {bastRecord.items.map((item, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="px-3 py-2">
                        <span className="font-semibold text-foreground">{item.skuCode}</span>
                        <p className="text-muted-foreground text-[10px] truncate max-w-[120px]">{item.skuName}</p>
                      </td>
                      <td className="px-3 py-2 font-tabular text-foreground">{item.palletId}</td>
                      <td className="px-3 py-2 font-tabular text-foreground">{item.stagingBinCode}</td>
                      <td className="px-3 py-2 text-right font-bold font-tabular text-foreground">{item.qty}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border bg-muted">
                    <td colSpan={3} className="px-3 py-2 font-semibold text-foreground">Total</td>
                    <td className="px-3 py-2 text-right font-bold font-tabular text-foreground">
                      {bastRecord.items.reduce((s, i) => s + i.qty, 0)}
                    </td>
                  </tr>
                </tfoot>
              </table>

              <div className="flex gap-3 pt-2">
                <div className="flex-1 border-t border-dashed border-border pt-3 text-center text-muted-foreground text-[10px]">
                  <p className="font-semibold text-foreground mb-6">Pengirim</p>
                  <p>( ........................... )</p>
                </div>
                <div className="flex-1 border-t border-dashed border-border pt-3 text-center text-muted-foreground text-[10px]">
                  <p className="font-semibold text-foreground mb-6">Penerima / Driver</p>
                  <p>( {bastRecord.driverName} )</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-border flex justify-end gap-2">
              <button onClick={() => window.print()} className="btn-ghost border border-border px-4 py-1.5 text-xs flex items-center gap-1.5">
                <FileText size={13} />
                Print
              </button>
              <button onClick={() => setBastRecord(null)} className="btn-primary px-4 py-1.5 text-xs">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Modal ── */}
      {confirmModal.open && confirmModal.record && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4">
          <div className="bg-white rounded-xl border border-border shadow-xl w-full max-w-md">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2 text-success">
              <Truck size={16} />
              <h3 className="text-sm font-bold text-foreground">Confirm Dispatch</h3>
            </div>
            <div className="px-5 py-4 space-y-3 text-xs">
              <div className="bg-muted rounded-lg p-3 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dispatch No.</span>
                  <span className="font-bold text-info font-tabular">{confirmModal.record.dispatchNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Driver</span>
                  <span className="font-semibold">{confirmModal.record.driverName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vehicle</span>
                  <span className="font-semibold font-tabular">{confirmModal.record.vehicleNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Items</span>
                  <span className="font-semibold">{confirmModal.record.items.length} SKU — {confirmModal.record.items.reduce((s, i) => s + i.qty, 0)} pcs</span>
                </div>
              </div>
              <p className="text-muted-foreground">
                Confirming will mark all staged inventory as <strong className="text-foreground">Dispatched</strong> and generate a BAST document. This action cannot be undone.
              </p>
              {confirmModal.error && (
                <div className="flex items-center gap-2 bg-danger-soft border border-red-200 rounded px-3 py-2 text-danger">
                  <AlertTriangle size={13} /> {confirmModal.error}
                </div>
              )}
            </div>
            <div className="px-5 py-3 border-t border-border flex justify-end gap-2">
              <button
                onClick={() => setConfirmModal(m => ({ ...m, open: false }))}
                disabled={confirmModal.submitting}
                className="btn-ghost border border-border px-4 py-1.5 text-xs disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDispatch}
                disabled={confirmModal.submitting}
                className="bg-success text-white text-xs font-semibold px-4 py-1.5 rounded hover:bg-success/90 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {confirmModal.submitting ? <Loader2 size={12} className="animate-spin" /> : <Truck size={12} />}
                Confirm Dispatch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── New Dispatch Slide-over Panel ── */}
      {panelOpen && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setPanelOpen(false)} />
          <div className="relative w-full max-w-md bg-white shadow-2xl flex flex-col h-full">

            {/* Panel header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
              <div>
                <h2 className="text-sm font-bold text-foreground">New Dispatch</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Select staged items and assign driver</p>
              </div>
              <button onClick={() => setPanelOpen(false)} className="p-1.5 rounded hover:bg-muted text-muted-foreground">
                <X size={16} />
              </button>
            </div>

            {/* Panel body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

              {/* Driver & vehicle */}
              <div className="space-y-3">
                <div>
                  <label className="form-label text-xs">Driver Name <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    placeholder="e.g. Budi Santoso"
                    value={driverName}
                    onChange={e => setDriverName(e.target.value)}
                    className="form-input text-sm py-2"
                  />
                </div>
                <div>
                  <label className="form-label text-xs">Vehicle Number <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    placeholder="e.g. B-9999-WMS"
                    value={vehicleNumber}
                    onChange={e => setVehicleNumber(e.target.value)}
                    className="form-input text-sm py-2"
                  />
                </div>
                <div>
                  <label className="form-label text-xs">Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Additional shipment notes..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="form-input text-sm py-2 resize-none"
                  />
                </div>
              </div>

              {/* Staged items checklist */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="form-label text-xs mb-0">Staged Items <span className="text-danger">*</span></label>
                  {stagingItems.length > 0 && (
                    <button
                      onClick={() => {
                        if (selectedIds.size === stagingItems.length)
                          setSelectedIds(new Set());
                        else
                          setSelectedIds(new Set(stagingItems.map(i => i.pickingDetailId)));
                      }}
                      className="text-[11px] text-primary hover:underline"
                    >
                      {selectedIds.size === stagingItems.length ? 'Deselect all' : 'Select all'}
                    </button>
                  )}
                </div>

                {stagingLoading ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground py-6 justify-center">
                    <Loader2 size={14} className="animate-spin" /> Loading staged items...
                  </div>
                ) : stagingItems.length === 0 ? (
                  <div className="text-xs text-muted-foreground text-center py-8 border border-dashed border-border rounded-lg">
                    No items in Outbound Staging. Complete picking first.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {stagingItems.map(item => {
                      const selected = selectedIds.has(item.pickingDetailId);
                      return (
                        <label
                          key={item.pickingDetailId}
                          className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selected ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}`}
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleItem(item.pickingDetailId)}
                            className="mt-0.5 accent-primary"
                          />
                          <div className="flex-1 min-w-0 text-xs">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-foreground font-tabular">{item.skuCode}</span>
                              <span className="font-bold text-foreground font-tabular">{item.qty} pcs</span>
                            </div>
                            <p className="text-muted-foreground truncate">{item.skuName}</p>
                            <div className="flex gap-3 mt-1 text-muted-foreground">
                              <span className="flex items-center gap-1"><MapPin size={10} />{item.stagingBinCode}</span>
                              <span className="flex items-center gap-1"><Package size={10} />{item.palletId}</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground">{item.pickingNumber}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {panelError && (
                <div className="flex items-start gap-2 bg-danger-soft border border-red-200 rounded-lg px-3 py-2 text-danger text-xs">
                  <AlertTriangle size={13} className="mt-0.5 flex-shrink-0" />
                  {panelError}
                </div>
              )}
            </div>

            {/* Panel footer */}
            <div className="flex-shrink-0 px-5 py-4 border-t border-border bg-white flex gap-3">
              {selectedIds.size > 0 && (
                <p className="text-xs text-muted-foreground self-center flex-1">
                  {selectedIds.size} item{selectedIds.size > 1 ? 's' : ''} selected
                </p>
              )}
              <button
                onClick={() => setPanelOpen(false)}
                className={`btn-ghost border border-border py-2 text-sm ${selectedIds.size > 0 ? '' : 'flex-1'}`}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateDispatch}
                disabled={panelSubmitting}
                className="flex-1 btn-primary justify-center py-2 text-sm disabled:opacity-60 flex items-center gap-2"
              >
                {panelSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Truck size={14} />}
                Create Dispatch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Page Header ── */}
      <div className="bg-white border-b border-border px-4 py-3 sm:px-6 lg:px-8 lg:py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-foreground">Dispatch</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Confirm outbound shipments and generate BAST documents</p>
          </div>
          <button onClick={openPanel} className="btn-primary flex items-center gap-2 px-4 py-2 text-sm">
            <Plus size={15} />
            New Dispatch
          </button>
        </div>
      </div>

      {/* ── Main: Dispatch History Table ── */}
      <div className="px-4 py-4 sm:px-6 sm:py-5 lg:px-8 max-w-screen-xl">
        <div className="card overflow-hidden">

          {/* Table toolbar */}
          <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-foreground">Dispatch History</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Pending dispatches can be confirmed below</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={loadList}
                disabled={loading}
                className="btn-ghost border border-border p-1.5 rounded disabled:opacity-40"
                title="Refresh"
              >
                <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              </button>
              <div className="relative w-52">
                <input
                  type="text"
                  placeholder="Search dispatch..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                  className="form-input pl-3 text-xs py-1.5"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="bg-muted border-b border-border">
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[140px]">Dispatch No.</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Driver</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[120px]">Vehicle</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Items</th>
                  <th className="text-right px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-16">Total Qty</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[100px]">Created</th>
                  <th className="text-center px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[90px]">Status</th>
                  <th className="text-center px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[130px]">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }, (_, i) => (
                    <tr key={i} className="border-b border-border">
                      {Array.from({ length: 8 }, (_, j) => (
                        <td key={j} className="px-3 py-3"><div className="h-3.5 bg-muted animate-pulse rounded" /></td>
                      ))}
                    </tr>
                  ))
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-14 text-center text-sm text-muted-foreground">
                      No dispatch records found.
                    </td>
                  </tr>
                ) : (
                  paginated.map(rec => {
                    const key    = rec.status?.toLowerCase() as keyof typeof statusBadge;
                    const badge  = statusBadge[key] ?? statusBadge.pending;
                    const total  = rec.items.reduce((s, i) => s + i.qty, 0);
                    const isPending = key === 'pending';

                    return (
                      <tr key={rec.id} className="border-b border-border last:border-0 row-hover">
                        <td className="px-3 py-3 text-xs font-semibold text-info font-tabular whitespace-nowrap">
                          {rec.dispatchNumber}
                        </td>
                        <td className="px-3 py-3 text-xs text-foreground">{rec.driverName}</td>
                        <td className="px-3 py-3 text-xs font-tabular text-foreground">{rec.vehicleNumber}</td>
                        <td className="px-3 py-3 text-xs text-muted-foreground">
                          {rec.items.map((item, i) => (
                            <span key={i} className="block font-tabular">
                              {item.skuCode} <span className="text-foreground font-semibold">×{item.qty}</span>
                              {item.stagingBinCode && <span className="text-[10px] ml-1 opacity-60">[{item.stagingBinCode}]</span>}
                            </span>
                          ))}
                        </td>
                        <td className="px-3 py-3 text-xs font-bold font-tabular text-right text-foreground">{total}</td>
                        <td className="px-3 py-3 text-xs font-tabular text-muted-foreground">{formatDate(rec.createdAt)}</td>
                        <td className="px-3 py-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border whitespace-nowrap ${badge.classes}`}>
                            {badge.icon} {badge.label}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {isPending && (
                              <button
                                onClick={() => setConfirmModal({ open: true, record: rec, submitting: false, error: '' })}
                                className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-success hover:bg-success-soft px-2 py-0.5 rounded border border-green-200 transition-colors whitespace-nowrap"
                              >
                                <Truck size={10} /> Confirm
                              </button>
                            )}
                            <button
                              onClick={() => setBastRecord(rec)}
                              className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-primary hover:bg-primary/10 px-2 py-0.5 rounded border border-blue-200 transition-colors whitespace-nowrap"
                            >
                              <FileText size={10} /> BAST
                            </button>
                          </div>
                        </td>
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
              {filtered.length === 0
                ? 'No records'
                : `Showing ${(page - 1) * ITEMS_PER_PAGE + 1}–${Math.min(page * ITEMS_PER_PAGE, filtered.length)} of ${filtered.length}`}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded hover:bg-muted disabled:opacity-40">
                <ChevronLeft size={13} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = totalPages <= 5 ? i + 1 : Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                return (
                  <button key={p} onClick={() => setPage(p)} className={`w-7 h-7 rounded text-xs font-semibold ${p === page ? 'bg-primary text-white' : 'hover:bg-muted text-muted-foreground'}`}>
                    {p}
                  </button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0} className="p-1.5 rounded hover:bg-muted disabled:opacity-40">
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
