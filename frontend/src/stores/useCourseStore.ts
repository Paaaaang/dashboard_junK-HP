import { create } from "zustand";
import { supabase } from "../api/supabase";
import type { CourseType } from "../types/models";
import { CourseGroup, CourseDetail, AudienceOption } from "../pages/companies/modals/CourseManagerModal";

interface CourseStore {
  courseGroups: CourseGroup[];
  isLoading: boolean;
  error: string | null;
  fetchCourseGroups: () => Promise<void>;
  setCourseGroups: (groups: CourseGroup[]) => void;
  addCourseGroup: (group: CourseGroup) => void;
  updateCourseGroup: (group: CourseGroup) => void;
  deleteCourseGroup: (id: string) => void;
}

const TAB_GROUP_IDS = {
  TRAINING: "course-group-training",
  SUPPORT: "course-group-support",
  SEMINAR: "course-group-seminar",
} as const;

export const useCourseStore = create<CourseStore>((set) => ({
  courseGroups: [],
  isLoading: false,
  error: null,

  fetchCourseGroups: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data: groups, error: groupsError } = await supabase
        .from('course_groups')
        .select('*');
      
      if (groupsError) throw groupsError;

      const { data: details, error: detailsError } = await supabase
        .from('sub_courses')
        .select('*');

      if (detailsError) throw detailsError;

      const baseAudiences: Record<string, AudienceOption[]> = {
        훈련비과정: ["재직자 (고용보험 가입)", "재직자 (고용보험 미가입)"],
        지원비과정: ["기업 대표", "임원"],
        "공유개방 세미나": ["미래인재", "재직자 (고용보험 가입)"],
      };

      const courseGroups: CourseGroup[] = (groups || []).map(g => ({
        id: g.id,
        name: g.name,
        audiences: baseAudiences[g.name] || [],
        details: (details || [])
          .filter(d => d.group_id === g.id)
          .map(d => {
            const start = d.start_date ? new Date(d.start_date) : null;
            const end = d.end_date ? new Date(d.end_date) : null;
            let durationDays = 0;
            if (start && end && !isNaN(start.getTime()) && !isNaN(end.getTime())) {
              durationDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            }

            return {
              id: d.id,
              name: d.name,
              startDate: d.start_date || "",
              endDate: d.end_date || "",
              durationDays,
              totalHours: d.total_hours || 0,
              targetOutcome: d.target_outcome || 0,
            };
          })
      }));

      set({ courseGroups, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  setCourseGroups: (courseGroups) => set({ courseGroups }),
  addCourseGroup: (group) => set((state) => ({ courseGroups: [...state.courseGroups, group] })),
  updateCourseGroup: (group) => set((state) => ({
    courseGroups: state.courseGroups.map((g) => g.id === group.id ? group : g)
  })),
  deleteCourseGroup: (id) => set((state) => ({
    courseGroups: state.courseGroups.filter((g) => g.id !== id)
  })),
}));
