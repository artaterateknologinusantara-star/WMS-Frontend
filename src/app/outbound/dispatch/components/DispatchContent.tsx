'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Truck, CheckCircle2, Clock, ChevronLeft, ChevronRight,
  Plus, X, AlertTriangle, Loader2, Package, MapPin, FileText,
  RefreshCw, BoxesIcon, ScanLine, Trash2, ClipboardList,
} from 'lucide-react';
import {
  getStagingItems, getDispatchList, createDispatch, confirmDispatch,
  type StagingItem, type DispatchRecord,
} from '@/lib/services/dispatch.service';

// ── Types ────────────────────────────────────────────────────────────────

interface ScannedItem {
  pickingDetailId: number;
  palletId: string;
  skuCode: string;
  skuName: string;
  qty: number;
  stagingBinCode: string;
  pickingNumber: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────

const statusBadge: Record<string, { label: string; classes: string; icon: React.ReactNode }> = {
  pending:    { label: 'Pending',    classes: 'bg-warning-soft text-warning border border-yellow-200',  icon: <Clock size={9} /> },
  dispatched: { label: 'Dispatched', classes: 'bg-success-soft text-success border border-green-200',   icon: <CheckCircle2 size={9} /> },
};

const ITEMS_PER_PAGE = 8;

function formatDate(s: string) {
  if (!s) return '—';
  const [date, time] = s.split(' ');
  return <span>{date}{time && <span className="block text-[10px] opacity-60">{time}</span>}</span>;
}

function nowFormatted() {
  return new Date().toLocaleString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ══════════════════════════════════════════════════════════════════════════

export default function DispatchContent() {

  // ── Dispatch history ──────────────────────────────────────────────────
  const [dispatches, setDispatches]         = useState<DispatchRecord[]>([]);
  const [loadingList, setLoadingList]       = useState(false);
  const [page, setPage]                     = useState(1);
  const [search, setSearch]                 = useState('');

  // ── Staging overview ──────────────────────────────────────────────────
  const [stagingItems, setStagingItems]     = useState<StagingItem[]>([]);
  const [stagingLoading, setStagingLoading] = useState(false);

  // ── New dispatch panel ────────────────────────────────────────────────
  const [panelOpen, setPanelOpen]           = useState(false);
  const [scanInput, setScanInput]           = useState('');
  const [scanError, setScanError]           = useState('');
  const [scanSuccess, setScanSuccess]       = useState('');
  const [scannedItems, setScannedItems]     = useState<ScannedItem[]>([]);
  const [recipientName, setRecipientName]   = useState('');
  const [vehicleNumber, setVehicleNumber]   = useState('');
  const [notes, setNotes]                   = useState('');
  const [panelError, setPanelError]         = useState('');
  const [panelSubmitting, setPanelSubmitting] = useState(false);
  const scanRef = useRef<HTMLInputElement>(null);

  // ── BAST modal ────────────────────────────────────────────────────────
  const [bastRecord, setBastRecord]         = useState<DispatchRecord | null>(null);
  const [bastTime, setBastTime]             = useState('');

  // ── Load data ─────────────────────────────────────────────────────────

  const loadAll = useCallback(async () => {
    setLoadingList(true);
    setStagingLoading(true);
    try {
      const [listData, stagingData] = await Promise.all([
        getDispatchList(),
        getStagingItems(),
      ]);
      setDispatches(listData);
      setStagingItems(stagingData);
      setPage(1);
    } catch {
      setDispatches([]);
      setStagingItems([]);
    } finally {
      setLoadingList(false);
      setStagingLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setPanelOpen(false); setBastRecord(null); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  // ── Open panel — data persists across open/close ─────────────────────

  const openPanel = () => {
    setPanelOpen(true);
    setTimeout(() => scanRef.current?.focus(), 100);
  };

  const resetPanel = () => {
    setScanInput(''); setScanError(''); setScanSuccess('');
    setScannedItems([]); setRecipientName(''); setVehicleNumber('');
    setNotes(''); setPanelError('');
  };

  // ── Pallet scan logic ─────────────────────────────────────────────────

  const handleScan = () => {
    const palletId = scanInput.trim().toUpperCase();
    setScanError(''); setScanSuccess('');

    if (!palletId) return;

    if (scannedItems.some(i => i.palletId.toUpperCase() === palletId)) {
      setScanError(`Pallet ${palletId} sudah ditambahkan.`);
      setScanInput('');
      return;
    }

    const found = stagingItems.find(s => s.palletId.toUpperCase() === palletId);
    if (!found) {
      setScanError(`Pallet ${palletId} tidak ditemukan di staging atau sudah di-dispatch.`);
      setScanInput('');
      return;
    }

    setScannedItems(prev => [...prev, {
      pickingDetailId: found.pickingDetailId,
      palletId:        found.palletId,
      skuCode:         found.skuCode,
      skuName:         found.skuName,
      qty:             found.qty,
      stagingBinCode:  found.stagingBinCode,
      pickingNumber:   found.pickingNumber,
    }]);
    setScanSuccess(`✓ ${found.palletId} — ${found.skuCode} (${found.qty} pcs)`);
    setScanInput('');
    setTimeout(() => { setScanSuccess(''); scanRef.current?.focus(); }, 1800);
  };

  const removeScanned = (palletId: string) =>
    setScannedItems(prev => prev.filter(i => i.palletId !== palletId));

  // ── Confirm dispatch (create + confirm in one step) ───────────────────

  const handleConfirmDispatch = async () => {
    setPanelError('');
    if (scannedItems.length === 0) { setPanelError('Scan minimal 1 pallet untuk di-dispatch.'); return; }
    if (!recipientName.trim())     { setPanelError('Nama penerima wajib diisi.'); return; }
    if (!vehicleNumber.trim())     { setPanelError('Nomor kendaraan wajib diisi.'); return; }

    setPanelSubmitting(true);
    try {
      const created = await createDispatch({
        driverName:       recipientName.trim(),
        vehicleNumber:    vehicleNumber.trim(),
        notes:            notes.trim() || undefined,
        pickingDetailIds: scannedItems.map(i => i.pickingDetailId),
      });
      const confirmed = await confirmDispatch(created.id);
      const time = nowFormatted();
      resetPanel();
      setPanelOpen(false);
      await loadAll();
      setBastTime(time);
      setBastRecord(confirmed);
    } catch (err: unknown) {
      setPanelError(err instanceof Error ? err.message : 'Gagal memproses dispatch.');
    } finally {
      setPanelSubmitting(false);
    }
  };

  // ── Table filters ─────────────────────────────────────────────────────

  const q        = search.trim().toLowerCase();
  const filtered = dispatches.filter(d =>
    [d.dispatchNumber, d.driverName, d.vehicleNumber, d.status].some(v => v?.toLowerCase().includes(q))
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated  = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  const totalScannedQty = scannedItems.reduce((s, i) => s + i.qty, 0);

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">

      {/* ══ BAST Modal ══════════════════════════════════════════════════ */}
      {bastRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 print:bg-white print:p-0 print:items-start print:justify-start">
          <div className="bg-white rounded-xl border border-border shadow-2xl w-full max-w-xl print:shadow-none print:border-0 print:rounded-none">

            {/* BAST header */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-success" />
                <div>
                  <h3 className="text-sm font-bold text-foreground">Berita Acara Serah Terima (BAST)</h3>
                  <p className="text-xs text-muted-foreground">{bastRecord.dispatchNumber}</p>
                </div>
              </div>
              <button onClick={() => setBastRecord(null)} className="p-1 rounded hover:bg-muted text-muted-foreground">
                <X size={16} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4 text-xs print:text-sm">

              {/* Company / doc title */}
              <div className="text-center print:mb-4">
                <p className="font-bold text-base text-foreground uppercase tracking-wide">Berita Acara Serah Terima</p>
                <p className="text-muted-foreground text-xs mt-0.5">No. {bastRecord.dispatchNumber}</p>
              </div>

              {/* Dispatch info grid */}
              <div className="grid grid-cols-2 gap-3 bg-muted rounded-lg p-4 print:bg-gray-50">
                <div>
                  <p className="text-muted-foreground">No. Dispatch</p>
                  <p className="font-bold text-info font-tabular">{bastRecord.dispatchNumber}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Waktu Dispatch</p>
                  <p className="font-semibold">{bastTime || bastRecord.createdAt}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Nama Penerima</p>
                  <p className="font-bold text-foreground">{bastRecord.driverName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Nomor Kendaraan</p>
                  <p className="font-semibold font-tabular">{bastRecord.vehicleNumber}</p>
                </div>
                {bastRecord.notes && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Catatan</p>
                    <p className="text-foreground">{bastRecord.notes}</p>
                  </div>
                )}
              </div>

              {/* Items table */}
              <div>
                <p className="font-semibold text-foreground mb-2 text-xs uppercase tracking-wide text-muted-foreground">Daftar Barang</p>
                <table className="w-full text-xs border border-border rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-muted">
                      <th className="text-left px-3 py-2 font-semibold text-muted-foreground uppercase tracking-wide w-6">No</th>
                      <th className="text-left px-3 py-2 font-semibold text-muted-foreground uppercase tracking-wide">SKU</th>
                      <th className="text-left px-3 py-2 font-semibold text-muted-foreground uppercase tracking-wide">Nama Barang</th>
                      <th className="text-left px-3 py-2 font-semibold text-muted-foreground uppercase tracking-wide">Pallet ID</th>
                      <th className="text-left px-3 py-2 font-semibold text-muted-foreground uppercase tracking-wide">Staging</th>
                      <th className="text-right px-3 py-2 font-semibold text-muted-foreground uppercase tracking-wide">Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bastRecord.items.map((item, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                        <td className="px-3 py-2 font-semibold font-tabular">{item.skuCode}</td>
                        <td className="px-3 py-2 text-foreground">{item.skuName}</td>
                        <td className="px-3 py-2 font-tabular text-xs">{item.palletId}</td>
                        <td className="px-3 py-2 font-tabular">{item.stagingBinCode}</td>
                        <td className="px-3 py-2 text-right font-bold font-tabular">{item.qty}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-border bg-muted font-semibold">
                      <td colSpan={5} className="px-3 py-2">Total Qty</td>
                      <td className="px-3 py-2 text-right font-bold font-tabular text-foreground">
                        {bastRecord.items.reduce((s, i) => s + i.qty, 0)} pcs
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Signature */}
              <div className="flex gap-6 pt-4 mt-2">
                <div className="flex-1 text-center">
                  <p className="text-xs text-muted-foreground mb-12">Pihak Pengirim / Warehouse</p>
                  <div className="border-t border-border pt-2">
                    <p className="text-xs text-muted-foreground">( ........................... )</p>
                  </div>
                </div>
                <div className="flex-1 text-center">
                  <p className="text-xs text-muted-foreground mb-12">Pihak Penerima</p>
                  <div className="border-t border-border pt-2">
                    <p className="text-xs font-semibold text-foreground">( {bastRecord.driverName} )</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-border flex justify-end gap-2 print:hidden">
              <button onClick={() => window.print()} className="btn-ghost border border-border px-4 py-1.5 text-xs flex items-center gap-1.5">
                <FileText size={13} /> Print BAST
              </button>
              <button onClick={() => setBastRecord(null)} className="btn-primary px-4 py-1.5 text-xs">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ New Dispatch Slide-over ══════════════════════════════════════ */}
      {panelOpen && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setPanelOpen(false)} />
          <div className="relative w-full max-w-md bg-white shadow-2xl flex flex-col h-full">

            {/* Panel header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
              <div>
                <h2 className="text-sm font-bold text-foreground">New Dispatch</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {scannedItems.length > 0
                    ? <span className="text-primary font-semibold">{scannedItems.length} pallet dipilih · {totalScannedQty} pcs</span>
                    : 'Scan pallet ID untuk menambahkan item'}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {(scannedItems.length > 0 || recipientName || vehicleNumber) && (
                  <button
                    onClick={resetPanel}
                    className="text-xs text-muted-foreground hover:text-danger px-2 py-1 rounded hover:bg-muted transition-colors"
                    title="Reset semua input"
                  >
                    Reset
                  </button>
                )}
                <button onClick={() => setPanelOpen(false)} className="p-1.5 rounded hover:bg-muted text-muted-foreground">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Panel body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

              {/* Pallet scan */}
              <div>
                <label className="form-label text-xs flex items-center gap-1.5">
                  <ScanLine size={12} /> Scan Pallet ID
                </label>
                <div className="flex gap-2">
                  <input
                    ref={scanRef}
                    type="text"
                    placeholder="Scan barcode pallet..."
                    value={scanInput}
                    onChange={e => { setScanInput(e.target.value); setScanError(''); setScanSuccess(''); }}
                    onKeyDown={e => e.key === 'Enter' && handleScan()}
                    className={`form-input text-sm font-tabular flex-1 ${scanError ? 'border-danger' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={handleScan}
                    className="btn-primary px-3 py-2 text-xs flex items-center gap-1"
                  >
                    <Plus size={13} /> Add
                  </button>
                </div>
                {scanError && (
                  <p className="mt-1 text-xs text-danger flex items-center gap-1"><AlertTriangle size={11} /> {scanError}</p>
                )}
                {scanSuccess && (
                  <p className="mt-1 text-xs text-success flex items-center gap-1"><CheckCircle2 size={11} /> {scanSuccess}</p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">Tekan Enter atau klik Add setelah scan</p>
              </div>

              {/* Scanned items list */}
              {scannedItems.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="form-label text-xs mb-0">
                      Item Terpilih
                      <span className="ml-1.5 text-primary font-bold">{scannedItems.length} pallet · {totalScannedQty} pcs</span>
                    </label>
                  </div>
                  <div className="space-y-2">
                    {scannedItems.map(item => (
                      <div key={item.palletId} className="flex items-start gap-3 p-3 rounded-lg border border-success/40 bg-success/5">
                        <CheckCircle2 size={14} className="text-success mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0 text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-foreground font-tabular">{item.skuCode}</span>
                            <span className="font-bold text-foreground font-tabular">{item.qty} pcs</span>
                          </div>
                          <p className="text-muted-foreground truncate">{item.skuName}</p>
                          <div className="flex gap-3 mt-1 text-muted-foreground">
                            <span className="flex items-center gap-1"><Package size={10} />{item.palletId}</span>
                            <span className="flex items-center gap-1"><MapPin size={10} />{item.stagingBinCode}</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground">{item.pickingNumber}</p>
                        </div>
                        <button
                          onClick={() => removeScanned(item.palletId)}
                          className="text-muted-foreground hover:text-danger p-0.5 rounded flex-shrink-0"
                          title="Hapus"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recipient info */}
              <div className="space-y-3">
                <div>
                  <label className="form-label text-xs">Nama Penerima <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    placeholder="Nama lengkap penerima barang"
                    value={recipientName}
                    onChange={e => { setRecipientName(e.target.value); setPanelError(''); }}
                    className="form-input text-sm py-2"
                  />
                </div>
                <div>
                  <label className="form-label text-xs">Nomor Kendaraan <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    placeholder="e.g. B-9999-WMS"
                    value={vehicleNumber}
                    onChange={e => { setVehicleNumber(e.target.value); setPanelError(''); }}
                    className="form-input text-sm py-2"
                  />
                </div>
                <div>
                  <label className="form-label text-xs">Catatan</label>
                  <textarea
                    rows={2}
                    placeholder="Catatan tambahan pengiriman..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="form-input text-sm py-2 resize-none"
                  />
                </div>
              </div>

              {panelError && (
                <div className="flex items-start gap-2 bg-danger/10 border border-red-200 rounded-lg px-3 py-2 text-danger text-xs">
                  <AlertTriangle size={13} className="mt-0.5 flex-shrink-0" />
                  {panelError}
                </div>
              )}
            </div>

            {/* Panel footer */}
            <div className="flex-shrink-0 px-5 py-4 border-t border-border bg-white space-y-2">
              {scannedItems.length > 0 && (
                <div className="bg-muted rounded-lg px-3 py-2 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Total dispatch</span>
                  <span className="font-bold text-foreground">{scannedItems.length} pallet · {totalScannedQty} pcs</span>
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={() => setPanelOpen(false)} className="btn-ghost border border-border py-2 text-sm">
                  Batal
                </button>
                <button
                  onClick={handleConfirmDispatch}
                  disabled={panelSubmitting || scannedItems.length === 0}
                  className="flex-1 bg-success text-white justify-center py-2 text-sm font-semibold rounded hover:bg-success/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {panelSubmitting
                    ? <><Loader2 size={14} className="animate-spin" /> Memproses...</>
                    : <><Truck size={14} /> Confirm Dispatch</>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ Page Header ══════════════════════════════════════════════════ */}
      <div className="bg-white border-b border-border px-4 py-3 sm:px-6 lg:px-8 lg:py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-foreground">Dispatch</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Konfirmasi pengiriman outbound dan generate dokumen BAST</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadAll} disabled={loadingList} className="btn-ghost border border-border p-1.5 rounded disabled:opacity-40" title="Refresh">
              <RefreshCw size={13} className={loadingList ? 'animate-spin' : ''} />
            </button>
            <button onClick={openPanel} className="btn-primary flex items-center gap-2 px-4 py-2 text-sm">
              <Plus size={15} />
              New Dispatch
              {stagingItems.length > 0 && (
                <span className="bg-white/25 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {stagingItems.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 sm:px-6 sm:py-5 lg:px-8 max-w-screen-xl space-y-6">

        {/* ══ Staging Ready — View Only ════════════════════════════════ */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <BoxesIcon size={15} className="text-warning" />
              Item Siap Dispatch
              {stagingItems.length > 0 && (
                <span className="text-xs bg-warning-soft text-warning border border-yellow-200 px-2 py-0.5 rounded-full font-semibold">
                  {stagingItems.length}
                </span>
              )}
            </h2>
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="bg-muted border-b border-border">
                    {['Picking No', 'SKU', 'Nama Barang', 'Pallet ID', 'Staging Bin', 'Qty (pcs)'].map(col => (
                      <th key={col} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stagingLoading ? (
                    <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">Memuat...</td></tr>
                  ) : stagingItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-14 text-center">
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <ClipboardList size={28} className="opacity-30" />
                          <p className="text-sm font-medium">Tidak ada item di staging</p>
                          <p className="text-xs">Selesaikan proses picking untuk menambahkan item ke staging.</p>
                        </div>
                      </td>
                    </tr>
                  ) : stagingItems.map(item => (
                    <tr key={item.pickingDetailId} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 text-sm font-semibold text-info font-tabular whitespace-nowrap">{item.pickingNumber}</td>
                      <td className="px-4 py-3 text-sm font-semibold font-tabular text-foreground">{item.skuCode}</td>
                      <td className="px-4 py-3 text-sm text-foreground max-w-[180px]">
                        <span className="truncate block">{item.skuName}</span>
                      </td>
                      <td className="px-4 py-3 text-xs font-tabular text-foreground">{item.palletId}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-warning-soft text-warning border border-yellow-200 px-2 py-0.5 rounded font-semibold font-tabular">
                          {item.stagingBinCode}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-bold font-tabular text-foreground">{item.qty}</td>
                    </tr>
                  ))}
                </tbody>
                {stagingItems.length > 0 && (
                  <tfoot>
                    <tr className="border-t-2 border-border bg-muted/50">
                      <td colSpan={5} className="px-4 py-2 text-xs font-semibold text-muted-foreground">Total siap dispatch</td>
                      <td className="px-4 py-2 text-sm font-bold font-tabular text-foreground">
                        {stagingItems.reduce((s, i) => s + i.qty, 0)} pcs
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </section>

        {/* ══ Dispatch History ═════════════════════════════════════════ */}
        <section>
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-3">
              <h2 className="text-sm font-bold text-foreground">Dispatch History</h2>
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

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="bg-muted border-b border-border">
                    <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Dispatch No.</th>
                    <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Penerima</th>
                    <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Kendaraan</th>
                    <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Items</th>
                    <th className="text-right px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-16">Qty</th>
                    <th className="text-left px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tanggal</th>
                    <th className="text-center px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                    <th className="text-center px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingList ? (
                    Array.from({ length: 3 }, (_, i) => (
                      <tr key={i} className="border-b border-border">
                        {Array.from({ length: 8 }, (_, j) => (
                          <td key={j} className="px-3 py-3"><div className="h-3.5 bg-muted animate-pulse rounded" /></td>
                        ))}
                      </tr>
                    ))
                  ) : paginated.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-3 py-14 text-center text-sm text-muted-foreground">
                        Belum ada riwayat dispatch.
                      </td>
                    </tr>
                  ) : paginated.map(rec => {
                    const key   = rec.status?.toLowerCase() as keyof typeof statusBadge;
                    const badge = statusBadge[key] ?? statusBadge.pending;
                    const total = rec.items.reduce((s, i) => s + i.qty, 0);

                    return (
                      <tr key={rec.id} className="border-b border-border last:border-0 row-hover">
                        <td className="px-3 py-3 text-xs font-semibold text-info font-tabular whitespace-nowrap">{rec.dispatchNumber}</td>
                        <td className="px-3 py-3 text-xs font-semibold text-foreground">{rec.driverName}</td>
                        <td className="px-3 py-3 text-xs font-tabular text-foreground">{rec.vehicleNumber}</td>
                        <td className="px-3 py-3 text-xs text-muted-foreground">
                          {rec.items.map((item, i) => (
                            <span key={i} className="block font-tabular">
                              {item.skuCode} <span className="text-foreground font-semibold">×{item.qty}</span>
                              {item.palletId && <span className="text-[10px] ml-1 opacity-60">[{item.palletId}]</span>}
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
                          {key === 'dispatched' && (
                            <button
                              onClick={() => { setBastTime(''); setBastRecord(rec); }}
                              className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-primary hover:bg-primary/10 px-2 py-0.5 rounded border border-blue-200 transition-colors"
                            >
                              <FileText size={10} /> BAST
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30">
              <p className="text-xs text-muted-foreground">
                {filtered.length === 0 ? 'Tidak ada data' : `${(page - 1) * ITEMS_PER_PAGE + 1}–${Math.min(page * ITEMS_PER_PAGE, filtered.length)} of ${filtered.length}`}
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
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="p-1.5 rounded hover:bg-muted disabled:opacity-40">
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
