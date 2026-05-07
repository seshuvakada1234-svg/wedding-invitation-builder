/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { EditableImage } from "../types";

interface ImageItemProps {
  image: string | EditableImage | undefined | null;
  className?: string;
  alt?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export default function ImageItem({ 
  image, 
  className = "", 
  alt = "Image",
  onClick,
  style = {}
}: ImageItemProps) {
  const isObject = image && typeof image === "object" && "url" in image;
  const url = isObject ? (image as EditableImage).url : (image as string);
  
  const fallbackUrl = "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&h=600&fit=crop&auto=format";
  const finalUrl = url || fallbackUrl;

  const hasDimensions = isObject && (image as EditableImage).width !== undefined;
  
  const posX = hasDimensions && (image as EditableImage).width! < 100 
    ? ((image as EditableImage).positionX / (100 - (image as EditableImage).width!)) * 100 
    : 50;
  
  const posY = hasDimensions && (image as EditableImage).height! < 100 
    ? ((image as EditableImage).positionY / (100 - (image as EditableImage).height!)) * 100 
    : 50;

  const objectStyle: React.CSSProperties = isObject ? {
    objectFit: "cover",
    objectPosition: `${posX}% ${posY}%`,
    transform: `scale(${(image as EditableImage).scale})`,
    transformOrigin: "center center",
  } : {
    objectFit: "cover"
  };

  return (
    <div 
      className={`relative overflow-hidden cursor-pointer group ${className}`}
      onClick={onClick}
      style={{ ...style }}
    >
      <img
        src={finalUrl}
        alt={alt}
        className="w-full h-full transition-transform duration-300"
        style={objectStyle}
        onError={(e) => {
          e.currentTarget.src = fallbackUrl;
        }}
      />
      <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm text-[10px] font-bold uppercase tracking-widest text-editorial-ink">
          Tap to Edit
        </div>
      </div>
    </div>
  );
}
