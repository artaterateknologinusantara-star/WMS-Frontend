'use client';

import React, { useState } from 'react';
import { Search, Filter, Download, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';

interface ReceivingRecord {
  id: string;
  orderId: string;
  supplier: string;
  poNumber: string;
  dateTime: string;
  pic: string;
  palletId: string;
  skus: string[];
  status: string;
}

const mockReceivingData: ReceivingRecord[] = [
  {
    id: 'rcv-001',
    orderId: 'RCV-2026-001',
    supplier: 'PT. Electronic Supplies',
    poNumber: 'PO-2026-145',
    dateTime: '2026-05-10 09:30:00',
    pic: 'Ahmad Fauzi',
    palletId: 'PLT-20260510-001',
    skus: ['SKU-ELC-001', 'SKU-ELC-005'],
    status: 'putaway-complete',
  },
  {
    id: 'rcv-002',
    orderId: 'RCV-2026-002',
    supplier: 'CV. Maju Bersama',
    poNumber: 'PO-2026-146',
    dateTime: '2026-05-10 10:15:00',
    pic: 'Budi Santoso',
    palletId: 'PLT-20260510-002',
    skus: ['SKU-PKG-012'],
    status: 'pallet-generated',
  },
  {
    id: 'rcv-003',
    orderId: 'RCV-2026-003',
    supplier: 'PT. Sumber Makmur',
    poNumber: 'PO-2026-147',
    dateTime: '2026-05-10 11:00:00',
    pic: 'Dewi Rahayu',
    palletId: 'PLT-20260510-003',
    skus: ['SKU-CHM-007', 'SKU-CHM-008', 'SKU-CHM-009'],
    status: 'receiving',
  },
  {
    id: 'rcv-004',
    orderId: 'RCV-2026-004',
    supplier: 'UD. Karya Agung',
    poNumber: 'PO-2026-148',
    dateTime: '2026-05-10 11:45:00',
    pic: 'Eko Prasetyo',
    palletId: '—',
    skus: ['SKU-MET-003'],
    status: 'pending',
  },
  {
    id: 'rcv-005',
    orderId: 'RCV-2026-005',
    supplier: 'PT. Logistik Prima',
    poNumber: 'PO-2026-149',
    dateTime: '2026-05-10 12:30:00',
    pic: 'Fitri Handayani',
    palletId: 'PLT-20260510-005',
    skus: ['SKU-LOG-021', 'SKU-LOG-022'],
    status: 'putaway-assigned',
  },
  {
    id: 'rcv-006',
    orderId: 'RCV-2026-006',
    supplier: 'CV. Teknologi Nusantara',
    poNumber: 'PO-2026-150',
    dateTime: '2026-05-10 13:10:00',
    pic: 'Gunawan Hadi',
    palletId: 'PLT-20260510-006',
    skus: ['SKU-TKN-044'],
    status: 'unmatched',
  },
  {
    id: 'rcv-007',
    orderId: 'RCV-2026-007',
    supplier: 'PT. Abadi Jaya',
    poNumber: 'PO-2026-151',
    dateTime: '2026-05-10 14:00:00',
    pic: 'Hendra Wijaya',
    palletId: '—',
    skus: ['SKU-ABJ-015', 'SKU-ABJ-016'],
    status: 'pending',
  },
  {
    id: 'rcv-008',
    orderId: 'RCV-2026-008',
    supplier: 'PT. Global Distribusi',
    poNumber: 'PO-2026-152',
    dateTime: '2026-05-10 14:45:00',
    pic: 'Indah Permata',
    palletId: 'PLT-20260510-008',
    skus: ['SKU-GLD-033'],
    status: 'pallet-generated',
  },
  {
    id: 'rcv-009',
    orderId: 'RCV-2026-009',
    supplier: 'UD. Berkah Sejati',
    poNumber: 'PO-2026-153',
    dateTime: '2026-05-10 15:20:00',
    pic: 'Joko Susanto',
    palletId: 'PLT-20260510-009',
    skus: ['SKU-BRK-002', 'SKU-BRK-003', 'SKU-BRK-004'],
    status: 'putaway-complete',
  },
  {
    id: 'rcv-010',
    orderId: 'RCV-2026-010',
    supplier: 'PT. Mandiri Logistik',
    poNumber: 'PO-2026-154',
    dateTime: '2026-05-10 16:00:00',
    pic: 'Kartini Dewi',
    palletId: '—',
    skus: ['SKU-MDL-055'],
    status: 'pending',
  },
];

export default function ReceivingStatusTable() {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const itemsPerPage = 6;

  const filtered = mockReceivingData.filter(r => {
    const matchSearch =
      r.orderId.toLowerCase().includes(search.toLowerCase()) ||
      r.supplier.toLowerCase().includes(search.toLowerCase()) ||
      r.poNumber.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="mb-24">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-foreground">Receiving Status</h3>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="form-input text-xs py-1.5 pr-7 w-auto"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="receiving">Receiving</option>
            <option value="pallet-generated">Pallet Generated</option>
            <option value="putaway-assigned">Putaway Assigned</option>
            <option value="putaway-complete">Putaway Complete</option>
            <option value="unmatched">Unmatched</option>
          </select>
          <button className="btn-ghost text-xs border border-border flex items-center gap-1.5 py-1.5">
            <Filter size={13} />
            Filter
          </button>
          <button className="btn-ghost text-xs border border-border flex items-center gap-1.5 py-1.5">
            <Download size={13} />
            Export
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by Order ID, Supplier, PO Number..."
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
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Order ID</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Supplier</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">PO Number</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date Time</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">PIC</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pallet ID</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">SKU</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(record => (
                <tr key={record.id} className="border-b border-border last:border-0 row-hover">
                  <td className="px-4 py-3 text-sm font-semibold text-foreground font-tabular">{record.orderId}</td>
                  <td className="px-4 py-3 text-sm text-foreground max-w-[160px]">
                    <span className="truncate block">{record.supplier}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground font-tabular">{record.poNumber}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground font-tabular whitespace-nowrap">{record.dateTime}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{record.pic}</td>
                  <td className="px-4 py-3 text-sm font-tabular">
                    {record.palletId !== '—' ? (
                      <span className="text-info font-semibold">{record.palletId}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground max-w-[120px]">
                    <div className="flex flex-col gap-0.5">
                      {record.skus.slice(0, 2).map(sku => (
                        <span key={`sku-${record.id}-${sku}`} className="font-tabular">{sku}</span>
                      ))}
                      {record.skus.length > 2 && (
                        <span className="text-info">+{record.skus.length - 2} more</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={record.status} />
                  </td>
                  <td className="px-4 py-3">
                    <button className="text-xs font-semibold text-info hover:text-primary flex items-center gap-1 transition-colors">
                      <ExternalLink size={12} />
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No receiving records match your search. Try a different Order ID, Supplier, or PO Number.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30">
          <p className="text-xs text-muted-foreground">
            Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filtered.length)}–{Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} records
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
                key={`page-${page}`}
                onClick={() => setCurrentPage(page)}
                className={`w-7 h-7 rounded text-xs font-semibold transition-colors ${
                  page === currentPage
                    ? 'bg-primary text-white' :'hover:bg-muted text-muted-foreground'
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