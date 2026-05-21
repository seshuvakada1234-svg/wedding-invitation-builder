import React from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { EditorSection, EditorField, EditorInput } from './EditorUI';
import { Calendar, Clock, MapPin, Plus, Trash2, ChevronDown, ChevronUp, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const EventBuilder = () => {
  const { formData, updateEvent, addEvent, removeEvent } = useEditorStore();
  const [expandedIndex, setExpandedIndex] = React.useState<number | null>(0);

  return (
    <EditorSection title="Itinerary Builder" icon={Calendar}>
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {formData.events?.map((event, idx) => (
            <motion.div
              key={idx}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-xs group"
            >
              <div 
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50/50 transition-colors"
                onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 font-bold text-xs">
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-700">{event.name || 'Untitled Event'}</h4>
                    <p className="text-[10px] text-gray-400 font-medium">{event.date || 'Set date'} • {event.time || 'Set time'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); removeEvent(idx); }}
                    className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {expandedIndex === idx ? <ChevronUp className="w-4 h-4 text-gray-300" /> : <ChevronDown className="w-4 h-4 text-gray-300" />}
                </div>
              </div>

              <AnimatePresence>
                {expandedIndex === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-4 pb-4 border-t border-gray-50 pt-4 space-y-4"
                  >
                    <EditorField label="Event Name">
                      <EditorInput
                        value={event.name}
                        onChange={(e) => updateEvent(idx, 'name', e.target.value)}
                        placeholder="e.g. Sangeet Ceremony"
                      />
                    </EditorField>

                    <div className="grid grid-cols-2 gap-3">
                      <EditorField label="Date">
                        <div className="relative">
                          <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                          <input
                            type="date"
                            value={event.date}
                            onChange={(e) => updateEvent(idx, 'date', e.target.value)}
                            className="w-full h-9 bg-white border border-gray-100 rounded-lg pl-8 text-[11px] focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium"
                          />
                        </div>
                      </EditorField>
                      <EditorField label="Time">
                        <div className="relative">
                          <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                          <input
                            type="time"
                            value={event.time}
                            onChange={(e) => updateEvent(idx, 'time', e.target.value)}
                            className="w-full h-9 bg-white border border-gray-100 rounded-lg pl-8 text-[11px] focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium"
                          />
                        </div>
                      </EditorField>
                    </div>

                    <EditorField label="Location">
                      <div className="relative">
                        <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                        <EditorInput
                          value={event.location}
                          onChange={(e) => updateEvent(idx, 'location', e.target.value)}
                          className="pl-8 text-xs py-2"
                          placeholder="Grand Ballroom"
                        />
                      </div>
                    </EditorField>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>

        <button
          onClick={addEvent}
          className="w-full py-4 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-purple-300 hover:text-purple-500 hover:bg-purple-50/30 transition-all flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-widest"
        >
          <Plus className="w-4 h-4" />
          Add New Event
        </button>
      </div>
    </EditorSection>
  );
};
