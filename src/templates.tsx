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
  price: number;
}

export const templates: TemplateConfig[] = [
  {
    id: "royal-wedding",
    name: "Indian Royal Wedding",
    category: "classic",
    thumbnail: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&q=80&w=800",
    previewImage: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&q=80&w=1200",
    component: IndianRoyalWeddingTemplate,
    price: 999
  },
  {
    id: "konaseema",
    name: "Konaseema Heritage",
    category: "classic",
    thumbnail: "https://images.unsplash.com/photo-1595191151664-213fb01cc3a7?auto=format&fit=crop&q=80&w=800",
    previewImage: "https://images.unsplash.com/photo-1595191151664-213fb01cc3a7?auto=format&fit=crop&q=80&w=1200",
    component: KonaseemaWeddingTemplate,
    price: 899
  },
  {
    id: "kerala-wedding",
    name: "Kerala Wedding",
    category: "classic",
    thumbnail: "https://images.unsplash.com/photo-1544124499-58912cbddaad?auto=format&fit=crop&q=80&w=800",
    previewImage: "https://images.unsplash.com/photo-1544124499-58912cbddaad?auto=format&fit=crop&q=80&w=1200",
    component: KeralaWeddingTemplate,
    price: 949
  },
  {
    id: "kerala-envelope-reveal",
    name: "Kerala Envelope Reveal",
    category: "premium",
    thumbnail: "https://images.unsplash.com/photo-1607344645866-009c522b63e2?auto=format&fit=crop&q=80&w=800",
    previewImage: "https://images.unsplash.com/photo-1607344645866-009c522b63e2?auto=format&fit=crop&q=80&w=1200",
    component: KeralaRevealTemplate,
    price: 1299
  },
  {
    id: "housewarming-south",
    name: "South Indian Housewarming",
    category: "premium",
    thumbnail: "https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&q=80&w=800",
    previewImage: "https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&q=80&w=1200",
    component: SouthIndianHousewarmingTemplate,
    price: 1199
  }
];

export const getTemplateById = (id: string) => templates.find(t => t.id === id);
