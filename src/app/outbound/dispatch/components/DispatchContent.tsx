'use client';

import React, { useState } from 'react';
import { Truck, CheckCircle2, Download, Clock, ChevronLeft, ChevronRight, FileText } from 'lucide-react';

interface DispatchRecord {
  id: string;
  deliveryNumber: string;
  customer: string;
  driverName: string;
  vehicleNumber: string;
  dispatchTime: string;
  shipmentNotes: string;
  status: 'pending' | 'dispatched' | 'delivered';
  packingIds: string[];
}

const mockDispatches: DispatchRecord[] = [
  { id: 'dsp-001', deliveryNumber: 'DEL-2026-001', customer: 'PT. Maju Sejahtera', driverName: 'Supardi', vehicleNumber: 'B 1234 XY', dispatchTime: '2026-05-10 08:00', shipmentNotes: 'Handle with care', status: 'delivered', packingIds: ['PKG-2026-001'] },
  { id: 'dsp-002', deliveryNumber: 'DEL-2026-002', customer: 'CV. Berkah Abadi', driverName: 'Wahyu', vehicleNumber: 'D 5678 AB', dispatchTime: '2026-05-10 10:30', shipmentNotes: '', status: 'dispatched', packingIds: ['PKG-2026-002'] },
  { id: 'dsp-003', deliveryNumber: 'DEL-2026-003', customer: 'PT. Nusantara Logistik', driverName: '', vehicleNumber: '', dispatchTime: '', shipmentNotes: '', status: 'pending', packingIds: ['PKG-2026-003'] },
];

const statusBadge: Record<string, { label: string; classes: string }> = {
  pending: { label: 'Pending', classes: 'bg-warning-soft text-warning border border-yellow-200' },
  dispatched: { label: 'Dispatched', classes: 'bg-info-soft text-info border border-blue-200' },
  delivered: { label: 'Delivered', classes: 'bg-success-soft text-success border border-green-200' },
};

const ITEMS_PER_PAGE = 5;

