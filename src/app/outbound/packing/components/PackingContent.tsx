'use client';

import React, { useState } from 'react';
import { Search, Download, RefreshCw, ChevronLeft, ChevronRight, CheckCircle2, Package } from 'lucide-react';

interface PackingItem {
  id: string;
  packingId: string;
  skuNumber: string;
  skuName: string;
  pickedQty: number;
  packedQty: number;
  uom: string;
  status: 'pending' | 'packing' | 'packed' | 'discrepancy';
}

const mockPackingItems: PackingItem[] = [
  { id: 'pack-001', packingId: 'PKG-2026-001', skuNumber: 'SKU-ELC-001', skuName: 'Kabel UTP Cat6 Box', pickedQty: 50, packedQty: 50, uom: 'PCS', status: 'packed' },
  { id: 'pack-002', packingId: 'PKG-2026-001', skuNumber: 'SKU-PKG-012', skuName: 'Bubble Wrap Roll 50m', pickedQty: 20, packedQty: 18, uom: 'ROLL', status: 'discrepancy' },
  { id: 'pack-003', packingId: 'PKG-2026-002', skuNumber: 'SKU-MET-003', skuName: 'Baut Hex M10 x 50mm', pickedQty: 200, packedQty: 0, uom: 'PCS', status: 'pending' },
  { id: 'pack-004', packingId: 'PKG-2026-002', skuNumber: 'SKU-LOG-022', skuName: 'Stretch Film 500m', pickedQty: 10, packedQty: 10, uom: 'ROLL', status: 'packed' },
  { id: 'pack-005', packingId: 'PKG-2026-003', skuNumber: 'SKU-BRK-002', skuName: 'Kardus Box 40x30x30cm', pickedQty: 100, packedQty: 0, uom: 'PCS', status: 'packing' },
];

const statusBadge: Record<string, { label: string; classes: string }> = {
  pending: { label: 'Pending', classes: 'bg-warning-soft text-warning border border-yellow-200' },
  packing: { label: 'Packing', classes: 'bg-info-soft text-info border border-blue-200' },
  packed: { label: 'Packed', classes: 'bg-success-soft text-success border border-green-200' },
  discrepancy: { label: 'Discrepancy', classes: 'bg-danger-soft text-danger border border-red-200' },
};

const ITEMS_PER_PAGE = 8;

