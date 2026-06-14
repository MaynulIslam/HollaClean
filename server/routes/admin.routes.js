/**
 * Admin console routes — the database-backed replacement for the AdminDashboard's
 * old localStorage reads/writes. Every route requires a valid admin token
 * (x-admin-token header), minted from ADMIN_SECRET via /api/auth/admin-token.
 *
 * The admin console used to read each browser's localStorage, so it only ever
 * saw data created on that one device. These routes expose the shared database
 * so an admin sees every user, request and service across the platform.
 */
const express = require('express');
const bcrypt = require('bcryptjs');
const { prisma } = require('../lib/db');
const { requireAdminToken } = require('../lib/adminAuth');
const { sanitizeUser } = require('../lib/auth');
const { serializeRequest, WITH_PARTIES } = require('../lib/serialize');
const { round2, DEFAULTS } = require('../lib/pricing');

const router = express.Router();
const BCRYPT_ROUNDS = 12;

// Every admin route is gated by the admin token.
router.use(requireAdminToken);

// ─── Overview / lists ───────────────────────────────────────────────────────

// GET /api/admin/requests — every cleaning request
router.get('/requests', async (req, res) => {
  try {
    const rows = await prisma.cleaningRequest.findMany({
      orderBy: { createdAt: 'desc' },
      include: WITH_PARTIES,
    });
    res.json({ requests: rows.map(serializeRequest) });
  } catch (err) {
    console.error('admin list requests error:', err);
    res.status(500).json({ error: 'Failed to load requests' });
  }
});

// GET /api/admin/users — every user (homeowners + cleaners + admins)
router.get('/users', async (req, res) => {
  try {
    const rows = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ users: rows.map(sanitizeUser) });
  } catch (err) {
    console.error('admin list users error:', err);
    res.status(500).json({ error: 'Failed to load users' });
  }
});

// ─── Service catalog ────────────────────────────────────────────────────────

// GET /api/admin/services
router.get('/services', async (req, res) => {
  try {
    const rows = await prisma.serviceOffer.findMany({ orderBy: { name: 'asc' } });
    res.json({ services: rows });
  } catch (err) {
    console.error('admin list services error:', err);
    res.status(500).json({ error: 'Failed to load services' });
  }
});

// POST /api/admin/services { name, basePrice }
router.post('/services', async (req, res) => {
  try {
    const { name, basePrice } = req.body || {};
    if (!name || Number(basePrice) <= 0) {
      return res.status(400).json({ error: 'A name and a positive basePrice are required' });
    }
    const created = await prisma.serviceOffer.create({
      data: { name: String(name), basePrice: round2(basePrice) },
    });
    res.status(201).json({ service: created });
  } catch (err) {
    console.error('admin create service error:', err);
    res.status(500).json({ error: 'Failed to create service' });
  }
});

// PATCH /api/admin/services/:id { name?, basePrice? }
router.patch('/services/:id', async (req, res) => {
  try {
    const { name, basePrice } = req.body || {};
    const data = {};
    if (name !== undefined) data.name = String(name);
    if (basePrice !== undefined) data.basePrice = round2(basePrice);
    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'Nothing to update' });
    }
    const updated = await prisma.serviceOffer.update({ where: { id: req.params.id }, data });
    res.json({ service: updated });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Service not found' });
    console.error('admin update service error:', err);
    res.status(500).json({ error: 'Failed to update service' });
  }
});

