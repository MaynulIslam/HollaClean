const express = require('express');
const { db, snapshotToArray, docToObj } = require('../lib/db');
const { requireAuth, sanitizeUser } = require('../lib/auth');

const router = express.Router();

const SELF_EDITABLE = [
  'name', 'phone', 'address', 'streetAddress', 'apartment', 'city', 'province', 'postalCode', 'country',
  'photoURL', 'profileComplete',
  'bio', 'hourlyRate', 'experience', 'services', 'isAvailable',
];

const NUMERIC = new Set(['hourlyRate', 'experience']);

// GET /api/users/cleaners
router.get('/cleaners', requireAuth, async (req, res) => {
  try {
    const snapshot = await db.collection('users')
      .where('type', '==', 'cleaner')
      .orderBy('rating', 'desc')
      .get();
    const rows = snapshotToArray(snapshot);
    res.json({ cleaners: rows.map(sanitizeUser) });
  } catch (err) {
    console.error('list cleaners error:', err);
    res.status(500).json({ error: 'Failed to load cleaners' });
  }
});

// GET /api/users/:id
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const user = docToObj(await db.collection('users').doc(req.params.id).get());
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: sanitizeUser(user) });
  } catch (err) {
    console.error('get user error:', err);
    res.status(500).json({ error: 'Failed to load user' });
  }
});

// PATCH /api/users/:id
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    if (req.user.id !== req.params.id && req.user.type !== 'admin') {
      return res.status(403).json({ error: 'You can only edit your own profile' });
    }

    const body = req.body || {};
    const data = {};
    for (const key of SELF_EDITABLE) {
      if (body[key] === undefined) continue;
      if (NUMERIC.has(key)) {
        data[key] = body[key] != null ? Number(body[key]) : null;
      } else if (key === 'services') {
        data[key] = Array.isArray(body[key]) ? body[key] : [];
      } else {
        data[key] = body[key];
      }
    }

    // Allow choosing homeowner/cleaner exactly once — only while profile is incomplete
    if (body.type !== undefined && ['homeowner', 'cleaner'].includes(body.type)) {
      const current = docToObj(await db.collection('users').doc(req.params.id).get());
      if (current && current.profileComplete === false) {
        data.type = body.type;
      }
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'No editable fields supplied' });
    }

    await db.collection('users').doc(req.params.id).update(data);
    const updated = docToObj(await db.collection('users').doc(req.params.id).get());
    res.json({ user: sanitizeUser(updated) });
  } catch (err) {
    console.error('update user error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;
