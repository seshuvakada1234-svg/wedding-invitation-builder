import React from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { EditorSection } from './EditorUI';
import { Images, Plus, Trash2, GripVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const GalleryManager = () => {
  const { formData, updateField } = useEditorStore();
  const gallery = formData.galleryImages || [];

  const removeImage = (index: number) => {
    const newGallery = gallery.filter((_, i) => i !== index);
    updateField('galleryImages', newGallery);
  };

  return (
    <EditorSection title="Photo Gallery" icon={Images}>
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <AnimatePresence mode="popLayout">
            {gallery.map((img, idx) => (
              <motion.div
                key={idx}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group shadow-sm"
              >
                <img 
                  src={typeof img === 'string' ? img : img.url} 
                  className="w-full h-full object-cover transition-transform group-hover:scale-110"
                  alt={`Gallery ${idx}`}
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={() => removeImage(idx)}
                    className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <button
            className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-purple-300 hover:text-purple-500 hover:bg-purple-50 transition-all"
            onClick={() => {/* Trigger upload or modal */}}
          >
            <Plus className="w-5 h-5" />
            <span className="text-[9px] font-bold uppercase tracking-widest">Add</span>
          </button>
        </div>
        
        <p className="text-[10px] text-gray-400 italic">
          Tip: You can also edit images directly in the preview for precise cropping and alignment.
        </p>
      </div>
    </EditorSection>
  );
};
