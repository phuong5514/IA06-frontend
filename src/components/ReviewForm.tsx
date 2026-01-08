import React, { useState } from 'react';
import StarRating from './StarRating';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../config/api';

interface ReviewFormProps {
  menuItemId: number;
  onSubmitSuccess: () => void;
}

export default function ReviewForm({ menuItemId, onSubmitSuccess }: ReviewFormProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to leave a review');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await apiClient.post('/reviews', {
        menu_item_id: menuItemId,
        rating,
        comment: comment.trim() || undefined,
      });

      // Reset form
      setRating(5);
      setComment('');
      onSubmitSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <p className="text-gray-600">Please log in to leave a review</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold mb-4">Write a Review</h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your Rating
        </label>
        <StarRating 
          rating={rating} 
          size="lg"
          interactive={true}
          onRatingChange={setRating}
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your Review (Optional)
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Share your experience with this dish..."
          rows={4}
          maxLength={1000}
        />
        <div className="text-xs text-gray-500 mt-1 text-right">
          {comment.length}/1000 characters
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Review'}
      </button>
    </form>
  );
}
