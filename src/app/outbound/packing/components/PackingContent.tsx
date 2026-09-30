'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, RefreshCw, ChevronLeft, ChevronRight, PlayCircle, AlertTriangle, X, ClipboardList, History, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { getPickingList, type PickingListItem } from '@/lib/services/picking.service';
import PickingProcessModal from '@/app/outbound/picking/components/PickingProcessModal';

const activeBadge: Record<string, { label: string; classes: string }> = {
  pending:       { label: 'Pending',     classes: 'bg-gray-100 text-gray-600 border border-gray-200' },
  'in-progress': { label: 'In Progress', classes: 'bg-amber-50 text-amber-700 border border-amber-200' },
};

const historyBadge: Record<string, { label: string; classes: string; icon: React.ReactNode }> = {
  picked:     { label: 'Picked',     classes: 'bg-success-soft text-success border border-green-200',   icon: <CheckCircle2 size={11} /> },
  cancelled:  { label: 'Cancelled',  classes: 'bg-gray-100 text-gray-500 border border-gray-200',       icon: <XCircle size={11} /> },
  error:      { label: 'Error',      classes: 'bg-danger-soft text-danger border border-red-200',        icon: <AlertTriangle size={11} /> },
  'in-progress': { label: 'Partial', classes: 'bg-amber-50 text-amber-700 border border-amber-200',     icon: <Clock size={11} /> },
};

const ITEMS_PER_PAGE = 8;
const HIST_PER_PAGE  = 8;

