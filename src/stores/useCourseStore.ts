import { create } from "zustand";
import { supabase } from "@/api/supabase";
import { CourseGroup, AudienceOption } from "@/types/models";

interface CourseStore {
  courseGroups: CourseGroup[];
  isLoading: boolean;
  error: string | null;
  fetchCourseGroups: () => Promise<void>;
  setCourseGroups: (groups: CourseGroup[]) => void;
  addCourseGroup: (group: CourseGroup) => Promise<void>;
  updateCourseGroup: (group: CourseGroup) => Promise<void>;
  deleteCourseGroup: (id: string) => Promise<void>;
  subscribeToCourses: () => () => void;
  clearError: () => void;
  }

  export const useCourseStore = create<CourseStore>((set, get) => ({
  courseGroups: [],
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchCourseGroups: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data: groupsData, error: groupsError } = await supabase
        .from('course_groups')
        .select(`
          *,
          sub_courses (
            *,
            sessions:sub_course_sessions (*)
          )
        `);

      if (groupsError) throw groupsError;

      const baseAudiences: Record<string, AudienceOption[]> = {
        훈련비과정: ["재직자 (고용보험 가입)", "재직자 (고용보험 미가입)"],
        지원비과정: ["기업 대표", "임원"],
        "공유개방 세미나": ["미래인재", "재직자 (고용보험 가입)"],
      };

      const courseGroups: CourseGroup[] = (groupsData || []).map((g: any) => ({
        id: g.id,
        name: g.name,
        audiences: baseAudiences[g.name] || [],
        createdAt: g.created_at || g.createdAt,
        details: (g.sub_courses || [])
          .map((d: any) => {
            const startDate = d.start_date || d.startDate;
            const endDate = d.end_date || d.endDate;
            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;
            let durationDays = 0;
            if (start && end && !isNaN(start.getTime()) && !isNaN(end.getTime())) {
              durationDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            }

            return {
              id: d.id,
              name: d.name,
              startDate: startDate || "",
              endDate: endDate || "",
              durationDays,
              totalHours: d.total_hours || d.totalHours || 0,
              targetOutcome: d.target_outcome || d.targetOutcome || 0,
              sessions: (d.sessions || []).map((s: any) => ({
                id: s.id,
                startDate: s.start_date || s.startDate,
                endDate: s.end_date || s.endDate,
                totalHours: s.total_hours || s.totalHours,
                targetOutcome: s.target_outcome || s.targetOutcome
              })).filter((s: any) => s !== null)
            };
          })
      }));

      set({ courseGroups, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  setCourseGroups: (courseGroups) => set({ courseGroups }),

  addCourseGroup: async (group) => {
    set({ isLoading: true, error: null });
    try {
      const { data: groupData, error: groupError } = await supabase
        .from('course_groups')
        .insert({ name: group.name, description: "" })
        .select()
        .single();
        
      if (groupError) throw groupError;
      const groupId = groupData.id;
      
      // Add sub-courses (details)
      const finalDetails = [];
      for (const d of group.details) {
        const { data: subData, error: subError } = await supabase
          .from('sub_courses')
          .insert({
            group_id: groupId,
            name: d.name,
            start_date: d.startDate || null,
            end_date: d.endDate || null,
            total_hours: d.totalHours,
            target_outcome: d.targetOutcome,
          })
          .select()
          .single();
          
        if (subError) throw subError;
        
        let sessions: any[] = [];
        if (d.sessions && d.sessions.length > 0) {
           const sessionsToInsert = d.sessions.map((s: any) => ({
               sub_course_id: subData.id,
               start_date: s.startDate,
               end_date: s.endDate,
               total_hours: s.totalHours,
               target_outcome: s.targetOutcome
           }));
           const { data: sessData, error: sessError } = await supabase
               .from('sub_course_sessions')
               .insert(sessionsToInsert)
               .select();
           if (sessError) throw sessError;
           sessions = sessData.map((s:any) => ({
               id: s.id,
               startDate: s.start_date,
               endDate: s.end_date,
               totalHours: s.total_hours,
               targetOutcome: s.target_outcome
           }));
        }
        
        finalDetails.push({ ...d, id: subData.id, sessions });
      }

      const newGroup = { ...group, id: groupId, details: finalDetails };
      set((state) => ({ 
        courseGroups: [...state.courseGroups, newGroup],
        isLoading: false 
      }));
      
      // Force a re-fetch to ensure everything is perfectly synced
      await get().fetchCourseGroups();
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  updateCourseGroup: async (group) => {
    set({ isLoading: true, error: null });
    try {
      // 1. Update group basic info
      const { error: groupError } = await supabase
        .from('course_groups')
        .update({ name: group.name, description: "" })
        .eq('id', group.id);
        
      if (groupError) throw groupError;

      // 2. Sync sub-courses (details)
      const { data: existingSubCourses, error: fetchError } = await supabase
        .from('sub_courses')
        .select('*')
        .eq('group_id', group.id);
        
      if (fetchError) throw fetchError;

      const currentDetailIds = group.details.map(d => String(d.id));

      // Find sub-courses to delete
      const toDeleteIds = (existingSubCourses || [])
        .filter((sc: any) => !currentDetailIds.includes(String(sc.id)))
        .map((sc: any) => sc.id);
        
      if (toDeleteIds.length > 0) {
          await supabase.from('sub_courses').delete().in('id', toDeleteIds);
      }

      // Add or update sub-courses
      const finalDetails = [];
      for (const d of group.details) {
        let subCourseId = d.id;
        if (typeof d.id === 'string' && (d.id.startsWith("detail-") || d.id.startsWith("local-"))) {
          // Create new sub-course
          const { data: subData, error: subError } = await supabase
            .from('sub_courses')
            .insert({
                group_id: group.id,
                name: d.name,
                start_date: d.startDate || null,
                end_date: d.endDate || null,
                total_hours: d.totalHours,
                target_outcome: d.targetOutcome,
            })
            .select()
            .single();
            
          if (subError) throw subError;
          subCourseId = subData.id;
        } else {
          // Update existing
          const { error: updateError } = await supabase
            .from('sub_courses')
            .update({
                name: d.name,
                start_date: d.startDate || null,
                end_date: d.endDate || null,
                total_hours: d.totalHours,
                target_outcome: d.targetOutcome,
            })
            .eq('id', d.id);
            
          if (updateError) throw updateError;
        }
        
        // Sync Sessions
        // First delete existing sessions
        await supabase.from('sub_course_sessions').delete().eq('sub_course_id', subCourseId);
        
        let sessions: any[] = [];
        if (d.sessions && d.sessions.length > 0) {
           const sessionsToInsert = d.sessions.map((s: any) => ({
               sub_course_id: subCourseId,
               start_date: s.startDate,
               end_date: s.endDate,
               total_hours: s.totalHours,
               target_outcome: s.targetOutcome
           }));
           const { data: sessData, error: sessError } = await supabase
               .from('sub_course_sessions')
               .insert(sessionsToInsert)
               .select();
           if (sessError) throw sessError;
           sessions = sessData.map((s:any) => ({
               id: s.id,
               startDate: s.start_date,
               endDate: s.end_date,
               totalHours: s.total_hours,
               targetOutcome: s.target_outcome
           }));
        }
        
        finalDetails.push({ ...d, id: subCourseId, sessions });
      }
      
      const finalGroup = { ...group, details: finalDetails };

      set((state) => ({
        courseGroups: state.courseGroups.map((g) => g.id === group.id ? finalGroup : g),
        isLoading: false
      }));

      await get().fetchCourseGroups();
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  deleteCourseGroup: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase.from('course_groups').delete().eq('id', id);
      if (error) throw error;
      set((state) => ({
        courseGroups: state.courseGroups.filter((g) => g.id !== id),
        isLoading: false
      }));
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  subscribeToCourses: () => {
    const channel = supabase
      .channel('public:courses')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'course_groups' },
        () => {
          get().fetchCourseGroups();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sub_courses' },
        () => {
          get().fetchCourseGroups();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sub_course_sessions' },
        () => {
          get().fetchCourseGroups();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
}));

