const express = require('express');
const { db, docToObj } = require('../lib/db');
const { requireAuth, sanitizeUser } = require('../lib/auth');

const router = express.Router();

// POST /api/auth/register — client already created Firebase Auth user, sends idToken + profile
router.post('/register', async (req, res) => {
  try {
    const { idToken, name, type, phone, ...rest } = req.body;

    if (!idToken) return res.status(400).json({ error: 'idToken is required' });
    if (!name) return res.status(400).json({ error: 'Name is required' });
    if (!['homeowner', 'cleaner'].includes(type)) {
      return res.status(400).json({ error: 'type must be homeowner or cleaner' });
    }

    let decoded;
    try {
      const admin = require('../lib/firebaseAdmin');
      decoded = await admin.verifyIdToken(idToken);
    } catch (e) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const uid = decoded.uid;
    const email = (decoded.email || '').toLowerCase();

    // Check if user doc already exists
    const existing = docToObj(await db.collection('users').doc(uid).get());
    if (existing) return res.status(409).json({ error: 'An account with this email already exists' });

    const userData = {
      type,
      name,
      email,
      phone: phone || null,
      authProvider: 'email',
      emailVerified: decoded.email_verified || false,
      photoURL: decoded.picture || null,
      profileComplete: true,
      rating: 0,
      reviewCount: 0,
      totalEarnings: 0,
      isAvailable: true,
      createdAt: new Date(),
      // Cleaner-specific
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
    };

    await db.collection('users').doc(uid).set(userData);

    res.status(201).json({ user: sanitizeUser({ id: uid, ...userData }) });
  } catch (err) {
    console.error('register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login — client sends Firebase idToken
router.post('/login', async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ error: 'idToken is required' });

    let decoded;
    try {
      const admin = require('../lib/firebaseAdmin');
      decoded = await admin.verifyIdToken(idToken);
    } catch (e) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const user = docToObj(await db.collection('users').doc(decoded.uid).get());
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({ user: sanitizeUser(user) });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/google
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
    const uid = decoded.uid;
    const userRef = db.collection('users').doc(uid);
    let user = docToObj(await userRef.get());

    if (!user) {
      const userData = {
        email,
        name: decoded.name || email.split('@')[0],
        type: ['homeowner', 'cleaner'].includes(type) ? type : 'homeowner',
        authProvider: 'google',
        photoURL: decoded.picture || null,
        emailVerified: true,
        profileComplete: false,
        rating: 0,
        reviewCount: 0,
        totalEarnings: 0,
        isAvailable: true,
        createdAt: new Date(),
      };
      await userRef.set(userData);
      user = { id: uid, ...userData };
    }

    res.json({ user: sanitizeUser(user) });
  } catch (err) {
    console.error('google auth error:', err);
    res.status(500).json({ error: 'Google sign-in failed' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  const user = docToObj(await db.collection('users').doc(req.user.id).get());
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user: sanitizeUser(user) });
});

module.exports = router;
