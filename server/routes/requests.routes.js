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
    res.json({ requests: enriched.map((r) => serializeRequest(r, { withImages: false })) });
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
    res.json({ requests: enriched.map((r) => serializeRequest(r, { withImages: false })) });
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
    res.json({ requests: enriched.map((r) => serializeRequest(r, { withImages: false })) });
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

// ─── Offers (name-your-price negotiation) ───────────────────────────────────
//
// A cleaner responds to an open job by either accepting the customer's base
// price or countering with their own. The customer reviews the offers and
// accepts one, which assigns the cleaner and locks in the money (recomputed
// server-side from the agreed price).

function serializeOffer(o, cleaner) {
  let pricing = null;
  try {
    pricing = computeJobPricing(o.price);
  } catch (_) {
    /* below-minimum legacy data — leave money fields null */
  }
  return {
    id: o.id,
    requestId: o.requestId,
    cleanerId: o.cleanerId,
    cleanerName: cleaner ? cleaner.name || '' : '',
    cleanerRating: cleaner && cleaner.rating != null ? cleaner.rating : null,
    cleanerReviewCount: cleaner && cleaner.reviewCount != null ? cleaner.reviewCount : 0,
    price: o.price,
    type: o.type, // 'accept' | 'counter'
    status: o.status, // 'pending' | 'accepted' | 'declined'
    customerTotal: pricing ? pricing.totalAmount : null,
    cleanerPayout: pricing ? pricing.cleanerPayout : null,
    createdAt: toISOOffer(o.createdAt),
  };
}

function toISOOffer(val) {
  if (!val) return null;
  if (typeof val.toDate === 'function') return val.toDate().toISOString();
  if (typeof val.toISOString === 'function') return val.toISOString();
  return String(val);
}

// POST /api/requests/:id/offers — cleaner accepts at base or counters
router.post('/:id/offers', requireAuth, async (req, res) => {
  try {
    if (req.user.type !== 'cleaner') {
      return res.status(403).json({ error: 'Only cleaners can make offers' });
    }
    const job = docToObj(await db.collection('requests').doc(req.params.id).get());
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (job.status !== 'open') {
      return res.status(409).json({ error: 'This job is no longer open' });
    }

    const b = req.body || {};
    const type = b.type === 'counter' ? 'counter' : 'accept';
    const rawPrice = type === 'accept' ? job.basePrice : Number(b.price);
    if (rawPrice == null) {
      return res.status(400).json({ error: 'This job has no base price; send a counter price' });
    }

    let pricing;
    try {
      pricing = computeJobPricing(rawPrice);
    } catch (e) {
      if (e.code === 'BASE_PRICE_TOO_LOW') return res.status(400).json({ error: e.message });
      throw e;
    }

    // One active offer per cleaner per job — replace any previous pending one.
    const existingSnap = await db.collection('offers')
      .where('requestId', '==', req.params.id)
      .where('cleanerId', '==', req.user.id)
      .get();
    const pendingExisting = existingSnap.docs.find((d) => d.data().status === 'pending');

    const now = new Date();
    let offerId;
    if (pendingExisting) {
      offerId = pendingExisting.id;
      await pendingExisting.ref.update({ price: pricing.basePrice, type, updatedAt: now });
    } else {
      offerId = uuid();
      await db.collection('offers').doc(offerId).set({
        requestId: req.params.id,
        cleanerId: req.user.id,
        price: pricing.basePrice,
        type,
        status: 'pending',
        createdAt: now,
      });
    }

    const cleanerDoc = await db.collection('users').doc(req.user.id).get();
    const saved = docToObj(await db.collection('offers').doc(offerId).get());
    res.status(201).json({
      offer: serializeOffer(saved, cleanerDoc.exists ? cleanerDoc.data() : null),
    });
  } catch (err) {
    console.error('create offer error:', err);
    res.status(500).json({ error: 'Failed to submit offer' });
  }
});

