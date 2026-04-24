import { create } from "zustand";
import { initialParticipants } from "../constants";
import type { ParticipantRecord } from "../types/models";

interface ParticipantStore {
  participants: ParticipantRecord[];
  upsertParticipant: (participant: ParticipantRecord) => void;
  deleteParticipants: (ids: string[]) => void;
}

export const useParticipantStore = create<ParticipantStore>((set) => ({
  participants: initialParticipants,
  upsertParticipant: (participant) =>
    set((state) => ({
      participants: state.participants.some((p) => p.id === participant.id)
        ? state.participants.map((p) => (p.id === participant.id ? participant : p))
        : [...state.participants, participant],
    })),
  deleteParticipants: (ids) =>
    set((state) => ({
      participants: state.participants.filter((p) => !ids.includes(p.id)),
    })),
}));
