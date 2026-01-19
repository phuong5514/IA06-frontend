import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import StarRating from './StarRating';
import ReviewList from './ReviewList';
import { apiClient } from '../config/api';

interface ReviewManagementModalProps {
  menuItemId: number;
  menuItemName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ReviewManagementModal({
  menuItemId,
  menuItemName,
  isOpen,
  onClose,
}: ReviewManagementModalProps) {
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (isOpen) {
      fetchAverageRating();
    }
  }, [isOpen, menuItemId, refreshTrigger]);

  const fetchAverageRating = async () => {
    try {
      const response = await apiClient.get(`/reviews/average/${menuItemId}`);
      setAverageRating(response.data.average_rating || 0);
      setReviewCount(response.data.review_count || 0);
    } catch (error) {
      console.error('Failed to fetch average rating:', error);
    }
  };

  const handleAdminRespond = async (reviewId: number, response: string) => {
    try {
      await apiClient.put(`/reviews/${reviewId}/respond`, {
        admin_response: response,
      });

      // Refresh the reviews list
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error responding to review:', error);
      throw error;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Reviews for {menuItemName}</h2>
            <div className="flex items-center mt-2 space-x-4">
              <StarRating rating={averageRating} size="md" />
              <span className="text-gray-600">
                {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <ReviewList
            menuItemId={menuItemId}
            isAdmin={true}
            onAdminRespond={handleAdminRespond}
            refreshTrigger={refreshTrigger}
          />
        </div>
      </div>
    </div>
  );
}
