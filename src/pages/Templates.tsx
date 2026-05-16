/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { templates as staticTemplates } from "../templates";
import { Sparkles, ArrowRight, ShieldCheck, Loader2 } from "lucide-react";
import { db, auth } from "../lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  where,
  getDocs,
  limit,
} from "firebase/firestore";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import toast from "react-hot-toast";
import SEO from "../components/SEO";

export default function TemplatesPage() {
  const navigate = useNavigate();
  const [dbTemplates, setDbTemplates] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);

  // Track which template card is currently loading so we can show a spinner
  const [loadingTemplateId, setLoadingTemplateId] = useState<string | null>(null);

  // ── Listen for auth state ──────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => setCurrentUser(user));
    return () => unsub();
  }, []);

  // ── Load dynamic templates & prices from Firestore ────────────────────────
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "templates"), (snap) => {
      const tList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDbTemplates(tList);
    });
    return () => unsub();
  }, []);

  // ── Core fix: look up existing invite before navigating ───────────────────
  //
  // Priority order:
  //   1. User already has a PUBLISHED invite for this template  → /builder/edit/{id}
  //   2. User already has a DRAFT invite for this template      → /builder/edit/{id}
  //   3. No existing invite                                     → /builder?template={id}
  //
  // This mirrors Canva/Wix behaviour: clicking a template always reopens your
  // existing project for that template instead of creating a blank new one.
  const handleTemplateClick = useCallback(
    async (templateId: string) => {
      // If not logged in, go straight to new session — login will be prompted
      // inside Builder when the user tries to save/publish.
      if (!currentUser) {
        navigate(`/builder?template=${templateId}`);
        return;
      }

      setLoadingTemplateId(templateId);

      try {
        // ── 1. Look for an existing invite in the "invites" collection ──
        // Your Builder saves with field "template" (not "templateId"), and
        // "userId" for ownership. We prefer published over draft.
        const invitationsRef = collection(db, "invites");

        // First pass: published invite for this template
        const publishedQ = query(
          invitationsRef,
          where("userId", "==", currentUser.uid),
          where("template", "==", templateId),
          where("published", "==", true),
          limit(1)
        );
        const publishedSnap = await getDocs(publishedQ);

        if (!publishedSnap.empty) {
          const existingId = publishedSnap.docs[0].id;
          toast.success("Reopening your existing project...");
          navigate(`/builder/edit/${existingId}`);
          return;
        }

        // Second pass: any draft invite for this template
        const draftQ = query(
          invitationsRef,
          where("userId", "==", currentUser.uid),
          where("template", "==", templateId),
          limit(1)
        );
        const draftSnap = await getDocs(draftQ);

        if (!draftSnap.empty) {
          const existingId = draftSnap.docs[0].id;
          toast.success("Reopening your draft...");
          navigate(`/builder/edit/${existingId}`);
          return;
        }

        // ── 2. No existing invite — start a fresh session ──────────────────
        navigate(`/builder?template=${templateId}`);
      } catch (err) {
        console.error("Failed to look up existing invite:", err);
        // On any Firestore error, fall back to new session gracefully
        navigate(`/builder?template=${templateId}`);
      } finally {
        setLoadingTemplateId(null);
      }
    },
    [currentUser, navigate]
  );

  return (
    <div className="min-h-screen py-20 px-6 lg:px-8 max-w-6xl mx-auto w-full">
      <SEO 
        title="Luxury Wedding Invitation Templates"
        description="Browse our collection of cinematic wedding invitation templates. Premium Indian wedding designs, modern minimalist styles, and AI-powered storytelling."
      />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3 text-editorial-accent mb-4">
            <Sparkles className="w-5 h-5" />
            <span className="text-[11px] font-bold uppercase tracking-[0.4em]">
              Premium Collections
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-serif italic mb-6 leading-none">
            Choose your <br /> cinematic aesthetic.
          </h1>
          <p className="text-editorial-secondary leading-relaxed font-editorial italic text-lg">
            From modern minimalism to royal heritage, our templates are designed
            to be as unique as your story. All experiences are fully customizable.
          </p>
        </div>
        <div className="flex items-center gap-3 py-2 px-4 bg-editorial-bg rounded-lg border border-editorial-border">
          <ShieldCheck className="w-4 h-4 text-editorial-muted" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-editorial-muted">
            SSL Secure Hosting Included
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 text-center md:text-left">
        {dbTemplates.length === 0 && !loadingTemplateId && (
          <div className="col-span-full py-32 editorial-card bg-white border-dashed border-2 flex flex-col items-center justify-center">
            <Sparkles className="w-12 h-12 text-editorial-accent mb-4 opacity-20" />
            <p className="text-editorial-muted font-serif italic text-2xl">No templates available yet.</p>
            <p className="text-xs uppercase tracking-widest text-editorial-muted mt-2">Check back soon for new cinematic stories</p>
          </div>
        )}
        {dbTemplates
          .filter(t => t.enabled !== false)
          .map((tplDb, i) => {
            const tplCode = staticTemplates.find(st => st.id === tplDb.id);
            if (!tplCode) return null;
            
            const tpl = { ...tplCode, ...tplDb };
            const isLoading = loadingTemplateId === tpl.id;

            return (
              <motion.div
                key={tpl.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`group relative overflow-hidden rounded-[32px] shadow-xl cursor-pointer transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl ${isLoading ? "pointer-events-none opacity-70" : ""}`}
                onClick={() => handleTemplateClick(tpl.id)}
              >
                <div className="relative aspect-[3/4] overflow-hidden bg-editorial-bg">
                  {/* Fallback & Background Image while iframe loads */}
                  <img
                    src={tpl.thumbnail || tpl.previewImage}
                    alt={tpl.name}
                    className="w-full h-full object-cover transition-opacity duration-1000 opacity-20 group-hover:opacity-40"
                    loading="lazy"
                  />

                  {/* Live Preview Iframe */}
                  <div className="absolute inset-0 pointer-events-none">
                    <iframe
                      src={`/preview/${tpl.id}`}
                      className="absolute top-0 left-0 w-[300%] h-[300%] scale-[0.3333] origin-top-left transition-transform duration-700 group-hover:scale-[0.35]"
                      loading="lazy"
                      title={tpl.name}
                      scrolling="no"
                    />
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-8">
                    {isLoading ? (
                      <div className="flex items-center gap-2 text-white/80">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-xs font-bold uppercase tracking-widest">Opening...</span>
                      </div>
                    ) : (
                      <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                        <p className="text-white/60 text-[10px] font-bold uppercase tracking-[0.3em] mb-2 text-left">
                          Premium Collection
                        </p>
                        <h3 className="text-white text-3xl font-serif italic mb-4 leading-tight text-left">
                          {tpl.name}
                        </h3>
                        <div className="flex items-center justify-between">
                          <span className="text-white/90 text-sm font-medium">
                            {tpl.publishPrice ? `₹${tpl.publishPrice} Access` : "Loading price..."}
                          </span>
                          <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 group-hover:bg-white group-hover:text-black transition-all">
                            <ArrowRight className="w-5 h-5" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {(tpl.category === 'premium' || tpl.id === 'south-india') && (
                    <div className="absolute top-6 left-6">
                      <span className="bg-editorial-accent text-white px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest">
                        Signature
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
      </div>
    </div>
  );
}