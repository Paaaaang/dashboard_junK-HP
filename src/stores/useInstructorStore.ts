import { create } from "zustand";
import { supabase } from "@/api/supabase";

export interface AssignedSession {
  id: string;
  startDate: string;
  endDate: string;
  subCourseName: string;
  groupName: string;
}

export interface InstructorRecord {
  id: string;
  name: string;
  phone: string;
  email: string;
  specialty: string;
  assignedSessions?: AssignedSession[];
  createdAt?: string;
  updatedAt?: string;
}

interface InstructorStore {
  instructors: InstructorRecord[];
  isLoading: boolean;
  error: string | null;
  fetchInstructors: () => Promise<void>;
  fetchSessionInstructors: (sessionId: string) => Promise<InstructorRecord[]>;
  upsertInstructor: (instructor: Partial<InstructorRecord>) => Promise<void>;
  deleteInstructor: (id: string) => Promise<void>;
  assignInstructorToSession: (instructorId: string, sessionId: string) => Promise<void>;
  removeInstructorFromSession: (instructorId: string, sessionId: string) => Promise<void>;
  subscribeToInstructors: () => () => void;
  clearError: () => void;
}

export const useInstructorStore = create<InstructorStore>((set, get) => ({
  instructors: [],
  isLoading: false,
  error: null,

  fetchInstructors: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from("instructors")
        .select(`
          *,
          session_instructors (
            id,
            sub_course_sessions (
              id,
              start_date,
              end_date,
              sub_courses (
                id,
                name,
                course_groups (
                  id,
                  name
                )
              )
            )
          )
        `)
        .order("name", { ascending: true });

      if (error) throw error;

      const formatted: InstructorRecord[] = (data || []).map((p: any) => {
        const assignedSessions: AssignedSession[] = (p.session_instructors || []).map((si: any) => {
          const session = si.sub_course_sessions;
          const subCourse = session?.sub_courses;
          const group = subCourse?.course_groups;

          return {
            id: session?.id || "",
            startDate: session?.start_date || "",
            endDate: session?.end_date || "",
            subCourseName: subCourse?.name || "",
            groupName: group?.name || ""
          };
        }).filter((s: AssignedSession) => s.id);

        return {
          id: p.id,
          name: p.name,
          phone: p.phone || "",
          email: p.email || "",
          specialty: p.specialty || "",
          assignedSessions,
          createdAt: p.created_at,
          updatedAt: p.updated_at,
        };
      });

      set({ instructors: formatted });
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchSessionInstructors: async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from("session_instructors")
        .select(`
          instructor_id,
          instructors (*)
        `)
        .eq("session_id", sessionId);

      if (error) throw error;

      return (data || []).map((si: any) => {
        const p = si.instructors;
        return {
          id: p.id,
          name: p.name,
          phone: p.phone || "",
          email: p.email || "",
          specialty: p.specialty || "",
          createdAt: p.created_at,
          updatedAt: p.updated_at,
        };
      });
    } catch (err: any) {
      console.error("Error fetching session instructors:", err);
      return [];
    }
  },

  upsertInstructor: async (instructor) => {
    set({ isLoading: true, error: null });
    try {
      const isNew = !instructor.id || instructor.id.startsWith("new-");
      const payload: any = {
        name: instructor.name,
        phone: instructor.phone,
        email: instructor.email,
        specialty: instructor.specialty,
      };

      if (!isNew) {
        payload.id = instructor.id;
        payload.updated_at = new Date().toISOString();
      }

      const { error } = await supabase.from("instructors").upsert(payload);
      if (error) throw error;

      await get().fetchInstructors();
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteInstructor: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase.from("instructors").delete().eq("id", id);
      if (error) throw error;
      set({
        instructors: get().instructors.filter((i) => i.id !== id),
      });
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  assignInstructorToSession: async (instructorId: string, sessionId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase.from("session_instructors").upsert({
        instructor_id: instructorId,
        session_id: sessionId,
      });
      if (error) throw error;
      await get().fetchInstructors();
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  removeInstructorFromSession: async (instructorId: string, sessionId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from("session_instructors")
        .delete()
        .eq("instructor_id", instructorId)
        .eq("session_id", sessionId);
      if (error) throw error;
      await get().fetchInstructors();
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  subscribeToInstructors: () => {
    const channel = supabase
      .channel("public:instructors_sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "instructors" },
        () => {
          get().fetchInstructors();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "session_instructors" },
        () => {
          get().fetchInstructors();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  clearError: () => set({ error: null }),
}));
