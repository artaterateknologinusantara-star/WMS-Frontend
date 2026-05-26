'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend,
} from 'recharts';
import {
  RefreshCw, ArrowRight, Package, Layers, Truck, ClipboardList,
  AlertTriangle, CheckCircle2, Activity, Settings2, TrendingUp,
  Inbox, BoxSelect, WarehouseIcon,
} from 'lucide-react';
import {
  getDashboardSummary,
  getDashboardActivity,
  type DashboardSummary,
  type ActivityItem,
} from '@/lib/services/dashboard.service';

// ── helpers ──────────────────────────────────────────────────────────────────

function movementMeta(type: string): { label: string; iconBg: string; iconColor: string } {
  switch (type) {
    case 'Putaway':    return { label: 'Putaway',    iconBg: 'bg-blue-100',   iconColor: 'text-blue-600' };
    case 'Picking':    return { label: 'Picking',    iconBg: 'bg-orange-100', iconColor: 'text-orange-600' };
    case 'Dispatch':   return { label: 'Dispatch',   iconBg: 'bg-green-100',  iconColor: 'text-green-600' };
    case 'Adjustment': return { label: 'Adjustment', iconBg: 'bg-purple-100', iconColor: 'text-purple-600' };
    default:           return { label: type,         iconBg: 'bg-slate-100',  iconColor: 'text-slate-500' };
  }
}

function movementIcon(type: string) {
  switch (type) {
    case 'Putaway':    return <Package size={13} />;
    case 'Picking':    return <ClipboardList size={13} />;
    case 'Dispatch':   return <Truck size={13} />;
    case 'Adjustment': return <Settings2 size={13} />;
    default:           return <Activity size={13} />;
  }
}

const ZONE_COLORS: Record<string, string> = {
  'A': '#3b82f6',
  'B': '#10b981',
  'C': '#8b5cf6',
  'Inbound Staging': '#f59e0b',
  'Outbound Staging': '#ef4444',
  'Unknown': '#94a3b8',
};

function zoneColor(zone: string): string {
  return ZONE_COLORS[zone] ?? '#6366f1';
}

// ── sub-components ────────────────────────────────────────────────────────────

interface ModuleCardProps {
  title: string;
  icon: React.ReactNode;
  borderColor: string;
  href: string;
  linkLabel: string;
  children: React.ReactNode;
}

function ModuleCard({ title, icon, borderColor, href, linkLabel, children }: ModuleCardProps) {
  return (
    <div className={`card p-5 border-l-4 ${borderColor} flex flex-col gap-3`}>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">{icon}</span>
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{title}</h3>
      </div>
      <div className="flex-1 space-y-2.5">{children}</div>
      <Link
        href={href}
        className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline mt-auto"
      >
        {linkLabel} <ArrowRight size={12} />
      </Link>
    </div>
  );
}

interface MetricRowProps {
  label: string;
  value: number | string;
  alert?: boolean;
  big?: boolean;
}

function MetricRow({ label, value, alert = false, big = false }: MetricRowProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={
          big
            ? `text-2xl font-bold font-tabular ${alert && Number(value) > 0 ? 'text-danger' : 'text-foreground'}`
            : `text-sm font-bold font-tabular ${alert && Number(value) > 0 ? 'text-danger bg-danger-soft px-2 py-0.5 rounded-full' : 'text-foreground'}`
        }
      >
        {value}
      </span>
    </div>
  );
}

// ── pipeline visualization ────────────────────────────────────────────────────

interface PipelineStepProps {
  label: string;
  count: number;
  color: string;
  alert?: boolean;
}

function PipelineStep({ label, count, color, alert }: PipelineStepProps) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className={`w-14 h-14 rounded-xl flex items-center justify-center text-white text-lg font-bold font-tabular shadow-sm ${alert && count > 0 ? 'ring-2 ring-danger ring-offset-1' : ''}`}
        style={{ backgroundColor: color }}
      >
        {count}
      </div>
      <span className="text-xs text-center text-muted-foreground leading-tight">{label}</span>
    </div>
  );
}

function PipelineArrow() {
  return <div className="text-muted-foreground/40 text-lg font-bold flex-shrink-0">›</div>;
}

// ── main component ────────────────────────────────────────────────────────────

