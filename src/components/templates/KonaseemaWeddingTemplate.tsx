/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
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

function MangoLeaf({ className = "", color = "#2E7D32", size = 20 }) {
  return (
    <svg
      className={className}
      width={size}
      height={size * 1.8}
      viewBox="0 0 20 36"
      fill="none"
    >
      <path
        d="M10 0C10 0 18 8 18 18C18 28 10 36 10 36C10 36 2 28 2 18C2 8 10 0 10 0Z"
        fill={color}
      />
      <line x1="10" y1="2" x2="10" y2="34" stroke={color} strokeWidth="0.6" opacity="0.4" />
      <line x1="10" y1="10" x2="6" y2="8" stroke={color} strokeWidth="0.3" opacity="0.25" />
      <line x1="10" y1="10" x2="14" y2="8" stroke={color} strokeWidth="0.3" opacity="0.25" />
      <line x1="10" y1="16" x2="5" y2="14" stroke={color} strokeWidth="0.3" opacity="0.25" />
      <line x1="10" y1="16" x2="15" y2="14" stroke={color} strokeWidth="0.3" opacity="0.25" />
      <line x1="10" y1="22" x2="6" y2="20" stroke={color} strokeWidth="0.3" opacity="0.25" />
      <line x1="10" y1="22" x2="14" y2="20" stroke={color} strokeWidth="0.3" opacity="0.25" />
    </svg>
  );
}

function BananaLeafDecor({ className = "", color = "#2E7D32", size = 60 }) {
  return (
    <svg
      className={className}
      width={size}
      height={size * 0.55}
      viewBox="0 0 60 33"
      fill="none"
    >
      <path
        d="M0 33Q5 18 10 10Q15 2 30 0Q45 2 50 10Q55 18 60 33"
        fill={color}
        opacity="0.12"
      />
      <line x1="30" y1="2" x2="30" y2="31" stroke={color} strokeWidth="0.5" opacity="0.25" />
      <line x1="30" y1="8" x2="18" y2="14" stroke={color} strokeWidth="0.3" opacity="0.18" />
      <line x1="30" y1="8" x2="42" y2="14" stroke={color} strokeWidth="0.3" opacity="0.18" />
      <line x1="30" y1="16" x2="14" y2="22" stroke={color} strokeWidth="0.3" opacity="0.18" />
      <line x1="30" y1="16" x2="46" y2="22" stroke={color} strokeWidth="0.3" opacity="0.18" />
      <line x1="30" y1="24" x2="20" y2="29" stroke={color} strokeWidth="0.3" opacity="0.18" />
      <line x1="30" y1="24" x2="40" y2="29" stroke={color} strokeWidth="0.3" opacity="0.18" />
    </svg>
  );
}

function CoconutTreeSVG({ className = "", color = "#1B5E20", height = 180 }) {
  return (
    <svg
      className={className}
      width={height * 0.5}
      height={height}
      viewBox="0 0 90 180"
      fill="none"
    >
      <path
        d="M44 180C42 150 48 120 46 85C44 55 50 35 45 12"
        stroke={color}
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      <path d="M45 18C28 8 8 22 2 12" stroke={color} strokeWidth="2.5" fill="none" />
      <path d="M45 18C62 8 82 22 88 12" stroke={color} strokeWidth="2.5" fill="none" />
      <path d="M45 18C32 4 12 0 0 6" stroke={color} strokeWidth="2" fill="none" />
      <path d="M45 18C58 4 78 0 90 6" stroke={color} strokeWidth="2" fill="none" />
      <path d="M45 18C36 12 18 28 8 33" stroke={color} strokeWidth="1.8" fill="none" />
      <path d="M45 18C54 12 72 28 82 33" stroke={color} strokeWidth="1.8" fill="none" />
      <path d="M45 18C45 10 40 2 35 0" stroke={color} strokeWidth="2" fill="none" />
      <path d="M45 18C45 10 50 2 55 0" stroke={color} strokeWidth="2" fill="none" />
      <circle cx="40" cy="24" r="3.5" fill={color} />
      <circle cx="50" cy="21" r="3" fill={color} />
      <circle cx="45" cy="27" r="2.8" fill={color} />
    </svg>
  );
}

function DiyaSVG({ className = "", size = 50, glow = false }) {
  const fid = useMemo(
    () => `dg-${Math.random().toString(36).slice(2, 8)}`,
    []
  );
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 50 60" fill="none">
      {glow && (
        <defs>
          <filter id={fid} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" />
          </filter>
        </defs>
      )}
      <ellipse cx="25" cy="52" rx="14" ry="4" fill="#8B6914" opacity="0.8" />
      <path d="M15 48C15 40 35 40 35 48" fill="#C9A84C" opacity="0.9" />
      <ellipse cx="25" cy="42" rx="8" ry="3" fill="#FFB300" opacity="0.5" />
      <line x1="25" y1="42" x2="25" y2="36" stroke="#5D4037" strokeWidth="1" />
      <path d="M25 36C22 30 20 22 25 14C30 22 28 30 25 36Z" fill="#FF8F00" opacity="0.85" />
      <path d="M25 36C23 32 22 26 25 20C28 26 27 32 25 36Z" fill="#FFC107" />
      {glow && (
        <circle cx="25" cy="28" r="14" fill="#FFC107" opacity="0.12" filter={`url(#${fid})`} />
      )}
    </svg>
  );
}

