import { create } from 'zustand';
import { User } from '@supabase/auth-helpers-nextjs';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setIsLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setIsLoading: (isLoading) => set({ isLoading }),
}));