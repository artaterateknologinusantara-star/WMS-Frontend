'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Download, RefreshCw, CheckCircle2, ChevronLeft, ChevronRight, AlertTriangle, X, ScanLine, Loader2 } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import PutawayAssignModal from './PutawayAssignModal';
import EmptyState from '@/components/ui/EmptyState';
import { MoveRight } from 'lucide-react';
import { getPendingPutawayTasks, confirmPutaway, type PutawayTaskItem } from '@/lib/services/putaway.service';
import { useAuth } from '@/lib/context/AuthContext';

interface PutawayTask {
  id: string;
  palletId: string;
  orderId: string;
  skuCode: string;
  skuName: string;
  skuCount: number;
  totalQty: number;
  uom: string;
  sourceZone: string;
  targetBin: string;
  assignedTo: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'putaway-assigned' | 'putaway-complete';
  receivedAt: string;
  supplier: string;
}

type ValidationAlertType = 'wrong-bin' | 'rack-full' | 'invalid-sku' | 'wrong-zone' | 'success' | 'api-error';

interface ValidationAlert {
  type: ValidationAlertType;
  taskId?: string;
  customMessage?: string;
}

const validationMessages: Record<ValidationAlertType, { title: string; desc: string; isError: boolean }> = {
  'wrong-bin': {
    title: 'Wrong Bin Location',
    desc: 'The scanned bin/rack barcode does not match the assigned target bin. Please move to the correct bin location and scan again.',
    isError: true,
  },
  'rack-full': {
    title: 'Rack Capacity Full',
    desc: 'The target rack has reached its maximum capacity. Please contact your supervisor to reassign this pallet to an available bin.',
    isError: true,
  },
  'invalid-sku': {
    title: 'Invalid SKU / Pallet',
    desc: 'The scanned pallet ID does not match the expected pallet for this putaway task. Please verify the pallet barcode and try again.',
    isError: true,
  },
  'wrong-zone': {
    title: 'Wrong Zone',
    desc: 'The scanned location is in the wrong warehouse zone. This SKU must be stored in the designated zone. Please check the zone assignment.',
    isError: true,
  },
  'api-error': {
    title: 'Putaway Failed',
    desc: 'An error occurred while confirming putaway. See details below.',
    isError: true,
  },
  'success': {
    title: 'Putaway Confirmed',
    desc: 'Pallet successfully placed in the target bin. Inventory has been updated.',
    isError: false,
  },
};

interface ScanValidationState {
  open: boolean;
  task: PutawayTask | null;
  palletScan: string;
  binScan: string;
  step: 'pallet' | 'bin';
  palletError: string;
  binError: string;
  confirming: boolean;
}