function LeafCorner({ className = "", color = "#2E7D32", flip = false }) {
  return (
    <svg
      className={className}
      width="50"
      height="50"
      viewBox="0 0 50 50"
      fill="none"
      style={flip ? { transform: "scaleX(-1)" } : {}}
    >
      <path
        d="M5 5C5 5 5 20 15 30C22 37 40 38 48 48"
        stroke={color}
        strokeWidth="1"
        opacity="0.35"
      />
      <path
        d="M5 5C5 5 15 5 22 12C28 18 30 35 48 48"
        stroke={color}
        strokeWidth="0.7"
        opacity="0.25"
      />
      <path d="M8 8C8 8 12 5 16 10C13 13 8 12 8 8Z" fill={color} opacity="0.2" />
      <circle cx="5" cy="5" r="2" fill={color} opacity="0.35" />
    </svg>
  );
}

function RangoliSVG({
  className = "",
  color = "#FBC02D",
  size = 120,
  animate = false,
}) {
  const Comp = (animate ? motion.svg : "svg") as any;
  const ap = animate
    ? {
        animate: { rotate: 360 },
        transition: { duration: 90, repeat: Infinity, ease: "linear" },
      }
    : {};
  return (
    <Comp
      className={className}
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      {...ap}
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
    </Comp>
  );
}

function ToranSVG({ className = "" }) {
  const leafPairs = useMemo(
    () =>
      Array.from({ length: 11 }).map((_, i) => {
        const x = 45 + i * 85;
        const la = -12 - (i % 3) * 5;
        const ra = 12 + (i % 3) * 5;
        const lo = 0.65 + (i % 2) * 0.15;
        return { x, la, ra, lo };
      }),
    []
  );
  return (
    <svg
      className={className}
      viewBox="0 0 980 85"
      fill="none"
      preserveAspectRatio="none"
    >
      <path
        d="M20 16Q245 30 490 16Q735 2 960 20"
        stroke="#8B6914"
        strokeWidth="2.5"
        fill="none"
      />
      <path
        d="M20 16Q245 30 490 16Q735 2 960 20"
        stroke="#A07D28"
        strokeWidth="1"
        fill="none"
        opacity="0.4"
      />
      {leafPairs.map((l, i) => (
        <g key={i}>
          <ellipse
            cx={l.x - 8}
            cy="46"
            rx="5.5"
            ry="24"
            fill="#4CAF50"
            opacity={l.lo}
            transform={`rotate(${l.la} ${l.x - 8} 18)`}
          />
          <ellipse
            cx={l.x + 8}
            cy="46"
            rx="5.5"
            ry="24"
            fill="#66BB6A"
            opacity={l.lo - 0.1}
            transform={`rotate(${l.ra} ${l.x + 8} 18)`}
          />
          <circle cx={l.x} cy="14" r="4.5" fill="#FBC02D" opacity="0.65" />
          <circle cx={l.x} cy="14" r="2.2" fill="#FF8F00" opacity="0.45" />
        </g>
      ))}
    </svg>
  );
}

/* ═══════════════════════════ ANIMATIONS ═══════════════════════════ */

function FloatingLeaves() {
  const leaves = useMemo(
    () =>
      Array.from({ length: 16 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 12,
        duration: 13 + Math.random() * 9,
        size: 10 + Math.random() * 14,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 140,
        sway: 22 + Math.random() * 45,
        opacity: 0.18 + Math.random() * 0.28,
        shade: ["#2E7D32", "#388E3C", "#43A047", "#4CAF50"][i % 4],
      })),
    []
  );
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
      {leaves.map((l) => (
        <motion.div
          key={l.id}
          className="absolute"
          style={{ left: `${l.left}%`, top: -25 }}
          animate={{
            y: ["0vh", "108vh"],
            x: [0, l.sway, -l.sway * 0.6, l.sway * 0.25],
            rotate: [l.rotation, l.rotation + l.rotSpeed * 2],
            opacity: [0, l.opacity, l.opacity, 0],
          }}
          transition={{
            duration: l.duration,
            delay: l.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <MangoLeaf color={l.shade} size={l.size} />
        </motion.div>
      ))}
    </div>
  );
}

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

