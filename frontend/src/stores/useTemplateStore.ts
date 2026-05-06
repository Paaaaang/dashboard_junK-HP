import { create } from "zustand";
import apiClient from "../api/client";
import type { EmailTemplate } from "../types/models";

interface TemplateStore {
  templates: EmailTemplate[];
  isLoading: boolean;
  error: string | null;
  fetchTemplates: () => Promise<void>;
  upsertTemplate: (template: EmailTemplate) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useTemplateStore = create<TemplateStore>((set) => ({
  templates: [],
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchTemplates: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get('v1/templates');
      set({ templates: response.data, isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.error || err.message, isLoading: false });
    }
  },

  upsertTemplate: async (template) => {
    set({ isLoading: true, error: null });
    try {
      const isNew = !template.id || template.id.startsWith('tpl-'); // Temporary logic for initial mock IDs
      
      let response;
      if (isNew && template.id.startsWith('tpl-')) {
        // If it's a mock template being saved for the first time, treat as new
        response = await apiClient.post('v1/templates', { ...template, id: undefined });
      } else if (isNew) {
        response = await apiClient.post('v1/templates', template);
      } else {
        response = await apiClient.put(`v1/templates/${template.id}`, template);
      }
      
      const saved = response.data;
      set((state) => ({
        templates: state.templates.some(t => t.id === saved.id)
          ? state.templates.map(t => t.id === saved.id ? saved : t)
          : [...state.templates, saved],
        isLoading: false
      }));
    } catch (err: any) {
      set({ error: err.response?.data?.error || err.message, isLoading: false });
      throw err;
    }
  },

  deleteTemplate: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.delete(`v1/templates/${id}`);
      set((state) => ({
        templates: state.templates.filter(t => t.id !== id),
        isLoading: false
      }));
    } catch (err: any) {
      set({ error: err.response?.data?.error || err.message, isLoading: false });
      throw err;
    }
  },
}));
