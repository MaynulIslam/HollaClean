/**
 * JWT auth helpers + Express middleware.
 *
 * Replaces the old model where the browser held all user data in localStorage.
 * The server now issues a signed JWT on login/register; the browser stores only
 * the token. User identity is derived from the verified token on every request.
 */
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'CHANGE_ME_dev_only_secret';
const JWT_TTL = '7d';

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  // Fail loud in production rather than signing tokens with a known dev secret.
  throw new Error('JWT_SECRET must be set in production');
}

function signToken(user) {
  return jwt.sign(
    { sub: user.id, type: user.type, email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_TTL }
  );
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

function getBearer(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

/** Require a valid JWT. Attaches { id, type, email } to req.user. */
function requireAuth(req, res, next) {
  const payload = verifyToken(getBearer(req));
  if (!payload) return res.status(401).json({ error: 'Authentication required' });
  req.user = { id: payload.sub, type: payload.type, email: payload.email };
  next();
}

/** Require an authenticated admin. */
function requireRole(...roles) {
  return (req, res, next) => {
    const payload = verifyToken(getBearer(req));
    if (!payload) return res.status(401).json({ error: 'Authentication required' });
    if (!roles.includes(payload.type)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    req.user = { id: payload.sub, type: payload.type, email: payload.email };
    next();
  };
}

/** Strip server-only fields before sending a user to the client. */
function sanitizeUser(user) {
  if (!user) return user;
  const { passwordHash, ...safe } = user;
  return safe;
}

module.exports = { signToken, verifyToken, requireAuth, requireRole, sanitizeUser };
