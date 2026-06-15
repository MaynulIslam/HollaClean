const { verifyIdToken } = require('./firebaseAdmin');
const { db } = require('./db');

function getBearer(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

async function resolveUser(decoded) {
  const doc = await db.collection('users').doc(decoded.uid).get();
  if (!doc.exists) return null;
  const data = doc.data();
  return {
    id: decoded.uid,
    type: data.type || 'homeowner',
    email: decoded.email || data.email || '',
  };
}

function requireAuth(req, res, next) {
  (async () => {
    const token = getBearer(req);
    if (!token) return res.status(401).json({ error: 'Authentication required' });
    try {
      const decoded = await verifyIdToken(token);
      const user = await resolveUser(decoded);
      if (!user) return res.status(401).json({ error: 'User not found' });
      req.user = user;
      next();
    } catch (e) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  })();
}

function requireRole(...roles) {
  return (req, res, next) => {
    (async () => {
      const token = getBearer(req);
      if (!token) return res.status(401).json({ error: 'Authentication required' });
      try {
        const decoded = await verifyIdToken(token);
        const user = await resolveUser(decoded);
        if (!user) return res.status(401).json({ error: 'User not found' });
        if (!roles.includes(user.type)) {
          return res.status(403).json({ error: 'Forbidden' });
        }
        req.user = user;
        next();
      } catch (e) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }
    })();
  };
}

function sanitizeUser(user) {
  if (!user) return user;
  const { passwordHash, ...safe } = user;
  return safe;
}

module.exports = { requireAuth, requireRole, sanitizeUser };
