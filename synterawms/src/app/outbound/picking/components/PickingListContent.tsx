'use client';

import React, { useState } from 'react';
import { Search, Download, RefreshCw, Plus, ChevronLeft, ChevronRight, AlertTriangle, CheckCircle2, XCircle, X } from 'lucide-react';

interface PickingItem {
  id: string;
  pickingId: string;
  skuNumber: string;
  skuName: string;
  requestedQty: number;
  recommendedBin: string;
  palletId: string;
  pickedQty: number;
  status: 'pending' | 'in-progress' | 'picked' | 'error';
}

interface ValidationAlert {
  type: 'incorrect-sku' | 'wrong-pallet' | 'wrong-rack' | 'qty-exceeded' | 'invalid-pallet-sku';
  message: string;
}

const alertMessages: Record<string, { title: string; desc: string }> = {
  'incorrect-sku': { title: 'Incorrect SKU', desc: 'The scanned SKU does not match the picking list item. Please verify and scan the correct SKU barcode.' },
  'wrong-pallet': { title: 'Wrong Pallet', desc: 'The scanned pallet ID does not match the recommended pallet. Please check the pallet location.' },
  'wrong-rack': { title: 'Wrong Rack Location', desc: 'The scanned rack location does not match the recommended bin. Please move to the correct rack.' },
  'qty-exceeded': { title: 'Quantity Exceeded', desc: 'The entered quantity exceeds the available stock in this bin location. Please verify the quantity.' },
  'invalid-pallet-sku': { title: 'Invalid Pallet for Selected SKU', desc: 'The scanned pallet does not contain the selected SKU. Please scan the correct pallet barcode for this SKU.' },
};

// Mock pallet-to-SKU mapping for validation
const palletSkuMap: Record<string, string[]> = {
  'PLT-20260510-001': ['SKU-ELC-001', 'SKU-ELC-005'],
  'PLT-20260510-002': ['SKU-PKG-012'],
  'PLT-20260509-014': ['SKU-MET-003'],
  'PLT-20260510-005': ['SKU-LOG-022'],
  'PLT-20260510-009': ['SKU-BRK-002'],
};

const mockPickingItems: PickingItem[] = [
  { id: 'pk-001', pickingId: 'PCK-2026-001', skuNumber: 'SKU-ELC-001', skuName: 'Kabel UTP Cat6 Box', requestedQty: 50, recommendedBin: 'A-03-012', palletId: 'PLT-20260510-001', pickedQty: 50, status: 'picked' },
  { id: 'pk-002', pickingId: 'PCK-2026-001', skuNumber: 'SKU-PKG-012', skuName: 'Bubble Wrap Roll 50m', requestedQty: 20, recommendedBin: 'B-02-015', palletId: 'PLT-20260510-002', pickedQty: 0, status: 'in-progress' },
  { id: 'pk-003', pickingId: 'PCK-2026-002', skuNumber: 'SKU-MET-003', skuName: 'Baut Hex M10 x 50mm', requestedQty: 200, recommendedBin: 'A-01-005', palletId: 'PLT-20260509-014', pickedQty: 0, status: 'pending' },
  { id: 'pk-004', pickingId: 'PCK-2026-002', skuNumber: 'SKU-LOG-022', skuName: 'Stretch Film 500m', requestedQty: 10, recommendedBin: 'D-04-004', palletId: 'PLT-20260510-005', pickedQty: 0, status: 'pending' },
  { id: 'pk-005', pickingId: 'PCK-2026-003', skuNumber: 'SKU-BRK-002', skuName: 'Kardus Box 40x30x30cm', requestedQty: 100, recommendedBin: 'E-02-011', palletId: 'PLT-20260510-009', pickedQty: 100, status: 'picked' },
  { id: 'pk-006', pickingId: 'PCK-2026-003', skuNumber: 'SKU-ELC-005', skuName: 'Switch 24 Port Managed', requestedQty: 5, recommendedBin: 'A-03-013', palletId: 'PLT-20260510-001', pickedQty: 0, status: 'error' },
];

const statusBadge: Record<string, { label: string; classes: string }> = {
  pending: { label: 'Pending', classes: 'bg-warning-soft text-warning border border-yellow-200' },
  'in-progress': { label: 'In Progress', classes: 'bg-info-soft text-info border border-blue-200' },
  picked: { label: 'Picked', classes: 'bg-success-soft text-success border border-green-200' },
  error: { label: 'Error', classes: 'bg-danger-soft text-danger border border-red-200' },
};

