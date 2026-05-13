import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  MapPin,
  Heart,
  Phone,
  Flower,
} from "lucide-react";
import TemplateImage from '../TemplateImage';
import { GaneshSymbol } from './HousewarmingDecorations';

// ─── Types ─────────────────────────────────────────────────────────────────

interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface EventData {
  title: string;
  date: string;
  time: string;
  desc: string;
  img: string;
  name?: string;
  description?: string;
  image?: string;
}

interface GalleryItem {
  src: string;
  alt: string;
  tall: boolean;
}

interface HotelData {
  name: string;
  type: string;
  distance: string;
  price: string;
  img: string;
  phone: string;
}

interface MilestoneData {
  date: string;
  title: string;
  text: string;
}

interface RSVPFormState {
  name: string;
  guests: string;
  attending: string;
}

interface RSVPFormErrors {
  name?: string;
  [key: string]: string | undefined;
}

// ─── Layout Frame ──────────────────────────────────────────────────────────
const TemplateFrame = ({ children, isPreview = false }: { children: React.ReactNode; isPreview?: boolean }) => (
  <div
    className={`relative mx-auto bg-white shadow-2xl overflow-hidden ${isPreview ? 'h-full overflow-y-auto' : 'min-h-screen'}`}
    style={{ width: '100%', maxWidth: '1600px', minHeight: isPreview ? '100%' : '100vh' }}
  >
    {children}
  </div>
);

