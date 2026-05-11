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

export default function TemplatesPage() {
  const navigate = useNavigate();
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);

  // Track which template card is currently loading so we can show a spinner
  const [loadingTemplateId, setLoadingTemplateId] = useState<string | null>(null);

  // ── Listen for auth state ──────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => setCurrentUser(user));
    return () => unsub();
  }, []);

  // ── Load dynamic prices from Firestore ────────────────────────────────────
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "templates"), (snap) => {
      const newPrices: Record<string, number> = {};
      snap.docs.forEach((doc) => {
        const data = doc.data();
        if (data.publishPrice) {
          newPrices[doc.id] = Number(data.publishPrice);
        }
      });
      setPrices(newPrices);
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3 text-editorial-accent mb-4">
            <Sparkles className="w-5 h-5" />
            <span className="text-[11px] font-bold uppercase tracking-[0.4em]">
              Premium Collections
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-serif italic mb-6 leading-none">
            Choose your <br /> wedding aesthetic.
          </h1>
          <p className="text-editorial-secondary leading-relaxed">
            From modern minimalism to royal heritage, our templates are designed
            to be as unique as your union. All templates are fully customizable.
          </p>
        </div>
        <div className="flex items-center gap-3 py-2 px-4 bg-editorial-bg rounded-lg border border-editorial-border">
          <ShieldCheck className="w-4 h-4 text-editorial-muted" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-editorial-muted">
            SSL Secure Hosting Included
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
        {staticTemplates.map((tpl, i) => {
          const isLoading = loadingTemplateId === tpl.id;

          return (
            <motion.div
              key={tpl.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`group cursor-pointer ${isLoading ? "pointer-events-none opacity-70" : ""}`}
              onClick={() => handleTemplateClick(tpl.id)}
            >
              <div className="relative aspect-[4/5] bg-editorial-bg rounded-2xl overflow-hidden mb-6 border border-editorial-border group-hover:border-editorial-accent transition-colors shadow-sm group-hover:shadow-xl group-hover:-translate-y-1 transition-all">
                <img
                  src={tpl.thumbnail}
                  alt={tpl.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100"
                />

                {/* Loading overlay */}
                {isLoading && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                )}

                <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black/80 via-black/40 to-transparent translate-y-4 group-hover:translate-y-0 transition-transform opacity-0 group-hover:opacity-100">
                  <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-2 font-sans">
                    {isLoading ? "Opening..." : "Use This Template"}
                  </p>
                  <div className="flex justify-between items-end">
                    <h3 className="text-white text-3xl font-serif italic">
                      {tpl.name}
                    </h3>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-serif italic mb-1">{tpl.name}</h2>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-editorial-muted">
                    ₹{prices[tpl.id] ?? tpl.price} One-time activation
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    // Stop the card's onClick from also firing
                    e.stopPropagation();
                    handleTemplateClick(tpl.id);
                  }}
                  disabled={isLoading}
                  className="w-12 h-12 bg-editorial-ink rounded-full flex items-center justify-center text-white hover:bg-black transition-all group-hover:scale-110 active:scale-95 disabled:opacity-60"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <ArrowRight className="w-5 h-5" />
                  )}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}