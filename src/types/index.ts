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

export interface WeddingInvite {
  id?: string;
  slug: string;
  userId: string;
  userName?: string;
  email?: string;
  brideName: string;
  groomName: string;
  weddingDate: string;
  location: string;
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
  template: TemplateType;
  isPaid: boolean;
  published: boolean;
  views: number;
  viewLimit: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  isAdmin?: boolean;
}
