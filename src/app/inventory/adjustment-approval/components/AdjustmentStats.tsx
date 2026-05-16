'use client';

import React from 'react';
import { Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface AdjustmentStatsProps {
  total: number;
}

export default function AdjustmentStats({ total }: AdjustmentStatsProps) {
  const stats = [
    {
      label: 'Pending',
      value: total,
      icon: <Clock size={20} className="text-yellow-400" />,
      bgColor: 'bg-yellow-500/20',
      borderColor: 'border-yellow-500/50',
    },
    {
      label: 'Approved Today',
      value: 0, // TODO: Fetch from API
      icon: <CheckCircle size={20} className="text-green-400" />,
      bgColor: 'bg-green-500/20',
      borderColor: 'border-green-500/50',
    },
    {
      label: 'Rejected Today',
      value: 0, // TODO: Fetch from API
      icon: <XCircle size={20} className="text-red-400" />,
      bgColor: 'bg-red-500/20',
      borderColor: 'border-red-500/50',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {stats.map((stat, index) => (
        <div
          key={index}
          className={`bg-gray-800/50 border ${stat.borderColor} rounded-lg p-4 flex items-center gap-4`}
        >
          <div className={`p-3 rounded-lg ${stat.bgColor}`}>
            {stat.icon}
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-sm text-gray-400">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
