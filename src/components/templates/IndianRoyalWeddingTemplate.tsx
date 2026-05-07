"use client";

import React, { useRef, useMemo } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import CountdownTimer from "../CountdownTimer";
import MapPreview from "../MapPreview";
import TemplateImage from "../TemplateImage";

/* ─── DESIGN TOKENS ─── */
const C = {
  gold: "#D4AF37",
  goldLight: "#F5E0A0",
  crimson: "#6B1E1E",
  crimsonDark: "#2A0A0A",
  cream: "#FDFBF7",
  parchment: "#F8F3E8",
  text: "#4A1515",
};

/* ─── SVG COMPONENTS ─── */
function MandalaSVG({ className = "", color = C.gold, size = 200, animate = false }: any) {
  const Comp = animate ? motion.svg : "svg";
  const animProps = animate
    ? { animate: { rotate: 360 }, transition: { duration: 60, repeat: Infinity, ease: "linear" } }
    : {};
  return (
    <Comp className={className} width={size} height={size} viewBox="0 0 200 200"
      fill="none" xmlns="http://www.w3.org/2000/svg" {...animProps}>
      {Array.from({ length: 16 }).map((_, i) => (
        <ellipse key={`o-${i}`} cx="100" cy="40" rx="8" ry="22" fill={color} opacity="0.35"
          transform={`rotate(${(i * 360) / 16} 100 100)`} />
      ))}
      {Array.from({ length: 12 }).map((_, i) => (
        <ellipse key={`m-${i}`} cx="100" cy="55" rx="6" ry="18" fill={color} opacity="0.55"
          transform={`rotate(${(i * 360) / 12} 100 100)`} />
      ))}
      {Array.from({ length: 8 }).map((_, i) => (
        <ellipse key={`in-${i}`} cx="100" cy="70" rx="5" ry="14" fill={color} opacity="0.75"
          transform={`rotate(${(i * 360) / 8} 100 100)`} />
      ))}
      <circle cx="100" cy="100" r="75" stroke={color} strokeWidth="0.5" opacity="0.3" />
      <circle cx="100" cy="100" r="58" stroke={color} strokeWidth="0.5" opacity="0.4" />
      <circle cx="100" cy="100" r="40" stroke={color} strokeWidth="0.8" opacity="0.5" />
      <circle cx="100" cy="100" r="22" stroke={color} strokeWidth="1" opacity="0.6" />
      <circle cx="100" cy="100" r="5" fill={color} opacity="0.7" />
      {Array.from({ length: 16 }).map((_, i) => {
        const rad = ((i * 360) / 16) * (Math.PI / 180);
        return <circle key={`d-${i}`} cx={100 + 82 * Math.cos(rad)} cy={100 + 82 * Math.sin(rad)}
          r="1.5" fill={color} opacity="0.5" />;
      })}
    </Comp>
  );
}

function CornerOrnament({ className = "", color = C.gold, flip = false }: any) {
  return (
    <svg className={className} width="60" height="60" viewBox="0 0 60 60" fill="none"
      style={flip ? { transform: "scaleX(-1)" } : {}}>
      <path d="M2 2 C2 2 2 25 15 35 C25 42 50 42 58 58" stroke={color} strokeWidth="1" opacity="0.6" />
      <path d="M2 2 C2 2 18 2 28 12 C36 20 38 45 58 58" stroke={color} strokeWidth="0.8" opacity="0.4" />
      <circle cx="4" cy="4" r="2" fill={color} opacity="0.6" />
      <circle cx="56" cy="56" r="2" fill={color} opacity="0.6" />
      <path d="M12 12 C12 12 18 8 22 14 C18 18 12 16 12 12Z" fill={color} opacity="0.3" />
    </svg>
  );
}

function LotusSVG({ className = "", color = C.gold, size = 40 }: any) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 40 40" fill="none">
      {Array.from({ length: 7 }).map((_, i) => {
        const angle = (i * 360) / 7 - 90;
        return <ellipse key={i} cx="20" cy="14" rx="3.5" ry="12" fill={color}
          opacity={0.15 + i * 0.05} transform={`rotate(${angle} 20 22)`} />;
      })}
      <circle cx="20" cy="22" r="3" fill={color} opacity="0.3" />
    </svg>
  );
}