// GET /api/requests/:id/offers — owner/admin see all; a cleaner sees their own
router.get('/:id/offers', requireAuth, async (req, res) => {
  try {
    const job = docToObj(await db.collection('requests').doc(req.params.id).get());
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const u = req.user;
    const isOwner = job.homeownerId === u.id || u.type === 'admin';
    if (!isOwner && u.type !== 'cleaner') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    let query = db.collection('offers').where('requestId', '==', req.params.id);
    if (!isOwner) query = query.where('cleanerId', '==', u.id);
    const snap = await query.get();
    const rows = snapshotToArray(snap).sort(
      (a, b) => new Date(toISOOffer(b.createdAt)) - new Date(toISOOffer(a.createdAt))
    );

    const offers = await Promise.all(
      rows.map(async (o) => {
        const cleanerDoc = await db.collection('users').doc(o.cleanerId).get();
        return serializeOffer(o, cleanerDoc.exists ? cleanerDoc.data() : null);
      })
    );
    res.json({ offers });
  } catch (err) {
    console.error('list offers error:', err);
    res.status(500).json({ error: 'Failed to load offers' });
  }
});

// POST /api/requests/:id/offers/:offerId/accept — customer picks an offer
router.post('/:id/offers/:offerId/accept', requireAuth, async (req, res) => {
  try {
    const requestRef = db.collection('requests').doc(req.params.id);
    const offerRef = db.collection('offers').doc(req.params.offerId);

    await db.runTransaction(async (transaction) => {
      const jobDoc = await transaction.get(requestRef);
      if (!jobDoc.exists) throw new Error('NOT_FOUND');
      const job = jobDoc.data();
      if (job.homeownerId !== req.user.id && req.user.type !== 'admin') {
        throw new Error('FORBIDDEN');
      }
      if (job.status !== 'open') throw new Error('NOT_OPEN');

      const offerDoc = await transaction.get(offerRef);
      if (!offerDoc.exists) throw new Error('OFFER_NOT_FOUND');
      const offer = offerDoc.data();
      if (offer.requestId !== req.params.id || offer.status !== 'pending') {
        throw new Error('OFFER_NOT_PENDING');
      }

      // Money is locked in from the AGREED price, recomputed server-side.
      const pricing = computeJobPricing(offer.price);

      transaction.update(requestRef, {
        cleanerId: offer.cleanerId,
        status: 'accepted',
        acceptedAt: new Date(),
        basePrice: pricing.basePrice,
        taxRate: pricing.taxRate,
        taxAmount: pricing.taxAmount,
        totalAmount: pricing.totalAmount,
        platformCommission: pricing.platformCommission,
        cleanerPayout: pricing.cleanerPayout,
        paymentStatus: 'awaiting',
      });
      transaction.update(offerRef, { status: 'accepted', decidedAt: new Date() });
    });

    // Decline all other pending offers on this job (outside the transaction).
    const others = await db.collection('offers')
      .where('requestId', '==', req.params.id)
      .get();
    await Promise.all(
      others.docs
        .filter((d) => d.id !== req.params.offerId && d.data().status === 'pending')
        .map((d) => d.ref.update({ status: 'declined', decidedAt: new Date() }))
    );

    const updated = docToObj(await requestRef.get());
    const enriched = await attachParties(updated);
    res.json({ request: serializeRequest(enriched) });
  } catch (err) {
    if (err.message === 'NOT_FOUND') return res.status(404).json({ error: 'Job not found' });
    if (err.message === 'OFFER_NOT_FOUND') return res.status(404).json({ error: 'Offer not found' });
    if (err.message === 'FORBIDDEN') return res.status(403).json({ error: 'Only the job owner can accept offers' });
    if (err.message === 'NOT_OPEN') return res.status(409).json({ error: 'This job is no longer open' });
    if (err.message === 'OFFER_NOT_PENDING') return res.status(409).json({ error: 'This offer is no longer available' });
    console.error('accept offer error:', err);
    res.status(500).json({ error: 'Failed to accept offer' });
  }
});

module.exports = router;