// ─── Global Styles ─────────────────────────────────────────────────────────
const GlobalStyles = () => (
  <style dangerouslySetInnerHTML={{ __html: `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Inter:wght@300;400;500;600&display=swap');

    *, *::before, *::after { box-sizing: border-box; }

    html, body, #root {
      overflow-x: hidden;
      width: 100%;
    }

    .irt {
      --navy: #1F2A44; --navy-dark: #151D33; --navy-light: #2A3654; --navy-deep: #0D1321;
      --gold: #D4AF37; --gold-light: #E8D48B; --gold-dark: #B8962E; --gold-muted: #C4A84D;
      --cream: #F5EFE0; --cream-dark: #E8DFCF;
      scroll-behavior: smooth;
      font-family: 'Inter', sans-serif;
      background: #F5F5F5;
      overflow-x: hidden;
      -webkit-tap-highlight-color: transparent;
      touch-action: manipulation;
    }
    .irt ::selection { background: rgba(212,175,55,0.3); color: #1F2A44; }

    /* GPU acceleration */
    .gpu { will-change: transform, opacity; transform: translateZ(0); backface-visibility: hidden; }

    /* Site reveal */
    .site-enter { animation: siteReveal 1.2s cubic-bezier(0.16,1,0.3,1) both; }
    @keyframes siteReveal { 0%{opacity:0;transform:translateY(12px)} 100%{opacity:1;transform:translateY(0)} }

    /* Scroll reveal */
    .sr { opacity:0; transform:translateY(28px); transition:opacity 0.9s cubic-bezier(0.16,1,0.3,1),transform 0.9s cubic-bezier(0.16,1,0.3,1); }
    .sr.fl { transform:translateX(-36px); }
    .sr.fr { transform:translateX(36px); }
    .sr.si { transform:scale(0.92); }
    .sr.on { opacity:1; transform:translateY(0) translateX(0) scale(1); }
    .d1{transition-delay:.1s} .d2{transition-delay:.2s} .d3{transition-delay:.3s} .d4{transition-delay:.4s} .d5{transition-delay:.5s}

    /* Bounce */
    .bounce { animation: bounce 2.2s cubic-bezier(0.37,0,0.63,1) infinite; }
    @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(8px)} }

    /* Gold shimmer */
    .gold-shimmer {
      background: linear-gradient(110deg,#D4AF37 0%,#F0D875 40%,#D4AF37 60%,#B8962E 100%);
      background-size:200% 100%; -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent;
      animation:shimmer 4s ease-in-out infinite;
    }
    @keyframes shimmer { 0%,100%{background-position:200% center} 50%{background-position:0% center} }

    /* Timeline */
    .tl-line { position:absolute; left:50%; top:0; bottom:0; width:1px; background:linear-gradient(to bottom,transparent,#D4AF37,transparent); transform:translateX(-50%); }
    .tl-dot { width:10px; height:10px; border-radius:50%; background:#D4AF37; border:3px solid #1F2A44; box-shadow:0 0 0 2px #D4AF37; position:absolute; left:50%; transform:translateX(-50%); z-index:2; }

    /* Scroll progress */
    .sp { position:fixed; top:0; left:0; height:2px; background:linear-gradient(90deg,#D4AF37,#F0D875); z-index:9999; transition:width 0.1s linear; }

    /* Navy bg */
    .navy-bg { background-color:#1F2A44; background-image:radial-gradient(ellipse at 20% 50%,rgba(212,175,55,0.04) 0%,transparent 60%),radial-gradient(ellipse at 80% 50%,rgba(212,175,55,0.03) 0%,transparent 60%); }

    /* Hover lift — desktop only */
    .hlift { transition:transform 0.4s cubic-bezier(0.16,1,0.3,1),box-shadow 0.4s ease; }
    @media (min-width:768px) {
      .hlift:hover { transform:translateY(-5px); box-shadow:0 16px 40px rgba(31,42,68,0.12); }
    }

    /* Story image */
    .si-wrap {
      position:relative; overflow:hidden;
      box-shadow:0 20px 50px rgba(0,0,0,0.12),0 6px 16px rgba(0,0,0,0.06);
      opacity:0; transform:translateY(30px) scale(0.97);
      transition:opacity 1.2s cubic-bezier(0.16,1,0.3,1),transform 1.2s cubic-bezier(0.16,1,0.3,1),box-shadow 0.6s;
      /* FIX: ensure minimum height so image doesn't collapse while loading */
      min-height: 240px;
    }
    .si-wrap.on { opacity:1; transform:translateY(0) scale(1); }
    @media (min-width:768px) {
      .si-wrap:hover { transform:scale(1.02); box-shadow:0 30px 70px rgba(0,0,0,0.16),0 10px 24px rgba(0,0,0,0.08); }
      .si-wrap:hover img { transform:scale(1.05); }
    }
    .si-wrap img { object-fit:cover; width:100%; height:100%; display:block; transition:transform 0.8s cubic-bezier(0.16,1,0.3,1); }
    .si-border { position:absolute; inset:5px; border:1px solid rgba(212,175,55,0.25); pointer-events:none; z-index:2; transition:border-color 0.6s; border-radius:inherit; }
    .si-wrap:hover .si-border { border-color:rgba(212,175,55,0.45); }
    .si-depth { position:absolute; bottom:0; left:0; right:0; height:40%; background:linear-gradient(to top,rgba(0,0,0,0.1),transparent); pointer-events:none; z-index:1; }
    .si-frame { position:absolute; inset:-12px; border-radius:1.75rem; border:1px solid rgba(212,175,55,0.12); pointer-events:none; z-index:-1; transition:border-color 0.6s ease, inset 0.6s ease; }
    .si-wrap:hover .si-frame { border-color:rgba(212,175,55,0.25); inset:-16px; }

    /* Gallery item */
    .gi {
      position:relative; overflow:hidden;
      box-shadow:0 10px 30px rgba(0,0,0,0.08);
      opacity:0; transform:translateY(40px);
      transition:opacity 1.2s cubic-bezier(0.16,1,0.3,1),transform 1.2s cubic-bezier(0.16,1,0.3,1),box-shadow 0.8s;
    }
    .gi.on { opacity:1; transform:translateY(0); }
    @media (min-width:768px) {
      .gi:hover { box-shadow:0 25px 70px rgba(0,0,0,0.18); }
    }
    .gi img,.gi-img { object-fit:cover; width:100%; height:100%; display:block; transition:transform 0.8s cubic-bezier(0.16,1,0.3,1); }
    @media (min-width:768px) {
      .gi:hover img,.gi:hover .gi-img { transform:scale(1.04); }
    }
    .gi-ov { position:absolute; inset:0; background:linear-gradient(transparent,rgba(0,0,0,0)); pointer-events:none; z-index:2; transition:background 0.8s; }
    @media (min-width:768px) {
      .gi:hover .gi-ov { background:linear-gradient(transparent,rgba(0,0,0,0.25)); }
    }

    /* Timeline image */
    .ti {
      position:relative; overflow:hidden;
      box-shadow:0 12px 35px rgba(0,0,0,0.1);
      opacity:0; transform:translateY(40px);
      transition:opacity 1.2s cubic-bezier(0.16,1,0.3,1),transform 1.2s cubic-bezier(0.16,1,0.3,1),box-shadow 0.8s;
    }
    .ti.on { opacity:1; transform:translateY(0); }
    @media (min-width:768px) {
      .ti:hover { transform:scale(1.02); box-shadow:0 25px 70px rgba(0,0,0,0.18); }
      .ti:hover img { transform:scale(1.05); }
    }
    .ti img { object-fit:cover; width:100%; height:100%; display:block; transition:transform 0.8s cubic-bezier(0.16,1,0.3,1); }
    .ti-glow { position:absolute; inset:0; box-shadow:inset 0 0 0 1px rgba(212,175,55,0.15); pointer-events:none; z-index:2; transition:box-shadow 0.6s; border-radius:inherit; }
    .ti:hover .ti-glow { box-shadow:inset 0 0 0 2px rgba(212,175,55,0.35); }

    /* Mobile card reset */
    .mc .ti { border-radius:0; }
    .mc .ti-glow { border-radius:0; }

    /* Form */
    .fi { width:100%; padding:12px 16px; border:1px solid #E0D5C0; border-radius:12px; font-family:'Inter',sans-serif; font-size:14px; background:#FFFEF8; transition:border-color 0.3s,box-shadow 0.3s; outline:none; color:#1F2A44; -webkit-appearance:none; }
    .fi:focus { border-color:#D4AF37; box-shadow:0 0 0 3px rgba(212,175,55,0.15); }
    .fi::placeholder { color:#B0A890; }

    /* Radio — FIX: min-height for wrapping text on small screens */
    .rc { flex:1; padding:12px 10px; border:2px solid #E0D5C0; border-radius:12px; text-align:center; cursor:pointer; transition:all 0.3s; background:#FFFEF8; min-width:0; min-height:48px; display:flex; align-items:center; justify-content:center; }
    .rc:hover { border-color:#D4AF37; }
    .rc.act { border-color:#D4AF37; background:rgba(212,175,55,0.08); }

    /* Hero name — mobile-first, never overflows */
    .hero-name {
      font-family: 'Playfair Display', serif;
      font-weight: 700;
      color: white;
      text-align: center;
      line-height: 0.95;
      letter-spacing: -0.02em;
      text-shadow: 0 4px 20px rgba(0,0,0,0.35), 0 2px 4px rgba(0,0,0,0.2);
      font-size: clamp(2.2rem, 11vw, 6.5rem);
      white-space: normal;
      word-break: normal;
      overflow-wrap: break-word;
      hyphens: none;
      max-width: 100%;
      overflow: hidden;
      padding: 0 12px;
    }

    /* Hero video */
    .hero-vid {
      position: absolute; inset: 0; width: 100%; height: 100%;
      object-fit: cover; z-index: 0;
      transform: scale(1.05);
      animation: slowZoom 18s ease-in-out infinite alternate;
    }
    @keyframes slowZoom { from { transform: scale(1.05); } to { transform: scale(1.12); } }

    .hero-ov { position: absolute; inset: 0; z-index: 1; background: linear-gradient(rgba(5,5,10,0.45), rgba(5,5,10,0.72)); }
    .hero-vig { position: absolute; inset: 0; z-index: 2; background: radial-gradient(ellipse at center, transparent 50%, rgba(5,5,10,0.55) 100%); pointer-events: none; }
    .hero-glow { position: absolute; inset: 0; z-index: 3; background: radial-gradient(ellipse at 50% 40%, rgba(212,175,55,0.06) 0%, transparent 60%), radial-gradient(ellipse at 30% 70%, rgba(212,175,55,0.03) 0%, transparent 50%), radial-gradient(ellipse at 70% 70%, rgba(212,175,55,0.03) 0%, transparent 50%); pointer-events: none; }
    .hero-fade { opacity: 0; animation: heroFade 1.8s 0.3s cubic-bezier(0.16,1,0.3,1) forwards; }
    @keyframes heroFade { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }

    /* Shine */
    @keyframes shine { 0%{transform:translateX(-120%)} 100%{transform:translateX(120%)} }

    /* Video intro */
    #vi-wrap {
      position:fixed; inset:0; width:100%; height:100dvh;
      overflow:hidden; display:flex; align-items:center; justify-content:center;
      z-index:999999; background:#000;
      transition:opacity 1.1s cubic-bezier(0.16,1,0.3,1),visibility 1.1s;
    }
    #vi-wrap.out { opacity:0; visibility:hidden; pointer-events:none; }
    #vi-video { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; object-position:center; }

    /* Reduce heavy effects on mobile */
    @media (max-width:768px) {
      .gpu { will-change: auto; }
      .site-enter { animation-duration: 0.8s; }
      .sr { transform:translateY(20px); transition-duration: 0.7s; }

      /* Force single column for major layouts */
      .gallery-grid,
      .events-grid,
      .story-grid,
      .details-grid,
      .hotels-grid {
        grid-template-columns: 1fr !important;
        display: grid !important;
      }

      .row-span-2 {
        grid-row: span 1 !important;
      }

      /* Prevent horizontal overflow */
      html, body, #root, .irt, section, .template-root {
        overflow-x: hidden !important;
        width: 100% !important;
        max-width: 100vw !important;
        position: relative;
      }

      /* Fix text breaking and alignment */
      h1, h2, h3, h4, h5, h6, p, span, div, li {
        overflow-wrap: break-word !important;
        word-wrap: break-word !important;
        word-break: normal !important;
        hyphens: none !important;
      }

      .sr,
      .si-wrap,
      .ti,
      .gi,
      .mc,
      .ti-glow {
        transform: none !important;
        max-width: 100% !important;
        opacity: 1 !important; /* Force visible on mobile if intersection observer fails */
      }

      img {
        max-width: 100% !important;
        height: auto !important;
      }

      /* Spacing adjustments for mobile */
      section {
        padding-left: 1rem !important;
        padding-right: 1rem !important;
        width: 100% !important;
      }

      .max-w-\[1440px\], .max-w-3xl, .max-w-xl, .max-w-lg {
        max-width: 100% !important;
      }
    }

    /* Safe area */
    @supports (padding:max(0px)) {
      .safe-t { padding-top: max(env(safe-area-inset-top), 0px); }
      .safe-b { padding-bottom: max(env(safe-area-inset-bottom), 16px); }
    }

    body::-webkit-scrollbar { width:5px; }
    body::-webkit-scrollbar-track { background:#F5F5F5; }
    body::-webkit-scrollbar-thumb { background:#D4AF37; border-radius:3px; }
  ` }} />
);

