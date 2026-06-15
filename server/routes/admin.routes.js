const express = require('express');
const { db, docToObj, snapshotToArray, attachParties } = require('../lib/db');
const { requireAdminToken } = require('../lib/adminAuth');
const { sanitizeUser } = require('../lib/auth');
const { serializeRequest } = require('../lib/serialize');
const { round2, DEFAULTS } = require('../lib/pricing');
const { v4: uuid } = require('uuid');

const router = express.Router();

router.use(requireAdminToken);

// ─── Overview / lists ───

// GET /api/admin/requests
router.get('/requests', async (req, res) => {
  try {
    const snapshot = await db.collection('requests').orderBy('createdAt', 'desc').get();
    const rows = snapshotToArray(snapshot);
    const enriched = await Promise.all(rows.map(attachParties));
    res.json({ requests: enriched.map(serializeRequest) });
  } catch (err) {
    console.error('admin list requests error:', err);
    res.status(500).json({ error: 'Failed to load requests' });
  }
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const snapshot = await db.collection('users').orderBy('createdAt', 'desc').get();
    const rows = snapshotToArray(snapshot);
    res.json({ users: rows.map(sanitizeUser) });
  } catch (err) {
    console.error('admin list users error:', err);
    res.status(500).json({ error: 'Failed to load users' });
  }
});

// ─── Service catalog ───

// GET /api/admin/services
router.get('/services', async (req, res) => {
  try {
    const snapshot = await db.collection('services').orderBy('name', 'asc').get();
    const rows = snapshotToArray(snapshot);
    res.json({ services: rows });
  } catch (err) {
    console.error('admin list services error:', err);
    res.status(500).json({ error: 'Failed to load services' });
  }
});

// POST /api/admin/services
router.post('/services', async (req, res) => {
  try {
    const { name, basePrice } = req.body || {};
    if (!name || Number(basePrice) <= 0) {
      return res.status(400).json({ error: 'A name and a positive basePrice are required' });
    }
    const id = uuid();
    const data = { name: String(name), basePrice: round2(basePrice) };
    await db.collection('services').doc(id).set(data);
    res.status(201).json({ service: { id, ...data } });
  } catch (err) {
    console.error('admin create service error:', err);
    res.status(500).json({ error: 'Failed to create service' });
  }
});

// PATCH /api/admin/services/:id
router.patch('/services/:id', async (req, res) => {
  try {
    const { name, basePrice } = req.body || {};
    const data = {};
    if (name !== undefined) data.name = String(name);
    if (basePrice !== undefined) data.basePrice = round2(basePrice);
    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'Nothing to update' });
    }
    const ref = db.collection('services').doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ error: 'Service not found' });
    await ref.update(data);
    const updated = docToObj(await ref.get());
    res.json({ service: updated });
  } catch (err) {
    console.error('admin update service error:', err);
    res.status(500).json({ error: 'Failed to update service' });
  }
});

// DELETE /api/admin/services/:id
router.delete('/services/:id', async (req, res) => {
  try {
    const ref = db.collection('services').doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ error: 'Service not found' });
    await ref.delete();
    res.json({ ok: true });
  } catch (err) {
    console.error('admin delete service error:', err);
    res.status(500).json({ error: 'Failed to delete service' });
  }
});

// ─── Users ───

const ADMIN_USER_FIELDS = [
  'name', 'email', 'phone',
  'address', 'streetAddress', 'apartment', 'city', 'province', 'country',
  'photoURL', 'bio', 'isAvailable',
  'emailVerified', 'phoneVerified', 'addressVerified',
  'stripeConnectStatus',
];
const USER_NUMERIC = new Set(['hourlyRate', 'experience', 'rating', 'reviewCount']);
const USER_BOOL = new Set(['isAvailable', 'emailVerified', 'phoneVerified', 'addressVerified']);

