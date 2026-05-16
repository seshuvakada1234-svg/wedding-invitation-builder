import React from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { EditorSection, EditorField, EditorInput } from './EditorUI';
import { Timer, Calendar, Bell } from 'lucide-react';

export const CountdownSettings = () => {
  const { formData, updateField } = useEditorStore();

  return (
    <EditorSection title="Countdown Settings" icon={Timer}>
      <div className="space-y-6">
        <EditorField label="Wedding Date & Time" description="The deadline for the countdown timer">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="datetime-local"
              value={formData.countdownDate || ''}
              onChange={(e) => updateField('countdownDate', e.target.value)}
              className="w-full bg-gray-50/50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm transition-all focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-hidden"
            />
          </div>
        </EditorField>

        <div className="p-4 bg-purple-50/50 border border-purple-100 rounded-2xl flex gap-3 text-purple-700">
           <Bell className="w-5 h-5 shrink-0 mt-0.5" />
           <p className="text-[10px] leading-relaxed font-medium">
             The countdown will automatically calculate and display the days, hours, minutes, and seconds remaining until your big day.
           </p>
        </div>
      </div>
    </EditorSection>
  );
};
