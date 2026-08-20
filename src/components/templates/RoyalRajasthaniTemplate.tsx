/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
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
  ChevronDown
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
  const primaryColor = draftData.primaryColor || "#7A162B"; // Royal Rajasthani Maroon
  const secondaryColor = draftData.secondaryColor || "#D4AF37"; // Antique Gold
  const accentColor = draftData.accentColor || "#9E1C38"; // Rich Ruby

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
            // Autoplay blocked by browser policy; user must interact
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
      className="min-h-screen text-stone-800 selection:bg-[#D4AF37]/30 selection:text-[#7A162B] relative overflow-x-hidden bg-[#FAF7F2]"
      style={{
        "--primary-color": primaryColor,
        "--secondary-color": secondaryColor,
        "--accent-color": accentColor,
        fontFamily: bodyFont,
      } as React.CSSProperties}
    >
      {/* ── Background Royal Pattern ── */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.035] z-0"
        style={{
          backgroundImage: `radial-gradient(${secondaryColor} 1.5px, transparent 1.5px)`,
          backgroundSize: "28px 28px",
        }}
      />

      {/* ── Fixed Audio & Share Control Bar ── */}
      <div className="fixed top-5 right-5 z-50 flex items-center gap-2">
        {musicUrl && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleMusic}
            id="music-toggle-btn"
            className="flex items-center gap-2 px-3 py-2 rounded-full backdrop-blur-md shadow-lg border text-xs font-medium tracking-wide transition-all bg-white/90 border-[#D4AF37]/40 text-[#7A162B] hover:bg-white"
            title={isPlayingMusic ? "Mute Music" : "Play Music"}
          >
            {isPlayingMusic ? (
              <>
                <Volume2 className="w-4 h-4 text-[#7A162B] animate-pulse" />
                <span className="hidden sm:inline text-[11px] font-semibold tracking-wider">ROYAL AUDIO</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-stone-500" />
                <span className="hidden sm:inline text-[11px] text-stone-500">PLAY AUDIO</span>
              </>
            )}
          </motion.button>
        )}

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleShare}
          id="share-invite-btn"
          className="p-2.5 rounded-full backdrop-blur-md shadow-lg border text-xs transition-all bg-white/90 border-[#D4AF37]/40 text-[#7A162B] hover:bg-white"
          title="Share Invitation"
        >
          {copiedLink ? <Check className="w-4 h-4 text-green-600" /> : <Share2 className="w-4 h-4" />}
        </motion.button>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────
          1. HERO SECTION (Animated Name Reveal, Deity & Cover)
      ───────────────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[92vh] flex flex-col items-center justify-between text-center px-4 pt-12 pb-16 overflow-hidden">
        {/* Ornate Top Arch & Mandala Decors */}
        <div className="absolute top-0 inset-x-0 flex justify-center pointer-events-none">
          <svg className="w-full max-w-2xl h-16 text-[#D4AF37]/30" viewBox="0 0 800 60" fill="currentColor">
            <path d="M0,0 L800,0 L800,20 C600,60 200,60 0,20 Z" opacity="0.4" />
            <circle cx="400" cy="30" r="18" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="400" cy="30" r="8" fill="currentColor" opacity="0.6" />
          </svg>
        </div>

        {/* Deity Mantra */}
        <motion.div 
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mt-2"
        >
          <p 
            className="text-xs sm:text-sm tracking-[0.3em] font-semibold text-[#7A162B] uppercase px-4 py-1.5 rounded-full border border-[#D4AF37]/30 bg-white/60 backdrop-blur-sm shadow-sm inline-block"
            style={{ fontFamily: headingFont }}
          >
            {deity}
          </p>
        </motion.div>

        {/* Centerpiece Couple Names with Staggered Motion */}
        <div className="my-auto max-w-3xl w-full flex flex-col items-center py-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.2 }}
            className="mb-3"
          >
            <span 
              className="text-xs md:text-sm tracking-[0.4em] uppercase font-bold text-[#D4AF37] block"
              style={{ fontFamily: headingFont }}
            >
              {heroTitle}
            </span>
          </motion.div>

          {/* Staggered Name Reveal */}
          <div className="space-y-1 sm:space-y-2 mb-4">
            <motion.h1
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-[#7A162B] drop-shadow-sm"
              style={{ fontFamily: headingFont }}
            >
              {brideName}
            </motion.h1>

            <motion.div 
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.55 }}
              className="flex items-center justify-center gap-3 my-1"
            >
              <div className="h-px w-12 sm:w-20 bg-gradient-to-r from-transparent to-[#D4AF37]" />
              <span className="text-2xl sm:text-3xl font-serif italic text-[#D4AF37]">weds</span>
              <div className="h-px w-12 sm:w-20 bg-gradient-to-l from-transparent to-[#D4AF37]" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-[#7A162B] drop-shadow-sm"
              style={{ fontFamily: headingFont }}
            >
              {groomName}
            </motion.h1>
          </div>

          {weddingHashtag && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="text-xs sm:text-sm font-semibold tracking-widest text-[#D4AF37] uppercase mb-4"
            >
              {weddingHashtag}
            </motion.p>
          )}

          {/* Hero Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.95 }}
            className="text-sm sm:text-base text-stone-600 max-w-lg mx-auto leading-relaxed px-4"
          >
            {heroSubtitle}
          </motion.p>
        </div>

        {/* Hero Arch Frame Image with Decorative Gold Filigree */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1 }}
          className="w-full max-w-sm sm:max-w-md mx-auto relative group mt-2"
        >
          <div className="relative p-2 rounded-t-[140px] rounded-b-2xl bg-gradient-to-b from-[#D4AF37]/40 via-[#D4AF37]/20 to-transparent shadow-2xl border border-[#D4AF37]/50">
            <div className="overflow-hidden rounded-t-[132px] rounded-b-xl aspect-[4/5] relative bg-stone-100">
              <TemplateImage
                image={coverImage}
                alt={`${brideName} & ${groomName}`}
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                isEditable={props.isEditable}
                onEdit={() => props.onEditImage?.("cover")}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
              
              {/* Date & Location Pill Overlay */}
              <div className="absolute bottom-4 inset-x-4 flex justify-between items-end text-white text-left pointer-events-none">
                <div>
                  <p className="text-[10px] tracking-[0.2em] font-bold text-[#F5D061] uppercase">{venueCity}</p>
                  <p className="text-sm font-semibold tracking-wide drop-shadow">{weddingDate}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] tracking-[0.2em] font-bold text-[#F5D061] uppercase">Auspicious Day</p>
                  <p className="text-sm font-semibold tracking-wide drop-shadow">{weddingTime}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Floating Scroll Indicator */}
          <div className="flex justify-center mt-6">
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="text-[#7A162B] flex flex-col items-center gap-1 opacity-70"
            >
              <span className="text-[9px] uppercase tracking-[0.3em] font-bold">Scroll Down</span>
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          </div>
        </motion.div>
      </section>


      {/* ─────────────────────────────────────────────────────────────────────────
          2. INVITATION TEXT BLOCK (Family, Muhurtham & Royal Message)
      ───────────────────────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 relative max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="bg-white/80 backdrop-blur-md rounded-3xl p-8 sm:p-12 border border-[#D4AF37]/30 shadow-xl relative overflow-hidden"
        >
          {/* Decorative Corner Ornaments */}
          <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-[#D4AF37]/60" />
          <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-[#D4AF37]/60" />
          <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-[#D4AF37]/60" />
          <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-[#D4AF37]/60" />

          <Sparkles className="w-6 h-6 text-[#D4AF37] mx-auto mb-4" />

          {family && (
            <p 
              className="text-xs sm:text-sm tracking-[0.3em] uppercase font-bold text-[#7A162B] mb-2"
              style={{ fontFamily: headingFont }}
            >
              With the blessings of the {family}
            </p>
          )}

          <h2 
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#7A162B] mb-6"
            style={{ fontFamily: headingFont }}
          >
            Cordially Invite Your Presence
          </h2>

          <p className="text-stone-600 text-sm sm:text-base leading-relaxed max-w-xl mx-auto mb-8">
            {story}
          </p>

          {/* Muhurtham & Key Highlights Box */}
          <div className="bg-[#FAF7F2] rounded-2xl p-6 border border-[#D4AF37]/25 grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-[#7A162B]/10 text-[#7A162B]">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold text-[#D4AF37]">Auspicious Muhurtham</p>
                <p className="text-sm font-semibold text-stone-800 mt-0.5">{muhurtham}</p>
                <p className="text-xs text-stone-500">{weddingDate}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-[#7A162B]/10 text-[#7A162B]">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold text-[#D4AF37]">Venue & Heritage</p>
                <p className="text-sm font-semibold text-stone-800 mt-0.5">{venueCity}</p>
                <p className="text-xs text-stone-500 line-clamp-1">{location}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>


      {/* ─────────────────────────────────────────────────────────────────────────
          3. COUNTDOWN TIMER SECTION
      ───────────────────────────────────────────────────────────────────────── */}
      <section className="py-12 px-4 relative text-center">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-2xl mx-auto"
        >
          <span 
            className="text-[10px] uppercase tracking-[0.35em] font-bold text-[#D4AF37] block mb-2"
            style={{ fontFamily: headingFont }}
          >
            Counting Every Moment
          </span>
          <h3 
            className="text-2xl sm:text-3xl font-bold text-[#7A162B] mb-6"
            style={{ fontFamily: headingFont }}
          >
            Until The Royal Celebration
          </h3>

          <div className="py-2">
            <CountdownTimer 
              targetDate={countdownTarget} 
              theme="royal"
            />
          </div>
        </motion.div>
      </section>


      {/* ─────────────────────────────────────────────────────────────────────────
          4. EVENTS TIMELINE (Map over draft.events with details & MapPreview)
      ───────────────────────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 relative max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span 
              className="text-[10px] uppercase tracking-[0.35em] font-bold text-[#D4AF37] block mb-1"
              style={{ fontFamily: headingFont }}
            >
              Wedding Itinerary
            </span>
            <h2 
              className="text-3xl sm:text-4xl font-bold text-[#7A162B]"
              style={{ fontFamily: headingFont }}
            >
              Ceremonies & Festivities
            </h2>
            <div className="w-16 h-0.5 bg-[#D4AF37] mx-auto mt-3 rounded-full" />
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {events.map((event, index) => {
            const eventImg = getImageSrc(event.image);
            return (
              <motion.div
                key={`${event.name}-${index}`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.12 }}
                className="bg-white rounded-2xl overflow-hidden shadow-lg border border-[#D4AF37]/25 flex flex-col justify-between hover:shadow-xl transition-shadow"
              >
                {/* Event Photo Header */}
                {eventImg && (
                  <div className="relative h-48 w-full overflow-hidden bg-stone-100">
                    <TemplateImage
                      image={event.image}
                      alt={event.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      isEditable={props.isEditable}
                      onEdit={() => props.onEditImage?.("event", index)}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute bottom-3 left-4 right-4 text-white">
                      <span className="text-[10px] uppercase tracking-widest font-bold text-[#F5D061] px-2 py-0.5 rounded bg-black/40 backdrop-blur-sm inline-block mb-1">
                        Ceremony #{index + 1}
                      </span>
                      <h4 
                        className="text-lg font-bold drop-shadow"
                        style={{ fontFamily: headingFont }}
                      >
                        {event.name}
                      </h4>
                    </div>
                  </div>
                )}

                {/* Event Body */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  {!eventImg && (
                    <div className="mb-4">
                      <span className="text-[10px] uppercase tracking-widest font-bold text-[#D4AF37]">
                        Ceremony #{index + 1}
                      </span>
                      <h4 
                        className="text-xl font-bold text-[#7A162B] mt-1"
                        style={{ fontFamily: headingFont }}
                      >
                        {event.name}
                      </h4>
                    </div>
                  )}

                  <div className="space-y-3 my-2 text-xs sm:text-sm text-stone-600">
                    <div className="flex items-center gap-2.5">
                      <Calendar className="w-4 h-4 text-[#D4AF37] flex-shrink-0" />
                      <span>{event.date}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Clock className="w-4 h-4 text-[#D4AF37] flex-shrink-0" />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <MapPin className="w-4 h-4 text-[#D4AF37] flex-shrink-0 mt-0.5" />
                      <span className="leading-snug">{event.location}</span>
                    </div>
                  </div>

                  {/* Location / Map Navigation Link */}
                  <div className="mt-4 pt-4 border-t border-stone-100">
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(event.location)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7A162B] hover:text-[#9E1C38] transition-colors"
                    >
                      <Compass className="w-3.5 h-3.5" />
                      <span>Open Directions on Google Maps</span>
                    </a>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>


      {/* ─────────────────────────────────────────────────────────────────────────
          5. STORY & TIMELINE SECTION (Mapping draft.timeline)
      ───────────────────────────────────────────────────────────────────────── */}
      {timeline && timeline.length > 0 && (
        <section className="py-16 px-4 relative max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <span 
                className="text-[10px] uppercase tracking-[0.35em] font-bold text-[#D4AF37] block mb-1"
                style={{ fontFamily: headingFont }}
              >
                Our Journey
              </span>
              <h2 
                className="text-3xl sm:text-4xl font-bold text-[#7A162B]"
                style={{ fontFamily: headingFont }}
              >
                Chapters of Love
              </h2>
              <div className="w-16 h-0.5 bg-[#D4AF37] mx-auto mt-3 rounded-full" />
            </motion.div>
          </div>

          <div className="relative border-l-2 border-[#D4AF37]/30 ml-4 sm:ml-8 pl-6 sm:pl-8 space-y-10">
            {timeline.map((item, idx) => {
              const itemImg = getImageSrc(item.image);
              return (
                <motion.div
                  key={`${item.title}-${idx}`}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: idx * 0.15 }}
                  className="relative group"
                >
                  {/* Timeline Dot Indicator */}
                  <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-4 h-4 rounded-full bg-[#7A162B] border-4 border-[#FAF7F2] shadow" />

                  <div className="bg-white rounded-2xl p-6 shadow-md border border-[#D4AF37]/20">
                    <span 
                      className="text-xs uppercase tracking-widest font-bold text-[#D4AF37]"
                      style={{ fontFamily: headingFont }}
                    >
                      {item.date}
                    </span>
                    <h4 
                      className="text-lg sm:text-xl font-bold text-[#7A162B] mt-1 mb-2"
                      style={{ fontFamily: headingFont }}
                    >
                      {item.title}
                    </h4>
                    <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                      {item.description}
                    </p>

                    {itemImg && (
                      <div className="mt-4 rounded-xl overflow-hidden aspect-[16/9] w-full max-w-sm">
                        <TemplateImage
                          image={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover"
                          isEditable={props.isEditable}
                        />
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}


      {/* ─────────────────────────────────────────────────────────────────────────
          6. GALLERY GRID (Handles both string & EditableImage union type)
      ───────────────────────────────────────────────────────────────────────── */}
      {galleryImages && galleryImages.length > 0 && (
        <section className="py-16 px-4 relative max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <span 
                className="text-[10px] uppercase tracking-[0.35em] font-bold text-[#D4AF37] block mb-1"
                style={{ fontFamily: headingFont }}
              >
                Cherished Moments
              </span>
              <h2 
                className="text-3xl sm:text-4xl font-bold text-[#7A162B]"
                style={{ fontFamily: headingFont }}
              >
                The Royal Gallery
              </h2>
              <div className="w-16 h-0.5 bg-[#D4AF37] mx-auto mt-3 rounded-full" />
            </motion.div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-5">
            {galleryImages.map((img, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                onClick={() => setSelectedGalleryIdx(idx)}
                className="rounded-2xl overflow-hidden aspect-square relative group cursor-pointer shadow-md border border-[#D4AF37]/25 bg-stone-100"
              >
                <TemplateImage
                  image={img}
                  alt={`Royal wedding gallery ${idx + 1}`}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  isEditable={props.isEditable}
                  onEdit={() => props.onEditImage?.("gallery", idx)}
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  <Sparkles className="w-6 h-6 text-[#F5D061] drop-shadow" />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Lightbox Modal */}
          <AnimatePresence>
            {selectedGalleryIdx !== null && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedGalleryIdx(null)}
                className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
              >
                <div 
                  className="relative max-w-3xl max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl border border-white/20"
                  onClick={(e) => e.stopPropagation()}
                >
                  <img
                    src={getImageSrc(galleryImages[selectedGalleryIdx])}
                    alt="Gallery enlargement"
                    className="w-full h-full object-contain max-h-[80vh]"
                  />
                  <button
                    onClick={() => setSelectedGalleryIdx(null)}
                    className="absolute top-3 right-3 bg-black/60 text-white rounded-full p-2 hover:bg-black transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      )}


      {/* ─────────────────────────────────────────────────────────────────────────
          7. MAP PREVIEW & VENUE SECTION
      ───────────────────────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 relative max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white rounded-3xl p-6 sm:p-10 border border-[#D4AF37]/30 shadow-xl"
        >
          <span 
            className="text-[10px] uppercase tracking-[0.35em] font-bold text-[#D4AF37] block mb-1"
            style={{ fontFamily: headingFont }}
          >
            Royal Destination
          </span>
          <h3 
            className="text-2xl sm:text-3xl font-bold text-[#7A162B] mb-2"
            style={{ fontFamily: headingFont }}
          >
            Location & Directions
          </h3>
          <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto mb-6">
            {location}
          </p>

          <div className="rounded-2xl overflow-hidden border border-[#D4AF37]/25 shadow-inner my-4">
            <MapPreview
              mapInput={draftData.googleMapsEmbedUrl || googleMapsLink || location}
              label={location}
            />
          </div>

          <div className="mt-4">
            <a
              href={googleMapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#7A162B] text-white text-xs sm:text-sm font-semibold tracking-wider hover:bg-[#9E1C38] transition-all shadow-md"
            >
              <Compass className="w-4 h-4" />
              <span>Get Driving Directions</span>
            </a>
          </div>
        </motion.div>
      </section>


      {/* ─────────────────────────────────────────────────────────────────────────
          8. RSVP SECTION (WhatsApp Deep Link & Confirmation)
      ───────────────────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 relative max-w-2xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative bg-gradient-to-b from-[#7A162B] to-[#5A0F1F] text-white rounded-3xl p-8 sm:p-12 shadow-2xl border-2 border-[#D4AF37]/40 overflow-hidden"
        >
          {/* Decorative Gold Rings */}
          <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full border-4 border-[#D4AF37]/20 pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-36 h-36 rounded-full border-4 border-[#D4AF37]/20 pointer-events-none" />

          <Heart className="w-8 h-8 text-[#F5D061] mx-auto mb-4 animate-pulse" />

          <span 
            className="text-[10px] sm:text-xs uppercase tracking-[0.35em] font-bold text-[#F5D061] block mb-2"
            style={{ fontFamily: headingFont }}
          >
            Royal RSVP
          </span>

          <h2 
            className="text-3xl sm:text-4xl font-bold mb-3 drop-shadow"
            style={{ fontFamily: headingFont }}
          >
            {rsvpTitle}
          </h2>

          <p className="text-white/80 text-xs sm:text-sm max-w-md mx-auto leading-relaxed mb-6">
            {rsvpSubtitle}
          </p>

          <p className="text-[11px] uppercase tracking-widest font-semibold text-[#F5D061] mb-8">
            {rsvpDeadline}
          </p>

          {/* WhatsApp Deep Link Button */}
          <motion.a
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            id="whatsapp-rsvp-button"
            className="inline-flex items-center justify-center gap-3 w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white font-bold text-sm tracking-wide shadow-xl hover:shadow-2xl transition-all"
          >
            <MessageCircle className="w-5 h-5" />
            <span>{rsvpButtonText}</span>
          </motion.a>

          {/* Hosts / Family Sign-off */}
          <div className="mt-10 pt-6 border-t border-white/10 text-center">
            <p 
              className="text-sm font-semibold tracking-wider text-[#F5D061]"
              style={{ fontFamily: headingFont }}
            >
              Warm Regards & Royal Blessings,
            </p>
            <p className="text-xs text-white/70 mt-1">
              {coupleNickname} & Families
            </p>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 text-center text-xs text-stone-500 border-t border-[#D4AF37]/20">
        <p className="tracking-widest uppercase font-semibold text-[10px] text-[#7A162B]">
          {coupleNickname} • {weddingDate}
        </p>
        <p className="mt-1 text-[11px] text-stone-400">
          Crafted with love & royal tradition
        </p>
      </footer>
    </div>
  );
}
