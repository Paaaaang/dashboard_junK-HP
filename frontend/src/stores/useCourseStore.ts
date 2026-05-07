import { create } from "zustand";
import apiClient from "../api/client";
import { CourseGroup, AudienceOption } from "../types/models";

interface CourseStore {
  courseGroups: CourseGroup[];
  isLoading: boolean;
  error: string | null;
  fetchCourseGroups: () => Promise<void>;
  setCourseGroups: (groups: CourseGroup[]) => void;
  addCourseGroup: (group: CourseGroup) => Promise<void>;
  updateCourseGroup: (group: CourseGroup) => Promise<void>;
  deleteCourseGroup: (id: string) => Promise<void>;
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
      const [groupsRes, detailsRes] = await Promise.all([
        apiClient.get('v1/course-groups'),
        apiClient.get('v1/sub-courses')
      ]);

      const groups = groupsRes.data;
      const details = detailsRes.data;

      const baseAudiences: Record<string, AudienceOption[]> = {
        훈련비과정: ["재직자 (고용보험 가입)", "재직자 (고용보험 미가입)"],
        지원비과정: ["기업 대표", "임원"],
        "공유개방 세미나": ["미래인재", "재직자 (고용보험 가입)"],
      };

      const courseGroups: CourseGroup[] = (groups || []).map((g: any) => ({
        id: g.id,
        name: g.name,
        audiences: baseAudiences[g.name] || [],
        details: (details || [])
          .filter((d: any) => d.groupId === g.id)
          .map((d: any) => {
            const start = d.startDate ? new Date(d.startDate) : null;
            const end = d.endDate ? new Date(d.endDate) : null;
            let durationDays = 0;
            if (start && end && !isNaN(start.getTime()) && !isNaN(end.getTime())) {
              durationDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            }

            return {
              id: d.id,
              name: d.name,
              startDate: d.startDate || "",
              endDate: d.endDate || "",
              durationDays,
              totalHours: d.totalHours || 0,
              targetOutcome: d.targetOutcome || 0,
              sessions: (d.sessions || []).filter((s: any) => s !== null)
            };
          })
      }));

      set({ courseGroups, isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.error || err.message, isLoading: false });
    }
  },

  setCourseGroups: (courseGroups) => set({ courseGroups }),

  addCourseGroup: async (group) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post('v1/course-groups', {
        name: group.name,
        description: "" 
      });
      const groupId = response.data.id;
      
      // Add sub-courses (details)
      const finalDetails = [];
      for (const d of group.details) {
        const res = await apiClient.post('v1/sub-courses', {
          groupId: groupId,
          name: d.name,
          startDate: d.startDate || null,
          endDate: d.endDate || null,
          totalHours: d.totalHours,
          targetOutcome: d.targetOutcome,
          sessions: d.sessions || []
        });
        finalDetails.push({ ...d, id: res.data.id, sessions: res.data.sessions || [] });
      }

      const newGroup = { ...group, id: groupId, details: finalDetails };
      set((state) => ({ 
        courseGroups: [...state.courseGroups, newGroup],
        isLoading: false 
      }));
      
      // Force a re-fetch to ensure everything is perfectly synced
      await get().fetchCourseGroups();
    } catch (err: any) {
      set({ error: err.response?.data?.error || err.message, isLoading: false });
      throw err;
    }
  },

  updateCourseGroup: async (group) => {
    set({ isLoading: true, error: null });
    try {
      // 1. Update group basic info
      await apiClient.put(`v1/course-groups/${group.id}`, {
        name: group.name,
        description: ""
      });

      // 2. Sync sub-courses (details)
      const existingSubCoursesRes = await apiClient.get('v1/sub-courses');
      const existingSubCourses = existingSubCoursesRes.data || [];
      const currentDetailIds = group.details.map(d => String(d.id));

      // Find sub-courses to delete (only for this group)
      const toDelete = existingSubCourses.filter((sc: any) => 
        String(sc.groupId) === String(group.id) && !currentDetailIds.includes(String(sc.id))
      );
      for (const sc of toDelete) {
        await apiClient.delete(`v1/sub-courses/${sc.id}`);
      }

      // Add or update sub-courses
      const finalDetails = [];
      for (const d of group.details) {
        if (typeof d.id === 'string' && (d.id.startsWith("detail-") || d.id.startsWith("local-"))) {
          // Create new sub-course
          const res = await apiClient.post('v1/sub-courses', {
            groupId: group.id,
            name: d.name,
            startDate: d.startDate || null,
            endDate: d.endDate || null,
            totalHours: d.totalHours,
            targetOutcome: d.targetOutcome,
            sessions: d.sessions || []
          });
          finalDetails.push({ ...d, id: res.data.id, sessions: res.data.sessions || [] });
        } else {
          // Update existing
          const res = await apiClient.put(`v1/sub-courses/${d.id}`, {
            groupId: group.id,
            name: d.name,
            startDate: d.startDate || null,
            endDate: d.endDate || null,
            totalHours: d.totalHours,
            targetOutcome: d.targetOutcome,
            sessions: d.sessions || []
          });
          finalDetails.push({ ...d, sessions: res.data.sessions || [] });
        }
      }
      
      const finalGroup = { ...group, details: finalDetails };

      set((state) => ({
        courseGroups: state.courseGroups.map((g) => g.id === group.id ? finalGroup : g),
        isLoading: false
      }));

      // Force a re-fetch to ensure the UI is perfectly synced with the database
      await get().fetchCourseGroups();
    } catch (err: any) {
      set({ error: err.response?.data?.error || err.message, isLoading: false });
      throw err;
    }
  },

  deleteCourseGroup: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.delete(`v1/course-groups/${id}`);
      set((state) => ({
        courseGroups: state.courseGroups.filter((g) => g.id !== id),
        isLoading: false
      }));
    } catch (err: any) {
      set({ error: err.response?.data?.error || err.message, isLoading: false });
    }
  },
}));

