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
// We use experimentalForceLongPolling to bypass potential WebSocket/HTTP2 issues in proxies.
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  localCache: memoryLocalCache(),
}, firebaseConfig.firestoreDatabaseId || "(default)");

console.log("Firestore initialized with Config:", {
  projectId: firebaseConfig.projectId,
  databaseId: firebaseConfig.firestoreDatabaseId || "(default)",
  timestamp: new Date().toISOString()
});

// Connection test as required by Firebase integration standards
async function testConnection() {
  const start = Date.now();
  console.log("Testing Firestore connectivity...");
  try {
    // getDocFromServer is the most reliable "ping" to verify backend reachability.
    // We use a specific path that might exist or just fail with permission denied (which confirms connection).
    await getDocFromServer(doc(db, '_connection_test_', 'ping'));
    console.log(`Firestore connection verified in ${Date.now() - start}ms.`);
  } catch (error: any) {
    const duration = Date.now() - start;
    
    if (error.code === 'permission-denied') {
      console.log(`Firestore connection verified (Permission Denied as expected) in ${duration}ms.`);
    } else {
      console.error(`Firestore connection check failed after ${duration}ms:`, {
        code: error.code,
        message: error.message,
        name: error.name
      });
      
      if (duration >= 9000) {
        console.error("CRITICAL: Firestore connection timed out. This often happens if the environment blocks WebSockets and Long Polling, or if the Firebase project is inactive.");
      }
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
