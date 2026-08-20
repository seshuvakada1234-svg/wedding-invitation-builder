/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  Save,
  Eye,
  MapPin,
  Calendar,
  User,
  Heart,
  Upload,
  ChevronLeft,
  Sparkles,
  CheckCircle2,
  Monitor,
  Tablet,
  Smartphone,
  Maximize2,
  Minimize2,
  ExternalLink,
  Send,
  MessageSquare,
  Globe,
  Loader2,
  X,
  Trash2,
  Plus,
  Clock,
  Images,
  Copy,
  Check,
  Rocket,
  Edit2,
  Move,
  RefreshCcw,
  ZoomIn as ZoomIcon,
  ChevronDown,
  Palette,
  Crown,
  Gem
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { WeddingInvite, TemplateType, WeddingEvent, EditableImage, TemplateDraft } from "../types";
import { auth, authFetch, db, handleFirestoreError, loginAnonymously } from "../lib/firebase";
import { getTemplateById } from "../templates";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, onSnapshot, collection, addDoc, serverTimestamp, increment, updateDoc } from "firebase/firestore";
import toast from "react-hot-toast";
import ImageEditorModal from "../components/ImageEditorModal";
import ImageItem from "../components/ImageItem";
import { safeJsonStringify } from "../lib/stringUtils";

import { useEditorStore } from "../store/useEditorStore";
import * as Accordion from "@radix-ui/react-accordion";
import * as Tabs from "@radix-ui/react-tabs";
import { CoupleIdentity } from "../components/editor/CoupleIdentity";
import { HeroEditor } from "../components/editor/HeroEditor";
import { ThemeCustomizer } from "../components/editor/ThemeCustomizer";
import { EventBuilder } from "../components/editor/EventBuilder";
import { GalleryManager } from "../components/editor/GalleryManager";
import { MusicSettings } from "../components/editor/MusicSettings";
import { RSVPContact } from "../components/editor/RSVPContact";
import { CountdownSettings } from "../components/editor/CountdownSettings";
import { SEOSettings } from "../components/editor/SEOSettings";

import { calculateFreeViews } from "../lib/pricing";

// ─── Constants ────────────────────────────────────────────────────────────────

const TEMPLATE_DEFAULTS: Record<string, string[]> = {
  "royal-wedding": ["Haldi", "Mehendi", "Sangeet", "Wedding"],
  "kerala-envelope-reveal": ["Pellikuthuru", "Haldi", "Mehendi", "Wedding"],
  "housewarming-south": ["Gruha Pravesh", "Satyanarayana Vratham"],
  "royal-emerald": ["Haldi", "Mehendi", "Sangeet", "Wedding"],
  "royal-heritage": ["Haldi", "Mehendi", "Sangeet", "Wedding"],
  "royal-rajasthani": ["Ganesh Puja", "Mehendi & Sangeet", "Haldi Ceremony", "Royal Wedding", "Reception"],
};

const GALLERY_DEFAULTS: Record<string, string[]> = {
  "housewarming-south": [
    "https://images.unsplash.com/photo-1582560475093-ba66accbc424?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&q=80&w=800",
  ],
  default: [
    "https://images.unsplash.com/photo-1510076857177-7470076d4098?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1544124499-58912cbddaad?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800",
  ],
};

