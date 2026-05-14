import { create } from "zustand";
import { supabase } from "@/api/supabase";
import type { CompanyRecord } from "@/types/models";

interface CompanyStore {
  companies: CompanyRecord[];
  isLoading: boolean;
  error: string | null;
  fetchCompanies: () => Promise<void>;
  setCompanies: (companies: CompanyRecord[]) => void;
  upsertCompany: (company: CompanyRecord) => Promise<void>;
  batchUpsertCompanies: (companies: CompanyRecord[]) => Promise<void>;
  deleteCompanies: (ids: string[]) => Promise<void>;
  subscribeToCompanies: () => () => void;
  clearError: () => void;
}

export const useCompanyStore = create<CompanyStore>((set, get) => ({
  companies: [],
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchCompanies: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.from('companies').select('*');
      if (error) throw error;
      set({ companies: data as CompanyRecord[], isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  setCompanies: (companies) => set({ companies }),

  upsertCompany: async (company) => {
    set({ isLoading: true, error: null });
    try {
      const isNew = !company.id || company.id.startsWith('new-') || company.id.startsWith('upload-');
      const companyData = { ...company };
      
      if (isNew) {
        // Supabase will generate UUID if not provided (if table is set up that way), or we can omit it.
        if (companyData.id && (companyData.id.startsWith('new-') || companyData.id.startsWith('upload-'))) {
            delete (companyData as any).id;
        }
      }

      const { data, error } = await supabase
        .from('companies')
        .upsert(companyData)
        .select()
        .single();
        
      if (error) throw error;
      const savedCompany = data as CompanyRecord;
      
      set((state) => ({
        companies: state.companies.some((c) => c.id === savedCompany.id)
          ? state.companies.map((c) => (c.id === savedCompany.id ? savedCompany : c))
          : [savedCompany, ...state.companies],
        isLoading: false
      }));
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  batchUpsertCompanies: async (companies) => {
    set({ isLoading: true, error: null });
    try {
      const companiesToInsert = companies.map(c => {
        const data = { ...c };
        if (data.id && (data.id.startsWith('new-') || data.id.startsWith('upload-'))) {
            delete (data as any).id;
        }
        return data;
      });

      const { data, error } = await supabase
        .from('companies')
        .upsert(companiesToInsert)
        .select();

      if (error) throw error;
      const savedCompanies = data as CompanyRecord[];

      set((state) => {
        const nextCompanies = [...state.companies];
        savedCompanies.forEach((saved) => {
          const idx = nextCompanies.findIndex(c => c.id === saved.id || (c.businessRegNo && c.businessRegNo === saved.businessRegNo));
          if (idx !== -1) {
            nextCompanies[idx] = saved;
          } else {
            nextCompanies.unshift(saved);
          }
        });
        return { companies: nextCompanies, isLoading: false };
      });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  deleteCompanies: async (ids) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .in('id', ids);

      if (error) throw error;

      set((state) => ({
        companies: state.companies.filter((c) => !ids.includes(c.id)),
        isLoading: false
      }));
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  subscribeToCompanies: () => {
    const channel = supabase
      .channel('public:companies')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'companies' },
        () => {
          get().fetchCompanies();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
}));

