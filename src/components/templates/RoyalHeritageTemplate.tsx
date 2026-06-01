/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Volume2, VolumeX, CheckCircle2, Map, Heart } from "lucide-react";
import TemplateImage from "../TemplateImage";
import { WeddingEvent, EditableImage } from "../../types";
import { formatWeddingDate, formatWeddingTime } from "../../lib/dateUtils";

interface RoyalHeritageTemplateProps {
  brideName?: string;
  groomName?: string;
  date?: string;
  weddingTime?: string;
  venue?: string;
  venueAddress?: string;
  venueCity?: string;
  googleMapsLink?: string;
  googleMapsEmbedUrl?: string;
  story?: string;
  events?: WeddingEvent[];
  galleryImages?: (string | EditableImage)[];
  whatsappNumber?: string;
  isEditable?: boolean;
  onImageEdit?: (target: string, index?: number) => void;
  introVideoUrl?: string;
  heroVideoUrl?: string;
  [key: string]: any;
}

export default function RoyalHeritageTemplate({
  brideName = "Sravya",
  groomName = "Akhil",
  date = "2026-12-12",
  weddingTime = "19:00",
  venue = "Sri Venkateswara Function Hall",
  venueAddress = "Hyderabad, Telangana, India",
  venueCity = "Hyderabad",
  googleMapsLink = "https://www.google.com/maps/search/Sri+Venkateswara+Function+Hall+Hyderabad",
  googleMapsEmbedUrl = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3806.5!2d78.4867!3d17.3850!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb99daeaebd2c7%3A0xae93b78392bafbc2!2sSri%20Venkateswara%20Function%20Hall!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin",
  story = "Some meetings are destined — and theirs was one of them. What began as a simple conversation turned into endless laughter, late-night chats, and a friendship that quietly blossomed into something beautiful and rare. Through every moment — the quiet ones and the loud ones — Akhil and Sravya found in each other a home. A love built on trust, laughter, and an unspoken understanding that they were always meant to walk this path together. And now, hand in hand, they step into forever.",
  events = [],
  galleryImages = [],
  whatsappNumber = "919999999999",
  isEditable = false,
  onImageEdit,
  introVideoUrl = "https://pub-4955b83e8ada4ae98b612bd6113cdc4c.r2.dev/VID_20260529_173413.mp4",
  heroVideoUrl = "https://pub-4955b83e8ada4ae98b612bd6113cdc4c.r2.dev/VID_20260530_164923.mp4",
}: RoyalHeritageTemplateProps) {

  // ─── Screen flow ──────────────────────────────────────────────────────────
  // stage: "tap" | "intro" | "main"
  const [stage, setStage] = useState<"tap" | "intro" | "main">("tap");

  // ─── Names overlay timing ─────────────────────────────────────────────────
  // showNames: whether the names div is rendered & fading in
  // fadeOutNames: triggers the fade-out CSS transition
  const [showNames, setShowNames]       = useState(false);
  const [fadeOutNames, setFadeOutNames] = useState(false);

  // ─── Refs ─────────────────────────────────────────────────────────────────
  // tapVideoRef  → muted/paused first-frame background on the tap screen
  // introVideoRef → the actual playing intro
  const tapVideoRef   = useRef<HTMLVideoElement | null>(null);
  const introVideoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef      = useRef<HTMLAudioElement | null>(null);
  const canvasRef     = useRef<HTMLCanvasElement | null>(null);

  // Timers that need cleanup
  const namesTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeOutTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Other state ─────────────────────────────────────────────────────────
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [isScratched, setIsScratched]       = useState(false);
  const [scratching, setScratching]         = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days:"00", hours:"00", minutes:"00", seconds:"00" });
  const [rsvpForm, setRsvpForm] = useState({ name:"", mobile:"", guests:"1", attendance:"Will Attend", message:"" });
  const [rsvpErrors, setRsvpErrors]         = useState<Record<string,string>>({});
  const [isSubmittingRSVP, setIsSubmittingRSVP] = useState(false);
  const [showSuccessRSVP, setShowSuccessRSVP]   = useState(false);
  const [confettiPieces, setConfettiPieces]     = useState<any[]>([]);

  // ─── Default events ───────────────────────────────────────────────────────
  const defaultEvents = [
    { name:"Haldi",   date:"2026-12-10", time:"10:00", location:"Bride's Residence",              description:"The Golden Glow",                       image:"https://images.unsplash.com/photo-1606216794074-735e91aa2c92?q=80&w=700" },
    { name:"Mehendi", date:"2026-12-10", time:"16:00", location:"Bride's Residence",              description:"Art of the Heart",                      image:"https://images.unsplash.com/photo-1595409025192-3566e78b4fde?q=80&w=700" },
    { name:"Sangeet", date:"2026-12-11", time:"18:00", location:"Sri Venkateswara Function Hall", description:"A Night of Music",                      image:"https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=700" },
    { name:"Wedding", date:"2026-12-12", time:"19:00", location:"Sri Venkateswara Function Hall", description:"The Sacred Union Muhurtham: 8:15 PM",   image:"https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=700" },
  ];
  const displayEvents = events.length > 0 ? events : defaultEvents;

  // ─── Gallery fallbacks ────────────────────────────────────────────────────
  const fallbackGallery = [
    "https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=600",
    "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?q=80&w=700",
    "https://images.unsplash.com/photo-1595409025192-3566e78b4fde?q=80&w=700",
    "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=700",
    "https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=700",
    "https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=400",
    "https://images.unsplash.com/photo-1544124499-58912cbddaad?q=80&w=800",
    "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&q=80&w=800",
  ];
  const getGalleryUrl = (idx: number) => {
    if (galleryImages?.[idx]) {
      const img = galleryImages[idx];
      return typeof img === "string" ? img : (img as EditableImage).url;
    }
    return fallbackGallery[idx] ?? fallbackGallery[0];
  };

  // ─── Load Google Fonts ────────────────────────────────────────────────────
  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Great+Vibes&family=Poppins:wght@300;400;500&display=swap";
    link.rel  = "stylesheet";
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  // ─── Countdown ────────────────────────────────────────────────────────────
  useEffect(() => {
    const target = new Date(`${date}T${weddingTime}:00`).getTime();
    const iv = setInterval(() => {
      const diff = target - Date.now();
      if (diff <= 0) { setTimeLeft({ days:"00", hours:"00", minutes:"00", seconds:"00" }); clearInterval(iv); return; }
      const pad = (n: number) => String(Math.max(0,n)).padStart(2,"0");
      setTimeLeft({ days:pad(Math.floor(diff/86400000)), hours:pad(Math.floor((diff%86400000)/3600000)), minutes:pad(Math.floor((diff%3600000)/60000)), seconds:pad(Math.floor((diff%60000)/1000)) });
    }, 1000);
    return () => clearInterval(iv);
  }, [date, weddingTime]);

  // ─── Audio setup ──────────────────────────────────────────────────────────
  useEffect(() => {
    audioRef.current = new Audio("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3");
    audioRef.current.loop = true;
    return () => { audioRef.current?.pause(); audioRef.current = null; };
  }, []);

  const toggleSound = () => {
    if (!audioRef.current) return;
    if (isPlayingMusic) { audioRef.current.pause(); setIsPlayingMusic(false); }
    else { audioRef.current.play().catch(()=>{}); setIsPlayingMusic(true); }
  };

  // ─── Scratch canvas ───────────────────────────────────────────────────────
  useEffect(() => {
    if (stage !== "main" || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const grad = ctx.createLinearGradient(0,0,canvas.width,canvas.height);
    grad.addColorStop(0,"#b8860b"); grad.addColorStop(0.3,"#e8d48b");
    grad.addColorStop(0.6,"#d4af37"); grad.addColorStop(1,"#a07820");
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,canvas.width,canvas.height);
    const shine = ctx.createLinearGradient(0,0,canvas.width,0);
    shine.addColorStop(0,"rgba(255,255,255,0)"); shine.addColorStop(0.5,"rgba(255,255,255,0.18)"); shine.addColorStop(1,"rgba(255,255,255,0)");
    ctx.fillStyle = shine; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = "rgba(80,50,0,0.65)"; ctx.font = "bold 15px 'Poppins',sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("✦ Scratch to Reveal ✦", canvas.width/2, canvas.height/2);
  }, [stage]);

  const scratch = (clientX: number, clientY: number) => {
    if (isScratched || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath(); ctx.arc(clientX-rect.left, clientY-rect.top, 26, 0, Math.PI*2); ctx.fill();
    const data = ctx.getImageData(0,0,canvas.width,canvas.height).data;
    let cleared = 0;
    for (let i=3; i<data.length; i+=4) if (data[i]<128) cleared++;
    if (cleared/(canvas.width*canvas.height)*100 > 45) setIsScratched(true);
  };

  // ─── Clean up overlay timers ──────────────────────────────────────────────
  const clearOverlayTimers = () => {
    if (namesTimerRef.current)   { clearTimeout(namesTimerRef.current);   namesTimerRef.current   = null; }
    if (fadeOutTimerRef.current) { clearTimeout(fadeOutTimerRef.current); fadeOutTimerRef.current = null; }
  };

  // ─── Open wedding website (shared helper) ─────────────────────────────────
  const openMainWebsite = () => {
    clearOverlayTimers();
    setShowNames(false);
    setFadeOutNames(false);
    setStage("main");
    if (audioRef.current?.paused) {
      audioRef.current.play().then(()=>setIsPlayingMusic(true)).catch(()=>{});
    }
  };

  // ─── TAP SCREEN: user taps "Tap To Open" ──────────────────────────────────
  // Transition: tap → intro
  // • Start background music
  // • Switch stage to "intro" → intro video will autoPlay via JSX attribute
  const handleTapToOpen = () => {
    // Start audio
    if (audioRef.current) {
      audioRef.current.play().then(()=>setIsPlayingMusic(true)).catch(()=>{});
    }
    // Reset overlay state for a clean intro
    setShowNames(false);
    setFadeOutNames(false);
    setStage("intro");
  };

  // ─── INTRO VIDEO: started playing ─────────────────────────────────────────
  // Schedule names overlay:
  //   +4 000 ms → show names (fade in)
  //   +6 500 ms → begin fade-out (visible 2.5 s)
  const handleIntroVideoPlay = () => {
    clearOverlayTimers();

    // After 4 s: show names
    namesTimerRef.current = setTimeout(() => {
      setShowNames(true);
      setFadeOutNames(false);

      // After another 2.5 s: fade them out
      fadeOutTimerRef.current = setTimeout(() => {
        setFadeOutNames(true);
      }, 2500);
    }, 4000);
  };

  // ─── INTRO VIDEO: ended ───────────────────────────────────────────────────
  const handleIntroVideoEnded = () => {
    openMainWebsite();
  };

  // ─── INTRO VIDEO: error / fail-safe ──────────────────────────────────────
  const handleIntroVideoError = () => {
    openMainWebsite();
  };

  // ─── Cleanup timers on unmount ────────────────────────────────────────────
  useEffect(() => () => clearOverlayTimers(), []);

  // ─── RSVP ─────────────────────────────────────────────────────────────────
  const validateRSVP = () => {
    const errs: Record<string,string> = {};
    if (!rsvpForm.name.trim()) errs.name = "Please enter your full name.";
    if (!rsvpForm.mobile.trim() || rsvpForm.mobile.replace(/\D/g,"").length < 6) errs.mobile = "Please enter a valid mobile number.";
    setRsvpErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submitRSVP = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateRSVP()) return;
    setIsSubmittingRSVP(true);
    const waMsg = encodeURIComponent(`Hello ${groomName} & ${brideName} 💍\n\n*RSVP Confirmation*\n\nName: ${rsvpForm.name}\nMobile: ${rsvpForm.mobile}\nGuests: ${rsvpForm.guests}\nAttendance: ${rsvpForm.attendance}\nMessage: ${rsvpForm.message||"No message."}\n\nWe are excited to celebrate with you! 🎊`);
    setTimeout(() => {
      setIsSubmittingRSVP(false);
      setShowSuccessRSVP(true);
      const colors = ["#D4AF37","#FFD700","#8B0000","#c0392b","#ffffff","#e8d48b"];
      setConfettiPieces(Array.from({length:90},()=>({ x:Math.random()*window.innerWidth, y:Math.random()*-400, w:Math.random()*10+5, h:Math.random()*5+3, color:colors[Math.floor(Math.random()*colors.length)], rot:Math.random()*360, vx:(Math.random()-0.5)*3, vy:Math.random()*4+2, vr:(Math.random()-0.5)*6 })));
      window.open(`https://wa.me/${whatsappNumber}?text=${waMsg}`,"_blank");
    }, 1000);
  };

  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="font-['Poppins',sans-serif] bg-black text-[#d4c5a0] min-h-screen relative overflow-x-hidden select-none">

      <style>{`
        .dc { font-family:'Cinzel',serif; }
        .gv { font-family:'Great Vibes',cursive; }
        .gg { text-shadow:0 0 18px rgba(212,175,55,0.55); }

        /* Names overlay — individual element fade-ins (triggered by .names-visible class) */
        .names-line {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.8s ease, transform 0.8s ease;
        }
        .names-visible .names-line-1 { opacity:1; transform:translateY(0); transition-delay: 0s;    }
        .names-visible .names-line-2 { opacity:1; transform:translateY(0); transition-delay: 0.35s; }
        .names-visible .names-line-3 { opacity:1; transform:translateY(0); transition-delay: 0.65s; }
        .names-divider {
          width: 0;
          transition: width 0.9s ease 0.5s;
        }
        .names-visible .names-divider { width: 160px; }

        /* Tap-to-open button pulse */
        @keyframes goldenPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(212,175,55,0.5), 0 10px 30px rgba(212,175,55,0.4); }
          50%       { box-shadow: 0 0 0 14px rgba(212,175,55,0), 0 10px 40px rgba(212,175,55,0.6); }
        }
        .btn-tap { animation: goldenPulse 2.2s ease infinite; }

        @keyframes fadeSlideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes scaleIn     { from{opacity:0;transform:scale(0.88)}      to{opacity:1;transform:scale(1)} }
        @keyframes expandW     { from{width:0} to{width:140px} }
      `}</style>

      {/* ── Floating music button (main only) ────────────────────────────── */}
      {stage === "main" && (
        <button
          onClick={toggleSound}
          className="fixed right-6 bottom-6 z-[9990] w-12 h-12 bg-[#8B0000] border border-[#D4AF37]/40 text-[#FFD700] rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform"
          aria-label="Toggle music"
        >
          {isPlayingMusic ? <Volume2 className="w-5 h-5 animate-bounce"/> : <VolumeX className="w-5 h-5"/>}
        </button>
      )}

      {/* ── Confetti ──────────────────────────────────────────────────────── */}
      {showSuccessRSVP && confettiPieces.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-[100002] overflow-hidden">
          {confettiPieces.map((p,i) => (
            <motion.div key={i} className="absolute" initial={{x:p.x,y:p.y,rotate:p.rot}} animate={{y:window.innerHeight+100,x:p.x+p.vx*150,rotate:p.rot+p.vr*150}} transition={{duration:Math.random()*3+2,ease:"linear"}} style={{width:p.w,height:p.h,backgroundColor:p.color,borderRadius:2}}/>
          ))}
        </div>
      )}

      {/* ── RSVP success modal ────────────────────────────────────────────── */}
      <AnimatePresence>
        {showSuccessRSVP && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100001] p-4 text-center">
            <motion.div initial={{scale:0.9,y:20}} animate={{scale:1,y:0}} exit={{scale:0.9,y:20}} className="bg-[#0c120f] border border-[#D4AF37]/40 p-8 sm:p-10 rounded-3xl max-w-md w-full shadow-2xl">
              <div className="w-20 h-20 bg-gradient-to-br from-[#8B0000] to-[#b01010] rounded-full flex items-center justify-center mx-auto mb-6 border border-[#D4AF37] shadow-[0_0_30px_rgba(212,175,55,0.3)]">
                <CheckCircle2 className="w-10 h-10 text-[#FFD700]"/>
              </div>
              <h3 className="gv text-5xl text-[#D4AF37] mb-3">Thank You!</h3>
              <p className="text-sm text-[#d4c5a0] leading-relaxed mb-6">Thank you for confirming your presence. We are thrilled to celebrate with you on <strong className="text-[#FFD700]">{formatWeddingDate(date)} 💍</strong></p>
              <button onClick={()=>setShowSuccessRSVP(false)} className="px-8 py-3 border border-[#D4AF37]/40 text-[#D4AF37] rounded-full text-xs tracking-widest uppercase hover:bg-[#D4AF37]/10 transition-colors">Close</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════════════
          SCREEN FLOW — AnimatePresence handles crossfade between stages
      ══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence mode="wait">

        {/* ── STAGE 1: TAP SCREEN ─────────────────────────────────────────── */}
        {/* Shows FIRST FRAME of intro video (muted, paused) as background.   */}
        {/* No names or wedding text. Only the "Tap To Open" button.           */}
        {stage === "tap" && (
          <motion.div
            key="tap-screen"
            className="fixed inset-0 z-[10000] overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* ── Background: intro video first frame, muted + paused ── */}
            <video
              ref={tapVideoRef}
              src={introVideoUrl}
              muted
              playsInline
              preload="auto"
              className="absolute inset-0 w-full h-full object-cover"
              onLoadedData={(e) => {
                // Seek to first frame and immediately pause
                const v = e.currentTarget;
                v.currentTime = 0;
                v.pause();
              }}
              // If video is already loaded before React mounts onLoadedData, pause it anyway
              onCanPlay={(e) => { e.currentTarget.pause(); }}
            />

            {/* ── Cinematic dark overlay for readability ── */}
            <div className="absolute inset-0 bg-black/60" />

            {/* ── Centered content: ONLY the Tap To Open button ── */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.1, delay: 0.4, ease: "easeOut" }}
              className="relative z-10 h-full flex flex-col items-center justify-center px-6 text-center"
            >
              {/* Decorative top flourish */}
              <div className="mb-8 flex flex-col items-center gap-3">
                <div className="w-px h-16 bg-gradient-to-b from-transparent to-[#D4AF37]/60" />
                <span className="dc text-[10px] tracking-[0.6em] text-[#D4AF37]/70 uppercase">Wedding Invitation</span>
              </div>

              {/* ── The ONLY CTA: large glowing gold Tap To Open button ── */}
              <button
                onClick={handleTapToOpen}
                className="btn-tap relative px-12 py-5 bg-gradient-to-b from-[#D4AF37] to-[#b8960a] text-black font-bold uppercase tracking-[0.25em] dc rounded-full text-sm md:text-base border border-[#FFD700]/60 hover:from-[#FFD700] hover:to-[#d4af37] active:scale-95 transition-all duration-200 select-none"
              >
                <span className="relative z-10">Tap To Open</span>
              </button>

              {/* Decorative bottom flourish */}
              <div className="mt-8 flex flex-col items-center gap-3">
                <div className="w-px h-16 bg-gradient-to-t from-transparent to-[#D4AF37]/60" />
              </div>
            </motion.div>

            {/* Bottom hint */}
            <p className="dc absolute bottom-8 w-full text-center text-[9px] tracking-[0.45em] text-white/30 uppercase select-none pointer-events-none">
              ✦ &nbsp; Swipe up to begin &nbsp; ✦
            </p>
          </motion.div>
        )}

        {/* ── STAGE 2: INTRO VIDEO ─────────────────────────────────────────── */}
        {/* Full-screen playback.                                               */}
        {/* Names overlay fades in at +4 s, fades out at +6.5 s.               */}
        {stage === "intro" && (
          <motion.div
            key="intro-video"
            className="fixed inset-0 z-[9999] bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* ── Intro video — starts from beginning, auto-plays ── */}
            <video
              ref={introVideoRef}
              src={introVideoUrl}
              autoPlay
              playsInline
              onPlay={handleIntroVideoPlay}
              onEnded={handleIntroVideoEnded}
              onError={handleIntroVideoError}
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* ── Permanent cinematic scrim ── */}
            <div className="absolute inset-0 bg-black/40 pointer-events-none" />

            {/* ── Names overlay ──────────────────────────────────────────────
                Outer wrapper controls the overall visibility fade:
                  - Before showNames:   opacity 0, invisible
                  - After showNames:    opacity 1 (individual elements animate in via CSS)
                  - After fadeOutNames: opacity 0 with 1.2 s ease transition
            ── */}
            <div
              className={`absolute inset-0 flex flex-col items-center justify-center text-center px-6 pointer-events-none z-10 ${showNames && !fadeOutNames ? "names-visible" : ""}`}
              style={{
                opacity:    showNames && !fadeOutNames ? 1 : 0,
                transition: fadeOutNames
                  ? "opacity 1.2s ease"          // fade out
                  : showNames
                    ? "opacity 0.4s ease"         // fade in
                    : "none",
              }}
            >
              {/* Line 1: "The Wedding of" */}
              <p className="names-line names-line-1 dc text-[10px] sm:text-xs md:text-sm tracking-[0.55em] text-[#D4AF37] uppercase mb-4 sm:mb-5">
                The Wedding of
              </p>

              {/* Line 2: Groom & Bride names — large, golden, luxury */}
              <h1 className="names-line names-line-2 dc text-4xl sm:text-6xl md:text-7xl font-bold tracking-widest leading-tight uppercase mb-1 sm:mb-2"
                  style={{ color:"#FFD700", textShadow:"0 0 28px rgba(212,175,55,0.7), 0 2px 8px rgba(0,0,0,0.8)" }}>
                {groomName}
                <span className="text-[#8B0000] mx-3 sm:mx-5 text-3xl sm:text-5xl" aria-label="heart">❤️</span>
                {brideName}
              </h1>

              {/* Thin gold divider */}
              <div
                className="names-divider h-px bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent my-4 sm:my-5"
                style={{ maxWidth:"160px" }}
              />

              {/* Line 3: "Wedding" label */}
              <p className="names-line names-line-3 dc text-xs sm:text-sm md:text-base tracking-[0.4em] uppercase font-semibold"
                 style={{ color:"#D4AF37", opacity: undefined /* controlled by parent */ }}>
                Wedding
              </p>
            </div>

            {/* ── Skip button ── */}
            <button
              onClick={(e) => { e.stopPropagation(); openMainWebsite(); }}
              className="absolute top-5 right-5 sm:top-6 sm:right-6 z-[10000] px-4 sm:px-6 py-2 bg-black/60 border border-[#D4AF37]/30 text-[#FFD700] rounded-full text-[10px] sm:text-xs dc tracking-wider hover:bg-[#D4AF37]/20 transition-colors"
            >
              Skip Intro
            </button>
          </motion.div>
        )}

      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════════════
          MAIN WEBSITE (stage === "main")
      ══════════════════════════════════════════════════════════════════════ */}
      {stage === "main" && (
        <div className="min-h-screen">

          {/* ── HERO ──────────────────────────────────────────────────────── */}
          <section className="relative h-screen overflow-hidden flex items-center justify-center">
            <video src={heroVideoUrl} autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover object-center"/>
            <div className="absolute inset-0 bg-black/50"/>
            <div className="relative z-10 text-center px-6 max-w-4xl text-white">
              <motion.div initial={{opacity:0,y:30}} animate={{opacity:1,y:0}} transition={{duration:1.2,delay:0.2}}>
                <p className="dc text-xs tracking-[0.4em] uppercase font-bold text-[#FFD700] mb-4">SAVE THE DATE</p>
                <h1 className="dc text-5xl sm:text-7xl md:text-8xl font-bold tracking-widest text-[#FFD700] leading-[1.1] uppercase">
                  {groomName} <span className="gv text-5xl sm:text-7xl lowercase text-[#8B0000] block sm:inline my-2 sm:my-0 sm:mx-4 font-normal">and</span> {brideName}
                </h1>
                <p className="text-lg sm:text-2xl font-serif text-[#f1e2a6] tracking-wider mt-8">{formatWeddingDate(date)}</p>
              </motion.div>
            </div>
          </section>

          {/* ── SCRATCH TO REVEAL ─────────────────────────────────────────── */}
          <section className="py-24 px-6 bg-[#0d1a14] text-center border-t border-[#D4AF37]/15">
            <div className="max-w-2xl mx-auto">
              <h3 className="gv text-5xl sm:text-6xl text-[#D4AF37] mb-3">Scratch to Reveal</h3>
              <div className="flex items-center justify-center gap-3 text-[#7a6a30] mb-8">
                <span className="w-16 h-px bg-gradient-to-r from-transparent to-[#7a6a30]"/>
                <Heart className="w-4 h-4 fill-[#7a6a30]"/>
                <span className="w-16 h-px bg-gradient-to-l from-transparent to-[#7a6a30]"/>
              </div>
              <div className="relative w-[320px] h-[200px] mx-auto rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.6)] cursor-crosshair">
                <div className="absolute inset-0 bg-[#1a2a20] flex flex-col justify-center items-center p-6">
                  <p className="gv text-3xl text-[#D4AF37] mb-1">You&apos;re Invited!</p>
                  <p className="dc text-2xl font-bold text-white tracking-wider mb-2">{formatWeddingDate(date)}</p>
                  <p className="text-xs uppercase tracking-widest text-[#D4AF37] font-semibold mb-3">Saturday</p>
                  <p className="text-xs text-gray-300">🕒 7:00 PM Onwards &nbsp;|&nbsp; 💍 Muhurtham: <span className="text-[#FFD700] font-bold">8:15 PM</span></p>
                </div>
                <canvas
                  ref={canvasRef}
                  className={`absolute inset-0 rounded-3xl transition-opacity duration-1000 ${isScratched?"opacity-0 pointer-events-none":"opacity-100"}`}
                  onMouseDown={(e)=>{setScratching(true);scratch(e.clientX,e.clientY);}}
                  onMouseMove={(e)=>{if(scratching)scratch(e.clientX,e.clientY);}}
                  onMouseUp={()=>setScratching(false)}
                  onMouseLeave={()=>setScratching(false)}
                  onTouchStart={(e)=>{setScratching(true);scratch(e.touches[0].clientX,e.touches[0].clientY);}}
                  onTouchMove={(e)=>{if(scratching)scratch(e.touches[0].clientX,e.touches[0].clientY);}}
                  onTouchEnd={()=>setScratching(false)}
                />
              </div>
              {!isScratched && <p className="mt-6 text-[#7a6a30] text-xs font-semibold tracking-widest uppercase">✦ Scratch the card above ✦</p>}
            </div>
          </section>

          {/* ── COUNTDOWN ─────────────────────────────────────────────────── */}
          <section className="py-24 px-6 bg-[#080e0a] text-center border-t border-[#D4AF37]/15">
            <div className="max-w-4xl mx-auto">
              <h3 className="gv text-5xl sm:text-6xl text-[#D4AF37] mb-2">Counting Down</h3>
              <p className="dc text-xs tracking-[0.3em] text-[#8B0000] uppercase font-bold mb-8">✦ To Our Special Day ✦</p>
              <div className="flex items-center justify-center gap-4 sm:gap-6 flex-wrap">
                {(["days","hours","minutes","seconds"] as const).map((unit,i)=>(
                  <React.Fragment key={unit}>
                    {i>0 && <span className="text-[#D4AF37] text-2xl font-bold pb-6">:</span>}
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-20 sm:w-20 sm:h-24 bg-gradient-to-b from-[#1e0a0a] to-[#0c1610] border border-[#D4AF37]/25 rounded-2xl flex items-center justify-center shadow-lg relative">
                        <span className="dc text-3xl sm:text-4xl font-bold text-[#FFD700]">{timeLeft[unit]}</span>
                        <div className="absolute left-0 right-0 top-1/2 h-px bg-black/40"/>
                      </div>
                      <span className="text-[10px] tracking-widest text-[#8B0000] uppercase font-semibold mt-3 capitalize">{unit}</span>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>
          </section>

          {/* ── OUR STORY ─────────────────────────────────────────────────── */}
          <section className="py-24 px-6 bg-[#080e0a] text-center border-t border-[#D4AF37]/15">
            <div className="max-w-4xl mx-auto">
              <h3 className="gv text-5xl sm:text-6xl text-[#D4AF37] mb-2">Our Story</h3>
              <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-[#8B0000] to-transparent mx-auto mb-12"/>
              <div className="flex flex-col md:flex-row items-center gap-12 bg-gradient-to-br from-[#190a0a] to-[#0a140f] border border-[#D4AF37]/20 rounded-3xl p-8 sm:p-12 text-left shadow-2xl">
                <div className="w-full md:w-1/3 flex-shrink-0 h-[340px] rounded-2xl overflow-hidden border-2 border-[#D4AF37]/30 shadow-lg">
                  <TemplateImage image={getGalleryUrl(0)} alt={`${groomName} & ${brideName}`} className="w-full h-full object-cover" isEditable={isEditable} onEdit={()=>onImageEdit?.("gallery",0)}/>
                </div>
                <div className="flex-1">
                  <h4 className="gv text-4xl text-[#D4AF37] mb-2">{groomName} &amp; {brideName}</h4>
                  <p className="dc text-[11px] tracking-[0.2em] text-[#8B0000] uppercase font-semibold mb-6">✦ A Love Written in the Stars ✦</p>
                  <p className="text-[#d4c5a0] text-sm leading-relaxed font-light whitespace-pre-wrap">{story}</p>
                  <div className="flex gap-2 flex-wrap mt-8">
                    {["✦ Destined","✦ Forever",`✦ ${formatWeddingDate(date)}`].map(t=>(
                      <span key={t} className="text-[10px] uppercase tracking-widest text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/25 px-4 py-2 rounded-full font-medium">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── CELEBRATIONS ──────────────────────────────────────────────── */}
          <section className="py-24 px-6 bg-[#060c09] text-center border-t border-[#D4AF37]/15">
            <div className="max-w-4xl mx-auto">
              <h3 className="gv text-5xl sm:text-6xl text-[#D4AF37] mb-2">Our Celebrations</h3>
              <p className="dc text-xs tracking-[0.3em] text-[#8B0000] uppercase font-bold mb-12">✦ Beautiful Joyous Days ✦</p>
              <div className="flex flex-col gap-12 relative">
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-[#8B0000] via-[#D4AF37] to-[#8B0000] -translate-x-1/2 hidden md:block opacity-40"/>
                {displayEvents.map((evt,idx)=>(
                  <div key={idx} className={`flex flex-col md:flex-row items-center gap-8 relative select-text ${idx%2===1?"md:flex-row-reverse":""}`}>
                    <div className="w-full md:w-1/2 flex justify-center">
                      <div className="w-full max-w-sm aspect-[4/3] rounded-2xl overflow-hidden border border-[#D4AF37]/25 shadow-xl relative group">
                        <TemplateImage image={evt.image||getGalleryUrl(idx+1)} alt={evt.name} className="w-full h-full object-cover" isEditable={isEditable} onEdit={()=>onImageEdit?.("gallery",idx+1)}/>
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-transparent transition-colors duration-500"/>
                        <div className="absolute top-4 left-4 bg-[#8B0000]/90 border border-[#D4AF37]/50 text-[#FFD700] rounded-full text-[10px] tracking-widest font-semibold dc px-4 py-1.5 uppercase shadow-md">{evt.name}</div>
                      </div>
                    </div>
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#8B0000] border-2 border-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.7)] hidden md:block z-10"/>
                    <div className="w-full md:w-1/2 px-4 md:px-8 text-left">
                      <h4 className="gv text-4xl text-[#D4AF37] mb-2">{evt.name}</h4>
                      <p className="dc text-[11px] tracking-[0.25em] text-[#8B0000] uppercase font-bold mb-4">✦ {(evt as any).description||"Celebrating Together"} ✦</p>
                      <div className="flex flex-col gap-3 text-sm text-[#d4c5a0]">
                        {[{icon:"📅",label:"Date",value:formatWeddingDate(evt.date)},{icon:"🕒",label:"Time",value:formatWeddingTime(evt.time)},{icon:"📍",label:"Venue",value:evt.location||venue}].map(row=>(
                          <div key={row.label} className="flex items-start gap-3">
                            <span className="text-lg leading-none mt-0.5">{row.icon}</span>
                            <div><span className="text-[10px] uppercase tracking-widest text-[#FFD700] block mb-0.5">{row.label}</span><span className="font-medium text-white">{row.value}</span></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── CALENDAR ──────────────────────────────────────────────────── */}
          <section className="py-24 px-6 bg-[#060c09] text-center border-t border-[#D4AF37]/15 select-none">
            <div className="max-w-xl mx-auto">
              <span className="text-4xl block mb-2 animate-bounce">❤️</span>
              <p className="dc text-xs tracking-[0.4em] text-[#D4AF37] uppercase font-bold mb-8">Save the Date</p>
              <div className="rounded-3xl overflow-hidden border border-[#D4AF37]/20 bg-gradient-to-b from-[#140a05] to-[#08120c] shadow-2xl">
                <div className="bg-gradient-to-r from-[#6b0000] to-[#8B0000] p-6 text-[#FFD700]">
                  <h4 className="dc text-xl font-bold tracking-widest uppercase">December</h4>
                  <p className="text-xs uppercase tracking-[0.4em] mt-1 opacity-60">2 0 2 6</p>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-7 text-xs text-[#8B0000] font-bold uppercase tracking-wider mb-4">
                    {["S","M","T","W","T","F","S"].map((d,i)=><span key={i}>{d}</span>)}
                  </div>
                  <div className="grid grid-cols-7 gap-y-4 gap-x-2 text-sm text-[#c8b89a]">
                    <span className="text-transparent"/><span className="text-transparent"/>
                    {[1,2,3,4,5,6,7,8,9].map(d=><span key={d}>{d}</span>)}
                    {[10,11].map(d=><span key={d} className="bg-[#8b0000]/30 border border-[#8b0000]/60 rounded-full w-8 h-8 flex items-center justify-center text-[#FFD700] font-bold mx-auto">{d}</span>)}
                    <span className="bg-[#8b0000] border-2 border-[#D4AF37] rounded-full w-8 h-8 flex items-center justify-center text-[#FFD700] font-bold mx-auto shadow-md relative">12<span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[9px]">💍</span></span>
                    {[13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31].map(d=><span key={d}>{d}</span>)}
                    {[0,0,0,0,0].map((_,i)=><span key={`e${i}`} className="text-transparent"/>)}
                  </div>
                </div>
                <div className="p-4 border-t border-[#D4AF37]/15 bg-black/20 text-xs text-left px-6">
                  <div className="flex gap-2 items-center mb-2"><span className="w-3 h-3 rounded-full bg-[#8b0000]/50 border border-[#8B0000]"/><p className="text-[#d4c5a0]"><strong>Dec 10–11</strong> — Haldi, Mehendi &amp; Sangeet</p></div>
                  <div className="flex gap-2 items-center"><span className="w-3 h-3 rounded-full bg-[#8b0000] border border-[#D4AF37]"/><p className="text-[#d4c5a0]"><strong>Dec 12</strong> — The Sacred Wedding 💍</p></div>
                </div>
                <div className="p-6 border-t border-[#D4AF37]/15">
                  <h5 className="gv text-3xl text-[#D4AF37] mb-1">{groomName} &amp; {brideName}</h5>
                  <p className="text-xs text-[#d4c5a0]">📍 {venue}, {venueCity}</p>
                </div>
              </div>
            </div>
          </section>

          {/* ── GALLERY ───────────────────────────────────────────────────── */}
          <section className="py-24 px-6 bg-[#060c09] text-center border-t border-[#D4AF37]/15">
            <div className="max-w-4xl mx-auto">
              <h3 className="gv text-5xl sm:text-6xl text-[#D4AF37] mb-2">Our Moments</h3>
              <p className="dc text-xs tracking-[0.3em] text-[#8B0000] uppercase font-bold mb-12">✦ Tap to View Gallery ✦</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 gap-y-10">
                {Array.from({length:10}).map((_,idx)=>(
                  <motion.div key={idx} whileHover={{scale:1.04,rotate:0}} transition={{type:"spring",stiffness:300}} className="bg-white p-2.5 pb-7 rounded shadow-[0_4px_20px_rgba(0,0,0,0.65)] hover:z-10 relative cursor-pointer" style={{transform:`rotate(${idx%3===0?-1.8:idx%2===0?1.5:-2.2}deg)`}}>
                    <div className="aspect-square bg-neutral-900 rounded-sm overflow-hidden">
                      <TemplateImage image={getGalleryUrl(idx)} alt={`Moment ${idx+1}`} className="w-full h-full object-cover" isEditable={isEditable} onEdit={()=>onImageEdit?.("gallery",idx)}/>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* ── MAP ───────────────────────────────────────────────────────── */}
          <section className="py-24 px-6 bg-[#060c09] text-center border-t border-[#D4AF37]/15 select-text">
            <div className="max-w-4xl mx-auto">
              <h3 className="gv text-5xl sm:text-6xl text-[#D4AF37] mb-2">Find Us</h3>
              <p className="dc text-xs tracking-[0.3em] text-[#8B0000] uppercase font-bold mb-12">✦ Venue Location ✦</p>
              <div className="rounded-3xl overflow-hidden border border-[#D4AF37]/25 shadow-2xl bg-[#0c120f]">
                {googleMapsEmbedUrl?.trim() ? (
                  <iframe src={googleMapsEmbedUrl} className="w-full h-[320px] md:h-[420px] border-none" style={{filter:"grayscale(20%) contrast(1.05)"}} allowFullScreen={false} loading="lazy" title="Venue map" referrerPolicy="no-referrer-when-downgrade"/>
                ) : (
                  <div className="p-12 text-[#7a6a30] italic">No maps embed link registered</div>
                )}
                <div className="p-6 md:p-8 flex flex-col sm:flex-row justify-between items-center gap-6 border-t border-[#D4AF37]/20">
                  <div className="text-left">
                    <p className="dc text-lg font-bold text-[#FFD700] mb-1">📍 {venue}</p>
                    <p className="text-sm text-[#d4c5a0]">{venueAddress}</p>
                  </div>
                  {googleMapsLink && (
                    <a href={googleMapsLink} target="_blank" rel="noopener noreferrer" className="px-8 py-3 bg-[#8B0000] hover:bg-[#b01010] text-[#FFD700] rounded-full text-xs tracking-widest dc uppercase border border-[#D4AF37]/35 transition-all shadow-md shrink-0 flex items-center gap-2">
                      <Map className="w-3.5 h-3.5"/> Get Directions
                    </a>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* ── RSVP ──────────────────────────────────────────────────────── */}
          <section className="py-24 px-6 bg-[#060c09] text-center border-t border-[#D4AF37]/15">
            <div className="max-w-xl mx-auto select-text">
              <h3 className="gv text-5xl sm:text-6xl text-[#D4AF37] mb-2">RSVP</h3>
              <p className="dc text-xs tracking-[0.3em] text-[#8B0000] uppercase font-bold mb-12">✦ Kindly Confirm Your Attendance ✦</p>
              <form onSubmit={submitRSVP} className="bg-gradient-to-b from-[#0c120f] to-black border border-[#D4AF37]/20 p-8 sm:p-12 rounded-3xl text-left shadow-2xl">

                {/* Name */}
                <div className="mb-6">
                  <label className="block dc text-[10px] tracking-widest text-[#D4AF37] uppercase font-semibold mb-2">Full Name</label>
                  <input type="text" placeholder="Enter your name" value={rsvpForm.name} onChange={e=>setRsvpForm({...rsvpForm,name:e.target.value})} className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-sm text-[#f0e6c8] outline-none transition-all ${rsvpErrors.name?"border-[#ff6b6b]":"border-[#D4AF37]/30 focus:border-[#D4AF37]"}`}/>
                  {rsvpErrors.name && <p className="text-[#ff6b6b] text-[10px] uppercase tracking-wider font-semibold mt-1.5 animate-pulse">{rsvpErrors.name}</p>}
                </div>

                {/* Mobile */}
                <div className="mb-6">
                  <label className="block dc text-[10px] tracking-widest text-[#D4AF37] uppercase font-semibold mb-2">Mobile Number</label>
                  <input type="tel" placeholder="e.g. +91 99999 99999" value={rsvpForm.mobile} onChange={e=>setRsvpForm({...rsvpForm,mobile:e.target.value})} className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-sm text-[#f0e6c8] outline-none transition-all ${rsvpErrors.mobile?"border-[#ff6b6b]":"border-[#D4AF37]/30 focus:border-[#D4AF37]"}`}/>
                  {rsvpErrors.mobile && <p className="text-[#ff6b6b] text-[10px] uppercase tracking-wider font-semibold mt-1.5 animate-pulse">{rsvpErrors.mobile}</p>}
                </div>

                {/* Guests */}
                <div className="mb-6">
                  <label className="block dc text-[10px] tracking-widest text-[#D4AF37] uppercase font-semibold mb-2">Number of Guests</label>
                  <div className="relative">
                    <select value={rsvpForm.guests} onChange={e=>setRsvpForm({...rsvpForm,guests:e.target.value})} className="w-full bg-[#0a1210] border border-[#D4AF37]/30 rounded-xl px-4 py-3 text-sm text-[#f0e6c8] outline-none appearance-none cursor-pointer">
                      <option value="1">1 — Just me</option><option value="2">2 — Two of us</option><option value="3">3 Guests</option><option value="4">4 Guests</option><option value="5">5 Guests</option><option value="6+">6+ Guests</option>
                    </select>
                    <div className="absolute top-1/2 right-4 -translate-y-1/2 text-[#D4AF37] pointer-events-none text-xs">▼</div>
                  </div>
                </div>

                {/* Attendance */}
                <div className="mb-6 select-none">
                  <label className="block dc text-[10px] tracking-widest text-[#D4AF37] uppercase font-semibold mb-3">Attendance</label>
                  <div className="flex gap-4">
                    {[{val:"Will Attend",label:"💍 Will Attend"},{val:"Decline",label:"🙏 Regret Decline"}].map(opt=>(
                      <button key={opt.val} type="button" onClick={()=>setRsvpForm({...rsvpForm,attendance:opt.val})} className={`flex-1 py-3 px-4 border rounded-full text-xs font-semibold tracking-wider transition-all duration-300 ${rsvpForm.attendance===opt.val?"bg-[#D4AF37]/15 border-[#D4AF37] text-[#FFD700]":"bg-white/5 border-[#D4AF37]/20 text-[#d4c5a0]"}`}>{opt.label}</button>
                    ))}
                  </div>
                </div>

                {/* Message */}
                <div className="mb-8">
                  <label className="block dc text-[10px] tracking-widest text-[#D4AF37] uppercase font-semibold mb-2">Special Message (Optional)</label>
                  <textarea rows={3} placeholder="Wishes, greetings, or details..." value={rsvpForm.message} onChange={e=>setRsvpForm({...rsvpForm,message:e.target.value})} className="w-full bg-white/5 border border-[#D4AF37]/30 rounded-xl px-4 py-3 text-sm text-[#f0e6c8] outline-none focus:border-[#D4AF37] transition-all resize-none"/>
                </div>

                {/* Submit */}
                <button type="submit" disabled={isSubmittingRSVP} className="w-full bg-gradient-to-r from-[#8B0000] to-[#b01010] hover:from-[#b01010] hover:to-[#d01010] text-[#FFD700] dc tracking-[0.25em] font-bold text-xs uppercase py-4 rounded-full border border-[#D4AF37]/40 shadow-lg hover:scale-[1.01] transition-transform flex items-center justify-center gap-2">
                  {isSubmittingRSVP ? <div className="w-5 h-5 border-2 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin"/> : "✦ Confirm RSVP ✦"}
                </button>
              </form>
            </div>
          </section>

          {/* ── FOOTER ────────────────────────────────────────────────────── */}
          <footer className="py-12 bg-[#080808] text-[#bfa14a] text-center border-t border-[#D4AF37]/15 select-none">
            <p className="text-xs tracking-widest">Made with ❤️ for our Wedding Day</p>
          </footer>

        </div>
      )}

    </div>
  );
}
