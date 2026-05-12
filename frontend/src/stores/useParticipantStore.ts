import { create } from "zustand";
import apiClient from "../api/client";
import { supabase } from "../api/supabase";
import type { ParticipantRecord } from "../types/models";

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
      const response = await apiClient.get('v1/participants');
      set({ participants: response.data, isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.error || err.message, isLoading: false });
    }
  },

  fetchSessionParticipants: async (sessionId: string) => {
    try {
      const response = await apiClient.get(`v1/sessions/${sessionId}/participants`);
      return response.data;
    } catch (err: any) {
      console.error('Error fetching session participants:', err);
      return [];
    }
  },

  bulkUpdateEnrollments: async (enrollmentIds, status, completionDate) => {
    set({ isLoading: true });
    try {
      await apiClient.put('v1/enrollments/bulk', { enrollmentIds, status, completionDate });
      await get().fetchParticipants(); // Refresh global state
      set({ isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.error || err.message, isLoading: false });
      throw err;
    }
  },

  addEnrollment: async (enrollment) => {
    set({ isLoading: true });
    try {
      await apiClient.post('v1/enrollments', enrollment);
      await get().fetchParticipants();
      set({ isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.error || err.message, isLoading: false });
      throw err;
    }
  },

  removeEnrollment: async (enrollmentId) => {
    set({ isLoading: true });
    try {
      await apiClient.delete(`v1/enrollments/${enrollmentId}`);
      await get().fetchParticipants();
      set({ isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.error || err.message, isLoading: false });
      throw err;
    }
  },

  upsertParticipant: async (participant) => {
    set({ isLoading: true, error: null });
    try {
      const isNew = !participant.id || participant.id.startsWith('pt-') || participant.id.startsWith('new-');
      
      let response;
      if (isNew) {
        response = await apiClient.post('v1/participants', participant);
      } else {
        response = await apiClient.put(`v1/participants/${participant.id}`, participant);
      }
      
      const saved = response.data;
      set((state) => ({
        participants: state.participants.some((p) => p.id === saved.id)
          ? state.participants.map((p) => (p.id === saved.id ? saved : p))
          : [saved, ...state.participants],
        isLoading: false
      }));
    } catch (err: any) {
      set({ error: err.response?.data?.error || err.message, isLoading: false });
      throw err;
    }
  },

  batchUpsertParticipants: async (participants) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post('v1/participants/batch', { participants });
      const savedParticipants = response.data;

      set((state) => {
        const nextParticipants = [...state.participants];
        savedParticipants.forEach((saved: ParticipantRecord) => {
          const idx = nextParticipants.findIndex(p => p.id === saved.id || (p.name === saved.name && p.companyId === saved.companyId));
          if (idx !== -1) {
            nextParticipants[idx] = saved;
          } else {
            nextParticipants.unshift(saved);
          }
        });
        return { participants: nextParticipants, isLoading: false };
      });
    } catch (err: any) {
      set({ error: err.response?.data?.error || err.message, isLoading: false });
      throw err;
    }
  },

  deleteParticipants: async (ids) => {
    set({ isLoading: true, error: null });
    try {
      await Promise.all(ids.map(id => apiClient.delete(`v1/participants/${id}`)));

      set((state) => ({
        participants: state.participants.filter((p) => !ids.includes(p.id)),
        isLoading: false
      }));
    } catch (err: any) {
      set({ error: err.response?.data?.error || err.message, isLoading: false });
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

