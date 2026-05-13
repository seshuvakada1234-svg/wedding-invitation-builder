/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Outlet, Link, useNavigate } from "react-router-dom";
import { Heart, User, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { auth, logout } from "../lib/firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import toast from "react-hot-toast";

import { isAdminUser } from "../lib/auth";

export default function Layout() {
  const navigate = useNavigate();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Signed out successfully");
      navigate("/");
    } catch (error: any) {
      toast.error("Error signing out");
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Navigation */}
      <nav className="h-16 border-b border-editorial-border bg-white z-50 sticky top-0">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between w-full">
          <div className="flex items-center gap-12">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-8 h-8 rounded-full bg-editorial-accent flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-500">
                <Heart className="w-4 h-4 fill-white" />
              </div>
              <span className="font-serif italic text-2xl tracking-tighter text-editorial-ink">Wedding Invitation</span>
            </Link>
            
            <div className="hidden md:flex gap-8 text-sm font-medium text-editorial-secondary">
              <Link to="/templates" className="hover:text-editorial-ink transition-colors">Luxury Templates</Link>
              <Link to="/pricing" className="hover:text-editorial-ink transition-colors">Pricing</Link>
              {user && (
                <>
                  <Link to="/dashboard" className="hover:text-editorial-ink transition-colors">Dashboard</Link>
                  {isAdminUser(user?.email) && (
                    <Link to="/admin" className="hover:text-editorial-ink transition-colors text-editorial-muted/70 hover:text-editorial-ink">Admin</Link>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-[10px] text-editorial-muted font-mono uppercase tracking-wider hidden sm:block">
                  Member Access
                </span>
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="w-8 h-8 rounded-full bg-editorial-bg flex items-center justify-center border border-editorial-border hover:border-editorial-accent transition-colors"
                  title="Dashboard"
                >
                  <User className="w-4 h-4 text-editorial-secondary" />
                </button>
                <button 
                  onClick={handleLogout}
                  className="p-2 text-editorial-secondary hover:text-editorial-accent transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : !loading && (
              <Link to="/login" className="editorial-button">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col bg-editorial-bg">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="py-20 border-t border-editorial-border bg-white text-center">
        <div className="max-w-7xl mx-auto px-8">
          <p className="font-serif italic text-2xl mb-6 text-editorial-ink">Wedding Invitation — The World's Most Premium Invitation Suite</p>
          <p className="text-[10px] uppercase tracking-[0.3em] text-editorial-muted mb-12 max-w-2xl mx-auto leading-relaxed">
            Crafting cinematic digital experiences for modern love stories. Designed for luxury, powered by AI.
          </p>
          <div className="text-[10px] uppercase tracking-[0.2em] text-editorial-muted flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
            <span className="font-bold text-editorial-accent uppercase">Wedding Invitation</span>
            <Link to="/templates" className="hover:text-editorial-ink transition-colors">Templates</Link>
            <Link to="/pricing" className="hover:text-editorial-ink transition-colors">Pricing</Link>
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Support</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
