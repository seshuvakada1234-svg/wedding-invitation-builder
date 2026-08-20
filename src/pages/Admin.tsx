/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Search, Check, X, Loader2,
  Users, Globe, CreditCard, Image, Layout, Trash2,
  ShieldOff, TrendingUp, LogOut, Download
} from "lucide-react";
import { auth, authFetch, db } from "../lib/firebase";
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  onSnapshot, 
  query, 
  where 
} from "firebase/firestore";
import { logout } from "../lib/clientAuth";
import { isAdminUser } from "../lib/auth";
import { WeddingInvite } from "../types";
import { useNavigate, Navigate } from "react-router-dom";
import toast from "react-hot-toast";

type Tab = "overview" | "invitations" | "payments" | "images" | "templates";

interface Stats {
  totalUsers: number;
  totalInvites: number;
  totalRevenue: number;
  activeWebsites: number;
  deployRevenue?: number;
  redeployRevenue?: number;
  topupRevenue?: number;
}

// ✅ Smart date formatter
function formatDate(val: any): string {
  if (!val) return "—";
  try {
    if (val?.toDate) {
      return val.toDate().toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
      });
    }
    const d = new Date(val);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
    });
  } catch {
    return "—";
  }
}

// ✅ Map template identifier to user-friendly name
function getTemplateName(templateId: string): string {
  const id = (templateId || "").toLowerCase().trim();
  if (id === "royal-wedding" || id === "royal") return "Royal-Wedding";
  if (id === "royal-emerald") return "Royal-Emerald";
  if (id === "royal-heritage") return "Royal-Heritage";
  if (id === "royal-rajasthani" || id === "rajasthani") return "Royal-Rajasthani";
  if (id === "kerala-envelope-reveal" || id === "kerala-reveal") return "Kerala-Envelope-Reveal";
  if (id === "housewarming-south" || id === "housewarming") return "Housewarming-South";
  if (id === "south-india") return "South-India";
  return "Minimalist";
}

