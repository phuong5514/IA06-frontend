import { useState, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import ReviewCard from './ReviewCard';
import { apiClient } from '../config/api';

interface Review {
  id: number;
  menu_item_id: number;
  user_id: string;
  rating: number;
  comment?: string;
  admin_response?: string;
  admin_responded_at?: string;
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_email?: string;
  user_profile_image?: string;
}

interface ReviewListProps {
  menuItemId: number;
  onAdminRespond?: (reviewId: number, response: string) => Promise<void>;
  isAdmin?: boolean;
  refreshTrigger?: number;
}

export default function ReviewList({ 
  menuItemId, 
  onAdminRespond, 
  isAdmin = false,
  refreshTrigger = 0 
}: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 5;

  useEffect(() => {
    fetchReviews();
  }, [menuItemId, currentPage, refreshTrigger]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        menu_item_id: menuItemId.toString(),
        page: currentPage.toString(),
        limit: pageSize.toString(),
        sort_by: 'created_at',
        sort_order: 'desc',
      });

      const response = await apiClient.get(`/reviews?${params.toString()}`);
      
      setReviews(response.data.reviews || []);
      setTotal(response.data.total || 0);
      setTotalPages(response.data.total_pages || 1);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminRespond = async (reviewId: number, response: string) => {
    if (onAdminRespond) {
      await onAdminRespond(reviewId, response);
      fetchReviews(); // Refresh the list
    }
  };

  if (loading && reviews.length === 0) {
    return (
      <div className="flex justify-center py-8">
        <div className="text-gray-500">Loading reviews...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 font-medium">No reviews yet</p>
        <p className="text-gray-500 text-sm mt-1">Be the first to review this item!</p>
      </div>
    );
  }

  return (
    <div>
      {/* Reviews List */}
      <div className="space-y-4 mb-6">
        {reviews.map((review) => (
          <ReviewCard
            key={review.id}
            review={review}
            onAdminRespond={handleAdminRespond}
            isAdmin={isAdmin}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 px-4 py-3">
          <div className="text-sm text-gray-600">
            Showing {Math.min((currentPage - 1) * pageSize + 1, total)} to{' '}
            {Math.min(currentPage * pageSize, total)} of {total} reviews
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <div className="flex items-center space-x-1">
              {[...Array(totalPages)].map((_, idx) => {
                const page = idx + 1;
                // Show first page, last page, current page, and pages around current
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        currentPage === page
                          ? 'bg-indigo-600 text-white'
                          : 'text-gray-700 hover:bg-gray-50 border border-gray-300'
                      }`}
                    >
                      {page}
                    </button>
                  );
                } else if (
                  page === currentPage - 2 ||
                  page === currentPage + 2
                ) {
                  return <span key={page} className="px-2">...</span>;
                }
                return null;
              })}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
