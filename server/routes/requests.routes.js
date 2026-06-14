/**
 * Cleaning-request routes — the marketplace core.
 *
 * This is the heart of the rebuild. Previously requests lived in each browser's
 * localStorage, so a homeowner's request was invisible to every cleaner. Now a
 * request is a row in the shared database that any authorized client can read.
 *
 * SECURITY / MONEY: the client never sets prices. Money fields are computed
 * server-side via computePricing() from the cleaner's hourlyRate and the
 * requested hours. The DB row is the single source of truth for what the
 * homeowner is charged and what the cleaner is paid.
 */
const express = require('express');
const { prisma } = require('../lib/db');
const { requireAuth } = require('../lib/auth');
const { computePricing } = require('../lib/pricing');
const { serializeRequest: serialize, WITH_PARTIES } = require('../lib/serialize');

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

    const created = await prisma.cleaningRequest.create({
      data: {
        homeownerId: req.user.id,
        serviceType: String(b.serviceType),
        date: String(b.date),
        time: String(b.time),
        hours,
        address: String(b.address),
        instructions: b.instructions || null,
        images: Array.isArray(b.images) ? b.images : [],
        roomImages: b.roomImages || undefined,
        status: 'open',

        // Property details (optional)
        squareFootage: b.squareFootage != null ? Number(b.squareFootage) : null,
        floorType: b.floorType || null,
        numberOfBedrooms: b.numberOfBedrooms != null ? Number(b.numberOfBedrooms) : null,
        numberOfBathrooms: b.numberOfBathrooms != null ? Number(b.numberOfBathrooms) : null,
        numberOfKitchens: b.numberOfKitchens != null ? Number(b.numberOfKitchens) : null,
        numberOfLivingRooms: b.numberOfLivingRooms != null ? Number(b.numberOfLivingRooms) : null,
        numberOfOtherRooms: b.numberOfOtherRooms != null ? Number(b.numberOfOtherRooms) : null,
        hasPets: b.hasPets != null ? Boolean(b.hasPets) : null,
        // Money is intentionally NOT set here — it's computed when a cleaner with
        // a known hourlyRate accepts the job. We DO record the upfront payment
        // reference if the homeowner prepaid (the amount itself is reconciled
        // server-side via Stripe, never trusted from the client).
        paymentIntentId: b.paymentIntentId || null,
        paymentStatus: b.paymentIntentId ? 'paid' : 'pending',
        paidAt: b.paymentIntentId ? new Date() : null,
      },
      include: WITH_PARTIES,
    });

    res.status(201).json({ request: serialize(created) });
  } catch (err) {
    console.error('create request error:', err);
    res.status(500).json({ error: 'Failed to create request' });
  }
});

// GET /api/requests/open  — cleaners browse the open marketplace
router.get('/open', requireAuth, async (req, res) => {
  try {
    const rows = await prisma.cleaningRequest.findMany({
      where: { status: 'open' },
      orderBy: { createdAt: 'desc' },
      include: WITH_PARTIES,
    });
    res.json({ requests: rows.map(serialize) });
  } catch (err) {
    console.error('list open requests error:', err);
    res.status(500).json({ error: 'Failed to load requests' });
  }
});

// GET /api/requests/mine  — a homeowner's own requests
router.get('/mine', requireAuth, async (req, res) => {
  try {
    const rows = await prisma.cleaningRequest.findMany({
      where: { homeownerId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: WITH_PARTIES,
    });
    res.json({ requests: rows.map(serialize) });
  } catch (err) {
    console.error('list my requests error:', err);
    res.status(500).json({ error: 'Failed to load requests' });
  }
});

// GET /api/requests/jobs  — a cleaner's accepted/active jobs
router.get('/jobs', requireAuth, async (req, res) => {
  try {
    const rows = await prisma.cleaningRequest.findMany({
      where: { cleanerId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: WITH_PARTIES,
    });
    res.json({ requests: rows.map(serialize) });
  } catch (err) {
    console.error('list jobs error:', err);
    res.status(500).json({ error: 'Failed to load jobs' });
  }
});

// GET /api/requests/:id
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const r = await prisma.cleaningRequest.findUnique({
      where: { id: req.params.id },
      include: WITH_PARTIES,
    });
    if (!r) return res.status(404).json({ error: 'Request not found' });

    // Only the homeowner, the assigned cleaner, an admin, or (while open) any
    // cleaner may view a request.
    const u = req.user;
    const allowed =
      u.type === 'admin' ||
      r.homeownerId === u.id ||
      r.cleanerId === u.id ||
      (r.status === 'open' && u.type === 'cleaner');
    if (!allowed) return res.status(403).json({ error: 'Forbidden' });

    res.json({ request: serialize(r) });
  } catch (err) {
    console.error('get request error:', err);
    res.status(500).json({ error: 'Failed to load request' });
  }
});

