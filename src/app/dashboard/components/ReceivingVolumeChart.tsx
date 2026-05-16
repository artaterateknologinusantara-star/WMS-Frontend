'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const data = [
  { date: 'Apr 27', orders: 8, skus: 94 },
  { date: 'Apr 28', orders: 12, skus: 142 },
  { date: 'Apr 29', orders: 6, skus: 71 },
  { date: 'Apr 30', orders: 15, skus: 188 },
  { date: 'May 01', orders: 11, skus: 130 },
  { date: 'May 02', orders: 4, skus: 48 },
  { date: 'May 03', orders: 3, skus: 35 },
  { date: 'May 04', orders: 14, skus: 172 },
  { date: 'May 05', orders: 17, skus: 209 },
  { date: 'May 06', orders: 9, skus: 108 },
  { date: 'May 07', orders: 13, skus: 161 },
  { date: 'May 08', orders: 7, skus: 84 },
  { date: 'May 09', orders: 16, skus: 197 },
  { date: 'May 10', orders: 18, skus: 247 },
];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-border rounded-lg shadow-lg px-4 py-3 text-xs">
        <p className="font-semibold text-foreground mb-2">{label}</p>
        {payload.map((p, i) => (
          <div key={`tooltip-row-${i}`} className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full" style={{ background: p.name === 'orders' ? 'var(--primary)' : 'var(--accent)' }} />
            <span className="text-muted-foreground capitalize">{p.name}:</span>
            <span className="font-semibold text-foreground">{p.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function ReceivingVolumeChart() {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="gradOrders" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.25} />
            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradSkus" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.2} />
            <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="orders" name="orders" stroke="var(--primary)" strokeWidth={2} fill="url(#gradOrders)" dot={false} activeDot={{ r: 4, fill: 'var(--primary)' }} />
        <Area type="monotone" dataKey="skus" name="skus" stroke="var(--accent)" strokeWidth={2} fill="url(#gradSkus)" dot={false} activeDot={{ r: 4, fill: 'var(--accent)' }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}