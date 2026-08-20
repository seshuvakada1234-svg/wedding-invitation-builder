/**  
 * @license  
 * SPDX-License-Identifier: Apache-2.0  
 */  
  
import React, { useState, useEffect, useRef } from "react";  
import { motion, AnimatePresence, useScroll, useTransform } from "motion/react";  
import {   
  Heart,   
  Calendar,   
  Clock,   
  MapPin,   
  Volume2,   
  VolumeX,   
  MessageCircle,   
  Sparkles,   
  Music,   
  Share2,   
  Compass,  
  Check,  
  ChevronDown,  
  ArrowRight,  
  Star  
} from "lucide-react";  
import { TemplateDraft, WeddingEvent, EditableImage } from "../../types";  
import CountdownTimer from "../CountdownTimer";  
import MapPreview from "../MapPreview";  
import TemplateImage from "../TemplateImage";  
import ImageItem from "../ImageItem";  
  
export interface RoyalRajasthaniTemplateProps extends Partial<TemplateDraft> {  
  draft?: Partial<TemplateDraft>;  
  isEditable?: boolean;  
  onEditImage?: (target: string, index?: number) => void;  
  onUnlock?: () => void;  
  [key: string]: any;  
}  
  
// Helper to resolve string URL from string | EditableImage  
function getImageSrc(img: string | EditableImage | undefined | null, fallback = ""): string {  
  if (!img) return fallback;  
  if (typeof img === "string") return img;  
  if (typeof img === "object" && "url" in img && img.url) return img.url;  
  return fallback;  
}  
  
// Premium decorative SVG components  
const JharokhaArch = ({ className = "" }: { className?: string }) => (  
  <svg viewBox="0 0 400 100" className={`w-full max-w-2xl ${className}`} fill="none" xmlns="http://www.w3.org/2000/svg">  
    <defs>  
      <linearGradient id="goldArch" x1="0" y1="0" x2="1" y2="1">  
        <stop offset="0%" stopColor="#B8860B" />  
        <stop offset="50%" stopColor="#F5D76E" />  
        <stop offset="100%" stopColor="#D4AF37" />  
      </linearGradient>  
    </defs>  
    <path d="M0 100V60C0 26.8629 26.8629 0 60 0H340C373.137 0 400 26.8629 400 60V100"   
      stroke="url(#goldArch)" strokeWidth="2.5" fill="none" opacity="0.8"/>  
    <path d="M30 100V65C30 42.9086 47.9086 25 70 25H330C352.091 25 370 42.9086 370 65V100"   
      stroke="url(#goldArch)" strokeWidth="1.5" fill="none" opacity="0.4"/>  
    <circle cx="200" cy="45" r="12" stroke="url(#goldArch)" strokeWidth="1.5" fill="none" opacity="0.6"/>  
    <circle cx="200" cy="45" r="5" fill="url(#goldArch)" opacity="0.4"/>  
    <path d="M160 45L200 25L240 45" stroke="url(#goldArch)" strokeWidth="1" fill="none" opacity="0.3"/>  
  </svg>  
);  
  
const PaisleyMotif = ({ className = "" }: { className?: string }) => (  
  <svg viewBox="0 0 60 60" className={`w-12 h-12 ${className}`} fill="none" xmlns="http://www.w3.org/2000/svg">  
    <defs>  
      <linearGradient id="goldPaisley" x1="0" y1="0" x2="1" y2="1">  
        <stop offset="0%" stopColor="#D4AF37" />  
        <stop offset="100%" stopColor="#B8860B" />  
      </linearGradient>  
    </defs>  
    <path d="M30 8C35 8 45 18 45 28C45 38 38 48 30 52C22 48 15 38 15 28C15 18 25 8 30 8Z"   
      stroke="url(#goldPaisley)" strokeWidth="1.5" fill="none" opacity="0.7"/>  
    <path d="M30 18C33 18 38 23 38 28C38 33 34 38 30 40C26 38 22 33 22 28C22 23 27 18 30 18Z"   
      stroke="url(#goldPaisley)" strokeWidth="1" fill="none" opacity="0.5"/>  
    <circle cx="30" cy="28" r="3" fill="url(#goldPaisley)" opacity="0.6"/>  
  </svg>  
);  
  
// Wax Seal Button Component  
const WaxSealButton = ({   
  onClick,   
  children,   
  variant = "primary",  
  className = ""  
}: {   
  onClick?: () => void;   
  children: React.ReactNode;   
  variant?: "primary" | "secondary";  
  className?: string;  
}) => (  
  <motion.button  
    onClick={onClick}  
    whileHover={{ scale: 1.03 }}  
    whileTap={{ scale: 0.97 }}  
    className={`  
      relative group overflow-hidden font-serif tracking-widest uppercase text-sm  
      transition-all duration-500  
      ${variant === "primary"   
        ? "bg-gradient-to-r from-[#7A162B] via-[#9B1D3A] to-[#7A162B] text-[#F5D76E] shadow-lg"   
        : "bg-transparent border-2 border-[#D4AF37] text-[#7A162B]"}  
      px-10 py-4  
      ${className}  
    `}  
    style={{ clipPath: "polygon(12% 0, 88% 0, 100% 12%, 100% 88%, 88% 100%, 12% 100%, 0 88%, 0 12%)" }}  
  >  
    <span className="relative z-10 flex items-center gap-3">  
      {children}  
    </span>  
    {variant === "primary" && (  
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />  
    )}  
  </motion.button>  
);  
  