// PATCH /api/admin/users/:id
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

    // Admin password reset via Firebase Admin SDK
    if (body.password) {
      if (String(body.password).length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
      }
      const admin = require('firebase-admin');
      await admin.auth().updateUser(req.params.id, { password: String(body.password) });
    }

    if (Object.keys(data).length === 0 && !body.password) {
      return res.status(400).json({ error: 'No editable fields supplied' });
    }

    const ref = db.collection('users').doc(req.params.id);
    const existing = await ref.get();
    if (!existing.exists) return res.status(404).json({ error: 'User not found' });

    if (Object.keys(data).length > 0) {
      await ref.update(data);
    }

    const updated = docToObj(await ref.get());
    res.json({ user: sanitizeUser(updated) });
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      return res.status(404).json({ error: 'User not found in Firebase Auth' });
    }
    console.error('admin update user error:', err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res) => {
  try {
    const ref = db.collection('users').doc(req.params.id);
    const existing = await ref.get();
    if (!existing.exists) return res.status(404).json({ error: 'User not found' });

    // Check for associated requests
    const requestsSnap = await db.collection('requests')
      .where('homeownerId', '==', req.params.id)
      .limit(1)
      .get();
    if (!requestsSnap.empty) {
      return res.status(409).json({
        error: 'This user has associated requests, jobs or reviews and cannot be deleted.',
      });
    }
    const jobsSnap = await db.collection('requests')
      .where('cleanerId', '==', req.params.id)
      .limit(1)
      .get();
    if (!jobsSnap.empty) {
      return res.status(409).json({
        error: 'This user has associated requests, jobs or reviews and cannot be deleted.',
      });
    }
    const reviewsSnap = await db.collection('reviews')
      .where('cleanerId', '==', req.params.id)
      .limit(1)
      .get();
    if (!reviewsSnap.empty) {
      return res.status(409).json({
        error: 'This user has associated requests, jobs or reviews and cannot be deleted.',
      });
    }

    await ref.delete();
    res.json({ ok: true });
  } catch (err) {
    console.error('admin delete user error:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ─── Requests ───

const REQUEST_TEXT_FIELDS = ['serviceType', 'date', 'time', 'address', 'instructions', 'status', 'paymentStatus'];
const REQUEST_MONEY_FIELDS = ['hourlyRate', 'totalAmount', 'taxAmount', 'platformCommission', 'cleanerPayout'];

// PATCH /api/admin/requests/:id
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

    const ref = db.collection('requests').doc(req.params.id);
    const existing = await ref.get();
    if (!existing.exists) return res.status(404).json({ error: 'Request not found' });

    await ref.update(data);
    const updated = docToObj(await ref.get());
    const enriched = await attachParties(updated);
    res.json({ request: serializeRequest(enriched) });
  } catch (err) {
    console.error('admin update request error:', err);
    res.status(500).json({ error: 'Failed to update request' });
  }
});

// POST /api/admin/requests/:id/location-approval
router.post('/requests/:id/location-approval', async (req, res) => {
  try {
    const decision = req.body && req.body.decision;
    if (!['approved', 'denied'].includes(decision)) {
      return res.status(400).json({ error: "decision must be 'approved' or 'denied'" });
    }
    const ref = db.collection('requests').doc(req.params.id);
    const existing = await ref.get();
    if (!existing.exists) return res.status(404).json({ error: 'Request not found' });

    await ref.update({ locationApprovalStatus: decision });
    const updated = docToObj(await ref.get());
    const enriched = await attachParties(updated);
    res.json({ request: serializeRequest(enriched) });
  } catch (err) {
    console.error('admin location approval error:', err);
    res.status(500).json({ error: 'Failed to update location approval' });
  }
});

// POST /api/admin/requests/:id/payout
router.post('/requests/:id/payout', async (req, res) => {
  try {
    const { action, amount } = req.body || {};
    const ref = db.collection('requests').doc(req.params.id);
    const r = docToObj(await ref.get());
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

    await ref.update(data);
    const updated = docToObj(await ref.get());
    const enriched = await attachParties(updated);
    res.json({ request: serializeRequest(enriched) });
  } catch (err) {
    console.error('admin payout error:', err);
    res.status(500).json({ error: 'Failed to process payout' });
  }
});

module.exports = router;
