import { create } from "zustand";
import apiClient from "../api/client";
import { supabase } from "../api/supabase";
import type { EmailTemplate, EmailLog, EmailJob, AttachmentMeta } from "../types/models";

interface SendRecipient {
  email: string;
  variables: Record<string, string>;
}

interface TemplateStore {
  templates: EmailTemplate[];
  logs: EmailLog[];
  activeJob: EmailJob | null;
  isLoading: boolean;
  error: string | null;
  fetchTemplates: () => Promise<void>;
  upsertTemplate: (template: EmailTemplate) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  sendBatch: (templateId: string, recipients: SendRecipient[]) => Promise<{ jobId: string }>;
  fetchJobStatus: (jobId: string) => Promise<EmailJob>;
  testEmail: (templateId: string | undefined, to: string, subject: string, body: string, attachments?: any[]) => Promise<any>;
  uploadAttachment: (templateId: string, file: File) => Promise<AttachmentMeta>;
  deleteAttachment: (templateId: string, attachmentId: string) => Promise<void>;
  fetchLogs: (params?: any) => Promise<void>;
  subscribeToTemplates: () => () => void;
  clearError: () => void;
  setActiveJob: (job: EmailJob | null) => void;
}

export const useTemplateStore = create<TemplateStore>((set, get) => ({
  templates: [],
  logs: [],
  activeJob: null,
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),
  setActiveJob: (job) => set({ activeJob: job }),

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
      if (isNew) {
        // Remove temporary ID for backend
        const { id, ...data } = template;
        response = await apiClient.post('v1/templates', data);
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

  sendBatch: async (templateId, recipients) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post('v1/emails/send', {
        templateId,
        recipients,
        createdBy: 'admin' // Could be dynamic if auth is implemented
      });
      set({ isLoading: false });
      return response.data;
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message;
      set({ error: errorMsg, isLoading: false });
      throw new Error(errorMsg);
    }
  },

  fetchJobStatus: async (jobId) => {
    try {
      const response = await apiClient.get(`v1/emails/jobs/${jobId}`);
      const job = response.data;
      if (get().activeJob?.id === jobId) {
        set({ activeJob: job });
      }
      return job;
    } catch (err: any) {
      console.error('Error fetching job status:', err);
      throw err;
    }
  },

  testEmail: async (templateId, to, subject, body, attachments) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post('v1/emails/test', { templateId, to, subject, body, attachments });
      set({ isLoading: false });
      return response.data;
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message;
      set({ error: errorMsg, isLoading: false });
      throw new Error(errorMsg);
    }
  },

  uploadAttachment: async (templateId, file) => {
    set({ isLoading: true, error: null });
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await apiClient.post(`v1/emails/templates/${templateId}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const newAttachment = response.data;
      
      set(state => ({
        templates: state.templates.map(t => 
          t.id === templateId 
            ? { ...t, attachments: [...(t.attachments || []), newAttachment] }
            : t
        ),
        isLoading: false
      }));
      return newAttachment;
    } catch (err: any) {
      set({ error: err.response?.data?.error || err.message, isLoading: false });
      throw err;
    }
  },

  deleteAttachment: async (templateId, attachmentId) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.delete(`v1/emails/templates/${templateId}/attachments/${attachmentId}`);
      set(state => ({
        templates: state.templates.map(t => 
          t.id === templateId 
            ? { ...t, attachments: (t.attachments || []).filter(a => a.id !== attachmentId) }
            : t
        ),
        isLoading: false
      }));
    } catch (err: any) {
      set({ error: err.response?.data?.error || err.message, isLoading: false });
      throw err;
    }
  },

  fetchLogs: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get('v1/emails/logs', { params });
      set({ logs: response.data, isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.error || err.message, isLoading: false });
    }
  },

  subscribeToTemplates: () => {
    const channel = supabase
      .channel('public:templates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'email_templates' },
        () => get().fetchTemplates()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'email_logs' },
        () => get().fetchLogs()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'email_jobs' },
        (payload) => {
          const { new: newJob } = payload as any;
          if (get().activeJob?.id === newJob.id) {
            set({ activeJob: newJob });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
}));