// Ornamental Music Button  
const OrnamentalMusicButton = ({   
  isPlaying,   
  onClick   
}: {   
  isPlaying: boolean;   
  onClick: () => void;  
}) => (  
  <motion.button  
    onClick={onClick}  
    whileHover={{ scale: 1.05 }}  
    whileTap={{ scale: 0.95 }}  
    className="relative group"  
  >  
    <div className={`  
      relative p-3 rounded-full border-2 transition-all duration-500  
      ${isPlaying   
        ? "border-[#D4AF37] bg-gradient-to-br from-[#7A162B] to-[#9B1D3A] shadow-lg shadow-[#D4AF37]/20"   
        : "border-[#D4AF37]/40 bg-white/80 backdrop-blur-sm"}  
    `}>  
      {isPlaying ? (  
        <div className="flex items-center gap-2">  
          <div className="flex items-end gap-0.5 h-4">  
            {[1, 2, 3, 4].map((i) => (  
              <motion.div  
                key={i}  
                animate={{ height: [4, 12, 6, 14, 4] }}  
                transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}  
                className="w-0.5 bg-[#F5D76E] rounded-full"  
              />  
            ))}  
          </div>  
          <span className="text-[10px] font-bold tracking-widest text-[#F5D76E] uppercase">Playing</span>  
        </div>  
      ) : (  
        <div className="flex items-center gap-2">  
          <Music className="w-4 h-4 text-[#7A162B]" />  
          <span className="text-[10px] font-bold tracking-widest text-[#7A162B] uppercase">Play</span>  
        </div>  
      )}  
    </div>  
    {/* Decorative ring */}  
    <div className={`  
      absolute -inset-1 rounded-full border border-dashed transition-opacity duration-500  
      ${isPlaying ? "border-[#D4AF37]/40 opacity-100" : "border-[#D4AF37]/20 opacity-0"}  
    `} />  
  </motion.button>  
);  
  
