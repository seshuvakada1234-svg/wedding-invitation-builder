import { useParams } from "react-router-dom";
import { templates } from "../templates";
import { WeddingInvite } from "../types";

const demoData: Partial<WeddingInvite> = {
  brideName: "Elena Sofia",
  groomName: "Marcus James",
  weddingDate: "September 24, 2026",
  location: "Lake Como",
  venueAddress: "Villa del Balbianello",
  venueCity: "Lenno, Italy",
  story: "Our journey began under the starlit sky of Rome, and now we invite you to witness the beginning of our forever.",
  events: [
    { name: "Welcome Drinks", date: "Sep 23", time: "6:00 PM", location: "Grand Hotel Tremezzo" },
    { name: "Wedding Ceremony", date: "Sep 24", time: "4:00 PM", location: "Villa del Balbianello" },
    { name: "Reception", date: "Sep 24", time: "7:00 PM", location: "Lakeside Terrace" }
  ],
  galleryImages: [
    "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1510076857177-7470076d4098?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800"
  ]
};

export default function Preview() {
  const { templateId } = useParams();
  const template = templates.find(t => t.id === templateId);

  if (!template) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-editorial-bg">
        <p className="text-editorial-muted font-serif italic text-xl">Template not found</p>
      </div>
    );
  }

  const TemplateComponent = template.component;

  return (
    <div className="min-h-screen bg-white">
      <style>{`
        body { 
          overflow-x: hidden;
          background: white;
        }
        /* Hide scrollbars for the preview */
        ::-webkit-scrollbar {
          display: none;
        }
        * {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      <TemplateComponent 
        {...(demoData as any)} 
        isPreview={true}
      />
    </div>
  );
}
