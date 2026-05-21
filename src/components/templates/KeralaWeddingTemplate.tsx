"use client";

import React, { useRef, useMemo } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "motion/react";
import CountdownTimer from "../CountdownTimer";
import MapPreview from "../MapPreview";
import TemplateImage from "../TemplateImage";
import { MapPin, Phone, MessageCircle, Calendar, Clock, Image as ImageIcon } from "lucide-react";
import { formatWeddingDate, formatWeddingTime } from "../../lib/dateUtils";

/* ─── DESIGN TOKENS (KERALA THEME) ─── */
const C = {
  kasavu: "#F8F5E1", // Traditional cream color
  gold: "#D4AF37",   // Traditional gold border
  goldDark: "#996515",
  green: "#2E7D32",   // Lush Kerala greenery
  ink: "#1A1A1A",
  white: "#FFFFFF",
};

/* ─── SVG DECORATIONS ─── */
function PalmLeafSVG({ className = "", color = C.green, size = 100 }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 100 100" fill="none">
      <path d="M50 100C50 100 50 60 80 40M50 100C50 100 50 70 20 50M50 100C50 100 30 50 50 20M50 100C50 100 70 50 50 20" stroke={color} strokeWidth="1" opacity="0.3" />
      {Array.from({ length: 12 }).map((_, i) => (
        <path key={i} d={`M50 100 Q${20 + i * 5} ${20 + i * 5} 80 20`} stroke={color} strokeWidth="0.5" opacity="0.2" transform={`rotate(${i * 10 - 60} 50 100)`} />
      ))}
    </svg>
  );
}

function KathakaliMotif({ className = "", color = C.gold, size = 60 }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="45" stroke={color} strokeWidth="1" opacity="0.2" />
      <path d="M30 40 Q50 20 70 40 Q50 60 30 40" fill={color} opacity="0.1" />
      <path d="M35 45 L45 45 M55 45 L65 45" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M40 65 Q50 75 60 65" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M20 50 Q50 100 80 50" stroke={color} strokeWidth="0.5" opacity="0.3" />
    </svg>
  );
}

function SectionReveal({ children, className = "", delay = 0 }: any) {
  return (
    <motion.div className={className}
      initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}

/* ─── SAMPLE DATA ─── */
const SAMPLE_EVENTS = [
  { name: "Madhuramveypu", date: "Aug 20, 2026", time: "4:00 PM", location: "Bride's Residence" },
  { name: "Nischaayam", date: "Aug 21, 2026", time: "10:30 AM", location: "Parish Hall" },
  { name: "Wedding", date: "Aug 23, 2026", time: "10:45 AM", location: "St. Mary's Cathedral" },
  { name: "Reception", date: "Aug 23, 2026", time: "1:00 PM", location: "Grand Convention Centre" },
];

/* ─── FLOATING JASMINE ─── */
function FloatingJasmine() {
  const petals = useMemo(() =>
    Array.from({ length: 12 }).map((_, i) => ({
      id: i, left: Math.random() * 100, delay: Math.random() * 10,
      duration: 10 + Math.random() * 10, size: 8 + Math.random() * 10,
      rotation: Math.random() * 360, sway: 30 + Math.random() * 40, opacity: 0.2 + Math.random() * 0.3,
    })), []);
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 10 }}>
      {petals.map((p) => (
        <motion.div key={p.id} style={{ position: "absolute", left: `${p.left}%`, top: -20 }}
          animate={{ y: ["0vh", "105vh"], x: [0, p.sway, -p.sway * 0.5, p.sway * 0.3], rotate: [p.rotation, p.rotation + 360], opacity: [0, p.opacity, p.opacity, 0] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: "linear" }}>
          <svg width={p.size} height={p.size} viewBox="0 0 20 20" fill="none">
            <path d="M10 0 Q13 5 18 5 Q13 8 10 13 Q7 8 2 5 Q7 5 10 0" fill="white" opacity="0.8" />
            <circle cx="10" cy="6" r="1.5" fill="#FFFACD" />
          </svg>
        </motion.div>
      ))}
    </div>
  );
}

