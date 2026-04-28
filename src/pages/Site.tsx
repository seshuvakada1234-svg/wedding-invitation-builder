/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Heart, Calendar, MapPin, Clock, Camera, MessageSquare, Gift, AlertCircle, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { db } from "../lib/firebase";
import { doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { WeddingInvite } from "../types";
import { getTemplateById } from "../templates";

export default function Site() {
  const { slug } = useParams();
  const [data, setData] = useState<WeddingInvite | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!slug) return;
      try {
        const docRef = doc(db, "invites", slug);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const inviteData = docSnap.data() as WeddingInvite;
          setData(inviteData);
          
          // Increment views
          await updateDoc(docRef, {
            views: increment(1)
          });
        } else {
          setError(true);
        }
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-editorial-bg flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-editorial-accent animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-editorial-bg flex flex-col items-center justify-center p-8 text-center">
        <h1 className="text-4xl font-serif italic mb-4">404 — Not Found</h1>
        <p className="text-editorial-secondary mb-8">This digital union has moved or does not exist.</p>
        <Link to="/" className="editorial-button">Explore Templates</Link>
      </div>
    );
  }

  const isLimitReached = data.views >= data.viewLimit;

  if (isLimitReached) {
    return (
      <div className="min-h-screen bg-editorial-bg flex items-center justify-center p-8 text-center">
        <div className="max-w-md space-y-6">
          <div className="w-16 h-16 bg-white border border-editorial-border rounded-full flex items-center justify-center mx-auto mb-8">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-4xl font-serif italic mb-4">View Limit Reached</h1>
          <p className="text-editorial-secondary leading-relaxed">
            This digital invitation has exceeded its current viewing limit. 
            If you are the owner, please upgrade your plan to restore access.
          </p>
          <div className="pt-8">
            <Link to="/dashboard" className="editorial-button">
              Upgrade Subscription
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const templateId = data.template || 'minimal';
  const templateConfig = getTemplateById(templateId as any);

  // Update document title for SEO
  useEffect(() => {
    if (data) {
      const title = `${data.groomName} & ${data.brideName}'s Wedding Invitation`;
      document.title = title;
      
      // Update meta tags for social sharing
      const setMeta = (property: string, content: string) => {
        let el = document.querySelector(`meta[property="${property}"]`);
        if (!el) {
          el = document.createElement('meta');
          el.setAttribute('property', property);
          document.head.appendChild(el);
        }
        el.setAttribute('content', content);
      };

      setMeta('og:title', title);
      setMeta('og:description', `You are cordially invited to the wedding of ${data.groomName} and ${data.brideName} on ${data.weddingDate}.`);
      if (data.coverImage) {
        setMeta('og:image', data.coverImage);
      }
      setMeta('og:type', 'website');
    }
  }, [data]);

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {/* Watermark Overlay (Unpaid State) */}
      {!data.isPaid && (
        <div className="fixed inset-0 bg-editorial-ink/[0.03] backdrop-blur-[0.5px] pointer-events-none z-[100] flex items-center justify-center">
          <div className="rotate-[-25deg] border-[10px] border-editorial-ink/10 text-editorial-ink/5 p-12 text-center">
             <div className="text-8xl md:text-[12rem] font-black uppercase tracking-[0.2em] select-none">
                PREVIEW ONLY
             </div>
             <div className="text-xl md:text-4xl mt-4 font-sans tracking-widest font-black">
                NOT FOR DISTRIBUTION — ACTIVATE AT UNION.COM
             </div>
          </div>
        </div>
      )}

      {templateConfig?.component ? (
        <templateConfig.component 
          brideName={data.brideName || ""}
          groomName={data.groomName || ""}
          date={data.weddingDate || ""}
          venue={data.location || ""}
          googleMapsLink={data.googleMapsLink}
          coverImage={data.coverImage}
          events={data.events || []}
          galleryImages={data.galleryImages || []}
        />
      ) : (
        <div className="p-20 text-center">Template Support Error</div>
      )}
    </div>
  );
}
