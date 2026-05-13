'use client';

import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

export interface NonStandardItem {
  id: string;
  itemName: string;
  quantity: number;
  uom: string;
}

interface NonStandardItemsTableProps {
  items: NonStandardItem[];
  onChange: (items: NonStandardItem[]) => void;
}

const uomOptions = ['PCS', 'KG', 'BOX', 'PALLET', 'CARTON', 'ROLL', 'PACK', 'UNIT', 'LITER', 'METER'];

export default function NonStandardItemsTable({ items, onChange }: NonStandardItemsTableProps) {
  const updateItem = (id: string, field: keyof NonStandardItem, value: string | number) => {
    onChange(items.map(item => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const removeItem = (id: string) => {
    onChange(items.filter(item => item.id !== id));
  };

  const addItem = () => {
    onChange([...items, { id: `nonstd-${Date.now()}`, itemName: '', quantity: 0, uom: '' }]);
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-bold text-foreground">Non-Standard Items</h3>
        <button
          type="button"
          onClick={addItem}
          className="btn-accent flex items-center gap-1.5 px-4 py-2 text-sm"
        >
          <Plus size={15} />
          Add Item
        </button>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-muted border-b border-border">
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[45%]">
                Item Name
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
                    placeholder="Enter item name"
                    value={item.itemName}
                    onChange={e => updateItem(item.id, 'itemName', e.target.value)}
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
                  <input
                    type="text"
                    placeholder="UoM"
                    value={item.uom}
                    onChange={e => updateItem(item.id, 'uom', e.target.value)}
                    className="form-input text-sm"
                  />
                </td>
                <td className="px-4 py-2 text-center">
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="p-1.5 rounded hover:bg-danger-soft text-danger transition-colors"
                    title="Remove this non-standard item"
                  >
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-sm text-muted-foreground">
                  No non-standard items added. Click &quot;Add Item&quot; to add one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}