export default function Admin() {
  const [invites, setInvites] = useState<WeddingInvite[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [adminImages, setAdminImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<"all" | "deploy" | "redeploy" | "topup">("all");
  const [isBackfilling, setIsBackfilling] = useState(false);
  const [isBackfillingImages, setIsBackfillingImages] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [imageSubFilter, setImageSubFilter] = useState<"ALL" | "DEPLOY" | "REDEPLOY" | "HERO" | "GALLERY" | "BACKGROUND">("ALL");
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(auth.currentUser);

  const groupedUsers = useMemo(() => {
    const usersMap: Record<string, {
      userId: string;
      email: string;
      brideName?: string;
      groomName?: string;
      imageCount: number;
      deployCount: number;
      redeployCount: number;
      templates: Set<string>;
    }> = {};

    adminImages.forEach((img) => {
      const uid = img.userId || "anonymous";
      if (!usersMap[uid]) {
        usersMap[uid] = {
          userId: uid,
          email: img.email || "Unknown user",
          brideName: img.brideName || "",
          groomName: img.groomName || "",
          imageCount: 0,
          deployCount: 0,
          redeployCount: 0,
          templates: new Set<string>(),
        };
      }
      usersMap[uid].imageCount++;
      const currentTemplate = img.templateId || img.template || img.templateName || "";
      if (currentTemplate) {
        usersMap[uid].templates.add(getTemplateName(currentTemplate));
      }
      if (img.email && (!usersMap[uid].email || usersMap[uid].email === "Unknown user")) {
        usersMap[uid].email = img.email;
      }
      if (img.brideName && !usersMap[uid].brideName) usersMap[uid].brideName = img.brideName;
      if (img.groomName && !usersMap[uid].groomName) usersMap[uid].groomName = img.groomName;
    });

    invites.forEach((invite) => {
      const uid = invite.userId || "anonymous";
      if (!usersMap[uid]) {
        usersMap[uid] = {
          userId: uid,
          email: invite.email || "Unknown user",
          brideName: invite.brideName || invite.draftData?.brideName || "",
          groomName: invite.groomName || invite.draftData?.groomName || "",
          imageCount: 0,
          deployCount: 0,
          redeployCount: 0,
          templates: new Set<string>(),
        };
      }
      usersMap[uid].deployCount += (invite.deployCount || 0);
      usersMap[uid].redeployCount += (invite.redeployCount || 0);

      const currentTemplate = invite.templateId || invite.template || invite.templateName || "";
      if (currentTemplate) {
        usersMap[uid].templates.add(getTemplateName(currentTemplate));
      }
      if (invite.email && (!usersMap[uid].email || usersMap[uid].email === "Unknown user")) {
        usersMap[uid].email = invite.email;
      }
      if (invite.brideName && !usersMap[uid].brideName) {
        usersMap[uid].brideName = invite.brideName;
      }
      if (invite.groomName && !usersMap[uid].groomName) {
        usersMap[uid].groomName = invite.groomName;
      }
    });

    return Object.values(usersMap).sort((a, b) => b.imageCount - a.imageCount || b.deployCount - a.deployCount);
  }, [adminImages, invites]);

  const selectedUserImages = useMemo(() => {
    if (!selectedUserId) return [];
    
    let items = adminImages.filter((img) => (img.userId || "anonymous") === selectedUserId);

    if (imageSubFilter === "DEPLOY") {
      items = items.filter((img) => 
        (img.deployType || "").toUpperCase() === "DEPLOY" || 
        (img.source || "").toLowerCase() === "deploy"
      );
    } else if (imageSubFilter === "REDEPLOY") {
      items = items.filter((img) => 
        (img.deployType || "").toUpperCase() === "REDEPLOY" || 
        (img.source || "").toLowerCase() === "redeploy"
      );
    } else if (imageSubFilter === "HERO") {
      items = items.filter((img) => {
        const type = (img.imageType || img.type || "").toUpperCase();
        return type === "HERO" || type === "COVER" || img.fieldName === "heroImage" || img.fieldName === "coverImage";
      });
    } else if (imageSubFilter === "GALLERY") {
      items = items.filter((img) => {
        const type = (img.imageType || img.type || "").toUpperCase();
        return type === "GALLERY" || type === "EVENT" || img.fieldName === "galleryImages" || img.fieldName === "eventImages";
      });
    } else if (imageSubFilter === "BACKGROUND") {
      items = items.filter((img) => {
        const type = (img.imageType || img.type || "").toUpperCase();
        return type === "BACKGROUND" || type === "BG" || img.fieldName === "backgroundImage";
      });
    }

    return items;
  }, [adminImages, selectedUserId, imageSubFilter]);

  // Dynamic Real-time Stats
  const [liveStats, setLiveStats] = useState<Stats>({
    totalUsers: 0,
    totalInvites: 0,
    totalRevenue: 0,
    activeWebsites: 0,
    deployRevenue: 0,
    redeployRevenue: 0,
    topupRevenue: 0,
  });

  const [dbTemplates, setDbTemplates] = useState<any[]>([]);
  const [dbPrices, setDbPrices] = useState<Record<string, number>>({});
  const [prices, setPrices]   = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving]   = useState<string | null>(null);

  const unsubs = useRef<(() => void)[]>([]);

  async function syncTemplates() {
    try {
      const { templates: staticTemplates } = await import("../templates");
      for (const t of staticTemplates) {
        const tRef = doc(db, "templates", t.id);
        const snap = await getDoc(tRef);
        if (!snap.exists()) {
          await setDoc(tRef, {
            id: t.id,
            name: t.name,
            publishPrice: t.publishPrice || 999, // Standard default price if not already in DB
            category: t.category || 'classic',
            enabled: true,
            activeUses: 0,
            thumbnail: t.thumbnail,
            createdAt: new Date()
          });
        }
      }
    } catch (e) {
      console.error("Sync templates error:", e);
    }
  }

  async function loadPrices() {
    try {
      await syncTemplates();
      const { templates: staticTemplates } = await import("../templates");
      const defaults: Record<string, string> = {};
      // No longer using static prices as defaults

      const promises = staticTemplates.map(t => getDoc(doc(db, "templates", t.id)));
      const snaps = await Promise.all(promises);

      snaps.forEach((snap, idx) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data.publishPrice) {
            defaults[staticTemplates[idx].id] = data.publishPrice.toString();
          }
        }
      });

      setPrices(defaults);
    } catch (e) {
      console.error("Failed to load prices", e);
    }
  }

  async function savePrice(templateId: string) {
    if (!prices[templateId] || isNaN(Number(prices[templateId]))) {
      toast.error("Please enter a valid price");
      return;
    }

    setSaving(templateId);
    try {
      const templateRef = doc(db, "templates", templateId);
      const templateData = {
        id: templateId,
        publishPrice: Number(prices[templateId]),
        updatedAt: new Date(),
        enabled: true
      };

      await setDoc(templateRef, templateData, { merge: true });
      
      toast.success(`✅ Price updated for ${templateId}`);
      setEditing(null);
    } catch (e: any) {
      console.error("Error saving price:", e);
      toast.error(e.message || "Failed to save price");
    } finally {
      setSaving(null);
    }
  }

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      // Clear previous listeners
      unsubs.current.forEach(u => u());
      unsubs.current = [];

      if (user && isAdminUser(user.email)) {
        loadPrices();
        setLoading(false);
        
        // 1. Live Users Count
        const u1 = onSnapshot(collection(db, "users"), (snap) => {
          setLiveStats(prev => ({ ...prev, totalUsers: snap.size }));
        }, (err) => console.error("Users listener error:", err));
        unsubs.current.push(u1);

        // 2. Live Invites & Active Websites
        const u2 = onSnapshot(collection(db, "invites"), (snap) => {
          const docs = snap.docs.map(d => d.data());
          setLiveStats(prev => ({
            ...prev,
            totalInvites: snap.size,
            activeWebsites: docs.filter(d => d.status === 'live' || d.published === true).length
          }));
          
          const invitesList = snap.docs.map(d => ({ id: d.id, ...d.data() } as WeddingInvite));
          setInvites(invitesList.sort((a, b) => {
            const getTs = (val: any) => {
              if (!val) return 0;
              if (val && typeof val === "object" && "toDate" in val) return val.toDate().getTime();
              const d = new Date(val);
              return isNaN(d.getTime()) ? 0 : d.getTime();
            };
            return getTs(b.updatedAt) - getTs(a.updatedAt);
          }));
        }, (err) => console.error("Invites listener error:", err));
        unsubs.current.push(u2);

        // 3. Live Revenue & Payments History
        const qPayments = collection(db, "payments");
        const u3 = onSnapshot(qPayments, (snap) => {
          let totalRevenue = 0;
          let deployRevenue = 0;
          let redeployRevenue = 0;
          let topupRevenue = 0;

          snap.docs.forEach((doc) => {
            const data = doc.data();
            const amount = Number(data.amount) || 0;
            const pType = data.paymentType || data.type || "deploy";

            totalRevenue += amount;
            if (pType === "redeploy") {
              redeployRevenue += amount;
            } else if (pType === "topup") {
              topupRevenue += amount;
            } else {
              deployRevenue += amount;
            }
          });

          setLiveStats(prev => ({ 
            ...prev, 
            totalRevenue, 
            deployRevenue, 
            redeployRevenue, 
            topupRevenue 
          }));
          
          const paymentsList = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
          setPayments(paymentsList.sort((a, b) => {
            const getTs = (val: any) => {
              if (!val) return 0;
              if (val && typeof val === "object" && "toDate" in val) return val.toDate().getTime();
              const d = new Date(val);
              return isNaN(d.getTime()) ? 0 : d.getTime();
            };
            return getTs(b.createdAt) - getTs(a.createdAt);
          }));
        }, (err) => console.error("Payments listener error:", err));
        unsubs.current.push(u3);

        // 4. Templates Listener
        const ut = onSnapshot(collection(db, "templates"), (snap) => {
          const tList = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
          setDbTemplates(tList);
          
          // Sync prices state with dynamic data
          const newPrices: Record<string, string> = {};
          tList.forEach(t => {
            if (t.publishPrice) newPrices[t.id] = t.publishPrice.toString();
          });
          setPrices(prev => ({ ...prev, ...newPrices }));
        }, (err) => console.error("Templates listener error:", err));
        unsubs.current.push(ut);

        // 5. Uploaded Images Listener
        const uImg = onSnapshot(collection(db, "uploadedImages"), (snap) => {
          const imgList = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
          setAdminImages(imgList.sort((a, b) => {
            const getTs = (val: any) => {
              if (!val) return 0;
              if (val && typeof val === "object" && "toDate" in val) return val.toDate().getTime();
              const d = new Date(val);
              return isNaN(d.getTime()) ? 0 : d.getTime();
            };
            return getTs(b.uploadedAt || b.createdAt) - getTs(a.uploadedAt || a.createdAt);
          }));
        }, (err) => console.error("Admin images listener error:", err));
        unsubs.current.push(uImg);

      } else {
        setLoading(false);
      }
    });

    return () => {
      unsubAuth();
      unsubs.current.forEach(u => u());
    };
  }, []);

  const handleExportCSV = () => {
    try {
      const headers = ["Email", "Template", "Type", "Amount", "Views Added", "Date", "Bride Name", "Groom Name"];
      const rows = payments.map(p => {
        const pType = (p.paymentType || p.type || "deploy").toUpperCase();
        
        const matchedInvite = invites.find(i => i.id === p.invitationId || i.id === p.inviteId || i.userId === p.userId && (i.templateId === p.templateId || i.template === p.templateId));
        
        const email = p.email || matchedInvite?.email || p.userId || "Unknown";
        
        const rawTemplateId = p.templateId || matchedInvite?.templateId || matchedInvite?.template || "minimal";
        const template = p.templateName || (rawTemplateId ? getTemplateName(rawTemplateId) : "Minimalist");
        
        const amount = p.amount || 0;
        const viewsAdded = p.viewsAdded || "—";
        const dStr = formatDate(p.createdAt);
        
        const brideName = p.brideName || matchedInvite?.brideName || matchedInvite?.draftData?.brideName || "";
        const groomName = p.groomName || matchedInvite?.groomName || matchedInvite?.draftData?.groomName || "";
        
        return [
          `"${email.replace(/"/g, '""')}"`,
          `"${template.replace(/"/g, '""')}"`,
          `"${pType.replace(/"/g, '""')}"`,
          amount,
          `"${viewsAdded}"`,
          `"${dStr.replace(/"/g, '""')}"`,
          `"${brideName.replace(/"/g, '""')}"`,
          `"${groomName.replace(/"/g, '""')}"`
        ].join(",");
      });

      const csvContent = [headers.join(","), ...rows].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `payment_history_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("CSV export downloaded successfully!");
    } catch (err: any) {
      console.error("Export failed:", err);
      toast.error("Failed to export template payments data.");
    }
  };

  useEffect(() => {
    if (tab === "payments") {
      const triggerBackfill = async () => {
        try {
          setIsBackfilling(true);
          const res = await authFetch("/api/admin/backfill-payments", { method: "POST" });
          const data = await res.json();
          if (data.success && data.backfilledCount > 0) {
            console.log(`Auto-backfilled ${data.backfilledCount} payment records.`);
            toast.success(`Successfully backfilled ${data.backfilledCount} old payment records!`);
          }
        } catch (err) {
          console.error("Auto backfill failed:", err);
        } finally {
          setIsBackfilling(false);
        }
      };
      triggerBackfill();
    }
  }, [tab]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this invitation permanently?")) return;
    try {
      await authFetch(`/api/admin/invite/${id}`, { method: "DELETE" });
      setInvites((prev) => prev.filter((i) => i.id !== id));
      toast.success("Invitation deleted");
    } catch {
      toast.error("Delete failed");
    }
  }

  async function handleUnpublish(id: string) {
    try {
      await authFetch(`/api/admin/invite/${id}/unpublish`, { method: "PATCH" });
      setInvites((prev) =>
        prev.map((i) => (i.id === id ? { ...i, isPaid: false } : i))
      );
      toast.success("Website unpublished");
    } catch {
      toast.error("Failed to unpublish");
    }
  }

  useEffect(() => {
    if (tab === "images") {
      const triggerBackfillImages = async () => {
        try {
          setIsBackfillingImages(true);
          const res = await authFetch("/api/admin/backfill-images", { method: "POST" });
          const data = await res.json();
          if (data.success && data.processedCount > 0) {
            console.log(`Sync-backfilled images from ${data.processedCount} invitations.`);
            toast.success(`Successfully scanned & synchronized all uploaded user images!`);
          }
        } catch (err) {
          console.error("Image backfill failed:", err);
        } finally {
          setIsBackfillingImages(false);
        }
      };
      triggerBackfillImages();
    }
  }, [tab]);

  async function handleDeleteImage(imageId: string) {
    if (!confirm("Are you sure you want to delete this uploaded image from the records?")) return;
    try {
      const res = await authFetch(`/api/admin/image/${imageId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("Image record removed successfully.");
        setAdminImages(prev => prev.filter(img => img.id !== imageId));
      } else {
        toast.error("Failed to delete image: " + (data.error || "unknown error"));
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete image");
    }
  }

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  const filtered = invites.filter(
    (i) =>
      i.email?.toLowerCase().includes(search.toLowerCase()) ||
      i.brideName?.toLowerCase().includes(search.toLowerCase()) ||
      i.groomName?.toLowerCase().includes(search.toLowerCase()) ||
      i.slug?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-24">
        <Loader2 className="w-12 h-12 text-editorial-accent animate-spin" />
      </div>
    );
  }

  if (!isAdminUser(currentUser?.email)) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen bg-editorial-bg">
      {/* ── Sidebar ── */}
      <aside className="w-56 shrink-0 bg-editorial-ink text-white flex flex-col">
        <div className="px-6 py-8 border-b border-white/10">
          <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-1">
            Admin Panel
          </p>
          <h2 className="text-xl font-serif italic text-white uppercase tracking-tighter">Wedding Invitation</h2>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1">
          {(
            [
              { id: "overview",    label: "Overview",    icon: TrendingUp },
              { id: "invitations", label: "Invitations", icon: Globe },
              { id: "payments",    label: "Payments",    icon: CreditCard },
              { id: "images",      label: "Images",      icon: Image },
              { id: "templates",   label: "Templates",   icon: Layout },
            ] as { id: Tab; label: string; icon: any }[]
          ).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                tab === id
                  ? "bg-white/10 text-white font-semibold"
                  : "text-white/50 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/5 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-8 py-10">

          <div className="mb-10">
            <p className="text-[10px] uppercase tracking-widest text-editorial-muted font-bold mb-1">
              Administrator
            </p>
            <h1 className="text-4xl font-serif italic">
              {tab === "overview"    && "Dashboard Overview"}
              {tab === "invitations" && "All Invitations"}
              {tab === "payments"    && "Payments"}
              {tab === "images"      && "Uploaded Images"}
              {tab === "templates"   && "Templates"}
            </h1>
          </div>

          {/* ── OVERVIEW ── */}
          {tab === "overview" && (
            <div className="space-y-8">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Total Users",       value: liveStats.totalUsers,                            icon: Users,      color: "text-blue-500"   },
                  { label: "Total Invitations", value: liveStats.totalInvites,                          icon: Globe,      color: "text-purple-500" },
                  { label: "Revenue",           value: `₹${liveStats.totalRevenue.toLocaleString()}`,   icon: CreditCard, color: "text-green-500"  },
                  { label: "Live Websites",     value: liveStats.activeWebsites,                        icon: TrendingUp, color: "text-amber-500"  },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="editorial-card bg-white p-6 hover:shadow-xl transition-all duration-300 group">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-[10px] uppercase tracking-widest font-bold text-editorial-muted group-hover:text-editorial-ink transition-colors">
                        {label}
                      </p>
                      <div className={`p-2 rounded-full bg-editorial-bg/50 group-hover:bg-white group-hover:shadow-sm transition-all`}>
                        <Icon className={`w-5 h-5 ${color}`} />
                      </div>
                    </div>
                    <p className="text-3xl font-serif italic animate-in fade-in slide-in-from-bottom-2 duration-500">
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="editorial-card bg-white overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-editorial-border flex items-center justify-between">
                  <h2 className="text-sm font-bold uppercase tracking-widest text-editorial-muted">
                    Recent Activity
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-bold text-editorial-muted uppercase">Live Updates</span>
                  </div>
                </div>
                <InviteTable
                  invites={invites.slice(0, 10)}
                  onDelete={handleDelete}
                  onUnpublish={handleUnpublish}
                />
              </div>
            </div>
          )}

          {/* ── INVITATIONS ── */}
          {tab === "invitations" && (
            <div className="editorial-card bg-white overflow-hidden">
              <div className="p-4 border-b border-editorial-border bg-editorial-bg/30 flex justify-between items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-2 w-4 h-4 text-editorial-muted" />
                  <input
                    className="bg-white border border-editorial-border rounded-full py-1.5 pl-9 pr-4 text-xs focus:outline-none focus:border-editorial-accent w-64"
                    placeholder="Search by email, name or slug..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <span className="text-[10px] uppercase tracking-widest font-bold text-editorial-muted">
                  {filtered.length} results
                </span>
              </div>
              <InviteTable
                invites={filtered}
                onDelete={handleDelete}
                onUnpublish={handleUnpublish}
              />
            </div>
          )}

          {/* ── PAYMENTS ── */}
          {tab === "payments" && (() => {
            const filteredPayments = payments.filter((p) => {
              if (paymentFilter === "all") return true;
              const pType = (p.paymentType || p.type || "deploy").toLowerCase().trim();
              return pType === paymentFilter;
            });
            return (
              <div className="space-y-6">
                {/* Overall Metadata & Individual Revenues */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: "🚀 Deploy Revenue",   value: `₹${(liveStats.deployRevenue || 0).toLocaleString()}`,   color: "text-blue-600 font-bold" },
                    { label: "🔁 Redeploy Revenue", value: `₹${(liveStats.redeployRevenue || 0).toLocaleString()}`, color: "text-cyan-600 font-bold" },
                    { label: "👁 Topup Revenue",    value: `₹${(liveStats.topupRevenue || 0).toLocaleString()}`,    color: "text-amber-600 font-bold" },
                    { label: "Total Revenue",       value: `₹${(liveStats.totalRevenue || 0).toLocaleString()}`,    color: "text-editorial-ink font-bold border-l-2 pl-4 border-editorial-accent" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="editorial-card bg-white p-5 shadow-sm">
                      <p className="text-[10px] uppercase tracking-widest font-bold text-editorial-muted mb-2">
                        {label}
                      </p>
                      <p className={`text-2xl font-serif italic ${color}`}>{value}</p>
                    </div>
                  ))}
                </div>

                {/* Filters & Export Control Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-lg border border-editorial-border/60 shadow-sm">
                  <div className="flex flex-wrap gap-1.5">
                    {(["all", "deploy", "redeploy", "topup"] as const).map((mode) => {
                      const isActive = paymentFilter === mode;
                      return (
                        <button
                          key={mode}
                          onClick={() => setPaymentFilter(mode)}
                          className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase transition-all duration-200 ${
                            isActive
                              ? "bg-editorial-ink text-white shadow-sm"
                              : "bg-editorial-bg text-editorial-muted hover:bg-editorial-bg/80 hover:text-editorial-ink"
                          }`}
                        >
                          {mode === "all" ? "All" : mode === "deploy" ? "🚀 Deploy" : mode === "redeploy" ? "🔁 Redeploy" : "👁 Topup"}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-2 px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white font-bold text-xs uppercase tracking-wider rounded transition-all shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export CSV
                  </button>
                </div>

                <div className="flex justify-between items-center bg-editorial-bg/10 p-4 rounded border border-editorial-border/40 text-xs">
                  <div className="text-editorial-muted">
                    Showing <span className="font-bold text-editorial-ink">{filteredPayments.length}</span> of <span className="font-bold text-editorial-ink">{payments.length}</span> total payments.
                  </div>
                  <div className="text-editorial-muted">
                    <span className="font-bold text-editorial-ink">{liveStats.activeWebsites}</span> Live Websites online.
                  </div>
                </div>

                <div className="editorial-card bg-white overflow-hidden shadow-sm">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-editorial-bg/10 text-[10px] uppercase font-bold tracking-widest text-editorial-muted border-b border-editorial-border">
                        <th className="px-6 py-4">User</th>
                        <th className="px-6 py-4">Payment ID</th>
                        <th className="px-6 py-4">Template</th>
                        <th className="px-6 py-4">Name</th>
                        <th className="px-6 py-4">Type</th>
                        <th className="px-6 py-4 text-right">Amount</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4 text-center">Views Added</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-editorial-border">
                      {filteredPayments.length === 0 && (
                        <tr>
                          <td colSpan={8} className="px-6 py-12 text-center text-editorial-muted text-sm italic">
                            No matching payments found.
                          </td>
                        </tr>
                      )}
                      {filteredPayments.map((p) => {
                        const pType = (p.paymentType || p.type || "deploy").toLowerCase().trim();
                        const viewsAdded = p.viewsAdded;
                        
                        // Join with invites collection to backfill on-the-fly dynamically
                        const matchedInvite = invites.find(i => i.id === p.invitationId || i.id === p.inviteId || i.userId === p.userId && (i.templateId === p.templateId || i.template === p.templateId));
                        
                        const displayEmail = p.email || matchedInvite?.email || p.userId || "Unknown";
                        const slug = p.slug || matchedInvite?.slug || "";
                        const formattedSlug = slug ? (slug.startsWith("/") ? slug : `/${slug}`) : "";
                        
                        const rawTemplateId = p.templateId || matchedInvite?.templateId || matchedInvite?.template || "minimal";
                        const templateName = p.templateName || (rawTemplateId ? getTemplateName(rawTemplateId) : "Minimalist");

                        const brideName = p.brideName || matchedInvite?.brideName || matchedInvite?.draftData?.brideName || "";
                        const groomName = p.groomName || matchedInvite?.groomName || matchedInvite?.draftData?.groomName || "";
                        const coupleNames = (brideName && groomName) ? `${brideName} & ${groomName}` : (p.siteTitle || matchedInvite?.draftData?.heroTitle || "—");

                        return (
                          <tr key={p.id} className="hover:bg-editorial-bg/20 transition-colors">
                            <td className="px-6 py-4">
                              <p className="text-sm font-semibold text-editorial-ink">
                                {displayEmail}
                              </p>
                              {formattedSlug && (
                                <p className="text-[10px] text-editorial-muted font-mono bg-editorial-bg/60 px-1.5 py-0.5 rounded inline-block mt-1">
                                  {formattedSlug}
                                </p>
                              )}
                            </td>
                            <td className="px-6 py-4 text-xs font-mono text-editorial-accent">
                              {p.razorpayPaymentId || "—"}
                            </td>
                            <td className="px-6 py-4 text-xs font-semibold capitalize text-editorial-ink">
                              {templateName}
                            </td>
                            <td className="px-6 py-4 text-xs italic font-medium text-editorial-ink">
                              {coupleNames}
                            </td>
                            <td className="px-6 py-4 text-xs">
                              {pType === "redeploy" ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold tracking-wider rounded-full bg-cyan-100 text-cyan-800 uppercase">
                                  🔁 REDEPLOY
                                </span>
                              ) : pType === "topup" ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold tracking-wider rounded-full bg-amber-100 text-amber-800 uppercase">
                                  👁 TOPUP
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold tracking-wider rounded-full bg-blue-100 text-blue-800 uppercase">
                                  🚀 DEPLOY
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm font-bold text-right text-editorial-ink">
                              ₹{p.amount || 0}
                            </td>
                            <td className="px-6 py-4 text-xs text-editorial-muted">
                              {formatDate(p.createdAt)}
                            </td>
                            <td className="px-6 py-4 text-xs font-bold text-center text-editorial-ink">
                              {viewsAdded ? (
                                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-mono text-[10px]">
                                  +{viewsAdded.toLocaleString()}
                                </span>
                              ) : (
                                <span className="text-editorial-muted">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {/* ── IMAGES ── */}
          {tab === "images" && (
            <div className="space-y-6">
              {/* Back & Status Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-editorial-border/35 pb-4">
                <div>
                  {selectedUserId ? (
                    <button
                      onClick={() => setSelectedUserId(null)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-editorial-accent hover:text-editorial-ink transition-colors bg-editorial-bg px-2.5 py-1.5 rounded border border-editorial-border/40"
                    >
                      ← Back to Users
                    </button>
                  ) : (
                    <p className="text-sm text-editorial-muted">
                      Displaying user-uploaded assets grouped by user profiles.
                    </p>
                  )}
                </div>

                {isBackfillingImages && (
                  <div className="flex items-center gap-2 text-xs text-editorial-accent bg-editorial-bg px-3 py-1.5 rounded font-mono animate-pulse border border-editorial-border/30">
                    <span className="w-2 h-2 rounded-full bg-editorial-accent animate-ping" />
                    Synchronizing assets...
                  </div>
                )}
              </div>

              {!selectedUserId ? (
                /* STEP 1: USER LIST VIEW */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groupedUsers.map((usr) => {
                    const initials = (usr.email || "U").trim().substring(0, 2).toUpperCase();
                    const coupleNames = (usr.brideName && usr.groomName) 
                      ? `${usr.brideName} & ${usr.groomName}` 
                      : "";
                    const displayName = coupleNames || usr.email.split("@")[0] || "Anonymous User";

                    return (
                      <div 
                        key={usr.userId} 
                        className="editorial-card bg-white p-6 hover:shadow-lg transition-all duration-300 flex flex-col justify-between group border border-editorial-border/45 hover:border-editorial-accent/40 animate-fadeIn"
                      >
                        <div className="space-y-4">
                          {/* Profile image / Monogram */}
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-stone-100 to-amber-50 flex items-center justify-center border border-editorial-border/50 font-serif italic text-lg text-editorial-ink font-bold shadow-xs group-hover:scale-105 transition-transform duration-300">
                              {initials}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-serif italic text-xl text-editorial-ink leading-tight truncate" title={displayName}>
                                {displayName}
                              </h4>
                              <p className="text-xs text-editorial-muted font-mono truncate mt-0.5" title={usr.email}>
                                {usr.email}
                              </p>
                            </div>
                          </div>

                          {/* Stats List */}
                          <div className="space-y-2 pt-2 border-t border-editorial-border/20 text-xs font-mono">
                            <div className="flex justify-between items-center">
                              <span className="text-editorial-muted text-[10px] uppercase tracking-wider">Deploys:</span>
                              <span className="font-bold text-editorial-ink text-sm">{usr.deployCount}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-editorial-muted text-[10px] uppercase tracking-wider">Images:</span>
                              <span className="font-bold text-editorial-ink text-sm">{usr.imageCount}</span>
                            </div>
                          </div>

                          {/* Templates List */}
                          <div className="space-y-1">
                            <span className="text-[10px] text-editorial-muted uppercase tracking-wider font-mono block">Templates:</span>
                            <div className="flex flex-wrap gap-1">
                              {usr.templates.size > 0 ? (
                                Array.from(usr.templates).map((tmpl, idx) => (
                                  <span 
                                    key={idx} 
                                    className="text-[10px] font-semibold text-editorial-accent uppercase tracking-wider px-2 py-0.5 bg-editorial-bg rounded border border-editorial-border/20"
                                  >
                                    {tmpl}
                                  </span>
                                ))
                              ) : (
                                <span className="text-[10px] text-editorial-muted italic">No template info</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="pt-6 mt-auto">
                          <button
                            onClick={() => {
                              setSelectedUserId(usr.userId);
                              setImageSubFilter("ALL");
                            }}
                            className="w-full text-center py-2.5 px-4 rounded text-xs font-semibold bg-editorial-ink hover:bg-neutral-800 text-white transition-all shadow-sm group-hover:shadow uppercase tracking-wider font-mono"
                          >
                            View Images
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {groupedUsers.length === 0 && (
                    <div className="col-span-full text-center py-24 text-editorial-muted text-sm italic bg-emerald-50/10 border-2 border-dashed border-editorial-border/40 rounded-xl">
                      No active users with uploaded images discovered yet. Wait for deployments or trigger backfill.
                    </div>
                  )}
                </div>
              ) : (
                /* STEP 2: INDIVIDUAL DEPLOYED IMAGES ROW WITH FILTERS */
                <div className="space-y-6">
                  {/* Selected User Header Card */}
                  {(() => {
                    const selUser = groupedUsers.find(u => u.userId === selectedUserId);
                    const selUserEmail = selUser?.email || "Unknown User";
                    const selUserCouple = (selUser?.brideName && selUser?.groomName) 
                      ? `${selUser.brideName} & ${selUser.groomName}` 
                      : "";
                    const displayTitle = selUserCouple || selUserEmail.split("@")[0];

                    const userAllImages = adminImages.filter((img) => (img.userId || "anonymous") === selectedUserId);
                    const deployImagesCount = userAllImages.filter(img => (img.source || "").toLowerCase() === "deploy").length;
                    const redeployImagesCount = userAllImages.filter(img => (img.source || "").toLowerCase() === "redeploy").length;
                    const totalImagesCount = userAllImages.length;

                    return (
                      <div className="bg-white p-6 rounded-lg border border-editorial-border/40 space-y-4">
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                          <div>
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-full bg-editorial-dark flex items-center justify-center font-serif italic text-base text-white font-bold">
                                {(selUserEmail || "U").substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <h3 className="font-serif italic text-2xl text-editorial-ink leading-tight">{displayTitle}</h3>
                                <p className="text-xs text-editorial-muted font-mono">{selUserEmail}</p>
                              </div>
                            </div>
                          </div>

                          {/* Sub Filtering Tabs */}
                          <div className="flex flex-wrap gap-1 bg-editorial-bg p-1 rounded-lg border border-editorial-border/40 self-stretch lg:self-auto justify-start lg:justify-end">
                            {(["ALL", "DEPLOY", "REDEPLOY", "HERO", "GALLERY", "BACKGROUND"] as const).map((flt) => (
                              <button
                                key={flt}
                                onClick={() => setImageSubFilter(flt)}
                                className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${
                                  imageSubFilter === flt
                                    ? "bg-white text-editorial-ink shadow-sm border border-editorial-border/40"
                                    : "text-editorial-muted hover:text-editorial-ink hover:bg-white/40"
                                }`}
                              >
                                {flt}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Counts Grid: Name, Email, Deploy count, Redeploy count, Image count */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                          <div className="bg-editorial-bg p-3 rounded border border-editorial-border/10">
                            <span className="block text-[10px] text-editorial-muted font-mono uppercase tracking-wider leading-none">Deploy Count</span>
                            <span className="font-serif italic text-xl font-bold text-editorial-ink mt-1.5 block">{deployImagesCount}</span>
                          </div>
                          <div className="bg-editorial-bg p-3 rounded border border-editorial-border/10">
                            <span className="block text-[10px] text-editorial-muted font-mono uppercase tracking-wider leading-none">Redeploy Count</span>
                            <span className="font-serif italic text-xl font-bold text-editorial-ink mt-1.5 block">{redeployImagesCount}</span>
                          </div>
                          <div className="bg-editorial-bg p-3 rounded border border-editorial-border/10">
                            <span className="block text-[10px] text-editorial-muted font-mono uppercase tracking-wider leading-none">Image Count</span>
                            <span className="font-serif italic text-xl font-bold text-editorial-ink mt-1.5 block">{totalImagesCount}</span>
                          </div>
                          <div className="bg-editorial-bg p-3 rounded border border-editorial-border/10">
                            <span className="block text-[10px] text-editorial-muted font-mono uppercase tracking-wider leading-none">Templates Used</span>
                            <span className="font-mono text-[11px] text-editorial-accent font-semibold mt-1.5 block truncate" title={selUser ? Array.from(selUser.templates).join(", ") : ""}>
                              {selUser ? Array.from(selUser.templates).join(", ") || "None" : "None"}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Images Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {selectedUserImages.map((img) => {
                      const coupleNames = (img.coupleNames || img.brideName && img.groomName) 
                        ? `${img.brideName} & ${img.groomName}` 
                        : img.siteTitle || "Unnamed Couple";
                      const dateStr = img.uploadedAt 
                        ? (img.uploadedAt.toDate ? img.uploadedAt.toDate().toLocaleDateString() : new Date(img.uploadedAt).toLocaleDateString())
                        : "—";

                      return (
                        <div key={img.id} className="editorial-card bg-white overflow-hidden group flex flex-col justify-between hover:shadow-lg transition-all duration-300">
                          <div>
                            {/* Image Preview Container */}
                            <div className="aspect-square bg-editorial-bg overflow-hidden relative border-b border-editorial-border/30">
                              <img
                                src={img.previewUrl || img.imageUrl || "https://images.unsplash.com/photo-1544124499-58912cbddaad?auto=format&fit=crop&q=80&w=800"}
                                alt={img.fileName || "uploaded user asset"}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                loading="lazy"
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1544124499-58912cbddaad?auto=format&fit=crop&q=80&w=800";
                                }}
                              />
                              {/* Image Type Badge */}
                              <span className="absolute top-2 left-2 text-[10px] uppercase font-bold tracking-wider bg-black/75 text-white/95 px-2 py-0.5 rounded shadow">
                                {img.imageType || "General"}
                              </span>
                              {/* Deploy / Redeploy Badge */}
                              <span className={`absolute top-2 right-2 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded shadow text-white ${
                                (img.source || "").toLowerCase() === "redeploy" ? "bg-amber-600" : "bg-teal-600"
                              }`}>
                                {(img.source || "").toLowerCase() === "redeploy" ? "🔁 REDEPLOY" : "🌐 DEPLOY"}
                              </span>
                            </div>

                            {/* Text and Details */}
                            <div className="p-4 space-y-2">
                              <h4 className="font-serif italic text-base text-editorial-ink leading-tight truncate" title={coupleNames}>
                                {coupleNames}
                              </h4>
                              <p className="text-[11px] font-semibold text-editorial-accent uppercase tracking-wider truncate">
                                {img.templateName || "Minimalist"}
                              </p>
                              <div className="space-y-0.5 pt-1 border-t border-editorial-border/30 font-mono text-[10px] text-editorial-muted">
                                <span className="block truncate font-medium text-editorial-ink" title={img.fileName}>{img.fileName}</span>
                                <span>{dateStr}</span>
                              </div>
                            </div>
                          </div>

                          {/* Card actions */}
                          <div className="px-4 pb-4 pt-1 flex items-center justify-between gap-2 border-t border-editorial-border/20 mt-auto bg-editorial-bg/10">
                            {/* Preview button */}
                            <a
                              href={img.imageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 text-center py-1.5 px-3 rounded text-xs font-semibold bg-editorial-bg hover:bg-editorial-border text-editorial-ink transition-colors"
                            >
                              Preview
                            </a>
                            {/* Delete button */}
                            <button
                              onClick={() => handleDeleteImage(img.id)}
                              className="py-1.5 px-2.5 rounded text-xs font-semibold bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                              title="Delete image metadata record"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {selectedUserImages.length === 0 && (
                      <div className="col-span-full text-center py-16 bg-editorial-bg/30 border border-dashed border-editorial-border/40 rounded-xl space-y-3 flex flex-col items-center justify-center">
                        <p className="text-sm font-serif italic text-editorial-muted">
                          {imageSubFilter === "REDEPLOY" 
                            ? "No redeploy images yet" 
                            : `No ${imageSubFilter.toLowerCase()} images yet`}
                        </p>
                        <button
                          onClick={() => setImageSubFilter("ALL")}
                          className="inline-flex items-center justify-center text-xs font-semibold bg-editorial-ink hover:bg-neutral-800 text-white px-4 py-2 rounded transition-all font-mono uppercase tracking-wider"
                        >
                          Back to ALL
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── TEMPLATES ── */}
          {tab === "templates" && (
            <TemplatesManager 
              invites={invites} 
              dbTemplates={dbTemplates}
              prices={prices}
              setPrices={setPrices}
              editing={editing}
              setEditing={setEditing}
              saving={saving}
              onSavePrice={savePrice}
            />
          )}

        </div>
      </main>
    </div>
  );
}

/* ── Reusable Invite Table ── */
function InviteTable({
  invites,
  onDelete,
  onUnpublish,
}: {
  invites: WeddingInvite[];
  onDelete: (id: string) => void;
  onUnpublish: (id: string) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-editorial-bg/10 text-[10px] uppercase font-bold tracking-widest text-editorial-muted border-b border-editorial-border">
            <th className="px-6 py-4">User</th>
            <th className="px-6 py-4">Template</th>
            <th className="px-6 py-4 text-center">Views</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4">Created</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-editorial-border">
          {invites.length === 0 && (
            <tr>
              <td colSpan={6} className="px-6 py-12 text-center text-editorial-muted text-sm">
                No invitations found.
              </td>
            </tr>
          )}
          {invites.map((site) => (
            <tr key={site.id} className="hover:bg-editorial-bg/20 transition-colors">
              <td className="px-6 py-4">
                <p className="text-sm font-semibold text-editorial-ink leading-none mb-1">
                  {site.email
                    ? site.email
                    : site.userId
                    ? site.userId.slice(0, 16) + "..."
                    : "Unknown User"}
                </p>
                <p className="text-[10px] font-mono text-editorial-accent mb-0.5">
                  /{site.slug}
                </p>
                {site.brideName && site.groomName && (
                  <p className="text-[10px] text-editorial-muted italic">
                    {site.brideName} & {site.groomName}
                  </p>
                )}
              </td>
              <td className="px-6 py-4 text-xs text-editorial-secondary capitalize">
                {site.template}
              </td>
              <td className="px-6 py-4 text-center">
                <p className="text-xs font-mono font-bold">{(site.viewsUsed || site.views || 0).toLocaleString()}</p>
                <p className="text-[9px] text-editorial-muted">limit: {site.viewsLimit || site.freeViews || 500}</p>
              </td>
              <td className="px-6 py-4">
                {(site.status === 'live' || site.published === true) ? (
                  <span className="flex items-center gap-1 text-green-600 font-bold uppercase text-[9px] tracking-widest">
                    <Check className="w-3 h-3" /> Live
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-500 font-bold uppercase text-[9px] tracking-widest">
                    <X className="w-3 h-3" /> Draft
                  </span>
                )}
              </td>
              <td className="px-6 py-4 text-xs text-editorial-muted">
                {formatDate(site.createdAt)}
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onUnpublish(site.id)}
                    title="Unpublish"
                    className="p-1.5 hover:bg-amber-50 rounded text-amber-500 transition-all"
                  >
                    <ShieldOff className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(site.id)}
                    title="Delete"
                    className="p-1.5 hover:bg-red-50 rounded text-red-400 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Templates Manager with Price Editor ── */
function TemplatesManager({ 
  invites,
  dbTemplates,
  prices,
  setPrices,
  editing,
  setEditing,
  saving,
  onSavePrice
}: { 
  invites: WeddingInvite[];
  dbTemplates: any[];
  prices: Record<string, string>;
  setPrices: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  editing: string | null;
  setEditing: React.Dispatch<React.SetStateAction<string | null>>;
  saving: string | null;
  onSavePrice: (id: string) => Promise<void>;
}) {
  return (
    <div className="space-y-6">
      <p className="text-sm text-editorial-muted text-center max-w-2xl mx-auto">
        Set publish price per template. Saved to Firestore — applies immediately at checkout.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dbTemplates.length === 0 && (
          <div className="col-span-full py-20 text-center editorial-card bg-white border-dashed border-2">
            <Layout className="w-12 h-12 text-editorial-muted mx-auto mb-4 opacity-20" />
            <p className="text-editorial-muted font-serif italic text-lg">No templates available yet.</p>
          </div>
        )}
        {dbTemplates.map((tmpl) => {
          const count     = invites.filter((i) => i.template === tmpl.id).length;
          const isEditing = editing === tmpl.id;
          const isSaving  = saving  === tmpl.id;

          return (
            <div key={tmpl.id} className="editorial-card bg-white p-6 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs font-bold uppercase tracking-widest text-editorial-muted">
                  {tmpl.name || tmpl.id}
                </span>
                <div className="p-2 rounded-full bg-editorial-bg">
                  <Layout className="w-4 h-4 text-editorial-accent" />
                </div>
              </div>

              {tmpl.thumbnail && tmpl.thumbnail.trim() !== "" && (
                <div className="mb-6 h-32 rounded-xl overflow-hidden bg-editorial-bg border border-editorial-border/30">
                  <img src={tmpl.thumbnail} alt={tmpl.name} className="w-full h-full object-cover" />
                </div>
              )}

              <div className="flex items-baseline gap-2 mb-6">
                <p className="text-4xl font-serif italic">{count}</p>
                <p className="text-[10px] text-editorial-muted uppercase tracking-widest font-bold">
                  active uses
                </p>
              </div>

              <div className="pt-6 border-t border-editorial-border">
                <p className="text-[10px] uppercase tracking-widest font-bold text-editorial-muted mb-2">
                  Publish Price
                </p>
                {isEditing ? (
                  <div className="flex items-center gap-2 border border-editorial-accent rounded-lg px-3 py-2 bg-editorial-bg shadow-inner">
                    <span className="text-lg font-bold text-editorial-muted">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={prices[tmpl.id] ?? tmpl.publishPrice ?? "499"}
                      onChange={(e) =>
                        setPrices((prev) => ({ ...prev, [tmpl.id]: e.target.value }))
                      }
                      className="w-full text-lg font-serif focus:outline-none bg-transparent"
                      autoFocus
                    />
                  </div>
                ) : (
                  <p className="text-3xl font-serif italic text-editorial-accent">
                    ₹{prices[tmpl.id] ?? tmpl.publishPrice ?? "499"}
                  </p>
                )}
              </div>

              <div className="mt-8 flex gap-3">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => onSavePrice(tmpl.id)}
                      disabled={isSaving}
                      className="flex-1 py-2.5 text-[10px] font-bold uppercase tracking-widest bg-editorial-ink text-white rounded-lg hover:bg-black transition-all disabled:opacity-50 shadow-sm"
                    >
                      {isSaving ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      onClick={() => setEditing(null)}
                      className="flex-1 py-2.5 text-[10px] font-bold uppercase tracking-widest border border-editorial-border rounded-lg hover:bg-editorial-bg transition-all"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setEditing(tmpl.id)}
                      className="flex-1 py-2.5 text-[10px] font-bold uppercase tracking-widest border border-editorial-border rounded-lg hover:bg-editorial-bg transition-all"
                    >
                      Edit Price
                    </button>
                    <button className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-widest border rounded transition-all ${
                      tmpl.enabled !== false 
                        ? "border-green-100 text-green-600 hover:bg-green-50" 
                        : "border-red-100 text-red-600 hover:bg-red-50"
                    }`}>
                      {tmpl.enabled !== false ? "Enabled" : "Disabled"}
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}