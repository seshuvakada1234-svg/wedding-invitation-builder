/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { motion } from "motion/react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../lib/firebase"; // adjust path as needed
import { getUserRole } from "../lib/clientAuth";
import toast from "react-hot-toast";
import SEO from "../components/SEO";

export default function Login() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Auto-create user document in Firestore on first login
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          name: user.displayName ?? "",
          email: user.email ?? "",
          photoURL: user.photoURL ?? "",
          createdAt: serverTimestamp(),
        });
      }

      toast.success("Welcome back!");

      // Role-based redirect
      const role = getUserRole(user.email ?? "");
      navigate(role === "admin" ? "/admin" : "/dashboard");

    } catch (error: any) {
      if (
        error.code === "auth/cancelled-popup-request" ||
        error.code === "auth/popup-closed-by-user"
      ) {
        toast.error("Sign-in cancelled.");
      } else {
        console.error("Auth error:", error.code, error.message);
        toast.error(error.message || "Google sign-in failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-8 bg-editorial-bg">
      <SEO
        title="Member Login"
        description="Sign in to your Wedding Invitation dashboard to manage your cinematic invitations."
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md"
      >
        <div className="editorial-card p-14 bg-white shadow-xl text-center">

          {/* Icon + Heading */}
          <div className="flex flex-col items-center mb-12">
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
              className="w-16 h-16 bg-editorial-bg rounded-full flex items-center justify-center mb-7"
            >
              <Heart className="w-8 h-8 text-editorial-accent fill-editorial-accent" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.45 }}
              className="text-4xl font-serif italic mb-2"
            >
              Welcome Back
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.45 }}
              className="text-[10px] uppercase font-bold tracking-[0.2em] text-editorial-muted"
            >
              Enter your cinematic story
            </motion.p>
          </div>

          {/* Google Sign-In Button */}
          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.45 }}
            onClick={handleGoogleLogin}
            disabled={isLoading}
            whileHover={{ scale: isLoading ? 1 : 1.02 }}
            whileTap={{ scale: isLoading ? 1 : 0.98 }}
            className={`
              w-full py-5 px-6
              bg-white
              border border-[#d4b896]
              rounded-2xl
              flex items-center justify-center gap-3
              text-[11px] font-bold uppercase tracking-[0.22em]
              text-editorial-ink
              shadow-[0_2px_16px_0_rgba(180,140,90,0.10)]
              hover:shadow-[0_4px_24px_0_rgba(180,140,90,0.18)]
              hover:bg-[#fdf8f3]
              transition-all duration-300
              ${isLoading ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
            `}
          >
            {isLoading ? (
              /* Spinner */
              <svg
                className="w-5 h-5 animate-spin text-editorial-muted"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            ) : (
              <img
                src="https://www.google.com/favicon.ico"
                alt="Google"
                className="w-5 h-5"
              />
            )}
            <span>{isLoading ? "Connecting…" : "Continue with Google"}</span>
          </motion.button>

          {/* Footer Link */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="mt-10 text-xs text-editorial-muted"
          >
            First time here?{" "}
            <Link to="/" className="text-editorial-ink font-bold hover:underline">
              Explore Templates
            </Link>
          </motion.p>
        </div>

        {/* Footer badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.4 }}
          className="mt-8 text-center text-[10px] uppercase tracking-widest text-editorial-muted font-bold"
        >
          Secured with Firebase & Google
        </motion.div>
      </motion.div>
    </div>
  );
}