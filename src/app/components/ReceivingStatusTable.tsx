'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Download, ChevronLeft, ChevronRight, RefreshCw, Loader2 } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';

interface ReceivingRecord {
  id: number;
  receivingNumber: string;
  supplierName: string;
  poNumber: string;
  driverName: string;
  vehicleNumber: string;
  warehouseLocation: string;
  receivedDate: string;
  status: string;
  pallets: string[];
  skUs: string[];
  totalQty: number;
}

const STATUS_STYLES: Record<string, string> = {
  Draft: 'bg-blue-50 text-blue-700 border border-blue-200',
  Putaway: 'bg-green-50 text-green-700 border border-green-200',
  Complete: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  Cancelled: 'bg-red-50 text-red-700 border border-red-200',
};

const ITEMS_PER_PAGE = 6;

export default function ReceivingStatusTable() {
  const [records, setRecords] = useState<ReceivingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/receiving`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const payload = await res.json();
      setRecords(Array.isArray(payload?.data) ? payload.data : []);
    } catch (e) {
      setError('Gagal memuat data receiving. Periksa koneksi ke backend.');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = records.filter(r => {
    const q = search.toLowerCase();
    const matchSearch =
      r.receivingNumber.toLowerCase().includes(q) ||
      r.supplierName.toLowerCase().includes(q) ||
      r.poNumber.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const formatDate = (iso: string) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString('id-ID', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return iso; }
  };

  return (
    <div className="mb-24">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-foreground">Receiving History</h3>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="form-input text-xs py-1.5 pr-7 w-auto"
          >
            <option value="all">All Status</option>
            <option value="Draft">Draft</option>
            <option value="Putaway">Putaway</option>
            <option value="Complete">Complete</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="btn-ghost text-xs border border-border flex items-center gap-1.5 py-1.5"
          >
            {loading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
            Refresh
          </button>
          <button className="btn-ghost text-xs border border-border flex items-center gap-1.5 py-1.5">
            <Download size={13} />
            Export
          </button>
        </div>
      </div>

      <div className="relative mb-3">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by Receiving No, Supplier, PO Number..."
          value={search}
          onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
          className="form-input pl-9 text-sm"
        />
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="bg-muted border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Receiving No</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Supplier</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">PO Number</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pallets</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">SKU</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total Qty</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center">
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Loader2 size={16} className="animate-spin" />
                      Memuat data...
                    </div>
                  </td>
                </tr>
              )}
              {!loading && error && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-danger">
                    {error}
                  </td>
                </tr>
              )}
              {!loading && !error && paginated.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <p className="text-sm text-muted-foreground">
                      {records.length === 0
                        ? 'Belum ada data receiving. Submit form di atas untuk memulai.'
                        : 'Tidak ada data yang cocok dengan pencarian.'}
                    </p>
                  </td>
                </tr>
              )}
              {!loading && !error && paginated.map(record => (
                <tr key={record.id} className="border-b border-border last:border-0 row-hover">
                  <td className="px-4 py-3 text-sm font-semibold text-foreground font-tabular">
                    {record.receivingNumber}
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground max-w-[160px]">
                    <span className="truncate block">{record.supplierName || '—'}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground font-tabular">{record.poNumber || '—'}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground font-tabular whitespace-nowrap">
                    {formatDate(record.receivedDate)}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground max-w-[130px]">
                    {record.pallets.length === 0 ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-info font-semibold font-tabular">{record.pallets[0]}</span>
                        {record.pallets.length > 1 && (
                          <span className="text-info">+{record.pallets.length - 1} more</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground max-w-[110px]">
                    <div className="flex flex-col gap-0.5">
                      {record.skUs.slice(0, 2).map((sku, i) => (
                        <span key={i} className="font-tabular">{sku}</span>
                      ))}
                      {record.skUs.length > 2 && (
                        <span className="text-info">+{record.skUs.length - 2} more</span>
                      )}
                      {record.skUs.length === 0 && '—'}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-tabular font-semibold">
                    {record.totalQty}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${STATUS_STYLES[record.status] ?? 'bg-muted text-muted-foreground'}`}>
                      {record.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30">
          <p className="text-xs text-muted-foreground">
            {filtered.length === 0
              ? '0 records'
              : `Showing ${(currentPage - 1) * ITEMS_PER_PAGE + 1}–${Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of ${filtered.length} records`}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded hover:bg-muted disabled:opacity-40 transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-7 h-7 rounded text-xs font-semibold transition-colors ${
                  page === currentPage ? 'bg-primary text-white' : 'hover:bg-muted text-muted-foreground'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded hover:bg-muted disabled:opacity-40 transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
