'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export default function Modal({ open, onClose, title, children, footer, size = 'md' }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const sizeClass = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl' }[size];

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-200 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      aria-modal="true"
      role="dialog"
      aria-label={title}
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className={`relative bg-white rounded-xl shadow-xl w-full mx-4 ${sizeClass} transition-all duration-200 ${open ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted transition-colors">
            <X size={18} className="text-muted-foreground" />
          </button>
        </div>
        <div className="px-6 py-4">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-border flex justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
}