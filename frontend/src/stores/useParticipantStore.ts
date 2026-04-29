import { create } from "zustand";
import { supabase } from "../api/supabase";
import type { ParticipantRecord, ParticipantEnrollment, CourseType } from "../types/models";

interface ParticipantStore {
  participants: ParticipantRecord[];
  isLoading: boolean;
  error: string | null;
  fetchParticipants: () => Promise<void>;
  upsertParticipant: (participant: ParticipantRecord) => Promise<void>;
  deleteParticipants: (ids: string[]) => Promise<void>;
}

export const useParticipantStore = create<ParticipantStore>((set) => ({
  participants: [],
  isLoading: false,
  error: null,

  fetchParticipants: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('participants')
        .select(`
          *,
          companies (
            company_name,
            location
          ),
          enrollments (
            id,
            status,
            completion_date,
            certificate_no,
            application_date,
            sub_courses (
              id,
              name,
              start_date,
              end_date,
              total_hours,
              course_groups (
                name
              )
            )
          )
        `)
        .order('name', { ascending: true });

      if (error) throw error;

      const participants: ParticipantRecord[] = (data || []).map(row => ({
        id: row.id,
        name: row.name,
        companyId: row.company_id,
        companyName: row.companies?.company_name || "",
        companyLocation: row.companies?.location || "",
        position: row.position,
        phone: row.phone,
        email: row.email,
        employmentInsurance: row.employment_insurance,
        workExperience: row.work_experience,
        documentSkill: row.document_skill,
        enrollments: (row.enrollments || []).map((e: any) => ({
          id: e.id,
          courseType: e.sub_courses?.course_groups?.name as CourseType,
          subCourseName: e.sub_courses?.name || "",
          startDate: e.sub_courses?.start_date || "",
          endDate: e.sub_courses?.end_date || "",
          totalHours: e.sub_courses?.total_hours || 0,
          status: e.status,
          completionDate: e.completion_date,
          certificateNo: e.certificate_no,
          applicationDate: e.application_date
        }))
      }));

      set({ participants, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  upsertParticipant: async (participant) => {
    set({ isLoading: true, error: null });
    try {
      const isNew = !participant.id || participant.id.startsWith('pt-') || participant.id.startsWith('new-');
      
      const dbRow = {
        name: participant.name,
        company_id: participant.companyId,
        position: participant.position,
        phone: participant.phone,
        email: participant.email,
        employment_insurance: participant.employmentInsurance,
        work_experience: participant.workExperience,
        document_skill: participant.documentSkill,
      };

      let resultId = participant.id;

      if (isNew) {
        const { data, error } = await supabase
          .from('participants')
          .insert([dbRow])
          .select()
          .single();
        if (error) throw error;
        resultId = data.id;
      } else {
        const { error } = await supabase
          .from('participants')
          .update(dbRow)
          .eq('id', participant.id);
        if (error) throw error;
      }
      
      const saved = { ...participant, id: resultId };
      set((state) => ({
        participants: state.participants.some((p) => p.id === saved.id)
          ? state.participants.map((p) => (p.id === saved.id ? saved : p))
          : [saved, ...state.participants],
        isLoading: false
      }));
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  deleteParticipants: async (ids) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('participants')
        .delete()
        .in('id', ids);
      if (error) throw error;

      set((state) => ({
        participants: state.participants.filter((p) => !ids.includes(p.id)),
        isLoading: false
      }));
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },
}));
