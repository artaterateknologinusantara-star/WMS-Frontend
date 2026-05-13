'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const data = [
  { supplier: 'PT. Electronic', skus: 58 },
  { supplier: 'CV. Maju Bersama', skus: 44 },
  { supplier: 'PT. Sumber', skus: 37 },
  { supplier: 'UD. Karya Agung', skus: 29 },
  { supplier: 'PT. Logistik', skus: 52 },
  { supplier: 'CV. Teknologi', skus: 27 },
];

const colors = [
  'var(--primary)',
  'var(--secondary)',
  'var(--accent)',
  'var(--info)',
  'var(--success)',
  'var(--warning)',
];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-border rounded-lg shadow-lg px-3 py-2 text-xs">
        <p className="font-semibold text-foreground mb-1">{label}</p>
        <p className="text-muted-foreground">SKUs: <span className="font-semibold text-foreground">{payload[0].value}</span></p>
      </div>
    );
  }
  return null;
};

export default function SupplierSkuBarChart() {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="supplier" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="skus" radius={[4, 4, 0, 0]} maxBarSize={36}>
          {data.map((entry, index) => (
            <Cell key={`cell-supplier-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}