import { create } from 'zustand';

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
    const response = await fetch('http://192.168.50.208:3333/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
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
