/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
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
  Loader2
} from "lucide-react";
import { motion } from "motion/react";
import { db, auth } from "../lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { WeddingInvite } from "../types";

export default function Dashboard() {
  const navigate = useNavigate();
  const [sites, setSites] = useState<WeddingInvite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSites() {
      if (!auth.currentUser) {
        navigate('/login');
        return;
      }
      try {
        const q = query(
          collection(db, "invites"), 
          where("userId", "==", auth.currentUser.uid),
          orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        const sitesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WeddingInvite));
        setSites(sitesData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchSites();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-editorial-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 py-12 px-6 lg:px-8 max-w-6xl mx-auto w-full">
      <div className="flex justify-between items-end mb-12">
        <div>
          <h1 className="text-4xl font-serif italic mb-2">Your Unions</h1>
          <p className="text-sm text-editorial-secondary">Manage and track your wedding invitation sites.</p>
        </div>
        <button 
          onClick={() => navigate('/')}
          className="editorial-button flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Site</span>
        </button>
      </div>

      <div className="grid gap-6">
        {sites.length === 0 ? (
          <div className="editorial-card p-20 text-center bg-white">
            <h3 className="font-serif italic text-2xl mb-4 text-editorial-muted">No unions started yet.</h3>
            <button 
              onClick={() => navigate('/')}
              className="editorial-button"
            >
              Choose a Template
            </button>
          </div>
        ) : sites.map((site, i) => {
          const viewPercent = (site.views / site.viewLimit) * 100;
          const isWarning = viewPercent > 80;

          return (
            <motion.div
              key={site.slug}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="editorial-card p-6 flex flex-col md:flex-row items-center gap-8 group"
            >
              {/* Preview Thumbnail */}
              <div className="w-32 h-32 bg-editorial-bg rounded-lg border border-editorial-border shrink-0 flex items-center justify-center overflow-hidden group-hover:border-editorial-accent transition-colors relative">
                {site.coverImage ? (
                  <img src={site.coverImage} alt="Cover" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
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
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${site.isPaid ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {site.isPaid ? 'Live' : 'Draft'}
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-6 text-xs text-editorial-secondary font-medium">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-editorial-muted" />
                    <span>Ceremony: {site.weddingDate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-editorial-muted" />
                    <span className="font-mono text-editorial-accent">union.com/site/{site.slug}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full max-w-sm">
                   <div className="flex justify-between items-center mb-1.5 text-[10px] font-bold uppercase tracking-wider">
                      <span className="text-editorial-muted">Guest Views</span>
                      <span className={isWarning ? 'text-red-500' : 'text-editorial-ink'}>
                        {site.views} / {site.viewLimit}
                      </span>
                   </div>
                   <div className="h-1.5 bg-editorial-border rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${viewPercent}%` }}
                        className={`h-full ${isWarning ? 'bg-red-400' : 'bg-editorial-accent'}`} 
                      />
                   </div>
                   {isWarning && (
                     <div className="mt-2 flex items-center gap-2 text-red-500 text-[10px] font-bold">
                        <AlertCircle className="w-3 h-3" />
                        <span>Viewing limit almost reached. Upgrade required soon.</span>
                     </div>
                   )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button className="p-3 text-editorial-secondary hover:text-editorial-ink hover:bg-editorial-bg rounded-full transition-colors">
                  <BarChart3 className="w-5 h-5" />
                </button>
                <button className="p-3 text-editorial-secondary hover:text-editorial-ink hover:bg-editorial-bg rounded-full transition-colors">
                  <Settings className="w-5 h-5" />
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
    </div>
  );
}
