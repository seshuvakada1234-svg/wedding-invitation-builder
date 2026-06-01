/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MapPin, Calendar as CalendarIcon, Clock, Heart, Volume2, VolumeX, Mail, Sparkles, CheckCircle2, Phone, Upload, Map } from "lucide-react";
import TemplateImage from "../TemplateImage";
import { WeddingEvent, EditableImage } from "../../types";
import { formatWeddingDate, formatWeddingTime, getDayOfWeek } from "../../lib/dateUtils";

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
  // State variables matches original HTML screen transitions structure
  const [isOpenManual, setIsOpenManual] = useState(false);
  const [isPlayingIntro, setIsPlayingIntro] = useState(false);
  const isOpen = isOpenManual;

  // Story Image Fallback URL
  const storyImageFallback = "https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=600";

  // Events fallbacks mapped nicely
  const defaultEvents = [
    {
      name: "Haldi",
      date: "2026-12-10",
      time: "10:00",
      location: "Bride's Residence",
      description: "The Golden Glow",
      image: "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?q=80&w=700",
    },
    {
      name: "Mehendi",
      date: "2026-12-10",
      time: "16:00",
      location: "Bride's Residence",
      description: "Art of the Heart",
      image: "https://images.unsplash.com/photo-1595409025192-3566e78b4fde?q=80&w=700",
    },
    {
      name: "Sangeet",
      date: "2026-12-11",
      time: "18:00",
      location: "Sri Venkateswara Function Hall",
      description: "A Night of Music",
      image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=700",
    },
    {
      name: "Wedding",
      date: "2026-12-12",
      time: "19:00",
      location: "Sri Venkateswara Function Hall",
      description: "The Sacred Union Muhurtham: 8:15 PM",
      image: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=700",
    }
  ];

  const displayEvents = events.length > 0 ? events : defaultEvents;

  // Sound State
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const introVideoRef = useRef<HTMLVideoElement | null>(null);

  // Scratch State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isScratched, setIsScratched] = useState(false);
  const [scratching, setScratching] = useState(false);

  // Countdown timer State
  const [timeLeft, setTimeLeft] = useState({
    days: "00",
    hours: "00",
    minutes: "00",
    seconds: "00",
  });

  // RSVP Form state
  const [rsvpForm, setRsvpForm] = useState({
    name: "",
    mobile: "",
    guests: "1",
    attendance: "Will Attend",
    message: "",
  });
  const [rsvpErrors, setRsvpErrors] = useState<Record<string, string>>({});
  const [isSubmittingRSVP, setIsSubmittingRSVP] = useState(false);
  const [showSuccessRSVP, setShowSuccessRSVP] = useState(false);
  const [confettiPieces, setConfettiPieces] = useState<any[]>([]);

  // Dynamically load Google Web Fonts
  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Great+Vibes&family=Poppins:wght@300;400;500&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  // Initialize/Calculate Countdown
  useEffect(() => {
    const targetTime = new Date(`${date}T${weddingTime}:00`).getTime();

    const interval = setInterval(() => {
      const now = Date.now();
      const difference = targetTime - now;

      if (difference <= 0) {
        setTimeLeft({ days: "00", hours: "00", minutes: "00", seconds: "00" });
        clearInterval(interval);
        return;
      }

      const pad = (n: number) => String(Math.max(0, n)).padStart(2, "0");
      const d = Math.floor(difference / (24 * 60 * 60 * 1000));
      const h = Math.floor((difference % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
      const m = Math.floor((difference % (60 * 60 * 1000)) / (60 * 1000));
      const s = Math.floor((difference % (60 * 1000)) / 1000);

      setTimeLeft({
        days: pad(d),
        hours: pad(h),
        minutes: pad(m),
        seconds: pad(s),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [date, weddingTime]);

  // Audio setup
  useEffect(() => {
    audioRef.current = new Audio("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3");
    audioRef.current.loop = true;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const toggleSound = () => {
    if (!audioRef.current) return;
    if (isPlayingMusic) {
      audioRef.current.pause();
      setIsPlayingMusic(false);
    } else {
      audioRef.current.play().catch(err => console.log("Audio play error:", err));
      setIsPlayingMusic(true);
    }
  };

  // Scratch card initial setup & interaction
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    canvas.width = width;
    canvas.height = height;

    // Golden scratch surface
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, "#b8860b");
    grad.addColorStop(0.3, "#e8d48b");
    grad.addColorStop(0.6, "#d4af37");
    grad.addColorStop(1, "#a07820");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Dynamic hint text on top
    ctx.fillStyle = "rgba(80, 50, 0, 0.70)";
    ctx.font = "bold 15px 'Poppins', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("✦ Scratch to Reveal ✦", width / 2, height / 2);
  }, [isOpen]);

  const scratch = (clientX: number, clientY: number) => {
    if (isScratched || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, 26, 0, Math.PI * 2);
    ctx.fill();

    // Check percent scratched
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let cleared = 0;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] < 128) cleared++;
    }
    const percent = cleared / (canvas.width * canvas.height) * 100;
    if (percent > 45) {
      setIsScratched(true);
    }
  };

  const handleOpeningClick = () => {
    // Fade out tap screen, play introduction video
    setIsPlayingIntro(true);

    // Play the audio background music unmuted immediately since user clicked are physically interacting
    if (audioRef.current) {
      audioRef.current.play().then(() => {
        setIsPlayingMusic(true);
      }).catch(err => {
        console.log("Background music autoplay failed on Tap interaction:", err);
      });
    }
  };

  const handleIntroVideoEnded = () => {
    setIsPlayingIntro(false);
    setIsOpenManual(true);
    // Ensure background music is playing
    if (audioRef.current && audioRef.current.paused) {
      audioRef.current.play().then(() => {
        setIsPlayingMusic(true);
      }).catch(err => console.log("Post-intro background music play error:", err));
    }
  };

  // Explicit unmuted/muted play trigger for Intro Video to address browser/mobile autoplay limitations
  useEffect(() => {
    if (isPlayingIntro && introVideoRef.current) {
      const playPromise = introVideoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.log("Autoplay unmuted blocked, trying muted play:", err);
          if (introVideoRef.current) {
            introVideoRef.current.muted = true;
            introVideoRef.current.play().catch(mutedErr => {
              console.error("Muted autoplay also blocked, skipping intro:", mutedErr);
              handleIntroVideoEnded();
            });
          }
        }).catch(() => {
          handleIntroVideoEnded();
        });
      }
    }
  }, [isPlayingIntro]);

  // RSVP Validation
  const validateRSVP = () => {
    const errs: Record<string, string> = {};
    if (!rsvpForm.name.trim()) errs.name = "Please enter your full name.";
    if (!rsvpForm.mobile.trim() || rsvpForm.mobile.replace(/\D/g, "").length < 6) {
      errs.mobile = "Please enter a valid mobile number.";
    }
    setRsvpErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Submit RSVP
  const submitRSVP = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateRSVP()) return;

    setIsSubmittingRSVP(true);

    const waMsg = encodeURIComponent(
`Hello ${groomName} & ${brideName} 💍

*RSVP Confirmation*

Name: ${rsvpForm.name}
Mobile: ${rsvpForm.mobile}
Guests: ${rsvpForm.guests}
Attendance: ${rsvpForm.attendance}
Message: ${rsvpForm.message || "No message."}

We are excited to celebrate with you! 🎊`
    );

    setTimeout(() => {
      setIsSubmittingRSVP(false);
      setShowSuccessRSVP(true);

      // Launch Confetti animations
      const colors = ["#D4AF37", "#FFD700", "#8B0000", "#c0392b", "#ffffff", "#e8d48b"];
      const newPieces = Array.from({ length: 90 }, () => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * -400,
        w: Math.random() * 10 + 5,
        h: Math.random() * 5 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        rot: Math.random() * 360,
        vx: (Math.random() - 0.5) * 3,
        vy: Math.random() * 4 + 2,
        vr: (Math.random() - 0.5) * 6,
      }));
      setConfettiPieces(newPieces);

      // Open WhatsApp
      window.open(`https://wa.me/${whatsappNumber}?text=${waMsg}`, "_blank");
    }, 1000);
  };

  // Mapped gallery fallbacks
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
    "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&q=80&w=800"
  ];

  const getGalleryUrl = (idx: number) => {
    if (galleryImages && galleryImages[idx]) {
      const img = galleryImages[idx];
      return typeof img === "string" ? img : img.url;
    }
    return fallbackGallery[idx];
  };

  return (
    <div className="font-['Poppins',sans-serif] bg-black text-[#d4c5a0] min-h-screen relative overflow-x-hidden select-none">
      
      {/* Dynamic Fonts and Styling */}
      <style>{`
        .display-cinzel { font-family: 'Cinzel', serif; }
        .quote-vibes { font-family: 'Great Vibes', cursive; }
        .gold-glow { text-shadow: 0 0 10px rgba(212, 175, 55, 0.4); }
      `}</style>

      {/* Music floating disk controls */}
      {isOpen && (
        <button
          onClick={toggleSound}
          className="fixed right-6 bottom-6 z-[9990] w-12 h-12 bg-[#8B0000] border border-[#D4AF37]/40 text-[#FFD700] rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95"
          aria-label="Sound player widget"
        >
          {isPlayingMusic ? <Volume2 className="w-5 h-5 animate-bounce" /> : <VolumeX className="w-5 h-5" />}
        </button>
      )}

      {/* Confetti Animation Layer */}
      {showSuccessRSVP && confettiPieces.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-[100002] overflow-hidden">
          {confettiPieces.map((p, idx) => (
            <motion.div
              key={idx}
              className="absolute pointer-events-none select-none"
              initial={{ x: p.x, y: p.y, rotate: p.rot }}
              animate={{
                y: window.innerHeight + 100,
                x: p.x + p.vx * 150,
                rotate: p.rot + p.vr * 150,
              }}
              transition={{ duration: Math.random() * 3 + 2, ease: "linear" }}
              style={{
                width: p.w,
                height: p.h,
                backgroundColor: p.color,
                borderRadius: "2px",
              }}
            />
          ))}
        </div>
      )}

      {/* RSVP Success Modal */}
      <AnimatePresence>
        {showSuccessRSVP && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#000000d0] flex items-center justify-center z-[100001] p-4 text-center select-text"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#0c120f] border border-[#D4AF37]/40 p-8 sm:p-10 rounded-3xl max-w-md w-full relative shadow-2xl"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-[#8B0000] to-[#b01010] rounded-full flex items-center justify-center mx-auto mb-6 border border-[#D4AF37] shadow-[0_0_30px_rgba(212,175,55,0.3)]">
                <CheckCircle2 className="w-10 h-10 text-[#FFD700]" />
              </div>
              <h3 className="quote-vibes text-5xl text-[#D4AF37] mb-3">Thank You!</h3>
              <p className="text-sm text-[#d4c5a0] leading-relaxed mb-6">
                Thank you for confirming your presence. We are thrilled to celebrate with you on <strong className="text-[#FFD700]">{formatWeddingDate(date)} 💍</strong>
              </p>
              <button
                onClick={() => setShowSuccessRSVP(false)}
                className="px-8 py-3 bg-transparent border border-[#D4AF37]/40 text-[#D4AF37] rounded-full text-xs tracking-widest uppercase transition-colors hover:bg-[#D4AF37]/10"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {/* 1. INTRO / TAP LEVEL */}
        {!isOpen && !isPlayingIntro && (
          <motion.div
            key="tap-screen"
            className="fixed inset-0 z-[10000] bg-black flex flex-col items-center justify-center p-6 text-center"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="absolute inset-0 bg-radial-gradient from-[#1a1103] via-black to-black opacity-40 pointer-events-none" />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1 }}
              className="z-10 flex flex-col items-center"
            >
              <div className="quote-vibes text-5xl md:text-6xl text-[#D4AF37] mb-4">You are warmly invited</div>
              <h2 className="display-cinzel text-3xl md:text-4xl text-[#FFD700] tracking-widest font-bold mb-8 uppercase leading-tight">
                {groomName} <span className="text-[#8B0000]">♥</span> {brideName}
              </h2>
              <button
                onClick={handleOpeningClick}
                className="px-10 py-5 bg-[#D4AF37] text-black font-semibold uppercase tracking-widest font-['Cinzel'] rounded-full text-sm md:text-base border border-[#FFD700]/50 hover:bg-[#ffd700] shadow-[0_10px_30px_rgba(212,175,55,0.4)] animate-pulse hover:scale-105 active:scale-95 transition-transform"
              >
                Tap to Open
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* 2. INTRO VIDEO OVERLAY */}
        {isPlayingIntro && (
          <motion.div
            key="intro-video"
            className="fixed inset-0 z-[9999] bg-black cursor-pointer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7 }}
            onClick={handleIntroVideoEnded}
          >
            <video
              ref={introVideoRef}
              src={introVideoUrl}
              autoPlay
              muted
              playsInline
              onEnded={handleIntroVideoEnded}
              onError={handleIntroVideoEnded}
              className="w-full h-full object-cover"
            />
            
            {/* Ambient indicator to tap anywhere */}
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-[10000] flex flex-col items-center gap-2 pointer-events-none text-center">
              <span className="text-white/70 text-xs sm:text-sm uppercase tracking-[0.25em] font-['Cinzel'] animate-pulse gold-glow">
                ✦ Tap anywhere to enter ✦
              </span>
            </div>

            {/* Fallback skip trigger in case browser limits autoplay */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleIntroVideoEnded();
              }}
              className="absolute top-6 right-6 z-[10000] px-6 py-2 bg-black/60 border border-[#D4AF37]/30 text-[#FFD700] rounded-full text-xs font-['Cinzel'] tracking-wider cursor-pointer hover:bg-[#D4AF37]/20 transition-colors"
            >
              Skip Intro
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main website layout */}
      {isOpen && (
        <div className="min-h-screen">
          
          {/* HERO SECTION */}
          <section className="relative h-screen overflow-hidden flex items-center justify-center">
            <video
              src={heroVideoUrl}
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-black/50" />
            
            <div className="relative z-10 text-center px-6 max-w-4xl text-white">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.2, delay: 0.2 }}
              >
                <p className="text-xs tracking-[0.4em] uppercase font-bold text-[#FFD700] mb-4">SAVE THE DATE</p>
                <h1 className="display-cinzel text-5xl sm:text-7xl md:text-8xl font-bold tracking-widest text-[#FFD700] font-normal leading-[1.1] uppercase">
                  {groomName} <span className="quote-vibes text-5xl sm:text-7xl lowercase text-[#8B0000] block sm:inline my-2 sm:my-0 sm:mx-4 font-normal">and</span> {brideName}
                </h1>
                <p className="text-lg sm:text-2xl font-serif text-[#f1e2a6] tracking-wider mt-8">
                  {formatWeddingDate(date)}
                </p>
              </motion.div>
            </div>
          </section>

          {/* SCRATCH TO REVEAL */}
          <section className="py-24 px-6 bg-[#0d1a14] text-center border-t border-[#D4AF37]/15">
            <div className="max-w-2xl mx-auto">
              <h3 className="quote-vibes text-5xl sm:text-6xl text-[#D4AF37] mb-3">Scratch to Reveal</h3>
              <div className="flex items-center justify-center gap-3 text-[#7a6a30] mb-8">
                <span className="w-16 h-px bg-gradient-to-r from-transparent to-[#7a6a30]" />
                <Heart className="w-4 h-4 fill-[#7a6a30]" />
                <span className="w-16 h-px bg-gradient-to-l from-transparent to-[#7a6a30]" />
              </div>

              <div className="scratch-wrapper relative w-[320px] h-[200px] mx-auto rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.6)] cursor-crosshair">
                
                {/* Reveal Area Behind */}
                <div className="absolute inset-0 bg-[#1a2a20] rounded-3xl flex flex-col justify-center items-center p-6">
                  <p className="quote-vibes text-3xl text-[#D4AF37] mb-1">You&apos;re Invited!</p>
                  <p className="display-cinzel text-2xl font-bold text-white tracking-wider mb-2">
                    {formatWeddingDate(date)}
                  </p>
                  <p className="text-xs uppercase tracking-widest text-[#D4AF37] font-semibold mb-3">
                    Saturday
                  </p>
                  <p className="text-xs text-gray-300">
                    🕒 7:00 PM Onwards &nbsp;|&nbsp; 💍 Muhurtham: <span className="text-[#FFD700] font-bold">8:15 PM</span>
                  </p>
                </div>

                {/* Golden Surface Canvas */}
                <canvas
                  ref={canvasRef}
                  id="scratchCanvas"
                  className={`absolute inset-0 rounded-3xl transition-opacity duration-1000 ${isScratched ? "opacity-0 pointer-events-none" : "opacity-100"}`}
                  onMouseDown={(e) => { setScratching(true); scratch(e.clientX, e.clientY); }}
                  onMouseMove={(e) => { if (scratching) scratch(e.clientX, e.clientY); }}
                  onMouseUp={() => setScratching(false)}
                  onMouseLeave={() => setScratching(false)}
                  onTouchStart={(e) => { setScratching(true); scratch(e.touches[0].clientX, e.touches[0].clientY); }}
                  onTouchMove={(e) => { if (scratching) scratch(e.touches[0].clientX, e.touches[0].clientY); }}
                  onTouchEnd={() => setScratching(false)}
                />
              </div>

              {!isScratched && (
                <p className="mt-6 text-[#7a6a30] text-xs font-semibold tracking-widest uppercase">
                  ✦ Scratch the card above ✦
                </p>
              )}
            </div>
          </section>

          {/* COUNTDOWN TIMER */}
          <section className="py-24 px-6 bg-[#080e0a] text-center border-t border-[#D4AF37]/15 relative">
            <div className="max-w-4xl mx-auto">
              <h3 className="quote-vibes text-5xl sm:text-6xl text-[#D4AF37] mb-2">Counting Down</h3>
              <p className="display-cinzel text-xs tracking-[0.3em] text-[#8B0000] uppercase font-bold mb-8">✦ To Our Special Day ✦</p>
              
              <div className="flex items-center justify-center gap-4 sm:gap-6 flex-wrap">
                <div className="cd-block flex flex-col items-center">
                  <div className="w-16 h-20 sm:w-20 sm:h-24 bg-gradient-to-b from-[#1e0a0a] to-[#0c1610] border border-[#D4AF37]/25 rounded-2xl flex items-center justify-center shadow-lg relative">
                    <span className="display-cinzel text-3xl sm:text-4xl font-bold text-[#FFD700]">{timeLeft.days}</span>
                    <div className="absolute left-0 right-0 top-1/2 h-px bg-black/40" />
                  </div>
                  <span className="text-[10px] tracking-widest text-[#8B0000] uppercase font-semibold mt-3">Days</span>
                </div>
                <span className="text-[#D4AF37] text-2xl font-bold pb-6">:</span>

                <div className="cd-block flex flex-col items-center">
                  <div className="w-16 h-20 sm:w-20 sm:h-24 bg-gradient-to-b from-[#1e0a0a] to-[#0c1610] border border-[#D4AF37]/25 rounded-2xl flex items-center justify-center shadow-lg relative">
                    <span className="display-cinzel text-3xl sm:text-4xl font-bold text-[#FFD700]">{timeLeft.hours}</span>
                    <div className="absolute left-0 right-0 top-1/2 h-px bg-black/40" />
                  </div>
                  <span className="text-[10px] tracking-widest text-[#8B0000] uppercase font-semibold mt-3">Hours</span>
                </div>
                <span className="text-[#D4AF37] text-2xl font-bold pb-6">:</span>

                <div className="cd-block flex flex-col items-center">
                  <div className="w-16 h-20 sm:w-20 sm:h-24 bg-gradient-to-b from-[#1e0a0a] to-[#0c1610] border border-[#D4AF37]/25 rounded-2xl flex items-center justify-center shadow-lg relative">
                    <span className="display-cinzel text-3xl sm:text-4xl font-bold text-[#FFD700]">{timeLeft.minutes}</span>
                    <div className="absolute left-0 right-0 top-1/2 h-px bg-black/40" />
                  </div>
                  <span className="text-[10px] tracking-widest text-[#8B0000] uppercase font-semibold mt-3">Minutes</span>
                </div>
                <span className="text-[#D4AF37] text-2xl font-bold pb-6">:</span>

                <div className="cd-block flex flex-col items-center">
                  <div className="w-16 h-20 sm:w-20 sm:h-24 bg-gradient-to-b from-[#1e0a0a] to-[#0c1610] border border-[#D4AF37]/25 rounded-2xl flex items-center justify-center shadow-lg relative">
                    <span className="display-cinzel text-3xl sm:text-4xl font-bold text-[#FFD700]">{timeLeft.seconds}</span>
                    <div className="absolute left-0 right-0 top-1/2 h-px bg-black/40" />
                  </div>
                  <span className="text-[10px] tracking-widest text-[#8B0000] uppercase font-semibold mt-3">Seconds</span>
                </div>
              </div>
            </div>
          </section>

          {/* OUR STORY */}
          <section className="py-24 px-6 bg-[#080e0a] text-center border-t border-[#D4AF37]/15">
            <div className="max-w-4xl mx-auto">
              <h3 className="quote-vibes text-5xl sm:text-6xl text-[#D4AF37] mb-2">Our Story</h3>
              <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-[#8B0000] to-transparent mx-auto mb-12" />

              <div className="flex flex-col md:flex-row items-center gap-12 bg-gradient-to-br from-[#190a0a] to-[#0a140f] border border-[#D4AF37]/20 rounded-3xl p-8 sm:p-12 text-left shadow-2xl relative">
                <div className="w-full md:w-1/3 flex-shrink-0 aspect-[3/4] h-[340px] rounded-2xl overflow-hidden border-2 border-[#D4AF37]/30 shadow-lg relative">
                  <TemplateImage
                    image={getGalleryUrl(0)}
                    alt={`${groomName} & ${brideName}`}
                    className="w-full h-full object-cover"
                    isEditable={isEditable}
                    onEdit={() => onImageEdit?.("gallery", 0)}
                  />
                </div>
                <div className="flex-1">
                  <h4 className="quote-vibes text-4xl text-[#D4AF37] mb-2">{groomName} & {brideName}</h4>
                  <p className="display-cinzel text-[11px] tracking-[0.2em] text-[#8B0000] uppercase font-semibold mb-6">
                    ✦ A Love Written in the Stars ✦
                  </p>
                  <p className="text-[#d4c5a0] text-sm leading-relaxed font-light whitespace-pre-wrap">
                    {story}
                  </p>
                  <div className="flex gap-2 flex-wrap mt-8">
                    <span className="text-[10px] uppercase tracking-widest text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/25 px-4 py-2 rounded-full font-medium">✦ Destined</span>
                    <span className="text-[10px] uppercase tracking-widest text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/25 px-4 py-2 rounded-full font-medium">✦ Forever</span>
                    <span className="text-[10px] uppercase tracking-widest text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/25 px-4 py-2 rounded-full font-medium">✦ {formatWeddingDate(date)}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* DYNAMIC CELEBRATIONS */}
          <section className="py-24 px-6 bg-[#060c09] text-center border-t border-[#D4AF37]/15">
            <div className="max-w-4xl mx-auto">
              <h3 className="quote-vibes text-5xl sm:text-6xl text-[#D4AF37] mb-2">Our Celebrations</h3>
              <p className="display-cinzel text-xs tracking-[0.3em] text-[#8B0000] uppercase font-bold mb-12">✦ Beautiful Joyous Days ✦</p>

              <div className="flex flex-col gap-12 relative">
                {/* Timeline vertical divider rod */}
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-[#8B0000] via-[#D4AF37] to-[#8B0000] transform -translate-x-1/2 hidden md:block opacity-40" />

                {displayEvents.map((evt, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col md:flex-row items-center gap-8 relative select-text ${idx % 2 === 1 ? "md:flex-row-reverse" : ""}`}
                  >
                    {/* Event image card */}
                    <div className="w-full md:w-1/2 flex justify-center">
                      <div className="w-full max-w-sm aspect-[4/3] rounded-2xl overflow-hidden border border-[#D4AF37]/25 shadow-xl relative group">
                        <TemplateImage
                          image={evt.image || getGalleryUrl(idx + 1)}
                          alt={evt.name}
                          className="w-full h-full object-cover"
                          isEditable={isEditable}
                          onEdit={() => onImageEdit?.("gallery", idx + 1)}
                        />
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-transparent duration-500 transition-colors" />
                        <div className="absolute top-4 left-4 bg-[#8B0000]/90 border border-[#D4AF37]/50 text-[#FFD700] rounded-full text-[10px] tracking-widest font-semibold font-['Cinzel'] px-4 py-1.5 uppercase shadow-md select-none">
                          {evt.name}
                        </div>
                      </div>
                    </div>

                    {/* Timeline dot */}
                    <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#8B0000] border-2 border-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.7)] hidden md:block z-10" />

                    {/* Event info card */}
                    <div className="w-full md:w-1/2 px-4 text-left md:px-8">
                      <h4 className="quote-vibes text-4xl text-[#D4AF37] mb-2">{evt.name}</h4>
                      <p className="display-cinzel text-[11px] tracking-[0.25em] text-[#8B0000] uppercase font-bold mb-4">✦ {(evt as any).description || "Celebrating Together"} ✦</p>
                      
                      <div className="flex flex-col gap-3 text-sm text-[#d4c5a0]">
                        <div className="flex items-start gap-3">
                          <span className="text-[#FFD700] text-lg leading-none mt-0.5" role="img" aria-label="Calendar">📅</span>
                          <div>
                            <span className="text-[10px] uppercase tracking-widest text-[#FFD700] block mb-0.5">Date</span>
                            <span className="font-medium text-white">{formatWeddingDate(evt.date)}</span>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <span className="text-[#FFD700] text-lg leading-none mt-0.5" role="img" aria-label="Clock">🕒</span>
                          <div>
                            <span className="text-[10px] uppercase tracking-widest text-[#FFD700] block mb-0.5">Time</span>
                            <span className="font-medium text-white">{formatWeddingTime(evt.time)}</span>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <span className="text-[#FFD700] text-lg leading-none mt-0.5" role="img" aria-label="MapPin">📍</span>
                          <div>
                            <span className="text-[10px] uppercase tracking-widest text-[#FFD700] block mb-0.5">Venue</span>
                            <span className="font-medium text-white block">{evt.location || venue}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CALENDAR SECTION */}
          <section className="py-24 px-6 bg-[#060c09] text-center border-t border-[#D4AF37]/15 select-none">
            <div className="max-w-xl mx-auto">
              <span className="text-4xl block mb-2 animate-bounce">❤️</span>
              <p className="display-cinzel text-xs tracking-[0.4em] text-[#D4AF37] uppercase font-bold mb-8">Save the Date</p>

              {/* December 2026 Grid layout */}
              <div className="rounded-3xl overflow-hidden border border-[#D4AF37]/20 bg-gradient-to-b from-[#140a05] to-[#08120c] shadow-2xl">
                <div className="bg-gradient-to-r from-[#6b0000] to-[#8B0000] p-6 text-[#FFD700]">
                  <h4 className="display-cinzel text-xl font-bold tracking-widest uppercase">December</h4>
                  <p className="text-xs uppercase tracking-[0.4em] mt-1 opacity-60">2 0 2 6</p>
                </div>
                
                <div className="p-6">
                  {/* Days headers */}
                  <div className="grid grid-cols-7 text-xs text-[#8B0000] font-bold uppercase tracking-wider mb-4">
                    <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
                  </div>

                  {/* December days grid starting index on Tuesday */}
                  <div className="grid grid-cols-7 gap-y-4 gap-x-2 text-sm text-[#c8b89a]">
                    <span className="text-transparent"></span>
                    <span className="text-transparent"></span>
                    <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
                    <span>6</span><span>7</span><span>8</span><span>9</span>
                    <span className="bg-[#8b0000]/30 border border-[#8b0000]/60 rounded-full w-8 h-8 flex items-center justify-center text-[#FFD700] font-bold mx-auto">10</span>
                    <span className="bg-[#8b0000]/30 border border-[#8b0000]/60 rounded-full w-8 h-8 flex items-center justify-center text-[#FFD700] font-bold mx-auto">11</span>
                    <span className="bg-[#8b0000] border-2 border-[#D4AF37] rounded-full w-8 h-8 flex items-center justify-center text-[#FFD700] font-bold mx-auto shadow-md relative">
                      12
                      <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 text-[9px] pointer-events-none select-none">💍</span>
                    </span>
                    <span>13</span><span>14</span><span>15</span><span>16</span><span>17</span><span>18</span><span>19</span>
                    <span>20</span><span>21</span><span>22</span><span>23</span><span>24</span><span>25</span><span>26</span>
                    <span>27</span><span>28</span><span>29</span><span>30</span><span>31</span>
                    <span className="text-transparent"></span>
                    <span className="text-transparent"></span>
                    <span className="text-transparent"></span>
                    <span className="text-transparent"></span>
                    <span className="text-transparent"></span>
                  </div>
                </div>

                <div className="p-4 border-t border-[#D4AF37]/15 bg-black/20 text-xs text-left px-6">
                  <div className="flex gap-2 items-center mb-2">
                    <span className="w-3 h-3 rounded-full bg-[#8b0000]/50 border border-[#8B0000]" />
                    <p className="text-[#d4c5a0]"><strong>Dec 10 - Dec 11</strong> — Pre-Wedding Celebrations (Haldi, Mehendi & Sangeet)</p>
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className="w-3 h-3 rounded-full bg-[#8b0000] border border-[#D4AF37]" />
                    <p className="text-[#d4c5a0]"><strong>Dec 12</strong> — The Sacred Wedding Muhurtham 💍</p>
                  </div>
                </div>

                <div className="p-6 border-t border-[#D4AF37]/15">
                  <h5 className="quote-vibes text-3xl text-[#D4AF37] mb-1">{groomName} & {brideName}</h5>
                  <p className="text-xs text-[#d4c5a0] line-clamp-2">
                    📍 {venue}, {venueCity}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* POLAROID PHOTO STREAM */}
          <section className="py-24 px-6 bg-[#060c09] text-center border-t border-[#D4AF37]/15">
            <div className="max-w-4xl mx-auto">
              <h3 className="quote-vibes text-5xl sm:text-6xl text-[#D4AF37] mb-2">Our Moments</h3>
              <p className="display-cinzel text-xs tracking-[0.3em] text-[#8B0000] uppercase font-bold mb-12">✦ Tap to View Gallery ✦</p>

              {/* Grid block responsive representation layout */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 gap-y-10 justify-center">
                {Array.from({ length: 10 }).map((_, idx) => (
                  <motion.div
                    key={idx}
                    whileHover={{ scale: 1.04, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="p-frame bg-white p-2.5 pb-7 rounded shadow-[0_4px_20px_rgba(0,0,0,0.65)] hover:z-10 relative cursor-pointer"
                    style={{
                      transform: `rotate(${(idx % 3 === 0 ? -1.8 : idx % 2 === 0 ? 1.5 : -2.2)}deg)`,
                    }}
                  >
                    <div className="aspect-square bg-neutral-900 rounded-sm overflow-hidden relative group">
                      <TemplateImage
                        image={getGalleryUrl(idx)}
                        alt={`Moment ${idx + 1}`}
                        className="w-full h-full object-cover"
                        isEditable={isEditable}
                        onEdit={() => onImageEdit?.("gallery", idx)}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* MAP / VENUE LOCATION */}
          <section className="py-24 px-6 bg-[#060c09] text-center border-t border-[#D4AF37]/15 select-text">
            <div className="max-w-4xl mx-auto">
              <h3 className="quote-vibes text-5xl sm:text-6xl text-[#D4AF37] mb-2">Find Us</h3>
              <p className="display-cinzel text-xs tracking-[0.3em] text-[#8B0000] uppercase font-bold mb-12">✦ Venue Location ✦</p>

              <div className="rounded-3xl overflow-hidden border border-[#D4AF37]/25 shadow-2xl bg-[#0c120f]">
                {googleMapsEmbedUrl && googleMapsEmbedUrl.trim() !== "" ? (
                  <iframe
                    src={googleMapsEmbedUrl}
                    className="w-full h-[320px] md:h-[420px] border-none grayscale-[20%] contrast-[1.05]"
                    allowFullScreen={false}
                    loading="lazy"
                    title="Google maps location directions"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                ) : (
                  <div className="p-12 text-[#7a6a30] italic">No maps embed link registered</div>
                )}

                <div className="p-6 md:p-8 flex flex-col sm:flex-row justify-between items-center gap-6 border-t border-[#D4AF37]/20">
                  <div className="text-left">
                    <p className="display-cinzel text-lg font-bold text-[#FFD700] mb-1">📍 {venue}</p>
                    <p className="text-sm text-[#d4c5a0]">{venueAddress}</p>
                  </div>
                  {googleMapsLink && (
                    <a
                      href={googleMapsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-8 py-3 bg-[#8B0000] hover:bg-[#b01010] text-[#FFD700] rounded-full text-xs tracking-widest font-['Cinzel'] uppercase border border-[#D4AF37]/35 transition-all shadow-md shrink-0 flex items-center gap-2 select-none"
                    >
                      <Map className="w-3.5 h-3.5" />
                      Get Directions
                    </a>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* RSVP FORM SECTION */}
          <section className="py-24 px-6 bg-[#060c09] text-center border-t border-[#D4AF37]/15">
            <div className="max-w-xl mx-auto select-text">
              <h3 className="quote-vibes text-5xl sm:text-6xl text-[#D4AF37] mb-2">RSVP</h3>
              <p className="display-cinzel text-xs tracking-[0.3em] text-[#8B0000] uppercase font-bold mb-12">✦ Kindly Confirm Your Attendance ✦</p>

              <form onSubmit={submitRSVP} className="bg-gradient-to-b from-[#0c120f] to-black border border-[#D4AF37]/22 p-8 sm:p-12 rounded-3xl text-left shadow-2xl relative select-text">
                <div className="mb-6">
                  <label className="block display-cinzel text-[10px] tracking-widest text-[#D4AF37] uppercase font-semibold mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your name"
                    value={rsvpForm.name}
                    onChange={(e) => setRsvpForm({ ...rsvpForm, name: e.target.value })}
                    className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-sm text-[#f0e6c8] outline-none focus:bg-white/8 transition-all ${rsvpErrors.name ? "border-[#ff6b6b]" : "border-[#D4AF37]/30 focus:border-[#D4AF37]"}`}
                  />
                  {rsvpErrors.name && (
                    <p className="text-[#ff6b6b] text-[10px] uppercase tracking-wider font-semibold mt-1.5 animate-pulse">
                      {rsvpErrors.name}
                    </p>
                  )}
                </div>

                <div className="mb-6">
                  <label className="block display-cinzel text-[10px] tracking-widest text-[#D4AF37] uppercase font-semibold mb-2">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +91 99999 99999"
                    value={rsvpForm.mobile}
                    onChange={(e) => setRsvpForm({ ...rsvpForm, mobile: e.target.value })}
                    className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-sm text-[#f0e6c8] outline-none focus:bg-white/8 transition-all ${rsvpErrors.mobile ? "border-[#ff6b6b]" : "border-[#D4AF37]/30 focus:border-[#D4AF37]"}`}
                  />
                  {rsvpErrors.mobile && (
                    <p className="text-[#ff6b6b] text-[10px] uppercase tracking-wider font-semibold mt-1.5 animate-pulse">
                      {rsvpErrors.mobile}
                    </p>
                  )}
                </div>

                <div className="mb-6">
                  <label className="block display-cinzel text-[10px] tracking-widest text-[#D4AF37] uppercase font-semibold mb-2">
                    Number of Guests
                  </label>
                  <div className="relative">
                    <select
                      value={rsvpForm.guests}
                      onChange={(e) => setRsvpForm({ ...rsvpForm, guests: e.target.value })}
                      className="w-full bg-[#0a1210] border border-[#D4AF37]/30 rounded-xl px-4 py-3 text-sm text-[#f0e6c8] outline-none appearance-none cursor-pointer"
                    >
                      <option value="1">1 — Just me</option>
                      <option value="2">2 — Two of us</option>
                      <option value="3">3 Guests</option>
                      <option value="4">4 Guests</option>
                      <option value="5">5 Guests</option>
                      <option value="6+">6+ Guests</option>
                    </select>
                    <div className="absolute top-1/2 right-4 -translate-y-1/2 text-[#D4AF37] pointer-events-none text-xs select-none">▼</div>
                  </div>
                </div>

                {/* Yes / No Pill triggers */}
                <div className="mb-6 select-none">
                  <label className="block display-cinzel text-[10px] tracking-widest text-[#D4AF37] uppercase font-semibold mb-3">
                    Attendance
                  </label>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setRsvpForm({ ...rsvpForm, attendance: "Will Attend" })}
                      className={`flex-1 py-3 px-4 border rounded-full text-xs font-semibold tracking-wider transition-all duration-300 ${rsvpForm.attendance === "Will Attend" ? "bg-[#D4AF37]/15 border-[#D4AF37] text-[#FFD700] shadow-[0_0_12px_rgba(212,175,55,0.15)]" : "bg-white/30 border-[#D4AF37]/20 text-[#d4c5a0]"}`}
                    >
                      💍 Will Attend
                    </button>
                    <button
                      type="button"
                      onClick={() => setRsvpForm({ ...rsvpForm, attendance: "Decline" })}
                      className={`flex-1 py-3 px-4 border rounded-full text-xs font-semibold tracking-wider transition-all duration-300 ${rsvpForm.attendance === "Decline" ? "bg-[#D4AF37]/15 border-[#D4AF37] text-[#FFD700] shadow-[0_0_12px_rgba(212,175,55,0.15)]" : "bg-white/30 border-[#D4AF37]/20 text-[#d4c5a0]"}`}
                    >
                      🙏 Regret Decline
                    </button>
                  </div>
                </div>

                <div className="mb-8">
                  <label className="block display-cinzel text-[10px] tracking-widest text-[#D4AF37] uppercase font-semibold mb-2">
                    Special Message (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Wishes, greetings, or details..."
                    value={rsvpForm.message}
                    onChange={(e) => setRsvpForm({ ...rsvpForm, message: e.target.value })}
                    className="w-full bg-white/5 border border-[#D4AF37]/30 rounded-xl px-4 py-3 text-sm text-[#f0e6c8] outline-none focus:bg-white/8 focus:border-[#D4AF37] transition-all resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingRSVP}
                  className="w-full bg-gradient-to-r from-[#8B0000] to-[#b01010] hover:from-[#b01010] hover:to-[#d01010] text-[#FFD700] font-['Cinzel'] tracking-[0.25em] font-bold text-xs uppercase py-4 rounded-full border border-[#D4AF37]/40 shadow-lg select-none hover:scale-[1.01] transition-transform flex items-center justify-center gap-2"
                >
                  {isSubmittingRSVP ? (
                    <div className="w-5 h-5 border-2 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin" />
                  ) : (
                    "✦ Confirm RSVP ✦"
                  )}
                </button>
              </form>
            </div>
          </section>

          {/* ELEVANT BRANDING FOOTER */}
          <footer className="py-12 bg-[#080808] text-[#bfa14a] text-center border-t border-[#D4AF37]/15 select-none">
            <p className="text-xs tracking-widest">Made with ❤️ for our Wedding Day</p>
          </footer>

        </div>
      )}

    </div>
  );
}
