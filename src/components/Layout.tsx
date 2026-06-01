/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Outlet, Link, useNavigate } from "react-router-dom";
import { 
  Heart, 
  User, 
  LogOut, 
  ChevronDown, 
  LayoutDashboard, 
  Settings, 
  CreditCard,
  Sparkles
} from "lucide-react";
import { useState } from "react";
import { logout } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "motion/react";

import { isAdminUser } from "../lib/auth";

export default function Layout() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Signed out successfully");
      setShowDropdown(false);
      navigate("/");
    } catch (error: any) {
      toast.error("Error signing out");
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Navigation */}
      <nav className="h-20 bg-editorial-bg/80 backdrop-blur-xl border-b border-editorial-border/50 z-50 sticky top-0 transition-all duration-500">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 h-full flex items-center justify-between w-full">
          <div className="flex items-center gap-16">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-full bg-editorial-ink flex items-center justify-center text-white shadow-2xl group-hover:scale-110 transition-transform duration-700">
                <Heart className="w-5 h-5 fill-white group-hover:fill-editorial-accent transition-colors" />
              </div>
              <span className="font-serif italic text-2xl lg:text-3xl tracking-tighter text-editorial-ink">Wedding Invitation</span>
            </Link>
            
            <div className="hidden lg:flex gap-10 text-[11px] font-bold uppercase tracking-[0.2em] text-editorial-secondary">
              <Link to="/templates" className="hover:text-editorial-ink transition-colors hover:translate-y-[-1px] transform duration-300">Luxury Templates</Link>
              <Link to="/pricing" className="hover:text-editorial-ink transition-colors hover:translate-y-[-1px] transform duration-300">Pricing</Link>
              {user && (
                <>
                  <Link to="/dashboard" className="hover:text-editorial-ink transition-colors hover:translate-y-[-1px] transform duration-300">Dashboard</Link>
                  {isAdminUser(user?.email) && (
                    <Link to="/admin" className="hover:text-editorial-ink transition-colors text-editorial-muted/70 hover:text-editorial-ink">Admin</Link>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6">
            {user ? (
              <div className="relative">
                <button 
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-3 p-1.5 pl-4 rounded-full border border-editorial-border hover:border-editorial-accent bg-white transition-all shadow-sm hover:shadow-md group"
                >
                  <div className="text-right hidden sm:block">
                    <div className="text-[10px] font-bold text-editorial-ink leading-tight">{user.displayName || 'Member'}</div>
                    <div className="text-[9px] text-editorial-muted leading-tight">{user.email}</div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-editorial-bg border border-editorial-border overflow-hidden group-hover:border-editorial-accent transition-colors">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-5 h-5 text-editorial-secondary" />
                      </div>
                    )}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-editorial-muted transition-transform duration-300 ${showDropdown ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {showDropdown && (
                    <>
                      <div className="fixed inset-0 z-0" onClick={() => setShowDropdown(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-editorial-border overflow-hidden z-10"
                      >
                        <div className="p-4 bg-editorial-bg/30 border-b border-editorial-border">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full overflow-hidden border border-white shadow-sm flex items-center justify-center bg-editorial-bg">
                                {user.photoURL ? (
                                  <img src={user.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                  <User className="w-5 h-5 text-editorial-secondary" />
                                )}
                              </div>
                              <div>
                                <div className="text-xs font-bold text-editorial-ink">{user.displayName}</div>
                                <div className="text-[9px] text-editorial-muted truncate max-w-[120px]">{user.email}</div>
                              </div>
                           </div>
                        </div>

                        <div className="p-2">
                          <button 
                            onClick={() => { navigate('/dashboard'); setShowDropdown(false); }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-editorial-secondary hover:text-editorial-ink hover:bg-editorial-bg rounded-xl transition-all group"
                          >
                            <LayoutDashboard className="w-4 h-4 text-editorial-muted group-hover:text-editorial-accent transition-colors" />
                            My Invitations
                          </button>
                          <button 
                            onClick={() => { navigate('/templates'); setShowDropdown(false); }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-editorial-secondary hover:text-editorial-ink hover:bg-editorial-bg rounded-xl transition-all group"
                          >
                            <Sparkles className="w-4 h-4 text-editorial-muted group-hover:text-editorial-accent transition-colors" />
                            Templates
                          </button>
                          <button 
                            className="w-full flex items-center gap-3 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-editorial-secondary hover:text-editorial-ink hover:bg-editorial-bg rounded-xl transition-all group"
                          >
                            <CreditCard className="w-4 h-4 text-editorial-muted group-hover:text-editorial-accent transition-colors" />
                            Billing
                          </button>
                          <hr className="my-2 border-editorial-border/50 mx-4" />
                          <button 
                            onClick={() => { navigate('/dashboard'); setShowDropdown(false); }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-editorial-secondary hover:text-editorial-ink hover:bg-editorial-bg rounded-xl transition-all group"
                          >
                            <Settings className="w-4 h-4 text-editorial-muted group-hover:text-editorial-accent transition-colors" />
                            Settings
                          </button>
                          <button 
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-red-500 hover:bg-red-50 rounded-xl transition-all group mt-1"
                          >
                            <LogOut className="w-4 h-4" />
                            Logout
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ) : !loading && (
              <button 
                onClick={() => navigate('/login')}
                className="px-8 py-3 bg-editorial-ink text-white text-[11px] font-bold uppercase tracking-[0.2em] rounded-full transition-all hover:bg-black active:scale-95 shadow-lg hover:shadow-xl"
              >
                Sign In
              </button>
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
