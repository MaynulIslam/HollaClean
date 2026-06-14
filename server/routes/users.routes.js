/**
 * User routes — public cleaner directory + profile read/update.
 *
 * Profiles used to live in localStorage, so a cleaner's profile was only ever
 * visible on their own device. Now any homeowner can browse cleaners and view a
 * profile from the shared database.
 */
const express = require('express');
const { prisma } = require('../lib/db');
const { requireAuth, sanitizeUser } = require('../lib/auth');

const router = express.Router();

// Fields a user is allowed to change about themselves. Anything not in this
// list (type, email, passwordHash, rating, totalEarnings, stripe*, etc.) is
// ignored so the client can't escalate privileges or fake its own ratings.
const SELF_EDITABLE = [
  'name',
  'firstName',
  'lastName',
  'phone',
  'address',
  'streetAddress',
  'apartment',
  'city',
  'province',
  'country',
  'photoURL',
  'profileComplete',
  // Cleaner-facing
  'bio',
  'hourlyRate',
  'experience',
  'services',
  'isAvailable',
];

const NUMERIC = new Set(['hourlyRate', 'experience']);

// GET /api/users/cleaners  — public-ish directory of available cleaners
router.get('/cleaners', requireAuth, async (req, res) => {
  try {
    const rows = await prisma.user.findMany({
      where: { type: 'cleaner' },
      orderBy: [{ rating: 'desc' }, { reviewCount: 'desc' }],
    });
    res.json({ cleaners: rows.map(sanitizeUser) });
  } catch (err) {
    console.error('list cleaners error:', err);
    res.status(500).json({ error: 'Failed to load cleaners' });
  }
});

// GET /api/users/:id
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: sanitizeUser(user) });
  } catch (err) {
    console.error('get user error:', err);
    res.status(500).json({ error: 'Failed to load user' });
  }
});

// PATCH /api/users/:id  — a user may only edit their own profile
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

    // Allow choosing homeowner/cleaner exactly once — only while the profile is
    // still being completed (e.g. right after Google sign-up). After that the
    // account type is fixed and cannot be changed via this endpoint.
    if (body.type !== undefined && ['homeowner', 'cleaner'].includes(body.type)) {
      const current = await prisma.user.findUnique({
        where: { id: req.params.id },
        select: { profileComplete: true },
      });
      if (current && current.profileComplete === false) {
        data.type = body.type;
      }
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'No editable fields supplied' });
    }

    const updated = await prisma.user.update({ where: { id: req.params.id }, data });
    res.json({ user: sanitizeUser(updated) });
  } catch (err) {
    console.error('update user error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;
