/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { motion } from "motion/react";
import { Upload, Camera } from "lucide-react";
import { EditableImage } from "../types";

interface TemplateImageProps {
  image: string | EditableImage | undefined | null;
  className?: string;
  alt?: string;
  isEditable?: boolean;
  onEdit?: () => void;
}

/**
 * Reusable component for rendering images in templates.
 * Handles both plain URL strings and EditableImage objects (zoom/position).
 * If isEditable is true, adds hover effects and click-to-upload/edit behavior.
 */
export default function TemplateImage({ 
  image, 
  className = "", 
  alt = "Wedding Photo",
  isEditable = false,
  onEdit
}: TemplateImageProps) {
  const isObject = typeof image === "object" && image !== null && "url" in image;
  const url = isObject ? (image as EditableImage).url : (image as string);
  
  const fallbackUrl = "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800&h=600&fit=crop&auto=format";
  const finalUrl = url || fallbackUrl;

  const renderImage = () => {
    if (isObject) {
      const edit = image as EditableImage;
      const hasDimensions = edit.width !== undefined && edit.height !== undefined;
      
      const posX = hasDimensions && edit.width! < 100 
        ? (edit.positionX / (100 - edit.width!)) * 100 
        : 50;
      
      const posY = hasDimensions && edit.height! < 100 
        ? (edit.positionY / (100 - edit.height!)) * 100 
        : 50;

      return (
        <img
          src={url || fallbackUrl}
          alt={alt}
          className="w-full h-full"
          style={{
            objectFit: "cover",
            objectPosition: `${posX}% ${posY}%`,
            transform: `scale(${edit.scale || 1})`,
            transformOrigin: "center center",
          }}
          onError={(e) => {
            e.currentTarget.src = fallbackUrl;
          }}
        />
      );
    }

    return (
      <img
        src={finalUrl}
        alt={alt}
        className="w-full h-full object-cover"
        onError={(e) => {
          e.currentTarget.src = fallbackUrl;
        }}
      />
    );
  };

  if (!isEditable) {
    return (
      <div className={`overflow-hidden ${className}`}>
        {!url && !isObject ? (
          <div className="w-full h-full bg-neutral-100 flex items-center justify-center">
            <Camera className="w-8 h-8 text-neutral-300" />
          </div>
        ) : renderImage()}
      </div>
    );
  }

  return (
    <motion.div 
      className={`relative overflow-hidden cursor-pointer group ${className}`}
      onClick={(e) => {
        e.stopPropagation();
        onEdit?.();
      }}
      whileHover="hover"
      initial="initial"
    >
      {/* Background scaling effect */}
      <motion.div 
        className="w-full h-full"
        variants={{
          hover: { scale: 1.05 }
        }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {!url && !isObject ? (
          <div className="w-full h-full bg-slate-50 flex items-center justify-center">
            <Upload className="w-6 h-6 text-slate-300" />
          </div>
        ) : renderImage()}
      </motion.div>

      {/* Overlay */}
      <motion.div 
        className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-3"
        variants={{
          initial: { opacity: 0 },
          hover: { opacity: 1 }
        }}
        transition={{ duration: 0.3 }}
      >
        <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-xl">
          <Upload className="w-4 h-4 text-white" />
        </div>
        <span className="text-[10px] font-bold text-white uppercase tracking-[0.2em] drop-shadow-md">
          Tap to Edit
        </span>
      </motion.div>

      {/* Floating Badge (Mobile/Desktop helper) */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="bg-white/90 backdrop-blur-md px-2 py-1 rounded-md shadow-sm border border-white/40">
           <Camera className="w-3 h-3 text-editorial-accent" />
        </div>
      </div>
    </motion.div>
  );
}
