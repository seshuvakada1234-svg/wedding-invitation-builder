import React from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { EditorSection, EditorField, EditorInput } from './EditorUI';
import { User, Heart, Hash, Crown, Calendar, Clock } from 'lucide-react';

export const CoupleIdentity = () => {
  const { formData, updateField } = useEditorStore();

  return (
    <EditorSection title="Couple Identity" icon={Heart}>
      <div className="grid grid-cols-1 gap-6">
        <EditorField label="Bride Name" description="The full name of the bride">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <EditorInput
              value={formData.brideName || ''}
              onChange={(e) => updateField('brideName', e.target.value)}
              className="pl-10"
              placeholder="e.g. Elena Sofia"
            />
          </div>
        </EditorField>

        <EditorField label="Groom Name" description="The full name of the groom">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <EditorInput
              value={formData.groomName || ''}
              onChange={(e) => updateField('groomName', e.target.value)}
              className="pl-10"
              placeholder="e.g. Marcus James"
            />
          </div>
        </EditorField>

        <div className="grid grid-cols-2 gap-4">
          <EditorField label="Wedding Date">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={formData.weddingDate || ''}
                onChange={(e) => updateField('weddingDate', e.target.value)}
                className="w-full h-11 bg-white border border-gray-200 rounded-xl px-10 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
              />
            </div>
          </EditorField>
          <EditorField label="Wedding Time">
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="time"
                value={formData.weddingTime || ''}
                onChange={(e) => updateField('weddingTime', e.target.value)}
                className="w-full h-11 bg-white border border-gray-200 rounded-xl px-10 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
              />
            </div>
          </EditorField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <EditorField label="Couple Nickname">
            <EditorInput
              value={formData.coupleNickname || ''}
              onChange={(e) => updateField('coupleNickname', e.target.value)}
              placeholder="e.g. El-Mar"
            />
          </EditorField>
          <EditorField label="Wedding Hashtag">
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <EditorInput
                value={formData.weddingHashtag || ''}
                onChange={(e) => updateField('weddingHashtag', e.target.value)}
                className="pl-8"
                placeholder="ElMar2024"
              />
            </div>
          </EditorField>
        </div>

        <EditorField label="Family names" description="Family names to be shown in the invitation">
          <div className="relative">
            <Crown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <EditorInput
              value={formData.familyNames || ''}
              onChange={(e) => updateField('familyNames', e.target.value)}
              className="pl-10"
              placeholder="The Chodapaneedi Family"
            />
          </div>
        </EditorField>
      </div>
    </EditorSection>
  );
};
