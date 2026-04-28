"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import MapPreview from "../MapPreview";
import { 
  MapPin, 
  Calendar, 
  Heart, 
  Map as MapIcon, 
  X, 
  Phone, 
  MessageCircle 
} from "lucide-react";

/* ─── TYPES ─── */
interface WeddingEvent {
  name: string;
  date: string;
  time: string;
  location: string;
  description?: string;
}

interface KeralaRevealTemplateProps {
  brideName?: string;
  groomName?: string;
  date?: string;
  venue?: string;
  city?: string;
  venueAddress?: string;
  googleMapsLink?: string;
  googleMapsEmbedUrl?: string;
  coordinates?: string;
  coverImage?: string;
  events?: WeddingEvent[];
  galleryImages?: string[];
  story?: string;
  enableEnvelope?: boolean;
}

/* ─── CONSTANTS ─── */
const C = {
  cream: "#F8F3E8",
  beigeL: "#F2EAD8",
  beigeR: "#EAD9C0",
  gold: "#C9A84C",
  goldDk: "#9A7828",
  goldLt: "#F5E6A3",
  maroon: "#5a1a1a",
  green: "#2E7D32",
  greenDk: "#1B5E20",
  yellow: "#FBC02D",
  red: "#8B1E1E",
  text: "#3d1f0a",
};

/* ─── COMPONENTS ─── */

function GoldDivider({ color = C.gold, icon = "✦" }: { color?: string; icon?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 my-4 w-full max-w-[200px] mx-auto">
      <div className="flex-1 h-[1px]" style={{ background: `linear-gradient(90deg, transparent, ${color})` }} />
      <span style={{ color, fontSize: "12px" }}>{icon}</span>
      <div className="flex-1 h-[1px]" style={{ background: `linear-gradient(270deg, transparent, ${color})` }} />
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="text-center mb-10 px-4">
      <GoldDivider color={C.green} />
      <h2 className="text-3xl md:text-5xl font-serif italic text-green-800 mb-2">{title}</h2>
      {subtitle && <p className="text-sm md:text-base text-neutral-500 font-light italic">{subtitle}</p>}
    </div>
  );
}

