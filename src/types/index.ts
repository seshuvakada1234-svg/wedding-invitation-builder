/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TemplateType = 'beach' | 'royal' | 'minimal' | 'royal-wedding' | 'konaseema' | 'kerala-wedding' | 'kerala-envelope-reveal' | 'housewarming-south';

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
  
  // Separation of states
  draftData: TemplateDraft;
  publishedData?: TemplateDraft;
  
  // Root fields for compatibility and quick access
  brideName: string;
  groomName: string;
  weddingDate: string;
  location: string;
  template: TemplateType;

  // Additional fields used in Builder state
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

  templateDrafts?: Record<string, TemplateDraft>;
  isPaid: boolean;
  published: boolean;
  views: number;
  viewLimit: number;
  freeViews?: number;
  templatePrice?: number;
  limitExceeded?: boolean;
  hasUnpublishedChanges?: boolean;
  lastPublishedAt?: string;
  redeployCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  isAdmin?: boolean;
}
