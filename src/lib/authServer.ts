
import { adminAuth } from "./firebaseAdmin.js";
import { isAdminUser } from "./auth.js";

export async function verifyUser(req: any): Promise<string> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("UNAUTHENTICATED");
  }
  const token = authHeader.split("Bearer ")[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return decodedToken.uid;
  } catch (error) {
    throw new Error("UNAUTHENTICATED");
  }
}

export async function verifyAdmin(req: any): Promise<string> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("UNAUTHENTICATED");
  }
  const token = authHeader.split("Bearer ")[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    if (!isAdminUser(decodedToken.email)) {
      throw new Error("UNAUTHORIZED");
    }
    return decodedToken.uid;
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      throw new Error("UNAUTHORIZED");
    }
    throw new Error("UNAUTHENTICATED");
  }
}
