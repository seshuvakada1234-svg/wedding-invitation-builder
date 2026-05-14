/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TemplateType = 'royal-wedding' | 'konaseema' | 'kerala-wedding' | 'kerala-envelope-reveal' | 'housewarming-south';

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