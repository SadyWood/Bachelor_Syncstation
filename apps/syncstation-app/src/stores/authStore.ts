import { create } from 'zustand';

type User = {
  id: string;
  email: string;
  name: string;
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

  login: async (email, _password) => {
    await new Promise((r) => setTimeout(r, 600));
    set({
      user: { id: '1', email, name: 'Mock User' },
      token: 'mock-token-123',
      isAuthenticated: true,
    });
  },
  logout: () => set({ user: null, token: null, isAuthenticated: false }),

}));
