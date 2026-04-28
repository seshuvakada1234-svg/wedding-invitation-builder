/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
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
  Globe,
  Loader2,
  X,
  Trash2,
  Plus,
  Clock,
  Images,
  Copy,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { WeddingInvite, TemplateType, WeddingEvent } from "../types";
import { db, auth, handleFirestoreError } from "../lib/firebase";
import { collection, doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { getTemplateById } from "../templates";

const TEMPLATE_DEFAULTS: Record<string, string[]> = {
  'royal-wedding': ["Haldi", "Mehendi", "Sangeet", "Wedding"],
  'konaseema': ["Pellikuthuru", "Haldi", "Mehendi", "Wedding"],
  'kerala-wedding': ["Madhuramveypu", "Nischaayam", "Wedding", "Reception"],
  'kerala-envelope-reveal': ["Pellikuthuru", "Haldi", "Mehendi", "Wedding"],
  'housewarming-south': ["Gruha Pravesh", "Satyanarayana Vratham"],
  'minimal': ["Wedding Ceremony", "Reception"],
};

const GALLERY_DEFAULTS: Record<string, string[]> = {
  'housewarming-south': [
    "https://images.unsplash.com/photo-1582560475093-ba66accbc424?auto=format&fit=crop&q=80&w=800", // Traditional entrance
    "https://images.unsplash.com/photo-1603228254119-e6a4d0adad35?auto=format&fit=crop&q=80&w=800", // Flowers/Ritual
    "https://images.unsplash.com/photo-1623053531393-e4d0937a0980?auto=format&fit=crop&q=80&w=800", // Rangoli/Deepam
  ],
  'default': [
    "https://images.unsplash.com/photo-1519225497282-14337446bc77?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1544124499-58912cbddaad?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800"
  ]
};

export default function Builder() {
  const { templateId, inviteId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialTemplate = (templateId || searchParams.get('template') || 'minimal') as TemplateType;
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
    galleryImages: GALLERY_DEFAULTS[initialTemplate] || GALLERY_DEFAULTS['default'],
    events: (TEMPLATE_DEFAULTS[initialTemplate] || ["Wedding"]).map(name => ({
      name,
      date: "TBD",
      time: "TBD",
      location: "TBD"
    })),
    viewLimit: 500,
    views: 0
  });

  const currentTemplateId = (formData.template || initialTemplate) as TemplateType;
  const templateConfig = getTemplateById(currentTemplateId);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [viewDevice, setViewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  const [authLoading, setAuthLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Load existing invite if in edit mode
  useEffect(() => {
    async function loadInvite() {
      if (!inviteId || !auth.currentUser) return;
      
      try {
        const docRef = doc(db, "invites", inviteId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data() as WeddingInvite;
          // Verify ownership
          if (data.userId !== auth.currentUser.uid) {
            alert("You don't have permission to edit this invitation.");
            navigate('/dashboard');
            return;
          }
          setFormData(data);
          setIsEditMode(true);
        } else {
          alert("Invitation not found.");
          navigate('/dashboard');
        }
      } catch (err) {
        console.error("Error loading invite:", err);
      }
    }
    
    if (!authLoading && inviteId) {
      loadInvite();
    }
  }, [inviteId, authLoading, navigate]);

  // Authentication check
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        navigate("/login");
      } else {
        setAuthLoading(false);
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // Sync template if param changes and populate defaults
  useEffect(() => {
    if (currentTemplateId !== formData.template) {
       const defaultEventNames = TEMPLATE_DEFAULTS[currentTemplateId] || ["Wedding"];
       setFormData(prev => ({ 
         ...prev, 
         template: currentTemplateId,
         events: defaultEventNames.map(name => ({
           name,
           date: prev.weddingDate || "TBD",
           time: "TBD",
           location: prev.location || "TBD"
         }))
       }));
    }
  }, [currentTemplateId]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-editorial-bg">
        <Loader2 className="w-12 h-12 text-editorial-accent animate-spin" />
      </div>
    );
  }

  const isHousewarming = formData.template === 'housewarming-south';

  const siteSlug = (`${formData.groomName?.toLowerCase() || 'groom'}-${formData.brideName?.toLowerCase() || 'bride'}`)
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '') || 'new-invite';

  // Handle Event Changes
  const handleEventChange = (index: number, field: keyof WeddingEvent, value: string) => {
    const newEvents = [...(formData.events || [])];
    newEvents[index] = { ...newEvents[index], [field]: value };
    setFormData(prev => ({ ...prev, events: newEvents }));
  };

  const addEvent = () => {
    setFormData(prev => ({
      ...prev,
      events: [...(prev.events || []), { name: "New Event", date: "", time: "", location: "" }]
    }));
  };

  const removeEvent = (index: number) => {
    setFormData(prev => ({
      ...prev,
      events: prev.events?.filter((_, i) => i !== index)
    }));
  };

  // Handle Image Upload
  const uploadImage = async (file: File) => {
    if (!auth.currentUser) throw new Error("Must be logged in to upload");
    
    const formDataBody = new FormData();
    formDataBody.append("file", file);
    formDataBody.append("userId", auth.currentUser.uid);
    formDataBody.append("inviteId", siteSlug);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formDataBody,
    });

    let data;
    try {
      data = await res.json();
    } catch (e) {
      throw new Error("Server returned an invalid response (not JSON). Please check your server logs.");
    }

    if (!res.ok) {
      throw new Error(data.error || "Upload failed");
    }

    return { url: data.url, key: data.key };
  };

  const deleteImage = async (key: string) => {
    try {
      await fetch("/api/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
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
      alert("Only image files are allowed.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large. Max 5MB allowed.");
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
      
      // Delete old cover if it exists
      if (formData.coverImageKey) {
        deleteImage(formData.coverImageKey);
      }

      setFormData(prev => ({ 
        ...prev, 
        coverImage: url, 
        coverImageKey: key 
      }));
      
      setUploadSuccess("Image saved successfully!");
      setPendingFile(null);
      // Keep previewUrl until success message is cleared or new file selected if desired,
      // but usually we can clear it or show the uploaded one.
    } catch (error) {
      console.error("Upload failed", error);
      alert("Upload failed: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsUploading(false);
    }
  };

  const removeGalleryImage = (index: number) => {
    const imgKey = formData.galleryImageKeys?.[index];
    if (imgKey) {
      deleteImage(imgKey);
    }
    setFormData(prev => ({ 
      ...prev, 
      galleryImages: prev.galleryImages?.filter((_, idx) => idx !== index),
      galleryImageKeys: prev.galleryImageKeys?.filter((_, idx) => idx !== index)
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!auth.currentUser) {
      navigate('/login');
      return;
    }

    setIsSaving(true);
    try {
      const inviteData = {
        ...formData,
        userId: auth.currentUser.uid,
        slug: isEditMode ? formData.slug : siteSlug,
        updatedAt: serverTimestamp(),
        createdAt: isEditMode ? formData.createdAt : serverTimestamp(),
      };

      const docId = isEditMode ? (inviteId || formData.slug || siteSlug) : siteSlug;
      await setDoc(doc(db, "invites", docId), inviteData);
      
      setSaveSuccess(true);
      setShowShareModal(true);
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (error) {
      handleFirestoreError(error, 'create', 'invites');
    } finally {
      setIsSaving(false);
    }
  };

  const deviceWidths = {
    desktop: '100%',
    tablet: '768px',
    mobile: '375px'
  };

  const deviceContainerClasses = {
    desktop: 'max-w-5xl',
    tablet: 'max-w-[768px]',
    mobile: 'max-w-[375px]'
  };

  const openNewTab = () => {
    window.open(`/site/${siteSlug}`, '_blank');
  };

  return (
    <div className={`flex-1 grid transition-all duration-500 overflow-hidden h-[calc(100vh-64px)] bg-white relative ${isPreviewMode ? 'grid-cols-1' : 'grid-cols-[300px_1fr]'}`}>
      {/* Sidebar Editor */}
      <AnimatePresence>
        {!isPreviewMode && (
          <motion.aside 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: '300px', opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="bg-white border-r border-editorial-border flex flex-col overflow-y-auto shrink-0 z-20"
          >
            <div className="p-6 border-b border-editorial-border bg-editorial-bg/30">
              <button 
                onClick={() => navigate('/templates')}
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
                    <p className="text-[9px] uppercase font-bold tracking-widest text-editorial-muted">Editing: {templateConfig?.name}</p>
                </div>
              </div>
            </div>

            <div className="p-6 flex flex-col gap-10 flex-1">
              {/* Couple Details */}
              <div>
                <h2 className="editorial-section-title text-[11px] mb-4">{isHousewarming ? 'Hosts' : 'Identity'}</h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="editorial-label text-[10px]">{isHousewarming ? 'Primary Host' : 'Bride'}</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-editorial-muted" />
                      <input name="brideName" value={formData.brideName} onChange={handleChange} className="editorial-input pl-10" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="editorial-label text-[10px]">{isHousewarming ? 'Family/Co-Host' : 'Groom'}</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-editorial-muted" />
                      <input name="groomName" value={formData.groomName} onChange={handleChange} className="editorial-input pl-10" />
                    </div>
                  </div>
                </div>
              </div>

              {isHousewarming && (
                <div className="space-y-4">
                  <h2 className="editorial-section-title text-[11px]">Housewarming Details</h2>
                  <div className="space-y-2">
                    <label className="editorial-label text-[10px]">Deity Name</label>
                    <input 
                      type="text" 
                      value={formData.deity} 
                      onChange={(e) => setFormData({...formData, deity: e.target.value})}
                      className="editorial-input font-mono"
                      placeholder="e.g. Lord Venkateswara"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="editorial-label text-[10px]">Ceremony Name</label>
                    <input 
                      type="text" 
                      value={formData.eventName} 
                      onChange={(e) => setFormData({...formData, eventName: e.target.value})}
                      className="editorial-input"
                      placeholder="e.g. Gruha Pravesh"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="editorial-label text-[10px]">Muhurtham</label>
                    <input 
                      type="text" 
                      value={formData.muhurtham} 
                      onChange={(e) => setFormData({...formData, muhurtham: e.target.value})}
                      className="editorial-input"
                      placeholder="e.g. 2:43 AM"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="editorial-label text-[10px]">Family Name</label>
                    <input 
                      type="text" 
                      value={formData.family} 
                      onChange={(e) => setFormData({...formData, family: e.target.value})}
                      className="editorial-input"
                      placeholder="e.g. Chodapaneedi Family"
                    />
                  </div>
                </div>
              )}

              {/* Event Management */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="editorial-section-title text-[11px]">{isHousewarming ? 'Pooja Details' : 'Itinerary'}</h2>
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
                    <div key={idx} className="p-4 bg-editorial-bg border border-editorial-border rounded-xl relative group">
                      <button 
                        onClick={() => removeEvent(idx)}
                        className="absolute top-2 right-2 p-1 text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      <input 
                        value={ev.name} 
                        onChange={(e) => handleEventChange(idx, 'name', e.target.value)} 
                        className="bg-transparent border-none p-0 text-xs font-bold text-editorial-ink w-full focus:ring-0 mb-3"
                        placeholder="Event Name"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <div className="relative">
                          <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-editorial-muted" />
                          <input 
                            value={ev.date} 
                            onChange={(e) => handleEventChange(idx, 'date', e.target.value)} 
                            className="editorial-input text-[10px] pl-6 py-1.5 h-auto"
                            placeholder="Date"
                          />
                        </div>
                        <div className="relative">
                          <Clock className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-editorial-muted" />
                          <input 
                            value={ev.time} 
                            onChange={(e) => handleEventChange(idx, 'time', e.target.value)} 
                            className="editorial-input text-[10px] pl-6 py-1.5 h-auto"
                            placeholder="Time"
                          />
                        </div>
                      </div>
                      <div className="mt-2 relative">
                         <MapPin className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-editorial-muted" />
                         <input 
                           value={ev.location} 
                           onChange={(e) => handleEventChange(idx, 'location', e.target.value)} 
                           className="editorial-input text-[10px] pl-6 py-1.5 h-auto"
                           placeholder="Location"
                         />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Location & Map */}
              <div>
                <h2 className="editorial-section-title text-[11px] mb-4">Venue & Location</h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="editorial-label text-[10px]">Venue Name</label>
                    <input name="location" value={formData.location} onChange={handleChange} className="editorial-input" placeholder="e.g. The Grand Palace Gardens" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <label className="editorial-label text-[10px]">City</label>
                      <input name="venueCity" value={formData.venueCity} onChange={handleChange} className="editorial-input text-[10px]" placeholder="e.g. Hyderabad" />
                    </div>
                    <div className="space-y-2">
                      <label className="editorial-label text-[10px]">Address</label>
                      <input name="venueAddress" value={formData.venueAddress} onChange={handleChange} className="editorial-input text-[10px]" placeholder="Detailed address..." />
                    </div>
                  </div>
                  <div className="space-y-4 pt-1 border-t border-editorial-border">
                    <div className="space-y-2">
                      <label className="editorial-label text-[10px]">Google Maps Link</label>
                      <input 
                        name="googleMapsLink" 
                        value={formData.googleMapsLink} 
                        onChange={handleChange} 
                        className="editorial-input text-[10px]" 
                        placeholder="Paste Google Maps link (maps.app.goo.gl or www.google.com/maps/...)"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="editorial-label text-[10px]">Coordinates (lat,lng)</label>
                      <input 
                        name="coordinates" 
                        value={formData.coordinates} 
                        onChange={handleChange} 
                        className="editorial-input text-[10px]" 
                        placeholder="e.g. 16.6785, 81.9159 OR 16°40'42.9&quot;N 81°54'57.3&quot;E"
                      />
                    </div>
                    <p className="text-[9px] text-editorial-accent font-medium leading-tight">
                      Paste Google Maps link OR coordinates for best preview. Iframe code also works.
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
                    value={formData.story} 
                    onChange={handleChange} 
                    className="editorial-input min-h-[100px] text-xs"
                    placeholder="Tell your guests about your journey..."
                  />
                </div>
              </div>

              {/* Advanced Settings */}
              <div>
                <h2 className="editorial-section-title text-[11px] mb-4">Visual Effects</h2>
                <label className="flex items-center justify-between p-3 bg-editorial-bg border border-editorial-border rounded-xl cursor-pointer">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-editorial-ink">Enable 3D Effects</span>
                  <input 
                    type="checkbox" 
                    checked={formData.enable3D} 
                    onChange={(e) => setFormData(prev => ({ ...prev, enable3D: e.target.checked }))}
                    className="w-4 h-4 rounded text-editorial-accent focus:ring-editorial-accent cursor-pointer"
                  />
                </label>
                {formData.template === 'housewarming-south' ? null : (formData.template === 'kerala-envelope-reveal' || formData.template === 'housewarming-south') && (
                  <label className="flex items-center justify-between p-3 bg-editorial-bg border border-editorial-border rounded-xl cursor-pointer mt-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-editorial-ink">Enable Envelope Animation</span>
                    <input 
                      type="checkbox" 
                      checked={formData.enableEnvelope} 
                      onChange={(e) => setFormData(prev => ({ ...prev, enableEnvelope: e.target.checked }))}
                      className="w-4 h-4 rounded text-editorial-accent focus:ring-editorial-accent cursor-pointer"
                    />
                  </label>
                )}

                {formData.template === 'housewarming-south' && (
                  <label className="flex items-center justify-between p-3 bg-editorial-bg border border-editorial-border rounded-xl cursor-pointer mt-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-editorial-ink">Enable Envelope Animation</span>
                    <input 
                      type="checkbox" 
                      checked={formData.enableEnvelope} 
                      onChange={(e) => setFormData(prev => ({ ...prev, enableEnvelope: e.target.checked }))}
                      className="w-4 h-4 rounded text-editorial-accent focus:ring-editorial-accent cursor-pointer"
                    />
                  </label>
                )}
              </div>

              {/* Media Assets */}
              <div>
                <h2 className="editorial-section-title text-[11px] mb-4">{isHousewarming ? 'Visual Assets' : 'Artboard Assets'}</h2>
                
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
                          {previewUrl ? 'New Selection' : 'Active Cover'}
                        </p>
                      </div>
                    </div>

                    {pendingFile && (
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={handleImageSave}
                          disabled={isUploading}
                          className={`w-full py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all
                            ${isUploading 
                              ? 'bg-editorial-border text-editorial-ink/50 cursor-not-allowed' 
                              : 'bg-editorial-accent text-white hover:bg-opacity-90 shadow-md'
                            }`}
                        >
                          {isUploading ? (
                            <span className="flex items-center justify-center gap-2">
                              <Loader2 className="w-3 h-3 animate-spin" /> Saving...
                            </span>
                          ) : 'Save Image to Cloud'}
                        </button>
                        <p className="text-[9px] text-center text-editorial-ink/60 italic">
                          Click save to store this image in permanent storage
                        </p>
                      </div>
                    )}

                    {uploadSuccess && (
                      <div className="p-2 bg-green-50 border border-green-100 rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        <p className="text-[9px] text-green-700 font-medium uppercase tracking-tight">{uploadSuccess}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-4">
                    <label className="block border-2 border-dashed border-editorial-border rounded-xl p-6 text-center cursor-pointer hover:border-editorial-accent hover:bg-editorial-bg transition-all group">
                      <input type="file" className="hidden" accept="image/png,image/jpeg,image/webp" onChange={handleImageSelect} />
                      <Upload className="w-5 h-5 text-editorial-accent mx-auto mb-2 group-hover:scale-110 transition-transform" />
                      <div className="text-[10px] font-bold text-editorial-ink uppercase tracking-widest">
                        {previewUrl ? 'Change Selection' : (isHousewarming ? 'Select Main Photo' : 'Select Cover Image')}
                      </div>
                      <p className="text-[9px] text-editorial-ink/40 mt-1 uppercase tracking-tighter font-medium">PNG, JPG, WEBP • Max 5MB</p>
                    </label>
                  </div>

                  <div className="space-y-4">
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
                              alert(`File ${file.name} is too large. Skipping.`);
                              continue;
                            }
                            try {
                              const { url, key } = await uploadImage(file);
                              setFormData(prev => ({ 
                                ...prev, 
                                galleryImages: [...(prev.galleryImages || []), url],
                                galleryImageKeys: [...(prev.galleryImageKeys || []), key]
                              }));
                            } catch (err) {
                              console.error(err);
                            }
                          }
                          setIsUploading(false);
                          setUploadSuccess(`Gallery updated!`);
                        }} 
                      />
                      <Images className="w-5 h-5 text-editorial-accent mx-auto mb-2 group-hover:scale-110 transition-transform" />
                      <div className="text-[10px] font-bold text-editorial-ink uppercase tracking-widest">Add to Gallery</div>
                      <p className="text-[9px] text-editorial-ink/40 mt-1 uppercase tracking-tighter font-medium">Auto-upload enabled</p>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {formData.galleryImages?.map((img, i) => (
                    <div key={i} className="aspect-square rounded-lg overflow-hidden border border-editorial-border relative group">
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

            <div className="p-6 border-t border-editorial-border bg-white mt-auto">
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="w-full editorial-button bg-editorial-ink text-white py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-black transition-all"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span className="text-[11px] font-bold uppercase tracking-[0.2em]">{isSaving ? 'Processing...' : 'Publish Update'}</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Workspace Area */}
      <main className="flex-1 flex flex-col bg-[#F9F9F9] relative overflow-hidden">
        {/* Workspace Toolbar */}
        <header className="h-14 bg-white border-b border-editorial-border z-10 shrink-0">
          <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between w-full">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-editorial-bg rounded-lg border border-editorial-border">
                <Globe className="w-3.5 h-3.5 text-editorial-muted" />
                <span className="text-[10px] font-mono text-editorial-ink opacity-70">union.com/site/{siteSlug}</span>
              </div>
              
              <div className="h-4 w-px bg-editorial-border hidden md:block"></div>
              
              {/* Device Switcher */}
              <div className="flex items-center bg-editorial-bg p-1 rounded-lg border border-editorial-border">
                <button 
                  onClick={() => setViewDevice('desktop')}
                  className={`p-1.5 rounded-md transition-all ${viewDevice === 'desktop' ? 'bg-white shadow-sm text-editorial-accent' : 'text-editorial-muted hover:text-editorial-ink'}`}
                >
                  <Monitor className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setViewDevice('tablet')}
                  className={`p-1.5 rounded-md transition-all ${viewDevice === 'tablet' ? 'bg-white shadow-sm text-editorial-accent' : 'text-editorial-muted hover:text-editorial-ink'}`}
                >
                  <Tablet className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setViewDevice('mobile')}
                  className={`p-1.5 rounded-md transition-all ${viewDevice === 'mobile' ? 'bg-white shadow-sm text-editorial-accent' : 'text-editorial-muted hover:text-editorial-ink'}`}
                >
                  <Smartphone className="w-4 h-4" />
                </button>
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
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${isPreviewMode ? 'bg-editorial-ink text-white' : 'bg-white border border-editorial-border text-editorial-ink hover:bg-editorial-bg'}`}
              >
                {isPreviewMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                <span>{isPreviewMode ? 'Exit Preview' : 'Preview Mode'}</span>
              </button>
              
              <div className="h-4 w-px bg-editorial-border mx-2"></div>
              
              <button 
                onClick={handleSave}
                className="editorial-button bg-editorial-accent hover:bg-[#B37E4A] text-white px-5 py-2 flex items-center justify-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Publish</span>
              </button>
            </div>
          </div>
        </header>

        {/* Live Preview Container */}
        <div className="flex-1 overflow-auto scrollbar-hide relative px-4 mt-6 flex justify-center items-start bg-neutral-50/50">
          <motion.div 
            layout
            key={viewDevice}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{ 
              width: deviceWidths[viewDevice],
              height: '100%',
              minHeight: viewDevice === 'desktop' ? '100%' : '667px'
            }}
            className={`bg-white shadow-2xl overflow-hidden relative transition-all duration-500 origin-top rounded-none sm:rounded-xl border border-editorial-border/30 mx-auto ${deviceContainerClasses[viewDevice]}`}
          >
            {/* Template Content */}
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
                  googleMapsLink={formData.googleMapsLink} // Using same for both as fallback
                  coordinates={formData.coordinates}
                  story={formData.story}
                  enable3D={formData.enable3D}
                  enableEnvelope={formData.enableEnvelope}
                  coverImage={formData.coverImage}
                  events={formData.events || []}
                  galleryImages={formData.galleryImages || []}
                  // Housewarming specialized props
                  deity={formData.deity}
                  eventName={formData.eventName}
                  muhurtham={formData.muhurtham}
                  family={formData.family}
                  hosts={{
                    primary: formData.brideName || "",
                    secondary: formData.groomName || ""
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

            {/* Static Overlay (Draft Watermark) */}
            <div className="absolute inset-0 pointer-events-none select-none z-50">
               <div className="absolute inset-x-0 bottom-10 flex justify-center">
                  <div className="bg-editorial-ink/10 backdrop-blur-md px-6 py-2 rounded-full border border-editorial-ink/5">
                    <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-editorial-ink opacity-30">Union Digital Draft</span>
                  </div>
               </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Floating Exit Preview (Only in preview mode) */}
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
      
      {/* Share/Success Modal */}
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
                <p className="text-editorial-muted text-sm uppercase tracking-widest font-bold">Your digital union is live</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-editorial-muted mb-2 block">Your Exclusive Link</label>
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
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-editorial-accent" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => window.open(`/invite/${siteSlug}`, '_blank')}
                    className="flex items-center justify-center gap-2 py-3 border border-editorial-border rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-editorial-bg transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Visit Live
                  </button>
                  <button 
                    onClick={() => {
                      const text = `Join us for our ${isHousewarming ? 'Housewarming' : 'Wedding'}! ${window.location.origin}/invite/${siteSlug}`;
                      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
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