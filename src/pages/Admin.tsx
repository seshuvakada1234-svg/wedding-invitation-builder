/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import {
  Search, Check, X, Loader2,
  Users, Globe, CreditCard, Image, Layout, Trash2,
  ShieldOff, TrendingUp, LogOut
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
import { WeddingInvite } from "../types";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

type Tab = "overview" | "invitations" | "payments" | "images" | "templates";

interface Stats {
  totalUsers: number;
  totalInvites: number;
  totalRevenue: number;
  activeWebsites: number;
}

const TEMPLATES = [
  { id: "kerala",        label: "Kerala Wedding" },
  { id: "konaseema",     label: "Konaseema Wedding" },
  { id: "indian-royal",  label: "Indian Royal" },
  { id: "kerala-reveal", label: "Kerala Reveal" },
  { id: "south-indian",  label: "South Indian Housewarming" },
];

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

export default function Admin() {
  const [invites, setInvites] = useState<WeddingInvite[]>([]);
  const [payments, setPayments] = useState<any[]>([]); // New state for real payments
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  // Dynamic Real-time Stats
  const [liveStats, setLiveStats] = useState<Stats>({
    totalUsers: 0,
    totalInvites: 0,
    totalRevenue: 0,
    activeWebsites: 0,
  });

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (user) fetchAllInvites();
      else setLoading(false);
    });

    // 1. Live Users Count
    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      setLiveStats(prev => ({ ...prev, totalUsers: snap.size }));
    }, (err) => console.error("Users listener error:", err));

    // 2. Live Invites & Active Websites
    const unsubInvites = onSnapshot(collection(db, "invites"), (snap) => {
      const docs = snap.docs.map(d => d.data());
      setLiveStats(prev => ({
        ...prev,
        totalInvites: snap.size,
        activeWebsites: docs.filter(d => d.isPaid === true).length
      }));
      
      // Also update the local invites list for tables if we want it real-time
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

    // 3. Live Revenue & Payments History
    const qPayments = query(collection(db, "payments"), where("status", "==", "paid"));
    const unsubPayments = onSnapshot(qPayments, (snap) => {
      const revenue = snap.docs.reduce((sum, doc) => {
        const data = doc.data();
        return sum + (Number(data.amount) || 0);
      }, 0);
      setLiveStats(prev => ({ ...prev, totalRevenue: revenue }));
      
      // Update payments list
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

    return () => {
      unsubAuth();
      unsubUsers();
      unsubInvites();
      unsubPayments();
    };
  }, []);

  async function fetchAllInvites() {
    // We already have internal onSnapshot updating the list, so we could skip this 
    // but keeping it for the initial load if needed, or we can just rely on onSnapshot.
    // Let's rely on onSnapshot as it's better.
    setLoading(false);
  }

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

  return (
    <div className="flex min-h-screen bg-editorial-bg">
      {/* ── Sidebar ── */}
      <aside className="w-56 shrink-0 bg-editorial-ink text-white flex flex-col">
        <div className="px-6 py-8 border-b border-white/10">
          <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-1">
            Admin Panel
          </p>
          <h2 className="text-xl font-serif italic text-white">WedCraft</h2>
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
          {tab === "payments" && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Successful Payments", value: payments.length,                                 color: "text-green-600"      },
                  { label: "Live Websites",       value: liveStats.activeWebsites,                        color: "text-amber-500"      },
                  { label: "Total Revenue",       value: `₹${liveStats.totalRevenue.toLocaleString()}`,   color: "text-editorial-ink"  },
                ].map(({ label, value, color }) => (
                  <div key={label} className="editorial-card bg-white p-6 text-center">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-editorial-muted mb-3">
                      {label}
                    </p>
                    <p className={`text-3xl font-serif italic ${color}`}>{value}</p>
                  </div>
                ))}
              </div>

              <div className="editorial-card bg-white overflow-hidden shadow-sm">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-editorial-bg/10 text-[10px] uppercase font-bold tracking-widest text-editorial-muted border-b border-editorial-border">
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4">Payment ID</th>
                      <th className="px-6 py-4">Template</th>
                      <th className="px-6 py-4 text-right">Amount</th>
                      <th className="px-6 py-4">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-editorial-border">
                    {payments.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-editorial-muted text-sm italic">
                          No successful payments recorded yet.
                        </td>
                      </tr>
                    )}
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-editorial-bg/20 transition-colors">
                        <td className="px-6 py-4">
                          <p className="text-sm font-semibold text-editorial-ink">
                            {p.email ?? p.userId?.slice(0, 14) + "..." ?? "Unknown"}
                          </p>
                          <p className="text-[10px] text-editorial-muted font-mono">
                            {p.userId}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-xs font-mono text-editorial-accent">
                          {p.razorpayPaymentId || "—"}
                        </td>
                        <td className="px-6 py-4 text-xs capitalize">
                          {p.templateId || "minimal"}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-right">
                          ₹{p.amount || 0}
                        </td>
                        <td className="px-6 py-4 text-xs text-editorial-muted">
                          {formatDate(p.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── IMAGES ── */}
          {tab === "images" && (
            <div className="space-y-6">
              <p className="text-sm text-editorial-muted">
                Hero and gallery images uploaded by users.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {invites.filter((i) => i.heroImage).map((inv) => (
                  <div key={inv.id} className="editorial-card bg-white overflow-hidden group">
                    <div className="aspect-video bg-editorial-bg overflow-hidden">
                      <img
                        src={inv.heroImage}
                        alt="hero"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                      <div className="p-3">
                        <p className="text-xs font-semibold text-editorial-ink truncate">
                          {inv.email ?? "Unknown user"}
                        </p>
                      <p className="text-[10px] font-mono text-editorial-accent truncate">
                        /{inv.slug}
                      </p>
                    </div>
                  </div>
                ))}
                {invites.filter((i) => i.heroImage).length === 0 && (
                  <div className="col-span-4 text-center py-16 text-editorial-muted text-sm">
                    No images uploaded yet.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── TEMPLATES ── */}
          {tab === "templates" && (
            <TemplatesManager invites={invites} />
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
              <td className="px-6 py-4 text-center text-xs font-mono font-bold">
                {(site.views || 0).toLocaleString()}
              </td>
              <td className="px-6 py-4">
                {site.isPaid ? (
                  <span className="flex items-center gap-1 text-green-600 font-bold uppercase text-[9px] tracking-widest">
                    <Check className="w-3 h-3" /> Premium
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
function TemplatesManager({ invites }: { invites: WeddingInvite[] }) {
  const [prices, setPrices]   = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving]   = useState<string | null>(null);

  // Load prices from Firestore on mount
  useEffect(() => {
    async function loadPrices() {
      try {
        const defaults: Record<string, string> = {};
        TEMPLATES.forEach((t) => { defaults[t.id] = "499"; });

        // Fetch each template document
        const promises = TEMPLATES.map(t => getDoc(doc(db, "templates", t.id)));
        const snaps = await Promise.all(promises);

        snaps.forEach((snap, idx) => {
          if (snap.exists()) {
            const data = snap.data();
            defaults[TEMPLATES[idx].id] = data.publishPrice?.toString() ?? "499";
          }
        });

        setPrices(defaults);
      } catch (e) {
        console.error("Failed to load prices", e);
      }
    }
    loadPrices();
  }, []);

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

  return (
    <div className="space-y-6">
      <p className="text-sm text-editorial-muted">
        Set publish price per template. Saved to Firestore — applies immediately at checkout.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {TEMPLATES.map((tmpl) => {
          const count     = invites.filter((i) => i.template === tmpl.id).length;
          const isEditing = editing === tmpl.id;
          const isSaving  = saving  === tmpl.id;

          return (
            <div key={tmpl.id} className="editorial-card bg-white p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-widest text-editorial-muted">
                  {tmpl.label}
                </span>
                <Layout className="w-4 h-4 text-editorial-accent" />
              </div>

              {/* Active uses */}
              <p className="text-2xl font-serif italic mb-1">{count}</p>
              <p className="text-[10px] text-editorial-muted uppercase tracking-widest mb-4">
                active uses
              </p>

              {/* ✅ Price editor */}
              <div className="mb-4">
                <p className="text-[10px] uppercase tracking-widest font-bold text-editorial-muted mb-1.5">
                  Publish Price
                </p>
                {isEditing ? (
                  <div className="flex items-center gap-1 border border-editorial-accent rounded px-2 py-1.5">
                    <span className="text-sm font-bold text-editorial-muted">₹</span>
                    <input
                      type="number"
                      min="0"
                      value={prices[tmpl.id] ?? "499"}
                      onChange={(e) =>
                        setPrices((prev) => ({ ...prev, [tmpl.id]: e.target.value }))
                      }
                      className="w-full text-sm font-bold focus:outline-none"
                      autoFocus
                    />
                  </div>
                ) : (
                  <p className="text-2xl font-serif italic text-editorial-accent">
                    ₹{prices[tmpl.id] ?? "499"}
                  </p>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => savePrice(tmpl.id)}
                      disabled={isSaving}
                      className="flex-1 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-editorial-ink text-white rounded hover:opacity-90 transition-all disabled:opacity-50"
                    >
                      {isSaving ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={() => setEditing(null)}
                      className="flex-1 py-1.5 text-[10px] font-bold uppercase tracking-widest border border-editorial-border rounded hover:bg-editorial-bg transition-all"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setEditing(tmpl.id)}
                      className="flex-1 py-1.5 text-[10px] font-bold uppercase tracking-widest border border-editorial-border rounded hover:bg-editorial-bg transition-all"
                    >
                      Edit Price
                    </button>
                    <button className="flex-1 py-1.5 text-[10px] font-bold uppercase tracking-widest border border-red-200 text-red-500 rounded hover:bg-red-50 transition-all">
                      Disable
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