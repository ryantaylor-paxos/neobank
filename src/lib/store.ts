import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserAccount {
  identity_id: string;
  profile_id: string;
  account_id: string;
  first_name: string;
  last_name: string;
}

interface AppState {
  user: UserAccount | null;
  setUser: (user: UserAccount) => void;
  clearUser: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
    }),
    { name: 'neobank-user' },
  ),
);
