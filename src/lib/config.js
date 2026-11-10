// Firebase web config. These values identify the project and are safe to be
// public: access is enforced by the Firestore security rules (firestore.rules).
// They're injected at build time from VITE_FIREBASE_* environment variables
// (GitHub Actions repository variables in CI, .env.local for local dev).
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Without a config the app simply runs in guest mode.
export const cloudEnabled = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
