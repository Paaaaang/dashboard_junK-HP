import { create } from "zustand";
import { supabase } from "../api/supabase";
import type { CompanyRecord, CompanyParticipation } from "../types/models";

interface CompanyStore {
  companies: CompanyRecord[];
  isLoading: boolean;
  error: string | null;
  fetchCompanies: () => Promise<void>;
  setCompanies: (companies: CompanyRecord[]) => void;
  upsertCompany: (company: CompanyRecord) => Promise<void>;
  deleteCompanies: (ids: string[]) => Promise<void>;
}

export const useCompanyStore = create<CompanyStore>((set, _get) => ({
  companies: [],
  isLoading: false,
  error: null,

  fetchCompanies: async () => {
    set({ isLoading: true, error: null });
    try {
      // 1. Fetch companies
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('*')
        .order('company_name', { ascending: true });

      if (companiesError) throw companiesError;

      // 2. Fetch participations info (through participants -> enrollments -> sub_courses -> course_groups)
      // Since fetching everything in one go can be complex with the many-to-many-ish structure,
      // we'll fetch the relevant joins to reconstruct the participations array.
      const { data: participationData, error: participationError } = await supabase
        .from('participants')
        .select(`
          company_id,
          enrollments (
            sub_courses (
              name,
              course_groups (
                name
              )
            )
          )
        `);

      if (participationError) throw participationError;

      // 3. Map database rows to CompanyRecord
      const companies: CompanyRecord[] = (companiesData || []).map(row => {
        // Group participations by courseType
        const participationMap = new Map<string, Set<string>>();
        
        participationData?.filter(p => p.company_id === row.id).forEach(p => {
          p.enrollments?.forEach((enr: any) => {
            const typeName = enr.sub_courses?.course_groups?.name;
            const programName = enr.sub_courses?.name;
            if (typeName && programName) {
              if (!participationMap.has(typeName)) participationMap.set(typeName, new Set());
              participationMap.get(typeName)!.add(programName);
            }
          });
        });

        const participations: CompanyParticipation[] = Array.from(participationMap.entries()).map(([type, programs]) => ({
          courseType: type,
          enabled: true,
          programNames: Array.from(programs),
          status: "참여중"
        }));

        return {
          id: row.id,
          companyName: row.company_name,
          businessRegNo: row.business_reg_no,
          location: row.location,
          representative: row.representative,
          manager: row.manager,
          phone: row.phone,
          email: row.email,
          mouSigned: row.mou_signed,
          mouSignedDate: row.mou_signed_date,
          createdAt: row.created_at,
          participations
        };
      });

      set({ companies, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  setCompanies: (companies) => set({ companies }),

  upsertCompany: async (company) => {
    set({ isLoading: true, error: null });
    try {
      const isNew = !company.id || company.id.startsWith('new-') || company.id.startsWith('upload-');
      
      const dbRow = {
        company_name: company.companyName,
        business_reg_no: company.businessRegNo,
        location: company.location,
        representative: company.representative,
        manager: company.manager,
        phone: company.phone,
        email: company.email,
        mou_signed: company.mouSigned,
        mou_signed_date: company.mouSignedDate || null,
      };

      let resultId = company.id;

      if (isNew) {
        const { data, error } = await supabase
          .from('companies')
          .insert([dbRow])
          .select()
          .single();
        if (error) throw error;
        resultId = data.id;
      } else {
        const { error } = await supabase
          .from('companies')
          .update(dbRow)
          .eq('id', company.id);
        if (error) throw error;
      }
      
      // Refresh to get full data including calculated fields if necessary
      // Or just update local state if we don't want to re-fetch everything
      const savedCompany = { ...company, id: resultId };
      
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
}));
