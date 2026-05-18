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
      const { data, error } = await supabase
        .from('companies')
        .select(`
          *,
          company_courses (
            *,
            sub_course:sub_courses (
              name,
              group:course_groups (name)
            )
          )
        `)
        .is('deleted_at', null);

      if (error) throw error;
      
      const formatted = (data || []).map((c: any) => {
        // Group by course group name
        const participationMap = new Map<string, any>();
        
        (c.company_courses || []).forEach((cc: any) => {
          const groupName = cc.sub_course?.group?.name || '미분류';
          if (!participationMap.has(groupName)) {
            participationMap.set(groupName, {
              courseType: groupName,
              enabled: true,
              programNames: [],
              status: cc.status === '종료' ? '완료' : cc.status === '참여중' ? '참여중' : '대기'
            });
          }
          participationMap.get(groupName).programNames.push(cc.sub_course?.name);
        });

        return {
          id: c.id,
          companyName: c.company_name,
          businessRegNo: c.business_reg_no,
          location: c.location,
          representative: c.representative,
          manager: c.manager,
          phone: c.phone,
          email: c.email,
          mouSigned: c.mou_signed,
          mouSignedDate: c.mou_signed_date,
          createdAt: c.created_at,
          participations: Array.from(participationMap.values())
        };
      });
      
      set({ companies: formatted as CompanyRecord[], isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  setCompanies: (companies) => set({ companies }),

  upsertCompany: async (company) => {
    set({ isLoading: true, error: null });
    try {
      const isNew = !company.id || company.id.startsWith('new-') || company.id.startsWith('upload-');
      const companyData: any = {
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
      
      if (!isNew) {
        companyData.id = company.id;
      }

      const { data, error } = await supabase
        .from('companies')
        .upsert(companyData)
        .select()
        .single();
        
      if (error) throw error;
      const c = data as any;
      const savedCompany: CompanyRecord = {
        id: c.id,
        companyName: c.company_name,
        businessRegNo: c.business_reg_no,
        location: c.location,
        representative: c.representative,
        manager: c.manager,
        phone: c.phone,
        email: c.email,
        mouSigned: c.mou_signed,
        mouSignedDate: c.mou_signed_date,
        createdAt: c.created_at,
        participations: company.participations || []
      };
      
      set((state) => ({
        companies: state.companies.some((comp) => comp.id === savedCompany.id)
          ? state.companies.map((comp) => (comp.id === savedCompany.id ? savedCompany : comp))
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
        const data: any = {
          company_name: c.companyName,
          business_reg_no: c.businessRegNo,
          location: c.location,
          representative: c.representative,
          manager: c.manager,
          phone: c.phone,
          email: c.email,
          mou_signed: c.mouSigned,
          mou_signed_date: c.mouSignedDate || null,
        };
        if (c.id && !c.id.startsWith('new-') && !c.id.startsWith('upload-')) {
            data.id = c.id;
        }
        return data;
      });

      const { data, error } = await supabase
        .from('companies')
        .upsert(companiesToInsert)
        .select();

      if (error) throw error;
      const saved = (data || []).map((c: any) => ({
        id: c.id,
        companyName: c.company_name,
        businessRegNo: c.business_reg_no,
        location: c.location,
        representative: c.representative,
        manager: c.manager,
        phone: c.phone,
        email: c.email,
        mouSigned: c.mou_signed,
        mouSignedDate: c.mou_signed_date,
        createdAt: c.created_at,
        participations: [] // Handled in UI?
      }));

      set((state) => {
        const nextCompanies = [...state.companies];
        saved.forEach((s: any) => {
          const idx = nextCompanies.findIndex(comp => comp.id === s.id || (comp.businessRegNo && comp.businessRegNo === s.businessRegNo));
          if (idx !== -1) {
            nextCompanies[idx] = { ...nextCompanies[idx], ...s };
          } else {
            nextCompanies.unshift(s);
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
      .channel('public:companies_sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'companies' },
        () => get().fetchCompanies()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'company_courses' },
        () => get().fetchCompanies()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'enrollments' },
        () => get().fetchCompanies()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
}));