export default function PackingContent() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [items, setItems] = useState<PackingItem[]>(mockPackingItems);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState('');

  const filtered = items.filter(i => {
    const matchSearch = i.packingId.toLowerCase().includes(search.toLowerCase()) || i.skuNumber.toLowerCase().includes(search.toLowerCase()) || i.skuName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || i.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleConfirmPack = (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const qty = Number(editQty) || item.pickedQty;
    const newStatus: PackingItem['status'] = qty === item.pickedQty ? 'packed' : 'discrepancy';
    setItems(prev => prev.map(i => i.id === id ? { ...i, packedQty: qty, status: newStatus } : i));
    setEditingId(null);
    setEditQty('');
  };

  const summary = {
    total: items.length,
    packed: items.filter(i => i.status === 'packed').length,
    discrepancy: items.filter(i => i.status === 'discrepancy').length,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b border-border px-4 py-3 sm:px-6 lg:px-8 lg:py-4 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-lg font-bold text-foreground">Packing</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Verify and pack picked items before dispatch</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-4 text-xs">
            <span className="text-muted-foreground">Total: <strong className="text-foreground">{summary.total}</strong></span>
            <span className="text-muted-foreground">Packed: <strong className="text-success">{summary.packed}</strong></span>
            {summary.discrepancy > 0 && <span className="text-muted-foreground">Discrepancy: <strong className="text-danger">{summary.discrepancy}</strong></span>}
          </div>
          <button className="btn-ghost text-xs border border-border flex items-center gap-1.5">
            <RefreshCw size={13} />
            Refresh
          </button>
          <button className="btn-ghost text-xs border border-border flex items-center gap-1.5">
            <Download size={13} />
            Export
          </button>
        </div>
      </div>

      <div className="px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6 max-w-screen-2xl">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" placeholder="Search packing ID, SKU..." value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} className="form-input pl-9 text-sm" />
          </div>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }} className="form-input text-sm py-2 w-auto min-w-[140px]">
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="packing">Packing</option>
            <option value="packed">Packed</option>
            <option value="discrepancy">Discrepancy</option>
          </select>
          <span className="text-xs text-muted-foreground ml-auto">{filtered.length} items</span>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="bg-muted border-b border-border">
                  {['Packing ID', 'SKU Number', 'SKU Name', 'UOM', 'Picked Qty', 'Packed Qty', 'Difference', 'Status', 'Action'].map(col => (
                    <th key={col} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr><td colSpan={9} className="px-4 py-10 text-center text-sm text-muted-foreground">No packing items found.</td></tr>
                ) : paginated.map(item => {
                  const diff = item.packedQty - item.pickedQty;
                  const badge = statusBadge[item.status];
                  const isEditing = editingId === item.id;
                  return (
                    <tr key={item.id} className="border-b border-border last:border-0 row-hover">
                      <td className="px-4 py-3 text-sm font-semibold text-info font-tabular">{item.packingId}</td>
                      <td className="px-4 py-3 text-sm font-tabular text-foreground">{item.skuNumber}</td>
                      <td className="px-4 py-3 text-sm text-foreground max-w-[160px]"><span className="truncate block">{item.skuName}</span></td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{item.uom}</td>
                      <td className="px-4 py-3 text-sm font-bold font-tabular text-right text-foreground">{item.pickedQty}</td>
                      <td className="px-4 py-3 text-right">
                        {isEditing ? (
                          <input type="number" value={editQty} onChange={e => setEditQty(e.target.value)} className="form-input text-sm w-20 text-right py-1" autoFocus />
                        ) : (
                          <span className={`text-sm font-bold font-tabular ${item.packedQty === item.pickedQty && item.packedQty > 0 ? 'text-success' : item.packedQty > 0 ? 'text-danger' : 'text-muted-foreground'}`}>{item.packedQty}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm font-tabular text-right">
                        {item.packedQty > 0 ? (
                          <span className={diff === 0 ? 'text-success font-semibold' : 'text-danger font-semibold'}>{diff === 0 ? '—' : diff > 0 ? `+${diff}` : diff}</span>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`status-badge ${badge.classes}`}>{badge.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="row-actions flex items-center gap-1">
                          {isEditing ? (
                            <>
                              <button onClick={() => handleConfirmPack(item.id)} className="text-xs font-semibold text-success hover:bg-success-soft px-2 py-1 rounded transition-colors flex items-center gap-1">
                                <CheckCircle2 size={12} />
                                Save
                              </button>
                              <button onClick={() => { setEditingId(null); setEditQty(''); }} className="text-xs text-muted-foreground hover:bg-muted px-2 py-1 rounded">Cancel</button>
                            </>
                          ) : (item.status === 'pending' || item.status === 'packing') ? (
                            <button onClick={() => { setEditingId(item.id); setEditQty(String(item.pickedQty)); }} className="text-xs font-semibold text-primary hover:bg-primary/10 px-2 py-1 rounded transition-colors flex items-center gap-1">
                              <Package size={12} />
                              Pack
                            </button>
                          ) : (
                            <span className="text-xs text-muted-foreground italic px-2">Done</span>
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
            <p className="text-xs text-muted-foreground">Showing {filtered.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 rounded hover:bg-muted disabled:opacity-40"><ChevronLeft size={14} /></button>
              {Array.from({ length: Math.max(1, totalPages) }, (_, i) => i + 1).map(page => (
                <button key={page} onClick={() => setCurrentPage(page)} className={`w-7 h-7 rounded text-xs font-semibold ${page === currentPage ? 'bg-primary text-white' : 'hover:bg-muted text-muted-foreground'}`}>{page}</button>
              ))}
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="p-1.5 rounded hover:bg-muted disabled:opacity-40"><ChevronRight size={14} /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
