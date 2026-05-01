/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Heart, ArrowRight, Github } from "lucide-react";
import { motion } from "motion/react";
import { loginWithGoogle } from "../lib/firebase";
import toast from "react-hot-toast";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // In a real app, use signInWithEmailAndPassword
      // For this SaaS demo, we simulate success
      await new Promise(resolve => setTimeout(resolve, 800));
      toast.success("Welcome back!");
      navigate('/dashboard');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await loginWithGoogle();
      toast.success("Signed in with Google");
      navigate('/dashboard');
    } catch (error: any) {
      if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
        toast.error("Sign-in cancelled or popup closed.");
      } else {
        console.error("Auth error:", error.code, error.message);
        toast.error(error.message || "Google login failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-8 bg-editorial-bg">

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="editorial-card p-12 bg-white shadow-xl text-center">
            <div className="flex flex-col items-center mb-10">
                <div className="w-16 h-16 bg-editorial-bg rounded-full flex items-center justify-center mb-6">
                    <Heart className="w-8 h-8 text-editorial-accent fill-editorial-accent" />
                </div>
                <h1 className="text-4xl font-serif italic mb-2">Welcome Back</h1>
                <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-editorial-muted">Continue your journey</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6 text-left">
                <div>
                   <label className="editorial-label">Email Address</label>
                   <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="editorial-input"
                      placeholder="you@example.com"
                      required
                   />
                </div>
                <div>
                   <label className="editorial-label">Password</label>
                   <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="editorial-input"
                      placeholder="••••••••"
                      required
                   />
                </div>

                <div className="pt-4">
                  <button type="submit" className="w-full editorial-button flex items-center justify-center gap-2">
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
            </form>

            <div className="mt-8 pt-8 border-t border-editorial-border">
                <div className="text-[10px] uppercase font-bold tracking-widest text-editorial-muted mb-6">Or Sign in with</div>
                <div className="flex gap-4">
                    <button className="flex-1 py-2.5 border border-editorial-border rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-editorial-bg transition-all">
                        <Github className="w-4 h-4" />
                        GitHub
                    </button>
                    <button 
                         onClick={handleGoogleLogin}
                         disabled={isLoading}
                         className={`flex-1 py-2.5 border border-editorial-border rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-editorial-bg transition-all text-editorial-ink ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                         <img src="https://www.google.com/favicon.ico" className="w-4 h-4" />
                        {isLoading ? 'Connecting...' : 'Google'}
                    </button>
                </div>
            </div>

            <p className="mt-8 text-xs text-editorial-muted">
                First time here? <Link to="/" className="text-editorial-ink font-bold hover:underline">Explore Templates</Link>
            </p>
        </div>
        
        <div className="mt-8 text-center text-[10px] uppercase tracking-widest text-editorial-muted font-bold">
            Locked & Secured with Firebase
        </div>
      </motion.div>
    </div>
  );
}
