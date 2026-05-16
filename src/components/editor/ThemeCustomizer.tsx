import React from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { EditorSection, EditorField, EditorInput } from './EditorUI';
import { Palette, Type, Box, Sliders } from 'lucide-react';

const FONTS = [
  { name: 'Classic Serif', value: 'font-serif' },
  { name: 'Cormorant Garamond', value: "font-['Cormorant_Garamond']" },
  { name: 'Playfair Display', value: "font-['Playfair_Display']" },
  { name: 'Inter Sans', value: 'font-sans' },
  { name: 'Space Grotesk', value: "font-['Space_Grotesk']" },
];

export const ThemeCustomizer = () => {
  const { formData, updateField } = useEditorStore();

  return (
    <EditorSection title="Theme & Styling" icon={Palette}>
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <EditorField label="Primary Color">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={formData.primaryColor || '#581c87'}
                onChange={(e) => updateField('primaryColor', e.target.value)}
                className="w-8 h-8 rounded-lg cursor-pointer overflow-hidden border border-gray-200"
              />
              <span className="text-[10px] font-mono text-gray-400">{(formData.primaryColor || '#581c87').toUpperCase()}</span>
            </div>
          </EditorField>
          <EditorField label="Secondary">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={formData.secondaryColor || '#d4af37'}
                onChange={(e) => updateField('secondaryColor', e.target.value)}
                className="w-8 h-8 rounded-lg cursor-pointer overflow-hidden border border-gray-200"
              />
              <span className="text-[10px] font-mono text-gray-400">{(formData.secondaryColor || '#d4af37').toUpperCase()}</span>
            </div>
          </EditorField>
        </div>

        <EditorField label="Global Font" description="Choose typography that matches your style">
          <div className="relative">
            <Type className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={formData.fontStyle || "font-['Cormorant_Garamond']"}
              onChange={(e) => updateField('fontStyle', e.target.value)}
              className="w-full bg-gray-50/50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm appearance-none focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-hidden"
            >
              {FONTS.map(f => (
                <option key={f.value} value={f.value}>{f.name}</option>
              ))}
            </select>
          </div>
        </EditorField>

        <EditorField label="Border Radius" description="Control the roundness of cards and images">
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="0"
              max="48"
              step="4"
              value={parseInt(formData.borderRadius || '32')}
              onChange={(e) => updateField('borderRadius', `${e.target.value}px`)}
              className="flex-1 accent-purple-600"
            />
            <span className="text-[10px] font-mono text-gray-400 w-8">{formData.borderRadius || '32px'}</span>
          </div>
        </EditorField>

        <div className="pt-4 space-y-4 border-t border-gray-100">
           <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Visual Presets</h4>
           <div className="grid grid-cols-2 gap-2">
             {[
               { name: 'Royal Purple', p: '#581c87', s: '#d4af37' },
               { name: 'Temple Gold', p: '#92400e', s: '#fbbf24' },
               { name: 'Kerala White', p: '#166534', s: '#d4af37' },
               { name: 'Modern Rose', p: '#9d174d', s: '#fbcfe8' },
             ].map(preset => (
               <button
                 key={preset.name}
                 onClick={() => {
                   updateField('primaryColor', preset.p);
                   updateField('secondaryColor', preset.s);
                 }}
                 className="flex flex-col items-start gap-1 p-2 rounded-lg border border-gray-100 hover:border-purple-200 hover:bg-purple-50/50 transition-all text-left"
               >
                 <div className="flex gap-1">
                   <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.p }} />
                   <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.s }} />
                 </div>
                 <span className="text-[9px] font-bold text-gray-600">{preset.name}</span>
               </button>
             ))}
           </div>
        </div>
      </div>
    </EditorSection>
  );
};
