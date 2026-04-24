import { create } from "zustand";
import { initialCompanies } from "../constants";
import type { CompanyRecord } from "../types/models";

interface CompanyStore {
  companies: CompanyRecord[];
  setCompanies: (companies: CompanyRecord[]) => void;
  upsertCompany: (company: CompanyRecord) => void;
  deleteCompanies: (ids: string[]) => void;
}

export const useCompanyStore = create<CompanyStore>((set) => ({
  companies: initialCompanies,
  setCompanies: (companies) => set({ companies }),
  upsertCompany: (company) =>
    set((state) => ({
      companies: state.companies.some((c) => c.id === company.id)
        ? state.companies.map((c) => (c.id === company.id ? company : c))
        : [...state.companies, company],
    })),
  deleteCompanies: (ids) =>
    set((state) => ({
      companies: state.companies.filter((c) => !ids.includes(c.id)),
    })),
}));
