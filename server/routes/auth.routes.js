/**
 * Authentication routes — register, login, Google sign-in, current user.
 * Passwords are hashed with bcrypt and stored in the DB (never in the browser).
 */
const express = require('express');
const bcrypt = require('bcryptjs');
const { prisma } = require('../lib/db');
const { signToken, requireAuth, sanitizeUser } = require('../lib/auth');

const router = express.Router();
const BCRYPT_ROUNDS = 12;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, type, phone, ...rest } = req.body;

    if (!email || !EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'A valid email is required' });
    }
    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    if (!name) return res.status(400).json({ error: 'Name is required' });
    if (!['homeowner', 'cleaner'].includes(type)) {
      return res.status(400).json({ error: 'type must be homeowner or cleaner' });
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) return res.status(409).json({ error: 'An account with this email already exists' });

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        name,
        type,
        phone: phone || null,
        authProvider: 'email',
        // Cleaner fields (ignored for homeowners)
        bio: rest.bio || null,
        hourlyRate: rest.hourlyRate != null ? Number(rest.hourlyRate) : null,
        experience: rest.experience != null ? Number(rest.experience) : null,
        services: Array.isArray(rest.services) ? rest.services : [],
        address: rest.address || null,
        streetAddress: rest.streetAddress || null,
        apartment: rest.apartment || null,
        city: rest.city || null,
        province: rest.province || null,
        country: rest.country || 'Canada',
      },
    });

    res.status(201).json({ token: signToken(user), user: sanitizeUser(user) });
  } catch (err) {
    console.error('register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    // Run a compare even when the user is missing to avoid timing-based user enumeration.
    const ok = user && user.passwordHash
      ? await bcrypt.compare(password, user.passwordHash)
      : await bcrypt.compare(password, '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinv');

    if (!user || !ok) return res.status(401).json({ error: 'Invalid email or password' });

    res.json({ token: signToken(user), user: sanitizeUser(user) });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/google
// Expects a Firebase ID token, verified server-side with firebase-admin.
// NOTE: requires FIREBASE_SERVICE_ACCOUNT (JSON) in env. Until that is set this
// endpoint refuses to trust the client, which is the correct secure default.
router.post('/google', async (req, res) => {
  try {
    const { idToken, type } = req.body;
    if (!idToken) return res.status(400).json({ error: 'idToken is required' });

    let decoded;
    try {
      const admin = require('../lib/firebaseAdmin');
      decoded = await admin.verifyIdToken(idToken);
    } catch (e) {
      return res.status(503).json({ error: 'Google sign-in is not configured on the server' });
    }

    const email = (decoded.email || '').toLowerCase();
    let user = await prisma.user.findFirst({
      where: { OR: [{ firebaseUid: decoded.uid }, { email }] },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: decoded.name || email.split('@')[0],
          type: ['homeowner', 'cleaner'].includes(type) ? type : 'homeowner',
          authProvider: 'google',
          firebaseUid: decoded.uid,
          photoURL: decoded.picture || null,
          emailVerified: true,
          profileComplete: false, // front end routes new Google users to profile completion
        },
      });
    } else if (!user.firebaseUid) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { firebaseUid: decoded.uid, authProvider: 'google', emailVerified: true },
      });
    }

    res.json({ token: signToken(user), user: sanitizeUser(user) });
  } catch (err) {
    console.error('google auth error:', err);
    res.status(500).json({ error: 'Google sign-in failed' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user: sanitizeUser(user) });
});

module.exports = router;
