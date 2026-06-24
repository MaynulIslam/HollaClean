declare const firebase: any;

const firebaseConfig = {
  apiKey: "AIzaSyCWkAm2LBU7gSzwJKm48Or3bgYF77yKS-g",
  authDomain: "hollaclean-ff042.firebaseapp.com",
  projectId: "hollaclean-ff042",
  storageBucket: "hollaclean-ff042.firebasestorage.app",
  messagingSenderId: "328896367702",
  appId: "1:328896367702:web:2746357303d1b33e1f7ff7",
  measurementId: "G-NVKST589LK",
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
  idToken: string;
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
  const idToken = await user.getIdToken();

  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    idToken,
  };
}

export async function signInWithEmail(email: string, password: string): Promise<{ user: any; idToken: string }> {
  if (!isFirebaseAvailable()) {
    throw new Error('Email sign-in is temporarily unavailable.');
  }
  initFirebase();
  const result = await firebase.auth().signInWithEmailAndPassword(email, password);
  const idToken = await result.user.getIdToken();
  return { user: result.user, idToken };
}

export async function createUserWithEmail(email: string, password: string): Promise<{ user: any; idToken: string }> {
  if (!isFirebaseAvailable()) {
    throw new Error('Registration is temporarily unavailable.');
  }
  initFirebase();
  const result = await firebase.auth().createUserWithEmailAndPassword(email, password);
  const idToken = await result.user.getIdToken();
  return { user: result.user, idToken };
}

export async function signOutFirebase(): Promise<void> {
  if (!isFirebaseAvailable() || !firebaseInitialized) return;
  try {
    await firebase.auth().signOut();
  } catch {
    // Silently handle if not signed in
  }
}

/** Get a fresh ID token for the currently signed-in Firebase user. */
export async function getCurrentIdToken(): Promise<string | null> {
  if (!isFirebaseAvailable()) return null;
  initFirebase();
  const currentUser = firebase.auth().currentUser;
  if (!currentUser) return null;
  try {
    return await currentUser.getIdToken();
  } catch {
    return null;
  }
}
