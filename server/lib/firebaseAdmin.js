const admin = require('firebase-admin');

let app;
let firestoreDb;

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

function getFirestore() {
  if (firestoreDb) return firestoreDb;
  firestoreDb = getApp().firestore();
  return firestoreDb;
}

async function verifyIdToken(idToken) {
  return getApp().auth().verifyIdToken(idToken);
}

module.exports = { verifyIdToken, getFirestore };
