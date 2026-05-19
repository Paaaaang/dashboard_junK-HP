import { create } from "zustand";
import { supabase } from "@/api/supabase";
import type { CertificateField, CertificateTemplate } from "@/utils/certificate";

const BUCKET = "certificate-templates";

const bytesCache = new Map<string, Uint8Array>();

interface TemplateStore {
  templates: CertificateTemplate[];
  isLoading: boolean;
  error: string | null;

  fetchTemplates: () => Promise<void>;
  createTemplate: (input: {
    name: string;
    description?: string;
    file: File;
    pageWidth: number;
    pageHeight: number;
  }) => Promise<CertificateTemplate>;
  updateTemplate: (
    id: string,
    patch: Partial<{
      name: string;
      description: string | null;
      fields: CertificateField[];
      pageWidth: number;
      pageHeight: number;
    }>
  ) => Promise<void>;
  setActiveTemplate: (id: string) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  getTemplateBytes: (id: string) => Promise<Uint8Array>;
  subscribeToTemplates: () => () => void;
  clearError: () => void;

  getActiveTemplate: () => CertificateTemplate | undefined;
}

function rowToTemplate(row: any): CertificateTemplate {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    pdfPath: row.pdf_path,
    fontPath: row.font_path,
    pageWidth: Number(row.page_width),
    pageHeight: Number(row.page_height),
    fields: (row.field_config as CertificateField[]) || [],
    isActive: !!row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const useCertificateTemplateStore = create<TemplateStore>((set, get) => ({
  templates: [],
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  getActiveTemplate: () => get().templates.find((t) => t.isActive),

  fetchTemplates: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from("certificate_templates")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      set({ templates: (data || []).map(rowToTemplate), isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  createTemplate: async ({ name, description, file, pageWidth, pageHeight }) => {
    set({ isLoading: true, error: null });
    try {
      const safeName = name.replace(/[^a-zA-Z0-9_-]/g, "_");
      const pdfPath = `${Date.now()}_${safeName}.pdf`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(pdfPath, file, { contentType: "application/pdf", upsert: false });
      if (upErr) throw upErr;

      const { data, error } = await supabase
        .from("certificate_templates")
        .insert({
          name,
          description: description || null,
          pdf_path: pdfPath,
          page_width: pageWidth,
          page_height: pageHeight,
          field_config: [],
          is_active: false,
        })
        .select()
        .single();
      if (error) throw error;
      const created = rowToTemplate(data);
      set((s) => ({ templates: [created, ...s.templates], isLoading: false }));
      return created;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  updateTemplate: async (id, patch) => {
    set({ isLoading: true, error: null });
    try {
      const dbPatch: any = {};
      if (patch.name !== undefined) dbPatch.name = patch.name;
      if (patch.description !== undefined) dbPatch.description = patch.description;
      if (patch.fields !== undefined) dbPatch.field_config = patch.fields;
      if (patch.pageWidth !== undefined) dbPatch.page_width = patch.pageWidth;
      if (patch.pageHeight !== undefined) dbPatch.page_height = patch.pageHeight;

      const { data, error } = await supabase
        .from("certificate_templates")
        .update(dbPatch)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      const updated = rowToTemplate(data);
      set((s) => ({
        templates: s.templates.map((t) => (t.id === id ? updated : t)),
        isLoading: false,
      }));
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  setActiveTemplate: async (id) => {
    set({ isLoading: true, error: null });
    try {
      // Clear current active(s) first to satisfy the partial unique index.
      const { error: clearErr } = await supabase
        .from("certificate_templates")
        .update({ is_active: false })
        .eq("is_active", true);
      if (clearErr) throw clearErr;

      const { error } = await supabase
        .from("certificate_templates")
        .update({ is_active: true })
        .eq("id", id);
      if (error) throw error;
      await get().fetchTemplates();
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  deleteTemplate: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const target = get().templates.find((t) => t.id === id);
      if (target) {
        await supabase.storage.from(BUCKET).remove([target.pdfPath]);
        bytesCache.delete(target.pdfPath);
      }
      const { error } = await supabase.from("certificate_templates").delete().eq("id", id);
      if (error) throw error;
      set((s) => ({
        templates: s.templates.filter((t) => t.id !== id),
        isLoading: false,
      }));
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  getTemplateBytes: async (id) => {
    const target = get().templates.find((t) => t.id === id);
    if (!target) throw new Error("템플릿을 찾을 수 없습니다.");
    const cached = bytesCache.get(target.pdfPath);
    if (cached) return cached;
    const { data, error } = await supabase.storage.from(BUCKET).download(target.pdfPath);
    if (error) throw error;
    const bytes = new Uint8Array(await data.arrayBuffer());
    bytesCache.set(target.pdfPath, bytes);
    return bytes;
  },

  subscribeToTemplates: () => {
    const channel = supabase
      .channel(`certificate_templates_${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "certificate_templates" },
        () => get().fetchTemplates()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
}));
