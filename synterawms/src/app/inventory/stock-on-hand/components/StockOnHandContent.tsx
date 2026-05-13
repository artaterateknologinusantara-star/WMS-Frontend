'use client';

import React, { useState } from 'react';
import { Search, Download, RefreshCw, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';


interface StockItem {
  id: string;
  skuNumber: string;
  skuName: string;
  category: string;
  palletId: string;
  binLocation: string;
  quantity: number;
  uom: string;
  status: 'available' | 'reserved' | 'hold' | 'damaged';
  lastMovement: string;
}

const mockStock: StockItem[] = [
  { id: 's001', skuNumber: 'SKU-ELC-001', skuName: 'Kabel UTP Cat6 Box', category: 'Electronics', palletId: 'PLT-20260510-001', binLocation: 'A-03-012', quantity: 340, uom: 'PCS', status: 'available', lastMovement: '2026-05-10 09:30' },
  { id: 's002', skuNumber: 'SKU-ELC-005', skuName: 'Switch 24 Port Managed', category: 'Electronics', palletId: 'PLT-20260510-001', binLocation: 'A-03-013', quantity: 12, uom: 'UNIT', status: 'available', lastMovement: '2026-05-10 09:30' },
  { id: 's003', skuNumber: 'SKU-PKG-012', skuName: 'Bubble Wrap Roll 50m', category: 'Packaging', palletId: 'PLT-20260510-002', binLocation: 'B-02-015', quantity: 120, uom: 'ROLL', status: 'available', lastMovement: '2026-05-10 10:15' },
  { id: 's004', skuNumber: 'SKU-CHM-007', skuName: 'Cairan Pembersih Industri 5L', category: 'Chemical', palletId: 'PLT-20260510-003', binLocation: 'C-01-008', quantity: 8, uom: 'DRUM', status: 'hold', lastMovement: '2026-05-10 11:00' },
  { id: 's005', skuNumber: 'SKU-CHM-008', skuName: 'Pelumas Mesin SAE 40', category: 'Chemical', palletId: 'PLT-20260510-003', binLocation: 'C-01-009', quantity: 24, uom: 'LITER', status: 'available', lastMovement: '2026-05-10 11:00' },
  { id: 's006', skuNumber: 'SKU-LOG-021', skuName: 'Pallet Kayu 120x100cm', category: 'Logistics', palletId: 'PLT-20260510-005', binLocation: 'D-04-003', quantity: 50, uom: 'PCS', status: 'reserved', lastMovement: '2026-05-10 12:30' },
  { id: 's007', skuNumber: 'SKU-LOG-022', skuName: 'Stretch Film 500m', category: 'Logistics', palletId: 'PLT-20260510-005', binLocation: 'D-04-004', quantity: 84, uom: 'ROLL', status: 'available', lastMovement: '2026-05-10 12:30' },
  { id: 's008', skuNumber: 'SKU-MET-003', skuName: 'Baut Hex M10 x 50mm', category: 'Metal Parts', palletId: 'PLT-20260509-014', binLocation: 'A-01-005', quantity: 1200, uom: 'PCS', status: 'available', lastMovement: '2026-05-09 14:00' },
  { id: 's009', skuNumber: 'SKU-BRK-002', skuName: 'Kardus Box 40x30x30cm', category: 'Packaging', palletId: 'PLT-20260510-009', binLocation: 'E-02-011', quantity: 420, uom: 'PCS', status: 'available', lastMovement: '2026-05-10 15:20' },
  { id: 's010', skuNumber: 'SKU-TKN-044', skuName: 'Sensor Suhu PT100', category: 'Electronics', palletId: 'PLT-20260510-006', binLocation: 'F-01-002', quantity: 5, uom: 'PCS', status: 'damaged', lastMovement: '2026-05-10 13:10' },
  { id: 's011', skuNumber: 'SKU-ABJ-015', skuName: 'Tali Rafia 1kg', category: 'Packaging', palletId: 'PLT-20260509-015', binLocation: 'B-05-009', quantity: 180, uom: 'KG', status: 'available', lastMovement: '2026-05-09 16:00' },
  { id: 's012', skuNumber: 'SKU-GLD-033', skuName: 'Bearing SKF 6205', category: 'Metal Parts', palletId: 'PLT-20260510-008', binLocation: 'A-02-007', quantity: 200, uom: 'PCS', status: 'reserved', lastMovement: '2026-05-10 14:45' },
  { id: 's013', skuNumber: 'SKU-MDL-055', skuName: 'Kabel Power 3x2.5mm', category: 'Electronics', palletId: 'PLT-20260509-016', binLocation: 'A-04-001', quantity: 3, uom: 'ROLL', status: 'hold', lastMovement: '2026-05-09 17:00' },
  { id: 's014', skuNumber: 'SKU-CHM-009', skuName: 'Thinner A Special 1L', category: 'Chemical', palletId: 'PLT-20260509-017', binLocation: 'C-02-003', quantity: 60, uom: 'LITER', status: 'available', lastMovement: '2026-05-09 15:00' },
  { id: 's015', skuNumber: 'SKU-ELC-010', skuName: 'MCB 1 Phase 10A', category: 'Electronics', palletId: 'PLT-20260509-018', binLocation: 'A-05-006', quantity: 550, uom: 'PCS', status: 'available', lastMovement: '2026-05-09 14:00' },
];

const LOW_STOCK_THRESHOLD = 10;
const ITEMS_PER_PAGE = 10;

const statusVariantMap: Record<string, { label: string; classes: string }> = {
  available: { label: 'Available', classes: 'bg-success-soft text-success border border-green-200' },
  reserved: { label: 'Reserved', classes: 'bg-info-soft text-info border border-blue-200' },
  hold: { label: 'Hold', classes: 'bg-warning-soft text-warning border border-yellow-200' },
  damaged: { label: 'Damaged', classes: 'bg-danger-soft text-danger border border-red-200' },
};

function StockStatusBadge({ status }: { status: string }) {
  const cfg = statusVariantMap[status] || { label: status, classes: 'bg-muted text-muted-foreground border border-border' };
  return <span className={`status-badge ${cfg.classes}`}>{cfg.label}</span>;
}

export default function StockOnHandContent() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const categories = Array.from(new Set(mockStock.map(s => s.category)));

  const filtered = mockStock.filter(s => {
    const matchSearch =
      s.skuNumber.toLowerCase().includes(search.toLowerCase()) ||
      s.skuName.toLowerCase().includes(search.toLowerCase()) ||
      s.palletId.toLowerCase().includes(search.toLowerCase()) ||
      s.binLocation.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === 'all' || s.category === categoryFilter;
    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchSearch && matchCat && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const totalSKU = mockStock.length;
  const totalPallet = new Set(mockStock.map(s => s.palletId)).size;
  const occupiedBin = new Set(mockStock.map(s => s.binLocation)).size;
  const availableBin = 120 - occupiedBin;
  const lowStock = mockStock.filter(s => s.quantity <= LOW_STOCK_THRESHOLD).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b border-border px-8 py-4 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-lg font-bold text-foreground">Stock On Hand</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Real-time inventory stock monitoring</p>
        </div>
        <div className="flex items-center gap-2">
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

      <div className="px-8 py-6 max-w-screen-2xl">
        {/* Summary Cards */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          {[
            { label: 'Total SKU', value: totalSKU, color: 'text-foreground' },
            { label: 'Total Pallet', value: totalPallet, color: 'text-info' },
            { label: 'Occupied Bin', value: occupiedBin, color: 'text-warning' },
            { label: 'Available Bin', value: availableBin, color: 'text-success' },
            { label: 'Low Stock', value: lowStock, color: 'text-danger', alert: true },
          ].map(card => (
            <div key={card.label} className="card px-4 py-3">
              <p className="text-xs text-muted-foreground mb-1">{card.label}</p>
              <div className="flex items-center gap-2">
                <span className={`text-2xl font-bold font-tabular ${card.color}`}>{card.value}</span>
                {card.alert && card.value > 0 && (
                  <AlertTriangle size={14} className="text-danger" />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search SKU, name, pallet, bin..."
              value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
              className="form-input pl-9 text-sm"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={e => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
            className="form-input text-sm py-2 w-auto min-w-[150px]"
          >
            <option value="all">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="form-input text-sm py-2 w-auto min-w-[140px]"
          >
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="reserved">Reserved</option>
            <option value="hold">Hold</option>
            <option value="damaged">Damaged</option>
          </select>
          <span className="text-xs text-muted-foreground ml-auto">{filtered.length} items</span>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="bg-muted border-b border-border">
                  {['SKU Number', 'SKU Name', 'Category', 'Pallet ID', 'Bin Location', 'Quantity', 'UOM', 'Status', 'Last Movement'].map(col => (
                    <th key={col} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-sm text-muted-foreground">No stock items match your search.</td>
                  </tr>
                ) : paginated.map(item => (
                  <tr key={item.id} className="border-b border-border last:border-0 row-hover">
                    <td className="px-4 py-3">
                      <span className="text-sm font-semibold text-info font-tabular">{item.skuNumber}</span>
                      {item.quantity <= LOW_STOCK_THRESHOLD && (
                        <span className="ml-2 text-xs text-danger font-semibold">Low</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground max-w-[180px]">
                      <span className="truncate block">{item.skuName}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">{item.category}</span>
                    </td>
                    <td className="px-4 py-3 text-sm font-tabular text-foreground">{item.palletId}</td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-semibold text-foreground font-tabular">{item.binLocation}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-sm font-bold font-tabular ${item.quantity <= LOW_STOCK_THRESHOLD ? 'text-danger' : 'text-foreground'}`}>{item.quantity.toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{item.uom}</td>
                    <td className="px-4 py-3">
                      <StockStatusBadge status={item.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground font-tabular whitespace-nowrap">{item.lastMovement}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30">
            <p className="text-xs text-muted-foreground">
              Showing {filtered.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} items
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 rounded hover:bg-muted disabled:opacity-40 transition-colors">
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: Math.max(1, totalPages) }, (_, i) => i + 1).map(page => (
                <button key={page} onClick={() => setCurrentPage(page)} className={`w-7 h-7 rounded text-xs font-semibold transition-colors ${page === currentPage ? 'bg-primary text-white' : 'hover:bg-muted text-muted-foreground'}`}>{page}</button>
              ))}
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="p-1.5 rounded hover:bg-muted disabled:opacity-40 transition-colors">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
