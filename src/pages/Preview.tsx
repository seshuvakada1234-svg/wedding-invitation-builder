/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, CreditCard, ExternalLink, ShieldCheck, ArrowRight, Share2, Eye, Sparkles, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { db, handleFirestoreError } from "../lib/firebase";
import { doc, updateDoc } from "firebase/firestore";

export default function Preview() {
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [isPaying, setIsPaying] = useState(false);
  const invite = location.state?.invite;

  const handlePayment = async () => {
    if (!slug) return;
    setIsPaying(true);
    try {
      // Mock payment delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const docRef = doc(db, "invites", slug);
      await updateDoc(docRef, {
        isPaid: true
      });
      
      navigate('/dashboard');
    } catch (error) {
      handleFirestoreError(error, 'update', 'invites');
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className="flex-1 py-12 px-8 max-w-5xl mx-auto w-full">
      <div className="flex flex-col md:flex-row gap-12">
        {/* Left: Status & Actions */}
        <div className="flex-1 space-y-8">
          <div>
            <div className="flex items-center gap-3 text-editorial-accent mb-4">
              <ShieldCheck className="w-6 h-6" />
              <span className="text-[11px] font-bold uppercase tracking-[0.3em]">Ready for Launch</span>
            </div>
            <h1 className="text-5xl font-serif italic mb-6 leading-tight">
              Your union <br /> is almost live.
            </h1>
            <p className="text-editorial-secondary leading-relaxed">
              Your website for <span className="font-bold text-editorial-ink">"{slug}"</span> has been successfully drafted. 
              Review the details and complete the setup to remove the watermark and unlock full sharing.
            </p>
          </div>

          <div className="space-y-4">
              <div className="editorial-card p-6 border-l-4 border-l-editorial-accent">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="font-serif italic text-xl">The Prime Plan</h3>
                        <p className="text-[10px] uppercase font-bold tracking-widest text-editorial-muted">Lifetime Access</p>
                    </div>
                    <span className="text-2xl font-serif text-editorial-accent">₹999</span>
                </div>
                <ul className="space-y-2 mb-6">
                    <li className="flex items-center gap-2 text-sm text-editorial-secondary">
                        <CheckCircle2 className="w-4 h-4 text-editorial-accent" />
                        <span>Remove "Draft" Watermark</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm text-editorial-secondary">
                        <CheckCircle2 className="w-4 h-4 text-editorial-accent" />
                        <span>Unlimited Gallery Uploads</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm text-editorial-secondary">
                        <CheckCircle2 className="w-4 h-4 text-editorial-accent" />
                        <span>Custom 500 Guest Views</span>
                    </li>
                </ul>
                <button 
                  onClick={handlePayment}
                  disabled={isPaying}
                  className="w-full editorial-button bg-editorial-accent hover:bg-[#B37E4A] flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isPaying ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CreditCard className="w-4 h-4" />
                  )}
                  <span>{isPaying ? 'Processing...' : 'Activate Site & Pay'}</span>
                </button>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => navigate(`/site/${slug}`)}
                  className="flex-1 bg-white border border-editorial-border py-3 rounded-full text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-editorial-bg transition-all"
                >
                  <Eye className="w-4 h-4" />
                  View Preview Site
                </button>
                <button className="w-12 h-12 flex items-center justify-center rounded-full border border-editorial-border hover:bg-white transition-all">
                  <Share2 className="w-4 h-4 text-editorial-secondary" />
                </button>
              </div>
          </div>
        </div>

        {/* Right: Summary Card */}
        <div className="md:w-[400px] shrink-0">
          <div className="editorial-card sticky top-24">
            <div className="p-8 text-center border-b border-editorial-border bg-editorial-bg/30">
               <div className="font-serif italic text-3xl mb-2">Details</div>
               <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-editorial-muted">Review your selection</p>
            </div>
            <div className="p-8 space-y-6">
               <div className="flex justify-between text-sm">
                  <span className="text-editorial-muted">Couple</span>
                  <span className="font-medium">{invite?.brideName} & {invite?.groomName}</span>
               </div>
               <div className="flex justify-between text-sm">
                  <span className="text-editorial-muted">Date</span>
                  <span className="font-medium">{invite?.weddingDate}</span>
               </div>
               <div className="flex justify-between text-sm">
                  <span className="text-editorial-muted">Template</span>
                  <span className="font-medium capitalize">{invite?.template}</span>
               </div>
               <div className="flex justify-between text-sm">
                  <span className="text-editorial-muted">URL</span>
                  <span className="font-mono text-[10px] text-editorial-accent">union.com/site/{slug}</span>
               </div>
               
               <div className="pt-6 border-t border-editorial-border">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-editorial-ink mb-2">
                    <Sparkles className="w-3 h-3" />
                    <span>Included Services</span>
                  </div>
                  <p className="text-[11px] text-editorial-secondary leading-relaxed">
                    Hosting on premium servers, SSL security, and cross-device optimization are always included.
                  </p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