function LeafPatternBG({ className = "", opacity = 0.025 }) {
  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='44' height='44' viewBox='0 0 44 44' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M22 3C22 3 28 9 28 16C28 23 22 29 22 29C22 29 16 23 16 16C16 9 22 3 22 3Z' fill='%232E7D32' fill-opacity='${opacity}'/%3E%3C/svg%3E")`,
        backgroundSize: "44px 44px",
      }}
    />
  );
}

function LeafDivider({ className = "" }) {
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`}>
      <div className="h-px w-14 md:w-20 bg-gradient-to-r from-transparent to-[#2E7D32]/35" />
      <MangoLeaf color="#2E7D32" size={13} />
      <div className="h-px w-14 md:w-20 bg-gradient-to-l from-transparent to-[#2E7D32]/35" />
    </div>
  );
}

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
  events,
  galleryImages,
  story = "We warmly invite you to join us as we embark on this beautiful journey amidst the lush greens and gentle rivers of Konaseema. Surrounded by heritage and the warmth of family, we seek your presence and blessings.",
  enable3D = true,
  isEditable = false,
  onImageEdit,
}: KonaseemaWeddingTemplateProps) {
  const heroRef = useRef(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.55], [1, 0.3]);

  const checkScroll = () => {
    if (!galleryRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = galleryRef.current;
    setCanScrollLeft(scrollLeft > 5);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, []);

  const defaultGallery = [
    "https://picsum.photos/seed/konaseema-g2/600/750.jpg",
    "https://picsum.photos/seed/konaseema-g3/600/750.jpg",
    "https://picsum.photos/seed/konaseema-g4/600/750.jpg",
    "https://picsum.photos/seed/konaseema-g5/600/750.jpg",
    "https://picsum.photos/seed/konaseema-g6/600/750.jpg",
  ];

  const displayGallery = galleryImages?.length > 0 ? galleryImages : defaultGallery;

  return (
    <div className="min-h-screen bg-[#F0F2F0] overflow-x-hidden">
      {/* Container - Centered and constrained for Desktop */}
      <div className="w-full max-w-[420px] md:max-w-5xl lg:max-w-6xl mx-auto bg-white shadow-sm md:shadow-2xl relative min-h-screen overflow-hidden">
        
        {enable3D && <FloatingLeaves />}

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

          <SunlightRays />
          <motion.div
            className="absolute inset-0 bg-gradient-to-b from-[#1B5E20]/30 via-transparent to-white pointer-events-none"
            style={{ opacity: heroOpacity }}
          />

          <motion.div
            className="absolute top-0 left-0 right-0 z-20"
            initial={{ y: -90, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1.4 }}
          >
            <ToranSVG className="w-full h-auto drop-shadow-sm opacity-80" />
          </motion.div>

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
              <LeafDivider className="mb-4 md:w-48 md:h-8" />
              <p className="text-[#FBC02D] text-xs md:text-xl font-serif tracking-[0.2em]">{date}</p>
            </motion.div>
          </div>
        </section>

        {/* ═══════════ COUNTDOWN ═══════════ */}
        <section className="bg-white pt-16">
          <CountdownTimer targetDate={date} theme="traditional" />
        </section>

        {/* ═══════════ INVITATION ═══════════ */}
        <section className="px-6 md:px-12 py-16 md:py-20 lg:py-24 text-center bg-white">
          <SectionReveal className="max-w-3xl mx-auto">
            <BananaLeafDecor color="#2E7D32" size={60} className="mx-auto mb-6 opacity-30 md:w-24 md:h-24" />
            <h2 className="text-lg md:text-4xl font-serif italic text-[#1B5E20] mb-3 md:mb-6">Our Auspicious Beginning</h2>
            <p className="text-[13px] md:text-lg text-[#5D4037]/70 leading-relaxed max-w-2xl mx-auto">
              {story}
            </p>
          </SectionReveal>
        </section>

        {/* ═══════════ EVENTS ═══════════ */}
        <section className="py-16 md:py-20 lg:py-24 bg-[#F9FAF9]">
          <SectionReveal className="px-6 mb-12 text-center max-w-3xl mx-auto">
            <h2 className="text-lg md:text-4xl font-serif italic text-[#1B5E20]">Celebrations</h2>
            <div className="w-8 md:w-16 h-px bg-[#2E7D32]/30 mx-auto mt-3 md:mt-5" />
          </SectionReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 px-4 md:px-8 pb-4">
            {events?.map((ev, i) => (
              <motion.div
                key={i}
                className="w-full min-h-[200px] md:min-h-[280px] rounded-2xl p-6 md:p-8 bg-white border border-[#2E7D32]/10 shadow-md flex flex-col items-center text-center justify-center relative overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <MangoLeaf className="mx-auto mb-4 opacity-20" size={12} />
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

            <div ref={galleryRef} onScroll={checkScroll}
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
    </div>
  );
}