function mapApiTaskToUiTask(item: PutawayTaskItem): PutawayTask {
  return {
    id: item.palletId,
    palletId: item.palletId,
    orderId: item.receivingNumber || '—',
    skuCode: item.skuCode,
    skuName: item.skuName,
    skuCount: 1,
    totalQty: item.qty,
    uom: 'PCS',
    sourceZone: 'Receiving Dock',
    targetBin: '—',
    assignedTo: '—',
    priority: 'medium',
    status: 'pending',
    receivedAt: item.createdAt ? new Date(item.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '—',
    supplier: item.supplierName || '—',
  };
}

const ITEMS_PER_PAGE = 8;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';

interface BinOption { binCode: string; zone: string; }

export default function PutawayContent() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [assignModal, setAssignModal] = useState<{ open: boolean; task: PutawayTask | null }>({ open: false, task: null });
  const [tasks, setTasks] = useState<PutawayTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [validationAlert, setValidationAlert] = useState<ValidationAlert | null>(null);
  const [binOptions, setBinOptions] = useState<BinOption[]>([]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/binlocation`)
      .then(r => r.ok ? r.json() : null)
      .then(p => { if (Array.isArray(p?.data)) setBinOptions(p.data); })
      .catch(() => {});
  }, []);
  const [scanModal, setScanModal] = useState<ScanValidationState>({
    open: false,
    task: null,
    palletScan: '',
    binScan: '',
    step: 'pallet',
    palletError: '',
    binError: '',
    confirming: false,
  });

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const apiTasks = await getPendingPutawayTasks();
      setTasks(prev => {
        // Keep locally-assigned tasks (putaway-assigned) merged with fresh pending from API
        const assigned = prev.filter(t => t.status === 'putaway-assigned');
        const assignedIds = new Set(assigned.map(t => t.palletId));
        const fresh = apiTasks
          .filter(a => !assignedIds.has(a.palletId))
          .map(mapApiTaskToUiTask);
        return [...assigned, ...fresh];
      });
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load putaway tasks.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const filtered = tasks.filter(t => {
    const matchSearch =
      t.palletId.toLowerCase().includes(search.toLowerCase()) ||
      t.orderId.toLowerCase().includes(search.toLowerCase()) ||
      t.skuCode.toLowerCase().includes(search.toLowerCase()) ||
      t.supplier.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchPriority = priorityFilter === 'all' || t.priority === priorityFilter;
    return matchSearch && matchStatus && matchPriority;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const toggleRow = (id: string) =>
    setSelectedRows(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);

  const toggleAll = () =>
    setSelectedRows(prev => prev.length === paginated.length ? [] : paginated.map(r => r.id));

  const handleAssign = (taskId: string, bin: string, operator: string) => {
    setTasks(prev =>
      prev.map(t =>
        t.id === taskId
          ? { ...t, targetBin: bin, assignedTo: operator, status: 'putaway-assigned' }
          : t
      )
    );
    setAssignModal({ open: false, task: null });
  };

  const openScanValidation = (task: PutawayTask) => {
    setScanModal({ open: true, task, palletScan: '', binScan: '', step: 'pallet', palletError: '', binError: '', confirming: false });
  };

  const handlePalletScan = () => {
    const { task, palletScan } = scanModal;
    if (!task) return;
    if (!palletScan.trim()) {
      setScanModal(s => ({ ...s, palletError: 'Please scan or enter the pallet ID.' }));
      return;
    }
    if (palletScan.trim() !== task.palletId) {
      setScanModal(s => ({ ...s, open: false }));
      setValidationAlert({ type: 'invalid-sku' });
      return;
    }
    setScanModal(s => ({ ...s, step: 'bin', palletError: '' }));
  };

  const handleBinScan = async () => {
    const { task, binScan } = scanModal;
    if (!task) return;
    if (!binScan.trim()) {
      setScanModal(s => ({ ...s, binError: 'Please scan or enter the bin barcode.' }));
      return;
    }

    const scanned = binScan.trim().toUpperCase();
    const expected = task.targetBin.toUpperCase();

    // Only validate if a specific bin was pre-assigned
    if (expected !== '—') {
      if (scanned.charAt(0) !== expected.charAt(0)) {
        setScanModal(s => ({ ...s, open: false }));
        setValidationAlert({ type: 'wrong-zone' });
        return;
      }
      if (scanned !== expected) {
        setScanModal(s => ({ ...s, open: false }));
        setValidationAlert({ type: 'wrong-bin' });
        return;
      }
    }

    // Call real API to confirm putaway
    setScanModal(s => ({ ...s, confirming: true, binError: '' }));
    try {
      await confirmPutaway({
        palletId: task.palletId,
        binCode: scanned,
        confirmedBy: user?.userId ?? 1,
      });

      // Remove from list (it's now in InventoryStock)
      setTasks(prev => prev.filter(t => t.id !== task.id));
      setScanModal(s => ({ ...s, open: false, confirming: false }));
      setValidationAlert({ type: 'success', taskId: task.id });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Putaway confirmation failed.';
      setScanModal(s => ({ ...s, open: false, confirming: false }));
      setValidationAlert({ type: 'api-error', customMessage: msg });
    }
  };

  const summaryStats = {
    pending: tasks.filter(t => t.status === 'pending').length,
    assigned: tasks.filter(t => t.status === 'putaway-assigned').length,
    complete: 0,
  };

  const alertInfo = validationAlert
    ? {
        ...validationMessages[validationAlert.type],
        desc: validationAlert.customMessage ?? validationMessages[validationAlert.type].desc,
      }
    : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Validation Alert Popup */}
      {validationAlert && alertInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className={`bg-white rounded-lg border shadow-lg w-full max-w-sm mx-4 overflow-hidden animate-fade-in ${alertInfo.isError ? 'border-danger' : 'border-success'}`}>
            <div className={`px-5 py-4 flex items-center justify-between ${alertInfo.isError ? 'bg-danger' : 'bg-success'}`}>
              <div className="flex items-center gap-2">
                {alertInfo.isError
                  ? <AlertTriangle size={18} className="text-white" />
                  : <CheckCircle2 size={18} className="text-white" />
                }
                <span className="text-white font-bold text-sm">{alertInfo.title}</span>
              </div>
              <button onClick={() => setValidationAlert(null)} className="text-white/80 hover:text-white"><X size={16} /></button>
            </div>
            <div className="px-5 py-4">
              <p className="text-sm text-foreground">{alertInfo.desc}</p>
              <button
                onClick={() => setValidationAlert(null)}
                className={`mt-4 w-full justify-center text-sm py-2 rounded font-semibold text-white transition-colors ${alertInfo.isError ? 'bg-danger hover:bg-danger/90' : 'bg-success hover:bg-success/90'}`}
              >
                {alertInfo.isError ? 'Dismiss' : 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scan Validation Modal */}
      {scanModal.open && scanModal.task && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-lg border border-border shadow-lg w-full max-w-md mx-4 animate-fade-in">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ScanLine size={16} className="text-primary" />
                <h3 className="text-sm font-bold text-foreground">Putaway Validation</h3>
              </div>
              <button
                onClick={() => setScanModal(s => ({ ...s, open: false }))}
                disabled={scanModal.confirming}
                className="text-muted-foreground hover:text-foreground disabled:opacity-40"
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-5 pt-4">
              {/* Task summary */}
              <div className="bg-muted rounded-lg p-3 space-y-1 mb-4">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Pallet ID</span>
                  <span className="font-bold text-info font-tabular">{scanModal.task.palletId}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">SKU</span>
                  <span className="font-semibold text-foreground">{scanModal.task.skuCode}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Qty</span>
                  <span className="font-bold text-foreground font-tabular">{scanModal.task.totalQty}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Target Bin</span>
                  <span className="font-bold text-foreground font-tabular">{scanModal.task.targetBin}</span>
                </div>
              </div>

              {/* Step indicator */}
              <div className="flex items-center gap-2 mb-4">
                <div className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${scanModal.step === 'pallet' ? 'bg-primary text-white' : 'bg-success text-white'}`}>
                  {scanModal.step !== 'pallet' ? <CheckCircle2 size={11} /> : <span>1</span>}
                  Scan Pallet
                </div>
                <div className="flex-1 h-px bg-border" />
                <div className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${scanModal.step === 'bin' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                  <span>2</span>
                  Scan Bin
                </div>
              </div>

              {/* Step 1 */}
              {scanModal.step === 'pallet' && (
                <div className="pb-4 space-y-3">
                  <div>
                    <label className="form-label text-xs">Scan Pallet ID Barcode</label>
                    <input
                      type="text"
                      placeholder={`Expected: ${scanModal.task.palletId}`}
                      value={scanModal.palletScan}
                      onChange={e => setScanModal(s => ({ ...s, palletScan: e.target.value, palletError: '' }))}
                      onKeyDown={e => e.key === 'Enter' && handlePalletScan()}
                      className={`form-input text-sm ${scanModal.palletError ? 'border-danger' : ''}`}
                      autoFocus
                    />
                    {scanModal.palletError && <p className="text-xs text-danger mt-1">{scanModal.palletError}</p>}
                    <p className="text-xs text-muted-foreground mt-1">Scan the pallet barcode or press Enter to confirm.</p>
                  </div>
                  <button onClick={handlePalletScan} className="btn-primary w-full justify-center text-sm">
                    Confirm Pallet Scan
                  </button>
                </div>
              )}

              {/* Step 2 */}
              {scanModal.step === 'bin' && (
                <div className="pb-4 space-y-3">
                  <datalist id="bin-list">
                    {binOptions.map(b => (
                      <option key={b.binCode} value={b.binCode}>{b.zone}</option>
                    ))}
                  </datalist>
                  <div>
                    <label className="form-label text-xs">Scan Rack / Bin Barcode</label>
                    <input
                      type="text"
                      list="bin-list"
                      placeholder={scanModal.task.targetBin !== '—' ? `Expected: ${scanModal.task.targetBin}` : 'e.g. A-01-001'}
                      value={scanModal.binScan}
                      onChange={e => setScanModal(s => ({ ...s, binScan: e.target.value, binError: '' }))}
                      onKeyDown={e => e.key === 'Enter' && !scanModal.confirming && handleBinScan()}
                      className={`form-input text-sm ${scanModal.binError ? 'border-danger' : ''}`}
                      disabled={scanModal.confirming}
                      autoFocus
                    />
                    {scanModal.binError && <p className="text-xs text-danger mt-1">{scanModal.binError}</p>}
                    <p className="text-xs text-muted-foreground mt-1">System will validate zone and SKU compatibility.</p>
                  </div>
                  <button
                    onClick={handleBinScan}
                    disabled={scanModal.confirming}
                    className="btn-primary w-full justify-center text-sm flex items-center gap-2"
                  >
                    {scanModal.confirming
                      ? <><Loader2 size={14} className="animate-spin" /> Confirming...</>
                      : 'Confirm Putaway'
                    }
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-border px-4 py-3 sm:px-6 lg:px-8 lg:py-4 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-lg font-bold text-foreground">Putaway Tasks</h1>
          <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">Assign pallets to bin locations and confirm via barcode scan</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:flex items-center gap-4 text-xs">
            <span className="text-muted-foreground">Pending: <strong className="text-danger">{summaryStats.pending}</strong></span>
            <span className="text-muted-foreground">Assigned: <strong className="text-info">{summaryStats.assigned}</strong></span>
          </div>
          <button
            onClick={loadTasks}
            disabled={loading}
            className="btn-ghost text-xs border border-border flex items-center gap-1.5 disabled:opacity-50"
          >
            {loading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button className="btn-ghost text-xs border border-border flex items-center gap-1.5">
            <Download size={13} />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      <div className="px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6 max-w-screen-2xl">
        {/* Load error banner */}
        {loadError && (
          <div className="mb-4 bg-danger/10 border border-danger rounded-lg px-4 py-3 text-sm text-danger flex items-center gap-2">
            <AlertTriangle size={16} />
            {loadError}
            <button onClick={loadTasks} className="ml-auto underline text-xs">Retry</button>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search pallet ID, SKU, order, supplier..."
              value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
              className="form-input pl-9 text-sm"
            />
          </div>

          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }} className="form-input text-sm py-2 w-auto min-w-[150px]">
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="putaway-assigned">Assigned</option>
          </select>

          <select value={priorityFilter} onChange={e => { setPriorityFilter(e.target.value); setCurrentPage(1); }} className="form-input text-sm py-2 w-auto min-w-[130px]">
            <option value="all">All Priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground ml-auto">
            <Filter size={13} />
            {filtered.length} tasks
          </div>
        </div>

        {/* Bulk Action Bar */}
        {selectedRows.length > 0 && (
          <div className="mb-4 bg-primary text-white rounded-lg px-4 py-3 flex items-center justify-between animate-fade-in">
            <span className="text-sm font-semibold">{selectedRows.length} task{selectedRows.length > 1 ? 's' : ''} selected</span>
            <div className="flex items-center gap-2">
              <button className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded font-semibold transition-colors">
                Bulk Assign
              </button>
              <button onClick={() => setSelectedRows([])} className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded font-semibold transition-colors">
                Clear Selection
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="bg-muted border-b border-border">
                  <th className="px-4 py-3 w-10">
                    <input type="checkbox" checked={selectedRows.length === paginated.length && paginated.length > 0} onChange={toggleAll} className="rounded border-border" />
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pallet ID</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Order / SKU</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Supplier</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Qty</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Source</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Target Bin</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Assigned To</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && tasks.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Loader2 size={24} className="animate-spin" />
                        <span className="text-sm">Loading putaway tasks...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={10}>
                      <EmptyState
                        icon={<MoveRight size={24} className="text-muted-foreground" />}
                        title="No putaway tasks found"
                        description={loadError ? 'Could not load tasks. Click Refresh to try again.' : 'All pallets have been put away, or no tasks match your filters.'}
                      />
                    </td>
                  </tr>
                ) : (
                  paginated.map(task => (
                    <tr key={task.id} className={`border-b border-border last:border-0 row-hover ${selectedRows.includes(task.id) ? 'bg-primary/5' : ''}`}>
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={selectedRows.includes(task.id)} onChange={() => toggleRow(task.id)} className="rounded border-border" />
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-semibold text-info font-tabular">{task.palletId}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-semibold text-foreground font-tabular">{task.orderId}</span>
                        <p className="text-xs text-muted-foreground">{task.skuCode} — {task.skuName}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-foreground max-w-[140px] truncate block">{task.supplier}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-semibold text-foreground font-tabular">{task.totalQty}</span>
                        <span className="text-xs text-muted-foreground ml-1">{task.uom}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">{task.sourceZone}</span>
                      </td>
                      <td className="px-4 py-3">
                        {task.targetBin !== '—'
                          ? <span className="text-sm font-semibold text-foreground font-tabular">{task.targetBin}</span>
                          : <span className="text-xs text-muted-foreground italic">Not assigned</span>
                        }
                      </td>
                      <td className="px-4 py-3">
                        {task.assignedTo !== '—'
                          ? <span className="text-sm text-foreground">{task.assignedTo}</span>
                          : <span className="text-xs text-muted-foreground italic">Unassigned</span>
                        }
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge status={task.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 row-actions">
                          {task.status === 'pending' && (
                            <button
                              onClick={() => setAssignModal({ open: true, task })}
                              className="text-xs font-semibold text-primary hover:bg-primary/10 px-2 py-1 rounded transition-colors whitespace-nowrap"
                            >
                              Assign Bin
                            </button>
                          )}
                          {task.status === 'putaway-assigned' && (
                            <button
                              onClick={() => openScanValidation(task)}
                              className="text-xs font-semibold text-success hover:bg-success-soft px-2 py-1 rounded transition-colors flex items-center gap-1 whitespace-nowrap"
                            >
                              <ScanLine size={12} />
                              Scan & Complete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30">
            <p className="text-xs text-muted-foreground">
              Showing {filtered.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} tasks
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 rounded hover:bg-muted disabled:opacity-40 transition-colors">
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: Math.max(1, totalPages) }, (_, i) => i + 1).map(page => (
                <button
                  key={`putaway-page-${page}`}
                  onClick={() => setCurrentPage(page)}
                  className={`w-7 h-7 rounded text-xs font-semibold transition-colors ${page === currentPage ? 'bg-primary text-white' : 'hover:bg-muted text-muted-foreground'}`}
                >
                  {page}
                </button>
              ))}
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="p-1.5 rounded hover:bg-muted disabled:opacity-40 transition-colors">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <PutawayAssignModal
        open={assignModal.open}
        task={assignModal.task}
        onClose={() => setAssignModal({ open: false, task: null })}
        onAssign={handleAssign}
      />
    </div>
  );
}
