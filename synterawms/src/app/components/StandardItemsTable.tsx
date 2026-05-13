'use client';

import React from 'react';
import { Trash2 } from 'lucide-react';

export interface StandardItem {
  id: string;
  skuNumber: string;
  quantity: number;
  uom: string;
}

interface StandardItemsTableProps {
  items: StandardItem[];
  onChange: (items: StandardItem[]) => void;
}

const uomOptions = ['PCS', 'KG', 'BOX', 'PALLET', 'CARTON', 'ROLL', 'PACK', 'UNIT'];

export default function StandardItemsTable({ items, onChange }: StandardItemsTableProps) {
  const updateItem = (id: string, field: keyof StandardItem, value: string | number) => {
    onChange(items.map(item => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const removeItem = (id: string) => {
    onChange(items.filter(item => item.id !== id));
  };

  return (
    <div className="mb-8">
      <h3 className="text-base font-bold text-foreground mb-3">Standard Items - SKU Number</h3>
      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-muted border-b border-border">
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[45%]">
                SKU Number
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[25%]">
                Quantity
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[20%]">
                UOM
              </th>
              <th className="text-center px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[10%]">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} className="border-b border-border last:border-0 row-hover">
                <td className="px-4 py-2">
                  <input
                    type="text"
                    placeholder="Enter SKU number"
                    value={item.skuNumber}
                    onChange={e => updateItem(item.id, 'skuNumber', e.target.value)}
                    className="form-input text-sm"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    min={0}
                    value={item.quantity}
                    onChange={e => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                    className="form-input text-sm font-tabular"
                  />
                </td>
                <td className="px-4 py-2">
                  <select
                    value={item.uom}
                    onChange={e => updateItem(item.id, 'uom', e.target.value)}
                    className="form-input text-sm"
                  >
                    <option value="">Select UOM</option>
                    {uomOptions.map(u => (
                      <option key={`uom-std-${u}`} value={u}>{u}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-2 text-center">
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="p-1.5 rounded hover:bg-danger-soft text-danger transition-colors"
                    title="Remove this SKU line"
                  >
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-sm text-muted-foreground">
                  No SKU items added. Click below to add a standard SKU.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        onClick={() =>
          onChange([...items, { id: `sku-${Date.now()}`, skuNumber: '', quantity: 0, uom: '' }])
        }
        className="mt-2 text-xs font-semibold text-primary hover:text-secondary transition-colors flex items-center gap-1"
      >
        + Add SKU Row
      </button>
    </div>
  );
}