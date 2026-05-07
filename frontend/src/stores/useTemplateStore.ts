import { create } from "zustand";
import apiClient from "../api/client";
import type { EmailTemplate, EmailLog } from "../types/models";

interface TemplateStore {
  templates: EmailTemplate[];
  logs: EmailLog[];
  isLoading: boolean;
  error: string | null;
  fetchTemplates: () => Promise<void>;
  upsertTemplate: (template: EmailTemplate) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  sendEmails: (templateId: string, participantIds?: string[], recipientEmails?: string[], customData?: any) => Promise<any>;
  testEmail: (to: string, subject: string, body: string, attachments?: any[]) => Promise<any>;
  fetchLogs: () => Promise<void>;
  clearError: () => void;
}

export const useTemplateStore = create<TemplateStore>((set) => ({
  templates: [],
  logs: [],
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
      const isNew = !template.id || template.id.startsWith('tpl-');
      
      let response;
      if (isNew && template.id?.startsWith('tpl-')) {
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

  sendEmails: async (templateId, participantIds, recipientEmails, customData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post('v1/emails/send', {
        templateId,
        participantIds,
        recipientEmails,
        customData
      });
      set({ isLoading: false });
      return response.data;
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message;
      set({ error: errorMsg, isLoading: false });
      throw new Error(errorMsg);
    }
  },

  testEmail: async (to, subject, body, attachments) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post('v1/emails/test', { to, subject, body, attachments });
      set({ isLoading: false });
      return response.data;
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message;
      set({ error: errorMsg, isLoading: false });
      throw new Error(errorMsg);
    }
  },

  fetchLogs: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get('v1/emails/logs');
      set({ logs: response.data, isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.error || err.message, isLoading: false });
    }
  },
}));