export default function KeralaRevealTemplate({
  brideName = "Ravi",
  groomName = "Priya",
  date = "14th February 2025",
  venue = "Sri Lakshmi Kalyana Mandapam",
  city = "Konaseema",
  venueAddress = "Near Godavari Bridge Road, Amalapuram, Andhra Pradesh",
  googleMapsLink = "",
  googleMapsEmbedUrl = "",
  coordinates = "",
  coverImage = "https://images.unsplash.com/photo-1601128533718-374ffcca299b?w=1200&q=60",
  events = [],
  galleryImages = [],
  story = "Our journey began in the serene backwaters of Konaseema, where the Godavari whispers ancient tales of love. What started as a chance meeting beneath the coconut groves has blossomed into a bond as deep as the river itself.",
  enableEnvelope = true,
}: KeralaRevealTemplateProps) {
  const [isOpenedManual, setIsOpenedManual] = useState(false);
  
  // If envelope is disabled, we treat it as "opened"
  const isOpen = !enableEnvelope || isOpenedManual;

  const displayEvents = events.length > 0 ? events : [
    { name: "Pellikuthuru", date: "Wed, 12 Feb 2025", time: "6:00 PM", location: "Bride's Home" },
    { name: "Haldi", date: "Thu, 13 Feb 2025", time: "8:00 AM", location: "Wedding Hall" },
    { name: "Wedding", date: "Fri, 14 Feb 2025", time: "9:30 AM", location: "Main Venue" },
  ];

  const displayGallery = galleryImages.length > 0 ? galleryImages : [
    "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=600",
    "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=600",
    "https://images.unsplash.com/photo-1519741497674-611481863552?w=600",
  ];

  return (
    <div className="w-full bg-[#F8F3E8] font-serif text-[#3d1f0a] selection:bg-yellow-100 min-h-screen">
      
      {/* ─── ENVELOPE STAGE ─── */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.8, delay: 0.2 } }}
            className="fixed inset-0 z-[500] flex items-center justify-center bg-[#F8F3E8] overflow-hidden p-4"
          >
            <motion.div 
              className="relative w-[320px] h-[480px] md:w-[380px] md:h-[580px] cursor-pointer"
              onClick={() => setIsOpenedManual(true)}
              whileHover={{ scale: 1.02 }}
            >
              {/* Left Panel */}
              <motion.div 
                className="absolute left-0 top-0 bottom-0 w-1/2 bg-[#F2EAD8] rounded-l-2xl shadow-2xl z-20 overflow-hidden"
                animate={{ rotateY: 0, x: 0 }}
                transition={{ duration: 1.1, ease: [0.77, 0, 0.18, 1] }}
                style={{ transformOrigin: "left" }}
              >
                <div className="absolute inset-4 border-l border-y border-[#C9A84C]/50 rounded-l-xl" />
                <svg className="absolute inset-0 w-full h-full opacity-30 pointer-events-none" viewBox="0 0 190 580">
                  <path d="M30,580 C40,480 20,400 50,310 C70,250 30,180 60,100 C75,55 50,20 70,0" stroke="#C9A84C" fill="none" strokeWidth="0.8" />
                </svg>
              </motion.div>

              {/* Right Panel */}
              <motion.div 
                className="absolute right-0 top-0 bottom-0 w-1/2 bg-[#EAD9C0] rounded-r-2xl shadow-2xl z-20 overflow-hidden"
                style={{ transformOrigin: "right" }}
              >
                <div className="absolute inset-4 border-r border-y border-[#C9A84C]/50 rounded-r-xl" />
                <svg className="absolute inset-0 w-full h-full opacity-30 pointer-events-none scale-x-[-1]" viewBox="0 0 190 580">
                  <path d="M30,580 C40,480 20,400 50,310 C70,250 30,180 60,100 C75,55 50,20 70,0" stroke="#C9A84C" fill="none" strokeWidth="0.8" />
                </svg>
              </motion.div>

              {/* Wax Seal */}
              <motion.div 
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex flex-col items-center"
              >
                <div className="relative w-24 h-24 md:w-32 md:h-32 flex items-center justify-center">
                  {/* Seal Rim (Rough Edge Effect) */}
                  <div className="absolute inset-0 bg-gradient-to-br from-neutral-200 via-neutral-400 to-neutral-200 rounded-full blur-[1px]" 
                       style={{ clipPath: "polygon(50% 0%, 57% 2%, 63% 7%, 70% 3%, 75% 8%, 81% 6%, 85% 12%, 93% 12%, 95% 19%, 100% 22%, 98% 30%, 100% 37%, 96% 43%, 97% 50%, 93% 56%, 95% 63%, 90% 68%, 90% 75%, 84% 79%, 82% 86%, 75% 88%, 71% 94%, 64% 95%, 60% 100%, 53% 97%, 47% 100%, 40% 95%, 36% 94%, 29% 88%, 25% 86%, 18% 79%, 16% 75%, 10% 68%, 5% 63%, 7% 56%, 3% 50%, 4% 43%, 0% 37%, 2% 30%, 0% 22%, 5% 19%, 7% 12%, 15% 12%, 19% 6%, 25% 8%, 30% 3%, 37% 7%, 43% 2%)" }} />
                  {/* Wax */}
                  <div className="absolute inset-[2px] bg-gradient-to-br from-[#F0DC90] via-[#D4AF37] to-[#5A3D00] rounded-full shadow-inner flex items-center justify-center"
                       style={{ clipPath: "polygon(50% 0%, 57% 2%, 63% 7%, 70% 3%, 75% 8%, 81% 6%, 85% 12%, 93% 12%, 95% 19%, 100% 22%, 98% 30%, 100% 37%, 96% 43%, 97% 50%, 93% 56%, 95% 63%, 90% 68%, 90% 75%, 84% 79%, 82% 86%, 75% 88%, 71% 94%, 64% 95%, 60% 100%, 53% 97%, 47% 100%, 40% 95%, 36% 94%, 29% 88%, 25% 86%, 18% 79%, 16% 75%, 10% 68%, 5% 63%, 7% 56%, 3% 50%, 4% 43%, 0% 37%, 2% 30%, 0% 22%, 5% 19%, 7% 12%, 15% 12%, 19% 6%, 25% 8%, 30% 3%, 37% 7%, 43% 2%)" }}>
                    <div className="text-white/80 text-2xl md:text-4xl font-serif italic select-none">
                      {brideName[0]} <span className="text-sm">&amp;</span> {groomName[0]}
                    </div>
                  </div>
                </div>
                <div className="mt-4 text-[#C9A84C] text-[10px] md:text-xs tracking-[0.3em] font-bold uppercase opacity-60">
                  Tap to Reveal
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── FULL CONTENT ─── */}
      <div className={`transition-opacity duration-1000 ${isOpen ? 'opacity-100' : 'opacity-0 h-screen overflow-hidden'}`}>
        
        {/* Back Button (Only if using envelope) */}
        {enableEnvelope && (
          <button 
            onClick={() => setIsOpenedManual(false)}
            className="fixed top-6 right-6 z-[600] flex items-center gap-2 bg-maroon/90 text-goldLt px-4 py-2 rounded-full border border-gold/30 text-[10px] uppercase font-bold tracking-widest backdrop-blur shadow-xl hover:bg-maroon transition-all"
          >
            <X size={14} /> Close Invitation
          </button>
        )}

        {/* ─── HERO ─── */}
        <section className="relative h-screen flex items-center justify-center overflow-hidden text-center text-white">
          <div className="absolute inset-0 z-0">
            <img 
              src={coverImage || undefined} 
              alt="Hero" 
              className="w-full h-full object-cover brightness-[0.4]" 
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-green-900/40 via-transparent to-black/60" />
          </div>
          
          <div className="relative z-10 px-4">
            <motion.p initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} className="text-[10px] md:text-xs uppercase tracking-[0.5em] mb-4 opacity-80">
              The Wedding of
            </motion.p>
            <motion.h1 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} className="text-5xl md:text-8xl font-serif mb-6 leading-tight">
              {brideName} <span className="text-[#FBC02D] italic">&amp;</span> {groomName}
            </motion.h1>
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 0.5 }}>
              <GoldDivider />
              <p className="text-lg md:text-2xl font-serif italic mt-4">{date}</p>
              <p className="text-[10px] md:text-xs uppercase tracking-[0.3em] mt-2 opacity-60">{city}, {venue}</p>
            </motion.div>
          </div>
        </section>

        {/* ─── INVITATION DETAILS ─── */}
        <section className="py-20 px-6 bg-gradient-to-b from-[#F8F3E8] to-[#FDF8EE]">
          <div className="max-w-xl mx-auto bg-[#FFF8E7] rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(46,125,50,0.1)] border border-yellow-200/50">
            <div className="bg-gradient-to-b from-green-800 to-green-700 h-16 flex items-center justify-center">
               <span className="text-3xl">🪔</span>
            </div>
            <div className="p-8 md:p-12 text-center relative">
               {/* Decorative Corners */}
               <div className="absolute top-8 left-8 w-8 h-8 border-t-2 border-l-2 border-[#FBC02D]/40" />
               <div className="absolute top-8 right-8 w-8 h-8 border-t-2 border-r-2 border-[#FBC02D]/40" />
               <div className="absolute bottom-8 left-8 w-8 h-8 border-b-2 border-l-2 border-[#FBC02D]/40" />
               <div className="absolute bottom-8 right-8 w-8 h-8 border-b-2 border-r-2 border-[#FBC02D]/40" />

               <p className="text-[10px] uppercase tracking-[0.3em] text-[#8B1E1E] mb-6">With the blessings of Almighty</p>
               <h2 className="text-3xl font-serif italic text-green-900 mb-6">Wedding Invitation</h2>
               <p className="text-sm md:text-base text-neutral-600 leading-relaxed mb-8 max-w-sm mx-auto">
                 Together with our families, we invite you to join us in celebrating the beginning of our new journey.
               </p>
               <div className="text-xl md:text-2xl font-serif italic text-[#8B1E1E] mb-6">
                 {brideName} &amp; {groomName}
               </div>
               <div className="text-sm font-bold tracking-widest text-green-800 uppercase mb-2">
                 {date}
               </div>
               <div className="text-xs text-neutral-500 italic">
                 Venue: {venue}, {city}
               </div>
            </div>
          </div>
        </section>

        {/* ─── OUR STORY ─── */}
        <section className="py-24 px-6 bg-white overflow-hidden">
          <SectionHeader title="Our Story" subtitle="A journey written in the stars" />
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl">
              <img 
                src={displayGallery[0] || undefined} 
                alt="Story Cover" 
                className="w-full h-full object-cover" 
                loading="lazy"
              />
              <div className="absolute inset-0 bg-green-900/20" />
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} className="space-y-6">
              <h3 className="text-2xl md:text-3xl font-serif italic text-[#8B1E1E]">Beginning of Forever</h3>
              <p className="text-neutral-600 leading-relaxed text-sm md:text-base italic">
                "{story}"
              </p>
              <div className="flex items-center gap-4 pt-4">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-800 font-bold mb-1">2019</div>
                  <span className="text-[10px] text-neutral-400 uppercase">First Met</span>
                </div>
                <div className="flex-1 h-[1px] bg-yellow-400/30" />
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-yellow-50 flex items-center justify-center text-yellow-600 font-bold mb-1">2022</div>
                  <span className="text-[10px] text-neutral-400 uppercase">Engaged</span>
                </div>
                <div className="flex-1 h-[1px] bg-yellow-400/30" />
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-800 font-bold mb-1">2025</div>
                  <span className="text-[10px] text-neutral-400 uppercase">Wedding</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ─── EVENTS ─── */}
        <section className="py-24 px-6 bg-[#FBF9F2]">
          <SectionHeader title="Wedding Events" />
          <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayEvents.map((event, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ y: -5 }}
                className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-100 text-center"
              >
                <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-700 mx-auto mb-4">
                  <Calendar size={18} />
                </div>
                <h3 className="text-lg font-serif italic text-green-900 mb-2">{event.name}</h3>
                <div className="text-[11px] font-bold text-yellow-600 uppercase mb-1">{event.date}</div>
                <div className="text-xs text-neutral-400 mb-4">{event.time}</div>
                <p className="text-[11px] text-neutral-500 leading-relaxed uppercase tracking-tighter">{event.location}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ─── GALLERY ─── */}
        <section className="py-24 bg-white overflow-hidden">
          <SectionHeader title="Gallery" subtitle="Moments of love captures in time" />
          <div className="flex gap-4 overflow-x-auto px-6 pb-8 snap-x no-scrollbar">
            {displayGallery.map((img, idx) => (
              <motion.div 
                key={idx}
                className="flex-shrink-0 w-64 md:w-80 aspect-[3/4] rounded-2xl overflow-hidden shadow-lg snap-start border-4 border-white"
              >
                <img 
                  src={img || undefined} 
                  alt={`Gallery ${idx}`} 
                  className="w-full h-full object-cover" 
                  loading="lazy"
                />
              </motion.div>
            ))}
          </div>
        </section>

        {/* ─── LOCATION ─── */}
        <section className="py-24 px-6 bg-[#FBF9F2]">
          <div className="max-w-4xl mx-auto">
            <SectionHeader title="Wedding Venue" subtitle="Join us at" />
            <div className="text-center mb-10">
              <h3 className="text-2xl font-serif italic text-green-900 mb-2">{venue}</h3>
              <p className="text-neutral-500 text-sm md:text-base leading-relaxed">
                {venueAddress}
              </p>
            </div>
            <MapPreview mapInput={googleMapsEmbedUrl || coordinates || googleMapsLink || venueAddress} />
          </div>
        </section>

        {/* ─── FOOTER ─── */}
        <footer className="bg-neutral-900 text-white pt-24 pb-12 px-6 text-center">
           <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}>
              <div className="flex items-center justify-center gap-2 mb-8 text-yellow-400 opacity-40">
                 <Heart size={24} fill="currentColor" />
              </div>
              <h2 className="text-3xl md:text-5xl font-serif italic text-yellow-50 mb-4">{brideName} &amp; {groomName}</h2>
              <p className="text-[10px] uppercase tracking-[0.4em] text-neutral-500 mb-12">{date}</p>
              
              <div className="w-24 h-[1px] bg-yellow-500/20 mx-auto mb-12" />
              
              <p className="text-xs text-neutral-500 max-w-sm mx-auto italic mb-16 leading-relaxed">
                "We are grateful for your presence and blessings as we begin this beautiful journey together. May our love be as enduring as the Godavari and as vibrant as the Konaseema greens."
              </p>

              <div className="text-[9px] uppercase tracking-[0.2em] text-neutral-700">
                Created with Love &bull; Wedding Builder
              </div>
           </motion.div>
        </footer>

      </div>
    </div>
  );
}
