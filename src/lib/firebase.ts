/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { initializeFirestore, doc, getDocFromServer, memoryLocalCache } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);

// Initialize Firestore with robust settings for sandboxed environments.
// Some environments block WebSockets but also have issues with certain Long Polling headers.
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  localCache: memoryLocalCache(),
  host: 'firestore.googleapis.com',
  ssl: true,
}, firebaseConfig.firestoreDatabaseId || "(default)");

console.log("Firestore initialized with Project ID:", firebaseConfig.projectId);
// Note: if using multiple databases, you might need:
// export const db = initializeFirestore(app, {...}, firebaseConfig.firestoreDatabaseId);

// Connection test as required by Firebase integration standards
async function testConnection() {
  const start = Date.now();
  console.log("Testing Firestore connectivity with Database ID:", firebaseConfig.firestoreDatabaseId || "(default)");
  try {
    // getDocFromServer is the most reliable "ping" to verify backend reachability.
    const testDoc = doc(db, '_connection_test_', 'ping');
    await getDocFromServer(testDoc);
    console.log(`Firestore connection verified in ${Date.now() - start}ms.`);
  } catch (error: any) {
    const duration = Date.now() - start;
    console.warn(`Connection test result after ${duration}ms:`, error.code || error.message);
    
    if (error.code === 'permission-denied') {
      console.log(`Firestore connection verified (Permission Denied as expected) in ${duration}ms.`);
    } else if (error.code === 'unavailable') {
      console.error("Firestore backend is UNAVAILABLE. This is likely a network/proxy issue.");
    } else {
      console.error(`Firestore connection check failed (${error.code}):`, error.message);
    }
  }
}
// Run connection test but don't let it block
testConnection();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);

export interface FirestoreErrorInfo {
  error: string;
  operationType: 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';
  path: string | null;
  authInfo: {
    userId: string;
    email: string;
    emailVerified: boolean;
    isAnonymous: boolean;
    providerInfo: { providerId: string; displayName: string; email: string; }[];
  }
}

export function handleFirestoreError(error: any, operationType: FirestoreErrorInfo['operationType'], path: string | null = null) {
  if (error.code === 'permission-denied') {
    const info: FirestoreErrorInfo = {
      error: error.message,
      operationType,
      path,
      authInfo: {
        userId: auth.currentUser?.uid || 'anonymous',
        email: auth.currentUser?.email || '',
        emailVerified: auth.currentUser?.emailVerified || false,
        isAnonymous: auth.currentUser?.isAnonymous || true,
        providerInfo: auth.currentUser?.providerData.map(p => ({
          providerId: p.providerId,
          displayName: p.displayName || '',
          email: p.email || ''
        })) || []
      }
    };
    throw new Error(JSON.stringify(info));
  }
  throw error;
}
