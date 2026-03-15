import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "@/lib/api";

interface User {
  id: string;
  name: string;
  email: string;
  plan: "FREE" | "PRO";
  planExpiresAt?: string;
  avatarUrl?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post("/auth/login", { email, password });
          set({ user: data.user, token: data.token, isLoading: false });
          api.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      register: async (name, email, password) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post("/auth/register", { name, email, password });
          set({ user: data.user, token: data.token, isLoading: false });
          api.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      logout: () => {
        set({ user: null, token: null });
        delete api.defaults.headers.common["Authorization"];
      },

      refreshUser: async () => {
        const { token } = get();
        if (!token) return;
        try {
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
          const { data } = await api.get("/auth/me");
          set({ user: data });
        } catch {
          set({ user: null, token: null });
        }
      },
    }),
    {
      name: "sylla-auth",
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          api.defaults.headers.common["Authorization"] = `Bearer ${state.token}`;
        }
      },
    }
  )
);