// ─── Hooks ─────────────────────────────────────────────────────────────────
function useScrollReveal(dep: React.DependencyList) {
  useEffect(() => {
    const sel = '.sr:not(.on),.si-wrap:not(.on),.gi:not(.on),.ti:not(.on)';
    const els = document.querySelectorAll(sel);
    if (!els.length) return;
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('on'); obs.unobserve(e.target); } });
    }, { threshold: 0.06, rootMargin: '0px 0px -30px 0px' });
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, dep);
}

function useCountdown(targetDate: string) {
  const [left, setLeft] = useState<CountdownTime>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    const calc = (): CountdownTime => {
      const d = new Date(targetDate).getTime(), diff = Math.max(0, d - Date.now());
      return { days: Math.floor(diff / 86400000), hours: Math.floor((diff % 86400000) / 3600000), minutes: Math.floor((diff % 3600000) / 60000), seconds: Math.floor((diff % 60000) / 1000) };
    };
    setLeft(calc());
    const id = setInterval(() => setLeft(calc()), 1000);
    return () => clearInterval(id);
  }, [targetDate]);
  return left;
}

function useScrollProgress() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const h = () => { const t = document.documentElement.scrollHeight - window.innerHeight; setP(t > 0 ? (window.scrollY / t) * 100 : 0); };
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);
  return p;
}

// ─── Shared UI ─────────────────────────────────────────────────────────────
function GoldDivider() {
  return (
    <svg viewBox="0 0 200 30" className="w-14 sm:w-20 md:w-28 mx-auto my-3 sm:my-4 md:my-6" aria-hidden="true">
      <line x1="0" y1="15" x2="78" y2="15" stroke="#D4AF37" strokeWidth="0.7" opacity="0.6" />
      <path d="M82 15 L100 5 L118 15 L100 25 Z" fill="#D4AF37" opacity="0.7" />
      <line x1="122" y1="15" x2="200" y2="15" stroke="#D4AF37" strokeWidth="0.7" opacity="0.6" />
    </svg>
  );
}

const SectionHeading = ({ title, subtitle, light }: { title: string; subtitle: string; light?: boolean }) => (
  <div className="text-center mb-8 sm:mb-10 md:mb-12 sr">
    <p className={`font-inter text-[10px] sm:text-xs uppercase tracking-[0.25em] sm:tracking-[0.35em] mb-2 sm:mb-3 font-semibold ${light ? 'text-[#E8D48B]/70' : 'text-[#B8962E]/70'}`}>{subtitle}</p>
    <h2 className={`font-playfair font-bold ${light ? 'text-white' : 'text-[#1F2A44]'}`}
      style={{ fontSize: 'clamp(1.5rem, 6vw, 3rem)' }}>
      {title}
    </h2>
    <GoldDivider />
  </div>
);

const GoldButton = ({ children, className = '', onClick, type = 'button' }: {
  children: React.ReactNode; className?: string; onClick?: () => void; type?: 'button' | 'submit';
}) => (
  <button type={type} onClick={onClick}
    className={`inline-flex items-center justify-center px-5 sm:px-7 py-3 bg-[#D4AF37] text-[#1F2A44] font-inter font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-[#E8D48B] active:scale-[0.97] transition-all duration-300 hover:shadow-lg hover:shadow-[#D4AF37]/25 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 ${className}`}
    style={{ minHeight: '44px' }}>
    {children}
  </button>
);

function NavyFloralSeal({ size = 60 }: { size?: number }) {
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} aria-label="Floral wax seal">
      <defs>
        <radialGradient id="ns" cx="38%" cy="35%"><stop offset="0%" stopColor="#2a4070" /><stop offset="45%" stopColor="#1a2e55" /><stop offset="100%" stopColor="#0e1a33" /></radialGradient>
        <radialGradient id="gf" cx="40%" cy="35%"><stop offset="0%" stopColor="#F0D875" /><stop offset="50%" stopColor="#D4AF37" /><stop offset="100%" stopColor="#9E7E22" /></radialGradient>
      </defs>
      {Array.from({ length: 20 }, (_, i) => { const a = (i / 20) * Math.PI * 2, r = 54 + Math.sin(i * 3.7) * 2.5; return <circle key={i} cx={60 + r * Math.cos(a)} cy={60 + r * Math.sin(a)} r="3.2" fill="#162545" opacity="0.7" />; })}
      <circle cx="60" cy="60" r="51" fill="url(#ns)" />
      <circle cx="60" cy="60" r="47" fill="none" stroke="#D4AF37" strokeWidth="0.8" opacity="0.5" />
      <g fill="url(#gf)">
        <ellipse cx="55" cy="58" rx="8" ry="12" transform="rotate(-20 55 58)" />
        <ellipse cx="65" cy="58" rx="8" ry="12" transform="rotate(20 65 58)" />
        <ellipse cx="60" cy="52" rx="6" ry="11" />
        <ellipse cx="50" cy="64" rx="6" ry="9" transform="rotate(-45 50 64)" />
        <ellipse cx="70" cy="64" rx="6" ry="9" transform="rotate(45 70 64)" />
        <circle cx="60" cy="63" r="4.5" fill="#B8962E" />
        <circle cx="60" cy="63" r="2" fill="#9E7E22" />
      </g>
    </svg>
  );
}

