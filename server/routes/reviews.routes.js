const express = require('express');
const { db, docToObj, snapshotToArray, toISO } = require('../lib/db');
const { requireAuth } = require('../lib/auth');
const { v4: uuid } = require('uuid');

const router = express.Router();

function serialize(rv) {
  return {
    id: rv.id,
    requestId: rv.requestId,
    cleanerId: rv.cleanerId,
    homeownerId: rv.homeownerId,
    rating: rv.rating,
    comment: rv.comment || '',
    createdAt: toISO(rv.createdAt) || new Date().toISOString(),
  };
}

// GET /api/reviews?cleanerId=...
router.get('/', requireAuth, async (req, res) => {
  try {
    const { cleanerId } = req.query;
    let query = db.collection('reviews').orderBy('createdAt', 'desc');
    if (cleanerId) query = query.where('cleanerId', '==', String(cleanerId));
    const rows = snapshotToArray(await query.get());
    res.json({ reviews: rows.map(serialize) });
  } catch (err) {
    console.error('list reviews error:', err);
    res.status(500).json({ error: 'Failed to load reviews' });
  }
});

// POST /api/reviews
router.post('/', requireAuth, async (req, res) => {
  try {
    const { requestId, rating, comment } = req.body || {};
    const numRating = Number(rating);
    if (!requestId) return res.status(400).json({ error: 'requestId is required' });
    if (!(numRating >= 1 && numRating <= 5)) {
      return res.status(400).json({ error: 'rating must be between 1 and 5' });
    }

    const requestDoc = await db.collection('requests').doc(requestId).get();
    if (!requestDoc.exists) return res.status(404).json({ error: 'Request not found' });
    const request = requestDoc.data();

    if (request.homeownerId !== req.user.id) {
      return res.status(403).json({ error: 'Only the homeowner can review this job' });
    }
    if (!request.cleanerId) {
      return res.status(400).json({ error: 'This request has no assigned cleaner' });
    }
    if (request.status !== 'completed') {
      return res.status(409).json({ error: 'You can only review a completed job' });
    }

    // Check if already reviewed
    const existingSnapshot = await db.collection('reviews')
      .where('requestId', '==', requestId)
      .limit(1)
      .get();
    if (!existingSnapshot.empty) {
      return res.status(409).json({ error: 'This job has already been reviewed' });
    }

    const cleanerId = request.cleanerId;
    const reviewId = uuid();

    // Run in a transaction: create review + update cleaner aggregate
    await db.runTransaction(async (transaction) => {
      const reviewData = {
        requestId,
        cleanerId,
        homeownerId: req.user.id,
        rating: numRating,
        comment: comment || null,
        createdAt: new Date(),
      };
      transaction.set(db.collection('reviews').doc(reviewId), reviewData);

      // Recompute cleaner's aggregate rating
      const allReviewsSnapshot = await db.collection('reviews')
        .where('cleanerId', '==', cleanerId)
        .get();
      const allRatings = allReviewsSnapshot.docs.map(d => d.data().rating);
      const avg = allRatings.length > 0
        ? Math.round((allRatings.reduce((a, b) => a + b, 0) / allRatings.length) * 10) / 10
        : 0;
      transaction.update(db.collection('users').doc(cleanerId), {
        rating: avg,
        reviewCount: allRatings.length,
      });
    });

    const reviewDoc = await db.collection('reviews').doc(reviewId).get();
    res.status(201).json({ review: serialize({ id: reviewDoc.id, ...reviewDoc.data() }) });
  } catch (err) {
    console.error('create review error:', err);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

module.exports = router;
