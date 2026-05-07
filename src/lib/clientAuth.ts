// src/lib/clientAuth.ts
import { auth } from "./firebase";
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";

export const ADMIN_EMAILS = [
  "resumepro.ads@gmail.com",
  "seshuvakada1234@gmail.com",
];

export type UserRole = "admin" | "user";

export function getUserRole(email: string | null | undefined): UserRole {
  if (email && ADMIN_EMAILS.includes(email.toLowerCase())) return "admin";
  return "user";
}

export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export async function logout() {
  await signOut(auth);
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}