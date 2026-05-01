import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function initializeAdmin() {
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }

  const clean = (val: string | undefined) =>
    val?.trim().replace(/^["']|["']$/g, "");

  // ── Path 1: Full JSON service account (most reliable) ──
  const firebaseKey = process.env.FIREBASE_KEY;
  if (firebaseKey) {
    try {
      const serviceAccount = JSON.parse(firebaseKey);
      console.log("Firebase Admin: init with FIREBASE_KEY JSON...");
      return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id,
      });
    } catch (err: any) {
      console.error("FIREBASE_KEY parse failed:", err.message);
    }
  }

  // ── Path 2: Individual env vars (Vercel) ──
  const projectId = clean(process.env.FIREBASE_PROJECT_ID);
  const clientEmail = clean(process.env.FIREBASE_CLIENT_EMAIL);
  const privateKey = clean(process.env.FIREBASE_PRIVATE_KEY);

  if (projectId && clientEmail && privateKey) {
    const formattedKey = privateKey
      .replace(/\\n/g, "\n")
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .trim();
    try {
      console.log("Firebase Admin: init with individual env vars...");
      console.log("- projectId:", projectId);
      console.log("- clientEmail:", clientEmail);
      console.log("- privateKey starts:", formattedKey.substring(0, 40));
      console.log("- privateKey newlines:", (formattedKey.match(/\n/g) || []).length);
      return admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: formattedKey,
        }),
        projectId,
      });
    } catch (err: any) {
      console.error("Firebase Admin env init failed:", err.message);
    }
  }

  // ── Path 3: service-account.json file (local dev) ──
  const serviceAccountPath = path.join(process.cwd(), "service-account.json");
  if (fs.existsSync(serviceAccountPath)) {
    try {
      console.log("Firebase Admin: init with service-account.json...");
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));
      return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id,
      });
    } catch (err: any) {
      console.error("Firebase Admin service-account.json init failed:", err.message);
    }
  }

  // ── Path 4: firebase-applet-config.json (AI Studio) ──
  const appletConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(appletConfigPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(appletConfigPath, "utf-8"));
      if (config.client_email && config.private_key) {
        console.log("Firebase Admin: init with firebase-applet-config.json credentials...");
        return admin.initializeApp({
          credential: admin.credential.cert({
            projectId: config.project_id || config.projectId,
            clientEmail: config.client_email,
            privateKey: config.private_key.replace(/\\n/g, "\n"),
          }),
          projectId: config.project_id || config.projectId,
        });
      }
      console.warn(
        "Firebase Admin: firebase-applet-config.json has no credentials. " +
        "verifyIdToken() will fail. Add FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY."
      );
      return admin.initializeApp({
        projectId: config.projectId,
      });
    } catch (err: any) {
      console.error("Firebase Admin applet-config init failed:", err.message);
    }
  }

  throw new Error(
    "Firebase Admin could not be initialized. " +
    "Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY in your environment."
  );
}

const adminApp = initializeAdmin();

// ── Firestore Database ID ────────────────────────────────────────────────────

function getDbId(): string | null {
  // ✅ Check env var first — works on Vercel
  if (process.env.FIRESTORE_DATABASE_ID) {
    console.log("Firestore: using FIRESTORE_DATABASE_ID env var:", process.env.FIRESTORE_DATABASE_ID);
    return process.env.FIRESTORE_DATABASE_ID;
  }

  // ✅ Fallback to firebase-applet-config.json — works on AI Studio
  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      if (config?.firestoreDatabaseId) {
        console.log("Firestore: using firestoreDatabaseId from config:", config.firestoreDatabaseId);
        return config.firestoreDatabaseId;
      }
    }
  } catch {
    console.warn("Could not read firebase-applet-config.json for DB ID");
  }

  return null;
}

const dbId = getDbId();

if (dbId && dbId !== "(default)") {
  console.log("Firestore: connecting to database:", dbId);
} else {
  console.log("Firestore: connecting to (default) database");
}

export const adminDb =
  dbId && dbId !== "(default)"
    ? getFirestore(adminApp, dbId)
    : getFirestore(adminApp);

export const adminAuth = admin.auth(adminApp);
export default adminApp;