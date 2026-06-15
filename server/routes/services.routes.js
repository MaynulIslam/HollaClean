const express = require('express');
const { db, snapshotToArray } = require('../lib/db');

const router = express.Router();

const DEFAULT_SERVICES = [
  { id: 'regular', name: 'Regular Cleaning', basePrice: 30 },
  { id: 'deep', name: 'Deep Cleaning', basePrice: 45 },
  { id: 'moveinout', name: 'Move In/Out', basePrice: 50 },
  { id: 'window', name: 'Window Cleaning', basePrice: 35 },
  { id: 'carpet', name: 'Carpet Cleaning', basePrice: 40 },
  { id: 'laundry', name: 'Laundry', basePrice: 25 },
  { id: 'postconstruction', name: 'Post-Construction', basePrice: 55 },
];

// GET /api/services
router.get('/', async (req, res) => {
  try {
    const snapshot = await db.collection('services').orderBy('name', 'asc').get();
    const rows = snapshotToArray(snapshot);
    res.json({ services: rows.length > 0 ? rows : DEFAULT_SERVICES });
  } catch (err) {
    console.error('public list services error:', err);
    res.json({ services: DEFAULT_SERVICES });
  }
});

module.exports = router;
