import { create } from 'zustand';

export interface AppState {
  theme: 'light' | 'dark';
  user: any | null;
  setTheme: (theme: 'light' | 'dark') => void;
  setUser: (user: any) => void;
  reset: () => void;
}

const initialState = {
  theme: 'light' as const,
  user: null,
};

export const useAppStore = create<AppState>((set) => ({
  ...initialState,

  setTheme: (theme) => set({ theme }),
  setUser: (user) => set({ user }),
  
  reset: () => set({ ...initialState }),
}));
