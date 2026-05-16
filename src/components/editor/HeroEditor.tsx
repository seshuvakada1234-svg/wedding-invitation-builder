import React from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { EditorSection, EditorField, EditorInput, EditorTextarea } from './EditorUI';
import { Sparkles, Type, MousePointer2 } from 'lucide-react';

export const HeroEditor = () => {
  const { formData, updateField } = useEditorStore();

  return (
    <EditorSection title="Hero Section" icon={Sparkles}>
      <div className="space-y-6">
        <EditorField label="Main Hero Title" description="The majestic title shown at the top">
          <div className="relative">
            <Type className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <EditorInput
              value={formData.heroTitle || 'A Royal Lavender Love Story'}
              onChange={(e) => updateField('heroTitle', e.target.value)}
              className="pl-10"
            />
          </div>
        </EditorField>

        <EditorField label="Hero Subtitle" description="A short welcome phrase">
          <EditorInput
            value={formData.heroSubtitle || 'You are cordially invited'}
            onChange={(e) => updateField('heroSubtitle', e.target.value)}
          />
        </EditorField>

        <EditorField label="Call to Action" description="Text for the primary entry button">
          <div className="relative">
            <MousePointer2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <EditorInput
              value={formData.heroButtonText || 'Open Invitation'}
              onChange={(e) => updateField('heroButtonText', e.target.value)}
              className="pl-10"
            />
          </div>
        </EditorField>
        
        <EditorField label="Welcome Message" description="The text inside the opening modal">
          <EditorTextarea
            value={formData.modalTitle || 'Together with their families, request the pleasure of your company'}
            onChange={(e) => updateField('modalTitle', e.target.value)}
            className="text-xs"
          />
        </EditorField>
      </div>
    </EditorSection>
  );
};
