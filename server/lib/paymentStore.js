/**
 * Firestore-backed storage for Stripe payment records and connected accounts.
 *
 * Previously these lived in payments.json / connected-accounts.json on the
 * server's local disk. On hosts like Render the filesystem is ephemeral, so
 * every redeploy or restart wiped this data. Persisting to Firestore keeps it
 * durable and consistent with the rest of the app's data layer.
 *
 * Collections:
 *   payments/{paymentIntentId}
 *   connectedAccounts/{cleanerId}
 */
const { db } = require('./db');

const PAYMENTS = 'payments';
const CONNECTED = 'connectedAccounts';

// ── Payments ────────────────────────────────────────────────────────────────
async function getPayment(paymentIntentId) {
  const doc = await db.collection(PAYMENTS).doc(paymentIntentId).get();
  return doc.exists ? doc.data() : null;
}

async function setPayment(paymentIntentId, data) {
  await db.collection(PAYMENTS).doc(paymentIntentId).set(data, { merge: true });
}

async function getAllPayments() {
  const snap = await db.collection(PAYMENTS).get();
  return snap.docs.map((d) => d.data());
}

// ── Connected (Stripe Express) accounts ──────────────────────────────────────
async function getConnectedAccount(cleanerId) {
  const doc = await db.collection(CONNECTED).doc(cleanerId).get();
  return doc.exists ? doc.data() : null;
}

async function setConnectedAccount(cleanerId, data) {
  await db.collection(CONNECTED).doc(cleanerId).set(data, { merge: true });
}

/** Find the {cleanerId, ...info} for a given Stripe account id, or null. */
async function findConnectedAccountByAccountId(accountId) {
  const snap = await db.collection(CONNECTED).where('accountId', '==', accountId).limit(1).get();
  if (snap.empty) return null;
  return { cleanerId: snap.docs[0].id, ...snap.docs[0].data() };
}

module.exports = {
  getPayment,
  setPayment,
  getAllPayments,
  getConnectedAccount,
  setConnectedAccount,
  findConnectedAccountByAccountId,
};