const ITEMS_PER_PAGE = 8;

interface CreateFormState {
  skuNumber: string;
  palletId: string;
  requestedQty: string;
  assignedTo: string;
}

export default function PickingListContent() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [items, setItems] = useState<PickingItem[]>(mockPickingItems);
  const [alert, setAlert] = useState<ValidationAlert | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<CreateFormState>({
    skuNumber: '',
    palletId: '',
    requestedQty: '',
    assignedTo: '',
  });
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});

  const filtered = items.filter(i => {
    const matchSearch = i.pickingId.toLowerCase().includes(search.toLowerCase()) || i.skuNumber.toLowerCase().includes(search.toLowerCase()) || i.skuName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || i.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handlePick = (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    if (item.status === 'error') {
      setAlert({ type: 'incorrect-sku', message: '' });
      return;
    }
    setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'picked', pickedQty: i.requestedQty } : i));
  };

  const validatePalletForSku = (palletId: string, skuNumber: string): boolean => {
    const skusOnPallet = palletSkuMap[palletId];
    if (!skusOnPallet) return false;
    return skusOnPallet.includes(skuNumber);
  };

  const handleCreateSubmit = () => {
    const errs: Record<string, string> = {};
    if (!createForm.skuNumber.trim()) errs.skuNumber = 'SKU Number is required';
    if (!createForm.palletId.trim()) errs.palletId = 'Pallet ID is required';
    if (!createForm.requestedQty || Number(createForm.requestedQty) <= 0) errs.requestedQty = 'Valid quantity required';
    if (!createForm.assignedTo.trim()) errs.assignedTo = 'Assigned To is required';

    if (Object.keys(errs).length > 0) {
      setCreateErrors(errs);
      return;
    }

    // Validate pallet contains the selected SKU
    if (!validatePalletForSku(createForm.palletId.trim(), createForm.skuNumber.trim())) {
      setShowCreateModal(false);
      setAlert({ type: 'invalid-pallet-sku', message: '' });
      setCreateErrors({});
      return;
    }

    // Valid — create picking item
    setItems(prev => [...prev, {
      id: `pk-${Date.now()}`,
      pickingId: `PCK-2026-${String(prev.length + 1).padStart(3, '0')}`,
      skuNumber: createForm.skuNumber.trim(),
      skuName: 'New Picking Item',
      requestedQty: Number(createForm.requestedQty),
      recommendedBin: '—',
      palletId: createForm.palletId.trim(),
      pickedQty: 0,
      status: 'pending',
    }]);
    setCreateForm({ skuNumber: '', palletId: '', requestedQty: '', assignedTo: '' });
    setCreateErrors({});
    setShowCreateModal(false);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setCreateForm({ skuNumber: '', palletId: '', requestedQty: '', assignedTo: '' });
    setCreateErrors({});
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
      {/* Validation Alert Popup */}
      {alert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-lg border border-danger shadow-lg w-full max-w-sm mx-4 overflow-hidden animate-fade-in">
            <div className="bg-danger px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-white" />
                <span className="text-white font-bold text-sm">{alertMessages[alert.type].title}</span>
              </div>
              <button onClick={() => setAlert(null)} className="text-white/80 hover:text-white"><X size={16} /></button>
            </div>
            <div className="px-5 py-4">
              <p className="text-sm text-foreground">{alertMessages[alert.type].desc}</p>
              <button onClick={() => setAlert(null)} className="mt-4 btn-primary w-full justify-center text-sm">Dismiss</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-border px-8 py-4 flex items-center justify-between sticky top-0 z-10">
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
          <button className="btn-ghost text-xs border border-border flex items-center gap-1.5">
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

      <div className="px-8 py-6 max-w-screen-2xl">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" placeholder="Search picking ID, SKU..." value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} className="form-input pl-9 text-sm" />
          </div>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }} className="form-input text-sm py-2 w-auto min-w-[140px]">
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
                {paginated.length === 0 ? (
                  <tr><td colSpan={9} className="px-4 py-10 text-center text-sm text-muted-foreground">No picking items found.</td></tr>
                ) : paginated.map(item => {
                  const badge = statusBadge[item.status];
                  return (
                    <tr key={item.id} className="border-b border-border last:border-0 row-hover">
                      <td className="px-4 py-3 text-sm font-semibold text-info font-tabular">{item.pickingId}</td>
                      <td className="px-4 py-3 text-sm font-tabular text-foreground">{item.skuNumber}</td>
                      <td className="px-4 py-3 text-sm text-foreground max-w-[160px]"><span className="truncate block">{item.skuName}</span></td>
                      <td className="px-4 py-3 text-sm font-bold font-tabular text-right text-foreground">{item.requestedQty}</td>
                      <td className="px-4 py-3 text-sm font-semibold font-tabular text-foreground">{item.recommendedBin}</td>
                      <td className="px-4 py-3 text-sm font-tabular text-foreground">{item.palletId}</td>
                      <td className="px-4 py-3 text-sm font-tabular text-right">
                        <span className={item.pickedQty === item.requestedQty ? 'text-success font-bold' : 'text-muted-foreground'}>{item.pickedQty}</span>
                        <span className="text-muted-foreground text-xs"> / {item.requestedQty}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`status-badge ${badge.classes}`}>{badge.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="row-actions flex items-center gap-1">
                          {(item.status === 'pending' || item.status === 'in-progress') && (
                            <button onClick={() => handlePick(item.id)} className="text-xs font-semibold text-primary hover:bg-primary/10 px-2 py-1 rounded transition-colors flex items-center gap-1">
                              <CheckCircle2 size={12} />
                              Confirm Pick
                            </button>
                          )}
                          {item.status === 'error' && (
                            <button onClick={() => setAlert({ type: 'incorrect-sku', message: '' })} className="text-xs font-semibold text-danger hover:bg-danger-soft px-2 py-1 rounded transition-colors flex items-center gap-1">
                              <XCircle size={12} />
                              View Error
                            </button>
                          )}
                          {item.status === 'picked' && (
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

      {/* Create Picking Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-lg border border-border shadow-lg w-full max-w-md mx-4 animate-fade-in">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">Create Picking List</h3>
              <button onClick={handleCloseModal} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
            </div>
            <div className="px-5 py-4 space-y-3">
              {/* 1. SKU Number */}
              <div>
                <label className="form-label text-xs">SKU Number <span className="text-danger">*</span></label>
                <input
                  type="text"
                  placeholder="Scan SKU barcode..."
                  value={createForm.skuNumber}
                  onChange={e => setCreateForm(f => ({ ...f, skuNumber: e.target.value }))}
                  className={`form-input text-sm ${createErrors.skuNumber ? 'border-danger' : ''}`}
                />
                {createErrors.skuNumber && <p className="text-xs text-danger mt-1">{createErrors.skuNumber}</p>}
              </div>
              {/* 2. Pallet ID — NEW FIELD */}
              <div>
                <label className="form-label text-xs">Pallet ID <span className="text-danger">*</span></label>
                <input
                  type="text"
                  placeholder="Scan pallet barcode..."
                  value={createForm.palletId}
                  onChange={e => setCreateForm(f => ({ ...f, palletId: e.target.value }))}
                  className={`form-input text-sm ${createErrors.palletId ? 'border-danger' : ''}`}
                />
                {createErrors.palletId && <p className="text-xs text-danger mt-1">{createErrors.palletId}</p>}
                <p className="text-xs text-muted-foreground mt-0.5">Pallet must contain the selected SKU</p>
              </div>
              {/* 3. Requested Quantity */}
              <div>
                <label className="form-label text-xs">Requested Quantity <span className="text-danger">*</span></label>
                <input
                  type="number"
                  placeholder="0"
                  value={createForm.requestedQty}
                  onChange={e => setCreateForm(f => ({ ...f, requestedQty: e.target.value }))}
                  className={`form-input text-sm ${createErrors.requestedQty ? 'border-danger' : ''}`}
                />
                {createErrors.requestedQty && <p className="text-xs text-danger mt-1">{createErrors.requestedQty}</p>}
              </div>
              {/* 4. Assigned To */}
              <div>
                <label className="form-label text-xs">Assigned To <span className="text-danger">*</span></label>
                <input
                  type="text"
                  placeholder="Operator name..."
                  value={createForm.assignedTo}
                  onChange={e => setCreateForm(f => ({ ...f, assignedTo: e.target.value }))}
                  className={`form-input text-sm ${createErrors.assignedTo ? 'border-danger' : ''}`}
                />
                {createErrors.assignedTo && <p className="text-xs text-danger mt-1">{createErrors.assignedTo}</p>}
              </div>
            </div>
            <div className="px-5 py-4 border-t border-border flex justify-end gap-2">
              <button onClick={handleCloseModal} className="btn-ghost text-sm border border-border">Cancel</button>
              <button onClick={handleCreateSubmit} className="btn-primary text-sm">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
