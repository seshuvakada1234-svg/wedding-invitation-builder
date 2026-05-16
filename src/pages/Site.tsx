import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { getTemplateById } from "../templates";
import SEO from "../components/SEO";
import LoadingScreen from "../components/LoadingScreen";
import ErrorScreen from "../components/ErrorScreen";
import { db } from "../lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { Eye } from "lucide-react";
import { trackInvitationView } from "../lib/viewTracker";

export default function Site() {
  const { id: slugOrId } = useParams<{ id: string }>();
  const [invite, setInvite] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slugOrId) return;

    // Use query to find by slug OR id
    const q = query(collection(db, "invites"), where("slug", "==", slugOrId));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const data = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
        setInvite(data);
        // Track unique session view
        trackInvitationView(data.id);
      } else {
        setError("Story not found");
      }
      setLoading(false);
    }, (err) => {
      console.error("Firestore error:", err);
      setError("Unable to load invitation");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [slugOrId]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
    </div>
  );

  if (error || !invite) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">{error || "Story not found"}</p>
    </div>
  );

  if (invite.limitExceeded || (invite.viewsUsed || 0) >= (invite.viewsLimit || 500)) return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-8 bg-editorial-bg">
      <div className="max-w-md bg-white p-12 rounded-[40px] shadow-2xl editorial-card border border-editorial-border/30">
        <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-8">
           <Eye className="w-10 h-10 text-red-500 opacity-20" />
        </div>
        <h2 className="text-3xl font-serif italic mb-4">Celebration Limit Reached</h2>
        <p className="text-editorial-muted mb-8 text-sm leading-relaxed">
          This cinematic invitation has reached its allocated audience capacity. 
          If you are the host, please visit your dashboard to top up views and keep your celebration accessible.
        </p>
        <div className="space-y-4">
          <p className="text-[10px] uppercase tracking-widest font-bold text-red-500">
            Audience Capacity Exhausted
          </p>
          <div className="h-px w-12 bg-editorial-border mx-auto" />
        </div>
      </div>
    </div>
  );

  // ── Separation: Public Site ALWAYS uses publishedData ──────────────────────
  const d = invite.publishedData || invite;
  
  // Only allow viewing if live or if it's an admin/owner (but Site doesn't handle auth)
  // For now, we allow the fallback to 'invite' for legacy, but we prioritize publishedData.
  const isLive = invite.status === 'live' || invite.published === true;
  
  const currentTemplate = d.template || invite.template || 'minimal';
  const templateConfig = getTemplateById(currentTemplate);
  const TemplateComponent = templateConfig?.component;

  if (!TemplateComponent) return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Template not found</p>
    </div>
  );

  return (
    <>
      <SEO 
        title={`${d.brideName} & ${d.groomName}'s Wedding Invitation`}
        description={`You are cordially invited to celebrate the wedding of ${d.brideName} and ${d.groomName} on ${d.weddingDate}. View the cinematic story here.`}
        ogImage={typeof d.coverImage === 'string' ? d.coverImage : (d.coverImage?.url || "")}
      />
      <TemplateComponent
        brideName={d.brideName || ""}
        groomName={d.groomName || ""}
        date={d.weddingDate || ""}
        venue={d.location || ""}
        venueAddress={d.venueAddress}
        venueCity={d.venueCity}
        googleMapsLink={d.googleMapsLink}
        googleMapsEmbedUrl={d.googleMapsLink}
        coordinates={d.coordinates}
        story={d.story}
        enable3D={d.enable3D}
        enableEnvelope={d.enableEnvelope}
        coverImage={typeof d.coverImage === 'string' ? d.coverImage : (d.coverImage?.url || "")}
        events={(d.events || []).map((ev: any) => ({
          ...ev,
          image: typeof ev.image === 'string' ? ev.image : (ev.image?.url || "")
        }))}
        galleryImages={(d.galleryImages || []).map((img: any) =>
          typeof img === "string" ? img : (img?.url || "")
        )}
        deity={d.deity}
        eventName={d.eventName}
        muhurtham={d.muhurtham}
        family={d.family}
        hosts={{ primary: d.brideName || "", secondary: d.groomName || "" }}
        address={d.venueAddress || d.location}
        image={typeof d.coverImage === 'string' ? d.coverImage : (d.coverImage?.url || "")}
      />
    </>
  );
}