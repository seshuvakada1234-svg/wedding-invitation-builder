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
import { 
  Menu, X, ChevronDown, Church, GlassWater, Sparkles, Instagram, Mail, Heart,
  SunMedium, Flower2, Palette, Music4, Gem, Crown, Wine, HeartHandshake
} from "lucide-react";
import TemplateImage from "../TemplateImage";
import { WeddingEvent, EditableImage } from "../../types";
import { formatWeddingDate, formatWeddingTime, getDayOfWeek } from "../../lib/dateUtils";

interface SouthIndiaTemplateProps {
  brideName: string;
  groomName: string;
  date: string;
  weddingTime?: string;
  venue: string;
  venueAddress?: string;
  venueCity?: string;
  googleMapsLink?: string;
  googleMapsEmbedUrl?: string;
  story?: string;
  events?: WeddingEvent[];
  galleryImages?: (string | EditableImage)[];
  phone?: string;
  whatsapp?: string;
  isEditable?: boolean;
  onEditImage?: (key: string, index?: number) => void;
  // Theme & Style
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  fontStyle?: string;
  headingFont?: string;
  bodyFont?: string;
  borderRadius?: string;
  shadowIntensity?: string;
  animationStyle?: string;
  // Couple Identity
  coupleNickname?: string;
  familyNames?: string;
  weddingHashtag?: string;
  coupleMonogram?: string;
  // Hero
  heroTitle?: string;
  heroSubtitle?: string;
  heroButtonText?: string;
  // RSVP
  rsvpTitle?: string;
  rsvpSubtitle?: string;
  rsvpButtonText?: string;
  whatsappNumber?: string;
  rsvpDeadline?: string;
  // Story / Timeline
  timeline?: {
    id: string;
    title: string;
    description: string;
    date: string;
    image?: string;
  }[];
  // Countdown
  countdownDate?: string;
  // SEO
  seoTitle?: string;
  seoDescription?: string;
  ogImage?: string;
  footerText?: string;
  modalLabel?: string;
  // Legacy/Internal
  introVideoUrl?: string;
  musicUrl?: string;
  paymentButtonText?: string;
  // Modal
  modalTitle?: string;
  modalSubtitle?: string;
  modalButtonText?: string;
  // Payment & Preview
  isPaid?: boolean;
  isPreview?: boolean;
  onUnlock?: () => void;
  price?: number;
}

const SHIMMER_TEXT_CLASS = "bg-linear-to-r from-[var(--secondary-color,#e9d5ff)] via-[var(--primary-color,#d4af37)] to-[var(--secondary-color,#c084fc)] bg-[length:200%_auto] bg-clip-text text-transparent animate-shimmer";

