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
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { WeddingInvite, TemplateType, WeddingEvent, EditableImage, TemplateDraft } from "../types";
import { auth, authFetch, db, handleFirestoreError, loginAnonymously } from "../lib/firebase";
import { getTemplateById } from "../templates";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import toast from "react-hot-toast";
import ImageEditorModal from "../components/ImageEditorModal";
import ImageItem from "../components/ImageItem";

import { calculateFreeViews } from "../lib/pricing";

// ─── Constants ────────────────────────────────────────────────────────────────

const TEMPLATE_DEFAULTS: Record<string, string[]> = {
  "royal-wedding": ["Haldi", "Mehendi", "Sangeet", "Wedding"],
  konaseema: ["Pellikuthuru", "Haldi", "Mehendi", "Wedding"],
  "kerala-wedding": ["Madhuramveypu", "Nischaayam", "Wedding", "Reception"],
  "kerala-envelope-reveal": ["Pellikuthuru", "Haldi", "Mehendi", "Wedding"],
  "housewarming-south": ["Gruha Pravesh", "Satyanarayana Vratham"],
};

const GALLERY_DEFAULTS: Record<string, string[]> = {
  "housewarming-south": [
    "https://images.unsplash.com/photo-1582560475093-ba66accbc424?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1603228254119-e6a4d0adad35?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1623053531393-e4d0937a0980?auto=format&fit=crop&q=80&w=800",
  ],
  default: [
    "https://images.unsplash.com/photo-1519225497282-14337446bc77?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1544124499-58912cbddaad?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800",
  ],
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function Builder() {
  const { templateId, inviteId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialTemplate = (templateId || searchParams.get("template") || "royal-wedding") as TemplateType;
  const [isEditMode, setIsEditMode] = useState(!!inviteId);

  const [formData, setFormData] = useState<Partial<WeddingInvite>>({
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
    })),
    viewLimit: 500,
    views: 0,
    isPaid: false,
  });

  const currentTemplateId = (formData.template || initialTemplate) as TemplateType;
  const templateConfig = getTemplateById(currentTemplateId);

  // ── Auth state ──────────────────────────────────────────────────────────────
  // FIX: track the actual Firebase user object so we never call API before
  // auth is restored from session storage.
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [templatePrices, setTemplatePrices] = useState<Record<string, number>>({
    "housewarming-south": 799,
    "kerala-wedding": 799,
    "konaseema": 999,
    "kerala-envelope-reveal": 1299,
    "royal-wedding": 1499,
  });

  useEffect(() => {
    async function loadDynamicPrices() {
      try {
        const { templates: staticTemplates } = await import("../templates");
        const templateIds = staticTemplates.map(t => t.id);
        const promises = templateIds.map(t => getDoc(doc(db, "templates", t)));
        const snaps = await Promise.all(promises);
        
        const newPrices: Record<string, number> = { ...templatePrices };
        snaps.forEach((snap, i) => {
          if (snap.exists()) {
            const data = snap.data();
            if (data.publishPrice) {
              newPrices[templateIds[i]] = Number(data.publishPrice);
            }
          }
        });
        setTemplatePrices(newPrices);
      } catch (e) {
        console.error("Failed to load dynamic prices in Builder:", e);
      }
    }

    // onAuthStateChanged fires once immediately with the persisted user (or null).
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
      // Load prices once auth state is settled
      loadDynamicPrices();
    });

    // Safety timeout — if Firebase takes > 6 s, stop blocking the UI.
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
    
    const currentDataStr = JSON.stringify({
      brideName: formData.brideName,
      groomName: formData.groomName,
      weddingDate: formData.weddingDate,
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
      enableEnvelope: formData.enableEnvelope
    });

    if (!loadedDataRef.current && isEditMode) {
      // Avoid setting ref on initial empty state if we are loading
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
    galleryImages: source.galleryImages || [],
    galleryImageKeys: source.galleryImageKeys || [],
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
  const lastAutoSaveRef = useRef<string>("");
  useEffect(() => {
    if (!currentUser || authLoading || isFetchingInvite || !isEditMode) return;

    const currentDataStr = JSON.stringify({
      formData: formData,
      activeDraft: getCurrentDataAsDraft()
    });

    if (lastAutoSaveRef.current === "") {
      lastAutoSaveRef.current = currentDataStr;
      return;
    }

    if (lastAutoSaveRef.current === currentDataStr) return;

    const timer = setTimeout(async () => {
      try {
        const token = await currentUser.getIdToken();
        const id = inviteId || formData.slug || siteSlug;
        
        const currentDraft = getCurrentDataAsDraft();
        const inviteData: Partial<WeddingInvite> = {
          draftData: currentDraft,
          templateDrafts: {
            ...(formData.templateDrafts || {}),
            [formData.template || "royal-wedding"]: currentDraft
          },
          updatedAt: new Date().toISOString() as any,
          hasUnpublishedChanges: true,
        };

        await fetch("/api/save-draft", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id, ...inviteData }),
        });
        
        lastAutoSaveRef.current = currentDataStr;
        console.log("Auto-save successful");
      } catch (err) {
        console.error("Auto-save failed:", err);
      }
    }, 5000); // 5 second debounce

    return () => clearTimeout(timer);
  }, [formData, currentUser, authLoading, isFetchingInvite, isEditMode, inviteId, siteSlug]);

  // ── Load existing invite ────────────────────────────────────────────────────
  useEffect(() => {
    async function loadInvite() {
      if (!inviteId || !currentUser) {
        if (inviteId && !currentUser) {
          // If we have inviteId but no user, wait for auth or redirect
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

          // Hydrate from draftData if available
          if (data.draftData) {
            setFormData({
              ...data,
              ...data.draftData
            });
          } else {
            setFormData(data);
          }

          // Sync prevTemplateRef to avoid triggering the template switch effect on initial load
          prevTemplateRef.current = data.draftData?.template || data.template;
          setIsEditMode(true);
          setHasUnpublishedChanges(data.hasUnpublishedChanges || false);
          
          // Set initial reference data AFTER loading
          const d = data.draftData || data;
          loadedDataRef.current = JSON.stringify({
            brideName: d.brideName,
            groomName: d.groomName,
            weddingDate: d.weddingDate,
            location: d.location,
            venueAddress: d.venueAddress,
            venueCity: d.venueCity,
            googleMapsLink: d.googleMapsLink,
            coordinates: d.coordinates,
            story: d.story,
            events: d.events,
            galleryImages: d.galleryImages,
            template: d.template,
            muhurtham: d.muhurtham,
            deity: d.deity,
            family: d.family,
            eventName: d.eventName,
            enable3D: d.enable3D,
            enableEnvelope: d.enableEnvelope
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

  // ── Sync template defaults ──────────────────────────────────────────────────
  useEffect(() => {
    if (isFetchingInvite) return;

    const oldTemplate = prevTemplateRef.current;
    const newTemplate = formData.template;

    // Only proceed if template actually changed
    if (oldTemplate && newTemplate && oldTemplate !== newTemplate) {
      setFormData((prev) => {
        if (!prev) return prev;

        // 1. Capture current data into a draft for the old template
        // [IMPORTANT] We MUST ensure the draft we are saving is associated with the TEMPLATE ID that was JUST active
        const currentDataAsDraft = {
          ...getCurrentDataAsDraft(prev),
          template: oldTemplate as TemplateType
        };

        const updatedDrafts = {
          ...(prev.templateDrafts || {}),
          [oldTemplate]: currentDataAsDraft,
        };

        // 2. Check if we have a draft for the new template
        const existingDraft = updatedDrafts[newTemplate];

        if (existingDraft) {
          // Restore from draft - EXPLICITLY set all fields from the draft
          // to overwrite any "contaminated" root fields from the old template
          return {
            ...prev,
            ...existingDraft,
            templateDrafts: updatedDrafts,
            // Ensure the main template field is also correct
            template: newTemplate as TemplateType
          };
        } else {
          // No draft exists? Use defaults for new template, but keep names/date/location
          const defaultEventNames = TEMPLATE_DEFAULTS[newTemplate] || ["Wedding"];
          
          // Create a "clean" new template state
          const newTemplateState: TemplateDraft = {
            template: newTemplate as TemplateType,
            brideName: prev.brideName || "",
            groomName: prev.groomName || "",
            weddingDate: prev.weddingDate || "",
            location: prev.location || "",
            galleryImages: GALLERY_DEFAULTS[newTemplate] || GALLERY_DEFAULTS["default"],
            events: defaultEventNames.map((name) => ({
              name,
              date: prev.weddingDate || "TBD",
              time: "TBD",
              location: prev.location || "TBD",
            })),
            // Reset other design fields to defaults for the new template
            coverImage: undefined,
            coverImageKey: undefined,
            galleryImageKeys: [],
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
            coordinates: "",
          };

          return {
            ...prev,
            ...newTemplateState,
            templateDrafts: updatedDrafts,
            template: newTemplate as TemplateType
          };
        }
      });
    }
    prevTemplateRef.current = formData.template;
  }, [formData.template, isFetchingInvite]);

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
      events: [...(prev.events || []), { name: "New Event", date: "", time: "", location: "" }],
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
        // Revoke old blob URL if existing
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
            image: data
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

    // Helper to add upload task
    const addTask = (file: File, previewUrl: string) => {
      collectTasks.push(async () => {
        const res = await uploadImage(file);
        uploadMap.set(previewUrl, res);
      });
    };

    if (typeof updatedData.coverImage === 'object' && updatedData.coverImage?.file) {
      addTask(updatedData.coverImage.file, updatedData.coverImage.url);
    }
    
    // Support coupleImage found in some older templates or user requests
    if (typeof (updatedData as any).coupleImage === 'object' && (updatedData as any).coupleImage?.file) {
      addTask((updatedData as any).coupleImage.file, (updatedData as any).coupleImage.url);
    }
    
    // Generic image field support
    if (typeof (updatedData as any).image === 'object' && (updatedData as any).image?.file) {
      addTask((updatedData as any).image.file, (updatedData as any).image.url);
    }

    updatedData.galleryImages?.forEach((img) => {
      if (typeof img === 'object' && img.file) {
        addTask(img.file, img.url);
      }
    });

    updatedData.events?.forEach((ev) => {
      if (typeof ev.image === 'object' && ev.image.file) {
        addTask(ev.image.file, ev.image.url);
      } else if (typeof (ev as any).img === 'object' && (ev as any).img.file) {
        // Some templates use .img instead of .image
        addTask((ev as any).img.file, (ev as any).img.url);
      }
    });

    if (collectTasks.length === 0) return updatedData;

    const toastId = toast.loading("Uploading images to secure storage...");
    try {
      // Execute in sequence or small batches to avoid overwhelming the server
      for (const task of collectTasks) {
        await task();
      }
      
      // Map back uploaded URLs
      if (typeof updatedData.coverImage === 'object' && updatedData.coverImage?.file) {
        const result = uploadMap.get(updatedData.coverImage.url);
        if (result) {
          updatedData.coverImage = { ...updatedData.coverImage, url: result.url, file: undefined };
          updatedData.coverImageKey = result.key;
        }
      }
      
      if (typeof (updatedData as any).coupleImage === 'object' && (updatedData as any).coupleImage?.file) {
        const result = uploadMap.get((updatedData as any).coupleImage.url);
        if (result) {
          (updatedData as any).coupleImage = { ...(updatedData as any).coupleImage, url: result.url, file: undefined };
        }
      }

      if (typeof (updatedData as any).image === 'object' && (updatedData as any).image?.file) {
        const result = uploadMap.get((updatedData as any).image.url);
        if (result) {
          (updatedData as any).image = { ...(updatedData as any).image, url: result.url, file: undefined };
        }
      }

      if (updatedData.galleryImages) {
        updatedData.galleryImages = updatedData.galleryImages.map(img => {
          if (typeof img === 'object' && img.file) {
            const result = uploadMap.get(img.url);
            if (result) return { ...img, url: result.url, file: undefined };
          }
          return img;
        });
      }

      if (updatedData.events) {
        updatedData.events = updatedData.events.map(ev => {
          let newEv = { ...ev };
          if (typeof ev.image === 'object' && ev.image.file) {
            const result = uploadMap.get(ev.image.url);
            if (result) newEv.image = { ...ev.image, url: result.url, file: undefined };
          }
          if (typeof (ev as any).img === 'object' && (ev as any).img.file) {
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
        // Default gallery aspects based on template
        if (formData.template === "royal-wedding") finalAspect = 1;
        else if (formData.template === "kerala-envelope-reveal") finalAspect = 3 / 4;
        else finalAspect = 4 / 5; // royal-wedding, konaseema, kerala, housewarming
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

  const uploadImage = async (file: File) => {
    // FIX: use currentUser from state, not auth.currentUser directly.
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
        // If not JSON, use a snippet of the text if it looks like an error message
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

  // ─── CORE FIX: handleSave ────────────────────────────────────────────────────
  const handleSaveDraft = async () => {
    if (!currentUser) {
      toast.error("Please log in first to save a draft.");
      navigate("/login");
      return;
    }

    setIsSavingDraft(true);

    try {
      const token = await currentUser.getIdToken();
      
      // Check if user is paid to decide whether to upload images
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
          isPaid = userData.paid === true || 
            (userData.paidTemplates && (
              userData.paidTemplates[currentTemplate] === true ||
              userData.paidTemplates[normalizedTemplate] === true
            ));
        }
      } catch (e) {
        console.error("Failed to check payment status for draft save, assuming unpaid", e);
      }

      let finalizedData = { ...formData };
      
      // Update template drafts before saving
      finalizedData.templateDrafts = {
        ...(formData.templateDrafts || {}),
        [formData.template || "royal-wedding"]: getCurrentDataAsDraft()
      };
      
      // For drafts, we generally don't perform production R2 uploads 
      // unless it's already published and we are just sync'ing.
      // But per requirements, R2 upload ONLY happens after payment.
      const shouldPerformProductionDeploy = false; 

      if (shouldPerformProductionDeploy) {
        finalizedData = await uploadPendingImages(formData);
      }

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
        body: JSON.stringify({ id, ...inviteData }),
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

  const handleSave = async (forceSaveAfterPayment = false) => {
    if (!currentUser) {
      toast.error("Please log in first to publish your invitation.");
      navigate("/login");
      return;
    }

    if (isSaving || isCheckingPayment) return;
    if (showPricingModal && !forceSaveAfterPayment) return;

    setIsSaving(true);
    if (!forceSaveAfterPayment) {
      setIsCheckingPayment(true);
    }

    try {
      let token: string;
      try {
        token = await currentUser.getIdToken();
      } catch (tokenErr: any) {
        console.error("Token refresh failed:", tokenErr.message);
        if (tokenErr.code === "auth/network-request-failed") {
          toast.error("Network connection error. Please check your internet and try again.");
        } else {
          toast.error("Session expired. Please log in again.");
          navigate("/login");
        }
        return;
      }

      if (!forceSaveAfterPayment) {
        const checkRes = await fetch("/api/check-user", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!checkRes.ok) {
          const errText = await checkRes.text();
          if (checkRes.status === 401) {
            toast.error("Session expired. Please log in again.");
            navigate("/login");
            return;
          }
          throw new Error(`User status check failed: ${errText.substring(0, 150)}`);
        }

        const userData = await checkRes.json();
        const currentTemplate = (formData.template || "royal-wedding") as string;
        const normalizedTemplate = currentTemplate.toLowerCase().trim();

        const isTemplatePaid = userData.paid === true || 
          (userData.paidTemplates && (
            userData.paidTemplates[currentTemplate] === true ||
            userData.paidTemplates[normalizedTemplate] === true
          ));

        if (!isTemplatePaid) {
          setShowPricingModal(true);
          return;
        }

        // ✅ REDEPLOY LOGIC: If already published and has changes, force redeploy payment
        if (formData.published && hasUnpublishedChanges && !forceSaveAfterPayment) {
          setShowRedeployModal(true);
          return;
        }
      }

      // ── BATCH UPLOAD PENDING IMAGES ──
      // This ensures images are ONLY uploaded when the user is about to publish a paid invite
      const dataWithDrafts = {
        ...formData,
        templateDrafts: {
          ...(formData.templateDrafts || {}),
          [formData.template || "minimal"]: getCurrentDataAsDraft()
        }
      };
      
      const finalizedData = await uploadPendingImages(dataWithDrafts);

      const currentTemplate = finalizedData.template || "royal-wedding";
      const id = isEditMode
        ? inviteId || finalizedData.slug || siteSlug
        : finalizedData.slug || finalizedData.id || Math.random().toString(36).substring(2, 10);

      const draftState = getCurrentDataAsDraft(finalizedData);
      const inviteData: Partial<WeddingInvite> = {
        ...finalizedData,
        draftData: draftState,
        publishedData: JSON.parse(JSON.stringify(draftState)),
        id,
        userId: currentUser.uid,
        userName: currentUser.displayName || "User",
        email: currentUser.email || "",
        slug: id,
        template: currentTemplate,
        brideName: draftState.brideName,
        groomName: draftState.groomName,
        weddingDate: draftState.weddingDate,
        location: draftState.location,
        published: true,
        isPaid: true,
        hasUnpublishedChanges: false,
        lastPublishedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const saveRes = await fetch("/api/save-invite", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, template: currentTemplate, ...inviteData }),
      });

      if (!saveRes.ok) {
        const errText = await saveRes.text();
        let errorMessage = "Failed to publish invitation";
        try {
          const errorData = JSON.parse(errText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = errText || errorMessage;
        }
        
        if (errorMessage === "paymentRequired" || saveRes.status === 402) {
          setShowPricingModal(true);
          return;
        }
        
        throw new Error(errorMessage);
      }

      setPublishedInviteId(id);
      setSaveSuccess(true);
      setHasUnpublishedChanges(false);
      setFormData(prev => ({ ...prev, ...inviteData }));
      // Update the reference data to prevent immediate re-triggering of change detection
      loadedDataRef.current = JSON.stringify({
        brideName: inviteData.brideName,
        groomName: inviteData.groomName,
        weddingDate: inviteData.weddingDate,
        location: inviteData.location,
        venueAddress: inviteData.venueAddress,
        venueCity: inviteData.venueCity,
        googleMapsLink: inviteData.googleMapsLink,
        coordinates: inviteData.coordinates,
        story: inviteData.story,
        events: inviteData.events,
        galleryImages: inviteData.galleryImages,
        template: inviteData.template,
        muhurtham: inviteData.muhurtham,
        deity: inviteData.deity,
        family: inviteData.family,
        eventName: inviteData.eventName,
        enable3D: inviteData.enable3D,
        enableEnvelope: inviteData.enableEnvelope
      });
      
      if (forceSaveAfterPayment) {
        setShowFinalSuccessModal(true);
      } else {
        toast.success("🎉 Your Story is Live!");
        setTimeout(() => {
          window.location.href = `/invite/${id}`;
        }, 1500);
      }
    } catch (error: any) {
      if (error.message !== "paymentRequired") {
        console.error("Publish error:", error);
        toast.error(error.message || "An error occurred during publish.");
      } else {
        setShowPricingModal(true);
      }
    } finally {
      setIsSaving(false);
      setIsCheckingPayment(false);
    }
  };

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePaymentAndPublish = async () => {
    if (!currentUser || isProcessingPayment) return;
    setIsProcessingPayment(true);
  
    const currentTemplate = formData.template || "royal-wedding";
    const templatePrice = templatePrices[currentTemplate] || 999;
    const templatePricePaise = templatePrice * 100;

    try {
      // 1. Get Config (Key ID)
      const configRes = await fetch("/api/config");
      const configData = await configRes.json();
      const razorpayKeyId = configData.razorpayKeyId;

      if (!razorpayKeyId) {
        throw new Error("Razorpay key not found in configuration");
      }

      const token = await currentUser.getIdToken();
      
      // 2. Create Order
      const orderRes = await fetch("/api/create-order", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ templateId: currentTemplate })
      });
      const orderData = await orderRes.json();

      if (!orderData.success) {
        throw new Error(orderData.error || "Order creation failed");
      }

      const order = orderData.order;

      const options = {
        key: razorpayKeyId,
        amount: templatePricePaise,
        currency: "INR",
        name: "Wedding Invitation",
        description: "Publish Your Invitation",
        order_id: order.id,
        handler: async function(response: any) {
          try {
      // 3. Verify payment
            const verifyRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { 
                "Authorization": `Bearer ${token}`, 
                "Content-Type": "application/json" 
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                userId: currentUser.uid,
                email: currentUser.email,
                templateId: currentTemplate,
              })
            });
            const verifyData = await verifyRes.json();
            
            if (verifyData.success) {
              toast.success("Payment verified! Finalizing...");
              setShowPricingModal(false);
              // Small delay to allow Firestore consistency
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
        theme: { color: "#000000" }
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
          Authorization: `Bearer ${token}`
        }
      });
      const orderData = await orderRes.json();

      if (!orderData.success) throw new Error(orderData.error || "Order failed");

      const options = {
        key: razorpayKeyId,
        amount: orderData.amount,
        currency: "INR",
        name: "Wedding Invitation",
        description: "Redeploy Your Invitation",
        order_id: orderData.order.id,
        handler: async function(response: any) {
          try {
            const verifyRes = await fetch("/api/verify-redeploy-payment", {
              method: "POST",
              headers: { 
                "Authorization": `Bearer ${token}`, 
                "Content-Type": "application/json" 
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                inviteId: formData.id || inviteId,
              })
            });
            const verifyData = await verifyRes.json();
            
            if (verifyData.success) {
              toast.success("Payment verified! Redeploying...");
              setShowRedeployModal(false);
              setHasUnpublishedChanges(false);
              // Save the actual changes now
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
        theme: { color: "#000000" }
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
        isPreviewMode ? "grid-cols-1" : "grid-cols-[300px_1fr]"
      }`}
    >
      {/* ── Sidebar Editor ── */}
      <AnimatePresence>
        {!isPreviewMode && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "300px", opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="bg-white border-r border-editorial-border flex flex-col overflow-y-auto shrink-0 z-20"
          >
            {/* Header */}
            <div className="p-6 border-b border-editorial-border bg-editorial-bg/30">
              <button
                onClick={() => navigate("/templates")}
                className="flex items-center gap-2 text-[10px] font-bold text-editorial-muted hover:text-editorial-ink transition-colors mb-4 uppercase tracking-[0.2em]"
              >
                <ChevronLeft className="w-3 h-3" />
                Back to Gallery
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg border border-editorial-border shadow-sm">
                  <Sparkles className="w-5 h-5 text-editorial-accent" />
                </div>
                <div>
                  <h1 className="text-xl font-serif italic">Wedding Invitation Studio</h1>
                  <p className="text-[9px] uppercase font-bold tracking-widest text-editorial-muted">
                    Editing: {templateConfig?.name}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 flex flex-col gap-10 flex-1">
              {/* Couple Details */}
              <div>
                <h2 className="editorial-section-title text-[11px] mb-4">
                  {isHousewarming ? "Hosts" : "Identity"}
                </h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="editorial-label text-[10px]">
                      {isHousewarming ? "Primary Host" : "Bride"}
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-editorial-muted" />
                      <input
                        name="brideName"
                        value={formData.brideName || ""}
                        onChange={handleChange}
                        className="editorial-input pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="editorial-label text-[10px]">
                      {isHousewarming ? "Family/Co-Host" : "Groom"}
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-editorial-muted" />
                      <input
                        name="groomName"
                        value={formData.groomName || ""}
                        onChange={handleChange}
                        className="editorial-input pl-10"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Housewarming specific */}
              {isHousewarming && (
                <div className="space-y-4">
                  <h2 className="editorial-section-title text-[11px]">Housewarming Details</h2>
                  <div className="space-y-2">
                    <label className="editorial-label text-[10px]">Deity Name</label>
                    <input
                      type="text"
                      value={formData.deity || ""}
                      onChange={(e) => setFormData({ ...formData, deity: e.target.value })}
                      className="editorial-input font-mono"
                      placeholder="e.g. Lord Venkateswara"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="editorial-label text-[10px]">Ceremony Name</label>
                    <input
                      type="text"
                      value={formData.eventName || ""}
                      onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                      className="editorial-input"
                      placeholder="e.g. Gruha Pravesh"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="editorial-label text-[10px]">Muhurtham</label>
                    <input
                      type="text"
                      value={formData.muhurtham || ""}
                      onChange={(e) => setFormData({ ...formData, muhurtham: e.target.value })}
                      className="editorial-input"
                      placeholder="e.g. 2:43 AM"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="editorial-label text-[10px]">Family Name</label>
                    <input
                      type="text"
                      value={formData.family || ""}
                      onChange={(e) => setFormData({ ...formData, family: e.target.value })}
                      className="editorial-input"
                      placeholder="e.g. Chodapaneedi Family"
                    />
                  </div>
                </div>
              )}

              {/* Events */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="editorial-section-title text-[11px]">
                    {isHousewarming ? "Pooja Details" : "Itinerary"}
                  </h2>
                  <button
                    onClick={addEvent}
                    className="p-1 px-2 text-[9px] font-bold uppercase tracking-widest text-editorial-accent hover:bg-editorial-bg rounded border border-editorial-border flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Add
                  </button>
                </div>
                <div className="space-y-4">
                  {formData.events?.map((ev, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-editorial-bg border border-editorial-border rounded-xl relative group"
                    >
                      <button
                        onClick={() => removeEvent(idx)}
                        className="absolute top-2 right-2 p-1 text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      <input
                        value={ev.name || ""}
                        onChange={(e) => handleEventChange(idx, "name", e.target.value)}
                        className="bg-transparent border-none p-0 text-xs font-bold text-editorial-ink w-full focus:ring-0 mb-3"
                        placeholder="Event Name"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <div className="relative">
                          <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-editorial-muted" />
                          <input
                            value={ev.date || ""}
                            onChange={(e) => handleEventChange(idx, "date", e.target.value)}
                            className="editorial-input text-[10px] pl-6 py-1.5 h-auto"
                            placeholder="Date"
                          />
                        </div>
                        <div className="relative">
                          <Clock className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-editorial-muted" />
                          <input
                            value={ev.time || ""}
                            onChange={(e) => handleEventChange(idx, "time", e.target.value)}
                            className="editorial-input text-[10px] pl-6 py-1.5 h-auto"
                            placeholder="Time"
                          />
                        </div>
                      </div>
                      <div className="mt-2 relative">
                        <MapPin className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-editorial-muted" />
                        <input
                          value={ev.location || ""}
                          onChange={(e) => handleEventChange(idx, "location", e.target.value)}
                          className="editorial-input text-[10px] pl-6 py-1.5 h-auto"
                          placeholder="Location"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Venue */}
              <div>
                <h2 className="editorial-section-title text-[11px] mb-4">Venue & Location</h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="editorial-label text-[10px]">Venue Name</label>
                    <input
                      name="location"
                      value={formData.location || ""}
                      onChange={handleChange}
                      className="editorial-input"
                      placeholder="e.g. The Grand Palace Gardens"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <label className="editorial-label text-[10px]">City</label>
                      <input
                        name="venueCity"
                        value={formData.venueCity || ""}
                        onChange={handleChange}
                        className="editorial-input text-[10px]"
                        placeholder="e.g. Hyderabad"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="editorial-label text-[10px]">Address</label>
                      <input
                        name="venueAddress"
                        value={formData.venueAddress || ""}
                        onChange={handleChange}
                        className="editorial-input text-[10px]"
                        placeholder="Detailed address..."
                      />
                    </div>
                  </div>
                  <div className="space-y-4 pt-1 border-t border-editorial-border">
                    <div className="space-y-2">
                      <label className="editorial-label text-[10px]">Google Maps Link</label>
                      <input
                        name="googleMapsLink"
                        value={formData.googleMapsLink || ""}
                        onChange={handleChange}
                        className="editorial-input text-[10px]"
                        placeholder="Paste Google Maps link"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="editorial-label text-[10px]">Coordinates (lat,lng)</label>
                      <input
                        name="coordinates"
                        value={formData.coordinates || ""}
                        onChange={handleChange}
                        className="editorial-input text-[10px]"
                        placeholder="e.g. 16.6785, 81.9159"
                      />
                    </div>
                    <p className="text-[9px] text-editorial-accent font-medium leading-tight">
                      Paste Google Maps link OR coordinates for best preview.
                    </p>
                  </div>
                </div>
              </div>

              {/* Story */}
              <div>
                <h2 className="editorial-section-title text-[11px] mb-4">Our Story</h2>
                <div className="space-y-2">
                  <textarea
                    name="story"
                    value={formData.story || ""}
                    onChange={handleChange}
                    className="editorial-input min-h-[100px] text-xs"
                    placeholder="Tell your guests about your journey..."
                  />
                </div>
              </div>

              {/* Visual Effects */}
              <div>
                <h2 className="editorial-section-title text-[11px] mb-4">Style & Template</h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="editorial-label text-[10px]">Active Template</label>
                    <select
                      value={formData.template}
                      onChange={(e) => setFormData(prev => ({ ...prev, template: e.target.value as TemplateType }))}
                      className="editorial-input text-xs appearance-none bg-white font-medium"
                    >
                      <option value="royal-wedding">Indian Royal Wedding</option>
                      <option value="konaseema">Konaseema Heritage</option>
                      <option value="kerala-wedding">Kerala Wedding</option>
                      <option value="kerala-envelope-reveal">Kerala Envelope Reveal</option>
                      <option value="housewarming-south">South Indian Housewarming</option>
                    </select>
                    <p className="text-[9px] text-editorial-muted italic">
                      Switching templates preserves your text but changes the layout and design assets.
                    </p>
                  </div>

                  <label className="flex items-center justify-between p-3 bg-editorial-bg border border-editorial-border rounded-xl cursor-pointer">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-editorial-ink">
                      Enable 3D Effects
                    </span>
                    <input
                      type="checkbox"
                      checked={!!formData.enable3D}
                      onChange={(e) => setFormData((prev) => ({ ...prev, enable3D: e.target.checked }))}
                      className="w-4 h-4 rounded text-editorial-accent focus:ring-editorial-accent cursor-pointer"
                    />
                  </label>
                </div>
                {(templateConfig?.id === "kerala-envelope-reveal" ||
                  templateConfig?.id === "housewarming-simple" ||
                  formData.template === "housewarming-south") && (
                  <label className="flex items-center justify-between p-3 bg-editorial-bg border border-editorial-border rounded-xl cursor-pointer mt-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-editorial-ink">
                      Enable Envelope Animation
                    </span>
                    <input
                      type="checkbox"
                      checked={!!formData.enableEnvelope}
                      onChange={(e) => setFormData((prev) => ({ ...prev, enableEnvelope: e.target.checked }))}
                      className="w-4 h-4 rounded text-editorial-accent focus:ring-editorial-accent cursor-pointer"
                    />
                  </label>
                )}
              </div>

              {/* Imagery Assets */}
              <div className="space-y-8">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="editorial-section-title text-[11px]">Primary Imagery</h2>
                    <span className="text-[10px] font-bold text-editorial-accent/60 uppercase tracking-widest bg-editorial-accent/5 px-2 py-0.5 rounded">
                      Hero Section
                    </span>
                  </div>
                  <div className="space-y-4">
                    <div className="relative group">
                      <ImageItem
                        image={formData.coverImage}
                        className="w-full aspect-[16/9] rounded-2xl border border-editorial-border shadow-sm bg-editorial-bg"
                        onClick={() => openImageEditor("cover", formData.coverImage || null, undefined, 16 / 9)}
                      />
                      <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <div className="p-2 bg-white/90 backdrop-blur-md rounded-full shadow-lg border border-white">
                            <Edit2 className="w-3.5 h-3.5 text-editorial-accent" />
                         </div>
                      </div>
                    </div>
                    <p className="text-[9px] text-slate-400 font-medium leading-relaxed italic">
                      Tip: Tap the image to reposition, crop or zoom for the perfect hero layout.
                    </p>
                  </div>
                </div>

                {/* Gallery */}
                <div className="pt-8 border-t border-editorial-border/60">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="editorial-section-title text-[11px] mb-1">Photo Gallery</h2>
                      <p className="text-[9px] text-slate-400 font-medium tracking-tight">Showcase your journey</p>
                    </div>
                    <button
                      onClick={() => {
                        const newGallery = [...(formData.galleryImages || [])];
                        newGallery.push(""); // Add empty placeholder
                        const newIdx = newGallery.length - 1;
                        setFormData({ ...formData, galleryImages: newGallery });
                        openImageEditor("gallery", null, newIdx, 1);
                      }}
                      className="p-2 bg-editorial-bg border border-editorial-border rounded-full text-editorial-accent hover:bg-slate-50 transition-all shadow-sm"
                      title="Add Image"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    {formData.galleryImages?.map((img, idx) => (
                      <div key={idx} className="relative aspect-square group">
                        <ImageItem
                          image={img}
                          className="w-full h-full rounded-xl border border-editorial-border bg-editorial-bg"
                          onClick={() => openImageEditor("gallery", img, idx, 1)}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeGalleryImage(idx);
                          }}
                          className="absolute -top-1.5 -right-1.5 bg-white shadow-xl border border-red-50 p-1.5 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-all z-10 hover:scale-110"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    
                    {(!formData.galleryImages || formData.galleryImages.length === 0) && (
                      <button 
                        onClick={() => {
                          const newGallery = [""];
                          setFormData({ ...formData, galleryImages: newGallery });
                          openImageEditor("gallery", null, 0, 1);
                        }}
                        className="col-span-3 border-2 border-dashed border-editorial-border rounded-2xl p-8 flex flex-col items-center justify-center gap-3 text-slate-300 hover:text-editorial-accent hover:border-editorial-accent transition-all bg-editorial-bg/30"
                      >
                         <Images className="w-6 h-6" />
                         <span className="text-[10px] font-bold uppercase tracking-widest">Start your gallery</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* Sidebar Publish Button */}
            <div className="p-6 border-t border-editorial-border bg-white mt-auto">
              {!formData.published ? (
                <button
                  onClick={() => handleSave()}
                  disabled={isSaving || isCheckingPayment}
                  className="w-full editorial-button bg-editorial-ink text-white py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-black transition-all disabled:opacity-60 shadow-xl"
                >
                  {isSaving || isCheckingPayment ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Rocket className="w-4 h-4" />
                  )}
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em]">
                    {isCheckingPayment ? "Checking..." : isSaving ? "Publishing..." : "🚀 Publish Story"}
                  </span>
                </button>
              ) : hasUnpublishedChanges ? (
                <motion.button
                  initial={{ scale: 1 }}
                  animate={{ scale: [1, 1.01, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  onClick={() => setShowRedeployModal(true)}
                  disabled={isSaving || isCheckingPayment}
                  className="w-full editorial-button bg-editorial-accent text-white py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-[#B37E4A] transition-all disabled:opacity-60 shadow-xl relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/5 animate-pulse" />
                  {isSaving || isCheckingPayment ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCcw className="w-4 h-4" />
                  )}
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em]">Redeploy Changes</span>
                </motion.button>
              ) : (
                <div className="w-full py-4 rounded-xl flex items-center justify-center gap-2 bg-green-50 text-green-700 border border-green-100 shadow-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em]">Website is Live</span>
                </div>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── Main Workspace ── */}
      <main className="flex-1 flex flex-col bg-[#F9F9F9] relative overflow-hidden">
        <header className="h-14 bg-white border-b border-editorial-border z-10 shrink-0">
          <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between w-full">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-editorial-bg rounded-lg border border-editorial-border">
                <Globe className="w-3.5 h-3.5 text-editorial-muted" />
                <span className="text-[10px] font-mono text-editorial-ink opacity-70">
                  /story/{siteSlug}
                </span>
              </div>

              <div className="h-4 w-px bg-editorial-border hidden md:block" />

              <div className="flex items-center bg-editorial-bg p-1 rounded-lg border border-editorial-border">
                {(["desktop", "tablet", "mobile"] as const).map((d) => {
                  const Icon = d === "desktop" ? Monitor : d === "tablet" ? Tablet : Smartphone;
                  return (
                    <button
                      key={d}
                      onClick={() => setViewDevice(d)}
                      className={`p-1.5 rounded-md transition-all ${
                        viewDevice === d
                          ? "bg-white shadow-sm text-editorial-accent"
                          : "text-editorial-muted hover:text-editorial-ink"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-3 ml-auto">
              <button
                onClick={openNewTab}
                className="p-2 text-editorial-muted hover:text-editorial-ink hover:bg-editorial-bg rounded-lg transition-all"
                title="Open Live Preview"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsPreviewMode(!isPreviewMode)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                  isPreviewMode
                    ? "bg-editorial-ink text-white"
                    : "bg-white border border-editorial-border text-editorial-ink hover:bg-editorial-bg"
                }`}
              >
                {isPreviewMode ? (
                  <Minimize2 className="w-3.5 h-3.5" />
                ) : (
                  <Maximize2 className="w-3.5 h-3.5" />
                )}
                <span>{isPreviewMode ? "Exit Preview" : "Preview Mode"}</span>
              </button>

              <div className="h-4 w-px bg-editorial-border mx-2" />
              
              <button
                onClick={handleSaveDraft}
                disabled={isSavingDraft}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all bg-white border border-editorial-border text-editorial-ink hover:bg-editorial-bg disabled:opacity-60"
              >
                {isSavingDraft ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>{isSavingDraft ? "Saving..." : "Save Draft"}</span>
              </button>

              <div className="relative group">
                {!formData.published ? (
                  <button
                    onClick={() => handleSave()}
                    disabled={isSaving || isCheckingPayment}
                    className="editorial-button bg-editorial-ink hover:bg-black text-white px-6 py-2.5 flex items-center justify-center gap-2.5 disabled:opacity-60 shadow-[0_0_20px_rgba(0,0,0,0.1)] hover:shadow-[0_0_25px_rgba(200,169,107,0.3)] transition-all group"
                  >
                    {isSaving || isCheckingPayment ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Rocket className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    )}
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
                      {isCheckingPayment ? "Checking..." : isSaving ? "Publishing..." : "🚀 Publish Story"}
                    </span>
                  </button>
                ) : hasUnpublishedChanges ? (
                  <div className="relative">
                    <motion.button
                      initial={{ scale: 1 }}
                      animate={{ scale: [1, 1.02, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      onClick={() => setShowRedeployModal(true)}
                      disabled={isSaving || isCheckingPayment}
                      className="editorial-button bg-editorial-ink text-white px-6 py-2.5 flex items-center justify-center gap-2.5 disabled:opacity-60 shadow-[0_0_20px_rgba(200,169,107,0.3)] hover:shadow-[0_0_30px_rgba(200,169,107,0.5)] transition-all relative overflow-hidden group border border-editorial-accent/30"
                    >
                      <div className="absolute inset-0 bg-editorial-accent/20 animate-pulse" />
                      {isSaving || isCheckingPayment ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-700" />
                      )}
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] relative z-10">Redeploy Story</span>
                    </motion.button>
                    <div className="absolute -top-3 -right-2 px-2 py-0.5 bg-editorial-accent text-white text-[8px] font-bold uppercase tracking-tighter rounded-full border-2 border-white shadow-xl pointer-events-none whitespace-nowrap z-20">
                      Changes Pending
                    </div>
                  </div>
                ) : (
                  <button
                    disabled
                    className="flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] bg-green-50 text-green-700 border border-green-100 shadow-sm transition-all grayscale-[0.2]"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>✓ Live</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Live Preview */}
        <div className="flex-1 overflow-auto scrollbar-hide relative px-4 mt-6 flex justify-center items-start bg-neutral-50/50">
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
                  brideName={formData.brideName || ""}
                  groomName={formData.groomName || ""}
                  date={formData.weddingDate || ""}
                  venue={formData.location || ""}
                  venueAddress={formData.venueAddress}
                  venueCity={formData.venueCity}
                  googleMapsEmbedUrl={formData.googleMapsLink}
                  googleMapsLink={formData.googleMapsLink}
                  coordinates={formData.coordinates}
                  story={formData.story}
                  enable3D={formData.enable3D}
                  enableEnvelope={formData.enableEnvelope}
                  coverImage={formData.coverImage}
                  events={formData.events || []}
                  galleryImages={formData.galleryImages || []}
                  deity={formData.deity}
                  eventName={formData.eventName}
                  muhurtham={formData.muhurtham}
                  family={formData.family}
                  hosts={{
                    primary: formData.brideName || "",
                    secondary: formData.groomName || "",
                  }}
                  address={formData.venueAddress || formData.location}
                  image={formData.coverImage}
                  isEditable={true}
                  onImageEdit={(target: string, index?: number) => {
                    if (target === "cover") {
                      openImageEditor("cover", formData.coverImage || null);
                    } else if (target === "gallery" && typeof index === "number") {
                      openImageEditor("gallery", formData.galleryImages?.[index] || null, index);
                    } else if (target === "event" && typeof index === "number") {
                      openImageEditor("event", formData.events?.[index]?.image || null, index);
                    }
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-editorial-muted font-serif italic">
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
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl relative overflow-hidden p-8"
            >
              <button 
                onClick={() => setShowPricingModal(false)}
                disabled={isProcessingPayment}
                className="absolute top-6 right-6 p-2 hover:bg-neutral-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-editorial-muted" />
              </button>

              <div className="text-center mb-10">
                <div className="w-16 h-16 bg-editorial-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Rocket className="w-8 h-8 text-editorial-accent" />
                </div>
                <h2 className="text-3xl font-serif italic mb-2">Publish Your Story</h2>
                <p className="text-xs uppercase tracking-widest text-editorial-muted">
                  {templateConfig?.name} Template
                </p>
                <div className="flex items-center justify-center gap-2 mt-4">
                  <span className="text-4xl font-serif font-bold text-editorial-ink">₹{templatePrices[formData.template || "royal-wedding"] || 999}</span>
                  <span className="text-xs uppercase tracking-widest font-bold text-editorial-muted">One-time</span>
                </div>
              </div>

              <div className="space-y-4 mb-10">
                {[
                  `Up to ${calculateFreeViews(templatePrices[formData.template || "royal-wedding"] || 999)} views included`,
                  "Beautiful live website",
                  "Shareable link",
                  "WhatsApp sharing",
                  "Pay once, valid forever",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 text-xs font-medium text-editorial-secondary">
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <button
                  onClick={handlePaymentAndPublish}
                  disabled={isProcessingPayment}
                  className="w-full bg-editorial-ink text-white py-4 rounded-2xl text-[11px] font-bold uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all flex items-center justify-center gap-2"
                >
                  {isProcessingPayment ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  {isProcessingPayment ? "Processing..." : `Pay ₹${templatePrices[formData.template || "royal-wedding"] || 999} & Publish`}
                </button>
                <p className="text-[9px] text-center text-editorial-muted font-medium uppercase tracking-widest bg-editorial-bg py-2 rounded-lg border border-editorial-border/40">
                  AFTER {calculateFreeViews(templatePrices[formData.template || "royal-wedding"] || 999)} VIEWS, TOP UP <span className="text-editorial-ink font-bold">₹99</span> TO GET <span className="text-editorial-ink font-bold">1000 MORE VIEWS</span>
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
                    Redeploy Fee<br />ONE-TIME
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
                  <span className="relative z-10">
                    {isProcessingPayment ? "Processing..." : `PAY ₹99 & REDEPLOY`}
                  </span>
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
                  <label className="text-[10px] font-bold uppercase tracking-widest text-editorial-muted mb-3 block">Live Link</label>
                  <div className="flex items-center gap-2 p-5 bg-editorial-bg border border-editorial-border rounded-2xl">
                    <span className="text-xs font-mono text-editorial-ink truncate flex-1 font-medium">
                      {window.location.origin}/story/{publishedInviteId}
                    </span>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/story/${publishedInviteId}`);
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
                    onClick={() => window.open(`/story/${publishedInviteId}`, '_blank')}
                    className="flex items-center justify-center gap-3 py-4 bg-editorial-ink text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all shadow-lg"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Visit Live Story
                  </button>
                  <button 
                    onClick={() => {
                      const text = `Join us for our special day! ❤️ View our cinematic story here: ${window.location.origin}/story/${publishedInviteId}`;
                      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
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
                      {window.location.origin}/story/{siteSlug}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/story/${siteSlug}`);
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
                    onClick={() => window.open(`/story/${siteSlug}`, "_blank")}
                    className="flex items-center justify-center gap-2 py-3 border border-editorial-border rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-editorial-bg transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Visit Live Story
                  </button>
                  <button
                    onClick={() => {
                      const text = `Join us for our ${isHousewarming ? "Housewarming" : "Wedding"}! ❤️ View our cinematic story here: ${window.location.origin}/story/${siteSlug}`;
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