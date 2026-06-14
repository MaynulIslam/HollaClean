/**
 * Firebase Admin singleton — used ONLY to verify Google sign-in ID tokens
 * server-side. The browser never gets to assert who it is; it hands us a
 * Firebase ID token and we verify it here against Google's public keys.
 *
 * Configuration:
 *   FIREBASE_SERVICE_ACCOUNT  — the service-account JSON, as a single-line
 *                               string (stringified JSON). Required.
 *
 * If the env var is missing or malformed we throw on first use. The /google
 * auth route catches that and returns 503 ("not configured"), which is the
 * correct secure default — we never trust an unverified token.
 */
const admin = require('firebase-admin');

let app;

function getApp() {
  if (app) return app;

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT is not set');
  }

  let serviceAccount;
  try {
    serviceAccount = typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch (e) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT is not valid JSON');
  }

  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  return app;
}

/** Verify a Firebase ID token. Returns the decoded token or throws. */
async function verifyIdToken(idToken) {
  return getApp().auth().verifyIdToken(idToken);
}

module.exports = { verifyIdToken };