function FloralDivider({ className = "" }: any) {
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`}>
      <div style={{ height: 1, flex: 1, maxWidth: 80, background: "linear-gradient(to right, transparent, #D4AF37, transparent)", opacity: 0.5 }} />
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
        <path d="M10 2 L12 8 L18 10 L12 12 L10 18 L8 12 L2 10 L8 8Z" fill="#D4AF37" opacity="0.5" />
      </svg>
      <div style={{ height: 1, flex: 1, maxWidth: 80, background: "linear-gradient(to left, transparent, #D4AF37, transparent)", opacity: 0.5 }} />
    </div>
  );
}

function PinIcon({ color = C.crimson, size = 24 }: any) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill={color} opacity="0.9" />
      <circle cx="12" cy="9" r="2.5" fill="white" opacity="0.9" />
    </svg>
  );
}

function ClockIcon({ color = C.gold, size = 15 }: any) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5" opacity="0.8" />
      <path d="M12 7 L12 12 L15.5 15.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
    </svg>
  );
}
function CarIcon({ color = C.gold, size = 15 }: any) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M5 11 L7 6 H17 L19 11 H5Z" stroke={color} strokeWidth="1.3" fill={color} fillOpacity="0.15" opacity="0.8" />
      <rect x="4" y="11" width="16" height="6" rx="2" stroke={color} strokeWidth="1.3" fill={color} fillOpacity="0.1" opacity="0.8" />
      <circle cx="8" cy="17.5" r="1.5" fill={color} opacity="0.8" />
      <circle cx="16" cy="17.5" r="1.5" fill={color} opacity="0.8" />
    </svg>
  );
}
function PlaneIcon({ color = C.gold, size = 15 }: any) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M21 16 L3 10 L6 14 L3 16 L8 17 L12 21 L13 16 L21 16Z" fill={color} fillOpacity="0.8" opacity="0.9" />
      <path d="M14 5 C16 3 19 4 19 6 C19 8 16 10 14 9 L9 12 L5 10 L8 8Z" fill={color} fillOpacity="0.6" opacity="0.8" />
    </svg>
  );
}
function HotelIcon({ color = C.gold, size = 15 }: any) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="6" width="18" height="15" rx="1" stroke={color} strokeWidth="1.3" fill={color} fillOpacity="0.08" opacity="0.8" />
      <path d="M3 6 L12 2 L21 6" stroke={color} strokeWidth="1.3" fill="none" opacity="0.8" />
      <rect x="7" y="11" width="3" height="3" rx="0.5" fill={color} opacity="0.5" />
      <rect x="14" y="11" width="3" height="3" rx="0.5" fill={color} opacity="0.5" />
      <rect x="10" y="15" width="4" height="6" rx="0.5" fill={color} opacity="0.4" />
    </svg>
  );
}

/* ─── FLOATING PETALS ─── */
function FloatingPetals() {
  const petals = useMemo(() =>
    Array.from({ length: 8 }).map((_, i) => ({
      id: i, left: 5 + i * 12, delay: i * 1.5,
      duration: 12 + (i % 4) * 2, size: 7 + (i % 4) * 2,
      rotation: i * 45, sway: 20 + (i % 3) * 12, opacity: 0.12 + (i % 4) * 0.06,
    })), []);
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 10 }}>
      {petals.map((p) => (
        <motion.div key={p.id} style={{ position: "absolute", left: `${p.left}%`, top: -20 }}
          animate={{ y: ["0vh", "105vh"], x: [0, p.sway, -p.sway * 0.5, p.sway * 0.3], rotate: [p.rotation, p.rotation + 120], opacity: [0, p.opacity, p.opacity, 0] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: "linear" }}>
          <svg width={p.size} height={p.size} viewBox="0 0 20 20" fill="none">
            <path d="M10 0 C10 0 16 5 16 10 C16 15 10 20 10 20 C10 20 4 15 4 10 C4 5 10 0 10 0Z" fill="#D4AF37" opacity="0.8" />
          </svg>
        </motion.div>
      ))}
    </div>
  );
}

/* ─── SECTION REVEAL ─── */
function SectionReveal({ children, className = "", delay = 0 }: any) {
  return (
    <motion.div className={className}
      initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-6%" }}
      transition={{ duration: 0.75, delay, ease: [0.25, 0.46, 0.45, 0.94] }}>
      {children}
    </motion.div>
  );
}

/* ─── SAMPLE DATA ─── */
const SAMPLE_EVENTS = [
  { name: "Haldi", date: "Feb 12, 2026", time: "8:00 AM", location: "Heritage Courtyard" },
  { name: "Mehendi", date: "Feb 12, 2026", time: "5:00 PM", location: "Garden Lawn" },
  { name: "Sangeet", date: "Feb 13, 2026", time: "7:00 PM", location: "Grand Ballroom" },
  { name: "Wedding", date: "Feb 14, 2026", time: "6:15 AM", location: "Crystal Terrace" },
];
const SAMPLE_GALLERY = [
  "https://images.unsplash.com/photo-1519225497282-14337446bc77?w=640&h=800&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1544124499-58912cbddaad?w=640&h=800&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=640&h=800&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=640&h=800&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1606800052052-a08af7148866?w=640&h=800&fit=crop&auto=format",
];

/* ══════════════════════════════════════════
   VENUE SECTION — all inline styles
══════════════════════════════════════════ */
function VenueLocationSection({ venue, venueAddress, venueCity, venueState, venuePin, googleMapsEmbedUrl, googleMapsLink, coordinates, ceremonyTime, receptionTime, nearestAirport, nearestMetro, accommodation }: any) {
  const travelInfo = [
    { icon: <ClockIcon />, label: "Ceremony", value: ceremonyTime || "6:15 AM" },
    { icon: <ClockIcon />, label: "Reception", value: receptionTime || "7:30 PM onwards" },
    { icon: <PlaneIcon />, label: "Nearest Airport", value: nearestAirport || "Rajiv Gandhi Intl (40 km)" },
    { icon: <CarIcon />, label: "Nearest Metro", value: nearestMetro || "Jubilee Hills Check Post" },
    { icon: <HotelIcon />, label: "Accommodation", value: accommodation || "ITC Kakatiya & Park Hyatt (5 min)" },
  ];
  return (
    <section style={{ width: "100%", background: "#FDFBF7", padding: "40px 16px", boxSizing: "border-box" }}>
      <SectionReveal>
        <FloralDivider className="mb-5" />
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <p style={{ fontSize: 9, letterSpacing: "0.3em", color: C.gold, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Find Your Way to Us</p>
          <h2 style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 26, color: C.crimson, lineHeight: 1.2, marginBottom: 4 }}>Venue &amp; Location</h2>
          <p style={{ fontSize: 10, color: "#4A1515", opacity: 0.55, textTransform: "uppercase", letterSpacing: "0.18em" }}>{venue}</p>
        </div>
      </SectionReveal>

      {/* MAP */}
      <SectionReveal delay={0.1}>
        <div className="mb-8">
          <MapPreview mapInput={googleMapsEmbedUrl || coordinates || googleMapsLink || venueAddress} />
        </div>
      </SectionReveal>

      {/* VENUE CARD */}
      <SectionReveal delay={0.15}>
        <div style={{ background: "linear-gradient(135deg,#FFFDF7,#F8F3E8)", borderRadius: 14, border: "1px solid rgba(212,175,55,0.2)", padding: 14, marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(107,30,30,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <PinIcon color={C.crimson} size={12} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h3 style={{ fontFamily: "Georgia,serif", fontStyle: "italic", fontSize: 13, color: C.crimson, marginBottom: 3, wordBreak: "break-word", lineHeight: 1.3 }}>{venue}</h3>
              <p style={{ fontSize: 10, color: "#4A1515", opacity: 0.6, lineHeight: 1.5, wordBreak: "break-word" }}>{venueAddress}</p>
              {venueCity && <p style={{ fontSize: 8, textTransform: "uppercase", letterSpacing: "0.18em", color: C.gold, fontWeight: 700, marginTop: 3 }}>{venueCity}{venueState ? `, ${venueState}` : ""}{venuePin ? ` — ${venuePin}` : ""}</p>}
            </div>
          </div>
          <div style={{ height: 1, background: "linear-gradient(to right,transparent,rgba(212,175,55,0.4),transparent)", margin: "10px 0" }} />
          <p style={{ fontSize: 8, textTransform: "uppercase", letterSpacing: "0.18em", fontWeight: 700, color: C.gold, textAlign: "center" }}>✦ &nbsp; Grand Ballroom · Garden Lawn &nbsp; ✦</p>
        </div>
      </SectionReveal>

      {/* TRAVEL ROWS */}
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {travelInfo.map((item, i) => (
          <motion.div key={i}
            style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.85)", borderRadius: 11, padding: "9px 11px", border: "1px solid rgba(212,175,55,0.15)", width: "100%", boxSizing: "border-box" }}
            initial={{ opacity: 0, x: 14 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.35, delay: 0.1 + i * 0.055 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(107,30,30,0.06)", border: "1px solid rgba(212,175,55,0.18)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {item.icon}
            </div>
            <div style={{ minWidth: 0, flex: 1, overflow: "hidden" }}>
              <p style={{ fontSize: 7, textTransform: "uppercase", letterSpacing: "0.18em", color: C.gold, fontWeight: 700, marginBottom: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.label}</p>
              <p style={{ fontSize: 10, color: "#4A1515", opacity: 0.8, fontWeight: 500, wordBreak: "break-word", lineHeight: 1.35 }}>{item.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <FloralDivider className="mt-8" />
    </section>
  );
}

/* ══════════════════════════════════════════
   MAIN EXPORT
══════════════════════════════════════════ */
export default function IndianRoyalWeddingTemplate({
  brideName = "Priya", groomName = "Arjun", date = "February 14, 2026",
  venue = "The Grand Palace Gardens", venueAddress = "Plot 45, Road No. 12, Jubilee Hills",
  venueCity = "Jubilee Hills", venueState = "Hyderabad", venuePin = "500033",
  googleMapsLink = "https://maps.google.com/?q=Jubilee+Hills+Hyderabad",
  googleMapsEmbedUrl, coordinates, coverImage, events = SAMPLE_EVENTS, galleryImages = SAMPLE_GALLERY,
  ceremonyTime = "6:15 AM", receptionTime = "7:30 PM onwards",
  nearestAirport = "Rajiv Gandhi Intl Airport (40 km)",
  nearestMetro = "Jubilee Hills Check Post",
  accommodation = "ITC Kakatiya & Park Hyatt (5 min away)",
  story = "A journey of tradition, love, and legacy begins here.",
  enable3D = true,
  isEditable = false,
  onImageEdit,
}: any) {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0.3]);

  return (
    <div style={{ width: "100%", minHeight: "100vh", background: "#FDFBF7", overflowX: "hidden", position: "relative" }}>
      {enable3D && <FloatingPetals />}

      {/* ═══ HERO ═══ */}
      <section ref={heroRef} style={{ position: "relative", height: "58vh", minHeight: 320, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        <motion.div style={{ position: "absolute", inset: 0, scale: enable3D ? heroScale : 1 }}>
          <TemplateImage 
            image={coverImage} 
            className="w-full h-full"
            alt="Wedding hero" 
            isEditable={isEditable}
            onEdit={() => onImageEdit?.("cover")}
          />
        </motion.div>
        <motion.div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.38), rgba(0,0,0,0.1) 50%, white)", opacity: heroOpacity, pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 10, textAlign: "center", padding: "0 20px", pointerEvents: "none" }}>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.1 }}>
            <MandalaSVG color="#D4AF37" size={42} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
          </motion.div>
          <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            style={{ fontSize: 8, letterSpacing: "0.38em", color: C.gold, fontWeight: 700, textTransform: "uppercase", marginBottom: 10 }}>
            The Union of
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
            style={{ fontFamily: "Georgia,serif", fontStyle: "italic", fontSize: 38, color: "white", textShadow: "0 2px 20px rgba(0,0,0,0.5)", lineHeight: 1.1, margin: 0 }}>
            {brideName}
            <span style={{ display: "block", fontSize: 18, fontFamily: "sans-serif", fontStyle: "normal", color: C.gold, margin: "6px 0" }}>&amp;</span>
            {groomName}
          </motion.h1>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }} style={{ marginTop: 18 }}>
            <div style={{ width: 28, height: 1, background: C.gold, margin: "0 auto 8px" }} />
            <p style={{ color: "rgba(255,255,255,0.9)", fontSize: 10, fontWeight: 600, letterSpacing: "0.15em" }}>{date}</p>
          </motion.div>
        </div>
      </section>

      {/* ═══ COUNTDOWN ═══ */}
      <section style={{ background: "white", paddingTop: 28 }}>
        <CountdownTimer targetDate={date} theme="royal" />
      </section>

      {/* ═══ WELCOME ═══ */}
      <section style={{ width: "100%", padding: "36px 24px", textAlign: "center", background: "white", boxSizing: "border-box" }}>
        <SectionReveal>
          <LotusSVG color="#D4AF37" size={24} style={{ margin: "0 auto 14px", opacity: 0.3 }} />
          <h2 style={{ fontFamily: "Georgia,serif", fontStyle: "italic", fontSize: 20, color: C.crimson, marginBottom: 12, lineHeight: 1.3 }}>A Celebration of Love</h2>
          <p style={{ fontSize: 12, color: "#4A1515", opacity: 0.7, lineHeight: 1.75, maxWidth: 300, margin: "0 auto" }}>
            {story || "We invite you to witness the beginning of our forever. Surrounded by tradition, heritage, and the blessings of our elders, we begin this sacred journey together."}
          </p>
        </SectionReveal>
      </section>

      {/* ═══ ITINERARY ═══
          Pure 2-col CSS grid with inline styles.
          No Tailwind responsive classes — works in any container width.
      */}
      <section style={{ width: "100%", padding: "36px 16px", background: "#FDFBF7", boxSizing: "border-box" }}>
        <SectionReveal>
          <h2 style={{ fontFamily: "Georgia,serif", fontStyle: "italic", fontSize: 22, color: C.crimson, textAlign: "center", marginBottom: 6 }}>The Itinerary</h2>
          <div style={{ width: 28, height: 1, background: C.gold, margin: "0 auto 20px" }} />
        </SectionReveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8 px-4 md:px-8">
          {events.map((ev: any, i: number) => {
            const isWedding = ev.name.toLowerCase().includes("wedding");
            return (
              <motion.div key={i}
                className="w-full min-h-[220px] md:min-h-[280px] rounded-2xl p-6 md:p-8 shadow-md flex flex-col items-center text-center justify-center relative overflow-hidden"
                style={{ background: isWedding ? C.crimson : "white", border: "1px solid rgba(212,175,55,0.15)" }}
                initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: i * 0.09 }} viewport={{ once: true }}>
                <CornerOrnament className="absolute top-4 left-4" style={{ transform: "scale(0.42)", opacity: 0.2 }} color={isWedding ? C.gold : C.crimson} />
                <div className="w-full aspect-video rounded-xl overflow-hidden mb-4 shadow-sm border border-gold/10">
                  <TemplateImage
                    image={ev.image}
                    alt={ev.name}
                    className="w-full h-full"
                    isEditable={isEditable}
                    onEdit={() => onImageEdit?.("event", i)}
                  />
                </div>
                <h3 style={{ fontFamily: "Georgia,serif", fontStyle: "italic", fontSize: 13, color: isWedding ? "white" : C.crimson, marginBottom: 7, lineHeight: 1.3, wordBreak: "break-word", width: "100%" }}>{ev.name}</h3>
                <div style={{ width: 18, height: 1, background: isWedding ? C.gold : C.crimson, opacity: 0.3, marginBottom: 7 }} />
                <p style={{ fontSize: 9, fontWeight: 600, color: isWedding ? "rgba(255,255,255,0.8)" : "rgba(74,21,21,0.8)", marginBottom: 2 }}>{ev.date}</p>
                <p style={{ fontSize: 8, color: isWedding ? "rgba(255,255,255,0.5)" : "rgba(74,21,21,0.5)", marginBottom: 8 }}>{ev.time}</p>
                <div style={{ borderTop: `1px solid ${isWedding ? "rgba(255,255,255,0.1)" : "rgba(107,30,30,0.1)"}`, paddingTop: 7, width: "100%" }}>
                  <p style={{ fontSize: 8, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, color: isWedding ? "rgba(255,255,255,0.65)" : "rgba(74,21,21,0.65)", lineHeight: 1.4, wordBreak: "break-word" }}>{ev.location}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ═══ GALLERY ═══
          Hero image (index 0) = full width.
          Rest = 2-col grid.
          All explicit heights. No Tailwind breakpoints.
      */}
      <section style={{ width: "100%", padding: "36px 16px", background: "white", boxSizing: "border-box" }}>
        <SectionReveal>
          <h2 style={{ fontFamily: "Georgia,serif", fontStyle: "italic", fontSize: 22, color: C.crimson, textAlign: "center", marginBottom: 6 }}>Photo Gallery</h2>
          <div style={{ width: 28, height: 1, background: C.gold, margin: "0 auto 20px" }} />
        </SectionReveal>
        {galleryImages[0] && (
          <motion.div style={{ width: "100%", height: 200, borderRadius: 12, overflow: "hidden", marginBottom: 8, background: "#F8F3E8" }}
            whileHover={{ scale: 1.01 }} transition={{ duration: 0.3 }}>
            <TemplateImage 
              image={galleryImages[0]} 
              className="w-full h-full" 
              alt="Wedding photo 1" 
              isEditable={isEditable}
              onEdit={() => onImageEdit?.("gallery", 0)}
            />
          </motion.div>
        )}
        {galleryImages.length > 1 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {galleryImages.slice(1).map((img: any, i: number) => (
              <motion.div key={i} style={{ height: 120, borderRadius: 10, overflow: "hidden", background: "#F8F3E8" }}
                whileHover={{ scale: 1.02 }} transition={{ duration: 0.3 }}>
                <TemplateImage 
                  image={img} 
                  className="w-full h-full" 
                  alt={`Wedding photo ${i + 2}`} 
                  isEditable={isEditable}
                  onEdit={() => onImageEdit?.("gallery", i + 1)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* ═══ VENUE & LOCATION ═══ */}
      <VenueLocationSection
        venue={venue} venueAddress={venueAddress} venueCity={venueCity}
        venueState={venueState} venuePin={venuePin}
        googleMapsEmbedUrl={googleMapsEmbedUrl} googleMapsLink={googleMapsLink} coordinates={coordinates}
        ceremonyTime={ceremonyTime} receptionTime={receptionTime}
        nearestAirport={nearestAirport} nearestMetro={nearestMetro} accommodation={accommodation}
      />

      {/* ═══ FOOTER ═══ */}
      <footer style={{ width: "100%", padding: "56px 20px", background: C.crimsonDark, textAlign: "center", position: "relative", overflow: "hidden" }}>
        <SectionReveal>
          <MandalaSVG color="#D4AF37" size={64} style={{ margin: "0 auto 16px", opacity: 0.18 }} />
          <p style={{ fontFamily: "Georgia,serif", fontStyle: "italic", fontSize: 22, color: C.gold, marginBottom: 10 }}>See You There</p>
          <FloralDivider className="my-4 opacity-30" />
          <p style={{ color: "rgba(255,255,255,0.28)", fontSize: 8, textTransform: "uppercase", letterSpacing: "0.28em" }}>
            {brideName} &amp; {groomName} — {date}
          </p>
        </SectionReveal>
      </footer>
    </div>
  );
}