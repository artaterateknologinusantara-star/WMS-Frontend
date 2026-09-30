'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, RefreshCw, Plus, ChevronLeft, ChevronRight,
  AlertTriangle, X, Pencil, PowerOff,
} from 'lucide-react';
import {
  getSKUList, getCategories, getUOMList,
  createSKU, updateSKU, deactivateSKU,
  type SKURecord, type CategoryOption, type UOMOption, type SaveSKURequest,
} from '@/lib/services/mastersku.service';

const ITEMS_PER_PAGE = 10;

interface ModalState {
  open: boolean;
  mode: 'add' | 'edit';
  record: SKURecord | null;
}

interface ConfirmState {
  open: boolean;
  record: SKURecord | null;
}

interface FormState {
  skuCode: string;
  skuName: string;
  categoryId: string;
  uomId: string;
}

const EMPTY_FORM: FormState = { skuCode: '', skuName: '', categoryId: '', uomId: '' };

export default function SKUContent() {
  const [items, setItems]               = useState<SKURecord[]>([]);
  const [categories, setCategories]     = useState<CategoryOption[]>([]);
  const [uomList, setUomList]           = useState<UOMOption[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [currentPage, setCurrentPage]   = useState(1);
  const [apiError, setApiError]         = useState('');
  const [modal, setModal]               = useState<ModalState>({ open: false, mode: 'add', record: null });
  const [confirm, setConfirm]           = useState<ConfirmState>({ open: false, record: null });
  const [form, setForm]                 = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError]       = useState('');
  const [submitting, setSubmitting]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setApiError('');
    try {
      const [skus, cats, uoms] = await Promise.all([getSKUList(), getCategories(), getUOMList()]);
      setItems(skus);
      setCategories(cats);
      setUomList(uoms);
    } catch {
      setApiError('Gagal memuat data. Silakan muat ulang halaman.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  // ── Filtering & pagination ──────────────────────────────────────────
  const filtered = items.filter(i =>
    !search ||
    i.skuCode.toLowerCase().includes(search.toLowerCase()) ||
    i.skuName.toLowerCase().includes(search.toLowerCase()) ||
    i.categoryName.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated  = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // ── Modal helpers ───────────────────────────────────────────────────
  const openAdd = () => {
    setForm(EMPTY_FORM);
    setFormError('');
    setModal({ open: true, mode: 'add', record: null });
  };

  const openEdit = (rec: SKURecord) => {
    setForm({
      skuCode:    rec.skuCode,
      skuName:    rec.skuName,
      categoryId: rec.categoryId?.toString() ?? '',
      uomId:      rec.uomId?.toString() ?? '',
    });
    setFormError('');
    setModal({ open: true, mode: 'edit', record: rec });
  };

  const closeModal = () => setModal(m => ({ ...m, open: false }));

  // ── Form submit (add / edit) ────────────────────────────────────────
  const handleSubmit = async () => {
    setFormError('');
    if (!form.skuCode.trim()) { setFormError('Kode SKU wajib diisi.'); return; }
    if (!form.skuName.trim()) { setFormError('Nama SKU wajib diisi.'); return; }

    setSubmitting(true);
    try {
      const req: SaveSKURequest = {
        skuCode:    form.skuCode.trim(),
        skuName:    form.skuName.trim(),
        categoryId: form.categoryId ? Number(form.categoryId) : undefined,
        uomId:      form.uomId      ? Number(form.uomId)      : undefined,
      };
      if (modal.mode === 'add') {
        await createSKU(req);
      } else {
        await updateSKU(modal.record!.id, req);
      }
      closeModal();
      void load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Terjadi kesalahan.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Deactivate ──────────────────────────────────────────────────────
  const handleDeactivate = async () => {
    if (!confirm.record) return;
    setSubmitting(true);
    try {
      await deactivateSKU(confirm.record.id);
      setConfirm({ open: false, record: null });
      void load();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Gagal menonaktifkan SKU.');
      setConfirm({ open: false, record: null });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">

      {/* ── Add / Edit Modal ────────────────────────────────────────── */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl border border-border shadow-xl w-full max-w-md mx-4 animate-fade-in">

            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">
                {modal.mode === 'add' ? 'Tambah SKU Baru' : 'Edit SKU'}
              </h3>
              <button onClick={closeModal} className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted">
                <X size={16} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Kode SKU <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={form.skuCode}
                  onChange={e => setForm(f => ({ ...f, skuCode: e.target.value }))}
                  className="form-input text-sm font-tabular"
                  placeholder="mis. SKU-001"
                  disabled={modal.mode === 'edit'}
                />
                {modal.mode === 'edit' && (
                  <p className="mt-1 text-xs text-muted-foreground">Kode SKU tidak dapat diubah setelah dibuat.</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Nama SKU <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={form.skuName}
                  onChange={e => setForm(f => ({ ...f, skuName: e.target.value }))}
                  className="form-input text-sm"
                  placeholder="mis. Nama Produk"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Kategori</label>
                <select
                  value={form.categoryId}
                  onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
                  className="form-input text-sm"
                >
                  <option value="">— Tidak Ada —</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.categoryName} ({c.requiresFEFO ? 'FEFO' : 'FIFO'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">UOM</label>
                <select
                  value={form.uomId}
                  onChange={e => setForm(f => ({ ...f, uomId: e.target.value }))}
                  className="form-input text-sm"
                >
                  <option value="">— Tidak Ada —</option>
                  {uomList.map(u => (
                    <option key={u.id} value={u.id}>{u.uomCode} — {u.uomName}</option>
                  ))}
                </select>
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
                {submitting ? 'Menyimpan...' : modal.mode === 'add' ? 'Tambah SKU' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Deactivate Confirm Dialog ───────────────────────────────── */}
      {confirm.open && confirm.record && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl border border-border shadow-xl w-full max-w-sm mx-4 animate-fade-in">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="text-sm font-bold text-foreground">Nonaktifkan SKU</h3>
            </div>
            <div className="px-5 py-4">
              <p className="text-sm text-foreground">
                Apakah Anda yakin ingin menonaktifkan{' '}
                <strong className="font-semibold">{confirm.record.skuCode}</strong>
                {' '}— {confirm.record.skuName}?
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                SKU akan ditandai nonaktif dan disembunyikan dari alur kerja operasional.
              </p>
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
                onClick={handleDeactivate}
                disabled={submitting}
                className="text-sm font-semibold px-3 py-1.5 rounded bg-danger text-white hover:bg-danger/90 disabled:opacity-50"
              >
                {submitting ? 'Menonaktifkan...' : 'Nonaktifkan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="bg-white border-b border-border px-4 py-3 sm:px-6 lg:px-8 lg:py-4 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-lg font-bold text-foreground">Master SKU</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Kelola SKU produk, kategori, dan satuan ukur</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="btn-ghost text-xs border border-border flex items-center gap-1.5">
            <RefreshCw size={13} /> Muat Ulang
          </button>
          <button onClick={openAdd} className="btn-primary text-xs flex items-center gap-1.5">
            <Plus size={13} /> Tambah SKU
          </button>
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
              placeholder="Cari kode SKU, nama, atau kategori..."
              value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
              className="form-input pl-9 text-sm"
            />
          </div>
          <span className="text-xs text-muted-foreground ml-auto">{filtered.length} SKU</span>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="bg-muted border-b border-border">
                  {['Kode SKU', 'Nama', 'Kategori', 'UOM', 'Qty', 'Status', 'Aksi'].map(col => (
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
                    {search ? 'Tidak ada SKU yang cocok dengan pencarian.' : 'Belum ada SKU. Tambahkan satu untuk memulai.'}
                  </td></tr>
                ) : paginated.map(item => (
                  <tr key={item.id} className="border-b border-border last:border-0 row-hover">
                    <td className="px-4 py-3 text-sm font-semibold font-tabular text-info">{item.skuCode}</td>
                    <td className="px-4 py-3 text-sm max-w-[200px]">
                      <span className="truncate block">{item.skuName}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {item.categoryName || '—'}
                      {item.categoryName && (
                        <span
                          className={`ml-1.5 status-badge ${item.requiresFEFO ? 'bg-warning-soft text-warning border border-yellow-200' : 'bg-muted text-muted-foreground border border-border'}`}
                          title={item.requiresFEFO ? 'Picking mengutamakan tanggal kedaluwarsa terdekat (FEFO)' : 'Picking mengutamakan urutan masuk (FIFO)'}
                        >
                          {item.requiresFEFO ? 'FEFO' : 'FIFO'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm font-tabular">{item.uomCode || '—'}</td>
                    <td className="px-4 py-3 text-sm font-tabular text-right">{item.qty}</td>
                    <td className="px-4 py-3">
                      {item.isActive
                        ? <span className="status-badge bg-success-soft text-success border border-green-200">Aktif</span>
                        : <span className="status-badge bg-gray-100 text-gray-500 border border-gray-200">Nonaktif</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEdit(item)}
                          className="text-xs font-semibold text-primary hover:bg-primary/10 px-2 py-1 rounded transition-colors flex items-center gap-1"
                        >
                          <Pencil size={11} /> Edit
                        </button>
                        {item.isActive && (
                          <button
                            onClick={() => setConfirm({ open: true, record: item })}
                            className="text-xs font-semibold text-danger hover:bg-danger/10 px-2 py-1 rounded transition-colors flex items-center gap-1"
                          >
                            <PowerOff size={11} /> Nonaktifkan
                          </button>
                        )}
                      </div>
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
