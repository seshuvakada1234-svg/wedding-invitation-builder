import React from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { EditorSection, EditorField, EditorInput } from './EditorUI';
import { Mail, Phone, Calendar, MessageCircle, Send } from 'lucide-react';

export const RSVPContact = () => {
  const { formData, updateField } = useEditorStore();

  return (
    <EditorSection title="RSVP & Contact" icon={Send}>
      <div className="space-y-6">
        <EditorField label="RSVP Title">
          <EditorInput
            value={formData.rsvpTitle || 'RSVP'}
            onChange={(e) => updateField('rsvpTitle', e.target.value)}
          />
        </EditorField>

        <EditorField label="RSVP Subtitle">
          <EditorInput
            value={formData.rsvpSubtitle || 'Will you join us in our fairytale?'}
            onChange={(e) => updateField('rsvpSubtitle', e.target.value)}
          />
        </EditorField>

        <EditorField label="Button Text">
          <EditorInput
            value={formData.rsvpButtonText || 'Send Your RSVP'}
            onChange={(e) => updateField('rsvpButtonText', e.target.value)}
          />
        </EditorField>

        <div className="pt-4 space-y-4 border-t border-gray-100">
          <EditorField label="WhatsApp Number" description="Receive RSVP notifications directly">
            <div className="relative">
              <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
              <EditorInput
                value={formData.whatsappNumber || ''}
                onChange={(e) => updateField('whatsappNumber', e.target.value)}
                className="pl-10"
                placeholder="+91 98765 43210"
              />
            </div>
          </EditorField>

          <EditorField label="RSVP Deadline">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <EditorInput
                value={formData.rsvpDeadline || ''}
                onChange={(e) => updateField('rsvpDeadline', e.target.value)}
                className="pl-10 text-xs"
                placeholder="September 10, 2024"
              />
            </div>
          </EditorField>
        </div>
      </div>
    </EditorSection>
  );
};
