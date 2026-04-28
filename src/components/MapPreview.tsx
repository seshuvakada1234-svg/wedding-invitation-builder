import React, { useState, useEffect } from 'react';

interface MapPreviewProps {
  mapInput?: string;
  label?: string;
}

/* ─── HELPERS ─── */
function dmsToDecimal(dms: string) {
  const parts = dms.match(/(\d+)°(\d+)'([\d.]+)"?([NSEW])/);
  if (!parts) return null;

  let degrees = parseFloat(parts[1]);
  let minutes = parseFloat(parts[2]);
  let seconds = parseFloat(parts[3]);
  let direction = parts[4];

  let decimal = degrees + minutes / 60 + seconds / 3600;
  if (direction === "S" || direction === "W") {
    decimal *= -1;
  }
  return decimal;
}

function parseDMSCoordinates(input: string) {
  const matches = input.match(/(\d+°\d+'[\d.]+"?[NS])\s*(\d+°\d+'[\d.]+"?[EW])/);
  if (!matches) return null;

  const lat = dmsToDecimal(matches[1]);
  const lng = dmsToDecimal(matches[2]);

  if (lat !== null && lng !== null) {
    return `${lat},${lng}`;
  }
  return null;
}

function cleanMapUrl(input: string) {
  if (!input) return "";
  if (input.startsWith('<iframe')) {
     const match = input.match(/src="([^"]+)"/);
     return match ? match[1] : input.trim();
  }
  const match = input.match(/https?:\/\/[^\s"]+/);
  return match ? match[0].trim() : input.trim();
}

/**
 * Universal Map Component for Invitation Templates
 * Handles: Coordinates (DMS/Decimal), Google Maps Short Links, and Address Text
 */
const MapPreview: React.FC<MapPreviewProps> = ({ mapInput = "", label = "Location" }) => {
  const [mapSrc, setMapSrc] = useState("");
  const [openLink, setOpenLink] = useState("");

  useEffect(() => {
    if (!mapInput) {
      setMapSrc("");
      setOpenLink("");
      return;
    }

    const processMap = async () => {
      const cleaned = cleanMapUrl(mapInput);
      
      // 1. Try Decimal Coordinates Regex: 16.6785, 81.9159
      const coordRegex = /(-?\d+\.\d+),\s*(-?\d+\.\d+)/;
      const dmsCoords = parseDMSCoordinates(cleaned);

      if (coordRegex.test(cleaned)) {
        const match = cleaned.match(coordRegex);
        if (match) {
          const lat = match[1];
          const lng = match[2];
          setMapSrc(`https://www.google.com/maps?q=${lat},${lng}&z=16&output=embed`);
          setOpenLink(`https://www.google.com/maps?q=${lat},${lng}`);
          return;
        }
      } 
      
      // 2. Try DMS Coordinates
      if (dmsCoords) {
        setMapSrc(`https://www.google.com/maps?q=${dmsCoords}&z=16&output=embed`);
        setOpenLink(`https://www.google.com/maps?q=${dmsCoords}`);
        return;
      }

      // 3. Handle Links vs Text
      if (cleaned.startsWith("http")) {
        // If it's a short link, we'll use it as the query for the embed
        setMapSrc(`https://www.google.com/maps?q=${encodeURIComponent(cleaned)}&z=16&output=embed`);
        setOpenLink(cleaned);
      } else {
        // Normal Address Text
        setMapSrc(`https://www.google.com/maps?q=${encodeURIComponent(cleaned)}&z=16&output=embed`);
        setOpenLink(`https://www.google.com/maps?q=${encodeURIComponent(cleaned)}`);
      }
    };

    processMap();
  }, [mapInput]);

  if (!mapInput) {
    return (
      <div className="bg-amber-50/50 rounded-xl p-8 border border-dashed border-amber-300 text-center mt-10">
        <p className="text-amber-700 italic font-medium text-sm">
          Add location to display map
        </p>
      </div>
    );
  }

  return (
    <section className="text-center mt-10 w-full px-4 sm:px-0">
      <h3 className="text-xl md:text-2xl font-serif text-red-800 mb-4 flex items-center justify-center gap-2">
         <span className="text-2xl">📍</span> {label}
      </h3>

      <div className="rounded-2xl overflow-hidden shadow-2xl border-4 border-white mx-auto w-full max-w-2xl bg-amber-50 transition-all hover:shadow-red-900/10 h-[260px] sm:h-[320px] md:h-[400px]">
        {mapSrc ? (
          <iframe
            src={mapSrc}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Venue Location"
            className="w-full h-full"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-amber-800 italic">
            Validating map link...
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-center">
        <a
          href={openLink || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-red-700 text-white px-8 py-4 rounded-full shadow-lg hover:bg-red-800 transition-all hover:scale-105 active:scale-95 font-bold text-xs sm:text-sm uppercase tracking-widest min-w-[240px] justify-center"
        >
          OPEN IN GOOGLE MAPS
        </a>
      </div>
    </section>
  );
};

export default MapPreview;