export default function KeralaWeddingTemplate({
  brideName = "Anjali",
  groomName = "Rahul",
  date = "2026-08-23",
  weddingTime = "10:45",
  venue = "St. Mary's Cathedral",
  venueAddress = "Marine Drive, Kochi",
  venueCity = "Kochi, Kerala",
  phone = "+91 98765 43210",
  whatsapp = "+91 98765 43210",
  coverImage = "https://images.unsplash.com/photo-1595191151664-213fb01cc3a7?auto=format&fit=crop&q=80&w=1600",
  galleryImages = [
    "https://images.unsplash.com/photo-1544124499-58912cbddaad?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&q=80&w=800",
  ],
  events = SAMPLE_EVENTS,
  story = "Our journey began in the lush backwaters of Alleppey, and now we invite you to celebrate our union as we embark on this sacred path together.",
  googleMapsEmbedUrl = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15718.528020822184!2d76.2673!3d9.9726!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3b080d514abec6bf%3A0xbd51asdf!2sKochi!5e0!3m2!1sen!2sin!4v1600000000",
  googleMapsLink = "https://maps.google.com/?q=Kochi+Kerala",
  coordinates = "",
  enable3D = true,
  isEditable = false,
  onImageEdit,
}: any) {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 50]);

  return (
    <div className="w-full min-h-screen bg-[#FDFDFD] font-sans text-[#1A1A1A] overflow-x-hidden selection:bg-[#D4AF37]/20">
      {enable3D && <FloatingJasmine />}
      
      {/* ─── HERO SECTION ─── */}
      <section ref={heroRef} className="relative h-screen flex items-center justify-center overflow-hidden">
        <motion.div 
          className="absolute inset-0 z-0"
          style={{ 
            scale: enable3D ? heroScale : 1,
            y: enable3D ? heroY : 0
          }}
        >
          <TemplateImage 
            image={coverImage} 
            alt="Wedding Cover" 
            className="w-full h-full"
            isEditable={isEditable}
            onEdit={() => onImageEdit?.("cover")}
          />
          <div className="absolute inset-0 bg-black/40 bg-gradient-to-t from-[#FDFDFD] via-transparent to-transparent pointer-events-none" />
        </motion.div>

        <div className="relative z-10 text-center px-4 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          >
            <KathakaliMotif size={80} className="mx-auto mb-8 text-[#D4AF37]" />
          </motion.div>
          
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-[#D4AF37] font-bold tracking-[0.4em] uppercase text-xs mb-4"
          >
            Inviting You to The Celebration of
          </motion.p>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 1 }}
            className="text-5xl md:text-8xl font-serif italic text-white drop-shadow-2xl mb-6"
          >
            {brideName} <span className="text-3xl md:text-5xl not-italic text-[#D4AF37] mx-2">&amp;</span> {groomName}
          </motion.h1>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="inline-block border-y border-[#D4AF37]/50 py-3 px-8"
          >
            <p className="text-white/90 text-sm md:text-lg tracking-[0.2em] font-medium">
              {formatWeddingDate(date)} | {formatWeddingTime(weddingTime)}
            </p>
          </motion.div>
        </div>

        {/* Traditional Border Motif */}
        <div className="absolute bottom-0 left-0 right-0 h-4 bg-[url('https://www.transparenttextures.com/patterns/gold-scale.png')] opacity-20 z-20" 
             style={{ backgroundColor: '#D4AF37' }} />
      </section>

      {/* ─── COUNTDOWN ─── */}
      <section className="py-12 bg-white relative">
        <CountdownTimer targetDate={date} theme="traditional" />
      </section>

      {/* ─── OUR STORY ─── */}
      <section className="py-20 px-6 max-w-4xl mx-auto text-center border-b border-[#D4AF37]/10">
        <SectionReveal>
          <PalmLeafSVG className="mx-auto mb-8" size={60} />
          <h2 className="text-2xl md:text-4xl font-serif italic text-[#1A1A1A] mb-8">Our Sacred Path</h2>
          <p className="text-lg md:text-xl text-neutral-600 leading-relaxed font-light italic">
            "{story}"
          </p>
        </SectionReveal>
      </section>

      {/* ─── EVENTS ITINERARY ─── */}
      <section className="py-24 px-4 md:px-8 bg-[#FBF9F2]">
        <SectionReveal className="text-center mb-16">
          <p className="text-[#D4AF37] font-bold tracking-widest uppercase text-[10px] mb-2">Detailed Schedule</p>
          <h2 className="text-3xl md:text-5xl font-serif italic">Celebrations</h2>
          <div className="w-12 h-px bg-[#D4AF37] mx-auto mt-6" />
        </SectionReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-10 max-w-7xl mx-auto">
          {events.map((event: any, idx: number) => (
            <SectionReveal key={idx} delay={idx * 0.1}>
              <div className="group bg-white p-8 rounded-3xl border border-[#D4AF37]/10 shadow-sm hover:shadow-xl transition-all duration-500 text-center flex flex-col h-full min-h-[220px] md:min-h-[280px]">
                <div className="bg-[#D4AF37]/5 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <Calendar size={20} className="text-[#D4AF37]" />
                </div>
                <div className="w-full aspect-video rounded-2xl overflow-hidden mb-6 shadow-inner">
                  <TemplateImage
                    image={event.image}
                    alt={event.name}
                    className="w-full h-full"
                    isEditable={isEditable}
                    onEdit={() => onImageEdit?.("event", idx)}
                  />
                </div>
                <h3 className="text-xl font-serif italic mb-4">{event.name}</h3>
                <div className="space-y-2 mb-6 flex-grow">
                  <p className="flex items-center justify-center gap-2 text-sm font-semibold text-neutral-800">
                    <Clock size={14} className="text-[#D4AF37]" />
                    {formatWeddingDate(event.date || date)} | {formatWeddingTime(event.time || weddingTime)}
                  </p>
                  <p className="text-xs text-neutral-500 uppercase tracking-widest mt-4">
                    {event.location}
                  </p>
                </div>
                <div className="pt-4 border-t border-neutral-50">
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    className="text-[10px] uppercase tracking-widest font-bold text-[#D4AF37] hover:text-[#996515]"
                  >
                    Set Reminder
                  </motion.button>
                </div>
              </div>
            </SectionReveal>
          ))}
        </div>
      </section>

      {/* ─── GALLERY ─── */}
      <section className="py-24 bg-white">
        <SectionReveal className="text-center mb-16 px-4">
          <h2 className="text-3xl md:text-5xl font-serif italic">Wedding Gallery</h2>
          <p className="text-neutral-400 mt-4 font-light italic">Captured moments of love and heritage</p>
        </SectionReveal>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-1 px-1">
          {galleryImages.map((img: string, i: number) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className={`relative overflow-hidden aspect-[4/5] ${i === 1 ? 'md:translate-y-12' : ''}`}
            >
              <TemplateImage 
                image={img} 
                alt={`Wedding moment ${i}`} 
                className="w-full h-full transition-transform duration-700 hover:scale-110"
                isEditable={isEditable}
                onEdit={() => onImageEdit?.("gallery", i)}
              />
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── MAP & VENUE ─── */}
      <section className="py-24 px-4 bg-[#FBF9F2]">
        <div className="max-w-4xl mx-auto">
          <SectionReveal>
            <div className="flex items-center justify-center gap-3 text-[#D4AF37] mb-4">
              <MapPin size={24} />
              <span className="font-bold tracking-widest uppercase text-xs">The Venue</span>
            </div>
            <div className="text-center mb-10">
              <h2 className="text-4xl md:text-6xl font-serif italic mb-6">{venue}</h2>
              <p className="text-xl text-neutral-600 mb-2">{venueAddress}</p>
              <p className="text-neutral-400 uppercase tracking-widest text-sm mb-10">{venueCity}</p>
            </div>
            
            <MapPreview mapInput={googleMapsEmbedUrl || coordinates || googleMapsLink || venueAddress} />
          </SectionReveal>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="py-32 px-6 bg-[#1A1A1A] text-center relative overflow-hidden">
        <PalmLeafSVG className="absolute top-0 right-0 text-[#D4AF37]/10" size={300} />
        <PalmLeafSVG className="absolute bottom-0 left-0 text-[#D4AF37]/10 rotate-180" size={300} />
        
        <SectionReveal>
          <KathakaliMotif size={60} className="mx-auto mb-10 text-[#D4AF37] opacity-40" />
          <h2 className="text-4xl md:text-6xl font-serif italic text-[#D4AF37] mb-8">Together Forever</h2>
          <p className="text-neutral-500 uppercase tracking-[0.5em] text-[10px] mb-12">
            {brideName} & {groomName} — {formatWeddingDate(date)}
          </p>
          <div className="w-20 h-px bg-[#D4AF37]/30 mx-auto" />
        </SectionReveal>
      </footer>

      {/* ─── STICKY ACTION ─── */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-full max-w-xs px-4">
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-full bg-white/90 backdrop-blur-xl border border-[#D4AF37]/30 text-[#1A1A1A] py-4 rounded-full shadow-2xl font-bold uppercase tracking-[0.2em] text-[10px]"
        >
          Confirm Attendance
        </motion.button>
      </div>

    </div>
  );
}
