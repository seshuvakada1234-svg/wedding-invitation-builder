import React from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { EditorSection, EditorField, EditorInput } from './EditorUI';
import { Music, Music2, Volume2, VolumeX, Link } from 'lucide-react';

export const MusicSettings = () => {
  const { formData, updateField } = useEditorStore();

  return (
    <EditorSection title="Music Settings" icon={Music}>
      <div className="space-y-6">
        <EditorField label="Background Music URL" description="Direct URL to mp3 or Spotify/YouTube link (unsupported in some modes)">
          <div className="relative">
            <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <EditorInput
              value={formData.musicUrl || ''}
              onChange={(e) => updateField('musicUrl', e.target.value)}
              className="pl-10"
              placeholder="https://example.com/song.mp3"
            />
          </div>
        </EditorField>

        <div className="flex items-center justify-between p-3 bg-gray-50/50 border border-gray-100 rounded-xl">
           <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
               {formData.autoplayMusic ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
             </div>
             <div>
               <span className="text-[10px] font-bold uppercase tracking-wider text-gray-700">Autoplay Music</span>
               <p className="text-[9px] text-gray-400 italic leading-tight">Start music when guest opens invite</p>
             </div>
           </div>
           <button
             onClick={() => updateField('autoplayMusic', !formData.autoplayMusic)}
             className={`w-10 h-5 rounded-full transition-colors relative ${formData.autoplayMusic ? 'bg-orange-500' : 'bg-gray-200'}`}
           >
             <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${formData.autoplayMusic ? 'left-6' : 'left-1'}`} />
           </button>
        </div>

        <div className="pt-4 border-t border-gray-100">
           <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-3">Popular Presets</h4>
           <div className="grid grid-cols-1 gap-2">
             {[
               { name: 'Classical Sangeet Instrumentals', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
               { name: 'Upbeat Celebration Mix', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
             ].map(mix => (
               <button
                 key={mix.name}
                 onClick={() => updateField('musicUrl', mix.url)}
                 className="flex items-center gap-3 p-2 rounded-lg border border-gray-100 hover:border-orange-200 hover:bg-orange-50/50 transition-all text-left"
               >
                 <Music2 className="w-4 h-4 text-orange-400" />
                 <span className="text-[9px] font-bold text-gray-600">{mix.name}</span>
               </button>
             ))}
           </div>
        </div>
      </div>
    </EditorSection>
  );
};
