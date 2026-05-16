import React from 'react';
import AppLayout from '@/components/AppLayout';
import DashboardMetricsBento from './components/DashboardMetricsBento';
import DashboardChartsRow from './components/DashboardChartsRow';
import DashboardActivityFeed from './components/DashboardActivityFeed';

export default function DashboardPage() {
  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-white border-b border-border px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-foreground">Operations Dashboard</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Real-time inbound operations overview — 2026-05-10</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs text-success bg-success-soft border border-green-200 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              Live
            </span>
            <span className="text-xs text-muted-foreground">Last updated: 18:32:42</span>
          </div>
        </div>

        <div className="px-8 py-6 max-w-screen-2xl space-y-6">
          <DashboardMetricsBento />
          <DashboardChartsRow />
          <DashboardActivityFeed />
        </div>
      </div>
    </AppLayout>
  );
}