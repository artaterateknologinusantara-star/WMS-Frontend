'use client';

import React from 'react';
import { Search, CalendarDays } from 'lucide-react';

interface AdjustmentFiltersProps {
  filters: {
    skuCode: string;
    palletId: string;
    dateFrom: string;
    dateTo: string;
  };
  onFiltersChange: (filters: AdjustmentFiltersProps['filters']) => void;
}

export default function AdjustmentFilters({ filters, onFiltersChange }: AdjustmentFiltersProps) {
  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 grid gap-4 md:grid-cols-4">
      <div className="space-y-2">
        <label className="text-xs uppercase tracking-wide text-gray-400">SKU Code</label>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={filters.skuCode}
            onChange={e => onFiltersChange({ ...filters, skuCode: e.target.value })}
            placeholder="Search SKU code"
            className="w-full pl-9 pr-3 py-2 rounded border border-gray-700 bg-gray-900 text-sm text-white outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs uppercase tracking-wide text-gray-400">Pallet ID</label>
        <input
          type="text"
          value={filters.palletId}
          onChange={e => onFiltersChange({ ...filters, palletId: e.target.value })}
          placeholder="Search pallet"
          className="w-full px-3 py-2 rounded border border-gray-700 bg-gray-900 text-sm text-white outline-none focus:border-blue-500"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs uppercase tracking-wide text-gray-400">Date from</label>
        <div className="relative">
          <CalendarDays size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="date"
            value={filters.dateFrom}
            onChange={e => onFiltersChange({ ...filters, dateFrom: e.target.value })}
            className="w-full pl-9 pr-3 py-2 rounded border border-gray-700 bg-gray-900 text-sm text-white outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs uppercase tracking-wide text-gray-400">Date to</label>
        <div className="relative">
          <CalendarDays size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="date"
            value={filters.dateTo}
            onChange={e => onFiltersChange({ ...filters, dateTo: e.target.value })}
            className="w-full pl-9 pr-3 py-2 rounded border border-gray-700 bg-gray-900 text-sm text-white outline-none focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );
}
