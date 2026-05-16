'use client';

import React from 'react';
import { X, CheckCircle, XCircle } from 'lucide-react';

interface ApprovalModalProps {
  isOpen: boolean;
  type: 'approve' | 'reject' | null;
  adjustment: number | null;
  rejectionReason: string;
  onReasonChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing: boolean;
}

export default function ApprovalModal({
  isOpen,
  type,
  adjustment,
  rejectionReason,
  onReasonChange,
  onConfirm,
  onCancel,
  isProcessing,
}: ApprovalModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-md w-full shadow-lg">
        {/* Close Button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-200"
        >
          <X size={20} />
        </button>

        {type === 'approve' ? (
          <>
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle size={28} className="text-green-400" />
              <h2 className="text-xl font-bold text-white">Approve Adjustment</h2>
            </div>
            <p className="text-gray-300 mb-6">
              Are you sure you want to approve this adjustment? The inventory stock will be updated immediately.
            </p>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4">
              <XCircle size={28} className="text-red-400" />
              <h2 className="text-xl font-bold text-white">Reject Adjustment</h2>
            </div>
            <p className="text-gray-300 mb-4">
              Please provide a reason for rejection:
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => onReasonChange(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 mb-4"
              rows={3}
              disabled={isProcessing}
            />
          </>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isProcessing}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isProcessing || (type === 'reject' && !rejectionReason.trim())}
            className={`flex-1 px-4 py-2 rounded transition text-white font-semibold disabled:opacity-50 ${
              type === 'approve'
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {isProcessing ? 'Processing...' : type === 'approve' ? 'Approve' : 'Reject'}
          </button>
        </div>
      </div>
    </div>
  );
}
