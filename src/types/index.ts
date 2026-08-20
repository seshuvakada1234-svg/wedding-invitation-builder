/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TemplateType = 'royal-wedding' | 'kerala-envelope-reveal' | 'housewarming-south' | 'south-india' | 'royal-emerald' | 'royal-heritage' | 'royal-rajasthani';

export interface WeddingEvent {
  name: string;
  date: string;
  time: string;
  location: string;
  image?: string | EditableImage;
}

export interface EditableImage {
  url: string;
  scale: number;
  positionX: number;
  positionY: number;
  width?: number;
  height?: number;
  file?: File;
}

export interface TemplateDraft {
  template: TemplateType;
  brideName: string;
  groomName: string;
  weddingDate: string;
  weddingTime?: string;
  location: string;
  coverImage?: string | EditableImage;
  coverImageKey?: string;
  heroImage?: string | EditableImage;
  backgroundImage?: string | EditableImage;
  introImage?: string | EditableImage;
  galleryImages: (string | EditableImage)[];
  galleryImageKeys?: string[];
  eventImages?: (string | EditableImage)[];
  events: WeddingEvent[];
  story?: string;
  muhurtham?: string;
  deity?: string;
  family?: string;
  eventName?: string;
  enable3D?: boolean;
  enableEnvelope?: boolean;
  googleMapsLink?: string;
  googleMapsEmbedUrl?: string;
  venueAddress?: string;
  venueCity?: string;
  coordinates?: string;
  // Theme & Appearance
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
  coupleMonogram?: string | EditableImage;
  // Music
  musicUrl?: string;
  autoplayMusic?: boolean;
  // Hero
  heroTitle?: string;
  heroSubtitle?: string;
  heroButtonText?: string;
  modalTitle?: string;
  modalSubtitle?: string;
  modalButtonText?: string;
  // RSVP
  rsvpTitle?: string;
  rsvpSubtitle?: string;
  rsvpButtonText?: string;
  whatsappNumber?: string;
  rsvpDeadline?: string;
  // Story/Timeline
  timeline?: { date: string; title: string; description: string; image?: string | EditableImage }[];
  // Countdown
  countdownDate?: string;
  // SEO
  seoTitle?: string;
  seoDescription?: string;
  ogImage?: string | EditableImage;
  footerText?: string;
  modalLabel?: string;
}

export interface WeddingInvite extends Partial<TemplateDraft> {
  id: string;
  slug: string;
  userId: string;
  userName?: string;
  email?: string;
  templateId: string; // The active template in the editor

  status: 'draft' | 'live';
  
  viewsUsed: number;
  viewsLimit: number;

  publishedAt?: string;
  redeployAt?: string; // Last redeploy
  createdAt: string;
  updatedAt: string;

  // ── State architecture ────────────────────────────────────────────────────
  draftData: TemplateDraft;
  publishedData?: TemplateDraft;
  templateDrafts?: Record<string, TemplateDraft>;

  // ── Display fields (mirrored for easy querying/listing) ──────────────────
  brideName: string;
  groomName: string;
  weddingDate: string;
  weddingTime?: string;
  location: string;
  template: TemplateType; // Keep for compatibility with existing code
  coverImage?: string | EditableImage;
  views?: number;
  freeViews?: number;
  published?: boolean;
  hasUnpublishedChanges?: boolean;
  isPaid?: boolean;
  viewLimit?: number;
  limitExceeded?: boolean;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  isAdmin?: boolean;
}