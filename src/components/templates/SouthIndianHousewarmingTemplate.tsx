import React, { useState, useEffect } from 'react';
import { TraditionalDoor } from './DoorAnimation';
import { GaneshSymbol, FloralArch } from './HousewarmingDecorations';
import MapPreview from '../MapPreview';
import TemplateImage from '../TemplateImage';
import { formatWeddingDate, formatWeddingTime } from "../../lib/dateUtils";

interface HousewarmingTemplateProps {
  title?: string;
  deity?: string;
  eventName?: string;
  hosts?: {
    primary: string;
    secondary: string;
  };
  date?: string;
  muhurtham?: string;
  additionalEvent?: {
    date: string;
    details: string[];
  };
  address?: string;
  family?: string;
  image?: string;
  galleryImages?: string[];
  enableEnvelope?: boolean;
  events?: { name: string; date: string; time: string; location: string; image?: string | any }[];
  googleMapsEmbedUrl?: string;
  googleMapsLink?: string;
  coordinates?: string;
  venueAddress?: string;
  isEditable?: boolean;
  onImageEdit?: (target: string, index?: number) => void;
}

export default function SouthIndianHousewarmingTemplate({
  deity = "Lord Venkateswara",
  eventName = "Gruha Pravesh",
  hosts = {
    primary: "Chodapaneedi Venkateswara Rao",
    secondary: "Anantha Satyavathi"
  },
  date = "2026-03-05",
  muhurtham = "02:43",
  additionalEvent,
  address = "Maruthi Center, Kothapeta, Konaseema District, AP",
  family = "Chodapaneedi Family",
  image = "",
  galleryImages = [],
  enableEnvelope = true,
  events = [],
  googleMapsEmbedUrl = "",
  googleMapsLink = "",
  coordinates = "",
  venueAddress = "",
  isEditable = false,
  onImageEdit,
}: HousewarmingTemplateProps) {
  const [isOpenedManual, setIsOpenedManual] = useState(false);
  
  // If envelope is disabled, we treat it as "opened"
  const isOpen = !enableEnvelope || isOpenedManual;

  const displayEvents = events.length > 0 ? events : [
    { name: eventName, date: date, time: muhurtham, location: address },
    { name: "Satyanarayana Vratham", date: date, time: "12:00", location: address }
  ];

  useEffect(() => {
    if (enableEnvelope) {
      const timer = setTimeout(() => setIsOpenedManual(true), 300);
      return () => clearTimeout(timer);
    }
  }, [enableEnvelope]);

  return (
    <div className="min-h-screen flex items-center justify-center p-0 sm:p-4 font-serif relative overflow-hidden bg-neutral-900">
      <style>{`
        @keyframes swing {
          0%, 100% { transform: rotate(-3deg); }
          50% { transform: rotate(3deg); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(25px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in-up { animation: fadeInUp 0.8s ease-out forwards; opacity: 0; }
        .animate-scale-in { animation: scaleIn 1s ease-out forwards; opacity: 0; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      
      <div className="relative w-full max-w-2xl min-h-[100dvh] sm:min-h-[95vh] flex justify-center" style={{ perspective: '1800px' }}>
        <TraditionalDoor side="left" isOpen={isOpen} />
        <TraditionalDoor side="right" isOpen={isOpen} />

        <div className="relative w-full h-full bg-gradient-to-b from-[#FFFDF5] via-[#FFF9E6] to-[#FFFDF5] sm:rounded-xl shadow-2xl overflow-hidden flex flex-col z-0">
          <FloralArch />

          <div className="relative z-10 flex-1 px-4 sm:px-28 pt-24 sm:pt-36 pb-4 text-center flex flex-col items-center overflow-y-auto overflow-x-hidden no-scrollbar">
            
            <div className="relative flex items-center justify-center mb-4 mt-2">
               <GaneshSymbol className="w-20 h-20 sm:w-32 sm:h-32 text-red-800 drop-shadow-md animate-fade-in-up [animation-delay:1.5s]" />
            </div>
            
            <p className="text-amber-800 text-sm sm:text-base italic tracking-wide font-semibold animate-fade-in-up [animation-delay:1.5s]">
              With the divine blessings of
            </p>
            <h2 className="text-xl sm:text-3xl font-bold text-red-900 mb-6 animate-fade-in-up [animation-delay:1.5s]">
              .. {deity} ..
            </h2>

            <p className="text-red-900 text-base sm:text-xl mb-1 animate-fade-in-up [animation-delay:1.7s]">
              We are delighted to invite you to the
            </p>

            <div className="my-3 relative animate-scale-in [animation-delay:1.9s]">
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-[#b45309] via-[#d97706] to-[#78350f] filter drop-shadow-sm uppercase tracking-widest pb-1">
                {eventName}
              </h1>
              <p className="text-red-800 tracking-[0.2em] text-lg sm:text-xl mt-1 font-bold">
                CEREMONY
              </p>
              <p className="text-amber-800 italic mt-2 font-medium">.. of our new home ..</p>
            </div>

            <div className="w-full flex justify-center my-5 animate-fade-in-up [animation-delay:2.1s]">
               <div className="h-px w-3/4 bg-gradient-to-r from-transparent via-amber-600 to-transparent relative">
                  <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 rotate-45 bg-amber-600"></div>
               </div>
            </div>

            <div className="my-4 animate-fade-in-up [animation-delay:2.1s]">
              <h2 className="text-lg sm:text-2xl md:text-3xl text-red-900 font-bold mb-1">
                {hosts.primary}
              </h2>
              <p className="text-amber-600 text-lg font-serif italic mb-1">&</p>
              <h2 className="text-lg sm:text-2xl md:text-3xl text-red-900 font-bold">
                {hosts.secondary}
              </h2>
              <p className="text-red-800 mt-4 text-sm sm:text-lg max-w-md mx-auto leading-relaxed">
                cordially invite you & your family <br/>
                to grace the ceremony with your presence & blessings.
              </p>
            </div>

            <div className="w-full my-6 flex flex-col gap-6 animate-fade-in-up [animation-delay:2.3s]">
              {displayEvents.map((event, idx) => (
                <div key={idx} className="bg-white/60 backdrop-blur-sm border border-amber-200 shadow-sm rounded-xl p-4 relative overflow-hidden">
                  <div className="w-full aspect-video rounded-lg overflow-hidden mb-4 shadow-sm border border-amber-100">
                    <TemplateImage
                      image={event.image}
                      alt={event.name}
                      className="w-full h-full"
                      isEditable={isEditable}
                      onEdit={() => onImageEdit?.("event", idx)}
                    />
                  </div>
                  <div className="flex items-center justify-center gap-3 mb-2">
                     <span className="h-px w-8 bg-amber-400"></span>
                     <h3 className="text-base sm:text-xl font-bold text-red-900">{event.name}: {formatWeddingDate(event.date || date)}</h3>
                     <span className="h-px w-8 bg-amber-400"></span>
                  </div>
                  <p className="text-amber-900 font-bold text-base sm:text-lg">{formatWeddingTime(event.time || muhurtham)}</p>
                  {event.location && event.location !== address && (
                    <p className="text-red-800 text-xs italic">Venue: {event.location}</p>
                  )}
                </div>
              ))}
            </div>

            {address && (
              <div className="mb-6 animate-fade-in-up [animation-delay:2.5s] w-full bg-amber-100/50 rounded-lg p-4 border border-amber-200/60 shadow-inner text-center">
                <h3 className="text-[10px] font-bold text-amber-800 mb-1 uppercase tracking-wider">Address</h3>
                <p className="text-red-900 font-semibold text-sm sm:text-lg leading-snug">
                  {address.split(',').map((part, i) => (
                    <React.Fragment key={i}>
                      {part.trim()}{i < address.split(',').length - 1 ? <br/> : null}
                    </React.Fragment>
                  ))}
                </p>
              </div>
            )}

            {/* Universal Map Preview */}
            <div className="w-full animate-fade-in-up [animation-delay:2.6s]">
              <MapPreview mapInput={googleMapsEmbedUrl || coordinates || googleMapsLink || venueAddress || address} />
            </div>

            {/* Photo Gallery Section */}
            {galleryImages && galleryImages.length > 0 && (
              <div className="w-full mt-12 px-4 animate-fade-in-up [animation-delay:2.6s]">
                <div className="flex flex-col items-center mb-6">
                  <div className="h-px w-24 bg-gradient-to-r from-transparent via-amber-400 to-transparent mb-2"></div>
                  <h3 className="text-2xl font-bold text-red-900 uppercase tracking-widest flex items-center gap-2">
                     Memories
                  </h3>
                  <div className="h-px w-24 bg-gradient-to-r from-transparent via-amber-400 to-transparent mt-2"></div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {galleryImages.map((img: any, idx: number) => (
                    <div 
                      key={idx} 
                      className="group relative aspect-[4/3] rounded-2xl overflow-hidden border-4 border-white shadow-lg transform transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl"
                    >
                      <TemplateImage 
                        image={img} 
                        alt={`Gallery ${idx + 1}`}
                        className="w-full h-full transition-transform duration-700 group-hover:scale-110"
                        isEditable={isEditable}
                        onEdit={() => onImageEdit?.("gallery", idx)}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-red-900/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      {/* Decorative Corner */}
                      <div className="absolute bottom-2 right-2 w-8 h-8 opacity-60">
                        <div className="absolute bottom-0 right-0 w-full h-1 bg-amber-400"></div>
                        <div className="absolute bottom-0 right-0 w-1 h-full bg-amber-400"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-6 space-y-2 animate-fade-in-up [animation-delay:2.7s]">
               <p className="text-red-900 italic text-sm sm:text-lg font-medium">
                 Your gracious presence and valuable blessings <br/>
                 will make our celebration complete.
               </p>
            </div>

            <div className="mb-4 animate-fade-in-up [animation-delay:2.7s]">
              <p className="text-amber-800 text-[10px] sm:text-sm uppercase tracking-wider mb-1">With love & regards,</p>
              <h2 className="text-xl sm:text-3xl text-red-900 font-bold font-serif">
                {family}
              </h2>
            </div>

          </div>

          {/* Traditional South Indian Family Illustration */}
          <div className="relative w-full h-[300px] sm:h-[420px] md:h-[650px] mt-auto z-0 animate-fade-in-up [animation-delay:2.9s] shrink-0 overflow-hidden bg-[#f3e2c7]">
             {/* Top Fade for smooth blend */}
             <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#FFF8E7] to-transparent z-20 pointer-events-none"></div>
             
             {/* Warm Tone Overlay */}
             <div className="absolute inset-0 bg-amber-50/20 pointer-events-none z-15" />

             <div className="absolute inset-0 z-10 overflow-hidden flex items-end justify-center">
               <TemplateImage 
                 image={image} 
                 alt="South Indian Housewarming Scene" 
                 className="w-full h-full object-bottom"
                 isEditable={isEditable}
                 onEdit={() => onImageEdit?.("cover")}
               />
             </div>
             
             {/* Fallback Message */}
             <div className="absolute inset-0 flex flex-col items-center justify-center text-red-800 font-bold italic z-0 p-8 text-center bg-amber-100 hidden">
                <p className="text-lg">Error loading image.</p>
                <p className="text-sm mt-2 font-medium">Please check the image link or try uploading again.</p>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}
