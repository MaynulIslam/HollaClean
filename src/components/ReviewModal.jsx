import React, { useState } from 'react';
import {
  X,
  Star,
  Send,
  CheckCircle
} from 'lucide-react';
import { reviewStorage, userStorage } from '../utils/storage';

const ReviewModal = ({ request, currentUser, onClose, onSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    setSubmitting(true);
    try {
      // Create review
      const review = {
        id: `review_${Date.now()}`,
        requestId: request.id,
        cleanerId: request.acceptedBy,
        homeownerId: currentUser.id,
        rating,
        comment: comment.trim(),
        createdAt: new Date().toISOString()
      };

      await reviewStorage.saveReview(review);

      // Update cleaner's rating
      const cleaner = await userStorage.getUser(request.acceptedBy);
      if (cleaner) {
        const totalRating = (cleaner.rating || 0) * (cleaner.reviewCount || 0) + rating;
        const newReviewCount = (cleaner.reviewCount || 0) + 1;
        cleaner.rating = totalRating / newReviewCount;
        cleaner.reviewCount = newReviewCount;
        await userStorage.saveUser(cleaner);
      }

      setSubmitted(true);
      setTimeout(() => {
        onSubmitted();
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error submitting review:', err);
      alert('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center animate-scale-in">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Thank You!</h3>
          <p className="text-gray-600">Your review has been submitted.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 animate-fade-in">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex items-center justify-between">
          <h2 className="text-xl font-display font-bold text-gray-800">Leave a Review</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {/* Cleaner Info */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-primary-400 to-secondary-400 rounded-xl flex items-center justify-center text-white font-bold text-xl">
              {request.cleanerName?.charAt(0)}
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">{request.cleanerName}</h3>
              <p className="text-sm text-gray-500">{request.serviceType}</p>
              <p className="text-xs text-gray-400">
                {new Date(request.date).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Star Rating */}
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-3">How would you rate your experience?</p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="p-1 transition-transform hover:scale-110 active:scale-95"
                >
                  <Star
                    className={`w-10 h-10 transition-colors ${
                      star <= (hoverRating || rating)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-200'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-center text-sm text-gray-500 mt-2">
              {rating === 0 && 'Tap to rate'}
              {rating === 1 && 'Poor'}
              {rating === 2 && 'Fair'}
              {rating === 3 && 'Good'}
              {rating === 4 && 'Very Good'}
              {rating === 5 && 'Excellent!'}
            </p>
          </div>

          {/* Comment */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Share your experience (optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell others about your experience..."
              rows={4}
              className="w-full p-4 rounded-xl border-2 border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none resize-none"
            />
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={submitting || rating === 0}
            className="w-full py-4 bg-gradient-to-r from-primary-600 to-secondary-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
          >
            {submitting ? (
              <>
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Submit Review
              </>
            )}
          </button>

          <p className="text-center text-xs text-gray-400 mt-4">
            Your review helps others find great cleaners
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;
