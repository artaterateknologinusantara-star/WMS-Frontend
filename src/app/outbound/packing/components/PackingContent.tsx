'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, RefreshCw, ChevronLeft, ChevronRight, PlayCircle, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { getPickingList, type PickingListItem } from '@/lib/services/picking.service';
import PickingProcessModal from '@/app/outbound/picking/components/PickingProcessModal';

const statusBadge: Record<string, { label: string; classes: string }> = {
  pending:      { label: 'Pending',      classes: 'bg-warning-soft text-warning border border-yellow-200' },
  'in-progress':{ label: 'In Progress',  classes: 'bg-info-soft text-info border border-blue-200' },
  picked:       { label: 'Picked',       classes: 'bg-success-soft text-success border border-green-200' },
  error:        { label: 'Error',        classes: 'bg-danger-soft text-danger border border-red-200' },
};

const ITEMS_PER_PAGE = 8;

export default function PackingContent() {
  const [items, setItems]             = useState<PickingListItem[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [currentPage, setCurrentPage] = useState(1);
  const [processItem, setProcessItem] = useState<PickingListItem | null>(null);
  const [apiError, setApiError]       = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setApiError('');
    try {
      const data = await getPickingList();
      setItems(data);
    } catch {
      setApiError('Gagal memuat daftar picking. Coba refresh.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = items.filter(i => {
    const matchSearch =
      i.pickingId.toLowerCase().includes(search.toLowerCase()) ||
      i.skuNumber.toLowerCase().includes(search.toLowerCase()) ||
      i.skuName.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === 'all'    ? true :
      statusFilter === 'active' ? (i.status === 'pending' || i.status === 'in-progress') :
      i.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated  = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleConfirmed = (updated: PickingListItem) => {
    setItems(prev => prev.map(i => i.id === updated.id ? updated : i));
    setProcessItem(null);
  };

  const summary = {
    pending:    items.filter(i => i.status === 'pending').length,
    inProgress: items.filter(i => i.status === 'in-progress').length,
    picked:     items.filter(i => i.status === 'picked').length,
  };

  return (
    <div className="min-h-screen bg-background">

      {/* Picking Process Modal */}
      {processItem && (
        <PickingProcessModal
          item={processItem}
          onClose={() => setProcessItem(null)}
          onConfirmed={handleConfirmed}
        />
      )}

      {/* Header */}
      <div className="bg-white border-b border-border px-4 py-3 sm:px-6 lg:px-8 lg:py-4 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-lg font-bold text-foreground">Picking Process</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Eksekusi fisik picking — scan rack, pallet, & tentukan staging location</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="text-muted-foreground">Pending: <strong className="text-warning">{summary.pending}</strong></span>
          <span className="text-muted-foreground">In Progress: <strong className="text-info">{summary.inProgress}</strong></span>
          <span className="text-muted-foreground">Picked: <strong className="text-success">{summary.picked}</strong></span>
          <button onClick={load} className="btn-ghost text-xs border border-border flex items-center gap-1.5">
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      <div className="px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6 max-w-screen-2xl">

        {/* API Error */}
        {apiError && (
          <div className="mb-4 rounded-lg bg-danger/10 border border-danger/20 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-danger">
              <AlertTriangle size={14} /> {apiError}
            </div>
            <button onClick={() => setApiError('')} className="text-danger/60 hover:text-danger"><X size={14} /></button>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari picking ID atau SKU..."
              value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
              className="form-input pl-9 text-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="form-input text-sm py-2 w-auto min-w-[160px]"
          >
            <option value="active">Belum diproses</option>
            <option value="all">Semua Status</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="picked">Picked</option>
            <option value="error">Error</option>
          </select>
          <span className="text-xs text-muted-foreground ml-auto">{filtered.length} item</span>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="bg-muted border-b border-border">
                  {['Picking ID', 'SKU Number', 'SKU Name', 'Req. Qty', 'Recommended Bin', 'Suggested Pallet', 'Picked Qty', 'Status', 'Action'].map(col => (
                    <th key={col} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} className="px-4 py-10 text-center text-sm text-muted-foreground">Memuat data...</td></tr>
                ) : paginated.length === 0 ? (
                  <tr><td colSpan={9} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    {statusFilter === 'active' ? 'Semua picking task sudah diproses.' : 'Tidak ada data.'}
                  </td></tr>
                ) : paginated.map(item => {
                  const badge = statusBadge[item.status] ?? { label: item.status, classes: '' };
                  return (
                    <tr key={item.id} className="border-b border-border last:border-0 row-hover">
                      <td className="px-4 py-3 text-sm font-semibold text-info font-tabular">{item.pickingId}</td>
                      <td className="px-4 py-3 text-sm font-tabular">{item.skuNumber}</td>
                      <td className="px-4 py-3 text-sm max-w-[150px]"><span className="truncate block">{item.skuName}</span></td>
                      <td className="px-4 py-3 text-sm font-bold font-tabular text-right">{item.requestedQty}</td>
                      <td className="px-4 py-3 text-sm font-semibold font-tabular">{item.recommendedBin || '—'}</td>
                      <td className="px-4 py-3 text-sm font-tabular text-muted-foreground">{item.suggestedPalletId || '—'}</td>
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
                            <button
                              onClick={() => setProcessItem(item)}
                              className="text-xs font-semibold text-primary hover:bg-primary/10 px-2 py-1 rounded transition-colors flex items-center gap-1"
                            >
                              <PlayCircle size={12} /> Proses
                            </button>
                          )}
                          {item.status === 'picked' && (
                            <span className="flex items-center gap-1 text-xs text-success px-2">
                              <CheckCircle2 size={12} /> Staging: <strong>{item.stagingLocation || '—'}</strong>
                            </span>
                          )}
                          {item.status === 'error' && (
                            <span className="text-xs text-danger px-2">Error</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30">
            <p className="text-xs text-muted-foreground">
              Showing {filtered.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 rounded hover:bg-muted disabled:opacity-40">
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: Math.max(1, totalPages) }, (_, i) => i + 1).map(page => (
                <button key={page} onClick={() => setCurrentPage(page)}
                  className={`w-7 h-7 rounded text-xs font-semibold ${page === currentPage ? 'bg-primary text-white' : 'hover:bg-muted text-muted-foreground'}`}>
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
    </div>
  );
}
