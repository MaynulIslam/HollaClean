
import React, { useState } from 'react';
import { CleaningRequest, Review } from '../types';
import { storage } from '../utils/storage';
import { Button, Card } from './UI';
import { Star, X } from 'lucide-react';

interface Props {
  request: CleaningRequest;
  onClose: () => void;
}

const ReviewModal: React.FC<Props> = ({ request, onClose }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    const review: Review = {
      id: `review_${Date.now()}`,
      requestId: request.id,
      cleanerId: request.acceptedBy!,
      homeownerId: request.homeownerId,
      rating,
      comment,
      createdAt: new Date().toISOString()
    };

    await storage.set(`review:${review.id}`, review);

    // Update cleaner average
    const cleaner = await storage.get(`user:${request.acceptedBy}`);
    if (cleaner) {
      const currentRating = cleaner.rating || 5;
      const count = cleaner.reviewCount || 0;
      const newRating = ((currentRating * count) + rating) / (count + 1);
      cleaner.rating = Number(newRating.toFixed(1));
      cleaner.reviewCount = count + 1;
      await storage.set(`user:${request.acceptedBy}`, cleaner);
    }

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
      </Card>
    </div>
  );
};

export default ReviewModal;
