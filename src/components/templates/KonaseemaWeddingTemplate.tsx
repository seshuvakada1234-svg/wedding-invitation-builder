/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import React, { useRef, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  AnimatePresence,
} from "motion/react";
import CountdownTimer from "../CountdownTimer";
import MapPreview from "../MapPreview";
import TemplateImage from "../TemplateImage";

/* ═══════════════════════════ SVG DECORATIONS ═══════════════════════════ */

function RangoliSVG({
  className = "",
  color = "#FBC02D",
  size = 120,
  animate = false,
}) {
  return (
    <motion.svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      animate={animate ? { rotate: 360 } : undefined}
      transition={animate ? { duration: 90, repeat: Infinity, ease: "linear" } : undefined}
    >
      {Array.from({ length: 12 }).map((_, i) => (
        <ellipse
          key={`o${i}`}
          cx="60"
          cy="18"
          rx="5"
          ry="14"
          fill={color}
          opacity="0.2"
          transform={`rotate(${i * 30} 60 60)`}
        />
      ))}
      {Array.from({ length: 8 }).map((_, i) => (
        <ellipse
          key={`i${i}`}
          cx="60"
          cy="30"
          rx="4"
          ry="10"
          fill={color}
          opacity="0.35"
          transform={`rotate(${i * 45} 60 60)`}
        />
      ))}
      <circle cx="60" cy="60" r="4" fill={color} opacity="0.45" />
      <circle cx="60" cy="60" r="28" stroke={color} strokeWidth="0.5" opacity="0.25" />
      <circle cx="60" cy="60" r="42" stroke={color} strokeWidth="0.5" opacity="0.18" />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i * 30 * Math.PI) / 180;
        return (
          <circle
            key={`d${i}`}
            cx={60 + 48 * Math.cos(a)}
            cy={60 + 48 * Math.sin(a)}
            r="1.5"
            fill={color}
            opacity="0.3"
          />
        );
      })}
    </motion.svg>
  );
}

/* ═══════════════════════════ ANIMATIONS ═══════════════════════════ */

