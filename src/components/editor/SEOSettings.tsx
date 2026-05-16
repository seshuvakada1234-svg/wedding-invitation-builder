import React from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { EditorSection, EditorField, EditorInput, EditorTextarea } from './EditorUI';
import { Globe, Share2, Search, ExternalLink } from 'lucide-react';

export const SEOSettings = () => {
  const { formData, updateField } = useEditorStore();

  return (
    <EditorSection title="SEO & Sharing" icon={Globe}>
      <div className="space-y-6">
        <EditorField label="Invitation Slug" description="The URL of your invitation">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <EditorInput
                value={formData.slug || ''}
                onChange={(e) => updateField('slug', e.target.value)}
                className="pl-10"
                placeholder="my-wedding-invite"
              />
            </div>
            <button className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl hover:bg-white transition-colors">
              <ExternalLink className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <p className="text-[9px] text-gray-400 font-mono">weddings.ai/{formData.slug || '...'}</p>
        </EditorField>

        <div className="pt-4 space-y-4 border-t border-gray-100">
          <h4 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
            <Search className="w-3.5 h-3.5" />
            Social Search Preview
          </h4>
          
          <EditorField label="Page Title">
            <EditorInput
              value={formData.seoTitle || `${formData.brideName} & ${formData.groomName}'s Wedding`}
              onChange={(e) => updateField('seoTitle', e.target.value)}
              placeholder="Elena & Marcus Wedding"
            />
          </EditorField>

          <EditorField label="Meta Description">
            <EditorTextarea
              value={formData.seoDescription || 'Join us for a royal celebration of love and togetherness.'}
              onChange={(e) => updateField('seoDescription', e.target.value)}
              className="text-xs min-h-[80px]"
            />
          </EditorField>
        </div>

        <div className="p-4 rounded-2xl bg-gray-50/50 border border-gray-100 space-y-3">
           <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Share Preview</h4>
           <div className="aspect-video bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col">
              <div className="flex-1 bg-gray-100 flex items-center justify-center">
                 <Share2 className="w-8 h-8 text-gray-200" />
              </div>
              <div className="p-3">
                 <p className="text-[10px] font-bold text-gray-700 truncate">{formData.seoTitle || 'Wedding Invitation'}</p>
                 <p className="text-[9px] text-gray-400 truncate">{formData.seoDescription || 'Join us for our special day.'}</p>
              </div>
           </div>
        </div>
      </div>
    </EditorSection>
  );
};
