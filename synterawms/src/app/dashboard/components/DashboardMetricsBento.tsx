import React from 'react';
import {
  PackageSearch,
  Layers,
  TrendingUp,
  AlertTriangle,
  Clock,
  BarChart2,
} from 'lucide-react';

const metrics = [
  {
    id: 'metric-pending',
    label: 'Pending Receipts',
    value: '3',
    sub: 'Awaiting processing',
    icon: <PackageSearch size={20} />,
    trend: '+2 since 08:00',
    trendUp: false,
    alert: true,
    span: 'col-span-1 md:col-span-2',
    size: 'hero',
  },
  {
    id: 'metric-pallets',
    label: 'Pallets Generated Today',
    value: '18',
    sub: 'vs 14 yesterday',
    icon: <Layers size={20} />,
    trend: '+28.6%',
    trendUp: true,
    alert: false,
    span: 'col-span-1',
    size: 'normal',
  },
  {
    id: 'metric-putaway',
    label: 'Putaway Completion',
    value: '72%',
    sub: '13 of 18 pallets',
    icon: <TrendingUp size={20} />,
    trend: '+8% vs yesterday',
    trendUp: true,
    alert: false,
    span: 'col-span-1',
    size: 'normal',
  },
  {
    id: 'metric-skus',
    label: 'SKUs Received Today',
    value: '247',
    sub: 'Across 18 orders',
    icon: <BarChart2 size={20} />,
    trend: '+31 vs yesterday',
    trendUp: true,
    alert: false,
    span: 'col-span-1',
    size: 'normal',
  },
  {
    id: 'metric-unmatched',
    label: 'Unmatched SKUs',
    value: '4',
    sub: 'Require verification',
    icon: <AlertTriangle size={20} />,
    trend: 'Action needed',
    trendUp: false,
    alert: true,
    span: 'col-span-1',
    size: 'normal',
  },
  {
    id: 'metric-avg-time',
    label: 'Avg Receiving Time',
    value: '14m',
    sub: 'Per order today',
    icon: <Clock size={20} />,
    trend: '-2m vs target',
    trendUp: true,
    alert: false,
    span: 'col-span-1',
    size: 'normal',
  },
];

export default function DashboardMetricsBento() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-foreground">Today&apos;s Metrics</h2>
        <span className="text-xs text-muted-foreground">Shift: 06:00 – 18:00</span>
      </div>

      {/* Grid: 4 cols. Row 1: hero spans 2 + 2 normal. Row 2: 4 normal */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-4">
        {/* Hero card — pending receipts */}
        <div className="col-span-1 sm:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2 card p-5 border-l-4 border-danger relative overflow-hidden bg-danger-soft">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-danger uppercase tracking-wide mb-1">Pending Receipts</p>
              <p className="text-4xl font-bold text-danger font-tabular leading-none mb-2">3</p>
              <p className="text-sm text-danger/80">Awaiting processing now</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-danger/10 flex items-center justify-center">
              <PackageSearch size={22} className="text-danger" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-xs font-semibold text-danger bg-danger/10 px-2 py-0.5 rounded-full">
              +2 since 08:00
            </span>
            <span className="text-xs text-danger/70">Oldest: RCV-2026-004 (2h 47m ago)</span>
          </div>
        </div>

        {/* Pallets Generated */}
        <div className="card p-5 border-l-4 border-success">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pallets Generated</p>
            <div className="w-8 h-8 rounded-lg bg-success-soft flex items-center justify-center">
              <Layers size={16} className="text-success" />
            </div>
          </div>
          <p className="text-3xl font-bold text-foreground font-tabular mb-1">18</p>
          <p className="text-xs text-muted-foreground">vs 14 yesterday</p>
          <span className="text-xs font-semibold text-success mt-2 inline-block">↑ +28.6%</span>
        </div>

        {/* Putaway Completion */}
        <div className="card p-5 border-l-4 border-info">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Putaway Rate</p>
            <div className="w-8 h-8 rounded-lg bg-info-soft flex items-center justify-center">
              <TrendingUp size={16} className="text-info" />
            </div>
          </div>
          <p className="text-3xl font-bold text-foreground font-tabular mb-1">72%</p>
          <p className="text-xs text-muted-foreground">13 of 18 pallets</p>
          <div className="mt-2 w-full bg-muted rounded-full h-1.5">
            <div className="bg-info h-1.5 rounded-full" style={{ width: '72%' }} />
          </div>
        </div>

        {/* SKUs Received */}
        <div className="card p-5">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">SKUs Received</p>
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
              <BarChart2 size={16} className="text-muted-foreground" />
            </div>
          </div>
          <p className="text-3xl font-bold text-foreground font-tabular mb-1">247</p>
          <p className="text-xs text-muted-foreground">Across 18 orders</p>
          <span className="text-xs font-semibold text-success mt-2 inline-block">↑ +31 vs yesterday</span>
        </div>

        {/* Unmatched SKUs — Warning */}
        <div className="card p-5 border-l-4 border-warning bg-warning-soft">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-semibold text-warning uppercase tracking-wide">Unmatched SKUs</p>
            <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
              <AlertTriangle size={16} className="text-warning" />
            </div>
          </div>
          <p className="text-3xl font-bold text-warning font-tabular mb-1">4</p>
          <p className="text-xs text-warning/80">Require verification</p>
          <span className="text-xs font-semibold text-warning mt-2 inline-block">⚠ Action needed</span>
        </div>

        {/* Avg Receiving Time */}
        <div className="card p-5">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Avg Receiving Time</p>
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
              <Clock size={16} className="text-muted-foreground" />
            </div>
          </div>
          <p className="text-3xl font-bold text-foreground font-tabular mb-1">14m</p>
          <p className="text-xs text-muted-foreground">Per order today</p>
          <span className="text-xs font-semibold text-success mt-2 inline-block">↓ -2m vs 16m target</span>
        </div>
      </div>
    </div>
  );
}