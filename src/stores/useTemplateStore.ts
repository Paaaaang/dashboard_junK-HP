import { create } from "zustand";
import { supabase } from "@/api/supabase";
import type { EmailTemplate, EmailLog, EmailJob, AttachmentMeta } from "@/types/models";

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
      const { data, error } = await supabase.from('email_templates').select('*');
      if (error) throw error;
      set({ templates: data as EmailTemplate[], isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  upsertTemplate: async (template) => {
    set({ isLoading: true, error: null });
    try {
      const isNew = !template.id || template.id.startsWith('tpl-');
      const dataToSave = { ...template };
      if (isNew && dataToSave.id) {
        delete (dataToSave as any).id;
      }
      
      const { data, error } = await supabase
        .from('email_templates')
        .upsert(dataToSave)
        .select()
        .single();
        
      if (error) throw error;
      const saved = data as EmailTemplate;

      set((state) => ({
        templates: state.templates.some(t => t.id === saved.id)
          ? state.templates.map(t => t.id === saved.id ? saved : t)
          : [...state.templates, saved],
        isLoading: false
      }));
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  deleteTemplate: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase.from('email_templates').delete().eq('id', id);
      if (error) throw error;
      set((state) => ({
        templates: state.templates.filter(t => t.id !== id),
        isLoading: false
      }));
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  sendBatch: async (templateId, recipients) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.functions.invoke('send-batch', {
        body: { templateId, recipients, createdBy: 'admin' }
      });
      
      if (error) throw error;
      const jobId = data.jobId;
      
      // Set initial activeJob state
      set({ 
        activeJob: {
          id: jobId,
          templateId,
          totalCount: recipients.length,
          sentCount: 0,
          failedCount: 0,
          status: 'queued',
          createdBy: 'admin',
          createdAt: new Date().toISOString()
        },
        isLoading: false 
      });
      
      return data;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  fetchJobStatus: async (jobId) => {
    try {
      const { data, error } = await supabase.from('email_jobs').select('*').eq('id', jobId).single();
      if (error) throw error;
      
      const job: EmailJob = {
          id: data.id,
          templateId: data.template_id,
          totalCount: data.total_count,
          sentCount: data.sent_count,
          failedCount: data.failed_count,
          status: data.status,
          createdBy: data.created_by,
          createdAt: data.created_at,
          completedAt: data.completed_at
      };
      
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
      const { data, error } = await supabase.functions.invoke('test-email', {
        body: { templateId, to, subject, body, attachments }
      });
      if (error) throw error;
      set({ isLoading: false });
      return data;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  uploadAttachment: async (templateId, file) => {
    set({ isLoading: true, error: null });
    try {
      const filePath = `${templateId}/${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage.from('email-attachments').upload(filePath, file);
      
      if (error) throw error;
      
      const newAttachment: AttachmentMeta = {
          id: data.path,
          filename: file.name,
          originalName: file.name,
          size: file.size,
          mimeType: file.type,
          path: data.path
      };
      
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
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  deleteAttachment: async (templateId, attachmentId) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase.storage.from('email-attachments').remove([attachmentId]);
      if (error) throw error;
      
      set(state => ({
        templates: state.templates.map(t => 
          t.id === templateId 
            ? { ...t, attachments: (t.attachments || []).filter(a => a.id !== attachmentId) }
            : t
        ),
        isLoading: false
      }));
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  fetchLogs: async (params) => {
    set({ isLoading: true, error: null });
    try {
      let query = supabase.from('email_logs').select('*');
      if (params?.jobId) {
          query = query.eq('job_id', params.jobId);
      }
      const { data, error } = await query;
      if (error) throw error;
      
      const logs: EmailLog[] = data.map((l: any) => ({
          id: l.id,
          jobId: l.job_id,
          templateId: l.template_id,
          templateName: l.template_name,
          senderEmail: l.sender_email,
          recipientEmail: l.recipient_email,
          recipientName: l.recipient_name,
          subject: l.subject,
          bodyRendered: l.body_rendered,
          status: l.status,
          errorMessage: l.error_message,
          sentAt: l.sent_at,
          createdAt: l.created_at
      }));
      
      set({ logs, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  subscribeToTemplates: () => {
    if (!supabase || !supabase.channel) {
      console.warn('Supabase client not initialized. Realtime updates disabled.');
      return () => {};
    }

    const channelId = `templates_job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase
      .channel(channelId)
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
          const rawJob = (payload as any).new;
          if (rawJob && get().activeJob?.id === rawJob.id) {
            const updatedJob: EmailJob = {
              id: rawJob.id,
              templateId: rawJob.template_id,
              totalCount: rawJob.total_count,
              sentCount: rawJob.sent_count,
              failedCount: rawJob.failed_count,
              status: rawJob.status,
              createdBy: rawJob.created_by,
              createdAt: rawJob.created_at,
              completedAt: rawJob.completed_at
            };
            set({ activeJob: updatedJob });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
}));
