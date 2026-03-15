import { create } from "zustand";
import { api } from "@/lib/api";
import { Subject } from "@/types";

interface SubjectsState {
  subjects: Subject[];
  loading: boolean;
  fetchSubjects: () => Promise<void>;
  addSubject: (subject: Subject) => void;
  updateSubject: (id: string, data: Partial<Subject>) => void;
  removeSubject: (id: string) => void;
  getSubject: (id: string) => Subject | undefined;
}

export const useSubjectsStore = create<SubjectsState>((set, get) => ({
  subjects: [],
  loading: false,

  fetchSubjects: async () => {
    set({ loading: true });
    try {
      const { data } = await api.get("/subjects");
      set({ subjects: data, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  addSubject: (subject) =>
    set((state) => ({ subjects: [...state.subjects, subject] })),

  updateSubject: (id, data) =>
    set((state) => ({
      subjects: state.subjects.map((s) => (s.id === id ? { ...s, ...data } : s)),
    })),

  removeSubject: (id) =>
    set((state) => ({ subjects: state.subjects.filter((s) => s.id !== id) })),

  getSubject: (id) => get().subjects.find((s) => s.id === id),
}));
