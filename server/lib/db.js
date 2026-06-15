const { getFirestore } = require('./firebaseAdmin');

const db = getFirestore();

function docToObj(doc) {
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

function snapshotToArray(snapshot) {
  return snapshot.docs.map(docToObj);
}

function toISO(val) {
  if (!val) return null;
  if (typeof val === 'string') return val;
  if (typeof val.toDate === 'function') return val.toDate().toISOString();
  if (typeof val.toISOString === 'function') return val.toISOString();
  return String(val);
}

function serializeTimestamps(obj) {
  if (!obj) return obj;
  const result = { ...obj };
  for (const key of Object.keys(result)) {
    const val = result[key];
    if (val && typeof val === 'object' && typeof val.toDate === 'function') {
      result[key] = val.toDate().toISOString();
    }
  }
  return result;
}

async function attachParties(r) {
  if (!r) return r;
  const fetches = [];
  if (r.homeownerId) fetches.push(db.collection('users').doc(r.homeownerId).get());
  else fetches.push(Promise.resolve(null));
  if (r.cleanerId) fetches.push(db.collection('users').doc(r.cleanerId).get());
  else fetches.push(Promise.resolve(null));
  const [homeownerSnap, cleanerSnap] = await Promise.all(fetches);
  if (homeownerSnap && homeownerSnap.exists) {
    r.homeowner = { id: homeownerSnap.id, ...homeownerSnap.data() };
  }
  if (cleanerSnap && cleanerSnap.exists) {
    r.cleaner = { id: cleanerSnap.id, ...cleanerSnap.data() };
  }
  return r;
}

module.exports = {
  db,
  docToObj,
  snapshotToArray,
  toISO,
  serializeTimestamps,
  attachParties,
};
