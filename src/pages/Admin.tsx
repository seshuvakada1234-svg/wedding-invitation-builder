/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { Search, Filter, ArrowUpDown, ChevronRight, Check, X, Loader2 } from "lucide-react";
import { db, auth } from "../lib/firebase";
import { collection, query, getDocs, orderBy, limit } from "firebase/firestore";
import { WeddingInvite } from "../types";

export default function Admin() {
  const [invites, setInvites] = useState<WeddingInvite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAllInvites() {
      try {
        // This will fetch all if admin, or just own if not, due to rules
        const q = query(collection(db, "invites"), orderBy("createdAt", "desc"), limit(50));
        const querySnapshot = await getDocs(q);
        const invitesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WeddingInvite));
        setInvites(invitesData);
      } catch (err) {
        console.error("Error fetching invites:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAllInvites();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-24">
        <Loader2 className="w-12 h-12 text-editorial-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 py-12 px-8 max-w-7xl mx-auto w-full">
      <div className="mb-12">
        <h1 className="text-4xl font-serif italic mb-2">Registry Control</h1>
        <p className="text-sm text-editorial-secondary">Administrative overview of all active unions.</p>
      </div>

      <div className="editorial-card overflow-hidden">
        <div className="p-4 border-b border-editorial-border bg-editorial-bg/30 flex justify-between items-center">
            <div className="relative">
                <Search className="absolute left-3 top-2 w-4 h-4 text-editorial-muted" />
                <input 
                   className="bg-white border border-editorial-border rounded-full py-1.5 pl-9 pr-4 text-xs focus:outline-none focus:border-editorial-accent w-64"
                   placeholder="Search by name or slug..."
                />
            </div>
            <div className="flex gap-4">
                <button className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-editorial-muted hover:text-editorial-ink">
                    <Filter className="w-3.5 h-3.5" />
                    Filter
                </button>
            </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-editorial-bg/10 text-[10px] uppercase font-bold tracking-widest text-editorial-muted border-b border-editorial-border">
                <th className="px-6 py-4">Union Partners</th>
                <th className="px-6 py-4">Design</th>
                <th className="px-6 py-4 text-center">Engagement</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-editorial-border">
              {invites.map((site) => (
                <tr key={site.id} className="hover:bg-editorial-bg/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-serif italic text-lg leading-none mb-1">{site.brideName} & {site.groomName}</span>
                      <span className="text-[10px] font-mono text-editorial-accent">{site.slug}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-medium text-editorial-secondary capitalize">{site.template}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-xs font-mono font-bold">{(site.views || 0).toLocaleString()} visits</span>
                  </td>
                  <td className="px-6 py-4">
                    {site.isPaid ? (
                      <div className="flex items-center gap-1.5 text-green-600 font-bold uppercase text-[9px] tracking-widest">
                        <Check className="w-3 h-3" />
                        Premium
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-amber-500 font-bold uppercase text-[9px] tracking-widest">
                        <X className="w-3 h-3" />
                        Draft
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-editorial-muted">{site.weddingDate}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 hover:bg-white rounded-full transition-all border border-transparent hover:border-editorial-border">
                      <ChevronRight className="w-4 h-4 text-editorial-secondary" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 bg-white border-t border-editorial-border flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-editorial-muted">
            <span>Showing {invites.length} active sites</span>
            <div className="flex gap-4">
                <button className="opacity-50 cursor-not-allowed">Previous</button>
                <button className="text-editorial-ink">Next</button>
            </div>
        </div>
      </div>
    </div>
  );
}