export default function DashboardContent() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      setError(null);
      const [sum, act] = await Promise.all([getDashboardSummary(), getDashboardActivity()]);
      setSummary(sum);
      setActivity(act);
      setLastUpdated(new Date());
    } catch {
      setError('Gagal memuat data dashboard. Pastikan server API berjalan.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formattedTime = lastUpdated
    ? lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '—';

  // ── loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-white border-b border-border px-4 py-3 sm:px-6 lg:px-8 lg:py-4">
          <div className="h-5 w-48 bg-muted rounded animate-pulse" />
        </div>
        <div className="px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6 max-w-screen-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="card p-5 h-48 animate-pulse bg-muted/40" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── error state ───────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <AlertTriangle size={36} className="text-danger mx-auto" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <button
            onClick={() => fetchData()}
            className="btn-primary text-xs px-4 py-2 rounded-lg"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  const d = summary!;
  const hasPendingAlert =
    d.inbound.pendingPutaway > 0 ||
    d.outbound.pendingPicks > 0 ||
    d.outbound.pendingDispatches > 0 ||
    d.adjustments.pending > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ── */}
      <div className="bg-white border-b border-border px-4 py-3 sm:px-6 lg:px-8 lg:py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-foreground">Operations Dashboard</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ringkasan operasional gudang secara real-time
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {hasPendingAlert && (
            <span className="hidden sm:flex items-center gap-1 text-xs font-semibold text-danger bg-danger-soft border border-red-200 px-2.5 py-1 rounded-full">
              <AlertTriangle size={11} />
              Ada item pending
            </span>
          )}
          <span className="flex items-center gap-1.5 text-xs text-success bg-success-soft border border-green-200 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            Live
          </span>
          <span className="hidden sm:inline text-xs text-muted-foreground">
            Diperbarui: {formattedTime}
          </span>
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6 max-w-screen-2xl space-y-6">

        {/* ── Module Cards ── */}
        <div>
          <h2 className="text-sm font-bold text-foreground mb-3">Status Modul</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

            {/* Inbound */}
            <ModuleCard
              title="Inbound"
              icon={<Inbox size={15} />}
              borderColor="border-blue-500"
              href="/putaway"
              linkLabel="Ke Putaway"
            >
              <MetricRow label="Menunggu Putaway" value={d.inbound.pendingPutaway} alert big />
              <MetricRow label="Draft Receiving" value={d.inbound.draftReceivings} alert />
              <MetricRow label="Total Receiving" value={d.inbound.totalReceivings} />
            </ModuleCard>

            {/* Inventory */}
            <ModuleCard
              title="Inventory"
              icon={<Layers size={15} />}
              borderColor="border-emerald-500"
              href="/inventory/stock-on-hand"
              linkLabel="Stock on Hand"
            >
              <MetricRow label="Pallet Aktif" value={d.inventory.activePallets} big />
              <MetricRow label="Total Qty Aktif" value={`${d.inventory.activeQty.toLocaleString('id-ID')} unit`} />
              <MetricRow label="Pallet di Staging" value={d.inventory.stagingPallets} />
              <MetricRow label="Qty di Staging" value={`${d.inventory.stagingQty.toLocaleString('id-ID')} unit`} />
            </ModuleCard>

            {/* Outbound */}
            <ModuleCard
              title="Outbound"
              icon={<TrendingUp size={15} />}
              borderColor="border-orange-500"
              href="/outbound/picking"
              linkLabel="Ke Picking"
            >
              <MetricRow label="Pending Picking" value={d.outbound.pendingPicks} alert big />
              <MetricRow label="Selesai Hari Ini" value={d.outbound.completedPicksToday} />
              <MetricRow label="Pending Dispatch" value={d.outbound.pendingDispatches} alert />
              <MetricRow label="Dispatched Hari Ini" value={d.outbound.dispatchedToday} />
            </ModuleCard>

            {/* Adjustments */}
            <ModuleCard
              title="Penyesuaian Stok"
              icon={<Settings2 size={15} />}
              borderColor={d.adjustments.pending > 0 ? 'border-danger' : 'border-slate-300'}
              href="/inventory/adjustment-approval"
              linkLabel="Ke Persetujuan"
            >
              <div className="flex flex-col items-center py-3 gap-1">
                <span
                  className={`text-5xl font-bold font-tabular ${d.adjustments.pending > 0 ? 'text-danger' : 'text-foreground'}`}
                >
                  {d.adjustments.pending}
                </span>
                <span className="text-xs text-muted-foreground">
                  {d.adjustments.pending === 0
                    ? 'Tidak ada pending'
                    : 'Menunggu persetujuan'}
                </span>
                {d.adjustments.pending > 0 && (
                  <span className="text-xs font-semibold text-danger bg-danger-soft px-2 py-0.5 rounded-full mt-1">
                    Butuh tindakan
                  </span>
                )}
              </div>
            </ModuleCard>
          </div>
        </div>

        {/* ── Warehouse Pipeline + Zone Chart ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

          {/* Stock by Zone Chart */}
          <div className="col-span-1 lg:col-span-3 card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-foreground">Stok per Zona</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Jumlah pallet aktif di setiap zona gudang
                </p>
              </div>
              <BoxSelect size={16} className="text-muted-foreground" />
            </div>
            {d.stockByZone.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
                Belum ada stok di warehouse
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={d.stockByZone}
                  margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
                  barSize={32}
                >
                  <XAxis
                    dataKey="zone"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 8,
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    }}
                    formatter={(value: number, name: string) => [
                      value.toLocaleString('id-ID'),
                      name === 'pallets' ? 'Pallet' : 'Qty',
                    ]}
                    labelFormatter={(zone) => `Zona: ${zone}`}
                  />
                  <Bar dataKey="pallets" name="pallets" radius={[4, 4, 0, 0]}>
                    {d.stockByZone.map((entry) => (
                      <Cell key={entry.zone} fill={zoneColor(entry.zone)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
            {/* Zone legend */}
            {d.stockByZone.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {d.stockByZone.map((z) => (
                  <div key={z.zone} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span
                      className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                      style={{ backgroundColor: zoneColor(z.zone) }}
                    />
                    <span className="font-medium text-foreground">{z.zone}</span>
                    <span>— {z.pallets} pallet, {z.qty.toLocaleString('id-ID')} unit</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Warehouse Pipeline */}
          <div className="col-span-1 lg:col-span-2 card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-foreground">Alur Proses Gudang</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Status item di setiap tahap
                </p>
              </div>
              <WarehouseIcon size={16} className="text-muted-foreground" />
            </div>

            {/* Inbound pipeline */}
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Inbound</p>
            <div className="flex items-center gap-2 mb-4">
              <PipelineStep label="Draft Receiving" count={d.inbound.draftReceivings} color="#3b82f6" alert />
              <PipelineArrow />
              <PipelineStep label="Pending Putaway" count={d.inbound.pendingPutaway} color="#f59e0b" alert />
              <PipelineArrow />
              <PipelineStep label="Active Stock" count={d.inventory.activePallets} color="#10b981" />
            </div>

            <div className="border-t border-border my-3" />

            {/* Outbound pipeline */}
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Outbound</p>
            <div className="flex items-center gap-2">
              <PipelineStep label="Pending Pick" count={d.outbound.pendingPicks} color="#f97316" alert />
              <PipelineArrow />
              <PipelineStep label="Staging" count={d.inventory.stagingPallets} color="#8b5cf6" />
              <PipelineArrow />
              <PipelineStep label="Dispatched Today" count={d.outbound.dispatchedToday} color="#6366f1" />
            </div>
          </div>
        </div>

        {/* ── Recent Activity Feed ── */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-foreground">Aktivitas Stok Terbaru</h3>
              <p className="text-xs text-muted-foreground mt-0.5">15 pergerakan stok terakhir</p>
            </div>
            <Activity size={15} className="text-muted-foreground" />
          </div>

          {activity.length === 0 ? (
            <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
              Belum ada aktivitas stok
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left pb-2 font-semibold pr-3">Tipe</th>
                    <th className="text-left pb-2 font-semibold pr-3">SKU</th>
                    <th className="text-left pb-2 font-semibold pr-3">Referensi</th>
                    <th className="text-right pb-2 font-semibold pr-3">Qty</th>
                    <th className="text-left pb-2 font-semibold pr-3">Dari → Ke</th>
                    <th className="text-right pb-2 font-semibold">Waktu</th>
                  </tr>
                </thead>
                <tbody>
                  {activity.map((item) => {
                    const meta = movementMeta(item.movementType);
                    return (
                      <tr key={item.id} className="border-b border-border/50 hover:bg-muted/40 transition-colors">
                        <td className="py-2 pr-3">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${meta.iconBg} ${meta.iconColor}`}
                            >
                              {movementIcon(item.movementType)}
                            </span>
                            <span className={`font-semibold ${meta.iconColor}`}>{meta.label}</span>
                          </div>
                        </td>
                        <td className="py-2 pr-3">
                          <p className="font-semibold text-foreground font-tabular">{item.skuCode}</p>
                          <p className="text-muted-foreground truncate max-w-[140px]">{item.skuName}</p>
                        </td>
                        <td className="py-2 pr-3 text-muted-foreground font-tabular">
                          {item.referenceNo || '—'}
                        </td>
                        <td className="py-2 pr-3 text-right font-bold font-tabular text-foreground">
                          {item.qty.toLocaleString('id-ID')}
                        </td>
                        <td className="py-2 pr-3 text-muted-foreground">
                          {item.fromBin || item.toBin ? (
                            <span>
                              <span className="font-tabular">{item.fromBin || '—'}</span>
                              {' → '}
                              <span className="font-tabular">{item.toBin || '—'}</span>
                            </span>
                          ) : (
                            <span className="text-muted-foreground/50">—</span>
                          )}
                        </td>
                        <td className="py-2 text-right text-muted-foreground font-tabular whitespace-nowrap">
                          {item.createdAt}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Quick Action Links ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: '/',                         label: 'Receiving Baru',     icon: <Inbox size={16} />,        color: 'text-blue-600 bg-blue-50 border-blue-200' },
            { href: '/putaway',                  label: 'Proses Putaway',     icon: <Package size={16} />,      color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
            { href: '/outbound/picking',         label: 'Buat Picking',       icon: <ClipboardList size={16} />, color: 'text-orange-600 bg-orange-50 border-orange-200' },
            { href: '/outbound/dispatch',        label: 'Proses Dispatch',    icon: <Truck size={16} />,        color: 'text-purple-600 bg-purple-50 border-purple-200' },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-sm font-semibold hover:opacity-80 transition-opacity ${action.color}`}
            >
              {action.icon}
              {action.label}
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}
