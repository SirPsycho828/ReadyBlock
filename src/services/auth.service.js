import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useAuthStore } from '@/stores/authStore';
import localDb from '@/lib/db';

/**
 * All service functions return { success, data?, error? }
 * Components never handle thrown errors.
 */

export async function signUp(email, password) {
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    // User doc is created by onUserCreate Cloud Function
    // but we set a minimal local record immediately
    return { success: true, data: { uid: credential.user.uid } };
  } catch (err) {
    return { success: false, error: mapAuthError(err.code) };
  }
}

export async function signIn(email, password) {
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, data: { uid: credential.user.uid } };
  } catch (err) {
    return { success: false, error: mapAuthError(err.code) };
  }
}

export async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email, {
      url: window.location.origin + '/auth/sign-in',
      handleCodeInApp: false,
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: mapAuthError(err.code) };
  }
}

export async function sendMagicLink(email) {
  try {
    const actionCodeSettings = {
      url: window.location.origin + '/auth/magic-link-callback',
      handleCodeInApp: true,
    };
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    window.localStorage.setItem('readyblock-magic-link-email', email);
    return { success: true };
  } catch (err) {
    return { success: false, error: mapAuthError(err.code) };
  }
}

export async function completeMagicLinkSignIn() {
  try {
    if (!isSignInWithEmailLink(auth, window.location.href)) {
      return { success: false, error: 'invalid-data' };
    }
    const email = window.localStorage.getItem('readyblock-magic-link-email');
    if (!email) {
      return { success: false, error: 'invalid-data' };
    }
    const credential = await signInWithEmailLink(auth, email, window.location.href);
    window.localStorage.removeItem('readyblock-magic-link-email');
    return { success: true, data: { uid: credential.user.uid } };
  } catch (err) {
    return { success: false, error: mapAuthError(err.code) };
  }
}

export async function signOutUser() {
  // Check offline queue before signing out
  const queueCount = await localDb.offlineQueue.count();
  if (queueCount > 0) {
    return { success: false, error: 'queue-not-empty', data: { queueCount } };
  }
  try {
    await firebaseSignOut(auth);
    useAuthStore.getState().reset();
    return { success: true };
  } catch (err) {
    return { success: false, error: 'unknown' };
  }
}

export async function forceSignOut() {
  try {
    // Clear offline queue
    await localDb.offlineQueue.clear();
    await firebaseSignOut(auth);
    useAuthStore.getState().reset();
    return { success: true };
  } catch (err) {
    return { success: false, error: 'unknown' };
  }
}

export async function fetchUserRole(uid) {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return { success: true, data: userDoc.data() };
    }
    // User doc not created yet (Cloud Function may be processing)
    return { success: true, data: { role: 'unverified' } };
  } catch (err) {
    // Offline — check local cache
    const cached = await localDb.userProfile.get(uid);
    if (cached) {
      return { success: true, data: cached };
    }
    return { success: false, error: 'network-unavailable' };
  }
}

/**
 * Initialize Firebase Auth state listener.
 * Called once at app startup.
 */
export function initAuthListener() {
  const { setUser, setRole, setLoading } = useAuthStore.getState();

  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      setUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
      });

      // Fetch role from Firestore
      const result = await fetchUserRole(firebaseUser.uid);
      if (result.success) {
        setRole(result.data.role || 'unverified');
        // Cache locally
        await localDb.userProfile.put({
          uid: firebaseUser.uid,
          ...result.data,
        });
      } else {
        setRole('unverified');
      }
    } else {
      setUser(null);
      setRole(null);
    }
    setLoading(false);
  });
}

/**
 * Check role hierarchy. Returns true if userRole >= requiredRole.
 * Client-side UX check only — Firestore rules are the real enforcement.
 */
const ROLE_HIERARCHY = {
  unverified: 0,
  householdMember: 1,
  householdAdmin: 2,
  blockCaptain: 3,
  neighborhoodCaptain: 4,
  cityCountyCaptain: 5,
};

export function hasMinRole(userRole, requiredRole) {
  return (ROLE_HIERARCHY[userRole] ?? -1) >= (ROLE_HIERARCHY[requiredRole] ?? 999);
}

function mapAuthError(code) {
  const map = {
    'auth/email-already-in-use': 'email-in-use',
    'auth/invalid-email': 'invalid-data',
    'auth/user-not-found': 'not-found',
    'auth/wrong-password': 'invalid-credentials',
    'auth/invalid-credential': 'invalid-credentials',
    'auth/too-many-requests': 'rate-limited',
    'auth/network-request-failed': 'network-unavailable',
  };
  return map[code] || 'unknown';
}
