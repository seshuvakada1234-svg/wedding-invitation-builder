/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously,
  signOut,
} from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

// ─── App Init ────────────────────────────────────────────────────────────────

const app = initializeApp(firebaseConfig);

// ─── Firestore ────────────────────────────────────────────────────────────────
export const db = initializeFirestore(app, {
  ignoreUndefinedProperties: true,
}, firebaseConfig.firestoreDatabaseId);

/**
 * Recursively removes undefined values from an object or array to prevent Firestore crashes.
 * Also ensures empty images are represented as empty strings.
 */
export function sanitizeFirestoreData(data: any): any {
  if (data === undefined) return null;
  if (data === null || typeof data !== 'object') return data;
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeFirestoreData(item));
  }
  
  const sanitized: Record<string, any> = {};
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const value = data[key];
      // If it's a field we know should be a string (like image) but it's empty/underfined
      if (key === 'image' && (value === undefined || value === null)) {
        sanitized[key] = "";
        continue;
      }
      
      if (value !== undefined) {
        sanitized[key] = sanitizeFirestoreData(value);
      } else {
        sanitized[key] = null;
      }
    }
  }
  return sanitized;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = () => signInWithPopup(auth, googleProvider);
export const loginAnonymously = () => signInAnonymously(auth);
export const logout = () => signOut(auth);

// ✅ call this before every fetch to /api/* that needs auth
export async function getAuthToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) {
    return null;
  }
  try {
    // We remove the explicit 'true' (force refresh) to avoid unnecessary network calls
    // especially if the user is in a restricted or unstable network environment.
    // Firebase SDK will still refresh the token automatically if it has expired.
    const token = await user.getIdToken();
    return token;
  } catch (error: any) {
    if (error.code === "auth/network-request-failed") {
      console.error("Network error while getting auth token. The client might be offline or blocked.");
      // We return null and let the caller handle it (usually by showing an error or re-trying)
    } else {
      console.error("getAuthToken failed:", error.message);
    }
    return null;
  }
}

// ✅ convenience wrapper: fetch with Authorization header pre-attached
export async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getAuthToken();

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  // Only set default Content-Type if not provided and not FormData
  if (!headers["Content-Type"] && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return fetch(url, { ...options, headers });
}

export function handleFirestoreError(
  error: any,
  operationType: "create" | "update" | "delete" | "list" | "get" | "write",
  path: string | null = null
) {
  console.error(`Firebase error [${operationType}] at [${path}]:`, error);
  throw error;
}