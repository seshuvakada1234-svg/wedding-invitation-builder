import { create } from 'zustand';
import { WeddingInvite, TemplateType, WeddingEvent } from '../types';

interface EditorState {
  formData: Partial<WeddingInvite>;
  setFormData: (data: Partial<WeddingInvite> | ((prev: Partial<WeddingInvite>) => Partial<WeddingInvite>)) => void;
  updateField: (field: string, value: any) => void;
  updateEvent: (index: number, field: keyof WeddingEvent, value: any) => void;
  addEvent: () => void;
  removeEvent: (index: number) => void;
  reorderEvents: (events: WeddingEvent[]) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  formData: {},
  setFormData: (data) => set((state) => ({
    formData: typeof data === 'function' ? data(state.formData) : { ...state.formData, ...data }
  })),
  updateField: (field, value) => set((state) => ({
    formData: { ...state.formData, [field]: value }
  })),
  updateEvent: (index, field, value) => set((state) => {
    const newEvents = [...(state.formData.events || [])];
    if (newEvents[index]) {
      newEvents[index] = { ...newEvents[index], [field]: value };
    }
    return { formData: { ...state.formData, events: newEvents } };
  }),
  addEvent: () => set((state) => ({
    formData: {
      ...state.formData,
      events: [...(state.formData.events || []), { name: 'New Event', date: '', time: '', location: '', image: '' }]
    }
  })),
  removeEvent: (index) => set((state) => ({
    formData: {
      ...state.formData,
      events: state.formData.events?.filter((_, i) => i !== index)
    }
  })),
  reorderEvents: (events) => set((state) => ({
    formData: { ...state.formData, events }
  })),
}));
