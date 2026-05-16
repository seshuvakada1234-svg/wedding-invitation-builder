/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TemplateType = 'royal-wedding' | 'konaseema' | 'kerala-wedding' | 'kerala-envelope-reveal' | 'housewarming-south' | 'south-india';

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
  location: string;
  coverImage?: string | EditableImage;
  coverImageKey?: string;
  galleryImages: (string | EditableImage)[];
  galleryImageKeys?: string[];
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

export interface WeddingInvite {
  id?: string;
  slug: string;
  userId: string;
  userName?: string;
  email?: string;

  // ── Separated state architecture ──────────────────────────────────────────
  // draftData  → what the editor loads and saves on every change
  // publishedData → frozen snapshot; only updated on paid publish/redeploy
  draftData: TemplateDraft;
  publishedData?: TemplateDraft;

  // ── Root fields (lifecycle flags — NEVER overwritten by draftData spread) ─
  // These must always reflect the true Firestore document state.
  published: boolean;
  isPaid: boolean;
  paid?: boolean;                  // mirrors check-user API response field
  hasUnpublishedChanges?: boolean;
  lastPublishedAt?: string;
  redeployCount?: number;

  // ── Root display fields (kept in sync with draftData on every save) ───────
  // Used for quick access in Dashboard cards and API queries.
  brideName: string;
  groomName: string;
  weddingDate: string;
  location: string;
  template: TemplateType;

  // ── Editor working fields (mirrored from draftData into formData) ─────────
  // These exist on the root so Builder's formData state works without
  // constantly unwrapping draftData. On load, hydrated from draftData only
  // (never allowed to clobber lifecycle flags above).
  coverImage?: string | EditableImage;
  coverImageKey?: string;
  galleryImages: (string | EditableImage)[];
  galleryImageKeys?: string[];
  googleMapsLink: string;
  googleMapsEmbedUrl?: string;
  coordinates?: string;
  venueAddress?: string;
  venueCity?: string;
  muhurtham?: string;
  deity?: string;
  family?: string;
  enable3D?: boolean;
  enableEnvelope?: boolean;
  eventName?: string;
  story?: string;
  events: WeddingEvent[];
  // CMS Fields
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  fontStyle?: string;
  headingFont?: string;
  bodyFont?: string;
  borderRadius?: string;
  shadowIntensity?: string;
  animationStyle?: string;
  coupleNickname?: string;
  familyNames?: string;
  weddingHashtag?: string;
  coupleMonogram?: string | EditableImage;
  musicUrl?: string;
  autoplayMusic?: boolean;
  rsvpTitle?: string;
  rsvpSubtitle?: string;
  rsvpButtonText?: string;
  whatsappNumber?: string;
  rsvpDeadline?: string;
  timeline?: { date: string; title: string; description: string; image?: string | EditableImage }[];
  countdownDate?: string;
  seoTitle?: string;
  seoDescription?: string;
  ogImage?: string | EditableImage;
  footerText?: string;
  modalLabel?: string;
  modalSubtitle?: string;
  modalButtonText?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroButtonText?: string;
  modalTitle?: string;

  // ── Per-template drafts (for template-switcher memory) ───────────────────
  templateDrafts?: Record<string, TemplateDraft>;

  // ── View / billing ────────────────────────────────────────────────────────
  views: number;
  viewLimit: number;
  freeViews?: number;
  templatePrice?: number;
  limitExceeded?: boolean;

  // ── Timestamps ────────────────────────────────────────────────────────────
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  isAdmin?: boolean;
}