'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, RefreshCw, Plus, ChevronLeft, ChevronRight,
  AlertTriangle, X, PowerOff, Power,
} from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import {
  getBinList, createBin, toggleBinActive,
  type BinRecord, type CreateBinRequest,
} from '@/lib/services/binlocation.service';

const ITEMS_PER_PAGE = 10;

interface ConfirmState {
  open: boolean;
  record: BinRecord | null;
}

interface FormState {
  binCode: string;
  zone: string;
  rack: string;
  capacityQty: string;
}

const EMPTY_FORM: FormState = { binCode: '', zone: '', rack: '', capacityQty: '' };

export default function BinLocationContent() {
  const { user } = useAuth();
  const canManage = user?.role === 'SuperAdmin' || user?.role === 'WarehouseManager';

  const [items, setItems]             = useState<BinRecord[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [apiError, setApiError]       = useState('');
  const [modalOpen, setModalOpen]     = useState(false);
  const [confirm, setConfirm]         = useState<ConfirmState>({ open: false, record: null });
  const [form, setForm]               = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError]     = useState('');
  const [submitting, setSubmitting]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setApiError('');
    try {
      const bins = await getBinList();
      setItems(bins);
    } catch {
      setApiError('Gagal memuat data lokasi bin. Silakan muat ulang halaman.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  // ── Filtering & pagination ──────────────────────────────────────────
  const filtered = items.filter(i =>
    !search ||
    i.binCode.toLowerCase().includes(search.toLowerCase()) ||
    i.zone.toLowerCase().includes(search.toLowerCase()) ||
    (i.rack ?? '').toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated  = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // ── Modal helpers ───────────────────────────────────────────────────
  const openAdd = () => {
    setForm(EMPTY_FORM);
    setFormError('');
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  // ── Form submit (add) ───────────────────────────────────────────────
  const handleSubmit = async () => {
    setFormError('');
    if (!form.binCode.trim()) { setFormError('Kode Bin wajib diisi.'); return; }
    if (!form.zone.trim()) { setFormError('Zona wajib diisi.'); return; }
    const capacity = form.capacityQty.trim() ? Number(form.capacityQty) : 0;
    if (Number.isNaN(capacity) || capacity < 0) { setFormError('Kapasitas harus berupa angka yang valid.'); return; }

    setSubmitting(true);
    try {
      const req: CreateBinRequest = {
        binCode: form.binCode.trim(),
        zone: form.zone.trim(),
        rack: form.rack.trim() || undefined,
        capacityQty: capacity,
      };
      await createBin(req);
      closeModal();
      void load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Terjadi kesalahan saat menyimpan data.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Toggle active ───────────────────────────────────────────────────
  const handleToggle = async () => {
    if (!confirm.record) return;
    setSubmitting(true);
    try {
      await toggleBinActive(confirm.record.id);
      setConfirm({ open: false, record: null });
      void load();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Gagal mengubah status bin.');
      setConfirm({ open: false, record: null });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">

      {/* ── Add Modal ───────────────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl border border-border shadow-xl w-full max-w-md mx-4 animate-fade-in">

            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">Tambah Lokasi Bin</h3>
              <button onClick={closeModal} className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted">
                <X size={16} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Kode Bin <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={form.binCode}
                  onChange={e => setForm(f => ({ ...f, binCode: e.target.value }))}
                  className="form-input text-sm font-tabular"
                  placeholder="mis. STG-A01"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Zona <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={form.zone}
                  onChange={e => setForm(f => ({ ...f, zone: e.target.value }))}
                  className="form-input text-sm"
                  placeholder="mis. Outbound Staging"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Rak</label>
                <input
                  type="text"
                  value={form.rack}
                  onChange={e => setForm(f => ({ ...f, rack: e.target.value }))}
                  className="form-input text-sm"
                  placeholder="mis. R-01 (opsional)"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Kapasitas (Qty)</label>
                <input
                  type="number"
                  min={0}
                  value={form.capacityQty}
                  onChange={e => setForm(f => ({ ...f, capacityQty: e.target.value }))}
                  className="form-input text-sm font-tabular"
                  placeholder="0"
                />
              </div>

              {formError && (
                <div className="rounded-lg bg-danger/10 border border-danger/20 px-3 py-2 flex items-center gap-2">
                  <AlertTriangle size={13} className="text-danger shrink-0" />
                  <p className="text-xs text-danger">{formError}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-4 border-t border-border flex justify-end gap-2">
              <button onClick={closeModal} disabled={submitting} className="btn-ghost text-sm border border-border">
                Batal
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="btn-primary text-sm disabled:opacity-50"
              >
                {submitting ? 'Menyimpan...' : 'Tambah Bin'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toggle Active Confirm Dialog ────────────────────────────── */}
      {confirm.open && confirm.record && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl border border-border shadow-xl w-full max-w-sm mx-4 animate-fade-in">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="text-sm font-bold text-foreground">
                {confirm.record.isActive ? 'Nonaktifkan Bin' : 'Aktifkan Bin'}
              </h3>
            </div>
            <div className="px-5 py-4">
              <p className="text-sm text-foreground">
                Apakah Anda yakin ingin {confirm.record.isActive ? 'menonaktifkan' : 'mengaktifkan'}{' '}
                <strong className="font-semibold">{confirm.record.binCode}</strong>
                {' '}({confirm.record.zone})?
              </p>
              {confirm.record.isActive && confirm.record.isOccupied && (
                <p className="text-xs text-danger mt-2">
                  Bin ini sedang terisi stok aktif. Sistem akan menolak penonaktifan sampai bin dikosongkan.
                </p>
              )}
            </div>
            <div className="px-5 py-4 border-t border-border flex justify-end gap-2">
              <button
                onClick={() => setConfirm({ open: false, record: null })}
                disabled={submitting}
                className="btn-ghost text-sm border border-border"
              >
                Batal
              </button>
              <button
                onClick={handleToggle}
                disabled={submitting}
                className={`text-sm font-semibold px-3 py-1.5 rounded text-white disabled:opacity-50 ${confirm.record.isActive ? 'bg-danger hover:bg-danger/90' : 'bg-success hover:bg-success/90'}`}
              >
                {submitting ? 'Memproses...' : confirm.record.isActive ? 'Nonaktifkan' : 'Aktifkan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="bg-white border-b border-border px-4 py-3 sm:px-6 lg:px-8 lg:py-4 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-lg font-bold text-foreground">Master Lokasi Bin</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Kelola lokasi bin, zona, rak, dan kapasitas penyimpanan</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="btn-ghost text-xs border border-border flex items-center gap-1.5">
            <RefreshCw size={13} /> Muat Ulang
          </button>
          {canManage && (
            <button onClick={openAdd} className="btn-primary text-xs flex items-center gap-1.5">
              <Plus size={13} /> Tambah Bin
            </button>
          )}
        </div>
      </div>

      <div className="px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6 max-w-screen-2xl">

        {apiError && (
          <div className="mb-4 rounded-lg bg-danger/10 border border-danger/20 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-danger">
              <AlertTriangle size={14} /> {apiError}
            </div>
            <button onClick={() => setApiError('')} className="text-danger/60 hover:text-danger">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Search */}
        <div className="flex items-center gap-3 mb-5">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari kode bin, zona, atau rak..."
              value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
              className="form-input pl-9 text-sm"
            />
          </div>
          <span className="text-xs text-muted-foreground ml-auto">{filtered.length} bin</span>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="bg-muted border-b border-border">
                  {['Kode Bin', 'Zona', 'Rak', 'Kapasitas', 'Okupansi', 'Status', 'Aksi'].map(col => (
                    <th key={col} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">Memuat data...</td></tr>
                ) : paginated.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    {search ? 'Tidak ada bin yang cocok dengan pencarian.' : 'Belum ada lokasi bin. Tambahkan satu untuk memulai.'}
                  </td></tr>
                ) : paginated.map(item => (
                  <tr key={item.id} className="border-b border-border last:border-0 row-hover">
                    <td className="px-4 py-3 text-sm font-semibold font-tabular text-info">{item.binCode}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{item.zone}</td>
                    <td className="px-4 py-3 text-sm font-tabular">{item.rack || '—'}</td>
                    <td className="px-4 py-3 text-sm font-tabular text-right">{item.capacityQty}</td>
                    <td className="px-4 py-3">
                      {item.isOccupied
                        ? <span className="status-badge bg-warning-soft text-warning border border-amber-200">Terisi</span>
                        : <span className="status-badge bg-gray-100 text-gray-500 border border-gray-200">Kosong</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      {item.isActive
                        ? <span className="status-badge bg-success-soft text-success border border-green-200">Aktif</span>
                        : <span className="status-badge bg-gray-100 text-gray-500 border border-gray-200">Nonaktif</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      {canManage && (
                        <button
                          onClick={() => setConfirm({ open: true, record: item })}
                          disabled={item.isActive && item.isOccupied}
                          title={item.isActive && item.isOccupied ? 'Tidak dapat menonaktifkan bin yang sedang terisi' : undefined}
                          className={`text-xs font-semibold px-2 py-1 rounded transition-colors flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed ${item.isActive ? 'text-danger hover:bg-danger/10' : 'text-success hover:bg-success/10'}`}
                        >
                          {item.isActive ? <><PowerOff size={11} /> Nonaktifkan</> : <><Power size={11} /> Aktifkan</>}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30">
            <p className="text-xs text-muted-foreground">
              {filtered.length === 0 ? 'Tidak ada data' : `Menampilkan ${(currentPage - 1) * ITEMS_PER_PAGE + 1}–${Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} dari ${filtered.length}`}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 rounded hover:bg-muted disabled:opacity-40">
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button key={page} onClick={() => setCurrentPage(page)}
                  className={`w-7 h-7 rounded text-xs font-semibold ${page === currentPage ? 'bg-primary text-white' : 'hover:bg-muted text-muted-foreground'}`}>
                  {page}
                </button>
              ))}
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} className="p-1.5 rounded hover:bg-muted disabled:opacity-40">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
