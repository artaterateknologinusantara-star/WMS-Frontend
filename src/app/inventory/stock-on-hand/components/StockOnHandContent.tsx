'use client';

import React, { useEffect, useState } from 'react';
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
  status: string;
  lastMovement: string;
}

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api') + '/inventory';
const ITEMS_PER_PAGE = 10;
const LOW_STOCK_THRESHOLD = 10;

const mapStatusFromAPI = (status: string): string => {
  const statusMap: Record<string, string> = {
    'Active': 'available',
    'Inactive': 'hold',
    'Damaged': 'damaged',
    'Reserved': 'reserved'
  };
  return statusMap[status] || 'available';
};

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
  const [stockData, setStockData] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [refreshing, setRefreshing] = useState(false);

  const fetchInventory = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    setLoading(!showRefreshing);
    setError(null);

    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const result = await response.json();
      const apiData = result?.data ?? [];
      // Transform API data to match frontend interface
      const transformedData = apiData.map((item: any) => ({
        ...item,
        id: item.id.toString(),
        status: mapStatusFromAPI(item.status)
      }));
      setStockData(transformedData);
    } catch (err) {
      console.error(err);
      setError(`Failed to load inventory from backend.`);
      setStockData([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInventory();
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => fetchInventory(), 30000);
    return () => clearInterval(interval);
  }, []);

  const categories = Array.from(new Set(stockData.map(s => s.category)));

const filtered = stockData.filter(s => {
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

  const totalSKU = stockData.length;
  const totalPallet = new Set(stockData.map(s => s.palletId)).size;
  const occupiedBin = new Set(stockData.map(s => s.binLocation)).size;
  const availableBin = 120 - occupiedBin;
  const lowStock = stockData.filter(s => s.quantity <= LOW_STOCK_THRESHOLD).length;

  if (loading) {
    return <div className="p-4">Loading inventory...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b border-border px-4 py-3 sm:px-6 lg:px-8 lg:py-4 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-lg font-bold text-foreground">Stock On Hand</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Real-time inventory stock monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => fetchInventory(true)} disabled={refreshing} className="btn-ghost text-xs border border-border flex items-center gap-1.5 disabled:opacity-50">
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
          <button className="btn-ghost text-xs border border-border flex items-center gap-1.5">
            <Download size={13} />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      <div className="px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6 max-w-screen-2xl">
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4 mb-6">
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