// POST /api/requests/:id/accept  — a cleaner claims an open job (atomic)
router.post('/:id/accept', requireAuth, async (req, res) => {
  try {
    if (req.user.type !== 'cleaner') {
      return res.status(403).json({ error: 'Only cleaners can accept jobs' });
    }

    const cleaner = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!cleaner) return res.status(404).json({ error: 'Cleaner not found' });

    const existing = await prisma.cleaningRequest.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Request not found' });
    if (existing.status !== 'open') {
      return res.status(409).json({ error: 'This job is no longer available' });
    }

    const pricing = computePricing({ hourlyRate: cleaner.hourlyRate, hours: existing.hours });

    // Atomic claim: updateMany with status:'open' in the WHERE means only the
    // first cleaner to win the race flips the row. count===0 => someone beat us.
    const result = await prisma.cleaningRequest.updateMany({
      where: { id: existing.id, status: 'open' },
      data: {
        cleanerId: cleaner.id,
        status: 'accepted',
        acceptedAt: new Date(),
        hourlyRate: pricing.hourlyRate,
        totalAmount: pricing.totalAmount,
        taxAmount: pricing.taxAmount,
        taxRate: pricing.taxRate,
        platformCommission: pricing.platformCommission,
        cleanerPayout: pricing.cleanerPayout,
        paymentStatus: 'awaiting',
      },
    });

    if (result.count === 0) {
      return res.status(409).json({ error: 'This job was just taken by another cleaner' });
    }

    const updated = await prisma.cleaningRequest.findUnique({
      where: { id: existing.id },
      include: WITH_PARTIES,
    });
    res.json({ request: serialize(updated) });
  } catch (err) {
    console.error('accept request error:', err);
    res.status(500).json({ error: 'Failed to accept job' });
  }
});

// Allowed status transitions, enforced server-side. The cleaner marks a job
// done directly from in_progress (payment was collected up front), so we allow
// in_progress -> completed in addition to the awaiting_payment path.
const TRANSITIONS = {
  accepted: ['in_progress', 'cancelled'],
  in_progress: ['awaiting_payment', 'completed', 'cancelled'],
  awaiting_payment: ['completed'],
  open: ['cancelled'],
};

// PATCH /api/requests/:id/status  — move a job through its lifecycle
router.patch('/:id/status', requireAuth, async (req, res) => {
  try {
    const next = req.body && req.body.status;
    if (!next) return res.status(400).json({ error: 'status is required' });

    const r = await prisma.cleaningRequest.findUnique({ where: { id: req.params.id } });
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

    const data = { status: next };

    // On completion, finalize money server-side: mark paid, queue the payout for
    // admin disbursement, and credit the cleaner's lifetime earnings. All amounts
    // come from the DB row (set when the cleaner accepted), never from the client.
    if (next === 'completed') {
      data.completedAt = new Date();
      data.paymentStatus = 'paid';
      data.paidAt = r.paidAt || new Date();
      data.payoutStatus = 'pending';
      data.payoutAmount = r.cleanerPayout || 0;

      const ops = [
        prisma.cleaningRequest.update({ where: { id: r.id }, data, include: WITH_PARTIES }),
      ];
      if (r.cleanerId && r.cleanerPayout) {
        ops.push(
          prisma.user.update({
            where: { id: r.cleanerId },
            data: { totalEarnings: { increment: r.cleanerPayout } },
          })
        );
      }
      const [updated] = await prisma.$transaction(ops);
      return res.json({ request: serialize(updated) });
    }

    const updated = await prisma.cleaningRequest.update({
      where: { id: r.id },
      data,
      include: WITH_PARTIES,
    });
    res.json({ request: serialize(updated) });
  } catch (err) {
    console.error('update status error:', err);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// POST /api/requests/:id/release  — the assigned cleaner returns an accepted job
// to the open marketplace. Blocked once payment has been collected.
router.post('/:id/release', requireAuth, async (req, res) => {
  try {
    if (req.user.type !== 'cleaner') {
      return res.status(403).json({ error: 'Only cleaners can release jobs' });
    }

    const r = await prisma.cleaningRequest.findUnique({ where: { id: req.params.id } });
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

    const updated = await prisma.cleaningRequest.update({
      where: { id: r.id },
      data: {
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
      },
      include: WITH_PARTIES,
    });
    res.json({ request: serialize(updated) });
  } catch (err) {
    console.error('release request error:', err);
    res.status(500).json({ error: 'Failed to release job' });
  }
});

// POST /api/requests/:id/location-approval  — the assigned cleaner asks an admin
// to approve starting a job from beyond the allowed proximity radius.
router.post('/:id/location-approval', requireAuth, async (req, res) => {
  try {
    if (req.user.type !== 'cleaner') {
      return res.status(403).json({ error: 'Only cleaners can request location approval' });
    }

    const r = await prisma.cleaningRequest.findUnique({ where: { id: req.params.id } });
    if (!r) return res.status(404).json({ error: 'Request not found' });
    if (r.cleanerId !== req.user.id) {
      return res.status(403).json({ error: 'You can only request approval for your own job' });
    }

    const distance = req.body && req.body.distance != null ? Number(req.body.distance) : null;

    const updated = await prisma.cleaningRequest.update({
      where: { id: r.id },
      data: {
        locationApprovalStatus: 'pending',
        locationApprovalRequestedAt: new Date(),
        cleanerDistanceAtStart: distance,
      },
      include: WITH_PARTIES,
    });
    res.json({ request: serialize(updated) });
  } catch (err) {
    console.error('location approval error:', err);
    res.status(500).json({ error: 'Failed to request location approval' });
  }
});

module.exports = router;
