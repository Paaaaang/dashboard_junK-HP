import { create } from "zustand";
import apiClient from "../api/client";
import { supabase } from "../api/supabase";
import type { CompanyRecord } from "../types/models";

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
      const response = await apiClient.get('v1/companies');
      set({ companies: response.data, isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.error || err.message, isLoading: false });
    }
  },

  setCompanies: (companies) => set({ companies }),

  upsertCompany: async (company) => {
    set({ isLoading: true, error: null });
    try {
      const isNew = !company.id || company.id.startsWith('new-') || company.id.startsWith('upload-');
      
      let response;
      if (isNew) {
        response = await apiClient.post('v1/companies', company);
      } else {
        response = await apiClient.put(`v1/companies/${company.id}`, company);
      }
      
      const savedCompany = response.data;
      
      set((state) => ({
        companies: state.companies.some((c) => c.id === savedCompany.id)
          ? state.companies.map((c) => (c.id === savedCompany.id ? savedCompany : c))
          : [savedCompany, ...state.companies],
        isLoading: false
      }));
    } catch (err: any) {
      set({ error: err.response?.data?.error || err.message, isLoading: false });
      throw err;
    }
  },

  batchUpsertCompanies: async (companies) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post('v1/companies/batch', { companies });
      const savedCompanies = response.data;

      set((state) => {
        const nextCompanies = [...state.companies];
        savedCompanies.forEach((saved: CompanyRecord) => {
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
      set({ error: err.response?.data?.error || err.message, isLoading: false });
      throw err;
    }
  },

  deleteCompanies: async (ids) => {
    set({ isLoading: true, error: null });
    try {
      await Promise.all(ids.map(id => apiClient.delete(`v1/companies/${id}`)));

      set((state) => ({
        companies: state.companies.filter((c) => !ids.includes(c.id)),
        isLoading: false
      }));
    } catch (err: any) {
      set({ error: err.response?.data?.error || err.message, isLoading: false });
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

