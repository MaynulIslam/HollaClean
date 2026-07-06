const express = require('express');
const { db, docToObj, snapshotToArray, attachParties } = require('../lib/db');
const { requireAuth } = require('../lib/auth');
const { computePricing, computeJobPricing } = require('../lib/pricing');
const { serializeRequest } = require('../lib/serialize');
const { v4: uuid } = require('uuid');

const router = express.Router();

// POST /api/requests  — homeowner creates a request
router.post('/', requireAuth, async (req, res) => {
  try {
    if (req.user.type !== 'homeowner') {
      return res.status(403).json({ error: 'Only homeowners can create requests' });
    }
    const b = req.body || {};
    if (!b.serviceType || !b.date || !b.time || !b.address) {
      return res.status(400).json({ error: 'serviceType, date, time and address are required' });
    }

    const hours = Number(b.hours) > 0 ? Math.round(Number(b.hours)) : 1;
    const id = uuid();

    // Name-your-price model: the customer offers a base price and the server
    // computes all money fields (tax, commission, payout). The client never
    // sets derived amounts.
    let jobPricing = null;
    if (b.basePrice != null) {
      try {
        jobPricing = computeJobPricing(Number(b.basePrice));
      } catch (e) {
        if (e.code === 'BASE_PRICE_TOO_LOW') {
          return res.status(400).json({ error: e.message });
        }
        throw e;
      }
    }

    const data = {
      homeownerId: req.user.id,
      serviceType: String(b.serviceType),
      date: String(b.date),
      time: String(b.time),
      hours,
      address: String(b.address),
      instructions: b.instructions || null,
      images: Array.isArray(b.images) ? b.images : [],
      roomImages: b.roomImages || null,
      status: 'open',
      squareFootage: b.squareFootage != null ? Number(b.squareFootage) : null,
      floorType: b.floorType || null,
      numberOfBedrooms: b.numberOfBedrooms != null ? Number(b.numberOfBedrooms) : null,
      numberOfBathrooms: b.numberOfBathrooms != null ? Number(b.numberOfBathrooms) : null,
      numberOfKitchens: b.numberOfKitchens != null ? Number(b.numberOfKitchens) : null,
      numberOfLivingRooms: b.numberOfLivingRooms != null ? Number(b.numberOfLivingRooms) : null,
      numberOfOtherRooms: b.numberOfOtherRooms != null ? Number(b.numberOfOtherRooms) : null,
      hasPets: b.hasPets != null ? Boolean(b.hasPets) : null,
      paymentIntentId: b.paymentIntentId || null,
      paymentStatus: b.paymentIntentId ? 'paid' : 'pending',
      paidAt: b.paymentIntentId ? new Date() : null,
      createdAt: new Date(),
      // Money fields (name-your-price jobs only; legacy hourly requests get
      // these at accept time instead).
      ...(jobPricing
        ? {
            basePrice: jobPricing.basePrice,
            taxRate: jobPricing.taxRate,
            taxAmount: jobPricing.taxAmount,
            totalAmount: jobPricing.totalAmount,
            platformCommission: jobPricing.platformCommission,
            cleanerPayout: jobPricing.cleanerPayout,
          }
        : {}),
    };

    await db.collection('requests').doc(id).set(data);

    const created = await attachParties({ id, ...data });
    res.status(201).json({ request: serializeRequest(created) });
  } catch (err) {
    console.error('create request error:', err);
    res.status(500).json({ error: 'Failed to create request' });
  }
});

// GET /api/requests/open
router.get('/open', requireAuth, async (req, res) => {
  try {
    const snapshot = await db.collection('requests')
      .where('status', '==', 'open')
      .orderBy('createdAt', 'desc')
      .get();
    const rows = snapshotToArray(snapshot);
    const enriched = await Promise.all(rows.map(attachParties));
    res.json({ requests: enriched.map(serializeRequest) });
  } catch (err) {
    console.error('list open requests error:', err);
    res.status(500).json({ error: 'Failed to load requests' });
  }
});

