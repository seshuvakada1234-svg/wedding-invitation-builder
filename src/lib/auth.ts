import { adminAuth } from "./firebaseAdmin";
import express from "express";

export interface AuthenticatedRequest extends express.Request {
  user?: {
    uid: string;
    email?: string;
    email_verified?: boolean;
  };
}

/**
 * Verifies the Firebase ID Token from the Authorization header.
 * Use this in your express routes.
 * Throws "UNAUTHENTICATED" error if invalid.
 */
export async function verifyUser(req: express.Request): Promise<string> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("UNAUTHENTICATED");
  }

  const token = authHeader.split("Bearer ")[1];
  if (!token) throw new Error("UNAUTHENTICATED");

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return decodedToken.uid;
  } catch (error: any) {
    console.error("Token verification failed:", error.message);
    throw new Error("UNAUTHENTICATED");
  }
}

/**
 * Decodes the token and returns the full user object if needed.
 */
export async function getDecodedUser(req: express.Request) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split("Bearer ")[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return decodedToken;
  } catch (error: any) {
    console.error("Token decoding failed:", error.message);
    return null;
  }
}
