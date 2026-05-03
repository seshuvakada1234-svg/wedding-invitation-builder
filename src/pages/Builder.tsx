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
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { WeddingInvite, TemplateType, WeddingEvent } from "../types";
import { auth, authFetch, handleFirestoreError, loginAnonymously } from "../lib/firebase";
import { getTemplateById } from "../templates";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import toast from "react-hot-toast";

// ─── Constants ────────────────────────────────────────────────────────────────

const TEMPLATE_DEFAULTS: Record<string, string[]> = {
  "royal-wedding": ["Haldi", "Mehendi", "Sangeet", "Wedding"],
  konaseema: ["Pellikuthuru", "Haldi", "Mehendi", "Wedding"],
  "kerala-wedding": ["Madhuramveypu", "Nischaayam", "Wedding", "Reception"],
  "kerala-envelope-reveal": ["Pellikuthuru", "Haldi", "Mehendi", "Wedding"],
  "housewarming-south": ["Gruha Pravesh", "Satyanarayana Vratham"],
  minimal: ["Wedding Ceremony", "Reception"],
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

  const initialTemplate = (templateId || searchParams.get("template") || "minimal") as TemplateType;
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

  useEffect(() => {
    // onAuthStateChanged fires once immediately with the persisted user (or null).
    // Only after this callback runs do we know if a user is signed in.
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
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
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showFinalSuccessModal, setShowFinalSuccessModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [publishedInviteId, setPublishedInviteId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [viewDevice, setViewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");

  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // ── Load existing invite ────────────────────────────────────────────────────
  useEffect(() => {
    async function loadInvite() {
      // FIX: wait for currentUser (not just authLoading) before fetching.
      if (!inviteId || !currentUser) return;

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
          setFormData(data);
          setIsEditMode(true);
        } else {
          toast.error("Invitation not found.");
          navigate("/dashboard");
        }
      } catch (err) {
        console.error("Error loading invite:", err);
        toast.error("Failed to load invitation.");
      }
    }

    if (!authLoading && inviteId) {
      loadInvite();
    }
  }, [inviteId, authLoading, currentUser, navigate]);

  // ── Sync template defaults ──────────────────────────────────────────────────
  useEffect(() => {
    if (currentTemplateId !== formData.template) {
      const defaultEventNames = TEMPLATE_DEFAULTS[currentTemplateId] || ["Wedding"];
      setFormData((prev) => ({
        ...prev,
        template: currentTemplateId,
        events: defaultEventNames.map((name) => ({
          name,
          date: prev.weddingDate || "TBD",
          time: "TBD",
          location: prev.location || "TBD",
        })),
      }));
    }
  }, [currentTemplateId]);

  // ── Loading screen ──────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-editorial-bg">
        <Loader2 className="w-12 h-12 text-editorial-accent animate-spin" />
      </div>
    );
  }

  // ─── Derived values ─────────────────────────────────────────────────────────
  const isHousewarming = formData.template === "housewarming-south";

  const siteSlug =
    (`${formData.groomName?.toLowerCase() || "groom"}-${formData.brideName?.toLowerCase() || "bride"}`)
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "") || "new-invite";

  // ─── Event handlers ─────────────────────────────────────────────────────────

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
      let errorMessage = "Upload failed";
      try {
        const errorData = JSON.parse(text);
        errorMessage = errorData.error || errorMessage;
      } catch {
        errorMessage = text || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const data = await res.json();
    return { url: data.url, key: data.key };
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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File is too large. Max 5MB allowed.");
      return;
    }

    setPendingFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setUploadSuccess(null);
  };

  const handleImageSave = async () => {
    if (!pendingFile) return;

    setIsUploading(true);
    setUploadSuccess(null);

    try {
      const { url, key } = await uploadImage(pendingFile);

      if (formData.coverImageKey) {
        deleteImage(formData.coverImageKey);
      }

      setFormData((prev) => ({ ...prev, coverImage: url, coverImageKey: key }));
      setUploadSuccess("Image saved successfully!");
      setPendingFile(null);
    } catch (error) {
      toast.error("Upload failed: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsUploading(false);
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
      
      const id = isEditMode
        ? inviteId || formData.slug || siteSlug
        : Math.random().toString(36).substring(2, 10);

      const inviteData: Partial<WeddingInvite> = {
        ...formData,
        id,
        userId: currentUser.uid,
        userName: currentUser.displayName || "User",
        email: currentUser.email || "",
        slug: id,
        published: false,
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
    // FIX 1: use currentUser from state — guaranteed to be set after auth resolves.
    if (!currentUser) {
      toast.error("Please log in first to publish your invitation.");
      navigate("/login");
      return;
    }

    setIsSaving(true);

    try {
      // FIX 2: Get a fresh token explicitly before the first API call.
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

      // Check payment status if not already forced by successful payment callback
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

        // If not paid, show pricing modal instead of redirecting
        if (!userData.paid) {
          setShowPricingModal(true);
          setIsSaving(false);
          return;
        }
      }

      // Build the invite ID
      const id = isEditMode
        ? inviteId || formData.slug || siteSlug
        : Math.random().toString(36).substring(2, 10);

      const inviteData: Partial<WeddingInvite> = {
        ...formData,
        id,
        userId: currentUser.uid,
        userName: currentUser.displayName || "User",
        email: currentUser.email || "",
        slug: id,
        published: true,
        isPaid: true,
        updatedAt: new Date().toISOString(),
      };

      // Save via backend
      const saveRes = await fetch("/api/save-invite", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, ...inviteData }),
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
        throw new Error(errorMessage);
      }

      setPublishedInviteId(id);
      setSaveSuccess(true);
      
      if (forceSaveAfterPayment) {
        setShowFinalSuccessModal(true);
      } else {
        toast.success("🎉 Successfully Published!");
        setTimeout(() => {
          window.location.href = `/invite/${id}`;
        }, 1500);
      }
    } catch (error: any) {
      console.error("Publish error:", error);
      toast.error(error.message || "An error occurred during publish.");
    } finally {
      setIsSaving(false);
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
    if (!currentUser) return;
    setIsProcessingPayment(true);

    try {
      const resScript = await loadRazorpay();
      if (!resScript) {
        toast.error("Razorpay SDK failed to load. Are you online?");
        setIsProcessingPayment(false);
        return;
      }

      const token = await currentUser.getIdToken();
      
      // 1. Create Order
      const orderRes = await fetch("/api/create-order", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
      });
      const orderData = await orderRes.json();

      if (!orderData.success) {
        throw new Error(orderData.error || "Order creation failed");
      }

      // 2. Get Config (Key ID)
      const configRes = await fetch("/api/config");
      const configData = await configRes.json();

      const options = {
        key: configData.razorpayKeyId,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: "Union Digital",
        description: "Wedding Invitation Premium",
        order_id: orderData.order.id,
        handler: async (response: any) => {
          try {
            // 3. Verify Payment
            const verifyRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { 
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                ...response,
                userId: currentUser.uid,
                email: currentUser.email,
              }),
            });
            const verifyData = await verifyRes.json();

            if (verifyData.success) {
              setShowPricingModal(false);
              // 4. Save and show success modal
              await handleSave(true);
            } else {
              toast.error("Payment verification failed.");
            }
          } catch (err) {
            console.error(err);
            toast.error("Payment verification error.");
          } finally {
            setIsProcessingPayment(false);
          }
        },
        prefill: {
          name: currentUser.displayName || "",
          email: currentUser.email || "",
        },
        theme: { color: "#C48B58" },
        modal: {
          ondismiss: () => {
             setIsProcessingPayment(false);
          }
        }
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Payment initiation failed");
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
                  <h1 className="text-xl font-serif italic">Design Suite</h1>
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
                <h2 className="editorial-section-title text-[11px] mb-4">Visual Effects</h2>
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

              {/* Media Assets */}
              <div>
                <h2 className="editorial-section-title text-[11px] mb-4">
                  {isHousewarming ? "Visual Assets" : "Artboard Assets"}
                </h2>

                {(previewUrl || formData.coverImage) && (
                  <div className="mb-4 space-y-3">
                    <div className="aspect-video rounded-xl overflow-hidden border border-editorial-border relative group shadow-sm bg-editorial-bg">
                      <img
                        src={previewUrl || formData.coverImage}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-[9px] text-white font-bold uppercase tracking-widest">
                          {previewUrl ? "New Selection" : "Active Cover"}
                        </p>
                      </div>
                    </div>

                    {pendingFile && (
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={handleImageSave}
                          disabled={isUploading}
                          className={`w-full py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                            isUploading
                              ? "bg-editorial-border text-editorial-ink/50 cursor-not-allowed"
                              : "bg-editorial-accent text-white hover:bg-opacity-90 shadow-md"
                          }`}
                        >
                          {isUploading ? (
                            <span className="flex items-center justify-center gap-2">
                              <Loader2 className="w-3 h-3 animate-spin" /> Saving...
                            </span>
                          ) : (
                            "Save Image to Cloud"
                          )}
                        </button>
                        <p className="text-[9px] text-center text-editorial-ink/60 italic">
                          Click save to store this image in permanent storage
                        </p>
                      </div>
                    )}

                    {uploadSuccess && (
                      <div className="p-2 bg-green-50 border border-green-100 rounded-lg flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        <p className="text-[9px] text-green-700 font-medium uppercase tracking-tight">
                          {uploadSuccess}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <label className="block border-2 border-dashed border-editorial-border rounded-xl p-6 text-center cursor-pointer hover:border-editorial-accent hover:bg-editorial-bg transition-all group">
                    <input
                      type="file"
                      className="hidden"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleImageSelect}
                    />
                    <Upload className="w-5 h-5 text-editorial-accent mx-auto mb-2 group-hover:scale-110 transition-transform" />
                    <div className="text-[10px] font-bold text-editorial-ink uppercase tracking-widest">
                      {previewUrl ? "Change Selection" : isHousewarming ? "Select Main Photo" : "Select Cover Image"}
                    </div>
                    <p className="text-[9px] text-editorial-ink/40 mt-1 uppercase tracking-tighter font-medium">
                      PNG, JPG, WEBP • Max 5MB
                    </p>
                  </label>

                  <label className="block border-2 border-dashed border-editorial-border rounded-xl p-6 text-center cursor-pointer hover:border-editorial-accent hover:bg-editorial-bg transition-all group">
                    <input
                      type="file"
                      className="hidden"
                      accept="image/png,image/jpeg,image/webp"
                      multiple
                      onChange={async (e) => {
                        const files = e.target.files;
                        if (!files) return;
                        setIsUploading(true);
                        setUploadSuccess(null);
                        for (let i = 0; i < files.length; i++) {
                          const file = files[i];
                          if (file.size > 5 * 1024 * 1024) {
                            toast.error(`File ${file.name} is too large. Skipping.`);
                            continue;
                          }
                          try {
                            const { url, key } = await uploadImage(file);
                            setFormData((prev) => ({
                              ...prev,
                              galleryImages: [...(prev.galleryImages || []), url],
                              galleryImageKeys: [...(prev.galleryImageKeys || []), key],
                            }));
                          } catch (err) {
                            console.error(err);
                          }
                        }
                        setIsUploading(false);
                        setUploadSuccess("Gallery updated!");
                      }}
                    />
                    <Images className="w-5 h-5 text-editorial-accent mx-auto mb-2 group-hover:scale-110 transition-transform" />
                    <div className="text-[10px] font-bold text-editorial-ink uppercase tracking-widest">Add to Gallery</div>
                    <p className="text-[9px] text-editorial-ink/40 mt-1 uppercase tracking-tighter font-medium">
                      Auto-upload enabled
                    </p>
                  </label>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {formData.galleryImages?.map((img, i) => (
                    <div
                      key={i}
                      className="aspect-square rounded-lg overflow-hidden border border-editorial-border relative group"
                    >
                      <img src={img} alt="Gallery" className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeGalleryImage(i)}
                        className="absolute inset-0 bg-red-500/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar Publish Button */}
            <div className="p-6 border-t border-editorial-border bg-white mt-auto">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full editorial-button bg-editorial-ink text-white py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-black transition-all disabled:opacity-60"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Rocket className="w-4 h-4" />
                )}
                <span className="text-[11px] font-bold uppercase tracking-[0.2em]">
                  {isSaving ? "Processing..." : "🚀 Publish Invitation"}
                </span>
              </button>
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
                  union.com/site/{siteSlug}
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

              <button
                onClick={handleSave}
                disabled={isSaving}
                className="editorial-button bg-editorial-accent hover:bg-[#B37E4A] text-white px-5 py-2 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isSaving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  {isSaving ? "Publishing..." : "Publish"}
                </span>
              </button>
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
                    Union Digital Draft
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
                <h2 className="text-3xl font-serif italic mb-2">Publish Your Invitation</h2>
                <div className="flex items-center justify-center gap-2 mt-4">
                  <span className="text-4xl font-serif font-bold text-editorial-ink">₹999</span>
                  <span className="text-xs uppercase tracking-widest font-bold text-editorial-muted">One-time</span>
                </div>
              </div>

              <div className="space-y-4 mb-10">
                {[
                  "Up to 500 views included",
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
                  {isProcessingPayment ? "Processing..." : "Pay ₹999 & Publish"}
                </button>
                <p className="text-[9px] text-center text-editorial-muted font-medium uppercase tracking-tight">
                  After 500 views, top up for ₹499 to get 500 more views
                </p>
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
                <h2 className="text-3xl font-serif italic mb-2">Your Invitation is Live! 🎉</h2>
                <p className="text-xs uppercase tracking-[0.2em] font-bold text-green-600">Payment successful</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-editorial-muted mb-3 block">Live Link</label>
                  <div className="flex items-center gap-2 p-5 bg-editorial-bg border border-editorial-border rounded-2xl">
                    <span className="text-xs font-mono text-editorial-ink truncate flex-1 font-medium">
                      {window.location.origin}/invite/{publishedInviteId}
                    </span>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/invite/${publishedInviteId}`);
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
                    onClick={() => window.open(`/invite/${publishedInviteId}`, '_blank')}
                    className="flex items-center justify-center gap-3 py-4 bg-editorial-ink text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all shadow-lg"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Visit Live Site
                  </button>
                  <button 
                    onClick={() => {
                      const text = `Join us for our special day! ❤️ View our invitation here: ${window.location.origin}/invite/${publishedInviteId}`;
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
                <h2 className="text-3xl font-serif italic mb-2">Invite Published!</h2>
                <p className="text-editorial-muted text-sm uppercase tracking-widest font-bold">
                  Your digital union is live
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-editorial-muted mb-2 block">
                    Your Exclusive Link
                  </label>
                  <div className="flex items-center gap-2 p-4 bg-editorial-bg border border-editorial-border rounded-2xl">
                    <span className="text-xs font-mono text-editorial-ink truncate flex-1">
                      {window.location.origin}/invite/{siteSlug}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/invite/${siteSlug}`);
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
                    onClick={() => window.open(`/invite/${siteSlug}`, "_blank")}
                    className="flex items-center justify-center gap-2 py-3 border border-editorial-border rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-editorial-bg transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Visit Live
                  </button>
                  <button
                    onClick={() => {
                      const text = `Join us for our ${isHousewarming ? "Housewarming" : "Wedding"}! ${window.location.origin}/invite/${siteSlug}`;
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