export default function PackingContent() {
  const [allItems, setAllItems]       = useState<PickingListItem[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [histSearch, setHistSearch]   = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [histPage, setHistPage]       = useState(1);
  const [processItem, setProcessItem] = useState<PickingListItem | null>(null);
  const [apiError, setApiError]       = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setApiError('');
    try {
      const data = await getPickingList();
      setAllItems(data);
    } catch {
      setApiError('Failed to load picking list. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const active  = allItems.filter(i => i.status === 'pending' || i.status === 'in-progress');
  const history = allItems.filter(i => i.status === 'picked' || i.status === 'cancelled' || i.status === 'error');

  const filteredActive = active.filter(i =>
    !search ||
    i.pickingId.toLowerCase().includes(search.toLowerCase()) ||
    i.skuNumber.toLowerCase().includes(search.toLowerCase()) ||
    i.skuName.toLowerCase().includes(search.toLowerCase())
  );

  const filteredHistory = history.filter(i =>
    !histSearch ||
    i.pickingId.toLowerCase().includes(histSearch.toLowerCase()) ||
    i.skuNumber.toLowerCase().includes(histSearch.toLowerCase()) ||
    i.skuName.toLowerCase().includes(histSearch.toLowerCase()) ||
    i.suggestedPalletId.toLowerCase().includes(histSearch.toLowerCase())
  );

  const totalPages     = Math.max(1, Math.ceil(filteredActive.length / ITEMS_PER_PAGE));
  const histTotalPages = Math.max(1, Math.ceil(filteredHistory.length / HIST_PER_PAGE));
  const paginated      = filteredActive.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const histPaginated  = filteredHistory.slice((histPage - 1) * HIST_PER_PAGE, histPage * HIST_PER_PAGE);

  const handleConfirmed = useCallback((_updated: PickingListItem) => {
    setProcessItem(null);
    void load();
  }, [load]);

  const pendingCount    = active.filter(i => i.status === 'pending').length;
  const inProgressCount = active.filter(i => i.status === 'in-progress').length;

  return (
    <div className="min-h-screen bg-background">

      {processItem && (
        <PickingProcessModal
          item={processItem}
          onClose={() => setProcessItem(null)}
          onConfirmed={handleConfirmed}
        />
      )}

      {/* Page header */}
      <div className="bg-white border-b border-border px-4 py-3 sm:px-6 lg:px-8 lg:py-4 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-lg font-bold text-foreground">Picking Process</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Scan rack &amp; pallet, konfirmasi qty, assign staging location</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="text-muted-foreground">Pending: <strong className="text-gray-700">{pendingCount}</strong></span>
          <span className="text-muted-foreground">In Progress: <strong className="text-amber-600">{inProgressCount}</strong></span>
          <button onClick={load} className="btn-ghost text-xs border border-border flex items-center gap-1.5">
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      <div className="px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6 max-w-screen-2xl space-y-8">

        {/* API error */}
        {apiError && (
          <div className="rounded-lg bg-danger/10 border border-danger/20 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-danger">
              <AlertTriangle size={14} /> {apiError}
            </div>
            <button onClick={() => setApiError('')} className="text-danger/60 hover:text-danger"><X size={14} /></button>
          </div>
        )}

        {/* ── ACTIVE TASKS ─────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <ClipboardList size={15} className="text-primary" />
              Active Tasks
              {filteredActive.length > 0 && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">{filteredActive.length}</span>
              )}
            </h2>
            <div className="relative w-64">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search picking / SKU..."
                value={search}
                onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                className="form-input pl-8 text-xs py-1.5"
              />
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="bg-muted border-b border-border">
                    {['Picking No', 'SKU', 'Req. Qty', 'Picked', 'Suggested Rack', 'Suggested Pallet', 'Status', 'Action'].map(col => (
                      <th key={col} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">Loading...</td>
                    </tr>
                  ) : paginated.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-14 text-center">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <ClipboardList size={32} className="opacity-30" />
                          <p className="text-sm font-medium">Tidak ada active task</p>
                          <p className="text-xs">Semua item sudah dipick atau belum ada picking task.</p>
                        </div>
                      </td>
                    </tr>
                  ) : paginated.map(item => {
                    const badge = activeBadge[item.status] ?? { label: item.status, classes: '' };
                    return (
                      <tr key={item.id} className="border-b border-border last:border-0 row-hover">
                        <td className="px-4 py-3 text-sm font-semibold text-info font-tabular whitespace-nowrap">{item.pickingId}</td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-semibold font-tabular text-foreground">{item.skuNumber}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[150px]">{item.skuName}</p>
                        </td>
                        <td className="px-4 py-3 text-sm font-bold font-tabular text-right">{item.requestedQty}</td>
                        <td className="px-4 py-3 text-sm font-tabular text-right">
                          <span className={item.pickedQty > 0 ? 'text-amber-600 font-semibold' : 'text-muted-foreground'}>
                            {item.pickedQty}
                          </span>
                          <span className="text-muted-foreground text-xs"> / {item.requestedQty}</span>
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold font-tabular">{item.recommendedBin || '—'}</td>
                        <td className="px-4 py-3 text-xs font-tabular text-muted-foreground">{item.suggestedPalletId || '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`status-badge ${badge.classes}`}>{badge.label}</span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setProcessItem(item)}
                            className="text-xs font-semibold text-primary hover:bg-primary/10 px-2 py-1 rounded transition-colors flex items-center gap-1 whitespace-nowrap"
                          >
                            <PlayCircle size={12} /> Process
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30">
              <p className="text-xs text-muted-foreground">
                {filteredActive.length === 0 ? 'No items' : `${(currentPage - 1) * ITEMS_PER_PAGE + 1}–${Math.min(currentPage * ITEMS_PER_PAGE, filteredActive.length)} of ${filteredActive.length}`}
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 rounded hover:bg-muted disabled:opacity-40"><ChevronLeft size={14} /></button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button key={page} onClick={() => setCurrentPage(page)} className={`w-7 h-7 rounded text-xs font-semibold ${page === currentPage ? 'bg-primary text-white' : 'hover:bg-muted text-muted-foreground'}`}>{page}</button>
                ))}
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} className="p-1.5 rounded hover:bg-muted disabled:opacity-40"><ChevronRight size={14} /></button>
              </div>
            </div>
          </div>
        </section>

        {/* ── PICKING HISTORY ──────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <History size={15} className="text-muted-foreground" />
              Picking History
              {history.length > 0 && (
                <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-semibold">{history.length}</span>
              )}
            </h2>
            <div className="relative w-64">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search picking / SKU / pallet..."
                value={histSearch}
                onChange={e => { setHistSearch(e.target.value); setHistPage(1); }}
                className="form-input pl-8 text-xs py-1.5"
              />
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px]">
                <thead>
                  <tr className="bg-muted border-b border-border">
                    {['Picking No', 'SKU', 'Pallet ID', 'Rack Bin', 'Req. Qty', 'Picked Qty', 'Staging', 'Status'].map(col => (
                      <th key={col} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">Loading...</td>
                    </tr>
                  ) : histPaginated.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <History size={28} className="opacity-30" />
                          <p className="text-sm">Belum ada history picking.</p>
                        </div>
                      </td>
                    </tr>
                  ) : histPaginated.map(item => {
                    const badge = historyBadge[item.status] ?? { label: item.status, classes: 'bg-muted text-muted-foreground', icon: null };
                    return (
                      <tr key={item.id} className="border-b border-border last:border-0 row-hover opacity-90">
                        <td className="px-4 py-3 text-sm font-semibold text-info font-tabular whitespace-nowrap">{item.pickingId}</td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-semibold font-tabular text-foreground">{item.skuNumber}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[140px]">{item.skuName}</p>
                        </td>
                        <td className="px-4 py-3 text-xs font-tabular text-foreground">{item.suggestedPalletId || '—'}</td>
                        <td className="px-4 py-3 text-sm font-semibold font-tabular text-foreground">{item.recommendedBin || '—'}</td>
                        <td className="px-4 py-3 text-sm font-tabular text-right text-foreground">{item.requestedQty}</td>
                        <td className="px-4 py-3 text-sm font-tabular text-right">
                          <span className={item.pickedQty === item.requestedQty ? 'text-success font-bold' : 'text-warning font-semibold'}>
                            {item.pickedQty}
                          </span>
                          <span className="text-muted-foreground text-xs"> / {item.requestedQty}</span>
                        </td>
                        <td className="px-4 py-3 text-xs font-tabular text-foreground">
                          {item.stagingLocation || <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`status-badge flex items-center gap-1 w-fit ${badge.classes}`}>
                            {badge.icon}{badge.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30">
              <p className="text-xs text-muted-foreground">
                {filteredHistory.length === 0 ? 'No history' : `${(histPage - 1) * HIST_PER_PAGE + 1}–${Math.min(histPage * HIST_PER_PAGE, filteredHistory.length)} of ${filteredHistory.length}`}
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => setHistPage(p => Math.max(1, p - 1))} disabled={histPage === 1} className="p-1.5 rounded hover:bg-muted disabled:opacity-40"><ChevronLeft size={14} /></button>
                {Array.from({ length: histTotalPages }, (_, i) => i + 1).map(page => (
                  <button key={page} onClick={() => setHistPage(page)} className={`w-7 h-7 rounded text-xs font-semibold ${page === histPage ? 'bg-primary text-white' : 'hover:bg-muted text-muted-foreground'}`}>{page}</button>
                ))}
                <button onClick={() => setHistPage(p => Math.min(histTotalPages, p + 1))} disabled={histPage >= histTotalPages} className="p-1.5 rounded hover:bg-muted disabled:opacity-40"><ChevronRight size={14} /></button>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
