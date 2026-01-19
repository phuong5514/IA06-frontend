import { useState } from 'react';
import { X, Loader2, Package, ChefHat, Salad, Settings, Users, Edit3, AlertTriangle } from 'lucide-react';

interface RejectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  orderId: number;
  orderDetails?: {
    tableNumber?: string;
    itemsCount?: number;
  };
}

const REJECTION_REASONS = [
  { value: 'out_of_stock', label: 'Out of Stock', icon: <Package className="w-5 h-5" /> },
  { value: 'kitchen_capacity', label: 'Kitchen at Capacity', icon: <ChefHat className="w-5 h-5" /> },
  { value: 'ingredient_unavailable', label: 'Ingredient Unavailable', icon: <Salad className="w-5 h-5" /> },
  { value: 'equipment_issue', label: 'Equipment Issue', icon: <Settings className="w-5 h-5" /> },
  { value: 'staff_shortage', label: 'Staff Shortage', icon: <Users className="w-5 h-5" /> },
  { value: 'custom', label: 'Other (Custom Reason)', icon: <Edit3 className="w-5 h-5" /> },
];

export default function RejectionModal({
  isOpen,
  onClose,
  onConfirm,
  orderId,
  orderDetails,
}: RejectionModalProps) {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    const reason = selectedReason === 'custom' ? customReason : selectedReason;
    
    if (!reason.trim()) {
      alert('Please select or enter a rejection reason');
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(reason);
      handleClose();
    } catch (error) {
      console.error('Failed to reject order:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedReason('');
    setCustomReason('');
    setIsSubmitting(false);
    onClose();
  };

  const getReasonLabel = (value: string) => {
    const reason = REJECTION_REASONS.find(r => r.value === value);
    return reason ? reason.label : value.replace(/_/g, ' ');
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg transform transition-all animate-slideIn">
        {/* Header */}
        <div className="bg-red-600 text-white px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Reject Order</h2>
                <p className="text-red-100 text-sm">Order #{orderId}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-white/80 hover:text-white transition-colors disabled:opacity-50"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Order Details */}
        {orderDetails && (
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center gap-4 text-sm text-gray-600">
              {orderDetails.tableNumber && (
                <div className="flex items-center gap-1">
                  <span className="font-semibold">Table:</span>
                  <span>{orderDetails.tableNumber}</span>
                </div>
              )}
              {orderDetails.itemsCount && (
                <div className="flex items-center gap-1">
                  <span className="font-semibold">Items:</span>
                  <span>{orderDetails.itemsCount}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Select Rejection Reason <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {REJECTION_REASONS.map((reason) => (
                <button
                  key={reason.value}
                  onClick={() => setSelectedReason(reason.value)}
                  disabled={isSubmitting}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    selectedReason === reason.value
                      ? 'border-red-500 bg-red-50 shadow-md'
                      : 'border-gray-200 hover:border-red-300 hover:bg-gray-50'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{reason.icon}</span>
                    <span className="text-sm font-medium text-gray-800">{reason.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Reason Input */}
          {selectedReason === 'custom' && (
            <div className="animate-slideDown">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Custom Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                disabled={isSubmitting}
                placeholder="Please provide a detailed reason for rejection..."
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                maxLength={500}
              />
              <div className="text-right text-xs text-gray-500 mt-1">
                {customReason.length}/500 characters
              </div>
            </div>
          )}

          {/* Selected Reason Preview */}
          {selectedReason && selectedReason !== 'custom' && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Rejection Reason:</span> {getReasonLabel(selectedReason)}
              </p>
            </div>
          )}

          {/* Warning Message */}
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-800">
                This action will reject the order and notify the customer. This cannot be undone.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex gap-3">
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={
              isSubmitting ||
              !selectedReason ||
              (selectedReason === 'custom' && !customReason.trim())
            }
            className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin h-5 w-5" />
                <span>Rejecting...</span>
              </>
            ) : (
              <>
                <span>Confirm Rejection</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