function normalizeImages(source: any) {
  const getUrl = (val: any): string => {
    if (!val) return "";
    if (typeof val === "string") return val;
    if (typeof val === "object" && val.url) return val.url;
    return "";
  };

  const heroImage = getUrl(source.heroImage);
  const coverImage = getUrl(source.coverImage);
  const backgroundImage = getUrl(source.backgroundImage);
  const introImage = getUrl(source.introImage);
  const coupleImage = getUrl(source.coupleImage);
  const image = getUrl(source.image);

  // Gallery images can be array of strings or objects
  const galleryImages = (source.galleryImages || []).map((img: any) => getUrl(img)).filter(Boolean);

  // Event images can be event.image or event.img
  const eventImages: string[] = [];
  if (source.events && Array.isArray(source.events)) {
    source.events.forEach((ev: any) => {
      const imgVal = ev.image || ev.img;
      const url = getUrl(imgVal);
      if (url) {
        eventImages.push(url);
      }
    });
  }
  // Also support separate eventImages if provided
  if (source.eventImages && Array.isArray(source.eventImages)) {
    source.eventImages.forEach((img: any) => {
      const url = getUrl(img);
      if (url && !eventImages.includes(url)) {
        eventImages.push(url);
      }
    });
  }

  // timelines or legacy fields
  const timelineImages: string[] = [];
  if (source.timeline && Array.isArray(source.timeline)) {
    source.timeline.forEach((item: any) => {
      const url = getUrl(item.image || item.img);
      if (url) {
        timelineImages.push(url);
      }
    });
  }

  const allUrls = [
    heroImage,
    coverImage,
    backgroundImage,
    introImage,
    coupleImage,
    image,
    ...galleryImages,
    ...eventImages,
    ...timelineImages,
  ].filter(Boolean);

  const imageUrls = Array.from(new Set(allUrls));

  const uploadedAssets = imageUrls.filter(url => 
    !url.includes("images.unsplash.com") && 
    url.startsWith("http")
  );

  return {
    heroImage: heroImage || coverImage || image || "",
    coverImage: coverImage || heroImage || image || "",
    backgroundImage: backgroundImage || "",
    introImage: introImage || "",
    galleryImages,
    eventImages,
    imageUrls,
    uploadedAssets,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Builder() {
  const { templateId, inviteId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialTemplate = (templateId || searchParams.get("template") || "royal-wedding") as TemplateType;
  const [isEditMode, setIsEditMode] = useState(!!inviteId);

  const { formData, setFormData } = useEditorStore();

  useEffect(() => {
    // Set initial defaults if store is empty and we are NOT editing an existing invitation (no inviteId)
    if (!inviteId && !formData.brideName) {
      setFormData({
        brideName: "Elena Sofia",
        groomName: "Marcus James",
        weddingDate: "September 24, 2024",
        location: "Villa d'Este, Lake Como",
        venueAddress: "",
        venueCity: "",
        googleMapsLink: "",
        story: "",
        deity: "Lord Venkateswara",
        eventName: "Gruha Pravesh",
        muhurtham: "2:43 AM",
        family: "Chodapaneedi Family",
        enable3D: true,
        enableEnvelope: true,
        template: initialTemplate,
        templateDrafts: {},
        galleryImages: GALLERY_DEFAULTS[initialTemplate] || GALLERY_DEFAULTS["default"],
        events: (TEMPLATE_DEFAULTS[initialTemplate] || ["Wedding"]).map((name) => ({
          name,
          date: "TBD",
          time: "TBD",
          location: "TBD",
          image: "",
        })),
        viewLimit: 500,
        views: 0,
        isPaid: false,
        published: false,
        // Theme Defaults
        primaryColor: "#581c87",
        secondaryColor: "#d4af37",
        fontStyle: "font-['Cormorant_Garamond']",
        borderRadius: "32px",
        heroTitle: "A Royal Lavender Love Story",
        heroSubtitle: "You are cordially invited",
        heroButtonText: "Open Invitation",
        rsvpTitle: "RSVP",
        rsvpSubtitle: "Will you join us in our fairytale?",
        rsvpButtonText: "Send Your RSVP",
        footerText: "Created with Love",
        modalLabel: "Together with their families",
        modalTitle: "Request the pleasure of your company at celebration of their marriage",
        modalSubtitle: "at half past two in the afternoon",
        modalButtonText: "Close with Love 💜",
      });
    }
  }, [inviteId, initialTemplate, setFormData]);

  useEffect(() => {
    // Reset editor state when opening an existing invite to prevent stale template/data leaks
    if (inviteId) {
      setFormData({
        brideName: "",
        groomName: "",
        weddingDate: "",
        location: "",
        coverImage: null,
        coverImageKey: null,
        galleryImages: [],
        galleryImageKeys: [],
        events: [],
        story: "",
        muhurtham: "",
        deity: "",
        family: "",
        eventName: "",
        enable3D: true,
        enableEnvelope: true,
        googleMapsLink: "",
        googleMapsEmbedUrl: "",
        venueAddress: "",
        venueCity: "",
        coordinates: null,
        template: undefined,
        status: undefined,
        publishedData: undefined,
        draftData: undefined,
      });
    }
  }, [inviteId, setFormData]);

  const currentTemplateId = (formData.template || initialTemplate) as TemplateType;
  const templateConfig = getTemplateById(currentTemplateId);

  // ── Auth state ──────────────────────────────────────────────────────────────
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [templatePrices, setTemplatePrices] = useState<Record<string, number>>({});
  const [disabledTemplates, setDisabledTemplates] = useState<Set<string>>(new Set());

  // ── Load dynamic prices and availability from Firestore ──────────────
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "templates"), (snap) => {
      const newPrices: Record<string, number> = {};
      const newDisabled = new Set<string>();
      
      snap.docs.forEach((doc) => {
        const data = doc.data();
        if (data.publishPrice) {
          newPrices[doc.id] = Number(data.publishPrice);
        }
        if (data.enabled === false) {
          newDisabled.add(doc.id);
        }
      });
      
      setTemplatePrices(prev => ({ ...prev, ...newPrices }));
      setDisabledTemplates(newDisabled);
    });
    return () => unsub();
  }, []);

  const isTemplateDisabled = disabledTemplates.has(currentTemplateId);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });

    const timeout = setTimeout(() => {
      if (authLoading) {
        console.warn("Auth timed out — forcing unblocked view.");
        setAuthLoading(false);
      }
    }, 6000);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── UI state ────────────────────────────────────────────────────────────────
  const [isFetchingInvite, setIsFetchingInvite] = useState(!!inviteId);
  const [isSaving, setIsSaving] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showRedeployModal, setShowRedeployModal] = useState(false);
  const [showFinalSuccessModal, setShowFinalSuccessModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [hasUnpublishedChanges, setHasUnpublishedChanges] = useState(false);
  const [publishedInviteId, setPublishedInviteId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [viewDevice, setViewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");

  const prevTemplateRef = useRef<string | undefined>(formData.template);

  // ── Track changes ──────────────────────────────────────────────────────────
  const loadedDataRef = useRef<string>("");
  useEffect(() => {
    if (!formData.published) return;

    const currentDataStr = safeJsonStringify({
      brideName: formData.brideName,
      groomName: formData.groomName,
      weddingDate: formData.weddingDate,
      weddingTime: formData.weddingTime,
      location: formData.location,
      venueAddress: formData.venueAddress,
      venueCity: formData.venueCity,
      googleMapsLink: formData.googleMapsLink,
      coordinates: formData.coordinates,
      story: formData.story,
      events: formData.events,
      galleryImages: formData.galleryImages,
      template: formData.template,
      muhurtham: formData.muhurtham,
      deity: formData.deity,
      family: formData.family,
      eventName: formData.eventName,
      enable3D: formData.enable3D,
      enableEnvelope: formData.enableEnvelope,
      coupleNickname: formData.coupleNickname,
      weddingHashtag: formData.weddingHashtag,
      familyNames: formData.familyNames,
      heroTitle: formData.heroTitle,
      heroSubtitle: formData.heroSubtitle,
      musicUrl: formData.musicUrl,
      rsvpDeadline: formData.rsvpDeadline,
      whatsappNumber: formData.whatsappNumber,
    });

    if (!loadedDataRef.current && isEditMode) {
      return;
    }

    if (loadedDataRef.current && loadedDataRef.current !== currentDataStr && !hasUnpublishedChanges) {
      setHasUnpublishedChanges(true);
    }
  }, [formData, hasUnpublishedChanges, isEditMode]);

  const [imageEditorConfig, setImageEditorConfig] = useState<{
    isOpen: boolean;
    image: string | EditableImage | null;
    target: "cover" | "gallery";
    index?: number;
    aspect?: number;
  }>({
    isOpen: false,
    image: null,
    target: "cover",
  });

  // ─── Derived values ─────────────────────────────────────────────────────────
  const isHousewarming = formData.template === "housewarming-south";

  const siteSlug =
    formData.slug ||
    inviteId ||
    (`${formData.groomName?.toLowerCase() || "groom"}-${formData.brideName?.toLowerCase() || "bride"}`)
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "") || "new-invite";

  const getCurrentDataAsDraft = (source: any = formData): TemplateDraft => ({
    template: source.template || initialTemplate,
    brideName: source.brideName || "",
    groomName: source.groomName || "",
    weddingDate: source.weddingDate || "",
    location: source.location || "",
    coverImage: source.coverImage,
    coverImageKey: source.coverImageKey,
    heroImage: source.heroImage,
    backgroundImage: source.backgroundImage,
    introImage: source.introImage,
    galleryImages: source.galleryImages || [],
    galleryImageKeys: source.galleryImageKeys || [],
    eventImages: source.eventImages || [],
    events: source.events || [],
    story: source.story,
    muhurtham: source.muhurtham,
    deity: source.deity,
    family: source.family,
    eventName: source.eventName,
    enable3D: source.enable3D,
    enableEnvelope: source.enableEnvelope,
    googleMapsLink: source.googleMapsLink,
    googleMapsEmbedUrl: source.googleMapsEmbedUrl,
    venueAddress: source.venueAddress,
    venueCity: source.venueCity,
    coordinates: source.coordinates,
  });

  // ── Auto-save Draft ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser || authLoading || isFetchingInvite || !isEditMode) return;

    const timer = setTimeout(async () => {
      try {
        const token = await currentUser.getIdToken();
        const id = inviteId || formData.slug || siteSlug;

        const currentDraft = getCurrentDataAsDraft();
        const inviteData: Partial<WeddingInvite> = {
          draftData: currentDraft,
          templateId: currentTemplateId,
          templateDrafts: {
            ...(formData.templateDrafts || {}),
            [currentTemplateId]: currentDraft,
          },
          updatedAt: new Date().toISOString() as any,
          // Mirror display fields to root for easy listing
          brideName: currentDraft.brideName,
          groomName: currentDraft.groomName,
          weddingDate: currentDraft.weddingDate,
          location: currentDraft.location,
          template: currentTemplateId,
        };

        await fetch("/api/save-draft", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: safeJsonStringify({ id, ...inviteData }),
        });

        console.log("Auto-save successful");
      } catch (err) {
        console.error("Auto-save failed:", err);
      }
    }, 3000); // 3 seconds debounce

    return () => clearTimeout(timer);
  }, [formData, currentUser, authLoading, isFetchingInvite, isEditMode, inviteId, siteSlug, currentTemplateId]);

  // ── Load existing invite ────────────────────────────────────────────────────
  useEffect(() => {
    async function loadInvite() {
      if (!inviteId || !currentUser) {
        if (inviteId && !currentUser) {
          return;
        }
        setIsFetchingInvite(false);
        return;
      }

      setIsFetchingInvite(true);
      try {
        const res = await authFetch(`/api/get-invite?id=${inviteId}`);
        const result = await res.json();

        if (result.success && result.invite) {
          const data = result.invite;
          if (data.userId !== currentUser.uid) {
            toast.error("You don't have permission to edit this invitation.");
            navigate("/dashboard");
            return;
          }

          // ── CORE HYDRATION ──
          // On Builder load:
          // if invitation.status == live:
          // load publishedData first
          // Else:
          // load draftData
          // Else:
          // load template defaults
          // Priority: publishedData -> draftData -> template defaults
          const tempId = data.template || data.templateId || initialTemplate;
          const templateConf = getTemplateById(tempId);
          const templateDefaultCover = templateConf?.previewImage || "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&h=600&fit=crop&auto=format";

          const templateDefaults = {
            coverImage: templateDefaultCover,
            heroImage: templateDefaultCover,
            backgroundImage: "",
            introImage: "",
            galleryImages: GALLERY_DEFAULTS[tempId] || GALLERY_DEFAULTS["default"] || [],
            events: (TEMPLATE_DEFAULTS[tempId] || ["Wedding"]).map((name) => ({
              name,
              date: "TBD",
              time: "TBD",
              location: "TBD",
              image: "",
            })),
          };

          const draft = data.publishedData || data.draftData || templateDefaults;

          const getImgUrl = (val: any): string => {
            if (!val) return "";
            if (typeof val === "string") return val;
            if (typeof val === "object" && val.url) return val.url;
            return "";
          };

          const hydrHero = getImgUrl(draft.heroImage) || templateDefaultCover;
          const hydrCover = getImgUrl(draft.coverImage) || templateDefaultCover;
          const hydrBackground = getImgUrl(draft.backgroundImage) || "";
          const hydrIntro = getImgUrl(draft.introImage) || "";

          const hydrGallery = (draft.galleryImages && draft.galleryImages.length > 0)
            ? draft.galleryImages
            : templateDefaults.galleryImages;

          const hydrEvents = (draft.events && draft.events.length > 0)
            ? draft.events
            : templateDefaults.events;

          setFormData({
            ...data, // Keep meta fields (views, status, etc.)
            ...draft, // Overlay actual design content
            heroImage: hydrHero,
            coverImage: hydrCover,
            backgroundImage: hydrBackground,
            introImage: hydrIntro,
            galleryImages: hydrGallery,
            events: hydrEvents,
            templateId: tempId,
            template: tempId,
          });

          // Memory for other templates
          if (data.templateDrafts) {
             setFormData(prev => ({ ...prev, templateDrafts: data.templateDrafts }));
          }

          // Sync prevTemplateRef to avoid triggering the template switch effect on initial load
          prevTemplateRef.current = draft.template || data.template || tempId;
          setIsEditMode(true);
          if (data.status === "live") {
            setHasUnpublishedChanges(false);
          } else {
            setHasUnpublishedChanges(data.hasUnpublishedChanges || false);
          }

          // Set initial reference data AFTER loading so change-detection
          // doesn't fire immediately on open
          loadedDataRef.current = safeJsonStringify({
            brideName: draft.brideName,
            groomName: draft.groomName,
            weddingDate: draft.weddingDate,
            weddingTime: draft.weddingTime,
            location: draft.location,
            venueAddress: draft.venueAddress,
            venueCity: draft.venueCity,
            googleMapsLink: draft.googleMapsLink,
            coordinates: draft.coordinates,
            story: draft.story,
            events: hydrEvents,
            galleryImages: hydrGallery,
            template: tempId,
            muhurtham: draft.muhurtham,
            deity: draft.deity,
            family: draft.family,
            eventName: draft.eventName,
            enable3D: draft.enable3D,
            enableEnvelope: draft.enableEnvelope,
            coupleNickname: draft.coupleNickname,
            weddingHashtag: draft.weddingHashtag,
            familyNames: draft.familyNames,
            heroTitle: draft.heroTitle,
            heroSubtitle: draft.heroSubtitle,
            musicUrl: draft.musicUrl,
            rsvpDeadline: draft.rsvpDeadline,
            whatsappNumber: draft.whatsappNumber,
          });
        } else {
          toast.error("Invitation not found.");
          navigate("/dashboard");
        }
      } catch (err) {
        console.error("Error loading invite:", err);
        toast.error("Failed to load invitation.");
      } finally {
        setIsFetchingInvite(false);
      }
    }

    if (!authLoading && inviteId) {
      loadInvite();
    }
  }, [inviteId, authLoading, currentUser, navigate]);

  // ── Sync template drafts when switching ──────────────────────────────────────
  useEffect(() => {
    if (isFetchingInvite) return;

    const oldTemplate = prevTemplateRef.current;
    const newTemplate = formData.template;

    if (oldTemplate && newTemplate && oldTemplate !== newTemplate) {
      setFormData((prev) => {
        if (!prev) return prev;

        // 1. Snapshot current design into templateDrafts[oldTemplate]
        const currentDraft = getCurrentDataAsDraft(prev);
        const updatedDrafts = {
          ...(prev.templateDrafts || {}),
          [oldTemplate]: currentDraft,
        };

        // 2. Check if we have a saved draft for the new template
        const existingNewDraft = updatedDrafts[newTemplate];

        if (existingNewDraft) {
          // Restore previous draft for this template
          return {
            ...prev,
            ...existingNewDraft,
            templateDrafts: updatedDrafts,
            template: newTemplate,
          };
        } else {
          // New starting point for this template
          const defaultEventNames = TEMPLATE_DEFAULTS[newTemplate] || ["Wedding"];
          return {
            ...prev,
            templateDrafts: updatedDrafts,
            template: newTemplate,
            galleryImages: GALLERY_DEFAULTS[newTemplate] || GALLERY_DEFAULTS["default"],
            events: defaultEventNames.map((name) => ({
              name,
              date: prev.weddingDate || "",
              time: "TBD",
              location: prev.location || "",
            })),
          };
        }
      });
    }
    prevTemplateRef.current = formData.template;
  }, [formData.template, isFetchingInvite]);

  // ─── Change Detection ───
  useEffect(() => {
    if (formData.status !== 'live' || !formData.publishedData) {
      setHasUnpublishedChanges(false);
      return;
    }

    const currentDraft = getCurrentDataAsDraft(formData);
    const published = formData.publishedData;

    // Simple JSON comparison for change detection
    const draftStr = safeJsonStringify(currentDraft);
    const publishedStr = safeJsonStringify(published);

    setHasUnpublishedChanges(draftStr !== publishedStr);
  }, [formData]);

  useEffect(() => {
    if (showFinalSuccessModal && publishedInviteId) {
      const timer = setTimeout(() => {
        if (showFinalSuccessModal) {
          navigate(`/invitation/${publishedInviteId}`);
        }
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [showFinalSuccessModal, publishedInviteId, navigate]);

  // ── Loading screen ──────────────────────────────────────────────────────────
  if (authLoading || isFetchingInvite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-editorial-bg">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-editorial-accent animate-spin mx-auto mb-4" />
          <p className="text-xs uppercase tracking-[0.2em] text-editorial-muted font-bold">
            {isFetchingInvite ? "Loading Story..." : "Preparing Your Cinematic Studio..."}
          </p>
        </div>
      </div>
    );
  }

  const handleEventChange = (index: number, field: keyof WeddingEvent, value: string) => {
    const newEvents = [...(formData.events || [])];
    newEvents[index] = { ...newEvents[index], [field]: value };
    setFormData((prev) => ({ ...prev, events: newEvents }));
  };

  const addEvent = () => {
    setFormData((prev) => ({
      ...prev,
      events: [...(prev.events || []), { name: "New Event", date: "", time: "", location: "", image: "" }],
    }));
  };

  const removeEvent = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      events: prev.events?.filter((_, i) => i !== index),
    }));
  };

  const handleImageEditorSave = async (data: EditableImage) => {
    if (imageEditorConfig.target === "cover") {
      setFormData((prev) => {
        if (typeof prev.coverImage === "object" && prev.coverImage.url.startsWith("blob:")) {
          URL.revokeObjectURL(prev.coverImage.url);
        }
        return { ...prev, coverImage: data };
      });
      toast.success("Cover image added to preview!");
    } else if (imageEditorConfig.target === "gallery" && typeof imageEditorConfig.index === "number") {
      const idx = imageEditorConfig.index;
      setFormData((prev) => {
        const newGallery = [...(prev.galleryImages || [])];
        const oldImg = newGallery[idx];
        if (typeof oldImg === "object" && oldImg.url.startsWith("blob:")) {
          URL.revokeObjectURL(oldImg.url);
        }
        newGallery[idx] = data;
        return { ...prev, galleryImages: newGallery };
      });
      toast.success("Gallery image added to preview!");
    } else if (imageEditorConfig.target === "event" && typeof imageEditorConfig.index === "number") {
      const idx = imageEditorConfig.index;
      setFormData((prev) => {
        const newEvents = [...(prev.events || [])];
        if (newEvents[idx]) {
          const oldImg = newEvents[idx].image;
          if (typeof oldImg === "object" && oldImg.url.startsWith("blob:")) {
            URL.revokeObjectURL(oldImg.url);
          }
          newEvents[idx] = {
            ...newEvents[idx],
            image: data,
          };
        }
        return { ...prev, events: newEvents };
      });
      toast.success("Event image added to preview!");
    }
  };

  const uploadPendingImages = async (data: Partial<WeddingInvite>) => {
    const updatedData = { ...data };
    const uploadMap = new Map<string, { url: string; key: string }>();
    const collectTasks: (() => Promise<void>)[] = [];

    const addTask = (file: File, previewUrl: string) => {
      collectTasks.push(async () => {
        const res = await uploadImage(file);
        uploadMap.set(previewUrl, res);
      });
    };

    if (typeof updatedData.coverImage === "object" && updatedData.coverImage?.file) {
      addTask(updatedData.coverImage.file, updatedData.coverImage.url);
    }

    if (typeof (updatedData as any).coupleImage === "object" && (updatedData as any).coupleImage?.file) {
      addTask((updatedData as any).coupleImage.file, (updatedData as any).coupleImage.url);
    }

    if (typeof (updatedData as any).image === "object" && (updatedData as any).image?.file) {
      addTask((updatedData as any).image.file, (updatedData as any).image.url);
    }

    updatedData.galleryImages?.forEach((img) => {
      if (typeof img === "object" && img.file) {
        addTask(img.file, img.url);
      }
    });

    updatedData.events?.forEach((ev) => {
      if (typeof ev.image === "object" && ev.image.file) {
        addTask(ev.image.file, ev.image.url);
      } else if (typeof (ev as any).img === "object" && (ev as any).img.file) {
        addTask((ev as any).img.file, (ev as any).img.url);
      }
    });

    if (collectTasks.length === 0) return updatedData;

    const toastId = toast.loading("Uploading images to secure storage...");
    try {
      for (const task of collectTasks) {
        await task();
      }

      if (typeof updatedData.coverImage === "object" && updatedData.coverImage?.file) {
        const result = uploadMap.get(updatedData.coverImage.url);
        if (result) {
          updatedData.coverImage = { ...updatedData.coverImage, url: result.url, file: undefined };
          updatedData.coverImageKey = result.key;
        }
      }

      if (typeof (updatedData as any).coupleImage === "object" && (updatedData as any).coupleImage?.file) {
        const result = uploadMap.get((updatedData as any).coupleImage.url);
        if (result) {
          (updatedData as any).coupleImage = { ...(updatedData as any).coupleImage, url: result.url, file: undefined };
        }
      }

      if (typeof (updatedData as any).image === "object" && (updatedData as any).image?.file) {
        const result = uploadMap.get((updatedData as any).image.url);
        if (result) {
          (updatedData as any).image = { ...(updatedData as any).image, url: result.url, file: undefined };
        }
      }

      if (updatedData.galleryImages) {
        updatedData.galleryImages = updatedData.galleryImages.map((img) => {
          if (typeof img === "object" && img.file) {
            const result = uploadMap.get(img.url);
            if (result) return { ...img, url: result.url, file: undefined };
          }
          return img;
        });
      }

      if (updatedData.events) {
        updatedData.events = updatedData.events.map((ev) => {
          let newEv = { ...ev };
          if (typeof ev.image === "object" && ev.image.file) {
            const result = uploadMap.get(ev.image.url);
            if (result) newEv.image = { ...ev.image, url: result.url, file: undefined };
          }
          if (typeof (ev as any).img === "object" && (ev as any).img.file) {
            const result = uploadMap.get((ev as any).img.url);
            if (result) (newEv as any).img = { ...(ev as any).img, url: result.url, file: undefined };
          }
          return newEv;
        });
      }

      toast.success("All images uploaded!", { id: toastId });
    } catch (err) {
      toast.error("Image upload failed. Please try again.", { id: toastId });
      throw err;
    }

    return updatedData;
  };

  const openImageEditor = (target: string, image: string | EditableImage | null, index?: number, aspect?: number) => {
    let finalAspect = aspect;
    if (!finalAspect) {
      if (target === "cover") {
        finalAspect = 16 / 9;
      } else if (target === "event") {
        finalAspect = 16 / 10;
      } else {
        if (formData.template === "royal-wedding") finalAspect = 1;
        else if (formData.template === "kerala-envelope-reveal") finalAspect = 3 / 4;
        else finalAspect = 4 / 5;
      }
    }

    setImageEditorConfig({
      isOpen: true,
      image,
      target,
      index,
      aspect: finalAspect,
    });
  };

  const uploadImage = async (file: File, type: string = "General") => {
    if (!currentUser) throw new Error("Must be logged in to upload.");

    const formDataBody = new FormData();
    formDataBody.append("file", file);
    formDataBody.append("userId", currentUser.uid);
    formDataBody.append("inviteId", siteSlug);

    const res = await authFetch("/api/upload", {
      method: "POST",
      body: formDataBody,
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Upload response error text:", text);
      let errorMessage = `Upload failed (${res.status})`;
      try {
        const errorData = JSON.parse(text);
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        if (text.length > 0 && text.length < 200) {
          errorMessage = text;
        } else if (text.includes("<title>")) {
          const titleMatch = text.match(/<title>(.*?)<\/title>/);
          if (titleMatch) errorMessage = `Server Error: ${titleMatch[1]}`;
        }
      }
      throw new Error(errorMessage);
    }

    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await res.text();
      console.error("Non-JSON response received:", text.substring(0, 500));
      if (text.includes("<title>")) {
        const titleMatch = text.match(/<title>(.*?)<\/title>/);
        if (titleMatch) throw new Error(`Server Error: ${titleMatch[1]}`);
      }
      throw new Error("Server returned an invalid response. Please try again.");
    }

    try {
      const data = await res.json();

      const invId = inviteId || formData.slug || siteSlug;
      const isLive = formData.status === "live" || formData.published;

      const imgDoc = {
        userId: currentUser.uid,
        email: currentUser.email || "",
        invitationId: invId || "anonymous",
        template: formData.template || "royal-wedding",
        templateName: formData.template || "royal-wedding",
        brideName: formData.brideName || "",
        groomName: formData.groomName || "",
        imageUrl: data.url,
        imageKey: data.key,
        previewUrl: data.url,
        fileName: file.name,
        imageType: type,
        type: type,
        deployType: isLive ? "REDEPLOY" : "DEPLOY",
        source: isLive ? "redeploy" : "deploy",
        uploadedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };

      try {
        await addDoc(collection(db, "uploadedImages"), {
          invitationId: invId || siteSlug || "anonymous",
          userId: currentUser.uid,
          email: currentUser.email || "",
          brideName: formData.brideName || "",
          groomName: formData.groomName || "",
          templateId: formData.templateId || formData.template || "royal-wedding",
          templateName: formData.template || "royal-wedding",
          imageUrl: data.url,
          imageKey: data.key,
          previewUrl: data.url,
          fileName: file.name,
          imageType: type,
          type: type,
          deployType: isLive ? "REDEPLOY" : "DEPLOY",
          source: isLive ? "redeploy" : "deploy",
          createdAt: serverTimestamp(),
          uploadedAt: new Date().toISOString()
        });

        // Also save to adminImages for backward compatibility
        await addDoc(collection(db, "adminImages"), imgDoc);
      } catch (dbErr) {
        console.error("Firestore image metadata save failed", dbErr);
      }

      if (invId) {
        try {
          await updateDoc(doc(db, "invites", invId), {
            imageCount: increment(1)
          });
        } catch (dbErr2) {
          console.error("Firestore increment imageCount failed", dbErr2);
        }
      }

      return { url: data.url, key: data.key };
    } catch (e) {
      console.error("JSON parse error on upload:", e);
      throw new Error("Failed to parse server response.");
    }
  };

  const deleteImage = async (key: string) => {
    try {
      await authFetch("/api/delete", {
        method: "DELETE",
        body: JSON.stringify({ key }),
      });
    } catch (error) {
      console.error("Delete failed", error);
    }
  };

  const removeGalleryImage = (index: number) => {
    const imgKey = formData.galleryImageKeys?.[index];
    if (imgKey) deleteImage(imgKey);
    setFormData((prev) => ({
      ...prev,
      galleryImages: prev.galleryImages?.filter((_, idx) => idx !== index),
      galleryImageKeys: prev.galleryImageKeys?.filter((_, idx) => idx !== index),
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ─── handleSaveDraft ─────────────────────────────────────────────────────────
  const handleSaveDraft = async () => {
    if (!currentUser) {
      toast.error("Please log in first to save a draft.");
      navigate("/login");
      return;
    }

    setIsSavingDraft(true);

    try {
      const token = await currentUser.getIdToken();

      let isPaid = false;
      try {
        const checkRes = await fetch("/api/check-user", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (checkRes.ok) {
          const userData = await checkRes.json();
          const currentTemplate = (formData.template || "royal-wedding") as string;
          const normalizedTemplate = currentTemplate.toLowerCase().trim();
          isPaid =
            userData.paid === true ||
            (userData.paidTemplates &&
              (userData.paidTemplates[currentTemplate] === true ||
                userData.paidTemplates[normalizedTemplate] === true));
        }
      } catch (e) {
        console.error("Failed to check payment status for draft save, assuming unpaid", e);
      }

      let finalizedData = { ...formData };

      finalizedData.templateDrafts = {
        ...(formData.templateDrafts || {}),
        [formData.template || "royal-wedding"]: getCurrentDataAsDraft(),
      };

      const id = isEditMode
        ? inviteId || finalizedData.slug || siteSlug
        : finalizedData.slug || finalizedData.id || Math.random().toString(36).substring(2, 10);

      const currentDraft = getCurrentDataAsDraft();
      const inviteData: Partial<WeddingInvite> = {
        ...finalizedData,
        draftData: currentDraft,
        id,
        userId: currentUser.uid,
        userName: currentUser.displayName || "User",
        email: currentUser.email || "",
        slug: id,
        brideName: currentDraft.brideName,
        groomName: currentDraft.groomName,
        template: currentDraft.template,
        weddingDate: currentDraft.weddingDate,
        location: currentDraft.location,
        published: formData.published || false,
        hasUnpublishedChanges: hasUnpublishedChanges,
        updatedAt: new Date().toISOString(),
      };

      const saveRes = await fetch("/api/save-draft", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: safeJsonStringify({ id, ...inviteData }),
      });

      if (!saveRes.ok) {
        const errText = await saveRes.text();
        throw new Error(errText || "Failed to save draft");
      }

      toast.success("Draft saved!");
      if (!isEditMode) {
        navigate(`/builder/edit/${id}`, { replace: true });
      }
    } catch (error: any) {
      console.error("Draft save error:", error);
      toast.error(error.message || "An error occurred while saving draft.");
    } finally {
      setIsSavingDraft(false);
    }
  };

  const uploadToR2 = async (imgUrl: string, type: string = "General"): Promise<string> => {
    try {
      const res = await fetch(imgUrl);
      const blob = await res.blob();
      const extension = blob.type.split("/")[1] || "jpg";
      const filename = `uploaded_image_${Date.now()}.${extension}`;
      const file = new File([blob], filename, { type: blob.type });
      const uploaded = await uploadImage(file, type);
      return uploaded.url;
    } catch (e) {
      console.error("uploadToR2 failed for", imgUrl, e);
      return imgUrl;
    }
  };

  const resolveImage = async (image: any, type: string = "General"): Promise<any> => {
    if (!image) return null;

    let imgUrl = typeof image === "string" ? image : image.url;
    if (!imgUrl) return image;

    if (imgUrl.startsWith("https://")) {
      return image;
    }

    if (imgUrl.startsWith("blob:") || imgUrl.startsWith("data:")) {
      try {
        const r2Url = await uploadToR2(imgUrl, type);
        if (typeof image === "string") {
          return r2Url;
        } else {
          return {
            ...image,
            url: r2Url,
            file: undefined, // remove file to avoid payload/memory bloat
          };
        }
      } catch (err) {
        console.error("resolveImage failed:", err);
        return image;
      }
    }

    return image;
  };

  // ─── handleSave ──────────────────────────────────────────────────────────────
  const handleSave = async (forceSaveAfterPayment = false) => {
    if (!currentUser) {
      toast.error("Please log in first to publish your invitation.");
      navigate("/login");
      return;
    }

    if (isTemplateDisabled) {
      toast.error("This template is currently unavailable. Please choose another one.");
      return;
    }

    if (isSaving || isCheckingPayment) return;

    setIsSaving(true);
    
    try {
      const token = await currentUser.getIdToken();

      if (!forceSaveAfterPayment) {
        setIsCheckingPayment(true);
        const checkRes = await fetch("/api/check-user", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!checkRes.ok) {
          setIsCheckingPayment(false);
          setIsSaving(false);
          if (checkRes.status === 401) {
            toast.error("Session expired. Please log in again.");
            navigate("/login");
            return;
          }
          throw new Error("Failed to check payment status");
        }

        const userData = await checkRes.json();
        const currentTemplate = (formData.template || "royal-wedding") as string;
        const normalizedTemplate = currentTemplate.toLowerCase().trim();

        const isTemplatePaid =
          userData.paid === true ||
          (userData.paidTemplates &&
            (userData.paidTemplates[currentTemplate] === true ||
              userData.paidTemplates[normalizedTemplate] === true));

        setIsCheckingPayment(false);

        if (!isTemplatePaid) {
          setShowPricingModal(true);
          setIsSaving(false);
          return;
        }

        if (formData.status === 'live' && hasUnpublishedChanges) {
          setShowRedeployModal(true);
          setIsSaving(false);
          return;
        }
      }

      const dataToSave = {
        ...formData,
        templateDrafts: {
          ...(formData.templateDrafts || {}),
          [formData.template || "royal-wedding"]: getCurrentDataAsDraft(),
        },
      };

      const rawDraft = getCurrentDataAsDraft(dataToSave);
      const existingPublished: Partial<TemplateDraft> = formData.publishedData || {};

      // REDEPLOY FIX logic using resolveImage helper
      const newHero = await resolveImage(rawDraft.heroImage, "HERO");
      const heroImageObj = newHero ?? existingPublished.heroImage;

      const newCover = await resolveImage(rawDraft.coverImage, "HERO");
      const coverImageObj = newCover ?? existingPublished.coverImage;

      const newBackground = await resolveImage(rawDraft.backgroundImage, "BACKGROUND");
      const backgroundImageObj = newBackground ?? existingPublished.backgroundImage;

      const newIntro = await resolveImage(rawDraft.introImage, "HERO");
      const introImageObj = newIntro ?? existingPublished.introImage;

      const rawGallery = rawDraft.galleryImages || [];
      const resolvedGallery = await Promise.all(
        rawGallery.map((img) => resolveImage(img, "GALLERY"))
      );
      const galleryImagesObj = resolvedGallery.length > 0 
        ? resolvedGallery 
        : (existingPublished.galleryImages || []);

      const rawEventImages = rawDraft.eventImages || [];
      const resolvedEventImages = await Promise.all(
        rawEventImages.map((img) => resolveImage(img, "GALLERY"))
      );
      const eventImagesObj = resolvedEventImages.length > 0
        ? resolvedEventImages
        : ((existingPublished as any)?.eventImages || []);

      const rawEvents = rawDraft.events || [];
      const resolvedEvents = await Promise.all(
        rawEvents.map(async (ev) => {
          const imgVal = ev.image || (ev as any).img;
          if (imgVal) {
            const resolvedImg = await resolveImage(imgVal, "GALLERY");
            return {
              ...ev,
              image: resolvedImg
            };
          }
          return ev;
        })
      );

      // Now normalize all constructed assets to plain URLs
      const norm = normalizeImages({
        ...rawDraft,
        heroImage: heroImageObj,
        coverImage: coverImageObj,
        backgroundImage: backgroundImageObj,
        introImage: introImageObj,
        galleryImages: galleryImagesObj,
        eventImages: eventImagesObj,
        events: resolvedEvents,
      });

      const finalizedEvents = resolvedEvents.map((ev: any) => {
        const imgVal = ev.image || ev.img;
        let urlStr = "";
        if (imgVal) {
          urlStr = typeof imgVal === "string" ? imgVal : (imgVal.url || "");
        }
        const copy = { ...ev };
        if (copy.image !== undefined) copy.image = urlStr;
        if (copy.img !== undefined) copy.img = urlStr;
        if (!copy.image && urlStr) {
          copy.image = urlStr;
        }
        return copy;
      });

      // Construct publishedData ONLY AFTER R2 UPLOADS COMPLETE
      const publishedData = {
        ...rawDraft,
        heroImage: norm.heroImage,
        coverImage: norm.coverImage,
        backgroundImage: norm.backgroundImage,
        introImage: norm.introImage,
        galleryImages: norm.galleryImages,
        eventImages: norm.eventImages,
        events: finalizedEvents,
        imageUrls: norm.imageUrls,
        uploadedAssets: norm.uploadedAssets,
        updatedAt: new Date().toISOString(),
        deployedAt: new Date().toISOString(),
      };

      console.log("DEPLOY DATA", publishedData);

      const id = inviteId || formData.slug || siteSlug;

      const inviteData: Partial<WeddingInvite> = {
        ...formData,
        draftData: rawDraft,
        publishedData: publishedData,
        id,
        userId: currentUser.uid,
        userName: currentUser.displayName || "User",
        email: currentUser.email || "",
        slug: id,
        template: rawDraft.template,
        brideName: rawDraft.brideName,
        groomName: rawDraft.groomName,
        weddingDate: rawDraft.weddingDate,
        location: rawDraft.location,
        status: 'live',
        published: true,
        isPaid: true,
        hasUnpublishedChanges: false,
        publishedAt: formData.publishedAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const saveRes = await fetch("/api/save-invite", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: safeJsonStringify({ id, ...inviteData }),
      });

      if (!saveRes.ok) throw new Error("Failed to publish");

      // Update deploy / redeploy counts in Firestore
      try {
        const isRedeploy = formData.status === "live" || formData.published === true;
        const invitationRef = doc(db, "invites", id);
        if (isRedeploy) {
          await updateDoc(invitationRef, {
            published: true,
            publishedData,
            status: "live",
            redeployCount: increment(1),
            imageCount: increment(norm.uploadedAssets.length)
          });
        } else {
          await updateDoc(invitationRef, {
            published: true,
            publishedData,
            status: "live",
            deployCount: increment(1),
            imageCount: increment(norm.uploadedAssets.length)
          });
        }
      } catch (dbErr) {
        console.error("Failed to update deploy/redeploy counters in Firestore", dbErr);
      }

      setPublishedInviteId(id);
      setSaveSuccess(true);
      setHasUnpublishedChanges(false);
      setFormData(prev => ({ ...prev, ...inviteData }));
      
      if (forceSaveAfterPayment) {
        setShowFinalSuccessModal(true);
      } else {
        toast.success("🎉 Published successfully!");
        setShowShareModal(true);
      }
    } catch (error: any) {
      console.error("Publish error:", error);
      toast.error(error.message || "Publish failed");
    } finally {
      setIsSaving(false);
    }
  };

  const loadRazorpay = () => {
    return new Promise<boolean>((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }

      const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]') as HTMLScriptElement | null;
      if (existing) {
        if ((existing as any).readyState === "complete" || existing.getAttribute("data-loaded") === "true") {
          resolve(!!(window as any).Razorpay);
          return;
        }
        existing.addEventListener("load", () => resolve(true), { once: true });
        existing.addEventListener("error", () => resolve(false), { once: true });
        setTimeout(() => resolve(!!(window as any).Razorpay), 6000);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => {
        script.setAttribute("data-loaded", "true");
        resolve(true);
      };
      script.onerror = () => resolve(false);
      setTimeout(() => resolve(!!(window as any).Razorpay), 6000);
      document.body.appendChild(script);
    });
  };

  const handlePaymentAndPublish = async () => {
    if (!currentUser || isProcessingPayment) return;
    setIsProcessingPayment(true);

    const currentTemplate = formData.template || "royal-wedding";
    const templatePrice = templatePrices[currentTemplate] || getTemplateById(currentTemplate)?.publishPrice || 999;
    const templatePricePaise = templatePrice * 100;

    try {
      const configRes = await fetch("/api/config");
      const configData = await configRes.json();
      const razorpayKeyId = configData.razorpayKeyId;

      if (!razorpayKeyId) {
        throw new Error("Razorpay key not found in configuration");
      }

      const token = await currentUser.getIdToken();

      const orderRes = await fetch("/api/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ templateId: currentTemplate }),
      });
      const orderData = await orderRes.json();

      if (!orderData.success) {
        throw new Error(orderData.error || "Order creation failed");
      }

      const order = orderData.order;

      const razorpayLoaded = await loadRazorpay();
      if (!razorpayLoaded || !(window as any).Razorpay) {
        console.error("Razorpay checkout.js did not load. window.Razorpay is missing.");
        toast.error("Unable to load payment gateway. Please disable blockers and refresh.");
        setIsProcessingPayment(false);
        return;
      }

      const options = {
        key: razorpayKeyId,
        amount: templatePricePaise,
        currency: "INR",
        name: "Wedding Invitation",
        description: "Publish Your Invitation",
        order_id: order.id,
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                userId: currentUser.uid,
                email: currentUser.email,
                templateId: currentTemplate,
              }),
            });
            const verifyData = await verifyRes.json();

            if (verifyData.success) {
              toast.success("Payment verified! Finalizing...");
              setShowPricingModal(false);
              setTimeout(async () => {
                await handleSave(true);
              }, 1500);
            } else {
              toast.error("Payment verification failed. Please contact support.");
              setIsProcessingPayment(false);
            }
          } catch (err) {
            console.error("Verification error:", err);
            toast.error("An error occurred while verifying your payment.");
          } finally {
            setIsProcessingPayment(false);
          }
        },
        prefill: {
          email: currentUser?.email || "",
          name: currentUser?.displayName || "",
        },
        theme: { color: "#000000" },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error: any) {
      console.error("Payment initialization error:", error);
      toast.error(error.message || "Payment initiation failed");
      setIsProcessingPayment(false);
    }
  };

  const handleRedeploy = async () => {
    if (!currentUser || isProcessingPayment) return;
    setIsProcessingPayment(true);

    try {
      const configRes = await fetch("/api/config");
      const configData = await configRes.json();
      const razorpayKeyId = configData.razorpayKeyId;

      if (!razorpayKeyId) throw new Error("Razorpay key not found");

      const token = await currentUser.getIdToken();

      const orderRes = await fetch("/api/create-redeploy-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const orderData = await orderRes.json();

      if (!orderData.success) throw new Error(orderData.error || "Order failed");

      const razorpayLoaded = await loadRazorpay();
      if (!razorpayLoaded || !(window as any).Razorpay) {
        console.error("Razorpay checkout.js did not load. window.Razorpay is missing.");
        toast.error("Unable to load payment gateway. Please disable blockers and refresh.");
        setIsProcessingPayment(false);
        return;
      }

      const options = {
        key: razorpayKeyId,
        amount: orderData.amount,
        currency: "INR",
        name: "Wedding Invitation",
        description: "Redeploy Your Invitation",
        order_id: orderData.order.id,
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch("/api/verify-redeploy-payment", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                inviteId: formData.id || inviteId,
              }),
            });
            const verifyData = await verifyRes.json();

            if (verifyData.success) {
              toast.success("Payment verified! Redeploying...");
              setShowRedeployModal(false);
              setHasUnpublishedChanges(false);
              setTimeout(async () => {
                await handleSave(true);
              }, 1500);
            } else {
              toast.error("Verification failed.");
            }
          } catch (err) {
            console.error(err);
            toast.error("An error occurred during verification.");
          } finally {
            setIsProcessingPayment(false);
          }
        },
        prefill: {
          email: currentUser?.email || "",
          name: currentUser?.displayName || "",
        },
        theme: { color: "#000000" },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Redeploy failed");
      setIsProcessingPayment(false);
    }
  };

  // ─── Viewport helpers ────────────────────────────────────────────────────────

  const deviceWidths = {
    desktop: "100%",
    tablet: "768px",
    mobile: "375px",
  };

  const deviceContainerClasses = {
    desktop: "max-w-5xl",
    tablet: "max-w-[768px]",
    mobile: "max-w-[375px]",
  };

  const openNewTab = () => window.open(`/site/${siteSlug}`, "_blank");

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div
      className={`flex-1 grid transition-all duration-500 overflow-hidden h-[calc(100vh-64px)] bg-white relative ${
        isPreviewMode ? "grid-cols-1" : "grid-cols-[380px_1fr]"
      }`}
    >
      {/* ── Sidebar Editor ── */}
      <AnimatePresence>
        {!isPreviewMode && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "380px", opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="bg-white border-r border-gray-100 flex flex-col h-full shrink-0 z-30 shadow-2xl relative"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-100 bg-linear-to-b from-gray-50 to-white">
              <button
                onClick={() => navigate("/templates")}
                className="flex items-center gap-2 text-[10px] font-bold text-gray-400 hover:text-purple-600 transition-colors mb-4 uppercase tracking-[0.2em] group"
              >
                <ChevronLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
                Galleries
              </button>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-600 rounded-2xl shadow-lg shadow-purple-200">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-serif italic text-gray-900 leading-tight">Design Studio</h1>
                    <div className="flex items-center gap-2 mt-1">
                      {formData.status === "live" && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-green-50 text-[9px] font-bold text-green-600 uppercase tracking-tighter border border-green-100 rounded-full">
                          <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                          Live
                        </span>
                      )}
                      {hasUnpublishedChanges && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-[9px] font-bold text-amber-600 uppercase tracking-tighter border border-amber-100 rounded-full">
                          Changes Pending
                        </span>
                      )}
                      {!formData.status && (
                        <span className="text-[9px] uppercase font-bold tracking-widest text-gray-400">
                          Draft Mode
                        </span>
                      )}
                    </div>
                  </div>
                </div>
            </div>

            {/* CMS Sections */}
            <div className="flex-1 overflow-y-auto px-6 py-8 space-y-10 custom-scrollbar pb-32">
              <Accordion.Root type="single" defaultValue="identity" collapsible className="space-y-4">
                <Accordion.Item value="identity" className="border-b border-gray-50 pb-4">
                  <Accordion.Header className="flex">
                    <Accordion.Trigger className="flex-1 flex items-center justify-between py-2 text-left group">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-pink-50 rounded-lg group-hover:bg-pink-100 transition-colors">
                           <User className="w-4 h-4 text-pink-600" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-widest text-gray-700">Couple Identity</span>
                      </div>
                      <ChevronDown className="w-4 h-4 text-gray-300 transition-transform duration-300 group-data-[state=open]:rotate-180" />
                    </Accordion.Trigger>
                  </Accordion.Header>
                  <Accordion.Content className="pt-4 animate-in fade-in slide-in-from-top-1 duration-300">
                    <CoupleIdentity />
                  </Accordion.Content>
                </Accordion.Item>

                <Accordion.Item value="hero" className="border-b border-gray-50 pb-4">
                  <Accordion.Header className="flex">
                    <Accordion.Trigger className="flex-1 flex items-center justify-between py-2 text-left group">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
                           <Sparkles className="w-4 h-4 text-purple-600" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-widest text-gray-700">Hero Section</span>
                      </div>
                      <ChevronDown className="w-4 h-4 text-gray-300 transition-transform duration-300 group-data-[state=open]:rotate-180" />
                    </Accordion.Trigger>
                  </Accordion.Header>
                  <Accordion.Content className="pt-4">
                    <HeroEditor />
                  </Accordion.Content>
                </Accordion.Item>

                <Accordion.Item value="itinerary" className="border-b border-gray-50 pb-4">
                  <Accordion.Header className="flex">
                    <Accordion.Trigger className="flex-1 flex items-center justify-between py-2 text-left group">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                           <Calendar className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-widest text-gray-700">Itinerary</span>
                      </div>
                      <ChevronDown className="w-4 h-4 text-gray-300 transition-transform duration-300 group-data-[state=open]:rotate-180" />
                    </Accordion.Trigger>
                  </Accordion.Header>
                  <Accordion.Content className="pt-4">
                    <EventBuilder />
                  </Accordion.Content>
                </Accordion.Item>

                <Accordion.Item value="gallery" className="border-b border-gray-50 pb-4">
                  <Accordion.Header className="flex">
                    <Accordion.Trigger className="flex-1 flex items-center justify-between py-2 text-left group">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 rounded-lg group-hover:bg-emerald-100 transition-colors">
                           <Images className="w-4 h-4 text-emerald-600" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-widest text-gray-700">Gallery</span>
                      </div>
                      <ChevronDown className="w-4 h-4 text-gray-300 transition-transform duration-300 group-data-[state=open]:rotate-180" />
                    </Accordion.Trigger>
                  </Accordion.Header>
                  <Accordion.Content className="pt-4">
                    <GalleryManager />
                  </Accordion.Content>
                </Accordion.Item>

                <Accordion.Item value="theme" className="border-b border-gray-50 pb-4">
                  <Accordion.Header className="flex">
                    <Accordion.Trigger className="flex-1 flex items-center justify-between py-2 text-left group">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-50 rounded-lg group-hover:bg-amber-100 transition-colors">
                           <Palette className="w-4 h-4 text-amber-600" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-widest text-gray-700">Theme & Style</span>
                      </div>
                      <ChevronDown className="w-4 h-4 text-gray-300 transition-transform duration-300 group-data-[state=open]:rotate-180" />
                    </Accordion.Trigger>
                  </Accordion.Header>
                  <Accordion.Content className="pt-4">
                    <ThemeCustomizer />
                  </Accordion.Content>
                </Accordion.Item>

                <Accordion.Item value="music" className="border-b border-gray-50 pb-4">
                  <Accordion.Header className="flex">
                    <Accordion.Trigger className="flex-1 flex items-center justify-between py-2 text-left group">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-50 rounded-lg group-hover:bg-orange-100 transition-colors">
                           <RefreshCcw className="w-4 h-4 text-orange-600" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-widest text-gray-700">Music Assets</span>
                      </div>
                      <ChevronDown className="w-4 h-4 text-gray-300 transition-transform duration-300 group-data-[state=open]:rotate-180" />
                    </Accordion.Trigger>
                  </Accordion.Header>
                  <Accordion.Content className="pt-4">
                    <MusicSettings />
                  </Accordion.Content>
                </Accordion.Item>

                <Accordion.Item value="rsvp" className="border-b border-gray-50 pb-4">
                  <Accordion.Header className="flex">
                    <Accordion.Trigger className="flex-1 flex items-center justify-between py-2 text-left group">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-cyan-50 rounded-lg group-hover:bg-cyan-100 transition-colors">
                           <Send className="w-4 h-4 text-cyan-600" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-widest text-gray-700">RSVP & Contact</span>
                      </div>
                      <ChevronDown className="w-4 h-4 text-gray-300 transition-transform duration-300 group-data-[state=open]:rotate-180" />
                    </Accordion.Trigger>
                  </Accordion.Header>
                  <Accordion.Content className="pt-4">
                    <RSVPContact />
                  </Accordion.Content>
                </Accordion.Item>

                <Accordion.Item value="countdown" className="border-b border-gray-50 pb-4">
                  <Accordion.Header className="flex">
                    <Accordion.Trigger className="flex-1 flex items-center justify-between py-2 text-left group">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 rounded-lg group-hover:bg-indigo-100 transition-colors">
                           <Clock className="w-4 h-4 text-indigo-600" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-widest text-gray-700">Countdown</span>
                      </div>
                      <ChevronDown className="w-4 h-4 text-gray-300 transition-transform duration-300 group-data-[state=open]:rotate-180" />
                    </Accordion.Trigger>
                  </Accordion.Header>
                  <Accordion.Content className="pt-4">
                    <CountdownSettings />
                  </Accordion.Content>
                </Accordion.Item>

                <Accordion.Item value="seo" className="pb-4">
                  <Accordion.Header className="flex">
                    <Accordion.Trigger className="flex-1 flex items-center justify-between py-2 text-left group">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-slate-100 transition-colors">
                           <Globe className="w-4 h-4 text-slate-600" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-widest text-gray-700">SEO & Sharing</span>
                      </div>
                      <ChevronDown className="w-4 h-4 text-gray-300 transition-transform duration-300 group-data-[state=open]:rotate-180" />
                    </Accordion.Trigger>
                  </Accordion.Header>
                  <Accordion.Content className="pt-4">
                    <SEOSettings />
                  </Accordion.Content>
                </Accordion.Item>
              </Accordion.Root>
            </div>

            {/* Sidebar Actions */}
            <div className="p-6 border-t border-gray-100 bg-white/80 backdrop-blur-md absolute bottom-0 inset-x-0">
               <div className="flex gap-2">
                 <button
                   onClick={handleSaveDraft}
                   disabled={isSavingDraft}
                   className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                 >
                   {isSavingDraft ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                   Save
                 </button>
                 
                 {formData.status === 'live' ? (
                    hasUnpublishedChanges ? (
                      <button
                        onClick={() => setShowRedeployModal(true)}
                        disabled={isSaving || isCheckingPayment}
                        className="flex-[2] py-3 px-4 rounded-xl bg-editorial-ink text-white text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all shadow-lg flex items-center justify-center gap-2"
                      >
                        {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Rocket className="w-3.5 h-3.5 text-editorial-accent" />}
                        Redeploy (₹99)
                      </button>
                    ) : (
                      <button
                        disabled
                        className="flex-[2] py-3 px-4 rounded-xl bg-green-50 text-green-600 border border-green-200 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 cursor-default"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Live
                      </button>
                    )
                  ) : (
                    <button
                      onClick={() => handleSave()}
                      disabled={isSaving || isCheckingPayment}
                      className="flex-[2] py-3 px-4 rounded-xl bg-purple-600 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-purple-700 transition-all shadow-lg shadow-purple-200 flex items-center justify-center gap-2"
                    >
                      {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Rocket className="w-3.5 h-3.5" />}
                      Publish Live
                    </button>
                  )}
               </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── Main Workspace ── */}
      <main className="flex-1 flex flex-col bg-gray-50/50 relative overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-100 z-40 shrink-0">
          <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-xl border border-gray-100 group cursor-default">
                <Globe className="w-4 h-4 text-gray-400 group-hover:text-purple-600 transition-colors" />
                <div className="flex flex-col">
                   <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter leading-none mb-0.5">Live Preview URL</span>
                   <span className="text-xs font-mono text-gray-600">/invitation/{siteSlug}</span>
                </div>
              </div>

              <div className="h-6 w-px bg-gray-200" />

              <div className="flex items-center bg-gray-100/50 p-1 rounded-xl border border-gray-100">
                {(["desktop", "tablet", "mobile"] as const).map((d) => {
                  const Icon = d === "desktop" ? Monitor : d === "tablet" ? Tablet : Smartphone;
                  return (
                    <button
                      key={d}
                      onClick={() => setViewDevice(d)}
                      className={`px-3 py-2 rounded-lg transition-all flex items-center gap-2 ${
                        viewDevice === d
                          ? "bg-white shadow-md shadow-gray-200/50 text-purple-600"
                          : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-widest hidden lg:block">{d}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-4">
               <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsPreviewMode(!isPreviewMode)}
                    className="p-2.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all"
                    title={isPreviewMode ? "Exit Fullscreen" : "Fullscreen Preview"}
                  >
                    {isPreviewMode ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={openNewTab}
                    className="p-2.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all"
                    title="Open Live Site"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </button>
               </div>
               
               <div className="h-6 w-px bg-gray-200" />

               {formData.status === 'live' ? (
                  hasUnpublishedChanges ? (
                    <button
                      onClick={() => setShowRedeployModal(true)}
                      disabled={isSaving || isCheckingPayment}
                      className="bg-editorial-ink text-white px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all shadow-lg disabled:opacity-50 flex items-center gap-2"
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4 text-editorial-accent" />}
                      Redeploy
                    </button>
                  ) : (
                    <button
                      disabled
                      className="bg-green-50 text-green-600 px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-green-200 flex items-center gap-2 cursor-default"
                    >
                      <Check className="w-4 h-4" />
                      Website Live
                    </button>
                  )
               ) : (
                <button
                   onClick={() => handleSave()}
                   disabled={isSaving || isCheckingPayment}
                   className="bg-purple-600 text-white px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-purple-700 transition-all shadow-lg shadow-purple-200 disabled:opacity-50 flex items-center gap-2"
                 >
                   {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                   Publish Now
                 </button>
               )}
            </div>
          </div>
        </header>

        {/* Live Preview Container */}
        <div className="flex-1 overflow-auto scrollbar-hide relative pt-8 pb-16 px-4 flex justify-center items-start bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px]">
          <motion.div
            layout
            key={viewDevice}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              width: deviceWidths[viewDevice],
              height: "100%",
              minHeight: viewDevice === "desktop" ? "100%" : "667px",
            }}
            className={`bg-white shadow-2xl overflow-hidden relative transition-all duration-500 origin-top rounded-none sm:rounded-xl border border-editorial-border/30 mx-auto ${deviceContainerClasses[viewDevice]}`}
          >
            <div className="w-full h-full overflow-y-auto custom-scrollbar bg-white">
              {templateConfig?.component ? (
                <templateConfig.component
                  {...formData}
                  isEditable={true}
                  onUnlock={() => handleSave()}
                  onEditImage={(target: string, index?: number) => {
                    if (target === "cover") {
                      openImageEditor("cover", formData.coverImage || null);
                    } else if (target === "gallery" && typeof index === "number") {
                      openImageEditor("gallery", (formData.galleryImages?.[index] as string) || null, index);
                    } else if (target === "event" && typeof index === "number") {
                      openImageEditor("event", formData.events?.[index]?.image || null, index);
                    }
                  } }
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 font-serif italic">
                  Template Loading...
                </div>
              )}
            </div>

            {/* Draft watermark */}
            <div className="absolute inset-0 pointer-events-none select-none z-50">
              <div className="absolute inset-x-0 bottom-10 flex justify-center">
                <div className="bg-editorial-ink/10 backdrop-blur-md px-6 py-2 rounded-full border border-editorial-ink/5">
                  <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-editorial-ink opacity-30">
                    Wedding Invitation Cinematic Draft
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* ── Exit Preview Button ── */}
      <AnimatePresence>
        {isPreviewMode && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            onClick={() => setIsPreviewMode(false)}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-xl border border-editorial-border px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 z-50 hover:bg-white hover:scale-105 transition-all group"
          >
            <X className="w-4 h-4 text-editorial-accent group-hover:rotate-90 transition-transform" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-editorial-ink">Exit Preview</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Image Editor Modal ── */}
      {imageEditorConfig.isOpen && (
        <ImageEditorModal
          image={imageEditorConfig.image}
          aspect={imageEditorConfig.aspect}
          onClose={() => setImageEditorConfig({ ...imageEditorConfig, isOpen: false })}
          onSave={handleImageEditorSave}
        />
      )}

      {/* ── Pricing Modal ── */}
      <AnimatePresence>
        {showPricingModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isProcessingPayment && setShowPricingModal(false)}
              className="absolute inset-0 bg-editorial-ink/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={`w-full max-w-md rounded-3xl shadow-2xl relative overflow-hidden p-8 ${
                formData.template === 'south-india' 
                  ? 'bg-[#fefcf7] border-2 border-[#d4af37]/30 shadow-[#d4af37]/20' 
                  : 'bg-white'
              }`}
            >
              {formData.template === 'south-india' && (
                <>
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" />
                  <div className="absolute top-0 left-0 w-24 h-24 bg-[#d4af37]/5 rounded-br-full -translate-x-10 -translate-y-10" />
                  <div className="absolute bottom-0 right-0 w-32 h-32 bg-[#d4af37]/5 rounded-tl-full translate-x-12 translate-y-12" />
                </>
              )}
              <button
                onClick={() => setShowPricingModal(false)}
                disabled={isProcessingPayment}
                className={`absolute top-6 right-6 p-2 rounded-full transition-colors ${
                  formData.template === 'south-india' ? 'hover:bg-[#d4af37]/10' : 'hover:bg-neutral-100'
                }`}
              >
                <X className={`w-5 h-5 ${formData.template === 'south-india' ? 'text-[#d4af37]' : 'text-editorial-muted'}`} />
              </button>

              <div className="text-center mb-10">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 ${
                  formData.template === 'south-india' ? 'bg-[#d4af37]/10' : 'bg-editorial-accent/10'
                }`}>
                  {formData.template === 'south-india' ? (
                    <Crown className="w-8 h-8 text-[#d4af37]" />
                  ) : (
                    <Rocket className="w-8 h-8 text-editorial-accent" />
                  )}
                </div>
                <h2 className={`text-3xl font-serif italic mb-2 ${
                  formData.template === 'south-india' ? 'text-purple-900' : ''
                }`}>
                  {formData.template === 'south-india' ? 'Unlock South India Royal Invitation' : 'Publish Your Story'}
                </h2>
                <p className="text-xs uppercase tracking-widest text-editorial-muted">{templateConfig?.name} Template</p>
                <div className="flex items-center justify-center gap-2 mt-4">
                  <span className={`text-4xl font-serif font-bold ${
                    formData.template === 'south-india' ? 'text-[#d4af37]' : 'text-editorial-ink'
                  }`}>
                    ₹{templatePrices[formData.template || "royal-wedding"] || getTemplateById(formData.template || "royal-wedding")?.publishPrice || 999}
                  </span>
                  <span className="text-xs uppercase tracking-widest font-bold text-editorial-muted">One-time</span>
                </div>
              </div>

              <div className="space-y-4 mb-10">
                {(formData.template === 'south-india' 
                  ? [
                      "Full template editing",
                      "Unlimited image uploads",
                      "RSVP management",
                      "Custom music & Event sections",
                      "Mobile optimized invitation",
                      "Shareable live link",
                      "Pay once, valid forever"
                    ]
                  : [
                    `Up to ${calculateFreeViews(templatePrices[formData.template || "royal-wedding"] || getTemplateById(formData.template || "royal-wedding")?.publishPrice || 0)} views included`,
                    "Beautiful live website",
                    "Shareable link",
                    "WhatsApp sharing",
                    "Pay once, valid forever",
                  ]).map((item, i) => (
                  <div key={i} className="flex items-center gap-4 text-xs font-medium text-editorial-secondary">
                    <CheckCircle2 className={`w-4 h-4 shrink-0 ${
                      formData.template === 'south-india' ? 'text-[#d4af37]' : 'text-green-500'
                    }`} />
                    <span className={formData.template === 'south-india' ? 'text-purple-900/80' : ''}>{item}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <button
                  onClick={handlePaymentAndPublish}
                  disabled={isProcessingPayment}
                  className={`w-full py-4 rounded-2xl text-[11px] font-bold uppercase tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-2 ${
                    formData.template === 'south-india'
                      ? 'bg-gradient-to-r from-[#d4af37] via-[#b8860b] to-[#d4af37] text-white hover:brightness-110 shadow-[#d4af37]/20 bg-[length:200%_auto] animate-shimmer'
                      : 'bg-editorial-ink text-white hover:bg-black'
                  }`}
                >
                  {isProcessingPayment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {isProcessingPayment
                    ? "Processing..."
                    : `Pay ₹${templatePrices[formData.template || "royal-wedding"] || getTemplateById(formData.template || "royal-wedding")?.publishPrice || 999} & Publish`}
                </button>
                <p className="text-[9px] text-center text-editorial-muted font-medium uppercase tracking-widest bg-editorial-bg py-2 rounded-lg border border-editorial-border/40">
                  AFTER {calculateFreeViews(templatePrices[formData.template || "royal-wedding"] || getTemplateById(formData.template || "royal-wedding")?.publishPrice || 0)} VIEWS, TOP UP{" "}
                  <span className="text-editorial-ink font-bold">₹99</span> TO GET{" "}
                  <span className="text-editorial-ink font-bold">1000 MORE VIEWS</span>
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Redeploy Modal ── */}
      <AnimatePresence>
        {showRedeployModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isProcessingPayment && setShowRedeployModal(false)}
              className="absolute inset-0 bg-editorial-ink/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl relative overflow-hidden p-8"
            >
              <button
                onClick={() => setShowRedeployModal(false)}
                disabled={isProcessingPayment}
                className="absolute top-6 right-6 p-2 hover:bg-neutral-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-editorial-muted" />
              </button>

              <div className="text-center mb-10">
                <div className="w-16 h-16 bg-editorial-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Rocket className="w-8 h-8 text-editorial-accent" />
                </div>
                <h2 className="text-3xl font-serif italic mb-2">Publish Your Updates</h2>
                <p className="text-xs uppercase tracking-widest text-editorial-muted">
                  Your invitation has unpublished changes.
                </p>
                <div className="flex items-center justify-center gap-2 mt-4">
                  <span className="text-4xl font-serif font-bold text-editorial-ink">₹99</span>
                  <span className="text-xs uppercase tracking-widest font-bold text-editorial-muted text-left">
                    Redeploy Fee
                    <br />
                    ONE-TIME
                  </span>
                </div>
              </div>

              <div className="space-y-4 mb-10">
                {[
                  "Update live website",
                  "Sync new images & gallery",
                  "Sync text & location changes",
                  "Fast CDN cache refresh",
                  "Keep same invitation link",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 text-xs font-medium text-editorial-secondary">
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <button
                  onClick={handleRedeploy}
                  disabled={isProcessingPayment}
                  className="w-full bg-editorial-ink text-white py-5 rounded-2xl text-[11px] font-bold uppercase tracking-[0.2em] shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-3 group"
                >
                  {isProcessingPayment ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Check className="w-5 h-5 group-hover:scale-110 transition-transform text-editorial-accent" />
                  )}
                  <span className="relative z-10">{isProcessingPayment ? "Processing..." : `PAY ₹99 & REDEPLOY`}</span>
                </button>
                <div className="mt-4 text-center">
                  <p className="text-[10px] text-editorial-muted font-medium uppercase tracking-[0.1em]">
                    Your changes will go live immediately after payment
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Final Success Modal ── */}
      <AnimatePresence>
        {showFinalSuccessModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-editorial-ink/70 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl relative overflow-hidden p-10"
            >
              <div className="text-center mb-10">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-100">
                  <CheckCircle2 className="w-10 h-10 text-green-500" />
                </div>
                <h2 className="text-3xl font-serif italic mb-2">Your Story is Live! 🎉</h2>
                <p className="text-xs uppercase tracking-[0.2em] font-bold text-green-600">Payment successful</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-editorial-muted mb-3 block">
                    Live Link
                  </label>
                  <div className="flex items-center gap-2 p-5 bg-editorial-bg border border-editorial-border rounded-2xl">
                    <span className="text-xs font-mono text-editorial-ink truncate flex-1 font-medium">
                      {window.location.origin}/invitation/{publishedInviteId || siteSlug}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(
                          `${window.location.origin}/invitation/${publishedInviteId || siteSlug}`
                        );
                        toast.success("Link copied!");
                      }}
                      className="p-2 hover:bg-white rounded-lg transition-all shadow-sm border border-transparent hover:border-editorial-border"
                    >
                      <Copy className="w-4 h-4 text-editorial-accent" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <button
                    onClick={() => window.open(`/invitation/${publishedInviteId || siteSlug}`, "_blank")}
                    className="flex items-center justify-center gap-3 py-4 bg-editorial-ink text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all shadow-lg"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Visit Live story
                  </button>
                  <button
                    onClick={() => {
                      const text = `Join us for our special day! ❤️ View our cinematic story here: ${window.location.origin}/invitation/${publishedInviteId || siteSlug}`;
                      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
                    }}
                    className="flex items-center justify-center gap-3 py-4 bg-[#25D366] text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all shadow-lg"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Share on WhatsApp
                  </button>
                </div>

                <button
                  onClick={() => setShowFinalSuccessModal(false)}
                  className="w-full text-[10px] font-bold uppercase tracking-widest text-editorial-muted hover:text-editorial-ink pt-4 transition-colors"
                >
                  Close & continue editing
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Share / Success Modal ── */}
      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShareModal(false)}
              className="absolute inset-0 bg-editorial-ink/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full relative z-10 overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-editorial-accent" />

              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-100">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
                <h2 className="text-3xl font-serif italic mb-2">Story Published!</h2>
                <p className="text-editorial-muted text-sm uppercase tracking-widest font-bold">
                  Your cinematic story is live
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-editorial-muted mb-2 block">
                    Your Exclusive Link
                  </label>
                  <div className="flex items-center gap-2 p-4 bg-editorial-bg border border-editorial-border rounded-2xl">
                    <span className="text-xs font-mono text-editorial-ink truncate flex-1">
                      {window.location.origin}/invitation/{publishedInviteId || siteSlug}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(
                          `${window.location.origin}/invitation/${publishedInviteId || siteSlug}`
                        );
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="p-2 hover:bg-white rounded-lg transition-all"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4 text-editorial-accent" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => window.open(`/invitation/${publishedInviteId || siteSlug}`, "_blank")}
                    className="flex items-center justify-center gap-2 py-3 border border-editorial-border rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-editorial-bg transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Visit Live Story
                  </button>
                  <button
                    onClick={() => {
                      const text = `Join us for our ${isHousewarming ? "Housewarming" : "Wedding"}! ❤️ View our cinematic story here: ${window.location.origin}/invitation/${publishedInviteId || siteSlug}`;
                      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
                    }}
                    className="flex items-center justify-center gap-2 py-3 bg-[#25D366] text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all shadow-md"
                  >
                    <Send className="w-3.5 h-3.5" />
                    WhatsApp
                  </button>
                </div>

                <button
                  onClick={() => setShowShareModal(false)}
                  className="w-full text-[10px] font-bold uppercase tracking-tighter text-editorial-muted hover:text-editorial-ink pt-4"
                >
                  Close & Continue Editing
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
