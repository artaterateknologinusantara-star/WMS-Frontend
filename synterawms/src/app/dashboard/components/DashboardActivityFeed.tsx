import React from 'react';
import { ArrowRight, PackageCheck, AlertTriangle, Layers, MoveRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import StatusBadge from '@/components/ui/StatusBadge';

const activities = [
  {
    id: 'act-001',
    type: 'pallet-generated',
    icon: <Layers size={14} />,
    iconBg: 'bg-purple-100 text-purple-600',
    title: 'Pallet ID Generated',
    detail: 'PLT-20260510-008 — PT. Global Distribusi — PO-2026-152',
    time: '14:47',
    user: 'Indah Permata',
  },
  {
    id: 'act-002',
    type: 'unmatched',
    icon: <AlertTriangle size={14} />,
    iconBg: 'bg-warning-soft text-warning',
    title: 'Unmatched SKU Flagged',
    detail: 'SKU-TKN-044 not found in master data — CV. Teknologi Nusantara',
    time: '13:22',
    user: 'Gunawan Hadi',
  },
  {
    id: 'act-003',
    type: 'putaway-complete',
    icon: <CheckCircle2 size={14} />,
    iconBg: 'bg-success-soft text-success',
    title: 'Putaway Completed',
    detail: 'PLT-20260510-001 → Bin A-03-012 — Zone A Cold Storage',
    time: '12:55',
    user: 'Ahmad Fauzi',
  },
  {
    id: 'act-004',
    type: 'receiving',
    icon: <PackageCheck size={14} />,
    iconBg: 'bg-info-soft text-info',
    title: 'Receiving Started',
    detail: 'RCV-2026-003 — PT. Sumber Makmur — 3 SKU lines',
    time: '11:02',
    user: 'Dewi Rahayu',
  },
  {
    id: 'act-005',
    type: 'putaway-assigned',
    icon: <MoveRight size={14} />,
    iconBg: 'bg-blue-50 text-blue-600',
    title: 'Putaway Task Assigned',
    detail: 'PLT-20260510-005 assigned to Fitri Handayani — Zone B Rack',
    time: '10:33',
    user: 'System',
  },
  {
    id: 'act-006',
    type: 'pallet-generated',
    icon: <Layers size={14} />,
    iconBg: 'bg-purple-100 text-purple-600',
    title: 'Pallet ID Generated',
    detail: 'PLT-20260510-002 — CV. Maju Bersama — PO-2026-146',
    time: '10:17',
    user: 'Budi Santoso',
  },
];

const pendingOrders = [
  { id: 'po-001', orderId: 'RCV-2026-004', supplier: 'UD. Karya Agung', age: '2h 47m', status: 'pending' as const },
  { id: 'po-002', orderId: 'RCV-2026-007', supplier: 'PT. Abadi Jaya', age: '4h 32m', status: 'pending' as const },
  { id: 'po-003', orderId: 'RCV-2026-010', supplier: 'PT. Mandiri Logistik', age: '2h 32m', status: 'pending' as const },
];

export default function DashboardActivityFeed() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3 gap-4">
      {/* Activity Feed */}
      <div className="col-span-1 lg:col-span-2 xl:col-span-2 2xl:col-span-2 card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-foreground">Recent Activity</h3>
          <span className="text-xs text-muted-foreground">Today&apos;s events</span>
        </div>
        <div className="space-y-3">
          {activities.map(act => (
            <div key={act.id} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${act.iconBg}`}>
                {act.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">{act.title}</p>
                  <span className="text-xs text-muted-foreground font-tabular flex-shrink-0">{act.time}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{act.detail}</p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">by {act.user}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending Orders Panel */}
      <div className="col-span-1 card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-foreground">Pending Orders</h3>
          <span className="text-xs font-bold text-danger bg-danger-soft px-2 py-0.5 rounded-full">3 urgent</span>
        </div>
        <div className="space-y-3 mb-4">
          {pendingOrders.map(order => (
            <div key={order.id} className="border border-border rounded-lg p-3 bg-warning-soft/40">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-semibold text-foreground font-tabular">{order.orderId}</p>
                <StatusBadge status={order.status} />
              </div>
              <p className="text-xs text-muted-foreground">{order.supplier}</p>
              <p className="text-xs text-warning font-semibold mt-1">⏱ Waiting {order.age}</p>
            </div>
          ))}
        </div>
        <Link
          href="/"
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-primary text-primary text-sm font-semibold hover:bg-primary hover:text-white transition-all duration-150"
        >
          Process Now
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}