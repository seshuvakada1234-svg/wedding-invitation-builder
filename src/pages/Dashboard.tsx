/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Plus, 
  ExternalLink, 
  BarChart3, 
  Settings, 
  Mail, 
  Clock,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  Loader2,
  TrendingUp,
  X,
  Check,
  Rocket,
  Eye,
  Calendar,
  Layers,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { authFetch } from "../lib/firebase";
import { WeddingInvite } from "../types";
import toast from "react-hot-toast";
import SEO from "../components/SEO";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sites, setSites] = useState<WeddingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessingTopUp, setIsProcessingTopUp] = useState(false);
  const [selectedSiteForTopUp, setSelectedSiteForTopUp] = useState<WeddingInvite | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  const stats = useMemo(() => {
    const totalViews = sites.reduce((acc, site) => acc + (Number(site.viewsUsed || site.views) || 0), 0);
    const liveInvitations = sites.filter(s => s.status === 'live' || s.published === true).length;
    const drafts = sites.filter(s => s.status !== 'live' && s.published !== true).length;
    return { totalViews, liveInvitations, drafts };
  }, [sites]);

  async function fetchUserProfile() {
    if (!user) return;
    try {
      const res = await authFetch(`/api/user-status?userId=${user.uid}`);
      const data = await res.json();
      if (data.success) {
        setUserProfile(data);
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
    }
  }

  async function fetchSites() {
    if (!user) return;
    try {
      const res = await authFetch("/api/get-invites");
      const data = await res.json();
      if (data.success) {
        setSites(data.invites || []);
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) {
      fetchSites();
      fetchUserProfile();
    } else if (!loading) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  const handleTopUp = async (site: WeddingInvite) => {
    if (!user || isProcessingTopUp) return;
    setIsProcessingTopUp(true);

    try {
      const configRes = await fetch("/api/config");
      const configData = await configRes.json();
      const razorpayKeyId = configData.razorpayKeyId;

      if (!razorpayKeyId) throw new Error("Razorpay key not found");

      const token = await user.getIdToken();
      
      const orderRes = await fetch("/api/create-topup-order", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ inviteId: site.id || site.slug })
      });
      const orderData = await orderRes.json();

      if (!orderData.success) throw new Error(orderData.error || "Order failed");

      const options = {
        key: razorpayKeyId,
        amount: orderData.amount,
        currency: "INR",
        name: "Wedding Invitation",
        description: "Add 1000 Guest Views",
        order_id: orderData.order.id,
        handler: async function(response: any) {
          try {
            const verifyRes = await fetch("/api/verify-topup-payment", {
              method: "POST",
              headers: { 
                "Authorization": `Bearer ${token}`, 
                "Content-Type": "application/json" 
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                inviteId: site.id || site.slug,
              })
            });
            const verifyData = await verifyRes.json();
            
            if (verifyData.success) {
              toast.success("Views added successfully!");
              setSelectedSiteForTopUp(null);
              fetchSites(); // Refresh
            } else {
              toast.error("Verification failed.");
            }
          } catch (err) {
            console.error(err);
            toast.error("An error occurred during verification.");
          } finally {
            setIsProcessingTopUp(false);
          }
        },
        prefill: {
          email: user?.email || "",
          name: user?.displayName || "",
        },
        theme: { color: "#C8A96B" }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Top-up failed");
      setIsProcessingTopUp(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-editorial-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 py-12 px-6 lg:px-8 max-w-7xl mx-auto w-full">
      <SEO title="User Dashboard" description="Manage your luxury cinematic wedding invitations, track RSVPs, and monitor guest views." />
      
      {/* Welcome Section */}
      <div className="mb-12">
         <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-end justify-between gap-6"
         >
            <div>
               <h1 className="text-4xl md:text-5xl font-serif italic mb-2">
                 Welcome back, {user?.displayName?.split(' ')[0] || 'Member'} 👋
               </h1>
               <p className="text-editorial-secondary font-medium tracking-wide">
                 Manage your luxury cinematic wedding invitations.
               </p>
            </div>
            <button 
              onClick={() => navigate('/templates')}
              className="editorial-button flex items-center justify-center gap-2 py-4 px-8 shadow-xl hover:shadow-2xl active:scale-95 transition-all"
            >
              <Plus className="w-5 h-5" />
              <span>Create New Invitation</span>
            </button>
         </motion.div>
      </div>

      {/* Paywall Alerts */}
      {sites.some(s => (s.viewsUsed || 0) >= (s.viewsLimit || 500)) && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 p-6 bg-red-50 border border-red-100 rounded-[32px] flex flex-col md:flex-row items-center justify-between gap-6"
        >
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center">
                 <Rocket className="w-6 h-6 text-red-600" />
              </div>
              <div>
                 <h3 className="font-serif italic text-xl text-red-900">View Limit Reached</h3>
                 <p className="text-xs text-red-700">One or more of your invitations are hidden because they exceeded the guest view limit.</p>
              </div>
           </div>
           <button 
             onClick={() => {
               const exceeded = sites.find(s => (s.viewsUsed || 0) >= (s.viewsLimit || 500));
               if (exceeded) handleTopUp(exceeded);
             }}
             className="px-6 py-3 bg-red-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg"
           >
              Top Up Now
           </button>
        </motion.div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
         {[
           { label: "Total Invitations", value: sites.length, icon: Layers, color: "text-blue-600", bg: "bg-blue-50" },
           { label: "Guest Views", value: stats.totalViews.toLocaleString(), icon: Eye, color: "text-purple-600", bg: "bg-purple-50" },
           { label: "Active Live", value: stats.liveInvitations, icon: Calendar, color: "text-green-600", bg: "bg-green-50" },
           { label: "Purchased", value: Object.keys(userProfile?.paidTemplates || {}).length, icon: Sparkles, color: "text-editorial-accent", bg: "bg-yellow-50" }
         ].map((stat, i) => (
           <motion.div
             key={stat.label}
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: i * 0.1 }}
             className="editorial-card p-6 bg-white border border-editorial-border/60 shadow-sm"
           >
              <div className="flex items-center gap-4">
                 <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                    <stat.icon className="w-6 h-6" />
                 </div>
                 <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-editorial-muted">{stat.label}</div>
                    <div className="text-2xl font-serif font-bold text-editorial-ink tracking-tight">{stat.value}</div>
                 </div>
              </div>
           </motion.div>
         ))}
      </div>

      <div className="flex items-center justify-between mb-8 border-b border-editorial-border pb-4">
          <h2 className="text-xl font-serif italic text-editorial-ink">Your Invitations</h2>
          <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-editorial-muted">
            <span>{stats.liveInvitations} Live</span>
            <span>•</span>
            <span>{stats.drafts} Drafts</span>
          </div>
      </div>

      <div className="grid gap-6">
        {sites.length === 0 ? (
          <div className="editorial-card p-20 text-center bg-white">
            <h3 className="font-serif italic text-2xl mb-4 text-editorial-muted">No stories started yet.</h3>
            <button 
              onClick={() => navigate('/')}
              className="editorial-button"
            >
              Choose a Template
            </button>
          </div>
        ) : sites.map((site, i) => {
          const views = Number(site.views || 0);
          const limit = Number(site.viewLimit || site.freeViews || 500);
          const viewPercent = Math.min((views / limit) * 100, 100);
          const isWarning = viewPercent > 80;
          const isLimited = views >= limit;

          let coverUrl = "";
          if (typeof site.coverImage === "string") {
            coverUrl = site.coverImage;
          } else if (site.coverImage && typeof site.coverImage === "object") {
            coverUrl = site.coverImage.url;
          }

          return (
            <motion.div
              key={site.id || site.slug}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="editorial-card p-6 flex flex-col md:flex-row items-center gap-8 group"
            >
              {/* Preview Thumbnail */}
              <div className="w-32 h-32 bg-editorial-bg rounded-lg border border-editorial-border shrink-0 flex items-center justify-center overflow-hidden group-hover:border-editorial-accent transition-colors relative">
                {coverUrl ? (
                  <img src={coverUrl} alt="Cover" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                ) : (
                  <div className="text-center">
                    <span className="block text-2xl font-serif italic text-editorial-muted">
                        {site.brideName?.[0] || 'E'}&{site.groomName?.[0] || 'M'}
                    </span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                  <h3 className="font-serif italic text-2xl">{site.brideName} & {site.groomName}</h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${(site.status === 'live' || site.published === true) ? 'bg-green-100 text-green-700' : 'bg-editorial-bg text-editorial-muted border border-editorial-border/60'}`}>
                    {(site.status === 'live' || site.published === true) ? 'Live' : 'Draft'}
                  </span>
                  {(site.status === 'live' || site.published === true) && site.hasUnpublishedChanges && (
                    <motion.span 
                      initial={{ opacity: 0.5 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
                      className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-editorial-accent/10 text-editorial-accent border border-editorial-accent/20"
                    >
                      Changes Pending
                    </motion.span>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-6 text-xs text-editorial-secondary font-medium">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-editorial-muted" />
                    <span>Ceremony: {site.weddingDate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-editorial-muted" />
                    <a 
                      href={`/story/${site.id || site.slug}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="font-mono text-editorial-accent hover:underline lowercase"
                    >
                      /story/{site.id || site.slug}
                    </a>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full max-w-sm">
                   <div className="flex justify-between items-center mb-1.5 text-[10px] font-bold uppercase tracking-wider">
                      <span className="text-editorial-muted">Guest Views</span>
                      <span className={isWarning ? 'text-red-500 font-bold' : 'text-editorial-ink'}>
                        {(site.viewsUsed || site.views || 0)} / {limit}
                      </span>
                   </div>
                   <div className="h-1.5 bg-editorial-border rounded-full overflow-hidden">
                      <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: `${viewPercent}%` }}
                         className={`h-full ${isWarning ? 'bg-red-400' : 'bg-editorial-accent'}`} 
                      />
                   </div>
                   {(isWarning || isLimited) && (
                     <div className="mt-2 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-red-500 text-[10px] font-bold uppercase tracking-tighter">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>{isLimited ? 'View limit reached' : 'Views almost exhausted'}</span>
                        </div>
                        <button 
                          onClick={() => setSelectedSiteForTopUp(site)}
                          className="text-[9px] font-bold uppercase tracking-widest text-editorial-accent hover:underline"
                        >
                          Add Views +
                        </button>
                     </div>
                   )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button className="p-3 text-editorial-secondary hover:text-editorial-ink hover:bg-editorial-bg rounded-full transition-colors">
                  <BarChart3 className="w-5 h-5" />
                </button>
                <button 
                   onClick={() => navigate(`/builder/edit/${site.id || site.slug}`)}
                  className="editorial-button py-2 px-6"
                >
                  Edit
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Top Up Modal ── */}
      <AnimatePresence>
        {selectedSiteForTopUp && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isProcessingTopUp && setSelectedSiteForTopUp(null)}
              className="absolute inset-0 bg-editorial-ink/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-sm rounded-3xl shadow-2xl relative overflow-hidden p-8"
            >
              <button 
                onClick={() => setSelectedSiteForTopUp(null)}
                disabled={isProcessingTopUp}
                className="absolute top-6 right-6 p-2 hover:bg-neutral-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-editorial-muted" />
              </button>

              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-editorial-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <TrendingUp className="w-8 h-8 text-editorial-accent" />
                </div>
                <h2 className="text-2xl font-serif italic mb-2">Guest Views Limit</h2>
                <p className="text-xs text-editorial-muted">
                  Your invitation has used {selectedSiteForTopUp.viewsUsed || selectedSiteForTopUp.views || 0} of {selectedSiteForTopUp.viewsLimit || selectedSiteForTopUp.viewLimit || selectedSiteForTopUp.freeViews || 500} views.
                </p>
                <div className="mt-6 p-4 bg-editorial-bg rounded-2xl border border-editorial-border">
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-3xl font-serif font-bold">₹99</span>
                    <span className="text-xs uppercase font-bold text-editorial-muted">For 1000 Extra Views</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-xs font-medium text-editorial-secondary">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>Instant activation</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-medium text-editorial-secondary">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>Works for all guests</span>
                  </div>
                </div>
                <button
                  onClick={() => handleTopUp(selectedSiteForTopUp)}
                  disabled={isProcessingTopUp}
                  className="w-full bg-editorial-ink text-white py-4 rounded-2xl text-[11px] font-bold uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all flex items-center justify-center gap-2"
                >
                  {isProcessingTopUp ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  {isProcessingTopUp ? "Processing..." : `PAY ₹99 FOR 1000 MORE VIEWS`}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}