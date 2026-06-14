/**
 * Review routes.
 *
 * A review can only be left by the homeowner who owned a completed request, for
 * the cleaner who did it, once per request. Creating a review recomputes the
 * cleaner's aggregate rating/reviewCount inside a transaction so the directory
 * numbers can never drift from the underlying reviews.
 */
const express = require('express');
const { prisma } = require('../lib/db');
const { requireAuth } = require('../lib/auth');

const router = express.Router();

function serialize(rv) {
  return {
    id: rv.id,
    requestId: rv.requestId,
    cleanerId: rv.cleanerId,
    homeownerId: rv.homeownerId,
    rating: rv.rating,
    comment: rv.comment || '',
    createdAt: rv.createdAt ? rv.createdAt.toISOString() : new Date().toISOString(),
  };
}

// GET /api/reviews?cleanerId=...
router.get('/', requireAuth, async (req, res) => {
  try {
    const { cleanerId } = req.query;
    const where = cleanerId ? { cleanerId: String(cleanerId) } : {};
    const rows = await prisma.review.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
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

    const request = await prisma.cleaningRequest.findUnique({ where: { id: requestId } });
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (request.homeownerId !== req.user.id) {
      return res.status(403).json({ error: 'Only the homeowner can review this job' });
    }
    if (!request.cleanerId) {
      return res.status(400).json({ error: 'This request has no assigned cleaner' });
    }
    if (request.status !== 'completed') {
      return res.status(409).json({ error: 'You can only review a completed job' });
    }

    const already = await prisma.review.findFirst({ where: { requestId } });
    if (already) return res.status(409).json({ error: 'This job has already been reviewed' });

    const cleanerId = request.cleanerId;

    const review = await prisma.$transaction(async (tx) => {
      const created = await tx.review.create({
        data: {
          requestId,
          cleanerId,
          homeownerId: req.user.id,
          rating: numRating,
          comment: comment || null,
        },
      });

      // Recompute the cleaner's aggregate from the source reviews.
      const agg = await tx.review.aggregate({
        where: { cleanerId },
        _avg: { rating: true },
        _count: { rating: true },
      });
      await tx.user.update({
        where: { id: cleanerId },
        data: {
          rating: Math.round((agg._avg.rating || 0) * 10) / 10,
          reviewCount: agg._count.rating,
        },
      });

      return created;
    });

    res.status(201).json({ review: serialize(review) });
  } catch (err) {
    console.error('create review error:', err);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

module.exports = router;