// ─── HERO ──────────────────────────────────────────────────────────────────
const HeroSection = ({ brideName, groomName, date, venue, coverImage, isEditable, onImageEdit }: any) => {
  const cd = useCountdown(date);
  return (
    <section
      id="hero"
      className="relative w-full overflow-hidden"
      style={{ minHeight: 'clamp(560px, 85svh, 100svh)' }}
    >
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div className="hero-ov" />
        <div className="hero-vig" />
        <div className="hero-glow" />
        {coverImage ? (
          <TemplateImage image={coverImage} className="w-full h-full object-cover object-center"
            onEdit={() => onImageEdit?.('cover')} isEditable={isEditable} />
        ) : (
          <video autoPlay muted loop playsInline className="hero-vid"
            src="https://pub-4955b83e8ada4ae98b612bd6113cdc4c.r2.dev/Video%20Project%2041.mp4" />
        )}
      </div>

      {/* Ganesh symbol */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 1.1, ease: 'easeOut' }}
        className="absolute top-[4%] sm:top-[6%] left-1/2 -translate-x-1/2 z-20 opacity-90 drop-shadow-[0_0_20px_rgba(212,175,55,0.4)]"
        style={{ width: 'clamp(40px, 8vw, 80px)' }}
      >
        <GaneshSymbol className="w-full h-auto text-[#D4AF37]" />
      </motion.div>

      {/* Main content */}
      <div className="relative z-20 w-full max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 lg:px-16 flex flex-col items-center justify-center text-center safe-t safe-b py-16 sm:py-20 md:py-24"
        style={{ minHeight: 'clamp(560px, 85svh, 100svh)' }}>

        {/* "Together with families" label */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.3, ease: 'easeOut' }}
          className="mb-4 sm:mb-6 md:mb-8 w-full"
        >
          <div className="w-8 sm:w-12 md:w-16 h-px bg-[#D4AF37]/60 mx-auto mb-2 sm:mb-3" />
          <p
            className="font-playfair italic text-[#D4AF37] tracking-[0.2em] sm:tracking-[0.3em] uppercase font-medium"
            style={{ fontSize: 'clamp(0.6rem, 1.5vw, 0.875rem)', textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}
          >
            Together with their families
          </p>
          <div className="w-8 sm:w-12 md:w-16 h-px bg-[#D4AF37]/60 mx-auto mt-2 sm:mt-3" />
        </motion.div>

        {/* Names */}
        <motion.div
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 1.1, ease: 'easeOut' }}
          className="w-full max-w-[95vw] mx-auto"
        >
          <h1 className="hero-name">{brideName}</h1>

          {/* Heart divider */}
          <div className="flex items-center justify-center gap-3 sm:gap-5 py-2 sm:py-3">
            <div className="h-px w-6 sm:w-10 md:w-16 bg-[#D4AF37]/50" />
            <motion.div
              animate={{ scale: [1, 1.12, 1], rotate: [0, 4, -4, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
            >
              <Heart
                className="text-[#D4AF37] fill-[#D4AF37]/80 drop-shadow-[0_0_12px_rgba(212,175,55,0.5)]"
                style={{ width: 'clamp(18px, 4vw, 36px)', height: 'clamp(18px, 4vw, 36px)' }}
              />
            </motion.div>
            <div className="h-px w-6 sm:w-10 md:w-16 bg-[#D4AF37]/50" />
          </div>

          <h1 className="hero-name">{groomName}</h1>
        </motion.div>

        {/* Date / venue card — FIX: overflow-hidden + min-w-0 on venue flex child */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.9 }}
          className="relative mt-6 sm:mt-8 md:mt-10 w-full max-w-xs sm:max-w-sm md:max-w-md backdrop-blur-md bg-white/5 border border-white/10 px-4 py-4 sm:px-6 sm:py-6 md:px-10 md:py-8 rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden mx-auto"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/10 to-transparent opacity-50" />
          <div className="relative z-10 text-center space-y-1.5 sm:space-y-2">
            <p
              className="font-playfair italic text-[#D4AF37] tracking-[0.18em] uppercase font-semibold"
              style={{ fontSize: 'clamp(0.75rem, 2vw, 1.1rem)' }}
            >Save the Date</p>
            <div
              className="text-white font-playfair font-bold tracking-[0.06em]"
              style={{ fontSize: 'clamp(0.9rem, 2.5vw, 1.6rem)', textShadow: '0 2px 8px rgba(0,0,0,0.25)' }}
            >{date}</div>
            {/* FIX: min-w-0 on the flex container + overflow-hidden on the text span */}
            <div className="flex items-center justify-center gap-2 text-white/90 font-medium px-1 max-w-full overflow-hidden">
              <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#D4AF37] flex-shrink-0" />
              <span className="truncate min-w-0" style={{ fontSize: 'clamp(0.7rem, 1.6vw, 0.9rem)' }}>
                {typeof venue === 'string' ? venue : String(venue)}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Countdown — FIX: grid-cols-4 instead of flex-wrap to prevent wrapping on small screens */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.9 }}
          className="mt-5 sm:mt-7 md:mt-10 w-full max-w-xs sm:max-w-sm"
        >
          <div className="grid grid-cols-4 gap-2 sm:gap-4 md:gap-6">
            {[{ val: cd.days, label: 'Days' }, { val: cd.hours, label: 'Hrs' }, { val: cd.minutes, label: 'Min' }, { val: cd.seconds, label: 'Sec' }].map((it, i) => (
              <div key={i} className="text-center">
                <div
                  className="font-playfair font-bold text-[#D4AF37] tabular-nums"
                  style={{ fontSize: 'clamp(1.3rem, 6vw, 2.8rem)' }}
                >{String(it.val).padStart(2, '0')}</div>
                <div
                  className="font-inter uppercase tracking-[0.12em] text-white/55 mt-0.5 font-medium"
                  style={{ fontSize: 'clamp(0.5rem, 1.8vw, 0.65rem)' }}
                >{it.label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 0.9 }}
          className="absolute bottom-[3%] sm:bottom-[4%] left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 sm:gap-2"
        >
          <p className="font-inter text-[9px] uppercase tracking-[0.3em] text-[#D4AF37]/60 hidden sm:block">Scroll</p>
          <div className="w-px h-6 sm:h-10 md:h-14 bg-gradient-to-b from-[#D4AF37] to-transparent bounce" />
        </motion.div>
      </div>
    </section>
  );
};

// ─── INVITATION MESSAGE ────────────────────────────────────────────────────
const InvitationMessage = ({ brideName, groomName, date, location }: any) => (
  <section className="py-12 md:py-20 lg:py-32 px-4 sm:px-6 md:px-10 lg:px-16 bg-[#F5F5F5] gpu">
    <div className="max-w-3xl mx-auto sr">
      <div className="relative bg-white p-6 sm:p-8 md:p-12 lg:p-16 rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden"
        style={{ border: '1px solid rgba(212,175,55,0.2)' }}>
        <div className="absolute top-0 right-0 p-4 sm:p-6 opacity-10">
          <Flower className="w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 text-[#D4AF37]" strokeWidth={1} />
        </div>
        {['top-0 left-0', 'top-0 right-0', 'bottom-0 left-0', 'bottom-0 right-0'].map((pos, i) => (
          <div key={i} className={`absolute ${pos} w-7 h-7 sm:w-10 sm:h-10 md:w-12 md:h-12`} style={{ overflow: 'hidden' }}>
            <svg viewBox="0 0 32 32" className="w-full h-full">
              <path d={i === 0 ? 'M0 12 L0 0 L12 0' : i === 1 ? 'M20 0 L32 0 L32 12' : i === 2 ? 'M0 20 L0 32 L12 32' : 'M20 32 L32 32 L32 20'}
                fill="none" stroke="#D4AF37" strokeWidth="1.5" opacity="0.6" />
            </svg>
          </div>
        ))}
        <div className="text-center relative z-10">
          <p className="font-inter uppercase tracking-[0.3em] text-[#B8962E] font-bold mb-4 sm:mb-5"
            style={{ fontSize: 'clamp(0.6rem, 1.4vw, 0.8rem)' }}>You Are Cordially Invited</p>
          <GoldDivider />
          <p className="font-cormorant italic text-[#1F2A44]/90 leading-relaxed px-2 sm:px-6 md:px-8 font-medium"
            style={{ fontSize: 'clamp(1rem, 2.5vw, 1.8rem)' }}>
            Together with our families, we request the honour of your presence at the celebration of our marriage.
          </p>
          <GoldDivider />
          <p className="font-playfair font-bold text-[#1F2A44] mt-3 sm:mt-5 tracking-tight"
            style={{ fontSize: 'clamp(1.3rem, 4.5vw, 3rem)' }}>
            {brideName} <span className="font-cormorant italic font-normal mx-1 sm:mx-2 text-[#D4AF37]">&amp;</span> {groomName}
          </p>
          <p className="font-inter text-[#1F2A44]/60 mt-2 sm:mt-4 tracking-[0.06em] font-medium uppercase"
            style={{ fontSize: 'clamp(0.65rem, 1.6vw, 0.95rem)' }}>
            {date} <span className="mx-2 opacity-30">|</span> {location || 'Mumbai'}
          </p>
        </div>
      </div>
    </div>
  </section>
);

