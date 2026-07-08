const express = require('express');
const { db, snapshotToArray } = require('../lib/db');

const router = express.Router();

// Curated service areas (the cities HollaClean operates in). This is NOT a full
// address database — just the cities we serve, so filtering by city is exact and
// spelling-consistent. Managed from the admin console later; seeded here.
const DEFAULT_CITIES = [
  'Barrie', 'Belleville', 'Brampton', 'Burlington', 'Cambridge', 'Guelph',
  'Hamilton', 'Kingston', 'Kitchener', 'London', 'Markham', 'Mississauga',
  'Niagara Falls', 'North Bay', 'Oakville', 'Oshawa', 'Ottawa', 'Peterborough',
  'Richmond Hill', 'Sarnia', 'Sault Ste. Marie', 'St. Catharines', 'Sudbury',
  'Thunder Bay', 'Toronto', 'Vaughan', 'Waterloo', 'Windsor',
].map((name) => ({ name, province: 'Ontario', country: 'Canada' }));

// GET /api/cities — the service-area list (public).
router.get('/', async (req, res) => {
  try {
    const snapshot = await db.collection('cities').orderBy('name', 'asc').get();
    const rows = snapshotToArray(snapshot);
    res.json({ cities: rows.length > 0 ? rows : DEFAULT_CITIES });
  } catch (err) {
    console.error('list cities error:', err);
    res.json({ cities: DEFAULT_CITIES });
  }
});

module.exports = router;
