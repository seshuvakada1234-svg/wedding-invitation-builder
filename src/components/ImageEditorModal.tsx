/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { motion, AnimatePresence } from "motion/react";
import { X, Upload, ZoomIn, ZoomOut, RotateCcw, Save, Loader2 } from "lucide-react";
import { EditableImage } from "../types";

interface ImageEditorModalProps {
  image: string | EditableImage | null;
  onSave: (data: EditableImage) => void;
  onClose: () => void;
  aspect?: number;
}

export default function ImageEditorModal({ 
  image, 
  onSave, 
  onClose, 
  aspect = 4 / 3 
}: ImageEditorModalProps) {
  const initialUrl = typeof image === "string" ? image : image?.url || "";
  const initialCrop = typeof image === "object" && image ? { x: image.positionX, y: image.positionY } : { x: 0, y: 0 };
  const initialZoom = typeof image === "object" && image ? image.scale : 1;
  const initialFile = typeof image === "object" && image ? image.file : undefined;

  const [crop, setCrop] = useState(initialCrop);
  const [zoom, setZoom] = useState(initialZoom);
  const [imageUrl, setImageUrl] = useState(initialUrl);
  const [selectedFile, setSelectedFile] = useState<File | undefined>(initialFile);
  const [isProcessing, setIsProcessing] = useState(false);
  const [croppedAreaPercent, setCroppedAreaPercent] = useState<{ x: number, y: number, width: number, height: number } | null>(null);

  const onCropChange = (newCrop: { x: number; y: number }) => {
    setCrop(newCrop);
  };

  const onCropComplete = useCallback((_area: any, percent: any) => {
    setCroppedAreaPercent(percent);
  }, []);

  const onZoomChange = (newZoom: number) => {
    setZoom(newZoom);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      setSelectedFile(file);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    } catch (error) {
      console.error("Preview error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = () => {
    onSave({
      url: imageUrl,
      scale: zoom,
      positionX: croppedAreaPercent?.x ?? crop.x,
      positionY: croppedAreaPercent?.y ?? crop.y,
      width: croppedAreaPercent?.width,
      height: croppedAreaPercent?.height,
      file: selectedFile
    });
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row"
        >
          {/* Main Cropper Area */}
          <div className="relative w-full aspect-square md:aspect-auto md:h-[500px] bg-slate-100 overflow-hidden">
            {imageUrl ? (
              <Cropper
                image={imageUrl}
                crop={crop}
                zoom={zoom}
                aspect={aspect}
                onCropChange={onCropChange}
                onZoomChange={onZoomChange}
                onCropComplete={onCropComplete}
                showGrid={false}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-4">
                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center border border-dashed border-slate-300">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium">Select an image to start</p>
                <input
                  type="file"
                  id="image-upload"
                  className="hidden"
                  onChange={handleFileChange}
                  accept="image/*"
                />
                <label
                  htmlFor="image-upload"
                  className="px-6 py-2 bg-editorial-ink text-white rounded-full text-xs font-bold uppercase tracking-widest cursor-pointer hover:bg-black transition-colors"
                >
                  Upload Photo
                </label>
              </div>
            )}
            
            {isProcessing && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
                <Loader2 className="w-8 h-8 animate-spin text-editorial-accent" />
              </div>
            )}
          </div>

          {/* Controls Sidebar */}
          <div className="w-full md:w-80 p-8 flex flex-col justify-between bg-white border-t md:border-t-0 md:border-l border-slate-100">
            <div>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-serif italic text-editorial-ink">Edit Frame</h3>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mt-1">Refine your image</p>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {imageUrl && (
                <div className="space-y-8">
                  {/* Zoom Control */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-editorial-ink">Zoom Level</label>
                      <span className="text-[10px] font-mono text-slate-400">{Math.round(zoom * 100)}%</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <ZoomOut className="w-4 h-4 text-slate-400" />
                      <input
                        type="range"
                        min={1}
                        max={3}
                        step={0.1}
                        value={zoom}
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="flex-1 accent-editorial-accent h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                      />
                      <ZoomIn className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => {
                        setCrop({ x: 0, y: 0 });
                        setZoom(1);
                      }}
                      className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl border border-slate-200 text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reset View
                    </button>
                    
                    <input
                      type="file"
                      id="replace-upload"
                      className="hidden"
                      onChange={handleFileChange}
                      accept="image/*"
                    />
                    <label
                      htmlFor="replace-upload"
                      className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl border border-editorial-border text-[10px] font-bold uppercase tracking-widest text-editorial-accent hover:bg-editorial-bg/30 transition-colors cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Replace Photo
                    </label>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleSave}
              disabled={!imageUrl || isProcessing}
              className="mt-8 flex items-center justify-center gap-2 w-full py-4 px-4 bg-editorial-ink text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-[0.98] disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              Apply Changes
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}