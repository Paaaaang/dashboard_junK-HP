import { create } from "zustand";
import { supabase } from "@/api/supabase";
import type { ParticipantRecord } from "@/types/models";

interface ParticipantStore {
  participants: ParticipantRecord[];
  isLoading: boolean;
  error: string | null;
  fetchParticipants: () => Promise<void>;
  upsertParticipant: (participant: ParticipantRecord) => Promise<void>;
  batchUpsertParticipants: (participants: ParticipantRecord[]) => Promise<void>;
  deleteParticipants: (ids: string[]) => Promise<void>;
  subscribeToParticipants: () => () => void;
  clearError: () => void;
  // Session management actions
  fetchSessionParticipants: (sessionId: string) => Promise<any[]>;
  bulkUpdateEnrollments: (enrollmentIds: string[], status: string, completionDate?: string) => Promise<void>;
  addEnrollment: (enrollment: { participantId: string; subCourseId: string; sessionId: string; status?: string }) => Promise<void>;
  removeEnrollment: (enrollmentId: string) => Promise<void>;
}

export const useParticipantStore = create<ParticipantStore>((set, get) => ({
  participants: [],
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchParticipants: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('participants')
        .select(`
          *,
          company:companies(company_name, location, representative, manager, phone, email, mou_signed),
          enrollments (
            *,
            sub_course:sub_courses(name, total_hours, course_groups(name))
          )
        `);

      if (error) throw error;

      // Map to ParticipantRecord
      const formatted = (data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        companyId: p.company_id,
        companyName: p.company?.company_name || p.companyName || '',
        companyLocation: p.company?.location,
        companyRepresentative: p.company?.representative,
        companyManager: p.company?.manager,
        companyPhone: p.company?.phone,
        companyEmail: p.company?.email,
        mouSigned: p.company?.mou_signed,
        position: p.position || '',
        phone: p.phone || '',
        email: p.email || '',
        employmentInsurance: p.employment_insurance || '미확인',
        workExperience: p.work_experience,
        documentSkill: p.document_skill,
        enrollments: (p.enrollments || []).map((e: any) => ({
          id: e.id,
          courseType: e.sub_course?.course_groups?.name || '미확인',
          subCourseName: e.sub_course?.name || '알 수 없음',
          subCourseId: e.sub_course_id,
          sessionId: e.session_id,
          startDate: e.start_date || '',
          endDate: e.end_date || '',
          totalHours: e.sub_course?.total_hours || 0,
          status: e.status || '미수료',
          completionDate: e.completion_date,
          certificateNo: e.certificate_no,
          applicationDate: e.application_date,
          isRetake: e.is_retake,
          retakeReason: e.retake_reason
        }))
      }));

      set({ participants: formatted, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchSessionParticipants: async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          *,
          participant:participants(*)
        `)
        .eq('session_id', sessionId);
        
      if (error) throw error;
      
      return (data || []).map((e: any) => ({
        id: e.participant?.id,
        name: e.participant?.name,
        email: e.participant?.email,
        phone: e.participant?.phone,
        position: e.participant?.position,
        companyId: e.participant?.company_id,
        enrollmentId: e.id,
        status: e.status,
        completionDate: e.completion_date
      }));
    } catch (err: any) {
      console.error('Error fetching session participants:', err);
      return [];
    }
  },

  bulkUpdateEnrollments: async (enrollmentIds, status, completionDate) => {
    set({ isLoading: true });
    try {
      const updateData: any = { status };
      if (completionDate !== undefined) {
        updateData.completion_date = completionDate;
      }
      
      const { error } = await supabase
        .from('enrollments')
        .update(updateData)
        .in('id', enrollmentIds);
        
      if (error) throw error;
      
      await get().fetchParticipants(); // Refresh global state
      set({ isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  addEnrollment: async (enrollment) => {
    set({ isLoading: true });
    try {
      const { error } = await supabase
        .from('enrollments')
        .insert({
          participant_id: enrollment.participantId,
          sub_course_id: enrollment.subCourseId,
          session_id: enrollment.sessionId,
          status: enrollment.status || '미수료',
          application_date: new Date().toISOString()
        });
        
      if (error) throw error;
      await get().fetchParticipants();
      set({ isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  removeEnrollment: async (enrollmentId) => {
    set({ isLoading: true });
    try {
      const { error } = await supabase.from('enrollments').delete().eq('id', enrollmentId);
      if (error) throw error;
      await get().fetchParticipants();
      set({ isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  upsertParticipant: async (participant) => {
    set({ isLoading: true, error: null });
    try {
      let companyId = participant.companyId;
      
      // If there's a new company, insert it first
      if (participant.newCompany) {
        const { data: cData, error: cError } = await supabase
          .from('companies')
          .insert({
            company_name: participant.newCompany.companyName,
            location: participant.newCompany.location,
            representative: participant.newCompany.representative
          })
          .select()
          .single();
          
        if (cError) throw cError;
        companyId = cData.id;
      }

      const pData: any = {
        name: participant.name,
        company_id: companyId,
        position: participant.position,
        phone: participant.phone,
        email: participant.email,
        employment_insurance: participant.employmentInsurance,
        work_experience: participant.workExperience,
        document_skill: participant.documentSkill
      };

      const isNew = !participant.id || participant.id.startsWith('pt-') || participant.id.startsWith('new-');
      
      let pId = participant.id;
      if (isNew) {
        const { data, error } = await supabase.from('participants').insert(pData).select().single();
        if (error) throw error;
        pId = data.id;
      } else {
        const { error } = await supabase.from('participants').update(pData).eq('id', participant.id);
        if (error) throw error;
      }
      
      // Insert enrollments if new
      if (isNew && participant.enrollments && participant.enrollments.length > 0) {
        const enrollments = participant.enrollments.map(e => ({
          participant_id: pId,
          sub_course_id: e.subCourseId,
          session_id: e.sessionId,
          start_date: e.startDate,
          end_date: e.endDate,
          status: e.status || '미수료',
          application_date: new Date().toISOString()
        }));
        await supabase.from('enrollments').insert(enrollments);
      }
      
      await get().fetchParticipants();
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  batchUpsertParticipants: async (participants) => {
    set({ isLoading: true, error: null });
    try {
      // In a real scenario, this would use a stored procedure to handle company upserts and enrollments.
      // For simplicity, we just upsert participants.
      const pToInsert = participants.map(p => {
         const data: any = {
            name: p.name,
            company_id: p.companyId,
            position: p.position,
            phone: p.phone,
            email: p.email,
            employment_insurance: p.employmentInsurance,
            work_experience: p.workExperience,
            document_skill: p.documentSkill
         };
         if (p.id && !p.id.startsWith('pt-') && !p.id.startsWith('new-')) {
             data.id = p.id;
         }
         return data;
      });
      
      const { error } = await supabase.from('participants').upsert(pToInsert);
      if (error) throw error;
      
      await get().fetchParticipants();
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  deleteParticipants: async (ids) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase.from('participants').delete().in('id', ids);
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

  subscribeToParticipants: () => {
    const channel = supabase
      .channel('public:participants')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'participants' },
        () => {
          get().fetchParticipants();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'enrollments' },
        () => {
          get().fetchParticipants();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
}));

