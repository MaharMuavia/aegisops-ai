import { create } from "zustand";

interface User {
  username: string;
  role: string;
  token: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, role: string, token: string) => void;
  logout: () => void;
}

// Helper to safely get data from localStorage in Next.js (checking for window presence)
const getInitialUser = (): User | null => {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem("aegisops_auth");
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  user: getInitialUser(),
  isAuthenticated: getInitialUser() !== null,
  login: (username, role, token) => {
    const newUser = { username, role, token };
    localStorage.setItem("aegisops_auth", JSON.stringify(newUser));
    set({ user: newUser, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem("aegisops_auth");
    set({ user: null, isAuthenticated: false });
  },
}));
