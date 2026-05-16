import React from 'react';

type StatusVariant =
  | 'pending' |'receiving' |'pallet-generated' |'putaway-assigned' |'putaway-complete' |'closed' |'unmatched' |'high' |'medium' |'low' |'online' |'offline';

interface StatusBadgeProps {
  status: StatusVariant | string;
  size?: 'sm' | 'md';
}

const variantMap: Record<string, { label: string; classes: string }> = {
  pending: { label: 'Pending', classes: 'bg-warning-soft text-warning border border-yellow-200' },
  receiving: { label: 'Receiving', classes: 'bg-info-soft text-info border border-blue-200' },
  'pallet-generated': { label: 'Pallet Generated', classes: 'bg-purple-50 text-purple-700 border border-purple-200' },
  'putaway-assigned': { label: 'Putaway Assigned', classes: 'bg-blue-50 text-blue-700 border border-blue-200' },
  'putaway-complete': { label: 'Putaway Complete', classes: 'bg-success-soft text-success border border-green-200' },
  closed: { label: 'Closed', classes: 'bg-muted text-muted-foreground border border-border' },
  unmatched: { label: 'Unmatched', classes: 'bg-danger-soft text-danger border border-red-200' },
  high: { label: 'High', classes: 'bg-danger-soft text-danger border border-red-200' },
  medium: { label: 'Medium', classes: 'bg-warning-soft text-warning border border-yellow-200' },
  low: { label: 'Low', classes: 'bg-success-soft text-success border border-green-200' },
  online: { label: 'Online', classes: 'bg-success-soft text-success border border-green-200' },
  offline: { label: 'Offline', classes: 'bg-muted text-muted-foreground border border-border' },
};

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const config = variantMap[status] || {
    label: status,
    classes: 'bg-muted text-muted-foreground border border-border',
  };

  return (
    <span
      className={`status-badge ${config.classes} ${size === 'md' ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs'}`}
    >
      {config.label}
    </span>
  );
}