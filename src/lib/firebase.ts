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

export async function getAuthToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  try {
    const token = await user.getIdToken();
    return token;
  } catch (error: any) {
    if (error.code === "auth/network-request-failed") {
      console.error("Network error while getting auth token.");
    } else {
      console.error("getAuthToken failed:", error.message);
    }
    return null;
  }
}

/**
 * Returns true for any FormData-like body, including across module/iframe
 * boundaries where instanceof may fail.
 */
function isFormDataBody(body: RequestInit["body"]): boolean {
  if (!body) return false;
  // Standard instanceof check
  if (body instanceof FormData) return true;
  // Constructor-name fallback (works when FormData comes from a different
  // module context — common in Vite dev / Vercel edge runtimes)
  if (typeof body === "object" && (body as any).constructor?.name === "FormData") return true;
  return false;
}

/**
 * Fetch wrapper that attaches the Firebase auth token automatically.
 *
 * IMPORTANT: Never set Content-Type manually when uploading files.
 * This function detects FormData bodies and deliberately omits the
 * Content-Type header so the browser can set the multipart boundary itself.
 */
export async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getAuthToken();

  // Start from any caller-supplied headers (but never trust Content-Type
  // that the caller set on a FormData body — strip it to be safe).
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  const formData = isFormDataBody(options.body);

  if (formData) {
    // Remove any manually-set Content-Type — the browser MUST set this
    // itself so it can include the multipart boundary string.
    delete headers["Content-Type"];
    delete headers["content-type"];
  } else if (!headers["Content-Type"]) {
    // Non-file requests default to JSON
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