// GET /api/requests/mine
router.get('/mine', requireAuth, async (req, res) => {
  try {
    const snapshot = await db.collection('requests')
      .where('homeownerId', '==', req.user.id)
      .orderBy('createdAt', 'desc')
      .get();
    const rows = snapshotToArray(snapshot);
    const enriched = await Promise.all(rows.map(attachParties));
    res.json({ requests: enriched.map(serializeRequest) });
  } catch (err) {
    console.error('list my requests error:', err);
    res.status(500).json({ error: 'Failed to load requests' });
  }
});

// GET /api/requests/jobs
router.get('/jobs', requireAuth, async (req, res) => {
  try {
    const snapshot = await db.collection('requests')
      .where('cleanerId', '==', req.user.id)
      .orderBy('createdAt', 'desc')
      .get();
    const rows = snapshotToArray(snapshot);
    const enriched = await Promise.all(rows.map(attachParties));
    res.json({ requests: enriched.map(serializeRequest) });
  } catch (err) {
    console.error('list jobs error:', err);
    res.status(500).json({ error: 'Failed to load jobs' });
  }
});

// GET /api/requests/:id
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const r = docToObj(await db.collection('requests').doc(req.params.id).get());
    if (!r) return res.status(404).json({ error: 'Request not found' });

    const u = req.user;
    const allowed =
      u.type === 'admin' ||
      r.homeownerId === u.id ||
      r.cleanerId === u.id ||
      (r.status === 'open' && u.type === 'cleaner');
    if (!allowed) return res.status(403).json({ error: 'Forbidden' });

    const enriched = await attachParties(r);
    res.json({ request: serializeRequest(enriched) });
  } catch (err) {
    console.error('get request error:', err);
    res.status(500).json({ error: 'Failed to load request' });
  }
});

// POST /api/requests/:id/accept
router.post('/:id/accept', requireAuth, async (req, res) => {
  try {
    if (req.user.type !== 'cleaner') {
      return res.status(403).json({ error: 'Only cleaners can accept jobs' });
    }

    const cleanerDoc = await db.collection('users').doc(req.user.id).get();
    if (!cleanerDoc.exists) return res.status(404).json({ error: 'Cleaner not found' });
    const cleaner = cleanerDoc.data();

    const requestRef = db.collection('requests').doc(req.params.id);

    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(requestRef);
      if (!doc.exists) throw new Error('NOT_FOUND');
      const existing = doc.data();
      if (existing.status !== 'open') throw new Error('TAKEN');

      const pricing = computePricing({ hourlyRate: cleaner.hourlyRate, hours: existing.hours });

      transaction.update(requestRef, {
        cleanerId: req.user.id,
        status: 'accepted',
        acceptedAt: new Date(),
        hourlyRate: pricing.hourlyRate,
        totalAmount: pricing.totalAmount,
        taxAmount: pricing.taxAmount,
        taxRate: pricing.taxRate,
        platformCommission: pricing.platformCommission,
        cleanerPayout: pricing.cleanerPayout,
        paymentStatus: 'awaiting',
      });
    });

    const updated = docToObj(await requestRef.get());
    const enriched = await attachParties(updated);
    res.json({ request: serializeRequest(enriched) });
  } catch (err) {
    if (err.message === 'NOT_FOUND') return res.status(404).json({ error: 'Request not found' });
    if (err.message === 'TAKEN') return res.status(409).json({ error: 'This job was just taken by another cleaner' });
    console.error('accept request error:', err);
    res.status(500).json({ error: 'Failed to accept job' });
  }
});

// Allowed status transitions
const TRANSITIONS = {
  accepted: ['in_progress', 'cancelled'],
  in_progress: ['awaiting_payment', 'completed', 'cancelled'],
  awaiting_payment: ['completed'],
  open: ['cancelled'],
};

