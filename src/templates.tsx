/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from "react";
import { motion } from "motion/react";
import IndianRoyalWeddingTemplate from "./components/templates/IndianRoyalWeddingTemplate";
import KonaseemaWeddingTemplate from "./components/templates/KonaseemaWeddingTemplate";
import KeralaWeddingTemplate from "./components/templates/KeralaWeddingTemplate";
import KeralaRevealTemplate from "./components/templates/KeralaRevealTemplate";
import SouthIndianHousewarmingTemplate from "./components/templates/SouthIndianHousewarmingTemplate";
import SouthIndiaTemplate from "./components/templates/SouthIndiaTemplate";
import { WeddingEvent } from "./types";
import { calculateFreeViews } from "./lib/pricing";

// Helper for horizontal scroll check
const useHorizontalScroll = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [canScroll, setCanScroll] = useState(false);
  
  useEffect(() => {
    const check = () => {
      if (ref.current) {
        setCanScroll(ref.current.scrollWidth > ref.current.clientWidth);
      }
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return { ref, canScroll };
};

// Basic Template Placeholders

export interface TemplateConfig {
  id: string;
  name: string;
  category?: 'classic' | 'premium' | 'modern';
  thumbnail: string;
  previewImage: string;
  component: React.ComponentType<{
    brideName: string;
    groomName: string;
    date: string;
    venue: string;
    venueAddress?: string;
    venueCity?: string;
    googleMapsLink?: string;
    googleMapsEmbedUrl?: string;
    coverImage?: string;
    events: WeddingEvent[];
    galleryImages: string[];
    phone?: string;
    whatsapp?: string;
    story?: string;
    enable3D?: boolean;
    enableEnvelope?: boolean;
    [key: string]: any;
  }>;
}

export const templates: TemplateConfig[] = [
  {
    id: "royal-wedding",
    name: "Indian Royal Wedding",
    category: "classic",
    thumbnail: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&q=80&w=800",
    previewImage: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&q=80&w=1200",
    component: IndianRoyalWeddingTemplate,
  },
  {
    id: "konaseema",
    name: "Konaseema Heritage",
    category: "classic",
    thumbnail: "https://images.unsplash.com/photo-1595191151664-213fb01cc3a7?auto=format&fit=crop&q=80&w=800",
    previewImage: "https://images.unsplash.com/photo-1595191151664-213fb01cc3a7?auto=format&fit=crop&q=80&w=1200",
    component: KonaseemaWeddingTemplate,
  },
  {
    id: "kerala-wedding",
    name: "Kerala Wedding",
    category: "classic",
    thumbnail: "https://images.unsplash.com/photo-1544124499-58912cbddaad?auto=format&fit=crop&q=80&w=800",
    previewImage: "https://images.unsplash.com/photo-1544124499-58912cbddaad?auto=format&fit=crop&q=80&w=1200",
    component: KeralaWeddingTemplate,
  },
  {
    id: "kerala-envelope-reveal",
    name: "Kerala Envelope Reveal",
    category: "premium",
    thumbnail: "https://images.unsplash.com/photo-1607344645866-009c522b63e2?auto=format&fit=crop&q=80&w=800",
    previewImage: "https://images.unsplash.com/photo-1607344645866-009c522b63e2?auto=format&fit=crop&q=80&w=1200",
    component: KeralaRevealTemplate,
  },
  {
    id: "housewarming-south",
    name: "South Indian Housewarming",
    category: "premium",
    thumbnail: "https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&q=80&w=800",
    previewImage: "https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&q=80&w=1200",
    component: SouthIndianHousewarmingTemplate,
  },
  {
    id: "south-india",
    name: "South India Royal Lavender",
    category: "premium",
    thumbnail: "https://z-cdn-media.chatglm.cn/files/8171ce15-5501-416e-bd1d-d44d10f6f6fb.jpg?auth_key=1878836107-a0445fa1c2c14fe2b33a5ae83339a445-0-ea768b9484c57d9c6cd767781e4693ab",
    previewImage: "https://z-cdn-media.chatglm.cn/files/b7ada327-7273-4c2c-b631-416c3087fa7c.jpg?auth_key=1878836107-d03b6dfd429748f58353a6eeb2884749-0-027fefdd8997e4cfdc0a0635c9864b1e",
    component: SouthIndiaTemplate,
  }
];

export const getTemplateById = (id: string) => templates.find(t => t.id === id);
