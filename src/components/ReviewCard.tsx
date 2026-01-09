import React from 'react';
import { MessageCircle } from 'lucide-react';
import StarRating from './StarRating';

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

interface ReviewCardProps {
  review: Review;
  onAdminRespond?: (reviewId: number, response: string) => void;
  isAdmin?: boolean;
}

export default function ReviewCard({ review, onAdminRespond, isAdmin = false }: ReviewCardProps) {
  const [showResponseForm, setShowResponseForm] = React.useState(false);
  const [adminResponse, setAdminResponse] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmitResponse = async () => {
    if (!adminResponse.trim() || !onAdminRespond) return;
    
    setIsSubmitting(true);
    try {
      await onAdminRespond(review.id, adminResponse.trim());
      setShowResponseForm(false);
      setAdminResponse('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* User Info */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          {review.user_profile_image ? (
            <img
              src={review.user_profile_image}
              alt={review.user_name || 'User'}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
              <span className="text-indigo-600 font-semibold text-lg">
                {(review.user_name || review.user_email || 'U')[0].toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <p className="font-medium text-gray-900">
              {review.user_name || review.user_email?.split('@')[0] || 'Anonymous'}
            </p>
            <p className="text-sm text-gray-500">{formatDate(review.created_at)}</p>
          </div>
        </div>
        <StarRating rating={review.rating} size="sm" />
      </div>

      {/* Review Comment */}
      {review.comment && (
        <p className="text-gray-700 mb-4 whitespace-pre-wrap">{review.comment}</p>
      )}

      {/* Admin Response */}
      {review.admin_response && (
        <div className="mt-4 pl-4 border-l-4 border-indigo-500 bg-indigo-50 rounded-r-lg p-4">
          <div className="flex items-center mb-2">
            <MessageCircle className="w-5 h-5 text-indigo-600 mr-2" />
            <span className="font-semibold text-indigo-900">Restaurant Response</span>
          </div>
          <p className="text-gray-700 whitespace-pre-wrap">{review.admin_response}</p>
          {review.admin_responded_at && (
            <p className="text-xs text-gray-500 mt-2">
              Responded on {formatDate(review.admin_responded_at)}
            </p>
          )}
        </div>
      )}

      {/* Admin Response Form */}
      {isAdmin && !review.admin_response && (
        <div className="mt-4">
          {!showResponseForm ? (
            <button
              onClick={() => setShowResponseForm(true)}
              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
            >
              Respond to this review
            </button>
          ) : (
            <div className="space-y-3">
              <textarea
                value={adminResponse}
                onChange={(e) => setAdminResponse(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Write your response..."
                rows={3}
              />
              <div className="flex space-x-2">
                <button
                  onClick={handleSubmitResponse}
                  disabled={isSubmitting || !adminResponse.trim()}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Response'}
                </button>
                <button
                  onClick={() => {
                    setShowResponseForm(false);
                    setAdminResponse('');
                  }}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
