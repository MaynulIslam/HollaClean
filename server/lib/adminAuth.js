/**
 * Admin authentication — short-lived HMAC tokens signed with ADMIN_SECRET.
 *
 * The admin console doesn't log in as a normal user; instead the client proves
 * it knows ADMIN_SECRET by exchanging it for a short-lived token at
 * POST /api/auth/admin-token, then sends that token in the `x-admin-token`
 * header on every admin request. This mirrors the existing payment-admin auth
 * (AdminFinance) so the whole console uses one mechanism.
 */
const crypto = require('crypto');

const ADMIN_HMAC_SECRET = process.env.ADMIN_SECRET || 'hollaclean-admin-secret-dev';
const ADMIN_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes

function generateAdminToken() {
  const expires = Date.now() + ADMIN_TOKEN_TTL_MS;
  const payload = `${expires}`;
  const sig = crypto.createHmac('sha256', ADMIN_HMAC_SECRET).update(payload).digest('hex');
  return `${expires}.${sig}`;
}

function verifyAdminToken(token) {
  if (!token) return false;
  const [expiresStr, sig] = token.split('.');
  if (!expiresStr || !sig) return false;
  const expires = parseInt(expiresStr, 10);
  if (isNaN(expires) || Date.now() > expires) return false;
  const expected = crypto.createHmac('sha256', ADMIN_HMAC_SECRET).update(expiresStr).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'));
  } catch {
    return false;
  }
}

/** Express middleware: require a valid admin token in the x-admin-token header. */
function requireAdminToken(req, res, next) {
  const token = req.headers['x-admin-token'];
  if (!verifyAdminToken(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

module.exports = {
  ADMIN_TOKEN_TTL_MS,
  generateAdminToken,
  verifyAdminToken,
  requireAdminToken,
};
