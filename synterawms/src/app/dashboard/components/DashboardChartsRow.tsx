'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const ReceivingVolumeChart = dynamic(() => import('./ReceivingVolumeChart'), { ssr: false });
const SupplierSkuBarChart = dynamic(() => import('./SupplierSkuBarChart'), { ssr: false });

export default function DashboardChartsRow() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-5 gap-4">
      <div className="col-span-1 lg:col-span-3 xl:col-span-3 2xl:col-span-3 card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-foreground">Receiving Volume — Last 14 Days</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Orders processed per day</p>
          </div>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">Apr 27 – May 10</span>
        </div>
        <ReceivingVolumeChart />
      </div>

      <div className="col-span-1 lg:col-span-2 xl:col-span-2 2xl:col-span-2 card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-foreground">SKUs by Supplier</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Top 6 suppliers this week</p>
          </div>
        </div>
        <SupplierSkuBarChart />
      </div>
    </div>
  );
}