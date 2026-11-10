// Firebase is loaded on demand (see useAccount), so guests never download it.
import { initializeApp } from "firebase/app";
import {
  GoogleAuthProvider,
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
  deleteDoc,
  doc,
  getDoc,
  initializeFirestore,
  onSnapshot,
  persistentLocalCache,
  persistentMultipleTabManager,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { firebaseConfig } from "./config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
// Offline-first: changes are cached in IndexedDB and synced when back online.
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});

const userDoc = (uid) => doc(db, "users", uid);

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

export async function fetchHabits(uid) {
  const snap = await getDoc(userDoc(uid));
  return snap.exists() ? snap.data().habits : null;
}

export const writeHabits = (uid, habits) =>
  setDoc(userDoc(uid), { habits, updatedAt: serverTimestamp() });

// Calls back with (habits, hasPendingWrites) whenever the stored habits change.
export const watchHabits = (uid, callback) =>
  onSnapshot(userDoc(uid), { includeMetadataChanges: true }, (snap) => {
    if (snap.exists()) callback(snap.data().habits, snap.metadata.hasPendingWrites);
  });

// Deletes the user's data first, then the account itself.
export async function deleteAccount() {
  const user = auth.currentUser;
  await deleteDoc(userDoc(user.uid));
  await deleteUser(user);
}
