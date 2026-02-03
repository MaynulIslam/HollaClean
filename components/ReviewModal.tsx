
import React, { useState } from 'react';
import { CleaningRequest, Review } from '../types';
import { storage } from '../utils/storage';
import { Button, Card } from './UI';
<<<<<<< HEAD
import {
  Star, X, CheckCircle, Sparkles, ThumbsUp, Heart,
  Clock, DollarSign, MapPin
} from 'lucide-react';
=======
import { Star, X } from 'lucide-react';
>>>>>>> d06443da4cbdb3f847eedb509039380cf77654ed

interface Props {
  request: CleaningRequest;
  onClose: () => void;
}

const ReviewModal: React.FC<Props> = ({ request, onClose }) => {
  const [rating, setRating] = useState(5);
<<<<<<< HEAD
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  const quickTags = [
    'Professional', 'On time', 'Thorough', 'Friendly', 'Great communication', 'Would recommend'
  ];
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    setSubmitting(true);

    // Build comment with tags
    let finalComment = comment;
    if (selectedTags.length > 0) {
      const tagsText = selectedTags.join(', ');
      finalComment = finalComment ? `${finalComment} (${tagsText})` : tagsText;
    }

=======
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
>>>>>>> d06443da4cbdb3f847eedb509039380cf77654ed
    const review: Review = {
      id: `review_${Date.now()}`,
      requestId: request.id,
      cleanerId: request.acceptedBy!,
      homeownerId: request.homeownerId,
      rating,
<<<<<<< HEAD
      comment: finalComment,
=======
      comment,
>>>>>>> d06443da4cbdb3f847eedb509039380cf77654ed
      createdAt: new Date().toISOString()
    };

    await storage.set(`review:${review.id}`, review);

<<<<<<< HEAD
    // Update cleaner average rating
=======
    // Update cleaner average
>>>>>>> d06443da4cbdb3f847eedb509039380cf77654ed
    const cleaner = await storage.get(`user:${request.acceptedBy}`);
    if (cleaner) {
      const currentRating = cleaner.rating || 5;
      const count = cleaner.reviewCount || 0;
      const newRating = ((currentRating * count) + rating) / (count + 1);
      cleaner.rating = Number(newRating.toFixed(1));
      cleaner.reviewCount = count + 1;
      await storage.set(`user:${request.acceptedBy}`, cleaner);
    }

<<<<<<< HEAD
    setSubmitting(false);
    setSubmitted(true);

    // Auto close after showing success
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
      <Card className="w-full max-w-lg animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 max-h-[90vh] overflow-y-auto">
        {!submitted ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold font-outfit text-gray-900">Rate Your Experience</h2>
                <p className="text-sm text-gray-500">Help others by sharing your feedback</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Service Summary */}
            <div className="bg-purple-50 rounded-xl p-4 mb-6 border border-purple-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900">{request.serviceType}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {request.hours}h
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      ${request.totalAmount}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cleaner Info */}
            <div className="text-center mb-6">
              <p className="text-gray-500 mb-1">How was your cleaning with</p>
              <p className="text-xl font-bold text-purple-600">{request.cleanerName}?</p>
            </div>

            {/* Star Rating */}
            <div className="text-center mb-6">
              <div className="flex justify-center gap-2 mb-2">
                {[1, 2, 3, 4, 5].map(s => (
                  <button
                    key={s}
                    onClick={() => setRating(s)}
                    onMouseEnter={() => setHoveredRating(s)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="transition-transform hover:scale-110 active:scale-95"
                  >
                    <Star
                      className={`w-12 h-12 transition-colors ${
                        s <= (hoveredRating || rating)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-200'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className={`text-lg font-semibold ${
                rating >= 4 ? 'text-green-600' : rating >= 3 ? 'text-amber-600' : 'text-red-600'
              }`}>
                {ratingLabels[hoveredRating || rating]}
              </p>
            </div>

            {/* Quick Tags */}
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 mb-3">What stood out? (Optional)</p>
              <div className="flex flex-wrap gap-2">
                {quickTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      selectedTags.includes(tag)
                        ? 'bg-purple-100 text-purple-700 border-2 border-purple-500'
                        : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                    }`}
                  >
                    {selectedTags.includes(tag) && <CheckCircle className="w-3 h-3 inline mr-1" />}
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div className="mb-6">
              <label className="text-sm font-medium text-gray-700 ml-1 block mb-2">
                Additional Comments (Optional)
              </label>
              <textarea
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none h-28 transition-all resize-none"
                placeholder="Share more details about your experience..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-4"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Submitting...
                </span>
              ) : (
                <>
                  <ThumbsUp className="w-5 h-5" />
                  Submit Review
                </>
              )}
            </Button>

            {/* Privacy Note */}
            <p className="text-xs text-center text-gray-400 mt-4">
              Your review will be visible to other homeowners and helps build trust in our community.
            </p>
          </>
        ) : (
          /* Success State */
          <div className="text-center py-8 animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold font-outfit text-gray-900 mb-2">Thank You!</h3>
            <p className="text-gray-500 mb-4">Your review has been submitted successfully.</p>
            <div className="flex justify-center gap-1 mb-4">
              {[1, 2, 3, 4, 5].map(s => (
                <Star
                  key={s}
                  className={`w-6 h-6 ${s <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`}
                />
              ))}
            </div>
            <p className="text-sm text-gray-500">
              You rated {request.cleanerName} {rating} out of 5 stars
            </p>
          </div>
        )}
=======
    alert("Thanks for your review!");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-purple-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <Card className="w-full max-w-md animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Review Your Cleaner</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="text-center mb-8">
          <p className="text-gray-500 mb-2">How was your cleaning with</p>
          <p className="text-xl font-bold text-purple-600 mb-6">{request.cleanerName}?</p>
          
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map(s => (
              <button 
                key={s} 
                onClick={() => setRating(s)}
                className="transition-transform active:scale-90"
              >
                <Star className={`w-10 h-10 ${s <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1 mb-6">
          <label className="text-sm font-medium text-gray-700 ml-1">Comments (Optional)</label>
          <textarea 
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-purple-500 outline-none h-32"
            placeholder="Share your experience with others..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>

        <Button onClick={handleSubmit} disabled={submitting} className="w-full">
          {submitting ? 'Submitting...' : 'Submit Review'}
        </Button>
>>>>>>> d06443da4cbdb3f847eedb509039380cf77654ed
      </Card>
    </div>
  );
};

export default ReviewModal;