// DELETE /api/admin/services/:id
router.delete('/services/:id', async (req, res) => {
  try {
    await prisma.serviceOffer.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Service not found' });
    console.error('admin delete service error:', err);
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

// ─── Users ──────────────────────────────────────────────────────────────────

// Columns an admin may write. Anything else in the body is ignored. (Note:
// firstName/lastName are NOT DB columns — the client combines them into `name`.)
const ADMIN_USER_FIELDS = [
  'name', 'email', 'phone',
  'address', 'streetAddress', 'apartment', 'city', 'province', 'country',
  'photoURL', 'bio', 'isAvailable',
  'emailVerified', 'phoneVerified', 'addressVerified',
  'stripeConnectStatus',
];
const USER_NUMERIC = new Set(['hourlyRate', 'experience', 'rating', 'reviewCount']);
const USER_BOOL = new Set(['isAvailable', 'emailVerified', 'phoneVerified', 'addressVerified']);

// PATCH /api/admin/users/:id — admin may edit broader fields than a self-edit.
router.patch('/users/:id', async (req, res) => {
  try {
    const body = req.body || {};
    const data = {};

    for (const key of ADMIN_USER_FIELDS) {
      if (body[key] === undefined) continue;
      data[key] = USER_BOOL.has(key) ? Boolean(body[key]) : body[key];
    }
    for (const key of USER_NUMERIC) {
      if (body[key] === undefined) continue;
      data[key] = body[key] != null && body[key] !== '' ? Number(body[key]) : null;
    }
    if (body.services !== undefined) {
      data.services = Array.isArray(body.services) ? body.services : [];
    }
    if (body.email !== undefined) data.email = String(body.email).toLowerCase();

    // Optional admin password reset.
    if (body.password) {
      if (String(body.password).length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
      }
      data.passwordHash = await bcrypt.hash(String(body.password), BCRYPT_ROUNDS);
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'No editable fields supplied' });
    }

    const updated = await prisma.user.update({ where: { id: req.params.id }, data });
    res.json({ user: sanitizeUser(updated) });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'User not found' });
    if (err.code === 'P2002') return res.status(409).json({ error: 'That email is already in use' });
    console.error('admin update user error:', err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// DELETE /api/admin/users/:id — hard delete. Blocked if the user still has
// requests/jobs/reviews (FK), with a clear message instead of a 500.
router.delete('/users/:id', async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'User not found' });
    if (err.code === 'P2003') {
      return res.status(409).json({
        error: 'This user has associated requests, jobs or reviews and cannot be deleted.',
      });
    }
    console.error('admin delete user error:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ─── Requests ─────────────────────────────────────────────────────────────--

const REQUEST_TEXT_FIELDS = ['serviceType', 'date', 'time', 'address', 'instructions', 'status', 'paymentStatus'];
const REQUEST_MONEY_FIELDS = ['hourlyRate', 'totalAmount', 'taxAmount', 'platformCommission', 'cleanerPayout'];

// PATCH /api/admin/requests/:id — admin override of a request. Money fields are
// stored as sent (a deliberate privileged override); if the admin sends only a
// new totalAmount we derive commission/payout from it for convenience.
router.patch('/requests/:id', async (req, res) => {
  try {
    const body = req.body || {};
    const data = {};

    for (const key of REQUEST_TEXT_FIELDS) {
      if (body[key] !== undefined) data[key] = body[key] === '' ? null : body[key];
    }
    if (body.hours !== undefined) data.hours = Math.max(1, Math.round(Number(body.hours) || 1));

    for (const key of REQUEST_MONEY_FIELDS) {
      if (body[key] !== undefined && body[key] !== null && body[key] !== '') {
        data[key] = round2(body[key]);
      }
    }
    // Convenience: total provided but commission/payout not → derive them.
    if (
      data.totalAmount != null &&
      body.platformCommission === undefined &&
      body.cleanerPayout === undefined
    ) {
      data.platformCommission = round2(data.totalAmount * DEFAULTS.commissionRate);
      data.cleanerPayout = round2(data.totalAmount - data.platformCommission);
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'No editable fields supplied' });
    }

    const updated = await prisma.cleaningRequest.update({
      where: { id: req.params.id },
      data,
      include: WITH_PARTIES,
    });
    res.json({ request: serializeRequest(updated) });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Request not found' });
    console.error('admin update request error:', err);
    res.status(500).json({ error: 'Failed to update request' });
  }
});

// POST /api/admin/requests/:id/location-approval { decision: 'approved' | 'denied' }
router.post('/requests/:id/location-approval', async (req, res) => {
  try {
    const decision = req.body && req.body.decision;
    if (!['approved', 'denied'].includes(decision)) {
      return res.status(400).json({ error: "decision must be 'approved' or 'denied'" });
    }
    const updated = await prisma.cleaningRequest.update({
      where: { id: req.params.id },
      data: { locationApprovalStatus: decision },
      include: WITH_PARTIES,
    });
    res.json({ request: serializeRequest(updated) });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Request not found' });
    console.error('admin location approval error:', err);
    res.status(500).json({ error: 'Failed to update location approval' });
  }
});

// POST /api/admin/requests/:id/payout { action: 'disburse' | 'adjust', amount? }
router.post('/requests/:id/payout', async (req, res) => {
  try {
    const { action, amount } = req.body || {};
    const r = await prisma.cleaningRequest.findUnique({ where: { id: req.params.id } });
    if (!r) return res.status(404).json({ error: 'Request not found' });

    let data;
    if (action === 'adjust') {
      const amt = round2(amount);
      if (!(amt > 0)) return res.status(400).json({ error: 'A positive amount is required' });
      data = { payoutAmount: amt };
    } else if (action === 'disburse') {
      const payoutAmt = r.payoutAmount != null ? r.payoutAmount : r.cleanerPayout || 0;
      data = {
        payoutStatus: 'disbursed',
        payoutDisbursedAt: new Date(),
        payoutAmount: round2(payoutAmt),
      };
    } else {
      return res.status(400).json({ error: "action must be 'disburse' or 'adjust'" });
    }

    const updated = await prisma.cleaningRequest.update({
      where: { id: r.id },
      data,
      include: WITH_PARTIES,
    });
    res.json({ request: serializeRequest(updated) });
  } catch (err) {
    console.error('admin payout error:', err);
    res.status(500).json({ error: 'Failed to process payout' });
  }
});

module.exports = router;
