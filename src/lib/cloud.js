// Firebase is loaded on demand (see useAccount), so guests never download it.
import { initializeApp } from "firebase/app";
import {
  GoogleAuthProvider,
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  deleteUser,
  getAuth,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import {
  connectFirestoreEmulator,
  deleteDoc,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";
import { firebaseConfig } from "./config.js";
import * as sync from "./sync.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
// Offline-first: changes are cached in IndexedDB and synced when back online.
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});

// Local development and testing against the Firebase emulators.
if (import.meta.env.VITE_FIREBASE_EMULATORS === "1") {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
}

const userDoc = (uid) => sync.userRef(db, uid);

export const onUser = (callback) => onAuthStateChanged(auth, callback);

export const signInWithGoogle = () => signInWithPopup(auth, new GoogleAuthProvider());

export const signInWithEmail = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);

export async function registerWithEmail(email, password) {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  await sendEmailVerification(user);
  return user;
}

export const resendVerification = () => sendEmailVerification(auth.currentUser);

// Re-reads the user so a freshly verified email is picked up without signing out.
export async function refreshUser() {
  await auth.currentUser.reload();
  await auth.currentUser.getIdToken(true);
  return auth.currentUser;
}

export const resetPassword = (email) => sendPasswordResetEmail(auth, email);

export const logOut = () => signOut(auth);

export const readHabits = (uid) => sync.readHabits(db, uid);
export const writeAll = (uid, habits) => sync.writeAll(db, uid, habits);
export const sendChange = (uid, change) => sync.sendChange(db, uid, change);
export const watchHabits = (uid, callback, onError) => sync.watchHabits(db, uid, callback, onError);

// Deletes the user's data first, then the account itself.
export async function deleteAccount() {
  const user = auth.currentUser;
  await deleteDoc(userDoc(user.uid));
  await deleteUser(user);
}
