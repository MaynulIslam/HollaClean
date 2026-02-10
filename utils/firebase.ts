
/**
 * Firebase Authentication Utility
 *
 * Uses Firebase compat SDK loaded via CDN in index.html.
 * Provides Google sign-in functionality.
 */

// Global firebase object loaded via CDN script tags
declare const firebase: any;

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

let firebaseInitialized = false;

function initFirebase() {
  if (firebaseInitialized) return;
  if (!isFirebaseAvailable()) return;

  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    firebaseInitialized = true;
  } catch (err) {
    console.error('Firebase initialization failed:', err);
  }
}

export function isFirebaseAvailable(): boolean {
  return typeof firebase !== 'undefined' && firebase.apps !== undefined;
}

export interface GoogleUserInfo {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
}

export async function signInWithGoogle(): Promise<GoogleUserInfo> {
  if (!isFirebaseAvailable()) {
    throw new Error('Google sign-in is temporarily unavailable. Please use email login.');
  }

  initFirebase();

  const provider = new firebase.auth.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  const result = await firebase.auth().signInWithPopup(provider);
  const user = result.user;

  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
  };
}

export async function signOutFirebase(): Promise<void> {
  if (!isFirebaseAvailable() || !firebaseInitialized) return;
  try {
    await firebase.auth().signOut();
  } catch {
    // Silently handle if not signed in
  }
}
