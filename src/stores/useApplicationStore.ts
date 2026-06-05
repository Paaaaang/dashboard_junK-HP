import { create } from "zustand";
import { supabase } from "@/api/supabase";
import type { ApplicationRecord } from "@/types/models";

interface ApplicationStore {
  applications: ApplicationRecord[];
  isLoading: boolean;
  error: string | null;
  fetchApplications: () => Promise<void>;
  approveApplications: (ids: string[]) => Promise<void>;
  rejectApplications: (ids: string[]) => Promise<void>;
  addApplication: (app: Omit<ApplicationRecord, "id" | "status" | "createdAt">) => Promise<void>;
  updateApplication: (id: string, updates: Partial<ApplicationRecord>) => Promise<void>;
  clearError: () => void;
}

export const useApplicationStore = create<ApplicationStore>((set, get) => ({
  applications: [],
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchApplications: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from("applications")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formatted = (data || []).map((app: any) => ({
        id: app.id,
        name: app.name,
        companyName: app.company_name,
        position: app.position || undefined,
        phone: app.phone || undefined,
        email: app.email || undefined,
        employmentInsurance: app.employment_insurance || "미확인",
        workExperience: app.work_experience || undefined,
        documentSkill: app.document_skill || undefined,
        mainProduct: app.main_product || undefined,
        courseGroupName: app.course_group_name,
        subCourseName: app.sub_course_name,
        sessionId: app.session_id || undefined,
        status: app.status,
        createdAt: app.created_at,
        processedAt: app.processed_at || undefined,
      }));

      set({ applications: formatted, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  approveApplications: async (ids) => {
    set({ isLoading: true, error: null });
    try {
      const { data: apps, error: fetchErr } = await supabase
        .from("applications")
        .select("*")
        .in("id", ids)
        .eq("status", "PENDING");

      if (fetchErr) throw fetchErr;

      if (!apps || apps.length === 0) {
        set({ isLoading: false });
        return;
      }

      for (const app of apps) {
        // Step 1: Find or Create Company
        let companyId: string;
        const cleanCompanyName = app.company_name.trim();

        const { data: existingCompanies, error: compFetchError } = await supabase
          .from("companies")
          .select("id, company_name")
          .is("deleted_at", null);

        if (compFetchError) throw compFetchError;

        const matchedCompany = (existingCompanies || []).find(
          (c) => c.company_name.replace(/\s+/g, "").toLowerCase() === cleanCompanyName.replace(/\s+/g, "").toLowerCase()
        );

        if (matchedCompany) {
          companyId = matchedCompany.id;
        } else {
          const { data: newCompany, error: compInsertError } = await supabase
            .from("companies")
            .insert({
              company_name: cleanCompanyName,
              mou_signed: false
            })
            .select("id")
            .single();

          if (compInsertError) throw compInsertError;
          companyId = newCompany.id;
        }

        // Step 2: Find or Create Participant
        let participantId: string;
        const cleanName = app.name.trim();
        const cleanEmail = app.email ? app.email.trim() : null;
        const cleanPhone = app.phone ? app.phone.trim() : null;

        let matchedParticipant = null;

        if (cleanEmail) {
          const { data: ptByEmail, error: ptByEmailError } = await supabase
            .from("participants")
            .select("id, company_id, name")
            .eq("company_id", companyId)
            .eq("email", cleanEmail)
            .is("deleted_at", null)
            .maybeSingle();

          if (ptByEmailError) throw ptByEmailError;
          matchedParticipant = ptByEmail;
        }

        if (!matchedParticipant && cleanPhone) {
          const { data: ptByPhone, error: ptByPhoneError } = await supabase
            .from("participants")
            .select("id, company_id, name")
            .eq("name", cleanName)
            .eq("phone", cleanPhone)
            .is("deleted_at", null)
            .maybeSingle();

          if (ptByPhoneError) throw ptByPhoneError;
          matchedParticipant = ptByPhone;
        }

        if (!matchedParticipant) {
          const { data: ptByName, error: ptByNameError } = await supabase
            .from("participants")
            .select("id, company_id, name")
            .eq("company_id", companyId)
            .eq("name", cleanName)
            .is("deleted_at", null)
            .maybeSingle();

          if (ptByNameError) throw ptByNameError;
          matchedParticipant = ptByName;
        }

        if (matchedParticipant) {
          participantId = matchedParticipant.id;
          const updateData: any = {};
          if (app.position) updateData.position = app.position.trim();
          if (cleanPhone) updateData.phone = cleanPhone;
          if (cleanEmail) updateData.email = cleanEmail;
          if (app.employment_insurance) updateData.employment_insurance = app.employment_insurance;
          if (app.work_experience) updateData.work_experience = app.work_experience.trim();
          if (app.document_skill) updateData.document_skill = app.document_skill.trim();

          if (Object.keys(updateData).length > 0) {
            await supabase
              .from("participants")
              .update(updateData)
              .eq("id", participantId);
          }
        } else {
          const insertData: any = {
            company_id: companyId,
            name: cleanName,
            position: app.position ? app.position.trim() : null,
            phone: cleanPhone,
            email: cleanEmail,
            employment_insurance: app.employment_insurance || "미확인",
            work_experience: app.work_experience ? app.work_experience.trim() : null,
            document_skill: app.document_skill ? app.document_skill.trim() : null
          };

          const { data: newPt, error: ptInsertError } = await supabase
            .from("participants")
            .insert(insertData)
            .select("id")
            .single();

          if (ptInsertError) throw ptInsertError;
          participantId = newPt.id;
        }

        // Step 3: Find Course Group & Sub Course
        if (!app.course_group_name || !app.course_group_name.trim() || !app.sub_course_name || !app.sub_course_name.trim()) {
          throw new Error(`'${app.name}' 신청자의 수강 과정 정보가 지정되지 않았습니다. 상세 서랍(Drawer)에서 교육 과정 및 기수(회차)를 지정한 후 승인해 주세요.`);
        }

        const { data: courseGroup, error: cgError } = await supabase
          .from("course_groups")
          .select("id")
          .eq("name", app.course_group_name.trim())
          .single();

        if (cgError || !courseGroup) {
          throw new Error(`과정 구분 '${app.course_group_name}'을 찾을 수 없습니다.`);
        }

        const { data: subCourse, error: scError } = await supabase
          .from("sub_courses")
          .select("id")
          .eq("group_id", courseGroup.id)
          .eq("name", app.sub_course_name.trim())
          .single();

        if (scError || !subCourse) {
          throw new Error(`세부 프로그램 '${app.sub_course_name}'을 찾을 수 없습니다.`);
        }

        // Step 4: Resolve Session
        let targetSessionId = app.session_id;

        if (!targetSessionId) {
          const todayStr = new Date().toISOString().slice(0, 10);
          const { data: sessions, error: sessionsError } = await supabase
            .from("sub_course_sessions")
            .select("id, start_date")
            .eq("sub_course_id", subCourse.id)
            .in("status", ["PLANNED", "ONGOING"])
            .order("start_date", { ascending: true });

          if (sessionsError) throw sessionsError;

          if (!sessions || sessions.length === 0) {
            throw new Error(`과정 '${app.sub_course_name}'에 개설되어 있는 활성 회차가 없습니다.`);
          }

          const futureSession = sessions.find((s) => s.start_date >= todayStr);
          targetSessionId = futureSession ? futureSession.id : sessions[0].id;
        }

        // Step 5: Check & Create Enrollment
        const { data: existingEnrollment } = await supabase
          .from("enrollments")
          .select("id")
          .eq("participant_id", participantId)
          .eq("session_id", targetSessionId)
          .maybeSingle();

        if (!existingEnrollment) {
          const { error: enrollError } = await supabase
            .from("enrollments")
            .insert({
              participant_id: participantId,
              session_id: targetSessionId,
              status: "미수료",
              application_at: app.created_at
            });

          if (enrollError) throw enrollError;
        }

        // Step 6: Map Company to Course if not already mapped
        const { data: existingCC } = await supabase
          .from("company_courses")
          .select("id")
          .eq("company_id", companyId)
          .eq("sub_course_id", subCourse.id)
          .maybeSingle();

        if (!existingCC) {
          await supabase
            .from("company_courses")
            .insert({
              company_id: companyId,
              sub_course_id: subCourse.id,
              status: "참여중"
            });
        }

        // Step 7: Update application status to APPROVED
        const { error: updateAppErr } = await supabase
          .from("applications")
          .update({
            status: "APPROVED",
            processed_at: new Date().toISOString()
          })
          .eq("id", app.id);

        if (updateAppErr) throw updateAppErr;
      }

      await get().fetchApplications();
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  rejectApplications: async (ids) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from("applications")
        .update({
          status: "REJECTED",
          processed_at: new Date().toISOString()
        })
        .in("id", ids)
        .eq("status", "PENDING");

      if (error) throw error;

      await get().fetchApplications();
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  addApplication: async (app) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from("applications")
        .insert({
          name: app.name.trim(),
          company_name: app.companyName.trim(),
          position: app.position || null,
          phone: app.phone || null,
          email: app.email || null,
          employment_insurance: app.employmentInsurance || "미확인",
          work_experience: app.workExperience || null,
          document_skill: app.documentSkill || null,
          main_product: app.mainProduct || null,
          course_group_name: app.courseGroupName ? app.courseGroupName.trim() : null,
          sub_course_name: app.subCourseName ? app.subCourseName.trim() : null,
          session_id: app.sessionId || null,
          status: "PENDING"
        });

      if (error) throw error;
      await get().fetchApplications();
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  updateApplication: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name.trim();
      if (updates.companyName !== undefined) dbUpdates.company_name = updates.companyName.trim();
      if (updates.position !== undefined) dbUpdates.position = updates.position || null;
      if (updates.phone !== undefined) dbUpdates.phone = updates.phone || null;
      if (updates.email !== undefined) dbUpdates.email = updates.email || null;
      if (updates.employmentInsurance !== undefined) dbUpdates.employment_insurance = updates.employmentInsurance;
      if (updates.workExperience !== undefined) dbUpdates.work_experience = updates.workExperience || null;
      if (updates.documentSkill !== undefined) dbUpdates.document_skill = updates.documentSkill || null;
      if (updates.mainProduct !== undefined) dbUpdates.main_product = updates.mainProduct || null;
      if (updates.courseGroupName !== undefined) dbUpdates.course_group_name = updates.courseGroupName ? updates.courseGroupName.trim() : null;
      if (updates.subCourseName !== undefined) dbUpdates.sub_course_name = updates.subCourseName ? updates.subCourseName.trim() : null;
      if (updates.sessionId !== undefined) dbUpdates.session_id = updates.sessionId || null;
      if (updates.status !== undefined) dbUpdates.status = updates.status;

      const { error } = await supabase
        .from("applications")
        .update(dbUpdates)
        .eq("id", id);

      if (error) throw error;
      await get().fetchApplications();
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },
}));
