import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { getTemplateById } from "../templates";

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
          setError("Invitation not found");
        }
      } catch (err) {
        setError("Failed to load invitation");
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
      <p className="text-gray-500">{error || "Invitation not found"}</p>
    </div>
  );

  if (invite.views >= 500) return (
    <div className="min-h-screen flex items-center justify-center text-center p-8">
      <div>
        <h2 className="text-2xl font-serif mb-2">This invitation has expired</h2>
        <p className="text-gray-500">Contact the host for more information.</p>
      </div>
    </div>
  );

  const templateConfig = getTemplateById(invite.template);
  const TemplateComponent = templateConfig?.component;

  if (!TemplateComponent) return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Template not found</p>
    </div>
  );

  return (
    <TemplateComponent
      brideName={invite.brideName || ""}
      groomName={invite.groomName || ""}
      date={invite.weddingDate || ""}
      venue={invite.location || ""}
      venueAddress={invite.venueAddress}
      venueCity={invite.venueCity}
      googleMapsLink={invite.googleMapsLink}
      googleMapsEmbedUrl={invite.googleMapsLink}
      coordinates={invite.coordinates}
      story={invite.story}
      enable3D={invite.enable3D}
      enableEnvelope={invite.enableEnvelope}
      coverImage={invite.coverImage}
      events={invite.events || []}
      galleryImages={invite.galleryImages || []}
      deity={invite.deity}
      eventName={invite.eventName}
      muhurtham={invite.muhurtham}
      family={invite.family}
      hosts={{ primary: invite.brideName || "", secondary: invite.groomName || "" }}
      address={invite.venueAddress || invite.location}
      image={invite.coverImage}
    />
  );
}
