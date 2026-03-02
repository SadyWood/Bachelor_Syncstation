import { create } from 'zustand';
import { apiClient } from '@/api/client';

type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
};

type AuthState = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  login: async (email, password) => {
    const { data } = await apiClient.post('/auth/login', { email, password });
    if (!data.ok) {
      throw new Error(data.message ?? 'Login failed');
    }

    set({
      user: data.user,
      token: data.accessToken,
      isAuthenticated: true,
    });
  },
  logout: () => set({ user: null, token: null, isAuthenticated: false }),

}));
