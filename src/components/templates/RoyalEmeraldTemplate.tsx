"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MapPin, Calendar, Clock, Volume2, VolumeX, Mail, Sparkles, CheckCircle2 } from "lucide-react";
import TemplateImage from "../TemplateImage";
import { formatWeddingDate, formatWeddingTime } from "../../lib/dateUtils";

interface WeddingEvent {
  name: string;
  date: string;
  time: string;
  location: string;
  description?: string;
  image?: string | any;
}

interface RoyalEmeraldTemplateProps {
  brideName?: string;
  groomName?: string;
  date?: string;
  weddingTime?: string;
  venue?: string;
  venueAddress?: string;
  venueCity?: string;
  googleMapsLink?: string;
  googleMapsEmbedUrl?: string;
  coordinates?: string;
  coverImage?: string;
  storyImage?: string;
  events?: WeddingEvent[];
  galleryImages?: string[];
  story?: string;
  enableEnvelope?: boolean;
  isEditable?: boolean;
  onImageEdit?: (target: string, index?: number) => void;
  [key: string]: any;
}

export default function RoyalEmeraldTemplate({
  brideName = "Zara",
  groomName = "Rayan",
  date = "2026-12-31",
  weddingTime = "10:00",
  venue = "The Grand Palace Convention",
  venueAddress = "Banjara Hills, Hyderabad, Telangana",
  venueCity = "Hyderabad",
  googleMapsLink = "https://maps.google.com/?q=Banjara+Hills+Hyderabad+Telangana",
  googleMapsEmbedUrl = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3806.697!2d78.4486!3d17.4126!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb977b00000001%3A0x1!2sBanjara+Hills%2C+Hyderabad%2C+Telangana!5e0!3m2!1sen!2sin!4v1",
  coordinates = "",
  coverImage = "https://pub-4955b83e8ada4ae98b612bd6113cdc4c.r2.dev/download%20(8).jpg",
  storyImage = "https://pub-4955b83e8ada4ae98b612bd6113cdc4c.r2.dev/download%20(12).jpg",
  events = [],
  galleryImages = [],
  story = "What began as a chance meeting blossomed into a journey neither of us could have imagined. Two souls drawn together by fate, laughter, and an unspoken understanding that felt like coming home. Through quiet sunsets and loud celebrations, through every ordinary moment that became extraordinary simply because we shared it — we knew. This was forever.",
  enableEnvelope = true,
  isEditable = false,
  onImageEdit,
}: RoyalEmeraldTemplateProps) {
  // Opening Door State
  const [isOpenManual, setIsOpenManual] = useState(false);
  const isOpen = !enableEnvelope || isOpenManual;

  // Sound State
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Scratch State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const [isScratchedPercent, setIsScratchedPercent] = useState(0);
  const [scratching, setScratching] = useState(false);
  const drawingPathRef = useRef<Array<{ x: number; y: number }>>([]);

  // Countdown timer State
  const [timeLeft, setTimeLeft] = useState({
    days: "00",
    hours: "00",
    minutes: "00",
    seconds: "00",
  });

  // Dynamically load Google Web Fonts
  useEffect(() => {
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Great+Vibes&family=Cinzel:wght@400;600;700&display=swap";
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
    // Elegant background classical schema string
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
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.log("Audio play deferred or blocked by user guest settings: ", err);
      });
    }
  };

  const handleOpenDoors = () => {
    setIsOpenManual(true);
    // Play audio automatically if allowed by browser sandbox rules
    if (audioRef.current) {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
         console.warn("Autoplay deferred or blocked which is perfectly expected in browser environments", err);
      });
    }
  };

  // Scratch Area Canvas Setup & Resize
  const drawGoldLayer = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.clearRect(0, 0, width, height);

    // Create luxurious gold metallic gradient
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0.00, '#c8a84b');
    grad.addColorStop(0.20, '#e8d07a');
    grad.addColorStop(0.45, '#f5e6a3');
    grad.addColorStop(0.60, '#d4af37');
    grad.addColorStop(0.80, '#b8860b');
    grad.addColorStop(1.00, '#c8a84b');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Dust/Sparkle Effect
    ctx.globalAlpha = 0.08;
    for (let i = 0; i < 2000; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? '#fff' : '#000';
      ctx.fillRect(Math.random() * width, Math.random() * height, 1, 1);
    }
    ctx.globalAlpha = 1.0;

    // Engraved design borders
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(12, 12, width - 24, height - 24);

    ctx.strokeStyle = "rgba(0,0,0,0.15)";
    ctx.lineWidth = 1;
    ctx.strokeRect(15, 15, width - 30, height - 30);

    // Prompt Text
    ctx.fillStyle = 'rgba(4, 49, 38, 0.75)';
    ctx.font = `italic bold ${Math.max(14, Math.floor(width * 0.052))}px 'Cinzel', serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✦  Scratch to Reveal  ✦', width / 2, height / 2);
  };

  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) {
      // Retry in short moment if ref and structure is mounting after door animation runs
      const timer = setTimeout(() => {
        initCanvas();
      }, 350);
      return () => clearTimeout(timer);
    }

    initCanvas();

    function initCanvas() {
      const parent = canvasContainerRef.current;
      const canvasEl = canvasRef.current;
      if (!canvasEl || !parent) return;

      const rect = parent.getBoundingClientRect();
      canvasEl.width = rect.width || 360;
      canvasEl.height = 280; // Standard block height matching container

      const ctx = canvasEl.getContext("2d");
      if (ctx) {
        drawGoldLayer(ctx, canvasEl.width, canvasEl.height);
      }
    }

    window.addEventListener("resize", initCanvas);
    return () => window.removeEventListener("resize", initCanvas);
  }, [isOpen]);

  const calculateScratchRatio = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    try {
      const imgData = ctx.getImageData(0, 0, width, height);
      const data = imgData.data;
      let alphaCount = 0;
      // Sampling pixels to be fast and lightweight
      for (let i = 3; i < data.length; i += 40) {
        if (data[i] === 0) {
          alphaCount++;
        }
      }
      const ratio = alphaCount / (data.length / 40);
      return ratio;
    } catch (e) {
      return 0;
    }
  };

  const handleScratchAction = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    const ratio = calculateScratchRatio(ctx, canvas.width, canvas.height);
    setIsScratchedPercent(ratio);
  };

  // Safe checks for customizable events
  const defaultEventsList: WeddingEvent[] = [
    {
      name: "Haldi",
      date: "2026-12-29",
      time: "10:00",
      location: "Family Residence, Hyderabad",
      description: "A radiant ritual of turmeric and blessings — where golden paste meets golden hearts, and laughter fills the air as we welcome the family.",
      image: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&q=80"
    },
    {
      name: "Sangeet",
      date: "2026-12-29",
      time: "18:00",
      location: "Grand Ballroom, Taj Hotel, Hyderabad",
      description: "An evening of music, dance, and pure joy — where two families come together as one, celebrating love through song.",
      image: "https://images.unsplash.com/photo-1604017011826-d3b4c23f8914?w=800&q=80"
    },
    {
      name: "Mehndi",
      date: "2026-12-30",
      time: "11:00",
      location: "Family Residence, Hyderabad",
      description: "As intricate patterns are drawn, mehndi weaves the bride's dreams onto her hands — an age-old art of beauty.",
      image: "https://images.unsplash.com/photo-1591181520189-abcb0735c65d?w=800&q=80"
    }
  ];

  const currentEvents = events.length > 0 ? events : defaultEventsList;

  // Safe checks for gallery images
  const defaultGallery = [
    "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&q=80&w=800",
    "https://pub-4955b83e8ada4ae98b612bd6113cdc4c.r2.dev/download%20(12).jpg",
    "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800"
  ];
  const finalGallery = galleryImages.length > 0 ? galleryImages : defaultGallery;

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-[#021a14] text-white selection:bg-[#d4af37]/30 selection:text-[#d4af37] font-serif">
      
      {/* ── AUDIO TOGGLE ── */}
      {isOpen && (
        <button
          onClick={toggleSound}
          className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-12 h-12 rounded-full bg-[#073024]/90 border border-[#d4af37]/40 text-[#d4af37] shadow-xl backdrop-blur-md hover:bg-[#d4af37] hover:text-[#021a14] hover:border-[#d4af37] transition-all"
        >
          {isPlaying ? <Volume2 size={18} className="animate-pulse" /> : <VolumeX size={18} />}
        </button>
      )}

      {/* ── ENVELOPE / DOORS ── */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            key="doors-overlay"
            className="fixed inset-0 z-[1000] flex overflow-hidden select-none"
            exit={{ opacity: 0, transition: { delay: 1.0, duration: 0.6 } }}
          >
            {/* Left Door Panel */}
            <motion.div
              className="w-1/2 h-full relative"
              style={{
                transformOrigin: "left center",
                background: "radial-gradient(circle at 20% 30%, #0d6b52 0%, #043126 55%), radial-gradient(circle at 80% 70%, #02231c 40%, #011510 100%)",
                boxShadow: "inset -4px 0 60px rgba(0,0,0,0.6), inset 0 0 80px rgba(0,0,0,0.4)"
              }}
              exit={{
                rotateY: -100,
                transition: { duration: 1.8, ease: [0.645, 0.045, 0.355, 1.0] }
              }}
            >
              {/* Inner edge gold lines */}
              <div className="absolute right-0 top-0 bottom-0 py-0 px-2 flex gap-1 h-full select-none pointer-events-none">
                <div className="w-[1px] h-full bg-[#d4af37]/80 shadow-[0_0_6px_#d4af37] opacity-85" />
                <div className="w-[2px] h-full bg-[#d4af37]/80 shadow-[0_0_6px_#d4af37] opacity-85" />
                <div className="w-[1px] h-full bg-[#d4af37]/80 shadow-[0_0_6px_#d4af37] opacity-85" />
              </div>
            </motion.div>

            {/* Right Door Panel */}
            <motion.div
              className="w-1/2 h-full relative"
              style={{
                transformOrigin: "right center",
                background: "radial-gradient(circle at 80% 30%, #0d6b52 0%, #043126 55%), radial-gradient(circle at 20% 70%, #02231c 40%, #011510 100%)",
                boxShadow: "inset 4px 0 60px rgba(0,0,0,0.6), inset 0 0 80px rgba(0,0,0,0.4)"
              }}
              exit={{
                rotateY: 100,
                transition: { duration: 1.8, ease: [0.645, 0.045, 0.355, 1.0] }
              }}
            >
              {/* Inner edge gold lines */}
              <div className="absolute left-0 top-0 bottom-0 py-0 px-2 flex gap-1 h-full select-none pointer-events-none font-sans">
                <div className="w-[1px] h-full bg-[#d4af37]/80 shadow-[0_0_6px_#d4af37] opacity-85" />
                <div className="w-[2px] h-full bg-[#d4af37]/80 shadow-[0_0_6px_#d4af37] opacity-85" />
                <div className="w-[1px] h-full bg-[#d4af37]/80 shadow-[0_0_6px_#d4af37] opacity-85" />
              </div>
            </motion.div>

            {/* Central Seal Button */}
            <motion.button
              onClick={handleOpenDoors}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1050] outline-none group cursor-pointer"
              exit={{
                scale: 0.8,
                opacity: 0,
                transition: { duration: 0.5, ease: "easeInOut" }
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="w-28 h-28 md:w-32 md:h-32 rounded-full border-2 border-[#d4af37] flex flex-col items-center justify-center p-1 relative shadow-[0_0_30px_rgba(212,175,55,0.4)] bg-gradient-to-r from-[#0a6b50] via-[#053d2c] to-[#021f18]">
                {/* Gold Outer Glow Ring */}
                <span className="absolute inset-[-4px] rounded-full border border-[#d4af37]/20 animate-ping pointer-events-none" />
                <span className="text-[#d4af37] font-serif text-[44px] md:text-[54px] font-bold leading-none select-none tracking-tight">
                  {brideName && brideName[0]}
                </span>
                <span className="text-[#d4af37] font-sans text-[8px] md:text-[9px] uppercase tracking-[4px] font-semibold mt-1">
                  Open
                </span>
              </div>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MAIN CONTENT PAGE ── */}
      <div className={`transition-all duration-1000 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 h-screen overflow-hidden pointer-events-none"}`}>
        
        {/* ── HERO BANNER ── */}
        <section id="hero-emerald" className="relative h-screen overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 z-0 select-none">
            <TemplateImage
              image={coverImage}
              alt="Emerald Wedding Banner"
              className="w-full h-full brightness-[0.4] object-cover scale-[1.01]"
              isEditable={isEditable}
              onImageChange={(file) => {
                // Allows direct builder file changes to call external handles
                if (onImageEdit) {
                  onImageEdit("cover");
                }
              }}
              onEdit={() => onImageEdit?.("cover")}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#021a14]/60 via-transparent to-[#021a14]/90" />
          </div>

          <div className="relative z-10 text-center px-4 max-w-4xl mx-auto flex flex-col justify-center items-center h-full pt-16">
            <span className="text-[#d4af37] font-serif italic text-bold text-lg tracking-[0.25em] uppercase mb-4 opacity-90">
              The Wedding Celebration of
            </span>
            <h1 className="text-5xl md:text-8xl font-serif text-[#fefdfa] mb-4 tracking-wide font-medium leading-tight">
              {brideName} <span className="font-sans text-3xl md:text-5xl font-light text-[#d4af37] inline-block opacity-80 mx-2">&amp;</span> {groomName}
            </h1>
            <div className="w-24 h-[1.5px] bg-[#d4af37]/60 my-6" />
            <p className="text-xl md:text-3xl font-serif text-[#d4af37] italic tracking-wider mb-2">
              {formatWeddingDate(date)}
            </p>
            <p className="text-sm md:text-base font-sans tracking-[0.3em] font-normal opacity-80 uppercase bg-[#042d22]/40 backdrop-blur-sm py-2 px-6 rounded-full border border-[#d4af37]/20 mt-2">
              {venueCity} · {venue}
            </p>
          </div>

          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-center text-xs text-[#d4af37]/60 tracking-[0.2em] uppercase animate-bounce select-none">
            Scroll To Reveal ✦
          </div>
        </section>

        {/* ── SCRATCH TO REVEAL CONTAINER ── */}
        <section id="scratch-reveal-block" className="relative bg-gradient-to-b from-[#021a14] via-[#052b21] to-[#021a14] py-20 px-4 md:px-8 border-y border-[#d4af37]/15">
          <div className="max-w-2xl mx-auto text-center flex flex-col items-center">
            
            <span className="text-[#d4af37] text-3xl mb-1">♛</span>
            <h3 className="section-title text-[#d4af37] font-semibold text-4xl md:text-5xl tracking-wide mb-3 flex items-center gap-3">
              Scratch to Reveal
            </h3>
            
            <div className="flex items-center gap-4 w-full justify-center max-w-[280px] mb-8">
              <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#d4af37]/60 to-transparent" />
              <span className="text-[#d4af37]/60 text-xs font-serif">♥</span>
              <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#d4af37]/60 to-transparent" />
            </div>

            {/* Interactive Scratch Wrap */}
            <div 
              ref={canvasContainerRef}
              className="relative w-full max-w-[360px] rounded-2xl overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.7)] border border-[#d4af37]/35 aspect-[360/280] touch-none mb-4 bg-[#08221b]"
            >
              {/* Inner Secret Invitation Detail Layer */}
              <div className="absolute inset-0 bg-[#041d16] p-6 flex flex-col items-center justify-center text-center">
                <span className="font-serif italic text-2xl text-[#d4af37] mb-2 font-medium">Zara & Rayan Invitation</span>
                <div className="w-12 h-[1px] bg-[#d4af37]/45 my-2" />
                <p className="text-[10px] uppercase text-[#d4af37] tracking-[0.25em] mb-3">You Are Invited!</p>
                <p className="text-xl text-[#fefdfa] font-serif font-bold tracking-wider mb-1">
                  {formatWeddingDate(date)}
                </p>
                <p className="text-xs text-[#d4af37] italic font-serif mb-2">
                  {formatWeddingTime(weddingTime)}
                </p>
                <p className="text-[10px] text-neutral-300 font-sans tracking-[0.1em] opacity-80 uppercase leading-relaxed max-w-[280px]">
                  {venue} <br /> {venueAddress}
                </p>
              </div>

              {/* Dynamic scratch canvas */}
              {isScratchedPercent < 0.60 && (
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full cursor-crosshair z-20 outline-none select-none"
                  onMouseDown={(e) => {
                    setScratching(true);
                    handleScratchAction(e.clientX, e.clientY);
                  }}
                  onMouseMove={(e) => {
                    if (scratching) handleScratchAction(e.clientX, e.clientY);
                  }}
                  onMouseUp={() => setScratching(false)}
                  onMouseLeave={() => setScratching(false)}
                  onTouchStart={(e) => {
                    setScratching(true);
                    if (e.touches[0]) {
                      handleScratchAction(e.touches[0].clientX, e.touches[0].clientY);
                    }
                  }}
                  onTouchMove={(e) => {
                    if (scratching && e.touches[0]) {
                      handleScratchAction(e.touches[0].clientX, e.touches[0].clientY);
                    }
                  }}
                  onTouchEnd={() => setScratching(false)}
                  style={{
                    opacity: isScratchedPercent > 0.55 ? 0 : 1,
                    transition: isScratchedPercent > 0.55 ? "opacity 0.6s ease" : "none",
                    pointerEvents: isScratchedPercent > 0.55 ? "none" : "auto",
                  }}
                />
              )}
            </div>

            <p className="text-xs text-[#d4af37]/60 tracking-[0.18em] uppercase italic mt-4">
              ✦ Highlighted Scratch Card Above ✦
            </p>

            {/* COUNTDOWN TIMER BLOCKS */}
            <div className="flex gap-3 justify-center mt-8 select-none font-sans scale-95 md:scale-100">
              <div className="w-18 h-18 bg-[#01140f]/75 border border-[#d4af37]/30 rounded-xl flex flex-col justify-center items-center shadow-lg">
                <span className="text-xl md:text-2xl font-bold font-serif text-[#d4af37]">{timeLeft.days}</span>
                <small className="text-[9px] text-[#fefdfa]/80 font-serif uppercase tracking-widest mt-0.5">Days</small>
              </div>
              <div className="w-18 h-18 bg-[#01140f]/75 border border-[#d4af37]/30 rounded-xl flex flex-col justify-center items-center shadow-lg">
                <span className="text-xl md:text-2xl font-bold font-serif text-[#d4af37]">{timeLeft.hours}</span>
                <small className="text-[9px] text-[#fefdfa]/80 font-serif uppercase tracking-widest mt-0.5">Hours</small>
              </div>
              <div className="w-18 h-18 bg-[#01140f]/75 border border-[#d4af37]/30 rounded-xl flex flex-col justify-center items-center shadow-lg">
                <span className="text-xl md:text-2xl font-bold font-serif text-[#d4af37]">{timeLeft.minutes}</span>
                <small className="text-[9px] text-[#fefdfa]/80 font-serif uppercase tracking-widest mt-0.5">Mins</small>
              </div>
              <div className="w-18 h-18 bg-[#01140f]/75 border border-[#d4af37]/30 rounded-xl flex flex-col justify-center items-center shadow-lg">
                <span className="text-xl md:text-2xl font-bold font-serif text-[#d4af37]">{timeLeft.seconds}</span>
                <small className="text-[9px] text-[#fefdfa]/80 font-serif uppercase tracking-widest mt-0.5">Secs</small>
              </div>
            </div>

          </div>
        </section>

        {/* ── OUR STORY SECTION ── */}
        <section id="our-story-section" className="py-24 px-6 relative bg-gradient-to-b from-[#021a14] via-[#052b21] to-[#021a14] border-b border-[#d4af37]/15">
          <div className="max-w-xl mx-auto flex flex-col items-center">
            
            <p className="text-xs uppercase tracking-[0.34em] text-[#d4af37]/75 font-sans mb-3 text-center">
              A Love Written in Stars
            </p>
            <h2 className="text-5xl md:text-6xl font-serif text-[#d4af37] text-center font-bold tracking-wide italic mb-1">
              Our Story
            </h2>

            <div className="flex items-center gap-4 w-full justify-center max-w-[280px] mb-12">
              <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#d4af37]/60 to-transparent" />
              <span className="text-[#d4af37]/60 text-xs font-serif">♥</span>
              <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#d4af37]/60 to-transparent" />
            </div>

            <div className="relative w-full rounded-2xl overflow-hidden shadow-[0_15px_45px_rgba(0,0,0,0.7)] border border-[#d4af37]/35 aspect-[4/3] mb-8 bg-[#011d16]">
              <TemplateImage
                image={storyImage}
                alt="Our Story Portrait"
                className="w-full h-full object-cover select-none"
                isEditable={isEditable}
                onImageChange={(file) => {
                  if (onImageEdit) onImageEdit("story");
                }}
                onEdit={() => onImageEdit?.("story")}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#021a14]/90 via-transparent to-transparent" />
            </div>

            <p className="text-lg md:text-xl text-[#d4af37] italic font-serif text-center font-medium leading-relaxed mb-6">
              &ldquo;Every love story is beautiful, but ours is my favourite.&rdquo;
            </p>
            <p className="text-neutral-300 font-serif leading-relaxed text-center italic text-base opacity-90 max-w-lg">
              {story}
            </p>

            <div className="flex items-center gap-4 mt-8 font-serif">
              <span className="text-2xl text-[#d4af37] font-semibold tracking-wider font-serif italic">{brideName}</span>
              <span className="text-3xl text-[#d4af37]/45 italic font-serif">&amp;</span>
              <span className="text-2xl text-[#d4af37] font-semibold tracking-wider font-serif italic">{groomName}</span>
            </div>

          </div>
        </section>

        {/* ── THE CELEBRATIONS / EVENTS ── */}
        <section id="celebrations-section" className="py-24 px-6 bg-[#021a14] relative">
          <div className="max-w-3xl mx-auto flex flex-col items-center">

            <p className="text-xs uppercase tracking-[0.3em] text-[#d4af37]/75 font-sans mb-3 text-center">
              Join Us To Celebrate
            </p>
            <h2 className="text-5xl md:text-6xl font-serif text-[#d4af37] text-center font-bold tracking-wide italic mb-1">
              Celebrations
            </h2>

            <div className="flex items-center gap-4 w-full justify-center max-w-[280px] mb-12">
              <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#d4af37]/60 to-transparent" />
              <span className="text-[#d4af37]/60 text-xs font-serif">♥</span>
              <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#d4af37]/60 to-transparent" />
            </div>

            {/* Ceremony list */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-2xl">
              {currentEvents.map((event, idx) => (
                <div 
                  key={idx}
                  className="bg-[#07241c] hover:bg-[#0a2e24] rounded-2xl border border-[#d4af37]/25 overflow-hidden flex flex-col transition-all duration-300 shadow-xl group"
                >
                  <div className="relative h-[180px] overflow-hidden">
                    <TemplateImage
                      image={event.image || "https://images.unsplash.com/photo-1519741497674-611481863552?w=800"}
                      alt={event.name}
                      className="w-full h-full object-cover select-none transition-transform duration-500 group-hover:scale-105"
                      isEditable={isEditable}
                      onImageChange={(file) => {
                        if (onImageEdit) onImageEdit("event", idx);
                      }}
                      onEdit={() => onImageEdit?.("event", idx)}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#07241c] via-transparent to-transparent" />
                    <span className="absolute top-4 left-4 bg-[#d4af37]/20 border border-[#d4af37]/50 text-[#d4af37] text-[10px] font-sans tracking-widest uppercase py-1 px-3 rounded-full backdrop-blur-sm">
                      Ceremony {idx + 1}
                    </span>
                  </div>

                  <div className="p-6 flex flex-col flex-1 text-center justify-between">
                    <div>
                      <h4 className="text-2xl text-[#d4af37] font-semibold tracking-wide italic mb-3">
                        {event.name}
                      </h4>
                      <p className="text-xs text-neutral-300 italic font-serif leading-relaxed opacity-90 mb-5 max-w-[280px] mx-auto line-clamp-3">
                        {event.description}
                      </p>
                    </div>

                    <div className="border-t border-[#d4af37]/20 pt-4 flex flex-col gap-2 font-sans text-[11px] text-white/90">
                      <div className="flex items-center justify-center gap-2">
                        <Calendar size={13} className="text-[#d4af37]" />
                        <span>{formatWeddingDate(event.date || date)}</span>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <Clock size={13} className="text-[#d4af37]" />
                        <span>{event.time ? formatWeddingTime(event.time) : formatWeddingTime(weddingTime)} IST</span>
                      </div>
                      <div className="flex items-center justify-center gap-2 px-4 max-w-[260px] mx-auto text-center">
                        <span className="text-[#d4af37] shrink-0">📍</span>
                        <span className="line-clamp-1">{event.location || venue}</span>
                      </div>
                    </div>

                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* ── OUR WEDDING AND SCHEDULES ── */}
        <section id="our-wedding-emerald" className="py-24 px-6 bg-gradient-to-b from-[#021a14] via-[#042d22] to-[#01140f] border-t border-[#d4af37]/15">
          <div className="max-w-3xl mx-auto flex flex-col items-center">

            <p className="text-xs uppercase tracking-[0.3em] text-[#d4af37]/75 font-sans mb-3 text-center">
              The Big Day
            </p>
            <h2 className="text-5xl md:text-6xl font-serif text-[#d4af37] text-center font-bold tracking-wide italic mb-1">
              Our Wedding
            </h2>

            <div className="flex items-center gap-4 w-full justify-center max-w-[280px] mb-12">
              <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#d4af37]/60 to-transparent" />
              <span className="text-[#d4af37]/60 text-xs font-serif">♥</span>
              <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#d4af37]/60 to-transparent" />
            </div>

            {/* Beautiful Gallery Collage */}
            <div className="grid grid-cols-2 gap-3 w-full max-w-[420px] aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border border-[#d4af37]/30 mb-12">
              <div className="relative h-full overflow-hidden">
                <TemplateImage
                  image={finalGallery[0]}
                  alt="Wedding Collage 1"
                  className="w-full h-full object-cover select-none hover:scale-105 transition-transform duration-500"
                  isEditable={isEditable}
                  onImageChange={(file) => {
                    if (onImageEdit) onImageEdit("gallery", 0);
                  }}
                  onEdit={() => onImageEdit?.("gallery", 0)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-center pb-3">
                  <span className="text-[10px] text-[#d4af37] font-semibold uppercase tracking-widest">The Ceremony</span>
                </div>
              </div>

              <div className="grid grid-rows-2 gap-3 h-full">
                <div className="relative overflow-hidden h-full">
                  <TemplateImage
                    image={finalGallery[1] || defaultGallery[1]}
                    alt="Wedding Collage 2"
                    className="w-full h-full object-cover select-none hover:scale-105 transition-transform duration-500"
                    isEditable={isEditable}
                    onImageChange={(file) => {
                      if (onImageEdit) onImageEdit("gallery", 1);
                    }}
                    onEdit={() => onImageEdit?.("gallery", 1)}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-center pb-2">
                    <span className="text-[9px] text-[#d4af37] font-semibold uppercase tracking-widest">The Vows</span>
                  </div>
                </div>
                <div className="relative overflow-hidden h-full">
                  <TemplateImage
                    image={finalGallery[2] || defaultGallery[2]}
                    alt="Wedding Collage 3"
                    className="w-full h-full object-cover select-none hover:scale-105 transition-transform duration-500"
                    isEditable={isEditable}
                    onImageChange={(file) => {
                      if (onImageEdit) onImageEdit("gallery", 2);
                    }}
                    onEdit={() => onImageEdit?.("gallery", 2)}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-center pb-2">
                    <span className="text-[9px] text-[#d4af37] font-semibold uppercase tracking-widest">The Reception</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ══════════════════════════════════════════
               ROYAL SCHEDULE CARD — BEAUTIFUL CUSTOM DESIGN
            ══════════════════════════════════════════ */}
            <div className="relative w-full max-w-[420px] rounded-lg p-10 md:p-12 mb-12 shadow-[0_30px_80px_rgba(0,0,0,0.8)] border border-[#d4af37]/65 bg-gradient-to-b from-[#07241c] via-[#05231c] to-[#041a15] overflow-hidden">
              
              {/* Filigree Background Pattern SVG */}
              <div className="absolute inset-0 opacity-[0.04] pointer-events-none select-none">
                <svg viewBox="0 0 420 560" className="w-full h-full stroke-[#d4af37]" fill="none" strokeWidth="0.6">
                  <circle cx="210" cy="280" r="200" strokeDasharray="3 9"/>
                  <circle cx="210" cy="280" r="155"/>
                  <circle cx="210" cy="280" r="110" strokeDasharray="2 6"/>
                  <circle cx="210" cy="280" r="65" strokeDasharray="1 5"/>
                  <ellipse cx="210" cy="90" rx="16" ry="52"/>
                  <ellipse cx="210" cy="470" rx="16" ry="52"/>
                  <ellipse cx="60" cy="280" rx="52" ry="16"/>
                  <ellipse cx="360" cy="280" rx="52" ry="16"/>
                </svg>
              </div>

              {/* Decorative gold vector line borders and headers */}
              <div className="relative z-10 flex flex-col">
                <div className="text-center mb-8">
                  <span className="text-2xl text-[#d4af37] block mb-2 opacity-90">♛</span>
                  <p className="text-[9px] font-sans uppercase text-[#d4af37]/60 tracking-[0.45em] mb-1">
                    The Grand Celebration
                  </p>
                  <h4 className="font-serif text-[#d4af37] text-xl md:text-2xl font-bold tracking-[0.22em] uppercase">
                    DAY SCHEDULE
                  </h4>
                  <div className="w-20 h-[1px] bg-[#d4af37]/45 mx-auto mt-3" />
                </div>

                {/* Vertical timeline items list */}
                <div className="space-y-6 relative pl-6 before:absolute before:left-[10px] before:top-2 before:bottom-2 before:w-[1px] before:bg-gradient-to-b before:from-[#d4af37]/15 before:via-[#d4af37]/50 before:to-[#d4af37]/15">
                  
                  {/* Timeline Event Step 1 */}
                  <div className="relative group/time">
                    <span className="absolute -left-[20px] top-1.5 w-2 h-2 rounded-full bg-[#d4af37] shadow-[0_0_8px_#d4af37] z-10" />
                    <div className="bg-[#051d16]/80 p-4 rounded border border-[#d4af37]/15 hover:border-[#d4af37]/45 transition-colors">
                      <h5 className="font-serif text-[#d4af37] font-semibold text-xs tracking-wider uppercase mb-1">
                        Wedding Ceremony
                      </h5>
                      <p className="text-[10px] font-sans opacity-70 mb-1">{formatWeddingDate(date)}</p>
                      <p className="text-xs font-serif italic text-white/95">
                        {formatWeddingTime(weddingTime)} AM – 01:00 PM <span className="text-[#d4af37]">IST</span>
                      </p>
                    </div>
                  </div>

                  {/* Timeline Event Step 2 */}
                  <div className="relative group/time">
                    <span className="absolute -left-[20px] top-1.5 w-2 h-2 rounded-full bg-[#d4af37] shadow-[0_0_8px_#d4af37] z-10" />
                    <div className="bg-[#051d16]/80 p-4 rounded border border-[#d4af37]/15 hover:border-[#d4af37]/45 transition-colors">
                      <h5 className="font-serif text-[#d4af37] font-semibold text-xs tracking-wider uppercase mb-1">
                        Wedding Lunch
                      </h5>
                      <p className="text-[10px] font-sans opacity-70 mb-1">01:00 PM – 03:00 PM</p>
                      <p className="text-xs font-serif italic text-[#d4af37]/80">
                        Grand Dining Hall
                      </p>
                    </div>
                  </div>

                  {/* Timeline Event Step 3 */}
                  <div className="relative group/time">
                    <span className="absolute -left-[20px] top-1.5 w-2 h-2 rounded-full bg-[#d4af37] shadow-[0_0_8px_#d4af37] z-10" />
                    <div className="bg-[#051d16]/80 p-4 rounded border border-[#d4af37]/15 hover:border-[#d4af37]/45 transition-colors">
                      <h5 className="font-serif text-[#d4af37] font-semibold text-xs tracking-wider uppercase mb-1">
                        Evening Reception
                      </h5>
                      <p className="text-[10px] font-sans opacity-70 mb-1">07:00 PM – 11:00 PM</p>
                      <p className="text-xs font-serif italic text-[#d4af37]/80">
                        Banquet Hall
                      </p>
                    </div>
                  </div>

                </div>

                <div className="text-center mt-8">
                  <div className="w-12 h-[1px] bg-[#d4af37]/45 mx-auto mb-4" />
                  <p className="font-serif text-[#d4af37]/60 italic text-sm">
                    With love &amp; celebration
                  </p>
                </div>

              </div>
            </div>

            {/* Venue metadata details */}
            <div className="text-center">
              <span className="text-base text-[#d4af37] uppercase tracking-[0.25em] font-sans block mb-2">📍 Venue</span>
              <h4 className="text-2xl text-[#fefdfa] font-serif font-bold mb-1 tracking-wide">{venue}</h4>
              <p className="text-sm font-serif text-neutral-300 italic opacity-85 max-w-md">{venueAddress}</p>
            </div>

          </div>
        </section>

        {/* ── VENUE MAP EMBED BLOCK ── */}
        <section id="venue-map-section" className="py-24 px-6 bg-gradient-to-b from-[#021a14] via-[#052a1e] to-[#01140f] border-t border-[#d4af37]/15">
          <div className="max-w-xl mx-auto flex flex-col items-center">
            
            <p className="text-xs uppercase tracking-[0.25em] text-[#d4af37]/75 font-sans mb-3 text-center">
              Find Us Here
            </p>
            <h2 className="text-5xl md:text-6xl font-serif text-[#d4af37] text-center font-bold tracking-wide italic mb-1">
              Venue Location
            </h2>

            <div className="flex items-center gap-4 w-full justify-center max-w-[280px] mb-12">
              <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#d4af37]/60 to-transparent" />
              <span className="text-[#d4af37]/60 text-xs font-serif">♥</span>
              <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#d4af37]/60 to-transparent" />
            </div>

            <div className="w-full bg-[#07241c] border border-[#d4af37]/35 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
              <div className="p-5 flex items-start gap-4 border-b border-[#d4af37]/20 bg-[#041d16]">
                <span className="text-xl shrink-0 mt-0.5">📍</span>
                <div>
                  <h5 className="font-serif text-[#d4af37] text-base font-semibold">{venue}</h5>
                  <p className="text-xs font-serif text-neutral-300 italic opacity-85">{venueAddress}</p>
                </div>
              </div>

              {/* Google Maps embed Frame */}
              <div className="w-full h-[260px] relative select-none">
                {googleMapsEmbedUrl && googleMapsEmbedUrl.trim() !== "" ? (
                  <iframe
                    src={googleMapsEmbedUrl}
                    title="Venue Map View"
                    className="w-full h-full border-none filter invert-[90%] hue-rotate-[180deg] brightness-[0.85] saturate-[1.2]"
                    allowFullScreen={true}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm font-serif text-neutral-400 italic bg-[#031410] border border-[#d4af37]/25">
                    No maps embed registered
                  </div>
                )}
              </div>

              {/* Get Directions anchor button */}
              <a
                href={googleMapsLink}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 m-6 py-3.5 bg-gradient-to-r from-[#b8860b] via-[#d4af37] to-[#b8860b] text-[#021a14] rounded-full font-serif font-bold text-xs tracking-widest uppercase shadow-[0_4px_20px_rgba(212,175,55,0.355)] hover:opacity-90 select-none transition-opacity"
              >
                🗺️ Get Directions
              </a>
            </div>

          </div>
        </section>

      </div>

    </div>
  );
}
