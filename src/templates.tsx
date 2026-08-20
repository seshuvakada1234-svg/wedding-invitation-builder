/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from "react";
import { motion } from "motion/react";
import IndianRoyalWeddingTemplate from "./components/templates/IndianRoyalWeddingTemplate";
import KeralaRevealTemplate from "./components/templates/KeralaRevealTemplate";
import SouthIndianHousewarmingTemplate from "./components/templates/SouthIndianHousewarmingTemplate";
import SouthIndiaTemplate from "./components/templates/SouthIndiaTemplate";
import RoyalEmeraldTemplate from "./components/templates/RoyalEmeraldTemplate";
import RoyalHeritageTemplate from "./components/templates/RoyalHeritageTemplate";
import RoyalRajasthaniTemplate from "./components/templates/RoyalRajasthaniTemplate";
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
  publishPrice?: number;
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
    id: "royal-emerald",
    name: "Royal Emerald Invitation",
    category: "premium",
    publishPrice: 1499,
    thumbnail: "https://pub-4955b83e8ada4ae98b612bd6113cdc4c.r2.dev/download%20(8).jpg",
    previewImage: "https://pub-4955b83e8ada4ae98b612bd6113cdc4c.r2.dev/download%20(12).jpg",
    component: RoyalEmeraldTemplate as any,
  },
  {
    id: "royal-wedding",
    name: "Indian Royal Wedding",
    category: "classic",
    thumbnail: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&q=80&w=800",
    previewImage: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&q=80&w=1200",
    component: IndianRoyalWeddingTemplate,
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
  },
  {
    id: "royal-heritage",
    name: "Royal Heritage Wedding Invitation",
    category: "premium",
    publishPrice: 1499,
    thumbnail: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&q=80&w=800",
    previewImage: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&q=80&w=1200",
    component: RoyalHeritageTemplate as any,
  },
  {
    id: "royal-rajasthani",
    name: "Royal Rajasthani Grandeur",
    category: "premium",
    publishPrice: 1499,
    thumbnail: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&q=80&w=800",
    previewImage: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&q=80&w=1200",
    component: RoyalRajasthaniTemplate as any,
  }
];

export const getTemplateById = (id: string) => templates.find(t => t.id === id);