function SunlightRays() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[radial-gradient(ellipse,rgba(251,192,45,0.14)_0%,rgba(251,192,45,0.04)_40%,transparent_70%)]" />
      {[
        { angle: -22, w: 300, o: 0.05, d: 0 },
        { angle: -6, w: 210, o: 0.07, d: 1.2 },
        { angle: 8, w: 260, o: 0.06, d: 2.4 },
        { angle: 22, w: 190, o: 0.04, d: 0.6 },
        { angle: -38, w: 240, o: 0.03, d: 1.8 },
      ].map((r, i) => (
        <motion.div
          key={i}
          className="absolute top-0 left-1/2 origin-top"
          style={{
            width: r.w,
            height: "145%",
            background: `linear-gradient(180deg,rgba(251,192,45,${r.o}) 0%,rgba(251,192,45,${r.o * 0.25}) 40%,transparent 72%)`,
            transform: `rotate(${r.angle}deg)`,
            filter: "blur(28px)",
          }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{
            duration: 7 + i,
            repeat: Infinity,
            ease: "easeInOut",
            delay: r.d,
          }}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════ HELPERS ═══════════════════════════ */

function SectionReveal({ children, className = "", delay = 0 }: { children: React.ReactNode, className?: string, delay?: number, key?: any }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 35 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 35 }}
      transition={{ duration: 0.8, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════ MAIN COMPONENT ═══════════════════════════ */

interface KonaseemaWeddingTemplateProps {
  brideName: string;
  groomName: string;
  date: string;
  venue: string;
  venueAddress?: string;
  venueCity?: string;
  googleMapsLink?: string;
  googleMapsEmbedUrl?: string;
  coordinates?: string;
  coverImage?: string;
  introVideoUrl?: string; // New prop for video
  events: any[];
  galleryImages: string[];
  story?: string;
  enable3D?: boolean;
  isEditable?: boolean;
  onImageEdit?: (target: string, index?: number) => void;
}

export default function KonaseemaWeddingTemplate({
  brideName = "Lakshmi",
  groomName = "Ravi",
  date = "14 February 2026",
  venue = "East Godavari, Andhra Pradesh",
  venueAddress = "",
  venueCity = "",
  googleMapsLink = "https://maps.google.com",
  googleMapsEmbedUrl = "",
  coordinates = "",
  coverImage,
  introVideoUrl = "",
  events,
  galleryImages,
  story = "We warmly invite you to join us as we embark on this beautiful journey amidst the lush greens and gentle rivers of Konaseema. Surrounded by heritage and the warmth of family, we seek your presence and blessings.",
  enable3D = true,
  isEditable = false,
  onImageEdit,
}: KonaseemaWeddingTemplateProps) {
  const heroRef = useRef(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  
  // State to control intro video visibility
  const [isInvitationOpen, setIsInvitationOpen] = useState(!introVideoUrl);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.55], [1, 0.3]);

  // Parse date for Calendar Visual
  const dateParts = date.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
  const day = dateParts ? dateParts[1] : "";
  const month = dateParts ? dateParts[2].toUpperCase() : "";
  const year = dateParts ? dateParts[3] : "";

  const defaultGallery = [
    "https://picsum.photos/seed/konaseema-g2/600/750.jpg",
    "https://picsum.photos/seed/konaseema-g3/600/750.jpg",
    "https://picsum.photos/seed/konaseema-g4/600/750.jpg",
    "https://picsum.photos/seed/konaseema-g5/600/750.jpg",
    "https://picsum.photos/seed/konaseema-g6/600/750.jpg",
  ];

  const displayGallery = galleryImages?.length > 0 ? galleryImages : defaultGallery;

  const handleOpenInvitation = () => {
    setIsInvitationOpen(true);
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {/* ═══════════ INTRO VIDEO SCREEN ═══════════ */}
        {!isInvitationOpen && introVideoUrl && introVideoUrl.trim() !== "" ? (
          <motion.div
            key="intro-video"
            className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center cursor-pointer"
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
          >
            <video
              autoPlay
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
              src={introVideoUrl}
            />
            
            {/* Subtle dark gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

            {/* Open Invitation Button */}
            <div className="relative z-10 flex flex-col items-center justify-end h-full w-full pb-24 md:pb-32">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2, duration: 1, ease: "easeOut" }}
              >
                <button
                  onClick={handleOpenInvitation}
                  className="px-10 py-4 bg-[#FBC02D] text-[#1B5E20] font-serif text-xl md:text-2xl rounded-full shadow-2xl hover:bg-[#FFD54F] transition-all transform hover:scale-105 tracking-wider border border-[#FBC02D]/50"
                >
                  Open Invitation
                </button>
                <p className="text-white/50 text-[10px] md:text-xs mt-4 tracking-widest uppercase text-center">
                  Click to reveal
                </p>
              </motion.div>
            </div>
          </motion.div>
        ) : (
          /* ═══════════ MAIN TEMPLATE ═══════════ */
          <motion.div
            key="main-template"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            className="min-h-screen bg-[#F0F2F0] overflow-x-hidden"
          >
            {/* Container */}
            <div className="w-full max-w-[420px] md:max-w-5xl lg:max-w-6xl mx-auto bg-white shadow-sm md:shadow-2xl relative min-h-screen overflow-hidden">

              {/* ═══════════ HERO ═══════════ */}
              <section ref={heroRef} className="relative h-[65vh] md:h-[75vh] lg:h-[80vh] flex items-center justify-center overflow-hidden">
                <motion.div className="absolute inset-0" style={{ scale: enable3D ? heroScale : 1 }}>
                  <TemplateImage
                    image={coverImage}
                    alt="Hero"
                    className="w-full h-full"
                    isEditable={isEditable}
                    onEdit={() => onImageEdit?.("cover")}
                  />
                </motion.div>

                {enable3D && <SunlightRays />}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-b from-[#1B5E20]/30 via-transparent to-white pointer-events-none"
                  style={{ opacity: heroOpacity }}
                />

                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-6 pt-12 text-center pointer-events-none">
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="text-white/80 text-[10px] md:text-sm tracking-[0.3em] uppercase mb-4"
                  >
                    The Celebration of
                  </motion.p>

                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="text-3xl md:text-7xl lg:text-8xl font-serif text-white drop-shadow-md flex items-center gap-3 md:gap-8"
                  >
                    {brideName}
                    <span className="text-xl md:text-4xl text-[#FBC02D] font-sans not-italic">&amp;</span>
                    {groomName}
                  </motion.h1>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                    className="mt-6 md:mt-10"
                  >
                    <div className="w-16 md:w-24 h-px bg-[#FBC02D]/60 mx-auto mb-4" />
                    <p className="text-[#FBC02D] text-xs md:text-xl font-serif tracking-[0.2em]">{date}</p>
                  </motion.div>
                </div>
              </section>

              {/* ═══════════ SAVE THE DATE ═══════════ */}
              <section className="py-16 md:py-24 bg-[#F9FAF9] text-center">
                <SectionReveal className="max-w-lg mx-auto px-6">
                  <h2 className="text-sm md:text-lg tracking-[0.3em] uppercase text-[#5D4037]/70 mb-10 font-sans">Save the Date</h2>
                  
                  <div className="relative inline-block bg-white border border-[#FBC02D]/20 shadow-xl rounded-2xl p-8 md:p-10">
                    {/* Heart Icon */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 md:w-16 md:h-16 bg-[#FBC02D] rounded-full flex items-center justify-center shadow-lg border-4 border-[#F9FAF9]">
                      <span className="text-white text-2xl md:text-3xl">♥</span>
                    </div>
                    
                    <div className="mt-4">
                      <p className="text-sm md:text-base text-[#5D4037] tracking-[0.2em] font-sans">{month}</p>
                      <p className="text-7xl md:text-9xl font-serif text-[#1B5E20] my-2 leading-none">{day}</p>
                      <p className="text-sm md:text-base text-[#5D4037] tracking-[0.2em] font-sans">{year}</p>
                    </div>
                    
                    <div className="w-12 h-px bg-[#FBC02D] mx-auto my-6 opacity-50" />
                    
                    <p className="text-xs md:text-sm text-[#5D4037]/60 font-serif italic px-4">{venue}</p>
                  </div>
                </SectionReveal>
              </section>

              {/* ═══════════ COUNTDOWN ═══════════ */}
              <section className="bg-white pt-16">
                <CountdownTimer targetDate={date} theme="traditional" />
              </section>

              {/* ═══════════ OUR STORY ═══════════ */}
              <section className="px-6 md:px-12 py-16 md:py-20 lg:py-24 text-center bg-white">
                <SectionReveal className="max-w-3xl mx-auto">
                  <div className="w-8 md:w-16 h-px bg-[#FBC02D] mx-auto mb-6 opacity-50" />
                  <h2 className="text-lg md:text-4xl font-serif italic text-[#1B5E20] mb-6 md:mb-8">Our Story</h2>
                  <p className="text-[13px] md:text-lg text-[#5D4037]/70 leading-relaxed max-w-2xl mx-auto">
                    {story}
                  </p>
                  <div className="w-8 md:w-16 h-px bg-[#FBC02D] mx-auto mt-6 opacity-50" />
                </SectionReveal>
              </section>

              {/* ═══════════ EVENTS ═══════════ */}
              <section className="py-16 md:py-20 lg:py-24 bg-[#F9FAF9]">
                <SectionReveal className="px-6 mb-12 text-center max-w-3xl mx-auto">
                  <h2 className="text-lg md:text-4xl font-serif italic text-[#1B5E20]">Celebrations</h2>
                  <div className="w-8 md:w-16 h-px bg-[#2E7D32]/30 mx-auto mt-3 md:mt-5" />
                </SectionReveal>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 px-4 md:px-8 pb-4">
                  {events?.map((ev: any, i: number) => (
                    <motion.div
                      key={i}
                      className="w-full min-h-[200px] md:min-h-[280px] rounded-2xl p-6 md:p-8 bg-white border border-[#2E7D32]/10 shadow-md flex flex-col items-center text-center justify-center relative overflow-hidden"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: i * 0.1 }}
                      viewport={{ once: true }}
                    >
                      <div className="w-6 h-px bg-[#FBC02D] mb-4 opacity-40" />
                      <div className="w-full aspect-[16/10] rounded-xl overflow-hidden mb-6 shadow-sm">
                        <TemplateImage
                          image={ev.image}
                          alt={ev.name}
                          className="w-full h-full"
                          isEditable={isEditable}
                          onEdit={() => onImageEdit?.("event", i)}
                        />
                      </div>
                      <h3 className="text-md md:text-2xl font-serif text-[#1B5E20] mb-2">{ev.name}</h3>
                      <div className="w-6 md:w-10 h-px bg-[#FBC02D] mx-auto mb-3 opacity-40" />
                      <p className="text-[11px] md:text-sm font-semibold text-[#5D4037] mb-1">{ev.date}</p>
                      <p className="text-[10px] md:text-xs text-[#5D4037]/60 mb-3">{ev.time}</p>
                      <p className="text-[9px] md:text-[10px] uppercase tracking-widest font-bold text-[#1B5E20]/50">{ev.location}</p>
                    </motion.div>
                  ))}
                </div>
              </section>

              {/* ═══════════ GALLERY ═══════════ */}
              <section className="py-16 md:py-20 lg:py-24 bg-white">
                <SectionReveal className="px-6 mb-12 text-center text-lg md:text-4xl font-serif italic text-[#1B5E20] max-w-3xl mx-auto">
                  Moments Captured
                </SectionReveal>

                <div ref={galleryRef}
                     className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-6 md:px-12 pb-2">
                  {displayGallery.map((src, i) => (
                    <div key={i} className={`w-full aspect-[4/5] rounded-xl overflow-hidden shadow-md ${i === 0 ? 'col-span-1 sm:col-span-2' : ''}`}>
                      <TemplateImage 
                        image={src} 
                        alt="" 
                        className="w-full h-full" 
                        isEditable={isEditable}
                        onEdit={() => onImageEdit?.("gallery", i)}
                      />
                    </div>
                  ))}
                </div>
              </section>

              {/* ═══════════ LOCATION & MAP ═══════════ */}
              <section className="px-6 md:px-12 py-16 md:py-20 lg:py-24 bg-[#F9FAF9]">
                <div className="max-w-4xl mx-auto">
                  <SectionReveal className="text-center mb-10">
                    <h2 className="text-lg md:text-4xl font-serif italic text-[#1B5E20]">The Venue</h2>
                    <p className="text-[11px] md:text-lg text-[#5D4037]/60 mt-4 leading-relaxed">{venue}</p>
                  </SectionReveal>

                  <SectionReveal>
                    <MapPreview mapInput={googleMapsEmbedUrl || coordinates || googleMapsLink || venueAddress} />
                  </SectionReveal>
                </div>
              </section>

              {/* ═══════════ FOOTER ═══════════ */}
              <footer className="px-6 py-24 md:py-36 bg-[#0D3B12] text-center relative overflow-hidden">
                <SectionReveal>
                  <RangoliSVG color="#FBC02D" size={80} className="mx-auto mb-8 opacity-20 md:w-32 md:h-32" />
                  <p className="text-[#FBC02D] font-serif italic text-2xl md:text-5xl mb-4">See You There!</p>
                  <p className="text-white/20 text-[9px] md:text-xs uppercase tracking-[0.4em]">Wedding Invitation Cinematic Suites</p>
                </SectionReveal>
              </footer>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}