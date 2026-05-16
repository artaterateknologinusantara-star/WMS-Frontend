'use client';

import React, { useState } from 'react';
import { CheckCircle, XCircle, Loader, AlertCircle } from 'lucide-react';
import ApprovalModal from './ApprovalModal';

export interface Adjustment {
  adjustmentId: number;
  adjustmentNo: string;
  skuCode: string;
  palletId?: string;
  prevQty: number;
  newQty: number;
  reason?: string;
  requestedBy?: string;
  requestedAt: string;
}

interface AdjustmentApprovalTableProps {
  adjustments: Adjustment[];
  loading: boolean;
  onRefresh: () => void;
}

export default function AdjustmentApprovalTable({ adjustments, loading, onRefresh }: AdjustmentApprovalTableProps) {
  const [selectedAdjustment, setSelectedAdjustment] = useState<number | null>(null);
  const [modalType, setModalType] = useState<'approve' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApprove = async (adjustmentId: number) => {
    setSelectedAdjustment(adjustmentId);
    setModalType('approve');
  };

  const handleReject = async (adjustmentId: number) => {
    setSelectedAdjustment(adjustmentId);
    setModalType('reject');
  };

  const confirmApprove = async () => {
    if (!selectedAdjustment) return;

    setIsProcessing(true);
    try {
      const response = await fetch(
        `/api/adjustmentapproval/approve/${selectedAdjustment}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ approvedBy: 1 }), // Replace with actual user ID
        }
      );

      const data = await response.json();

      if (data.success) {
        alert('Adjustment approved successfully!');
        setModalType(null);
        onRefresh();
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      alert('Failed to approve adjustment');
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmReject = async () => {
    if (!selectedAdjustment || !rejectionReason.trim()) {
      alert('Please enter a rejection reason');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch(
        `/api/adjustmentapproval/reject/${selectedAdjustment}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rejectedBy: 1, // Replace with actual user ID
            rejectionReason: rejectionReason,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        alert('Adjustment rejected successfully!');
        setModalType(null);
        setRejectionReason('');
        onRefresh();
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      alert('Failed to reject adjustment');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="animate-spin text-blue-500" size={40} />
      </div>
    );
  }

  if (adjustments.length === 0) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-8 text-center">
        <AlertCircle size={40} className="mx-auto text-gray-500 mb-4" />
        <p className="text-gray-400">No pending adjustments to approve</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-900 border-b border-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-gray-300 font-semibold">Adjustment No</th>
              <th className="px-6 py-3 text-left text-gray-300 font-semibold">SKU Code</th>
              <th className="px-6 py-3 text-left text-gray-300 font-semibold">Pallet ID</th>
              <th className="px-6 py-3 text-center text-gray-300 font-semibold">Prev Qty</th>
              <th className="px-6 py-3 text-center text-gray-300 font-semibold">New Qty</th>
              <th className="px-6 py-3 text-left text-gray-300 font-semibold">Reason</th>
              <th className="px-6 py-3 text-left text-gray-300 font-semibold">Requested By</th>
              <th className="px-6 py-3 text-left text-gray-300 font-semibold">Date</th>
              <th className="px-6 py-3 text-center text-gray-300 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {adjustments.map((adj) => (
              <tr key={adj.adjustmentId} className="hover:bg-gray-700/50 transition">
                <td className="px-6 py-4 text-gray-300">{adj.adjustmentNo}</td>
                <td className="px-6 py-4 text-gray-300">
                  <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-xs">
                    {adj.skuCode}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-300">{adj.palletId || '-'}</td>
                <td className="px-6 py-4 text-center text-gray-300">{adj.prevQty}</td>
                <td className="px-6 py-4 text-center text-gray-300 font-semibold">{adj.newQty}</td>
                <td className="px-6 py-4 text-gray-400 text-xs">{adj.reason || '-'}</td>
                <td className="px-6 py-4 text-gray-400">{adj.requestedBy || 'System'}</td>
                <td className="px-6 py-4 text-gray-400">
                  {new Date(adj.requestedAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => handleApprove(adj.adjustmentId)}
                      disabled={isProcessing}
                      className="p-2 bg-green-500/20 hover:bg-green-500/40 text-green-400 rounded transition disabled:opacity-50"
                      title="Approve"
                    >
                      <CheckCircle size={18} />
                    </button>
                    <button
                      onClick={() => handleReject(adj.adjustmentId)}
                      disabled={isProcessing}
                      className="p-2 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded transition disabled:opacity-50"
                      title="Reject"
                    >
                      <XCircle size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Approval Modal */}
      <ApprovalModal
        isOpen={modalType !== null}
        type={modalType}
        adjustment={selectedAdjustment}
        rejectionReason={rejectionReason}
        onReasonChange={setRejectionReason}
        onConfirm={modalType === 'approve' ? confirmApprove : confirmReject}
        onCancel={() => {
          setModalType(null);
          setRejectionReason('');
        }}
        isProcessing={isProcessing}
      />
    </>
  );
}