export default function RoyalRajasthaniTemplate(props: RoyalRajasthaniTemplateProps) {  
  // Merge incoming draft prop or flattened props  
  const draftData: Partial<TemplateDraft> = props.draft ? { ...props, ...props.draft } : props;  
  
  const brideName = draftData.brideName || "Devika";  
  const groomName = draftData.groomName || "Ranveer";  
  const weddingDate = draftData.weddingDate || "2026-11-28";  
  const weddingTime = draftData.weddingTime || "19:00";  
  const location = draftData.venueAddress || draftData.location || "City Palace Heritage Resort, Udaipur, Rajasthan";  
  const venueCity = draftData.venueCity || "Udaipur, Rajasthan";  
  const googleMapsLink = draftData.googleMapsLink || `https://maps.google.com/?q=${encodeURIComponent(location)}`;  
    
  const heroTitle = draftData.heroTitle || "The Royal Union";  
  const heroSubtitle = draftData.heroSubtitle || "Together with our families, we invite you to celebrate our auspicious wedding celebration";  
  const deity = draftData.deity || "|| ॐ श्री गणेशाय नमः ||";  
  const family = draftData.family || "Rathore & Shekhawat Families";  
  const muhurtham = draftData.muhurtham || "Shubh Vivah Muhurtham: 7:30 PM";  
    
  const coupleNickname = draftData.coupleNickname || `${brideName} & ${groomName}`;  
  const weddingHashtag = draftData.weddingHashtag || `#${groomName.replace(/\s+/g, '')}Weds${brideName.replace(/\s+/g, '')}`;  
    
  const story = draftData.story || "Beneath the golden arches of royal palaces and starlit desert skies, our stories intertwined. What began as a timeless friendship blossomed into an enduring love. With folded hands and joyous hearts, we invite you to be part of our royal voyage as we pledge our lives to each other.";  
    
  const coverImage = getImageSrc(  
    draftData.coverImage || draftData.heroImage,  
    "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&q=80&w=1200"  
  );  
    
  const events: WeddingEvent[] = (draftData.events && draftData.events.length > 0) ? draftData.events : [  
    {  
      name: "Ganesh Sthapana & Haldi",  
      date: "2026-11-27",  
      time: "10:00 AM",  
      location: "Courtyard of Courtesies, Udaipur",  
      image: "https://images.unsplash.com/photo-1607344645866-009c522b63e2?auto=format&fit=crop&q=80&w=800"  
    },  
    {  
      name: "Royal Sangeet & Mehendi",  
      date: "2026-11-27",  
      time: "07:00 PM",  
      location: "Mewar Grand Ballroom",  
      image: "https://images.unsplash.com/photo-1544124499-58912cbddaad?auto=format&fit=crop&q=80&w=800"  
    },  
    {  
      name: "Royal Baraat & Shubh Vivah",  
      date: "2026-11-28",  
      time: "06:30 PM",  
      location: "City Palace Heritage Pavilion",  
      image: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&q=80&w=800"  
    },  
    {  
      name: "Grand Royal Reception",  
      date: "2026-11-29",  
      time: "08:00 PM",  
      location: "Lakeview Gardens, Udaipur",  
      image: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800"  
    }  
  ];  
  
  const galleryImages = (draftData.galleryImages && draftData.galleryImages.length > 0)   
    ? draftData.galleryImages   
    : [  
        "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&q=80&w=800",  
        "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800",  
        "https://images.unsplash.com/photo-1607344645866-009c522b63e2?auto=format&fit=crop&q=80&w=800",  
        "https://images.unsplash.com/photo-1544124499-58912cbddaad?auto=format&fit=crop&q=80&w=800",  
        "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=800",  
        "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&q=80&w=800"  
      ];  
  
  const timeline = draftData.timeline || [  
    {  
      date: "Spring 2023",  
      title: "First Glance in Pink City",  
      description: "Our paths crossed under the warm amber glow of Jaipur, sparking a conversation that never truly ended.",  
      image: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=600"  
    },  
    {  
      date: "Autumn 2024",  
      title: "The Royal Promise",  
      description: "Overlooking the tranquil waters of Pichola Lake, he asked the question that changed forever into destiny.",  
      image: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&q=80&w=600"  
    },  
    {  
      date: "Winter 2026",  
      title: "Our Forever Begins",  
      description: "Stepping together into sacred vows surrounded by loved ones, timeless royal tradition, and eternal grace.",  
      image: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&q=80&w=600"  
    }  
  ];  
  
  // Theme colors & typography with fallbacks  
  const primaryColor = draftData.primaryColor || "#7A162B";  
  const secondaryColor = draftData.secondaryColor || "#D4AF37";  
  const accentColor = draftData.accentColor || "#9E1C38";  
  
  const headingFont = draftData.headingFont || "'Cinzel', 'Playfair Display', serif";  
  const bodyFont = draftData.bodyFont || "'Plus Jakarta Sans', sans-serif";  
  
  // Audio State & Music Player  
  const musicUrl = draftData.musicUrl;  
  const autoplayMusic = draftData.autoplayMusic ?? true;  
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);  
  const audioRef = useRef<HTMLAudioElement | null>(null);  
  
  // Gallery Modal Lightbox  
  const [selectedGalleryIdx, setSelectedGalleryIdx] = useState<number | null>(null);  
  const [copiedLink, setCopiedLink] = useState(false);  
  
  // Parallax scroll refs  
  const heroRef = useRef<HTMLDivElement>(null);  
  const { scrollYProgress } = useScroll({  
    target: heroRef,  
    offset: ["start start", "end start"]  
  });  
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);  
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);  
  
  // Load Google Fonts  
  useEffect(() => {  
    const link = document.createElement("link");  
    link.href = "https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Great+Vibes&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap";  
    link.rel = "stylesheet";  
    document.head.appendChild(link);  
    return () => {  
      if (document.head.contains(link)) {  
        document.head.removeChild(link);  
      }  
    };  
  }, []);  
  
  // Music initialization  
  useEffect(() => {  
    if (!musicUrl) return;  
    const audio = new Audio(musicUrl);  
    audio.loop = true;  
    audioRef.current = audio;  
  
    if (autoplayMusic) {  
      const playPromise = audio.play();  
      if (playPromise !== undefined) {  
        playPromise  
          .then(() => setIsPlayingMusic(true))  
          .catch(() => {  
            setIsPlayingMusic(false);  
          });  
      }  
    }  
  
    return () => {  
      audio.pause();  
      audio.src = "";  
    };  
  }, [musicUrl, autoplayMusic]);  
  
  const toggleMusic = () => {  
    if (!audioRef.current && musicUrl) {  
      audioRef.current = new Audio(musicUrl);  
      audioRef.current.loop = true;  
    }  
    if (!audioRef.current) return;  
  
    if (isPlayingMusic) {  
      audioRef.current.pause();  
      setIsPlayingMusic(false);  
    } else {  
      audioRef.current.play().then(() => setIsPlayingMusic(true)).catch(console.error);  
    }  
  };  
  
  // RSVP WhatsApp Link  
  const whatsappNumber = draftData.whatsappNumber || "919876543210";  
  const rsvpButtonText = draftData.rsvpButtonText || "Confirm RSVP via WhatsApp";  
  const rsvpTitle = draftData.rsvpTitle || "Celebrate With Us";  
  const rsvpSubtitle = draftData.rsvpSubtitle || "Please confirm your gracious presence to help us prepare for your arrival.";  
  const rsvpDeadline = draftData.rsvpDeadline || "RSVP by November 15, 2026";  
    
  const cleanPhone = whatsappNumber.replace(/[^0-9]/g, "");  
  const whatsappMessage = encodeURIComponent(  
    `Namaste! I would love to confirm my RSVP for ${brideName} & ${groomName}'s wedding celebrations. Looking forward to celebrating with the family!`  
  );  
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${whatsappMessage}`;  
  
  const countdownTarget = draftData.countdownDate || `${weddingDate}T${weddingTime}:00`;  
  
  const handleShare = () => {  
    if (navigator.share) {  
      navigator.share({  
        title: `${brideName} & ${groomName}'s Royal Wedding`,  
        text: `You are cordially invited to celebrate the royal wedding of ${brideName} and ${groomName}!`,  
        url: window.location.href,  
      }).catch(() => {});  
    } else {  
      navigator.clipboard.writeText(window.location.href);  
      setCopiedLink(true);  
      setTimeout(() => setCopiedLink(false), 2000);  
    }  
  };  
  
  return (  
    <div   
      className="min-h-screen text-stone-800 selection:bg-[#D4AF37]/30 selection:text-[#7A162B] relative overflow-x-hidden"  
      style={{  
        "--primary-color": primaryColor,  
        "--secondary-color": secondaryColor,  
        "--accent-color": accentColor,  
        fontFamily: bodyFont,  
      } as React.CSSProperties}  
    >  
      {/* ── Background Royal Pattern ── */}  
      <div   
        className="fixed inset-0 pointer-events-none opacity-[0.03] z-0"  
        style={{  
          backgroundImage: `  
            radial-gradient(${secondaryColor} 1.5px, transparent 1.5px),  
            linear-gradient(45deg, ${primaryColor}11 25%, transparent 25%),  
            linear-gradient(-45deg, ${primaryColor}11 25%, transparent 25%)  
          `,  
          backgroundSize: "28px 28px, 40px 40px, 40px 40px",  
        }}  
      />  
  
      {/* ── Fixed Control Bar ── */}  
      <div className="fixed top-5 right-5 z-50 flex items-center gap-3">  
        {musicUrl && (  
          <OrnamentalMusicButton isPlaying={isPlayingMusic} onClick={toggleMusic} />  
        )}  
  
        <motion.button  
          whileHover={{ scale: 1.05 }}  
          whileTap={{ scale: 0.95 }}  
          onClick={handleShare}  
          className="relative group"  
        >  
          <div className="p-3 rounded-full border-2 border-[#D4AF37]/40 bg-white/80 backdrop-blur-sm transition-all duration-300 hover:bg-white hover:border-[#D4AF37]">  
            {copiedLink ? (  
              <Check className="w-4 h-4 text-green-600" />  
            ) : (  
              <Share2 className="w-4 h-4 text-[#7A162B]" />  
            )}  
          </div>  
        </motion.button>  
      </div>  
  
      {/* ─────────────────────────────────────────────────────────────────────────  
          1. HERO SECTION - Full-bleed with parallax  
      ───────────────────────────────────────────────────────────────────────── */}  
      <section ref={heroRef} className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">  
        {/* Background Image with Parallax */}  
        <motion.div   
          style={{ opacity: heroOpacity, scale: heroScale }}  
          className="absolute inset-0 z-0"  
        >  
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/70 z-10" />  
          <TemplateImage  
            image={coverImage}  
            alt={`${brideName} & ${groomName}`}  
            className="w-full h-full object-cover"  
            isEditable={props.isEditable}  
            onEdit={() => props.onEditImage?.("cover")}  
          />  
        </motion.div>  
  
        {/* Content */}  
        <div className="relative z-20 text-center px-4 max-w-4xl mx-auto">  
          {/* Deity Mantra */}  
          <motion.div  
            initial={{ opacity: 0, y: -20 }}  
            animate={{ opacity: 1, y: 0 }}  
            transition={{ duration: 0.8, ease: "easeOut" }}  
            className="mb-8"  
          >  
            <p className="text-sm tracking-[0.4em] font-semibold text-[#F5D76E] uppercase px-6 py-2 border border-[#D4AF37]/40 bg-black/30 backdrop-blur-sm inline-block">  
              {deity}  
            </p>  
          </motion.div>  
  
          {/* Jharokha Arch */}  
          <motion.div  
            initial={{ opacity: 0, scale: 0.9 }}  
            animate={{ opacity: 1, scale: 1 }}  
            transition={{ duration: 1, delay: 0.2 }}  
            className="mb-6"  
          >  
            <JharokhaArch className="text-[#D4AF37]" />  
          </motion.div>  
  
          {/* Hero Title */}  
          <motion.span  
            initial={{ opacity: 0, y: 20 }}  
            animate={{ opacity: 1, y: 0 }}  
            transition={{ duration: 0.8, delay: 0.4 }}  
            className="text-sm md:text-base tracking-[0.5em] uppercase font-bold text-[#F5D76E] block mb-4"  
            style={{ fontFamily: headingFont }}  
          >  
            {heroTitle}  
          </motion.span>  
  
          {/* Bride Name */}  
          <motion.h1  
            initial={{ opacity: 0, y: 30 }}  
            animate={{ opacity: 1, y: 0 }}  
            transition={{ duration: 0.8, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}  
            className="text-5xl sm:text-7xl md:text-8xl font-bold text-white drop-shadow-lg mb-2"  
            style={{ fontFamily: headingFont }}  
          >  
            {brideName}  
          </motion.h1>  
  
          {/* "Weds" Divider */}  
          <motion.div  
            initial={{ opacity: 0, scale: 0.5 }}  
            animate={{ opacity: 1, scale: 1 }}  
            transition={{ duration: 0.6, delay: 0.8 }}  
            className="flex items-center justify-center gap-4 my-4"  
          >  
            <div className="h-px w-16 sm:w-24 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />  
            <span className="text-2xl sm:text-3xl font-serif italic text-[#F5D76E]">weds</span>  
            <div className="h-px w-16 sm:w-24 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />  
          </motion.div>  
  
          {/* Groom Name */}  
          <motion.h1  
            initial={{ opacity: 0, y: 30 }}  
            animate={{ opacity: 1, y: 0 }}  
            transition={{ duration: 0.8, delay: 1, ease: [0.16, 1, 0.3, 1] }}  
            className="text-5xl sm:text-7xl md:text-8xl font-bold text-white drop-shadow-lg mb-6"  
            style={{ fontFamily: headingFont }}  
          >  
            {groomName}  
          </motion.h1>  
  
          {/* Hashtag */}  
          {weddingHashtag && (  
            <motion.p  
              initial={{ opacity: 0 }}  
              animate={{ opacity: 1 }}  
              transition={{ delay: 1.2 }}  
              className="text-sm tracking-[0.3em] text-[#F5D76E] uppercase mb-6"  
            >  
              {weddingHashtag}  
            </motion.p>  
          )}  
  
          {/* Subtitle */}  
          <motion.p  
            initial={{ opacity: 0, y: 20 }}  
            animate={{ opacity: 1, y: 0 }}  
            transition={{ duration: 0.8, delay: 1.4 }}  
            className="text-base sm:text-lg text-white/80 max-w-xl mx-auto leading-relaxed font-light"  
          >  
            {heroSubtitle}  
          </motion.p>  
  
          {/* Scroll Indicator */}  
          <motion.div  
            initial={{ opacity: 0 }}  
            animate={{ opacity: 1 }}  
            transition={{ delay: 2 }}  
            className="mt-12"  
          >  
            <motion.div  
              animate={{ y: [0, 8, 0] }}  
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}  
              className="text-[#F5D76E] flex flex-col items-center gap-2"  
            >  
              <span className="text-[10px] uppercase tracking-[0.4em] font-bold">Scroll</span>  
              <ChevronDown className="w-5 h-5" />  
            </motion.div>  
          </motion.div>  
        </div>  
      </section>  
  
      {/* ─────────────────────────────────────────────────────────────────────────  
          2. INVITATION TEXT - Asymmetric layout with full-bleed image  
      ───────────────────────────────────────────────────────────────────────── */}  
      <section className="relative py-24 px-4 bg-[#FAF7F2]">  
        <div className="max-w-6xl mx-auto">  
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">  
            {/* Left: Image */}  
            <motion.div  
              initial={{ opacity: 0, x: -50 }}  
              whileInView={{ opacity: 1, x: 0 }}  
              viewport={{ once: true, margin: "-100px" }}  
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}  
              className="relative"  
            >  
              <div className="relative aspect-[3/4] overflow-hidden rounded-sm shadow-2xl">  
                <TemplateImage  
                  image={coverImage}  
                  alt="Royal Wedding"  
                  className="w-full h-full object-cover"  
                  isEditable={props.isEditable}  
                  onEdit={() => props.onEditImage?.("invitation")}  
                />  
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />  
              </div>  
              {/* Decorative frame */}  
              <div className="absolute -top-4 -left-4 w-24 h-24 border-t-2 border-l-2 border-[#D4AF37]" />  
              <div className="absolute -bottom-4 -right-4 w-24 h-24 border-b-2 border-r-2 border-[#D4AF37]" />  
            </motion.div>  
  
            {/* Right: Content */}  
            <motion.div  
              initial={{ opacity: 0, x: 50 }}  
              whileInView={{ opacity: 1, x: 0 }}  
              viewport={{ once: true, margin: "-100px" }}  
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}  
              className="space-y-8"  
            >  
              <div>  
                <p className="text-sm tracking-[0.3em] uppercase text-[#D4AF37] font-bold mb-2">Together with our families</p>  
                <h2   
                  className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#7A162B] leading-tight"  
                  style={{ fontFamily: headingFont }}  
                >  
                  {family}  
                </h2>  
              </div>  
  
              <div className="space-y-4">  
                <p className="text-base sm:text-lg text-stone-700 leading-relaxed font-light">  
                  {story}  
                </p>  
                <p className="text-sm text-[#D4AF37] font-semibold tracking-wider">  
                  {muhurtham}  
                </p>  
              </div>  
  
              <div className="flex items-center gap-4 pt-4">  
                <PaisleyMotif />  
                <div className="h-px flex-1 bg-gradient-to-r from-[#D4AF37]/50 to-transparent" />  
              </div>  
            </motion.div>  
          </div>  
        </div>  
      </section>  
  
      {/* ─────────────────────────────────────────────────────────────────────────  
          3. COUNTDOWN TIMER - Full-bleed with gradient overlay  
      ───────────────────────────────────────────────────────────────────────── */}  
      <section className="relative py-20 overflow-hidden">  
        <div className="absolute inset-0 bg-gradient-to-r from-[#7A162B] via-[#9B1D3A] to-[#7A162B]" />  
        <div className="absolute inset-0 opacity-10" style={{  
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D4AF37' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,  
        }} />  
  
        <div className="relative z-10 max-w-4xl mx-auto text-center px-4">  
          <motion.div  
            initial={{ opacity: 0, y: 30 }}  
            whileInView={{ opacity: 1, y: 0 }}  
            viewport={{ once: true }}  
            transition={{ duration: 0.8 }}  
          >  
            <p className="text-sm tracking-[0.3em] uppercase text-[#F5D76E] font-bold mb-4">  
              Counting Down to Forever  
            </p>  
            <CountdownTimer   
              targetDate={countdownTarget}  
              className="text-white"  
            />  
          </motion.div>  
        </div>  
      </section>  
  
      {/* ─────────────────────────────────────────────────────────────────────────  
          4. EVENTS - Asymmetric grid with overlapping elements  
      ───────────────────────────────────────────────────────────────────────── */}  
      <section className="py-24 px-4 bg-[#FAF7F2]">  
        <div className="max-w-6xl mx-auto">  
          <motion.div  
            initial={{ opacity: 0, y: 30 }}  
            whileInView={{ opacity: 1, y: 0 }}  
            viewport={{ once: true }}  
            transition={{ duration: 0.8 }}  
            className="text-center mb-16"  
          >  
            <p className="text-sm tracking-[0.3em] uppercase text-[#D4AF37] font-bold mb-2">Our Celebrations</p>  
            <h2   
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#7A162B]"  
              style={{ fontFamily: headingFont }}  
            >  
              Royal Festivities  
            </h2>  
          </motion.div>  
  
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">  
            {events.map((event, index) => (  
              <motion.div  
                key={event.name}  
                initial={{ opacity: 0, y: 50 }}  
                whileInView={{ opacity: 1, y: 0 }}  
                viewport={{ once: true, margin: "-50px" }}  
                transition={{ duration: 0.6, delay: index * 0.1 }}  
                className={`group relative ${index === 0 ? "md:col-span-2" : ""}`}  
              >  
                <div className={`  
                  relative overflow-hidden rounded-sm shadow-xl  
                  ${index === 0 ? "aspect-[2/1]" : "aspect-[3/4]"}  
                `}>  
                  <TemplateImage  
                    image={event.image || coverImage}  
                    alt={event.name}  
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"  
                    isEditable={props.isEditable}  
                    onEdit={() => props.onEditImage?.("events", index)}  
                  />  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />  
                    
                  <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">  
                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-2" style={{ fontFamily: headingFont }}>  
                      {event.name}  
                    </h3>  
                    <div className="flex flex-wrap gap-4 text-sm text-white/80">  
                      <span className="flex items-center gap-1">  
                        <Calendar className="w-4 h-4" />  
                        {event.date}  
                      </span>  
                      <span className="flex items-center gap-1">  
                        <Clock className="w-4 h-4" />  
                        {event.time}  
                      </span>  
                      <span className="flex items-center gap-1">  
                        <MapPin className="w-4 h-4" />  
                        {event.location}  
                      </span>  
                    </div>  
                  </div>  
                </div>  
              </motion.div>  
            ))}  
          </div>  
        </div>  
      </section>  
  
      {/* ─────────────────────────────────────────────────────────────────────────  
          5. TIMELINE - Drawn connecting line animation  
      ───────────────────────────────────────────────────────────────────────── */}  
      <section className="py-24 px-4 bg-white">  
        <div className="max-w-4xl mx-auto">  
          <motion.div  
            initial={{ opacity: 0, y: 30 }}  
            whileInView={{ opacity: 1, y: 0 }}  
            viewport={{ once: true }}  
            transition={{ duration: 0.8 }}  
            className="text-center mb-16"  
          >  
            <p className="text-sm tracking-[0.3em] uppercase text-[#D4AF37] font-bold mb-2">Our Journey</p>  
            <h2   
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#7A162B]"  
              style={{ fontFamily: headingFont }}  
            >  
              A Royal Love Story  
            </h2>  
          </motion.div>  
  
          <div className="relative">  
            {/* Connecting Line */}  
            <motion.div   
              className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-[#D4AF37] via-[#D4AF37]/50 to-[#D4AF37]"  
              initial={{ scaleY: 0 }}  
              whileInView={{ scaleY: 1 }}  
              viewport={{ once: true }}  
              transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}  
              style={{ originY: 0 }}  
            />  
  
            {timeline.map((item, index) => (  
              <motion.div  
                key={item.title}  
                initial={{ opacity: 0, x: -30 }}  
                whileInView={{ opacity: 1, x: 0 }}  
                viewport={{ once: true, margin: "-50px" }}  
                transition={{ duration: 0.6, delay: index * 0.2 }}  
                className="relative pl-20 pb-16 last:pb-0"  
              >  
                {/* Timeline Dot */}  
                <motion.div   
                  className="absolute left-4 top-0 w-9 h-9 rounded-full border-2 border-[#D4AF37] bg-white flex items-center justify-center"  
                  initial={{ scale: 0 }}  
                  whileInView={{ scale: 1 }}  
                  viewport={{ once: true }}  
                  transition={{ duration: 0.4, delay: index * 0.2 + 0.3 }}  
                >  
                  <div className="w-3 h-3 rounded-full bg-[#D4AF37]" />  
                </motion.div>  
  
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">  
                  <div className={index % 2 === 0 ? "md:order-1" : "md:order-2"}>  
                    <div className="relative aspect-[4/3] overflow-hidden rounded-sm shadow-lg">  
                      <img   
                        src={item.image}   
                        alt={item.title}  
                        className="w-full h-full object-cover"  
                      />  
                    </div>  
                  </div>  
                  <div className={index % 2 === 0 ? "md:order-2" : "md:order-1"}>  
                    <p className="text-sm tracking-[0.2em] uppercase text-[#D4AF37] font-bold mb-2">{item.date}</p>  
                    <h3 className="text-xl sm:text-2xl font-bold text-[#7A162B] mb-3" style={{ fontFamily: headingFont }}>  
                      {item.title}  
                    </h3>  
                    <p className="text-stone-600 leading-relaxed">{item.description}</p>  
                  </div>  
                </div>  
              </motion.div>  
            ))}  
          </div>  
        </div>  
      </section>  
  
      {/* ─────────────────────────────────────────────────────────────────────────  
          6. GALLERY - Masonry reveal  
      ───────────────────────────────────────────────────────────────────────── */}  
      <section className="py-24 px-4 bg-[#FAF7F2]">  
        <div className="max-w-6xl mx-auto">  
          <motion.div  
            initial={{ opacity: 0, y: 30 }}  
            whileInView={{ opacity: 1, y: 0 }}  
            viewport={{ once: true }}  
            transition={{ duration: 0.8 }}  
            className="text-center mb-16"  
          >  
            <p className="text-sm tracking-[0.3em] uppercase text-[#D4AF37] font-bold mb-2">Memories</p>  
            <h2   
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#7A162B]"  
              style={{ fontFamily: headingFont }}  
            >  
              Royal Gallery  
            </h2>  
          </motion.div>  
  
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">  
            {galleryImages.map((img, index) => (  
              <motion.div  
                key={index}  
                initial={{ opacity: 0, y: 30 }}  
                whileInView={{ opacity: 1, y: 0 }}  
                viewport={{ once: true, margin: "-50px" }}  
                transition={{ duration: 0.5, delay: index * 0.05 }}  
                className="break-inside-avoid cursor-pointer group relative overflow-hidden rounded-sm"  
                onClick={() => setSelectedGalleryIdx(index)}  
              >  
                <div className={`  
                  relative overflow-hidden  
                  ${index % 3 === 0 ? "aspect-[3/4]" : index % 3 === 1 ? "aspect-square" : "aspect-[4/3]"}  
                `}>  
                  <TemplateImage  
                    image={img}  
                    alt={`Gallery ${index + 1}`}  
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"  
                    isEditable={props.isEditable}  
                    onEdit={() => props.onEditImage?.("gallery", index)}  
                  />  
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />  
                </div>  
              </motion.div>  
            ))}  
          </div>  
        </div>  
  
        {/* Lightbox */}  
        <AnimatePresence>  
          {selectedGalleryIdx !== null && (  
            <motion.div  
              initial={{ opacity: 0 }}  
              animate={{ opacity: 1 }}  
              exit={{ opacity: 0 }}  
              className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"  
              onClick={() => setSelectedGalleryIdx(null)}  
            >  
              <motion.div  
                initial={{ scale: 0.9 }}  
                animate={{ scale: 1 }}  
                exit={{ scale: 0.9 }}  
                className="relative max-w-4xl max-h-[90vh]"  
                onClick={(e) => e.stopPropagation()}  
              >  
                <img   
                  src={getImageSrc(galleryImages[selectedGalleryIdx])}  
                  alt="Gallery"  
                  className="max-w-full max-h-[85vh] object-contain rounded-sm"  
                />  
                <button  
                  onClick={() => setSelectedGalleryIdx(null)}  
                  className="absolute top-4 right-4 text-white/80 hover:text-white text-2xl"  
                >  
                  ✕  
                </button>  
              </motion.div>  
            </motion.div>  
          )}  
        </AnimatePresence>  
      </section>  
  
      {/* ─────────────────────────────────────────────────────────────────────────  
          7. VENUE & MAP - Full-bleed with gradient overlay  
      ───────────────────────────────────────────────────────────────────────── */}  
      <section className="relative py-24 overflow-hidden">  
        <div className="absolute inset-0 bg-gradient-to-br from-[#7A162B] to-[#4A0D1A]" />  
        <div className="absolute inset-0 opacity-5" style={{  
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23D4AF37' fill-opacity='1'%3E%3Cpath d='M20 0v40M0 20h40'/%3E%3C/g%3E%3C/svg%3E")`,  
        }} />  
  
        <div className="relative z-10 max-w-4xl mx-auto text-center px-4">  
          <motion.div  
            initial={{ opacity: 0, y: 30 }}  
            whileInView={{ opacity: 1, y: 0 }}  
            viewport={{ once: true }}  
            transition={{ duration: 0.8 }}  
          >  
            <p className="text-sm tracking-[0.3em] uppercase text-[#F5D76E] font-bold mb-2">Venue</p>  
            <h2   
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6"  
              style={{ fontFamily: headingFont }}  
            >  
              The Royal Destination  
            </h2>  
            <p className="text-lg text-white/80 mb-8">{location}</p>  
              
            <a   
              href={googleMapsLink}  
              target="_blank"  
              rel="noopener noreferrer"  
              className="inline-block"  
            >  
              <WaxSealButton variant="secondary" className="text-[#F5D76E] border-[#F5D76E]">  
                <MapPin className="w-4 h-4" />  
                View on Map  
              </WaxSealButton>  
            </a>  
          </motion.div>  
        </div>  
      </section>  
  
      {/* ─────────────────────────────────────────────────────────────────────────  
          8. RSVP - Wax seal button  
      ───────────────────────────────────────────────────────────────────────── */}  
      <section className="py-24 px-4 bg-[#FAF7F2]">  
        <div className="max-w-2xl mx-auto text-center">  
          <motion.div  
            initial={{ opacity: 0, y: 30 }}  
            whileInView={{ opacity: 1, y: 0 }}  
            viewport={{ once: true }}  
            transition={{ duration: 0.8 }}  
          >  
            <p className="text-sm tracking-[0.3em] uppercase text-[#D4AF37] font-bold mb-2">RSVP</p>  
            <h2   
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#7A162B] mb-4"  
              style={{ fontFamily: headingFont }}  
            >  
              {rsvpTitle}  
            </h2>  
            <p className="text-stone-600 mb-8 max-w-lg mx-auto">{rsvpSubtitle}</p>  
            <p className="text-sm text-[#D4AF37] font-semibold mb-8">{rsvpDeadline}</p>  
  
            <a   
              href={whatsappUrl}  
              target="_blank"  
              rel="noopener noreferrer"  
              className="inline-block"  
            >  
              <WaxSealButton>  
                <MessageCircle className="w-5 h-5" />  
                {rsvpButtonText}  
              </WaxSealButton>  
            </a>  
          </motion.div>  
        </div>  
      </section>  
  
      {/* ─────────────────────────────────────────────────────────────────────────  
          9. FOOTER - Royal closing  
      ───────────────────────────────────────────────────────────────────────── */}  
      <footer className="py-16 px-4 bg-[#7A162B]">  
        <div className="max-w-2xl mx-auto text-center">  
          <motion.div  
            initial={{ opacity: 0 }}  
            whileInView={{ opacity: 1 }}  
            viewport={{ once: true }}  
            transition={{ duration: 0.8 }}  
          >  
            <JharokhaArch className="text-[#D4AF37] mb-8" />  
              
            <p className="text-2xl sm:text-3xl font-serif italic text-[#F5D76E] mb-4">  
              Thank you for being part of our story  
            </p>  
            <p className="text-white/60 text-sm mb-8">  
              With love and gratitude,<br />  
              <span className="text-[#F5D76E] font-semibold">{family}</span>  
            </p>  
  
            <div className="flex items-center justify-center gap-4 text-[#D4AF37]/60 text-xs">  
              <span>{weddingHashtag}</span>  
              <span className="w-px h-4 bg-[#D4AF37]/30" />  
              <span>{coupleNickname}</span>  
            </div>  
          </motion.div>  
        </div>  
      </footer>  
    </div>  
  );  
}  