// ─── OUR STORY ─────────────────────────────────────────────────────────────
const OurStory = ({ brideName, groomName, story, isEditable, onImageEdit }: any) => {
  const milestones: MilestoneData[] = [
    { date: 'July 2021', title: 'We Met', text: `A chance encounter at a friend's dinner party in Mumbai turned into a conversation that lasted hours.` },
    { date: 'Dec 2023', title: 'The Proposal', text: `Under a canopy of fairy lights in Jaipur, ${groomName} got down on one knee and changed their lives forever.` },
    { date: 'Mar 2025', title: 'Forever Begins', text: `Surrounded by love and blessings, ${brideName} and ${groomName} take the next step in their beautiful journey together.` },
  ];

  return (
    <section className="py-12 md:py-20 lg:py-32 px-4 sm:px-6 md:px-10 lg:px-16 bg-white overflow-hidden gpu">
      <div className="max-w-[1440px] mx-auto">
        <SectionHeading title="Our Story" subtitle="How it all began" />
        <div className="story-grid grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-14 lg:gap-20 items-center w-full">
          <div className="sr fl w-full mb-4 lg:mb-0">
            <div className="relative max-w-full sm:max-w-sm mx-auto">
              {/* FIX: responsive aspect ratio to avoid excessively tall images on mobile */}
              <div className="si-wrap rounded-2xl sm:rounded-3xl aspect-video sm:aspect-[4/5] shadow-xl w-full">
                <TemplateImage image="https://pub-4955b83e8ada4ae98b612bd6113cdc4c.r2.dev/download%20(10).jpg"
                  alt="A love story" className="w-full h-full object-cover"
                  isEditable={isEditable} onEdit={() => onImageEdit?.("story")} />
                <div className="si-depth" />
                <div className="si-border" />
              </div>
              <div className="si-frame" />
            </div>
          </div>
          <div className="sr fr lg:pl-6">
            <p className="font-inter uppercase tracking-[0.3em] text-[#B8962E] mb-3 sm:mb-5 font-bold"
              style={{ fontSize: 'clamp(0.6rem, 1.3vw, 0.8rem)' }}>A Love Story</p>
            <h3 className="font-playfair font-bold text-[#1F2A44] mb-4 sm:mb-6 leading-tight"
              style={{ fontSize: 'clamp(1.4rem, 4vw, 2.75rem)' }}>
              From a chance encounter to a lifetime together
            </h3>
            <p className="font-inter text-[#1F2A44]/70 leading-relaxed mb-3 sm:mb-5 max-w-lg"
              style={{ fontSize: 'clamp(0.85rem, 1.7vw, 1.05rem)' }}>
              Our journey began in the bustling streets of Mumbai, where a chance encounter at a friend's gathering turned into a conversation that lasted hours. From coffee dates at quiet cafes to midnight walks along Marine Drive, every day with {groomName} felt like coming home.
            </p>
            <p className="font-inter text-[#1F2A44]/70 leading-relaxed mb-6 sm:mb-8 max-w-lg"
              style={{ fontSize: 'clamp(0.85rem, 1.7vw, 1.05rem)' }}>
              Three years later, under a canopy of fairy lights in Jaipur, he got down on one knee and asked the question that changed our lives forever. Now, we can't wait to begin our greatest adventure together.
            </p>
            <div className="space-y-6 sm:space-y-8">
              {milestones.map((m, i) => (
                <div key={i} className={`flex flex-col sm:flex-row gap-3 sm:gap-5 items-start sr d${i + 1}`}>
                  <div className="flex-shrink-0 sm:w-16 text-left sm:text-right">
                    <span className="font-inter text-[#B8962E] font-bold"
                      style={{ fontSize: 'clamp(0.65rem, 1.2vw, 0.8rem)' }}>{m.date}</span>
                  </div>
                  <div className="hidden sm:block flex-shrink-0 w-2 h-2 rounded-full bg-[#D4AF37] mt-1.5 shadow-[0_0_8px_rgba(212,175,55,0.5)]" />
                  <div className="min-w-0 flex-1">
                    <p className="font-playfair font-bold text-[#1F2A44] mb-1 tracking-tight"
                      style={{ fontSize: 'clamp(1rem, 2vw, 1.3rem)' }}>{m.title}</p>
                    <p className="font-inter text-[#1F2A44]/60 leading-relaxed font-medium"
                      style={{ fontSize: 'clamp(0.85rem, 1.4vw, 0.95rem)' }}>{m.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ─── TIMELINE ──────────────────────────────────────────────────────────────
const TimelineSection = ({ events, isEditable, onImageEdit }: { events: any[]; isEditable?: boolean; onImageEdit?: any }) => {
  const defaultEvents: EventData[] = [
    { title: 'Mehendi', date: 'March 15, 2025', time: '2:00 PM Onwards', desc: 'A vibrant celebration of art, music, and togetherness as families come together for intricate henna designs.', img: 'https://pub-4955b83e8ada4ae98b612bd6113cdc4c.r2.dev/download%20(14).jpg' },
    { title: 'Sangeet', date: 'March 16, 2025', time: '7:00 PM Onwards', desc: 'An evening of music, dance, and unforgettable performances by family and friends.', img: 'https://pub-4955b83e8ada4ae98b612bd6113cdc4c.r2.dev/wedding%20invitation%20image.jpg' },
    { title: 'Wedding Ceremony', date: 'March 17, 2025', time: '10:00 AM Onwards', desc: 'The sacred union of two souls, surrounded by the love and blessings of family and friends.', img: 'https://pub-4955b83e8ada4ae98b612bd6113cdc4c.r2.dev/this%20is%20Soo%20beautiful%20%E2%9D%A4%EF%B8%8F%F0%9F%98%8D.jpg' },
  ];

  const evList = events && events.length ? events : defaultEvents;

  return (
    <section className="py-12 md:py-20 lg:py-32 px-4 sm:px-6 md:px-10 lg:px-16 navy-bg overflow-hidden gpu">
      <SectionHeading title="Celebration Events" subtitle="Join us for every moment" light />
      <div className="max-w-[1440px] mx-auto">
        {/* Desktop timeline */}
        <div className="hidden lg:block relative">
          <div className="tl-line" />
          {evList.map((ev, i) => {
            const name = ev.name || ev.title;
            const desc = ev.description || ev.desc;
            const img = ev.image || ev.img;
            return (
              <div key={i} className={`relative flex items-center mb-16 last:mb-0 ${i % 2 !== 0 ? 'flex-row-reverse' : ''}`}>
                <div className="tl-dot" style={{ top: '50%', transform: 'translate(-50%,-50%)' }} />
                <div className={`w-full lg:w-[45%] sr ${i % 2 === 0 ? 'fl pr-14 text-right' : 'fr pl-14 text-left'}`}>
                  <p className="font-inter uppercase tracking-[0.2em] text-[#E8D48B] mb-2 font-semibold"
                    style={{ fontSize: 'clamp(0.7rem, 1.4vw, 0.9rem)' }}>
                    {ev.date} <span className="mx-2 opacity-30">·</span> {ev.time}
                  </p>
                  <h3 className="font-playfair font-bold text-white mb-3 tracking-tight"
                    style={{ fontSize: 'clamp(1.4rem, 3vw, 2.5rem)' }}>{name}</h3>
                  <p className="font-inter text-white/50 leading-relaxed font-medium"
                    style={{ fontSize: 'clamp(0.82rem, 1.4vw, 1rem)' }}>
                    {desc}
                  </p>
                </div>
                <div className="hidden lg:block w-[10%]" />
                <div className="w-[45%] sr d2">
                  <div className={`ti aspect-[16/10] max-w-sm rounded-2xl overflow-hidden shadow-xl ${i % 2 === 0 ? 'ml-auto' : 'mr-auto'}`}>
                    <TemplateImage image={img} alt={name} className="w-full h-full object-cover"
                      isEditable={isEditable} onEdit={() => onImageEdit?.("event", i)} />
                    <div className="ti-glow" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile / tablet stacked cards — FIX: grid + gap for consistent spacing */}
        <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 events-grid">
          {evList.map((ev, i) => {
            const name = ev.name || ev.title;
            const desc = ev.description || ev.desc;
            const img = ev.image || ev.img;
            return (
              <div key={i} className={`mc sr d${i + 1} bg-white/5 backdrop-blur-xl rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10 shadow-xl w-full max-w-lg mx-auto flex flex-col h-full`}>
                {/* FIX: reduced image aspect ratio for mobile to save vertical space */}
                <div className="ti aspect-[16/8] overflow-hidden flex-shrink-0">
                  <TemplateImage image={img} alt={name} className="w-full h-full object-cover"
                    isEditable={isEditable} onEdit={() => onImageEdit?.("event", i)} />
                  <div className="ti-glow" />
                </div>
                <div className="p-5 sm:p-8 flex flex-col flex-1">
                  <p className="font-inter uppercase tracking-[0.2em] text-[#E8D48B] font-bold mb-2.5"
                    style={{ fontSize: 'clamp(0.65rem, 1.3vw, 0.72rem)' }}>{ev.date} · {ev.time}</p>
                  <h3 className="font-playfair font-bold text-white mb-3 tracking-tight"
                    style={{ fontSize: 'clamp(1.2rem, 3vw, 1.75rem)' }}>{name}</h3>
                  <p className="font-inter text-white/50 leading-relaxed font-medium"
                    style={{ fontSize: 'clamp(0.8rem, 1.4vw, 0.92rem)' }}>{desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

// ─── DETAILS ───────────────────────────────────────────────────────────────
const DetailsSection = ({ date, location }: any) => {
  const details = [
    { icon: <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" strokeWidth="1.2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>, label: 'The Date', value: date },
    { icon: <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" strokeWidth="1.2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>, label: 'The Time', value: '10:00 AM Onwards' },
    { icon: <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>, label: 'The Venue', value: location },
    { icon: <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>, label: 'The Style', value: 'Traditional Indian Attire' },
  ];
  return (
    <section className="py-12 md:py-20 lg:py-32 px-4 sm:px-6 md:px-10 lg:px-16 bg-white gpu">
      <div className="max-w-[1440px] mx-auto">
        <SectionHeading title="Wedding Details" subtitle="Everything you need to know" />
        <div className="details-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {details.map((d, i) => (
            <div key={i} className={`sr d${i + 1} flex flex-col items-center group text-center p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-[#FAFAF8] border border-[#D4AF37]/10 transition-all duration-500 hover:shadow-xl md:hover:scale-105 hlift w-full`}>
              <div className="flex-shrink-0 inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#D4AF37]/5 text-[#D4AF37] mb-5 group-hover:bg-[#D4AF37] group-hover:text-white transition-all duration-400 shadow-inner">
                {d.icon}
              </div>
              <div className="min-w-0 w-full">
                <p className="font-inter uppercase tracking-[0.22em] text-[#B8962E] mb-2 font-bold opacity-60 group-hover:opacity-100 transition-opacity"
                  style={{ fontSize: 'clamp(0.6rem, 1.1vw, 0.72rem)' }}>{d.label}</p>
                <p className="font-playfair font-bold text-[#1F2A44] leading-tight tracking-tight break-words"
                  style={{ fontSize: 'clamp(0.95rem, 2vw, 1.4rem)' }}>{d.value}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="sr mt-6 sm:mt-8 text-center p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-[#FAFAF8] border border-[#D4AF37]/10 max-w-lg mx-auto">
          <p className="font-inter text-[#1F2A44]/60 font-medium" style={{ fontSize: 'clamp(0.78rem, 1.4vw, 0.92rem)' }}>
            <span className="text-[#B8962E] font-bold">Nearest Airport:</span> Chhatrapati Shivaji Maharaj International Airport — 10 km from venue
          </p>
        </div>
      </div>
    </section>
  );
};

// ─── GALLERY ───────────────────────────────────────────────────────────────
const PhotoGallery = ({ galleryImages, isEditable, onImageEdit }: { galleryImages: any[]; isEditable?: boolean; onImageEdit?: any }) => {
  const GALLERY: GalleryItem[] = useMemo(() => {
    if (!galleryImages || !galleryImages.length) return [
      { src: 'https://pub-4955b83e8ada4ae98b612bd6113cdc4c.r2.dev/download%20(13).jpg', alt: 'Bridal elegance', tall: true },
      { src: 'https://pub-4955b83e8ada4ae98b612bd6113cdc4c.r2.dev/download%20(12).jpg', alt: 'Ceremony details', tall: false },
      { src: 'https://pub-4955b83e8ada4ae98b612bd6113cdc4c.r2.dev/download%20(11).jpg', alt: 'Couple portrait', tall: false },
      { src: 'https://pub-4955b83e8ada4ae98b612bd6113cdc4c.r2.dev/download%20(9).jpg', alt: 'Wedding decor', tall: true },
      { src: 'https://pub-4955b83e8ada4ae98b612bd6113cdc4c.r2.dev/download%20(8).jpg', alt: 'Celebration joy', tall: false },
      { src: 'https://pub-4955b83e8ada4ae98b612bd6113cdc4c.r2.dev/download%20(7).jpg', alt: 'Intimate moments', tall: false },
    ];
    return galleryImages.map((src: string, i: number) => ({ src, alt: `Gallery image ${i + 1}`, tall: i % 3 === 0 }));
  }, [galleryImages]);

  return (
    <section className="py-12 md:py-20 lg:py-32 px-4 sm:px-6 md:px-10 lg:px-16 bg-[#F5F5F5] gpu">
      <div className="max-w-[1440px] mx-auto">
        <SectionHeading title="Gallery" subtitle="Moments we cherish" />

        {/*
          FIX: Removed conflicting gridAutoRows inline style.
          Height is now controlled purely by aspect ratio classes per breakpoint.
          gallery-grid class is targeted by the mobile CSS override (not all .grid).
        */}
        <div
          className="gallery-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 w-full"
        >
          {GALLERY.map((img, i) => (
            <div
              key={i}
              className={`gi group rounded-[32px] overflow-hidden shadow-xl ${img.tall ? 'lg:row-span-2' : ''}`}
            >
              {/*
                FIX: Single aspect ratio source of truth.
                Mobile: aspect-[4/3] (wider, less tall — saves vertical space)
                sm: aspect-[4/5] (portrait — nice on tablet)
                lg tall items: aspect-auto + h-full (spans 2 grid rows)
                lg normal items: aspect-[4/5]
              */}
              <div className={`relative w-full overflow-hidden ${img.tall ? 'aspect-[4/3] sm:aspect-[4/5] lg:aspect-auto lg:h-full' : 'aspect-[4/3] sm:aspect-[4/5]'}`}>
                <TemplateImage image={img.src} alt={img.alt}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-[1.02]"
                  isEditable={isEditable} onEdit={() => onImageEdit?.("gallery", i)} />
                <div className="gi-ov" />
                <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 z-10 hidden lg:block">
                  <p className="font-playfair italic text-white text-sm font-medium">{img.alt}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── STAY & TRAVEL ─────────────────────────────────────────────────────────
const StayTravelSection = () => {
  const HOTELS: HotelData[] = [
    { name: 'The Grand Palace Hotel', type: '5-Star Luxury', distance: 'At Venue', price: '₹8,000 / night', img: 'https://picsum.photos/seed/grand-hotel-lobby/600/400', phone: '+91 22 4000 1000' },
    { name: 'Heritage Boutique Stay', type: '4-Star Boutique', distance: '10 min drive', price: '₹5,000 / night', img: 'https://picsum.photos/seed/boutique-hotel-rooms/600/400', phone: '+91 22 3000 2000' },
  ];
  return (
    <section className="py-12 md:py-20 lg:py-32 px-4 sm:px-6 md:px-10 lg:px-16 bg-white gpu">
      <div className="max-w-[1440px] mx-auto">
        <SectionHeading title="Stay & Travel" subtitle="Accommodation for our guests" />
        <div className="hotels-grid grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 md:gap-10">
          {HOTELS.map((h, i) => (
            <div key={i} className={`sr d${i + 1} flex flex-col sm:flex-row group transition-all duration-500 bg-[#FAFAF8] rounded-2xl sm:rounded-3xl overflow-hidden border border-[#D4AF37]/5 hover:shadow-xl sm:hover:-translate-y-1 w-full`}>
              {/* FIX: aspect ratio on the wrapper div, not min-height on the img */}
              <div className="w-full sm:w-2/5 relative overflow-hidden">
                <div className="relative aspect-video sm:aspect-auto sm:h-full overflow-hidden">
                  <img src={h.img} alt={h.name} className="absolute inset-0 w-full h-full object-cover md:group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                  <div className="absolute top-3 left-3 sm:top-4 sm:left-4 px-2.5 py-1 bg-[#D4AF37] text-[#1F2A44] font-inter uppercase tracking-widest font-bold rounded-full shadow-md"
                    style={{ fontSize: 'clamp(0.6rem, 1.1vw, 0.68rem)' }}>{h.type}</div>
                </div>
              </div>
              <div className="w-full sm:w-3/5 p-5 sm:p-8 flex flex-col justify-center">
                <h3 className="font-playfair font-bold text-[#1F2A44] mb-3 sm:mb-4 tracking-tight"
                  style={{ fontSize: 'clamp(1.1rem, 2.2vw, 1.5rem)' }}>{h.name}</h3>
                <div className="space-y-2 sm:space-y-3 mb-5 sm:mb-6">
                  {[{ icon: <MapPin className="w-4 h-4" />, value: h.distance }, { icon: <Heart className="w-4 h-4" />, value: h.price }, { icon: <Phone className="w-4 h-4" />, value: h.phone }].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-[#1F2A44]/60 font-inter font-medium"
                      style={{ fontSize: 'clamp(0.8rem, 1.4vw, 0.92rem)' }}>
                      <div className="text-[#D4AF37] flex-shrink-0">{item.icon}</div>
                      <span className="min-w-0 truncate sm:whitespace-normal">{item.value}</span>
                    </div>
                  ))}
                </div>
                <GoldButton className="w-full sm:w-auto">Reserve Room</GoldButton>
              </div>
            </div>
          ))}
        </div>
        <div className="sr mt-8 sm:mt-12 text-center p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-[#1F2A44] text-white max-w-2xl mx-auto navy-bg">
          <p className="font-playfair font-bold mb-2" style={{ fontSize: 'clamp(1rem, 2.2vw, 1.4rem)' }}>Need Travel Assistance?</p>
          <p className="font-inter text-white/50 mb-5 font-medium" style={{ fontSize: 'clamp(0.82rem, 1.7vw, 1rem)' }}>
            Our wedding coordinator is happy to help with travel, transport, and any special arrangements.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 font-inter text-sm">
            <a href="mailto:wedding@arjunpriya.com" className="text-[#E8D48B] hover:text-[#D4AF37] transition-colors font-medium">wedding@arjunpriya.com</a>
            <a href="tel:+919876543210" className="text-[#E8D48B] hover:text-[#D4AF37] transition-colors font-medium">+91 98765 43210</a>
          </div>
        </div>
      </div>
    </section>
  );
};

// ─── RSVP ──────────────────────────────────────────────────────────────────
const RSVPSection = () => {
  const [form, setForm] = useState<RSVPFormState>({ name: '', guests: '1', attending: 'yes' });
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<RSVPFormErrors>({});
  const validate = (): RSVPFormErrors => { const e: RSVPFormErrors = {}; if (!form.name.trim()) e.name = 'Please enter your name'; return e; };
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); const errs = validate(); setErrors(errs); if (!Object.keys(errs).length) setSubmitted(true); };
  const update = (field: string, val: string) => { setForm(f => ({ ...f, [field]: val })); if (errors[field]) setErrors(e => ({ ...e, [field]: undefined })); };

  return (
    <section className="py-12 md:py-20 lg:py-32 px-4 sm:px-6 md:px-10 lg:px-16 navy-bg gpu" id="rsvp">
      <div className="max-w-xl mx-auto">
        <SectionHeading title="RSVP" subtitle="Let us know you're coming" light />
        {submitted ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="text-center py-10 sm:py-14 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl sm:rounded-3xl">
            <div className="inline-flex items-center justify-center w-14 h-14 sm:w-18 sm:h-18 rounded-full bg-[#D4AF37]/20 mb-4 sm:mb-6">
              <Heart className="w-7 h-7 sm:w-9 sm:h-9 text-[#D4AF37] fill-[#D4AF37]" />
            </div>
            <h3 className="font-playfair font-bold text-white mb-3" style={{ fontSize: 'clamp(1.3rem, 3.5vw, 2.2rem)' }}>Thank You!</h3>
            <p className="font-inter text-white/60 font-medium px-4" style={{ fontSize: 'clamp(0.82rem, 1.7vw, 1rem)' }}>
              We've received your response. We can't wait to celebrate with you!
            </p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit}
            className="sr bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-10 shadow-xl" noValidate>
            <div className="mb-5 sm:mb-6">
              <label className="block font-inter uppercase tracking-[0.22em] text-[#E8D48B] mb-2.5 font-semibold"
                style={{ fontSize: 'clamp(0.58rem, 1.2vw, 0.75rem)' }}>Full Name</label>
              <input type="text" className="fi !bg-white/5 !border-white/10 !text-white placeholder:text-white/20 focus:!border-[#D4AF37] h-12 text-sm"
                placeholder="Enter your name" value={form.name} onChange={e => update('name', e.target.value)} />
              {errors.name && <p className="font-inter text-red-400 mt-1.5 font-medium text-xs">{errors.name}</p>}
            </div>
            <div className="mb-5 sm:mb-6">
              <label className="block font-inter uppercase tracking-[0.22em] text-[#E8D48B] mb-2.5 font-semibold"
                style={{ fontSize: 'clamp(0.58rem, 1.2vw, 0.75rem)' }}>Number of Guests</label>
              <select className="fi !bg-white/5 !border-white/10 !text-white focus:!border-[#D4AF37] appearance-none h-12 text-sm"
                value={form.guests} onChange={e => update('guests', e.target.value)}>
                {['1', '2', '3', '4', '5'].map(n => <option key={n} value={n} className="bg-[#151D33] text-white">{n} {n === '1' ? 'Guest' : 'Guests'}</option>)}
              </select>
            </div>
            <div className="mb-6 sm:mb-8">
              <label className="block font-inter uppercase tracking-[0.22em] text-[#E8D48B] mb-3 font-semibold"
                style={{ fontSize: 'clamp(0.58rem, 1.2vw, 0.75rem)' }}>Will you attend?</label>
              {/* FIX: .rc now has min-height:48px + flex centering via CSS — text wraps gracefully */}
              <div className="flex gap-3">
                {['yes', 'no'].map(val => (
                  <div key={val}
                    className={`rc !bg-white/5 !border-white/10 ${form.attending === val ? 'act !border-[#D4AF37] !bg-[#D4AF37]/15' : ''}`}
                    onClick={() => update('attending', val)} role="radio" aria-checked={form.attending === val}>
                    <span className={`font-inter font-bold uppercase ${form.attending === val ? 'text-[#D4AF37]' : 'text-white/40'}`}
                      style={{ fontSize: 'clamp(0.58rem, 1.2vw, 0.75rem)', letterSpacing: '0.08em' }}>
                      {val === 'yes' ? 'Joyfully Accept' : 'Regretfully Decline'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <GoldButton type="submit" className="w-full py-3.5 text-sm rounded-xl">Send RSVP</GoldButton>
          </form>
        )}
      </div>
    </section>
  );
};

// ─── FOOTER ────────────────────────────────────────────────────────────────
// FIX: added safe-b class for home-indicator safe area on iOS
const Footer = ({ brideName, groomName, date, location }: any) => (
  <footer className="relative py-14 sm:py-24 md:py-32 px-4 sm:px-6 md:px-10 lg:px-16 bg-[#0D1321] overflow-hidden gpu safe-b">
    <div className="absolute inset-0 opacity-[0.05]" aria-hidden="true"
      style={{ backgroundImage: `radial-gradient(circle at 30% 50%,#D4AF37 0.5px,transparent 0.5px),radial-gradient(circle at 70% 50%,#D4AF37 0.5px,transparent 0.5px)`, backgroundSize: '40px 40px' }} />
    <div className="absolute inset-0 bg-gradient-to-t from-[#0D1321] via-transparent to-transparent z-10" />
    <div className="relative z-20 max-w-3xl mx-auto text-center">
      <motion.div initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ duration: 1 }}
        className="flex justify-center mb-4 sm:mb-6">
        <NavyFloralSeal size={52} />
      </motion.div>
      <GoldDivider />
      <motion.h2 initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.9 }}
        className="font-playfair font-bold text-white mb-3 sm:mb-4 tracking-tight"
        style={{ fontSize: 'clamp(1.8rem, 5.5vw, 4rem)' }}>
        {brideName} <span className="font-cormorant italic font-normal text-[#D4AF37]">&amp;</span> {groomName}
      </motion.h2>
      <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.9 }}
        className="font-inter text-[#D4AF37] tracking-[0.3em] uppercase mb-6 sm:mb-8 font-bold"
        style={{ fontSize: 'clamp(0.6rem, 1.4vw, 0.88rem)' }}>
        {date} <span className="mx-2 sm:mx-3 opacity-30">·</span> {location || 'Mumbai'}
      </motion.p>
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 0.7, duration: 0.9 }}>
        <p className="font-cormorant italic text-white/40 leading-relaxed mb-6 sm:mb-8 max-w-md mx-auto px-4"
          style={{ fontSize: 'clamp(0.95rem, 2.2vw, 1.25rem)' }}>
          "And in the end, the love you take is equal to the love you make."
        </p>
        <div className="w-12 sm:w-20 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent mx-auto mb-5 sm:mb-8" />
        <p className="font-inter text-white/25 tracking-[0.18em] font-medium uppercase"
          style={{ fontSize: 'clamp(0.55rem, 1.1vw, 0.7rem)' }}>
          Made with love for our special day
        </p>
      </motion.div>
    </div>
  </footer>
);

// ─── WEDDING SITE ──────────────────────────────────────────────────────────
const WeddingSite = (props: any) => {
  useScrollReveal([true]);
  const progress = useScrollProgress();
  return (
    <div className="site-enter irt">
      <GlobalStyles />
      <div className="sp" style={{ width: `${progress}%` }} aria-hidden="true" />
      <HeroSection {...props} />
      <InvitationMessage {...props} />
      <OurStory {...props} />
      <TimelineSection events={props.events || []} isEditable={props.isEditable} onImageEdit={props.onImageEdit} />
      <DetailsSection {...props} />
      <PhotoGallery galleryImages={props.galleryImages || []} isEditable={props.isEditable} onImageEdit={props.onImageEdit} />
      <StayTravelSection />
      <RSVPSection />
      <Footer {...props} />
    </div>
  );
};

// ─── VIDEO INTRO ───────────────────────────────────────────────────────────
const VideoIntro = ({ brideName, groomName, onEnter }: any) => {
  const [fading, setFading] = useState(false);
  const handleOpen = () => { setFading(true); setTimeout(onEnter, 1100); };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `@keyframes viShine{0%{transform:translateX(-120%)}100%{transform:translateX(120%)}}` }} />
      <div id="vi-wrap" className={fading ? 'out' : ''}>
        <video id="vi-video" autoPlay muted loop playsInline
          src="https://pub-4955b83e8ada4ae98b612bd6113cdc4c.r2.dev/Green%20and%20White%20Floral%20Wedding%20Invitation%20Mobile%20Video%20(1).mp4" />
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 gap-3 sm:gap-4 max-w-[90vw]">
          <motion.p
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.9 }}
            className="font-playfair text-[#3a2a1a] tracking-[0.05em] text-center"
            style={{ fontSize: 'clamp(0.9rem, 3vw, 1.3rem)' }}>
            {brideName} &amp; {groomName}
          </motion.p>
          {/* FIX: min-height:44px ensures tap target meets accessibility minimum */}
          <motion.button
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            onClick={handleOpen}
            className="relative overflow-hidden rounded-full font-inter font-semibold uppercase tracking-[0.22em] cursor-pointer transition-all duration-500 active:scale-[0.97] w-full sm:w-auto"
            style={{
              padding: 'clamp(11px, 2vw, 14px) clamp(26px, 5vw, 44px)',
              minHeight: '44px',
              fontSize: 'clamp(9px, 1.4vw, 11px)',
              background: 'linear-gradient(135deg,#D4AF37 0%,#F0D875 40%,#D4AF37 60%,#B8962E 100%)',
              backgroundSize: '200% 100%',
              color: '#1F2A44',
              boxShadow: '0 5px 20px rgba(212,175,55,0.35)',
              border: '1px solid rgba(255,255,255,0.2)',
            }}>
            <span className="absolute inset-0 rounded-full"
              style={{ background: 'linear-gradient(120deg,transparent 20%,rgba(255,255,255,0.5) 50%,transparent 80%)', animation: 'viShine 3.5s 2.5s infinite' }} />
            <span className="relative z-10">Enter Our Love Story</span>
          </motion.button>
        </div>
      </div>
    </>
  );
};

// ─── APP ───────────────────────────────────────────────────────────────────
const App = (props: any) => {
  const [entered, setEntered] = useState(false);
  useEffect(() => { if (props.isPreview) setEntered(true); }, [props.isPreview]);

  return (
    <>
      {!entered && <VideoIntro brideName={props.brideName} groomName={props.groomName} onEnter={() => setEntered(true)} />}
      {entered && (
        <div className="irt" style={{ minHeight: '100svh' }}>
          <TemplateFrame isPreview={props.isPreview}>
            <WeddingSite {...props} />
          </TemplateFrame>
        </div>
      )}
    </>
  );
};

// ─── EXPORT ────────────────────────────────────────────────────────────────
export default function IndianRoyalWeddingTemplate(props: any) {
  const brideName = props.brideName || 'Priya';
  const groomName = props.groomName || 'Arjun';
  const weddingDate = props.weddingDate || 'March 17, 2025';
  const locationStr = typeof props.location === 'string' ? props.location : props.venue || 'The Grand Palace, Mumbai';

  return (
    <App {...props}
      brideName={brideName} groomName={groomName}
      weddingDate={weddingDate} date={weddingDate}
      location={locationStr} venue={locationStr}
    />
  );
}