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
    thumbnail: "https://images.unsplash.com/photo-1519225497282-14337446bc77?auto=format&fit=crop&q=80&w=800",
    component: IndianRoyalWeddingTemplate,
    price: 999
  },
  {
    id: "minimal",
    name: "Minimal Royal",
    category: "modern",
    thumbnail: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800",
    component: IndianRoyalWeddingTemplate,
    price: 999
  },
  {
    id: "royal",
    name: "Grand Manor",
    category: "classic",
    thumbnail: "https://images.unsplash.com/photo-1544124499-58912cbddaad?auto=format&fit=crop&q=80&w=800",
    component: IndianRoyalWeddingTemplate,
    price: 999
  },
  {
    id: "beach",
    name: "Coastal Bliss",
    category: "modern",
    thumbnail: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800",
    component: KonaseemaWeddingTemplate,
    price: 999
  },
  {
    id: "konaseema",
    name: "Konaseema Heritage",
    category: "classic",
    thumbnail: "https://images.unsplash.com/photo-1595191151664-213fb01cc3a7?auto=format&fit=crop&q=80&w=800",
    component: KonaseemaWeddingTemplate,
    price: 899
  },
  {
    id: "kerala-wedding",
    name: "Kerala Wedding",
    category: "classic",
    thumbnail: "https://images.unsplash.com/photo-1595191151664-213fb01cc3a7?auto=format&fit=crop&q=80&w=800",
    component: KeralaWeddingTemplate,
    price: 949
  },
  {
    id: "kerala-envelope-reveal",
    name: "Kerala Envelope Reveal",
    category: "premium",
    thumbnail: "https://images.unsplash.com/photo-1595191151664-213fb01cc3a7?auto=format&fit=crop&q=80&w=800",
    component: KeralaRevealTemplate,
    price: 1299
  },
  {
    id: "housewarming-south",
    name: "South Indian Housewarming",
    category: "premium",
    thumbnail: "https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&q=80&w=800",
    component: SouthIndianHousewarmingTemplate,
    price: 1199
  }
];

export const getTemplateById = (id: string) => templates.find(t => t.id === id);
