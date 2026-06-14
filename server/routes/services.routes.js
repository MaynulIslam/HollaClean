/**
 * Public service catalog — the read-only counterpart to the admin services CRUD
 * (see admin.routes.js). The whole app used to read the service list from each
 * browser's localStorage ('config:services'); now homeowners, cleaners and the
 * booking form all read the shared catalog from here so everyone sees the same
 * services and prices the admin configured.
 *
 * If the catalog is empty (fresh database) we return a sensible default set so
 * the app is never left with zero services to book.
 */
const express = require('express');
const { prisma } = require('../lib/db');

const router = express.Router();

// Mirrors utils/config.ts CONFIG.services — used only when the DB has no rows
// yet, so a brand-new deployment still shows bookable services.
const DEFAULT_SERVICES = [
  { id: 'regular', name: 'Regular Cleaning', basePrice: 30 },
  { id: 'deep', name: 'Deep Cleaning', basePrice: 45 },
  { id: 'moveinout', name: 'Move In/Out', basePrice: 50 },
  { id: 'window', name: 'Window Cleaning', basePrice: 35 },
  { id: 'carpet', name: 'Carpet Cleaning', basePrice: 40 },
  { id: 'laundry', name: 'Laundry', basePrice: 25 },
  { id: 'postconstruction', name: 'Post-Construction', basePrice: 55 },
];

// GET /api/services — public catalog (DB rows, or defaults if none configured)
router.get('/', async (req, res) => {
  try {
    const rows = await prisma.serviceOffer.findMany({ orderBy: { name: 'asc' } });
    res.json({ services: rows.length > 0 ? rows : DEFAULT_SERVICES });
  } catch (err) {
    console.error('public list services error:', err);
    // Even if the DB is unreachable, hand back defaults so booking still works.
    res.json({ services: DEFAULT_SERVICES });
  }
});

module.exports = router;