export default function SouthIndiaTemplate({
  brideName = "Sophia",
  groomName = "Alexander",
  date = "",
  weddingTime = "",
  venue = "Royal Wisteria Garden Estate",
  venueAddress = "123 Lavender Lane",
  venueCity = "Wisteria Valley",
  googleMapsLink = "",
  googleMapsEmbedUrl = "",
  story = "Our love blooms like wisteria in spring — graceful, timeless, and endlessly enchanting.",
  events = [],
  galleryImages = [],
  isEditable = false,
  onEditImage,
  // Theme Settings
  primaryColor = "#a855f7",
  secondaryColor = "#d4af37",
  accentColor = "#9333ea",
  fontStyle = "serif",
  headingFont = "'Playfair Display', serif",
  bodyFont = "'Cormorant Garamond', serif",
  borderRadius = "32px",
  shadowIntensity = "xl",
  animationStyle = "smooth",
  // Couple Identity
  coupleNickname = "",
  familyNames = "Together with their families",
  weddingHashtag = "#TheFairytaleWedding",
  coupleMonogram = "",
  // Hero
  heroTitle = "A Royal Lavender Love Story",
  heroSubtitle = "You are cordially invited",
  heroButtonText = "Open Invitation",
  // RSVP
  rsvpTitle = "RSVP",
  rsvpSubtitle = "Will you join us in our fairytale?",
  rsvpButtonText = "Send Your RSVP",
  whatsappNumber = "",
  rsvpDeadline = "",
  // Story / Timeline
  timeline = [],
  // Countdown
  countdownDate = "",
  // Modal
  modalTitle = "Request the pleasure of your company at the celebration of their marriage",
  modalSubtitle = "at half past two in the afternoon",
  modalButtonText = "Close with Love 💜",
  // Legacy/Internal support
  introVideoUrl = "https://pub-4955b83e8ada4ae98b612bd6113cdc4c.r2.dev/Untitled%20design%20(4).mp4",
  musicUrl = "",
  paymentButtonText = "Book Your Slot",
  footerText = "Created with Love",
  modalLabel = "Together with their families",
  isPaid = false,
  isPreview = false,
  onUnlock,
  price = 1999,
}: SouthIndiaTemplateProps) {
  const [hasEntered, setHasEntered] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isInvitationOpen, setIsInvitationOpen] = useState(false);
  const [isRSVPSubmitted, setIsRSVPSubmitted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Local Image state for instant preview
  const [localImages, setLocalImages] = useState<Record<string, string | EditableImage>>({});

  const handleLocalImageUpload = (key: string, file: File) => {
    const imageUrl = URL.createObjectURL(file);
    setLocalImages(prev => ({
      ...prev,
      [key]: imageUrl
    }));
    // Also notify parent the editor triggered
    onEditImage?.(key);
  };

  const getActiveImage = (key: string, propValue: string | EditableImage | undefined) => {
    return localImages[key] || propValue;
  };

  const handleRSVP = (e: React.FormEvent) => {
    e.preventDefault();
    setIsRSVPSubmitted(true);
  };

  const formattedDate = useMemo(() => formatWeddingDate(date), [date]);
  const formattedTime = useMemo(() => formatWeddingTime(weddingTime), [weddingTime]);
  const weddingDay = useMemo(() => getDayOfWeek(date), [date]);

  // Countdown State
  const [timeLeft, setTimeLeft] = useState({
    days: "000",
    hours: "00",
    minutes: "00",
    seconds: "00",
  });

  useEffect(() => {
    const targetDate = countdownDate || date;
    const timer = setInterval(() => {
      const target = new Date(targetDate).getTime();
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        clearInterval(timer);
        return;
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)).toString().padStart(3, "0"),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24).toString().padStart(2, "0"),
        minutes: Math.floor((diff / (1000 * 60)) % 60).toString().padStart(2, "0"),
        seconds: Math.floor((diff / 1000) % 60).toString().padStart(2, "0"),
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [date, countdownDate]);

  const enterInvitation = () => {
    if (hasEntered) return;
    setHasEntered(true);
    if (videoRef.current) videoRef.current.pause();
  };

  // Dynamic Styles
  const themeStyles = useMemo(() => ({
    '--primary-color': primaryColor,
    '--secondary-color': secondaryColor,
    '--accent-color': accentColor,
    '--heading-font': headingFont,
    '--body-font': bodyFont,
    '--border-radius': borderRadius,
    '--shadow-intensity': shadowIntensity === 'lg' ? '0 10px 15px -3px rgb(0 0 0 / 0.1)' : shadowIntensity === '2xl' ? '0 25px 50px -12px rgb(0 0 0 / 0.25)' : '0 20px 25px -5px rgb(0 0 0 / 0.1)',
  } as React.CSSProperties), [primaryColor, secondaryColor, accentColor, headingFont, bodyFont, borderRadius, shadowIntensity]);

  // Parallax for Photo Strips
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2),
        y: (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2),
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const galleryDefaults = [
    "https://images.unsplash.com/photo-1544124499-58912cbddaad?w=600",
    "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=600",
    "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600",
    "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600",
    "https://images.unsplash.com/photo-1519741497674-611481863552?w=600",
    "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600",
  ];

  const gallery = galleryImages.length > 0 ? galleryImages : galleryDefaults;

  return (
    <div 
      className="bg-[#fefcf7] selection:bg-purple-500/25 selection:text-[#581c87]"
      style={{
        ...themeStyles,
        fontFamily: 'var(--body-font)',
        color: 'var(--primary-color)'
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=Great+Vibes&family=Inter:wght@400;500;600&family=Montserrat:wght@400;500;600&family=Space+Grotesk:wght@400;500;600&display=swap');
        
        .royal-heading { font-family: var(--heading-font); }
        .royal-body { font-family: var(--body-font); }
        .royal-radius { border-radius: var(--border-radius); }
        .royal-shadow { box-shadow: var(--shadow-intensity); }

        .shimmer-text {
          background: linear-gradient(90deg, var(--secondary-color), var(--primary-color), var(--secondary-color), var(--accent-color), var(--secondary-color));
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 5s linear infinite;
        }

        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }

        @keyframes pulseGlow {
          0%, 100% { opacity: 0.3; filter: blur(80px); scale: 1; }
          50% { opacity: 0.5; filter: blur(100px); scale: 1.1; }
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-float-delayed {
          animation: float 8s ease-in-out infinite -2s;
        }

        .animate-glow {
          animation: pulseGlow 10s ease-in-out infinite;
        }

        .watercolor-texture {
          position: relative;
        }

        .watercolor-texture::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at 20% 20%, rgba(216, 180, 254, 0.15) 0%, transparent 50%),
                      radial-gradient(ellipse at 80% 80%, rgba(212, 171, 55, 0.08) 0%, transparent 50%),
                      radial-gradient(ellipse at 50% 50%, rgba(224, 181, 165, 0.1) 0%, transparent 60%);
          pointer-events: none;
          z-index: 1;
        }
      `}</style>

      {/* Intro Screen */}
      <AnimatePresence>
        {!hasEntered && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.04, filter: "blur(12px)" }}
            transition={{ duration: 1.8, ease: "easeInOut" }}
            className="fixed inset-0 z-[9999] bg-[#0a0014] overflow-hidden"
          >
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              onCanPlay={() => setIsVideoLoaded(true)}
              onEnded={enterInvitation}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-2000 ${isVideoLoaded ? 'opacity-100' : 'opacity-0'}`}
            >
              <source src={introVideoUrl} type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(10,0,20,0.5)_80%,rgba(10,0,20,0.85)_100%)] z-2" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(168,85,247,0.12)_0%,transparent_60%),radial-gradient(ellipse_at_30%_70%,rgba(147,51,234,0.08)_0%,transparent_50%)] z-3" />
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 2 }}
              className="relative z-10 flex flex-col items-center justify-center h-full text-center p-6"
            >
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5, duration: 1.5 }}
              >
                <div className="flex items-center justify-center gap-4 mb-4">
                  <div className="w-16 h-px bg-gradient-to-r from-transparent to-white/30" />
                  <span className="text-[#eddb9e] text-xs tracking-[0.4em] uppercase font-serif">✦ You Are Cordially Invited ✦</span>
                  <div className="w-16 h-px bg-gradient-to-l from-transparent to-white/30" />
                </div>
                <h1 className="font-['Playfair_Display'] text-4xl md:text-6xl lg:text-7xl font-semibold text-white leading-tight mb-2 drop-shadow-[0_0_60px_rgba(88,28,135,0.5)]">
                  Welcome to Our<br />
                  <span className="shimmer-text">Royal Wedding</span>
                </h1>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.5, duration: 1.5 }}
                className="mt-6 mb-2"
              >
                <p className="font-['Great_Vibes'] text-5xl md:text-7xl text-purple-200/90 drop-shadow-[0_0_40px_rgba(168,85,247,0.4)]">
                  {brideName} & {groomName}
                </p>
                <p className="font-serif text-lg text-white/50 tracking-[0.2em]">{formattedDate}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.8, duration: 1.5 }}
                className="mt-8"
              >
                <p className="font-serif text-xl md:text-2xl text-purple-200/60 tracking-wider">An Enchanted Lavender Celebration</p>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 3.2, duration: 1.5 }}
                className="mt-12"
              >
                <button
                  onClick={enterInvitation}
                  className="bg-white/10 backdrop-blur-xl border border-purple-300/35 rounded-full px-12 py-4 font-serif text-lg font-medium tracking-[0.15em] text-white/90 hover:bg-white/20 hover:border-purple-300/60 transition-all duration-500 shadow-[0_0_30px_rgba(168,85,247,0.2)] hover:scale-105 active:scale-95"
                >
                  ✨ Enter Invitation
                </button>
                <p className="font-serif text-xs text-white/25 mt-4 tracking-wider">or wait for the cinematic to complete</p>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

        {/* Main Wedding Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={hasEntered ? { opacity: 1 } : {}}
          transition={{ duration: 2, delay: 0.5 }}
          className={`${hasEntered ? 'block' : 'hidden'} relative z-0`}
        >

        <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6 bg-[#fefcf7]/75 backdrop-blur-xl border-b border-purple-200/20">
          <a href="#" className="font-['Great_Vibes'] text-2xl text-purple-700 hover:text-purple-500 transition-colors">
            {brideName[0]} & {groomName[0]}
          </a>
          <div className="hidden md:flex items-center gap-8">
            {['Story', 'Gallery', 'Details', 'RSVP'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="font-serif text-lg text-purple-700/70 hover:text-purple-600 transition-colors"
              >
                {item}
              </a>
            ))}
          </div>
          <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden text-purple-700">
            <Menu className="w-6 h-6" />
          </button>
        </nav>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-[#fefcf7]/95 backdrop-blur-2xl flex flex-col items-center justify-center gap-8"
            >
              {['Story', 'Gallery', 'Details', 'RSVP'].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="font-serif text-2xl text-purple-700"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item}
                </a>
              ))}
              <button onClick={() => setIsMobileMenuOpen(false)} className="mt-4 text-purple-400">
                <X className="w-8 h-8" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hero Section */}
        <section className="watercolor-texture min-h-screen pt-16 flex items-center relative overflow-hidden bg-gradient-to-b from-[#fefcf7] via-[#faf5ff] to-[#fefcf7]">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-rose-200/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#fefcf7] via-[#fefcf7]/60 to-transparent z-10" />

          <div className="relative z-10 max-w-7xl mx-auto px-6 w-full flex flex-col lg:flex-row items-center gap-10 lg:gap-4">
            <div className="flex-1 max-w-xl text-center lg:text-left">
              <SectionReveal delay={0.1}>
                <div className="flex items-center justify-center lg:justify-start gap-4 mb-8">
                  <div className="w-16 h-px bg-gradient-to-r from-transparent to-purple-300" />
                  <span className="text-[#d4af37] text-lg">✦</span>
                  <div className="w-16 h-px bg-gradient-to-l from-transparent to-purple-300" />
                </div>
                <p className="font-serif text-sm tracking-[0.35em] uppercase text-purple-500 mb-6">{heroSubtitle}</p>
                <h1 className="font-['Playfair_Display'] text-4xl md:text-5xl lg:text-7xl font-semibold leading-tight text-purple-900 mb-6">
                  {heroTitle.split(' ').map((word, i) => (
                    <React.Fragment key={i}>
                      {word === 'Lavender' ? <><span className={SHIMMER_TEXT_CLASS}>Lavender</span><br /></> : word + ' '}
                    </React.Fragment>
                  ))}
                </h1>
                <p className="font-serif text-lg md:text-xl text-purple-700/70 leading-relaxed mb-10 max-w-md mx-auto lg:mx-0">
                  {story}
                </p>
                <div className="mb-4">
                  <p className="font-['Great_Vibes'] text-5xl md:text-6xl text-purple-600 mb-3">{brideName} & {groomName}</p>
                </div>
                <div className="flex items-center justify-center lg:justify-start gap-4 mb-10">
                  <div className="w-16 h-px bg-gradient-to-r from-transparent to-purple-300" />
                  <p className="font-serif text-xl text-purple-500/80 tracking-[0.15em]">{formattedDate} • {formattedTime}</p>
                  <div className="w-16 h-px bg-gradient-to-l from-transparent to-purple-300" />
                </div>
                <button
                  onClick={() => setIsInvitationOpen(true)}
                  className="bg-gradient-to-r from-[#c084fc] via-[#a855f7] to-[#9333ea] text-white rounded-full px-10 py-4 font-serif text-lg font-medium tracking-wider shadow-xl hover:scale-105 transition-transform"
                >
                  ✨ {heroButtonText}
                </button>

                {/* Template Selection Buttons - Premium Theme */}
                {isPreview && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 }}
                    className="mt-12 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
                  >
                    <button
                      onClick={onUnlock}
                      className="w-full sm:w-auto bg-[#d4af37] text-white px-10 py-5 rounded-full font-serif text-lg font-bold tracking-widest shadow-[0_10px_40px_-10px_rgba(212,171,55,0.5)] hover:scale-105 transition-transform flex items-center justify-center gap-3 group"
                    >
                      <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                      Use This Template
                    </button>
                    <button
                      onClick={() => window.open(window.location.href, '_blank')}
                      className="w-full sm:w-auto bg-white/80 backdrop-blur-md text-purple-700 border border-purple-200 px-10 py-5 rounded-full font-serif text-lg font-bold tracking-widest hover:bg-white transition-all flex items-center justify-center gap-3 group"
                    >
                      <Palette className="w-5 h-5 group-hover:rotate-12 transition-transform shadow-sm" />
                      Preview Live
                    </button>
                  </motion.div>
                )}
              </SectionReveal>
            </div>

            {/* Tilted Photo Strips */}
            <div className="hidden lg:block flex-1 relative h-[700px] max-w-[580px]">
              <div className="absolute inset-[-60px] bg-[radial-gradient(ellipse_at_40%_40%,rgba(168,85,247,0.1)_0%,transparent_60%),radial-gradient(ellipse_at_70%_70%,rgba(212,171,55,0.06)_0%,transparent_50%)] blur-[30px] z-0" />
              
              {/* Strip 1 */}
              <motion.div
                animate={{
                  y: [0, -18, 0],
                  rotate: [-12, -11.5, -12],
                }}
                transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  top: -30,
                  left: 10,
                  x: mousePos.x * 0.03 * 40,
                  y: mousePos.y * 0.03 * 30,
                }}
                className="absolute flex flex-col gap-4 z-3"
              >
                <div className="bg-white p-1.5 rounded-[18px] shadow-2xl w-[200px] h-[260px] hover:scale-105 transition-transform duration-500">
                  <TemplateImage 
                    image={getActiveImage('hero-strip-1-top', galleryImages[0] || "https://images.unsplash.com/photo-1544124499-58912cbddaad?w=600")} 
                    isEditable={isEditable}
                    onEdit={() => onEditImage?.('hero-strip-1-top')}
                    onImageChange={(file) => handleLocalImageUpload('hero-strip-1-top', file)}
                    className="rounded-[14px] w-full h-full" 
                  />
                </div>
                <div className="bg-white p-1.5 rounded-[18px] shadow-2xl w-[180px] h-[240px] ml-6 hover:scale-105 transition-transform duration-500">
                  <TemplateImage 
                    image={getActiveImage('hero-strip-1-bottom', galleryImages[1] || "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=600")} 
                    isEditable={isEditable}
                    onEdit={() => onEditImage?.('hero-strip-1-bottom')}
                    onImageChange={(file) => handleLocalImageUpload('hero-strip-1-bottom', file)}
                    className="rounded-[14px] w-full h-full" 
                  />
                </div>
              </motion.div>

              {/* Strip 2 */}
              <motion.div
                animate={{
                  y: [0, -22, 0],
                  rotate: [8, 8.5, 8],
                }}
                transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  top: 40,
                  right: 20,
                  x: mousePos.x * 0.05 * 40,
                  y: mousePos.y * 0.05 * 30,
                }}
                className="absolute flex flex-col gap-4 z-2"
              >
                <div className="bg-white p-1.5 rounded-[18px] shadow-2xl w-[220px] h-[300px] hover:scale-105 transition-transform duration-500">
                  <TemplateImage 
                    image={getActiveImage('hero-strip-2-top', galleryImages[2] || "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600")} 
                    isEditable={isEditable}
                    onEdit={() => onEditImage?.('hero-strip-2-top')}
                    onImageChange={(file) => handleLocalImageUpload('hero-strip-2-top', file)}
                    className="rounded-[14px] w-full h-full" 
                  />
                </div>
                <div className="bg-white p-1.5 rounded-[18px] shadow-2xl w-[200px] h-[260px] -ml-4 hover:scale-105 transition-transform duration-500">
                  <TemplateImage 
                    image={getActiveImage('hero-strip-2-bottom', galleryImages[3] || "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600")} 
                    isEditable={isEditable}
                    onEdit={() => onEditImage?.('hero-strip-2-bottom')}
                    onImageChange={(file) => handleLocalImageUpload('hero-strip-2-bottom', file)}
                    className="rounded-[14px] w-full h-full" 
                  />
                </div>
              </motion.div>

              {/* Strip 3 */}
              <motion.div
                animate={{
                  y: [0, -14, 0],
                  rotate: [3, 3.5, 3],
                }}
                transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  top: 180,
                  left: 140,
                  x: mousePos.x * 0.02 * 40,
                  y: mousePos.y * 0.02 * 30,
                }}
                className="absolute flex flex-col gap-4 z-1"
              >
                <div className="bg-white p-1.5 rounded-[18px] shadow-2xl w-[190px] h-[250px] hover:scale-105 transition-transform duration-500">
                  <TemplateImage 
                    image={getActiveImage('hero-strip-3-top', galleryImages[4] || "https://images.unsplash.com/photo-1519741497674-611481863552?w=600")} 
                    isEditable={isEditable}
                    onEdit={() => onEditImage?.('hero-strip-3-top')}
                    onImageChange={(file) => handleLocalImageUpload('hero-strip-3-top', file)}
                    className="rounded-[14px] w-full h-full" 
                  />
                </div>
                <div className="bg-white p-1.5 rounded-[18px] shadow-2xl w-[170px] h-[220px] ml-8 hover:scale-105 transition-transform duration-500">
                  <TemplateImage 
                    image={getActiveImage('hero-strip-3-bottom', galleryImages[5] || "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600")} 
                    isEditable={isEditable}
                    onEdit={() => onEditImage?.('hero-strip-3-bottom')}
                    onImageChange={(file) => handleLocalImageUpload('hero-strip-3-bottom', file)}
                    className="rounded-[14px] w-full h-full" 
                  />
                </div>
              </motion.div>
            </div>
          </div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-20 animate-bounce">
            <span className="font-serif text-sm text-purple-400 tracking-wider">Scroll</span>
            <ChevronDown className="w-5 h-5 text-purple-300" />
          </div>
        </section>

        {/* Our Story Section */}
        <section id="story" className="relative py-24 md:py-32 overflow-hidden bg-gradient-to-b from-[#fefcf7] via-purple-50/30 to-[#fefcf7]">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-200/10 rounded-full blur-3xl opacity-50" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-rose-100/15 rounded-full blur-3xl opacity-50" />
          
          <div className="relative z-10 max-w-6xl mx-auto px-6">
            <SectionReveal className="text-center mb-16">
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="w-16 h-px bg-gradient-to-r from-transparent to-purple-300" />
                <span className="text-[#d4af37]">❧</span>
                <div className="w-16 h-px bg-gradient-to-l from-transparent to-purple-300" />
              </div>
              <h2 className="font-['Playfair_Display'] text-3xl md:text-4xl font-medium text-purple-800 mb-2">Our Love Story</h2>
              <p className="font-serif text-lg text-purple-500/70">A tale written in the stars and blooming like wisteria</p>
            </SectionReveal>

            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
              <div className="flex-1 w-full relative">
                <div className="absolute -inset-2 bg-gradient-to-r from-purple-200 via-yellow-100 to-rose-200 rounded-[34px] blur-lg opacity-40" />
                <div className="relative rounded-[32px] overflow-hidden shadow-2xl border-4 border-white">
                  <TemplateImage
                    image={getActiveImage('story-image', galleryImages[6] || gallery[0])}
                    isEditable={isEditable}
                    onEdit={() => onEditImage?.('story-image')}
                    onImageChange={(file) => handleLocalImageUpload('story-image', file)}
                    className="w-full h-[400px] md:h-[480px]"
                  />
                </div>
              </div>
              
              <div className="flex-1">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8 }}
                  className="bg-white/55 backdrop-blur-xl border border-purple-200/30 rounded-[32px] p-8 md:p-12 shadow-2xl hover:shadow-[0_0_80px_rgba(168,85,247,0.15)] transition-all"
                >
                  <span className="font-['Great_Vibes'] text-3xl text-purple-400 block mb-4">Chapter One</span>
                  <blockquote className="font-['Playfair_Display'] text-xl md:text-2xl text-purple-800/90 leading-relaxed italic mb-6">
                    "{story}"
                  </blockquote>
                  <div className="w-16 h-px bg-gradient-to-r from-purple-300 to-[#eddb9e] mb-6" />
                  <p className="font-serif text-lg text-purple-600/70 leading-relaxed mb-6">
                    Our paths intertwined like the vines of an ancient garden, each moment together painting a new stroke on the canvas of our love story — a masterpiece still unfolding.
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-px bg-purple-300" />
                    <span className="font-serif text-sm text-purple-400 tracking-wider uppercase">{brideName} & {groomName}</span>
                    <div className="w-8 h-px bg-purple-300" />
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* Timeline Section */}
        {timeline && timeline.length > 0 && (
          <section className="py-24 md:py-32 bg-white relative overflow-hidden">
            <div className="max-w-4xl mx-auto px-6 relative">
              <div className="absolute left-1/2 top-40 bottom-20 w-px bg-gradient-to-b from-purple-100 via-purple-300 to-purple-100 hidden md:block" />
              
              <SectionReveal className="text-center mb-20">
                 <h2 className="font-['Playfair_Display'] text-4xl font-medium text-purple-950 mb-3">Road to the Wedding</h2>
                 <p className="text-purple-400 font-serif tracking-widest uppercase text-xs">Our most cherished milestones</p>
              </SectionReveal>

              <div className="space-y-24">
                {timeline.map((point, idx) => (
                  <SectionReveal key={point.id} delay={idx * 0.1}>
                    <div className={`flex flex-col ${idx % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-12`}>
                      <div className="flex-1 w-full">
                        <div className="royal-radius overflow-hidden royal-shadow relative group">
                          <TemplateImage
                            image={getActiveImage(`timeline-image-${idx}`, point.image || gallery[idx % gallery.length] as string)}
                            isEditable={isEditable}
                            onEdit={() => onEditImage?.(`timeline-image-${idx}`)}
                            onImageChange={(file) => handleLocalImageUpload(`timeline-image-${idx}`, file)}
                            className="w-full h-[300px] md:h-[400px] object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                      
                      <div className="flex-1 text-center md:text-left">
                        <span className="inline-block px-4 py-1 rounded-full bg-purple-50 text-purple-600 font-bold uppercase tracking-widest text-[10px] mb-4">
                          {point.date}
                        </span>
                        <h3 className="font-['Playfair_Display'] text-3xl text-purple-900 mb-4">{point.title}</h3>
                        <p className="text-gray-500 font-serif text-lg leading-relaxed">{point.description}</p>
                      </div>
                    </div>
                  </SectionReveal>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* HALDI SECTION */}
        {events[0] && (
          <section
            id="haldi"
            className="relative min-h-screen py-24 md:py-32 overflow-hidden bg-[#2b1803]"
          >
            {/* GOLDEN GLOW BACKGROUND */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(251,191,36,0.12)_0%,transparent_40%),radial-gradient(circle_at_80%_80%,rgba(245,158,11,0.18)_0%,transparent_50%)]" />

            {/* FLOATING GLOW */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(15)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-72 h-72 bg-yellow-400/10 rounded-full blur-[120px]"
                  animate={{
                    opacity: [0.2, 0.5, 0.2],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    delay: i * 0.5,
                  }}
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                />
              ))}
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6">

              {/* TOP CONTENT */}
              <div className="text-center max-w-3xl mx-auto mb-20">
                <SectionReveal>
                  <p className="font-serif text-yellow-300 text-sm tracking-[0.5em] uppercase mb-6">
                    {formatWeddingTime(events[0].time)} • {formatWeddingDate(events[0].date || date)}
                  </p>

                  <h2 className="font-['Playfair_Display'] text-5xl md:text-7xl text-yellow-50 font-semibold leading-tight">
                    The Glow of
                    <span className="block font-['Great_Vibes'] text-yellow-400 text-7xl md:text-9xl mt-4 drop-shadow-[0_0_35px_rgba(251,191,36,0.7)]">
                      {events[0].name}
                    </span>
                  </h2>

                  <div className="w-32 h-px bg-gradient-to-r from-transparent via-yellow-400 to-transparent mx-auto my-10" />

                  <p className="font-serif text-lg md:text-xl text-yellow-100/60 leading-relaxed max-w-2xl mx-auto">
                    {story}
                  </p>
                  
                  <p className="font-['Great_Vibes'] text-3xl text-yellow-200 mt-4">{events[0].location}</p>

                  <div className="flex flex-wrap justify-center gap-4 mt-12">
                    <button className="bg-yellow-500/10 backdrop-blur-xl border border-yellow-300/20 rounded-full px-14 py-5 text-yellow-50 tracking-[0.2em] uppercase text-sm hover:bg-yellow-400/20 transition-all duration-700 shadow-[0_20px_60px_rgba(251,191,36,0.15)]">
                      ✨ Celebrate the Ritual
                    </button>
                    {(events[0] as any).googleMapsLink && (
                      <a 
                        href={(events[0] as any).googleMapsLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-full px-10 py-5 text-white/80 tracking-widest uppercase text-xs hover:bg-white/10 transition-all"
                      >
                        View Location
                      </a>
                    )}
                  </div>
                </SectionReveal>
              </div>

              {/* PINTEREST COLLAGE */}
              <div className="max-w-6xl mx-auto mb-24">
                <SectionReveal>
                  <div className="grid grid-cols-2 gap-4 md:gap-8 items-start">

                    {/* LEFT */}
                    <div className="flex flex-col gap-4 md:gap-8">
                      <motion.div
                        whileHover={{ scale: 1.03 }}
                        className="rounded-[30px] overflow-hidden border border-yellow-300/20 shadow-[0_20px_60px_rgba(0,0,0,0.4)] group"
                      >
                        <TemplateImage
                          image={getActiveImage('event-0-image-0', events[0].image || "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=1000")}
                          isEditable={isEditable}
                          onEdit={() => onEditImage?.('event-0-image-0')}
                          onImageChange={(file) => handleLocalImageUpload('event-0-image-0', file)}
                          className="w-full h-[240px] md:h-[420px] object-cover group-hover:scale-110 transition-transform duration-1000"
                        />
                      </motion.div>

                      <motion.div
                        whileHover={{ scale: 1.03 }}
                        className="rounded-[30px] overflow-hidden border border-yellow-300/20 shadow-[0_20px_60px_rgba(0,0,0,0.4)] group"
                      >
                        <TemplateImage
                          image={getActiveImage('event-0-image-1', galleryImages[7] || "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800")}
                          isEditable={isEditable}
                          onEdit={() => onEditImage?.('event-0-image-1')}
                          onImageChange={(file) => handleLocalImageUpload('event-0-image-1', file)}
                          className="w-full h-[170px] md:h-[260px] object-cover group-hover:scale-110 transition-transform duration-1000"
                        />
                      </motion.div>
                    </div>

                    {/* RIGHT */}
                    <div className="flex flex-col gap-4 md:gap-8 pt-10 md:pt-24">
                      <motion.div
                        whileHover={{ scale: 1.03 }}
                        className="rounded-[30px] overflow-hidden border border-yellow-300/20 shadow-[0_20px_60px_rgba(0,0,0,0.4)] group"
                      >
                        <TemplateImage
                          image={getActiveImage('event-0-image-2', galleryImages[8] || "https://images.unsplash.com/photo-1519741497674-611481863552?w=1000")}
                          isEditable={isEditable}
                          onEdit={() => onEditImage?.('event-0-image-2')}
                          onImageChange={(file) => handleLocalImageUpload('event-0-image-2', file)}
                          className="w-full h-[300px] md:h-[520px] object-cover group-hover:scale-110 transition-transform duration-1000"
                        />
                      </motion.div>

                      <motion.div
                        whileHover={{ scale: 1.03 }}
                        className="rounded-[30px] overflow-hidden border border-yellow-300/20 shadow-[0_20px_60px_rgba(0,0,0,0.4)] group"
                      >
                        <TemplateImage
                          image={getActiveImage('event-0-image-3', galleryImages[9] || "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=800")}
                          isEditable={isEditable}
                          onEdit={() => onEditImage?.('event-0-image-3')}
                          onImageChange={(file) => handleLocalImageUpload('event-0-image-3', file)}
                          className="w-full h-[170px] md:h-[260px] object-cover group-hover:scale-110 transition-transform duration-1000"
                        />
                      </motion.div>
                    </div>
                  </div>
                </SectionReveal>
              </div>
            </div>
          </section>
        )}

        {/* MEHENDI SECTION */}
        {events[1] && (
          <section id="mehendi" className="relative py-28 md:py-36 overflow-hidden bg-[#051a11] flex items-center min-h-screen">
            {/* Enhanced Background Atmosphere */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.08)_0%,transparent_50%),radial-gradient(circle_at_80%_80%,rgba(6,95,70,0.2)_0%,transparent_50%)]" />
            <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/mandala-ornament.png")' }} />
            
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
               {[...Array(12)].map((_, i) => (
                 <motion.div
                   key={i}
                   className="absolute w-72 h-72 bg-emerald-500/10 rounded-full blur-[120px] animate-glow"
                   style={{ 
                     left: `${Math.random() * 100}%`, 
                     top: `${Math.random() * 100}%`,
                     animationDelay: `${Math.random() * -10}s`
                   }}
                 />
               ))}
               {/* Sparkles & Floating Leaves */}
               {[...Array(25)].map((_, i) => (
                  <motion.div
                    key={`sparkle-${i}`}
                    animate={{ 
                      opacity: [0, 0.8, 0],
                      scale: [0, 1, 0],
                      y: [0, -60, -120],
                      x: [0, Math.random() * 40 - 20, Math.random() * 40 - 20]
                    }}
                    transition={{ 
                      duration: 4 + Math.random() * 4, 
                      repeat: Infinity, 
                      delay: Math.random() * 5,
                      ease: "easeInOut"
                    }}
                    className={`absolute w-1 h-1 rounded-full ${Math.random() > 0.5 ? 'bg-emerald-300 shadow-[0_0_12px_#34d399]' : 'bg-yellow-200 shadow-[0_0_8px_#fbbf24]'}`}
                    style={{ left: `${Math.random() * 100}%`, top: `${70 + Math.random() * 30}%` }}
                  />
               ))}
            </div>

            <div className="relative z-10 max-w-[1600px] mx-auto px-6 w-full">
              {/* Header Text */}
              <div className="text-center max-w-4xl mx-auto mb-20 space-y-6">
                <SectionReveal>
                  <p className="font-serif text-emerald-400 text-sm tracking-[0.4em] uppercase mb-4 font-medium">
                     {formatWeddingTime(events[1].time)} • {formatWeddingDate(events[1].date || date)}
                  </p>
                  <h2 className="font-['Playfair_Display'] text-5xl md:text-7xl lg:text-8xl font-semibold text-emerald-50 leading-[1.1] tracking-tight">
                    The Art of<br />
                    <span className="text-emerald-400 font-['Great_Vibes'] text-7xl md:text-8xl lg:text-9xl block mt-4 drop-shadow-[0_0_40px_rgba(16,185,129,0.7)]">
                      {events[1].name}
                    </span>
                  </h2>
                  <div className="w-32 h-px bg-gradient-to-r from-transparent via-emerald-400 to-transparent mb-8 mx-auto" />
                  <p className="font-serif text-xl md:text-2xl text-emerald-200/60 leading-relaxed mx-auto max-w-3xl tracking-wide">
                    {story}
                  </p>
                  <p className="font-['Great_Vibes'] text-4xl text-emerald-300 mt-6">{events[1].location}</p>
                </SectionReveal>
              </div>

              {/* Layout Content - Centered Image Collage */}
              <div className="max-w-5xl mx-auto">
                <SectionReveal>
                  <div className="grid grid-cols-2 gap-6 items-start">
                    {/* Top Left */}
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="rounded-[32px] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.45)] border border-emerald-400/10 h-[320px] md:h-[450px]"
                    >
                      <TemplateImage
                        image={getActiveImage('event-1-image-0', events[1].image || "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=1000")}
                        isEditable={isEditable}
                        onEdit={() => onEditImage?.('event-1-image-0')}
                        onImageChange={(file) => handleLocalImageUpload('event-1-image-0', file)}
                        className="w-full h-full object-cover"
                      />
                    </motion.div>
                    {/* Top Right */}
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="rounded-[32px] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.45)] border border-emerald-400/10 h-[420px] md:h-[550px]"
                    >
                      <TemplateImage
                        image={getActiveImage('event-1-image-1', galleryImages[10] || "https://images.unsplash.com/photo-1544124499-58912cbddaad?w=800")}
                        isEditable={isEditable}
                        onEdit={() => onEditImage?.('event-1-image-1')}
                        onImageChange={(file) => handleLocalImageUpload('event-1-image-1', file)}
                        className="w-full h-full object-cover"
                      />
                    </motion.div>
                    {/* Bottom Left */}
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="rounded-[32px] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.45)] border border-emerald-400/10 h-[240px] md:h-[350px] -mt-16 md:-mt-32"
                    >
                      <TemplateImage
                        image={getActiveImage('event-1-image-2', galleryImages[11] || "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1000")}
                        isEditable={isEditable}
                        onEdit={() => onEditImage?.('event-1-image-2')}
                        onImageChange={(file) => handleLocalImageUpload('event-1-image-2', file)}
                        className="w-full h-full object-cover"
                      />
                    </motion.div>
                    {/* Bottom Right */}
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="rounded-[32px] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.45)] border border-emerald-400/10 h-[300px] md:h-[400px] -mt-8 md:-mt-16"
                    >
                      <TemplateImage
                        image={getActiveImage('event-1-image-3', galleryImages[12] || "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800")}
                        isEditable={isEditable}
                        onEdit={() => onEditImage?.('event-1-image-3')}
                        onImageChange={(file) => handleLocalImageUpload('event-1-image-3', file)}
                        className="w-full h-full object-cover"
                      />
                    </motion.div>
                  </div>
                </SectionReveal>
              </div>

              {/* Luxury CTA Button */}
              <div className="mt-20 flex justify-center relative z-20">
                <SectionReveal delay={0.4}>
                  <motion.button
                    whileHover={{ 
                      scale: 1.05, 
                      boxShadow: "0 0 60px rgba(16,185,129,0.6), 0 20px 40px rgba(0,0,0,0.3)" 
                    }}
                    whileTap={{ scale: 0.95 }}
                    className="group relative bg-linear-to-r from-emerald-800 via-emerald-500 to-emerald-700 text-white rounded-full px-16 py-6 font-serif text-xl font-medium tracking-[0.2em] uppercase shadow-[0_20px_50px_rgba(6,78,59,0.5)] transition-all duration-700 overflow-hidden flex items-center justify-center border border-emerald-400/20"
                  >
                    {/* Gloss Effect */}
                    <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    
                    {/* Ring Glow */}
                    <div className="absolute -inset-1 bg-emerald-400/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    
                    <span className="relative z-10 drop-shadow-lg flex items-center gap-3">
                      <Sparkles className="w-5 h-5 text-emerald-200" />
                      Discover the Magic
                    </span>
                  </motion.button>
                </SectionReveal>
              </div>
            </div>
          </section>
        )}

        {/* Wedding Ceremony Section */}
        {events[2] && (
          <section id="ceremony" className="relative py-24 md:py-32 overflow-hidden bg-[#2d0a0a]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(220,38,38,0.15)_0%,transparent_70%)]" />
            
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(15)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ y: -20, rotate: 0 }}
                  animate={{ y: [0, 800], rotate: [0, 360], x: [0, 100, -100, 0] }}
                  transition={{ duration: 8 + Math.random() * 7, repeat: Infinity, delay: Math.random() * 5 }}
                  className="absolute text-red-600/30 font-serif text-xl"
                  style={{ left: `${Math.random() * 100}%`, top: -50 }}
                >
                  ❀
                </motion.div>
              ))}
            </div>
  
            <div className="relative z-10 max-w-6xl mx-auto px-6">
              <SectionReveal className="text-center mb-16">
                <div className="flex items-center justify-center gap-4 mb-4">
                  <div className="w-16 h-px bg-gradient-to-r from-transparent to-red-500" />
                  <span className="text-red-500">♛</span>
                  <div className="w-16 h-px bg-gradient-to-l from-transparent to-red-500" />
                </div>
                <h2 className="font-['Playfair_Display'] text-3xl md:text-4xl font-medium text-red-50 mb-2">{events[2].name}</h2>
                <p className="font-serif text-lg text-red-200/60">{formatWeddingTime(events[2].time)} • {formatWeddingDate(events[2].date || date)}</p>
              </SectionReveal>
  
              {/* Collage */}
              <SectionReveal className="relative mb-16 px-4">
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-12 md:col-span-7">
                    <TemplateImage 
                      image={getActiveImage('event-2-image-0', events[2].image || "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1000")} 
                      isEditable={isEditable}
                      onEdit={() => onEditImage?.('event-2-image-0')}
                      onImageChange={(file) => handleLocalImageUpload('event-2-image-0', file)}
                      className="rounded-[48px] h-[300px] md:h-[500px] w-full shadow-[0_0_100px_rgba(220,38,38,0.2)] border-2 border-red-500/20" 
                    />
                  </div>
                  <div className="col-span-12 md:col-span-5 grid gap-4">
                    <TemplateImage 
                      image={getActiveImage('event-2-image-1', galleryImages[13] || "https://images.unsplash.com/photo-1519741497674-611481863552?w=800")} 
                      isEditable={isEditable}
                      onEdit={() => onEditImage?.('event-2-image-1')}
                      onImageChange={(file) => handleLocalImageUpload('event-2-image-1', file)}
                      className="rounded-[40px] h-[140px] md:h-[242px] w-full shadow-2xl border-2 border-red-500/20" 
                    />
                    <TemplateImage 
                      image={getActiveImage('event-2-image-2', galleryImages[14] || "https://images.unsplash.com/photo-1587271407850-8d438ca9fdf2?w=800")} 
                      isEditable={isEditable}
                      onEdit={() => onEditImage?.('event-2-image-2')}
                      onImageChange={(file) => handleLocalImageUpload('event-2-image-2', file)}
                      className="rounded-[40px] h-[140px] md:h-[242px] w-full shadow-2xl border-2 border-red-500/20" 
                    />
                  </div>
                </div>
              </SectionReveal>
  
              <div className="grid md:grid-cols-3 gap-8">
                {(events[2] as any).items ? (events[2] as any).items.map((item: any, idx: number) => (
                  <SectionReveal key={idx} delay={idx * 0.1} className="bg-white/10 backdrop-blur-xl border border-red-500/20 rounded-[32px] p-8 text-center shadow-2xl hover:shadow-red-500/20 hover:-translate-y-2 transition-all">
                    <div className={`w-14 h-14 mx-auto mb-5 rounded-full bg-red-950/60 flex items-center justify-center border border-red-500/30`}>
                       {item.icon ? <item.icon className="w-6 h-6 text-red-400" /> : <Crown className="w-6 h-6 text-red-400" />}
                    </div>
                    <h3 className="font-['Playfair_Display'] text-xl font-medium text-red-50 mb-2">{item.title}</h3>
                    <p className="font-serif text-red-200/70 mb-4">{item.desc}</p>
                    <div className="w-12 h-px bg-gradient-to-r from-red-600 to-red-400 mx-auto mb-4" />
                    <p className="font-serif text-sm text-red-500 tracking-wider font-semibold">{item.time}</p>
                    <p className="font-['Great_Vibes'] text-xl text-red-300 mt-1">{item.venue}</p>
                  </SectionReveal>
                )) : [
                  { icon: HeartHandshake, title: "Sacred Ceremony", desc: "Seven vows around the holy fire", time: "6:00 PM", venue: "Grand Palace Mandap" },
                  { icon: Wine, title: "Wedding Reception", desc: "An unforgettable royal evening", time: "8:00 PM", venue: "Imperial Celebration Hall" },
                  { icon: Crown, title: "Royal Dress Code", desc: "Classic royal wedding elegance", time: "Colors", venue: "Ivory, Red & Gold" },
                ].map((item, idx) => (
                  <SectionReveal key={idx} delay={idx * 0.1} className="bg-white/10 backdrop-blur-xl border border-red-500/20 rounded-[32px] p-8 text-center shadow-2xl hover:shadow-red-500/20 hover:-translate-y-2 transition-all">
                    <div className={`w-14 h-14 mx-auto mb-5 rounded-full bg-red-950/60 flex items-center justify-center border border-red-500/30`}>
                      <item.icon className="w-6 h-6 text-red-400" />
                    </div>
                    <h3 className="font-['Playfair_Display'] text-xl font-medium text-red-50 mb-2">{item.title}</h3>
                    <p className="font-serif text-red-200/70 mb-4">{item.desc}</p>
                    <div className="w-12 h-px bg-gradient-to-r from-red-600 to-red-400 mx-auto mb-4" />
                    <p className="font-serif text-sm text-red-500 tracking-wider font-semibold">{item.time}</p>
                    <p className="font-['Great_Vibes'] text-xl text-red-300 mt-1">{item.venue}</p>
                  </SectionReveal>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Additional Events Section */}
        {events.length > 3 && (
          <section id="additional-events" className="relative py-24 md:py-32 overflow-hidden bg-[#1a0f0f]">
             <div className="relative z-10 max-w-7xl mx-auto px-6">
               <SectionReveal className="text-center mb-16">
                 <h2 className="font-['Playfair_Display'] text-4xl md:text-5xl text-white font-medium mb-4 italic">More Celebrations</h2>
                 <div className="w-24 h-px bg-red-500/50 mx-auto" />
               </SectionReveal>
               
               <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                 {events.slice(3).map((event, idx) => (
                   <SectionReveal key={idx} delay={idx * 0.1} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[40px] overflow-hidden hover:-translate-y-2 transition-all group">
                     <div className="h-64 overflow-hidden">
                       <TemplateImage 
                         image={getActiveImage(`event-${idx + 3}-image`, event.image)} 
                         isEditable={isEditable}
                         onEdit={() => onEditImage?.(`event-${idx + 3}-image`)}
                         onImageChange={(file) => handleLocalImageUpload(`event-${idx + 3}-image`, file)}
                         className="w-full h-full group-hover:scale-110 transition-transform duration-700" 
                       />
                     </div>
                     <div className="p-8">
                       <p className="text-red-400 font-serif tracking-widest text-xs uppercase mb-3">{formatWeddingTime(event.time)} • {formatWeddingDate(event.date || date)}</p>
                       <h3 className="font-['Playfair_Display'] text-2xl text-white font-medium mb-3 italic">{event.name}</h3>
                       <p className="text-white/40 mb-6 flex items-start gap-2">
                          <Crown className="w-4 h-4 text-red-500 shrink-0" />
                          {event.location}
                       </p>
                       
                       <div className="flex flex-wrap gap-3">
                         {(event as any).googleMapsLink && (
                           <a 
                             href={(event as any).googleMapsLink}
                             target="_blank"
                             rel="noopener noreferrer"
                             className="text-white/60 hover:text-white text-sm underline underline-offset-4 transition-colors"
                           >
                             View Location
                           </a>
                         )}
                         {(event as any).paymentLink && (
                           <a 
                             href={(event as any).paymentLink}
                             target="_blank"
                             rel="noopener noreferrer"
                             className="bg-red-600/80 hover:bg-red-600 text-white text-xs px-4 py-2 rounded-full transition-all"
                           >
                             {(event as any).buttonText || paymentButtonText}
                           </a>
                         )}
                       </div>
                     </div>
                   </SectionReveal>
                 ))}
               </div>
             </div>
          </section>
        )}

        {/* Details Section */}
        <section id="details" className="relative py-24 md:py-32 overflow-hidden bg-gradient-to-b from-[#fefcf7] via-[#faf5ff] to-rose-50/10">
          <div className="relative z-10 max-w-5xl mx-auto px-6">
            <SectionReveal className="text-center mb-16">
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="w-16 h-px bg-gradient-to-r from-transparent to-purple-300" />
                <span className="text-[#d4af37]">❦</span>
                <div className="w-16 h-px bg-gradient-to-l from-transparent to-purple-300" />
              </div>
              <h2 className="font-['Playfair_Display'] text-3xl md:text-4xl font-medium text-purple-800 mb-2">Summary & Logistics</h2>
              <p className="font-serif text-lg text-purple-500/70">Final details for our royal celebration</p>
            </SectionReveal>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: Church, title: "The Ceremony", desc: "Exchange of vows beneath wisteria", time: "2:00 PM", venue: venue, color: "bg-purple-100" },
                { icon: GlassWater, title: "The Reception", desc: "An evening of dinner and dance", time: "5:00 PM", venue: "Wisteria Grand Ballroom", color: "bg-rose-100" },
                { icon: Sparkles, title: "Dress Code", desc: "Lavender fairytale elegance", time: "Colors", venue: "Lavender & Ivory", color: "bg-yellow-100" },
              ].map((item, idx) => (
                <SectionReveal key={idx} delay={idx * 0.1} className="bg-white/55 backdrop-blur-xl border border-purple-200/30 rounded-[32px] p-8 text-center shadow-xl hover:shadow-2xl transition-all">
                  <div className={`w-14 h-14 mx-auto mb-5 rounded-full ${item.color} flex items-center justify-center`}>
                    <item.icon className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="font-['Playfair_Display'] text-xl font-medium text-purple-800 mb-2">{item.title}</h3>
                  <p className="font-serif text-purple-600/70 mb-4">{item.desc}</p>
                  <div className="w-12 h-px bg-gradient-to-r from-purple-300 to-[#d4af37] mx-auto mb-4" />
                  <p className="font-serif text-sm text-purple-500 tracking-wider font-semibold">{idx === 0 ? formattedTime : item.time}</p>
                  <p className="font-['Great_Vibes'] text-xl text-purple-600 mt-1">{item.venue}</p>
                </SectionReveal>
              ))}
            </div>

            <SectionReveal delay={0.4} className="mt-16 bg-white/55 backdrop-blur-xl border border-purple-200/30 rounded-[32px] p-8 md:p-12 text-center shadow-2xl">
              <p className="font-serif text-sm tracking-[0.3em] uppercase text-purple-400 mb-6">Counting Down To Our Forever</p>
              <div className="flex justify-center gap-4 md:gap-10">
                {[
                  { label: "Days", val: timeLeft.days },
                  { label: "Hours", val: timeLeft.hours },
                  { label: "Minutes", val: timeLeft.minutes },
                  { label: "Seconds", val: timeLeft.seconds },
                ].map((item, i) => (
                  <React.Fragment key={i}>
                    <div className="flex flex-col items-center">
                      <span className="font-['Playfair_Display'] text-4xl md:text-5xl font-semibold text-purple-700">{item.val}</span>
                      <p className="font-serif text-xs md:text-sm text-purple-400 mt-1 tracking-wider uppercase">{item.label}</p>
                    </div>
                    {i < 3 && <div className="text-3xl text-purple-200 mt-1">:</div>}
                  </React.Fragment>
                ))}
              </div>
              <p className="font-['Great_Vibes'] text-2xl text-purple-500 mt-8">{formattedDate}</p>
            </SectionReveal>
          </div>
        </section>

        {/* Gallery Section */}
        <section id="gallery" className="relative py-24 md:py-32 overflow-hidden bg-white">
          <div className="relative z-10 max-w-6xl mx-auto px-6">
            <SectionReveal className="text-center mb-16">
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="w-16 h-px bg-gradient-to-r from-transparent to-purple-300" />
                <span className="text-[#d4af37]">✿</span>
                <div className="w-16 h-px bg-gradient-to-l from-transparent to-purple-300" />
              </div>
              <h2 className="font-['Playfair_Display'] text-3xl md:text-4xl font-medium text-purple-800 mb-2">Enchanted Gallery</h2>
              <p className="font-serif text-lg text-purple-500/70">Visions from our dreamy fairytale world</p>
            </SectionReveal>

            <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
              {gallery.slice(0, 9).map((img, i) => (
                <SectionReveal key={i} delay={i * 0.1} className="relative group overflow-hidden rounded-[32px] shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
                  <TemplateImage 
                    image={getActiveImage(`gallery-${i}`, img)} 
                    isEditable={isEditable}
                    onEdit={() => onEditImage?.(`gallery-${i}`)}
                    onImageChange={(file) => handleLocalImageUpload(`gallery-${i}`, file)}
                    className="w-full h-auto min-h-[250px] group-hover:scale-110 transition-transform duration-700" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-purple-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-6 pointer-events-none">
                    <span className="font-serif text-white text-lg drop-shadow-md">A Moment of Love</span>
                  </div>
                </SectionReveal>
              ))}
            </div>
          </div>
        </section>

        {/* RSVP Section */}
        <section id="rsvp" className="relative py-24 md:py-32 overflow-hidden bg-gradient-to-b from-white via-purple-50/50 to-[#fefcf7]">
          <div className="relative z-10 max-w-xl mx-auto px-6">
            <SectionReveal className="text-center mb-12">
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="w-16 h-px bg-gradient-to-r from-transparent to-purple-300" />
                <span className="text-[#d4af37]">✦</span>
                <div className="w-16 h-px bg-gradient-to-l from-transparent to-purple-300" />
              </div>
              <h2 className="font-['Playfair_Display'] text-3xl md:text-4xl font-medium text-purple-800 mb-2">{rsvpTitle}</h2>
              <p className="font-serif text-lg text-purple-500/70">{rsvpSubtitle}</p>
            </SectionReveal>

            <motion.div
               initial={{ opacity: 0, y: 30 }}
               whileInView={{ opacity: 1, y: 0 }}
               className="bg-white/70 backdrop-blur-xl border border-purple-200/30 rounded-[32px] p-8 md:p-10 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Heart className="w-20 h-20 text-purple-400 fill-current" />
              </div>

              {!isRSVPSubmitted ? (
                <form onSubmit={handleRSVP} className="relative z-10">
                  <div className="mb-6">
                    <label className="font-serif text-xs tracking-widest uppercase text-purple-500 mb-2 block">Your Name</label>
                    <input type="text" required className="w-full bg-white/50 border border-purple-200/30 rounded-2xl px-5 py-3 font-serif text-lg text-purple-800 focus:ring-2 focus:ring-purple-200 transition-all outline-none" placeholder="Enter your full name" />
                  </div>
                  <div className="mb-6">
                    <label className="font-serif text-xs tracking-widest uppercase text-purple-500 mb-2 block">Email</label>
                    <input type="email" required className="w-full bg-white/50 border border-purple-200/30 rounded-2xl px-5 py-3 font-serif text-lg text-purple-800 focus:ring-2 focus:ring-purple-200 transition-all outline-none" placeholder="your@email.com" />
                  </div>
                  <div className="mb-6">
                    <label className="font-serif text-xs tracking-widest uppercase text-purple-500 mb-2 block">Attendance</label>
                    <div className="grid grid-cols-2 gap-4">
                      <label className="relative">
                        <input type="radio" name="att" className="peer sr-only" defaultChecked />
                        <div className="peer-checked:bg-purple-600 peer-checked:text-white bg-white/50 border border-purple-100 rounded-2xl py-3 text-center cursor-pointer transition-all">Accept</div>
                      </label>
                      <label className="relative">
                        <input type="radio" name="att" className="peer sr-only" />
                        <div className="peer-checked:bg-purple-600 peer-checked:text-white bg-white/50 border border-purple-100 rounded-2xl py-3 text-center cursor-pointer transition-all">Decline</div>
                      </label>
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-gradient-to-r from-purple-500 to-purple-800 text-white rounded-full py-4 text-lg font-serif tracking-widest shadow-lg hover:shadow-purple-500/30 transition-all active:scale-95">
                    ✨ {rsvpButtonText}
                  </button>
                </form>
              ) : (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-10">
                  <Heart className="w-12 h-12 text-purple-500 mx-auto mb-4 animate-pulse" />
                  <h3 className="font-['Playfair_Display'] text-2xl text-purple-800 mb-2">Thank You!</h3>
                  <p className="font-serif text-purple-600/70">Your response has been received with love.</p>
                  <button onClick={() => setIsRSVPSubmitted(false)} className="mt-6 text-purple-400 hover:text-purple-600 text-sm font-serif underline decoration-dotted">Update Response</button>
                </motion.div>
              )}
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="relative py-20 bg-ivory-50/50 border-t border-purple-100/30 text-center overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(168,85,247,0.05)_0%,transparent_70%)]" />
          <div className="relative z-10 max-w-4xl mx-auto px-6">
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="w-16 h-px bg-gradient-to-r from-transparent to-purple-300" />
              <span className="text-[#d4af37]">❧</span>
              <div className="w-16 h-px bg-gradient-to-l from-transparent to-purple-300" />
            </div>
            <p className="font-['Great_Vibes'] text-4xl md:text-5xl text-purple-600 mb-3">{brideName} & {groomName}</p>
            <p className="font-serif text-lg text-purple-400 mb-6">{formattedDate} • {venue}</p>
            <div className="flex justify-center gap-6 mt-8">
              {[Instagram, Mail, Heart].map((Icon, i) => (
                <a key={i} href="#" className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-400 hover:bg-purple-500 hover:text-white transition-all duration-300 shadow-sm">
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
            <p className="font-serif text-sm text-purple-300 mt-10 tracking-widest uppercase">{footerText}</p>
          </div>
        </footer>

        {/* Invitation Modal */}
        <AnimatePresence>
          {isInvitationOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsInvitationOpen(false)}
              className="fixed inset-0 z-[100] bg-purple-900/30 backdrop-blur-md flex items-center justify-center p-6"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white/90 backdrop-blur-2xl border border-purple-200/40 rounded-[32px] max-w-[560px] w-full p-8 md:p-12 text-center shadow-3xl"
              >
                <div className="flex items-center justify-center gap-4 mb-4">
                  <div className="w-16 h-px bg-gradient-to-r from-transparent to-purple-300" />
                  <span className="text-[#d4af37]">✿</span>
                  <div className="w-16 h-px bg-gradient-to-l from-transparent to-purple-300" />
                </div>
                <p className="font-serif text-xs tracking-[0.3em] uppercase text-purple-400 mb-4">{modalLabel}</p>
                <p className="font-['Great_ Vibes'] text-5xl text-purple-600 mb-6">{brideName} & {groomName}</p>
                <p className="font-serif text-xl text-purple-500/80 mb-6 leading-relaxed">
                  {modalTitle}
                </p>
                <div className="w-16 h-px bg-gradient-to-r from-purple-300 to-[#eddb9e] mx-auto mb-6" />
                <p className="font-['Playfair_Display'] text-2xl text-purple-700 mb-1">{formattedDate}</p>
                <p className="font-serif text-purple-500/70 mb-4">{modalSubtitle || formattedTime}</p>
                <p className="font-['Great_Vibes'] text-2xl text-purple-500 mb-8">{venue}</p>
                <button
                   onClick={() => setIsInvitationOpen(false)}
                   className="bg-gradient-to-r from-purple-500 to-purple-800 text-white rounded-full px-10 py-3 text-lg font-serif tracking-widest shadow-lg hover:shadow-purple-500/30 transition-all active:scale-95"
                >
                  {modalButtonText}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function SectionReveal({ children, delay = 0, className = "" }: { children: React.ReactNode, delay?: number, className?: string, key?: any }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <div ref={ref} className={className}>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </div>
  );
}
