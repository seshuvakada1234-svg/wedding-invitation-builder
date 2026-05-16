import React from "react";
import { motion } from "motion/react";

interface CardProps {
  src: string;
  height: string;
  delay: number;
}

const ImageCard: React.FC<CardProps> = ({ src, height, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 1.2, delay, ease: [0.22, 1, 0.36, 1] }}
    className={`w-full ${height} rounded-[28px] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.12)] bg-white group cursor-pointer border border-white/10`}
  >
    <img
      src={src}
      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
      alt="Wedding Inspiration"
      loading="lazy"
      referrerPolicy="no-referrer"
    />
  </motion.div>
);

const columnData = [
  // Column 1: pt-[0px]
  {
    offset: "pt-0",
    images: [
      { src: "https://images.unsplash.com/photo-1515562141521-7a4cb0c562e1?auto=format&fit=crop&q=80&w=600", h: "h-[320px]" },
      { src: "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&q=80&w=600", h: "h-[220px]" },
    ],
  },
  // Column 2: pt-[40px]
  {
    offset: "pt-[40px]",
    images: [
      { src: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&q=80&w=600", h: "h-[280px]" },
      { src: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=600", h: "h-[340px]" },
    ],
  },
  // Column 3: pt-[90px]
  {
    offset: "pt-[90px]",
    images: [
      { src: "https://pub-4955b83e8ada4ae98b612bd6113cdc4c.r2.dev/Convite%20Casamento%20Interativo%20Estendido%20Personalizado%20-%20R%24%2097.jpg", h: "h-[320px]" },
      { src: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=600", h: "h-[240px]" },
    ],
  },
  // Column 4: pt-[150px] (Lowest point of wave)
  {
    offset: "pt-[150px]",
    images: [
      { src: "https://pub-4955b83e8ada4ae98b612bd6113cdc4c.r2.dev/download%20(10).jpg", h: "h-[380px]" },
      { src: "https://images.unsplash.com/photo-1621434994263-228723fc8c03?auto=format&fit=crop&q=80&w=600", h: "h-[220px]" },
    ],
  },
  // Column 5: pt-[90px]
  {
    offset: "pt-[90px]",
    images: [
      { src: "https://images.unsplash.com/photo-1544124499-58912cbddaad?auto=format&fit=crop&q=80&w=600", h: "h-[280px]" },
      { src: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=600", h: "h-[340px]" },
    ],
  },
  // Column 6: pt-[40px]
  {
    offset: "pt-[40px]",
    images: [
      { src: "https://images.unsplash.com/photo-1610030469668-9851428c3ac2?auto=format&fit=crop&q=80&w=600", h: "h-[220px]" },
      { src: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=600", h: "h-[340px]" },
    ],
  },
  // Column 7: pt-0
  {
    offset: "pt-0",
    images: [
      { src: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=600", h: "h-[320px]" },
      { src: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&q=80&w=600", h: "h-[240px]" },
    ],
  },
];

export const Hero: React.FC = () => {
  return (
    <section className="relative min-h-screen bg-[#f7f7f5] overflow-hidden pt-32 flex flex-col items-center">
      
      {/* ── Collage Backdrop (z-10) ───────────────────────────────────────── */}
      <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none flex items-start justify-center pt-32">
        <div className="flex items-start justify-center gap-8 px-4 w-full max-w-[1720px] mx-auto">
          {columnData.map((column, colIdx) => (
            <motion.div
              key={colIdx}
              animate={{ y: [0, -12, 0] }}
              transition={{
                duration: 12 + (colIdx * 1.5),
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className={`flex-1 w-[110px] sm:w-[140px] md:w-[170px] flex flex-col gap-6 ${column.offset} ${
                colIdx === 0 || colIdx === 6 ? "hidden 2xl:flex" : 
                colIdx === 1 || colIdx === 5 ? "hidden xl:flex" : "flex"
              }`}
            >
              {column.images.map((img, imgIdx) => (
                <ImageCard
                  key={imgIdx}
                  src={img.src}
                  height={img.h}
                  delay={0.1 * (colIdx + imgIdx)}
                />
              ))}
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Bottom Fade (z-30) ───────────────────────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 h-56 bg-gradient-to-b from-transparent to-[#f7f7f5] z-30 pointer-events-none" />

      {/* Decorative Glows */}
      <div className="absolute top-1/2 left-0 w-[600px] h-[600px] bg-editorial-accent/10 rounded-full blur-[180px] pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute top-1/2 right-0 w-[600px] h-[600px] bg-[#2d5a27]/10 rounded-full blur-[180px] pointer-events-none translate-x-1/2 -translate-y-1/2" />
    </section>
  );
};

export default Hero;

