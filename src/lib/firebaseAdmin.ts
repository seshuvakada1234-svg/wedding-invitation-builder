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

  const projectId = clean(process.env.FIREBASE_PROJECT_ID);
  const clientEmail = clean(process.env.FIREBASE_CLIENT_EMAIL);
  const privateKey = clean(process.env.FIREBASE_PRIVATE_KEY);

  // ── Path 1: Full service account from env vars (production) ──
  if (projectId && clientEmail && privateKey) {
    const formattedKey = privateKey.replace(/\\n/g, "\n");
    try {
      console.log("Firebase Admin: initializing with service account env vars...");
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
      // fall through to next path
    }
  }

  // ── Path 2: Service account JSON file (local dev) ──
  const serviceAccountPath = path.join(process.cwd(), "service-account.json");
  if (fs.existsSync(serviceAccountPath)) {
    try {
      console.log("Firebase Admin: initializing with service-account.json...");
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));
      return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id,
      });
    } catch (err: any) {
      console.error("Firebase Admin service-account.json init failed:", err.message);
    }
  }

  // ── Path 3: firebase-applet-config.json — READ credentials from it ──
  const appletConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(appletConfigPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(appletConfigPath, "utf-8"));

      // If applet config has full service account fields, use them
      if (config.client_email && config.private_key) {
        console.log("Firebase Admin: initializing with firebase-applet-config.json credentials...");
        return admin.initializeApp({
          credential: admin.credential.cert({
            projectId: config.project_id || config.projectId,
            clientEmail: config.client_email,
            privateKey: config.private_key.replace(/\\n/g, "\n"),
          }),
          projectId: config.project_id || config.projectId,
        });
      }

      // ⚠️ projectId-only fallback — token verification will NOT work
      // Only safe for Firestore reads in Firebase Studio emulator context
      console.warn(
        "Firebase Admin: firebase-applet-config.json has no credentials. " +
        "Token verification (adminAuth.verifyIdToken) will fail. " +
        "Add FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY to your .env"
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

// ── Firestore ────────────────────────────────────────────────────────────────

function getDbId(): string | null {
  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      return config?.firestoreDatabaseId || null;
    }
  } catch {
    console.warn("Could not read firebase-applet-config.json for DB ID");
  }
  return null;
}

const dbId = getDbId();

if (dbId && dbId !== "(default)") {
  console.log("Firestore: using database ID:", dbId);
} else {
  console.log("Firestore: using default database");
}

export const adminDb =
  dbId && dbId !== "(default)"
    ? getFirestore(adminApp, dbId)
    : getFirestore(adminApp);

export const adminAuth = admin.auth(adminApp);
export default adminApp;