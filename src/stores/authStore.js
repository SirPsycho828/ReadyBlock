import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  role: null,
  loading: true,
  error: null,

  setUser: (user) => set({ user, loading: false }),
  setRole: (role) => set({ role }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  reset: () =>
    set({
      user: null,
      role: null,
      loading: false,
      error: null,
    }),
}));
