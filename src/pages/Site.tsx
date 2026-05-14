import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { getTemplateById } from "../templates";
import SEO from "../components/SEO";

export default function Site() {
  const { id } = useParams<{ id: string }>();
  const [invite, setInvite] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadInvite() {
      try {
        setLoading(true);
        const res = await fetch(`/api/get-invite?id=${id}&increment=true`);
        const result = await res.json();
        if (result.success && result.invite) {
          setInvite(result.invite);
        } else {
          setError("Story not found");
        }
      } catch (err) {
        setError("Failed to load story");
      } finally {
        setLoading(false);
      }
    }
    if (id) loadInvite();
  }, [id]);

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

  if (invite.limitExceeded) return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-8 bg-editorial-bg">
      <div className="max-w-md bg-white p-12 rounded-2xl shadow-xl editorial-card">
        <h2 className="text-3xl font-serif italic mb-4">View Limit Reached</h2>
        <p className="text-editorial-muted mb-8 text-sm leading-relaxed">
          This cinematic invitation has reached its allocated view limit. 
          If you are the host, please visit your dashboard to top up views and keep your celebration accessible.
        </p>
        <div className="space-y-4">
          <p className="text-[10px] uppercase tracking-widest font-bold text-editorial-accent">
            Current Capacity Exhausted
          </p>
          <div className="h-px w-12 bg-editorial-border mx-auto" />
        </div>
      </div>
    </div>
  );

  // ── Separation of Concerns: Site ALWAYS uses publishedData snapshot ────────
  // We only fall back to the root invite object for legacy invitations that 
  // haven't been re-saved with the new isolated state architecture.
  const d = invite.publishedData || invite.templateData || invite;
  
  // Explicitly check if we should be showing the published version
  // If the invite is marked as published, we should prefer d (which is publishedData if it exists)
  const isPublishedInv = invite.published === true;
  
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