export default function DispatchContent() {
  const [form, setForm] = useState({
    deliveryNumber: '',
    customer: '',
    driverName: '',
    vehicleNumber: '',
    dispatchTime: '',
    shipmentNotes: '',
    packingId: '',
  });
  const [dispatches, setDispatches] = useState<DispatchRecord[]>(mockDispatches);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [historyPage, setHistoryPage] = useState(1);
  const [bastGenerated, setBastGenerated] = useState<string | null>(null);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.deliveryNumber) e.deliveryNumber = 'Required';
    if (!form.customer) e.customer = 'Required';
    if (!form.driverName) e.driverName = 'Required';
    if (!form.vehicleNumber) e.vehicleNumber = 'Required';
    if (!form.dispatchTime) e.dispatchTime = 'Required';
    return e;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    const newRecord: DispatchRecord = {
      id: `dsp-${Date.now()}`,
      deliveryNumber: form.deliveryNumber,
      customer: form.customer,
      driverName: form.driverName,
      vehicleNumber: form.vehicleNumber,
      dispatchTime: form.dispatchTime,
      shipmentNotes: form.shipmentNotes,
      status: 'dispatched',
      packingIds: form.packingId ? [form.packingId] : [],
    };
    setDispatches(prev => [newRecord, ...prev]);
    setBastGenerated(`BAST-${form.deliveryNumber}`);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setBastGenerated(null);
      setForm({ deliveryNumber: '', customer: '', driverName: '', vehicleNumber: '', dispatchTime: '', shipmentNotes: '', packingId: '' });
    }, 4000);
  };

  const totalPages = Math.ceil(dispatches.length / ITEMS_PER_PAGE);
  const paginated = dispatches.slice((historyPage - 1) * ITEMS_PER_PAGE, historyPage * ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b border-border px-4 py-3 sm:px-6 lg:px-8 lg:py-4 sticky top-0 z-10">
        <h1 className="text-lg font-bold text-foreground">Dispatch</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Confirm outbound shipment and generate BAST document</p>
      </div>

      <div className="px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6 max-w-screen-xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Dispatch Form */}
          <div className="col-span-1">
            <div className="card p-5">
              <h2 className="text-sm font-bold text-foreground mb-4 pb-3 border-b border-border">New Dispatch</h2>

              {submitted && (
                <div className="mb-4 space-y-2">
                  <div className="bg-success-soft border border-green-200 rounded px-4 py-3 flex items-center gap-2 text-success text-sm font-semibold">
                    <CheckCircle2 size={16} />
                    Dispatch confirmed successfully
                  </div>
                  {bastGenerated && (
                    <div className="bg-info-soft border border-blue-200 rounded px-4 py-3 flex items-center gap-2 text-info text-sm">
                      <FileText size={14} />
                      <span>BAST generated: <strong>{bastGenerated}</strong></span>
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="form-label text-xs">Delivery Number <span className="text-danger">*</span></label>
                  <input type="text" placeholder="e.g. DEL-2026-004" value={form.deliveryNumber} onChange={e => setForm(f => ({ ...f, deliveryNumber: e.target.value }))} className={`form-input text-sm ${errors.deliveryNumber ? 'border-danger' : ''}`} />
                  {errors.deliveryNumber && <p className="text-xs text-danger mt-1">{errors.deliveryNumber}</p>}
                </div>

                <div>
                  <label className="form-label text-xs">Customer <span className="text-danger">*</span></label>
                  <input type="text" placeholder="Customer name..." value={form.customer} onChange={e => setForm(f => ({ ...f, customer: e.target.value }))} className={`form-input text-sm ${errors.customer ? 'border-danger' : ''}`} />
                  {errors.customer && <p className="text-xs text-danger mt-1">{errors.customer}</p>}
                </div>

                <div>
                  <label className="form-label text-xs">Packing ID</label>
                  <input type="text" placeholder="e.g. PKG-2026-003" value={form.packingId} onChange={e => setForm(f => ({ ...f, packingId: e.target.value }))} className="form-input text-sm" />
                </div>

                <div>
                  <label className="form-label text-xs">Driver Name <span className="text-danger">*</span></label>
                  <input type="text" placeholder="Driver name..." value={form.driverName} onChange={e => setForm(f => ({ ...f, driverName: e.target.value }))} className={`form-input text-sm ${errors.driverName ? 'border-danger' : ''}`} />
                  {errors.driverName && <p className="text-xs text-danger mt-1">{errors.driverName}</p>}
                </div>

                <div>
                  <label className="form-label text-xs">Vehicle Number <span className="text-danger">*</span></label>
                  <input type="text" placeholder="e.g. B 1234 XY" value={form.vehicleNumber} onChange={e => setForm(f => ({ ...f, vehicleNumber: e.target.value }))} className={`form-input text-sm ${errors.vehicleNumber ? 'border-danger' : ''}`} />
                  {errors.vehicleNumber && <p className="text-xs text-danger mt-1">{errors.vehicleNumber}</p>}
                </div>

                <div>
                  <label className="form-label text-xs">Dispatch Time <span className="text-danger">*</span></label>
                  <input type="datetime-local" value={form.dispatchTime} onChange={e => setForm(f => ({ ...f, dispatchTime: e.target.value }))} className={`form-input text-sm ${errors.dispatchTime ? 'border-danger' : ''}`} />
                  {errors.dispatchTime && <p className="text-xs text-danger mt-1">{errors.dispatchTime}</p>}
                </div>

                <div>
                  <label className="form-label text-xs">Shipment Notes</label>
                  <textarea rows={2} placeholder="Additional notes..." value={form.shipmentNotes} onChange={e => setForm(f => ({ ...f, shipmentNotes: e.target.value }))} className="form-input text-sm resize-none" />
                </div>

                <button type="submit" className="btn-primary w-full justify-center flex items-center gap-2">
                  <Truck size={15} />
                  Confirm Dispatch
                </button>
              </form>
            </div>
          </div>

          {/* Dispatch History */}
          <div className="col-span-2">
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <h2 className="text-sm font-bold text-foreground">Dispatch History</h2>
                <button className="btn-ghost text-xs border border-border flex items-center gap-1.5">
                  <Download size={13} />
                  Export
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr className="bg-muted border-b border-border">
                      {['Delivery No.', 'Customer', 'Driver', 'Vehicle', 'Dispatch Time', 'Packing IDs', 'Status', 'BAST'].map(col => (
                        <th key={col} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.length === 0 ? (
                      <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">No dispatch records found.</td></tr>
                    ) : paginated.map(rec => {
                      const badge = statusBadge[rec.status];
                      return (
                        <tr key={rec.id} className="border-b border-border last:border-0 row-hover">
                          <td className="px-4 py-3 text-sm font-semibold text-info font-tabular">{rec.deliveryNumber}</td>
                          <td className="px-4 py-3 text-sm text-foreground max-w-[140px]"><span className="truncate block">{rec.customer}</span></td>
                          <td className="px-4 py-3 text-sm text-foreground">{rec.driverName || <span className="text-muted-foreground italic">—</span>}</td>
                          <td className="px-4 py-3 text-sm font-tabular text-foreground">{rec.vehicleNumber || <span className="text-muted-foreground italic">—</span>}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground font-tabular whitespace-nowrap">
                            {rec.dispatchTime ? (
                              <span className="flex items-center gap-1"><Clock size={11} />{rec.dispatchTime}</span>
                            ) : <span className="italic">Not set</span>}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground font-tabular">
                            {rec.packingIds.length > 0 ? rec.packingIds.join(', ') : '—'}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`status-badge ${badge.classes}`}>{badge.label}</span>
                          </td>
                          <td className="px-4 py-3">
                            {rec.status !== 'pending' ? (
                              <button className="text-xs font-semibold text-primary hover:bg-primary/10 px-2 py-1 rounded transition-colors flex items-center gap-1">
                                <FileText size={12} />
                                BAST
                              </button>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30">
                <p className="text-xs text-muted-foreground">Showing {dispatches.length === 0 ? 0 : (historyPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(historyPage * ITEMS_PER_PAGE, dispatches.length)} of {dispatches.length}</p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setHistoryPage(p => Math.max(1, p - 1))} disabled={historyPage === 1} className="p-1.5 rounded hover:bg-muted disabled:opacity-40"><ChevronLeft size={14} /></button>
                  {Array.from({ length: Math.max(1, totalPages) }, (_, i) => i + 1).map(page => (
                    <button key={page} onClick={() => setHistoryPage(page)} className={`w-7 h-7 rounded text-xs font-semibold ${page === historyPage ? 'bg-primary text-white' : 'hover:bg-muted text-muted-foreground'}`}>{page}</button>
                  ))}
                  <button onClick={() => setHistoryPage(p => Math.min(totalPages, p + 1))} disabled={historyPage === totalPages || totalPages === 0} className="p-1.5 rounded hover:bg-muted disabled:opacity-40"><ChevronRight size={14} /></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