// PATCH /api/requests/:id/status
router.patch('/:id/status', requireAuth, async (req, res) => {
  try {
    const next = req.body && req.body.status;
    if (!next) return res.status(400).json({ error: 'status is required' });

    const r = docToObj(await db.collection('requests').doc(req.params.id).get());
    if (!r) return res.status(404).json({ error: 'Request not found' });

    const u = req.user;
    const isHomeowner = r.homeownerId === u.id;
    const isCleaner = r.cleanerId === u.id;
    if (!isHomeowner && !isCleaner && u.type !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const allowedNext = TRANSITIONS[r.status] || [];
    if (!allowedNext.includes(next)) {
      return res.status(409).json({ error: `Cannot move from ${r.status} to ${next}` });
    }

    const requestRef = db.collection('requests').doc(req.params.id);

    if (next === 'completed') {
      await db.runTransaction(async (transaction) => {
        const doc = await transaction.get(requestRef);
        if (!doc.exists) throw new Error('NOT_FOUND');
        const current = doc.data();
        const data = {
          status: 'completed',
          completedAt: new Date(),
          paymentStatus: 'paid',
          paidAt: current.paidAt || new Date(),
          payoutStatus: 'pending',
          payoutAmount: current.cleanerPayout || 0,
        };
        transaction.update(requestRef, data);

        if (current.cleanerId && current.cleanerPayout) {
          const userRef = db.collection('users').doc(current.cleanerId);
          const userDoc = await transaction.get(userRef);
          const currentEarnings = userDoc.data().totalEarnings || 0;
          transaction.update(userRef, { totalEarnings: currentEarnings + current.cleanerPayout });
        }
      });
    } else {
      await requestRef.update({ status: next });
    }

    const updated = docToObj(await requestRef.get());
    const enriched = await attachParties(updated);
    res.json({ request: serializeRequest(enriched) });
  } catch (err) {
    if (err.message === 'NOT_FOUND') return res.status(404).json({ error: 'Request not found' });
    console.error('update status error:', err);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// POST /api/requests/:id/release
router.post('/:id/release', requireAuth, async (req, res) => {
  try {
    if (req.user.type !== 'cleaner') {
      return res.status(403).json({ error: 'Only cleaners can release jobs' });
    }

    const r = docToObj(await db.collection('requests').doc(req.params.id).get());
    if (!r) return res.status(404).json({ error: 'Request not found' });
    if (r.cleanerId !== req.user.id) {
      return res.status(403).json({ error: 'You can only release your own job' });
    }
    if (r.status !== 'accepted') {
      return res.status(409).json({ error: 'Only an accepted job can be released' });
    }
    if (r.paymentStatus === 'paid' || r.paymentStatus === 'held') {
      return res.status(409).json({ error: 'Cannot release a job once payment has been collected' });
    }

    await db.collection('requests').doc(req.params.id).update({
      status: 'open',
      cleanerId: null,
      acceptedAt: null,
      hourlyRate: null,
      totalAmount: null,
      taxAmount: null,
      taxRate: null,
      platformCommission: null,
      cleanerPayout: null,
      paymentStatus: 'pending',
      locationApprovalStatus: null,
      locationApprovalRequestedAt: null,
      cleanerDistanceAtStart: null,
    });

    const updated = docToObj(await db.collection('requests').doc(req.params.id).get());
    const enriched = await attachParties(updated);
    res.json({ request: serializeRequest(enriched) });
  } catch (err) {
    console.error('release request error:', err);
    res.status(500).json({ error: 'Failed to release job' });
  }
});

// POST /api/requests/:id/location-approval
router.post('/:id/location-approval', requireAuth, async (req, res) => {
  try {
    if (req.user.type !== 'cleaner') {
      return res.status(403).json({ error: 'Only cleaners can request location approval' });
    }

    const r = docToObj(await db.collection('requests').doc(req.params.id).get());
    if (!r) return res.status(404).json({ error: 'Request not found' });
    if (r.cleanerId !== req.user.id) {
      return res.status(403).json({ error: 'You can only request approval for your own job' });
    }

    const distance = req.body && req.body.distance != null ? Number(req.body.distance) : null;

    await db.collection('requests').doc(req.params.id).update({
      locationApprovalStatus: 'pending',
      locationApprovalRequestedAt: new Date(),
      cleanerDistanceAtStart: distance,
    });

    const updated = docToObj(await db.collection('requests').doc(req.params.id).get());
    const enriched = await attachParties(updated);
    res.json({ request: serializeRequest(enriched) });
  } catch (err) {
    console.error('location approval error:', err);
    res.status(500).json({ error: 'Failed to request location approval' });
  }
});

module.exports = router;
