import { create } from 'zustand';

export interface UserProfile {
  id: number;
  nombres: string;
  apellidos: string;
  correo: string;
  rol: string;
  clinicaId: number;
  clinicaNombre: string;
  foto?: string | null;
}

interface AuthState {
  accessToken: string | null;
  usuario: UserProfile | null;
  isAuthenticated: boolean;
  setAuth: (accessToken: string, usuario: UserProfile) => void;
  setAccessToken: (accessToken: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  usuario: null,
  isAuthenticated: false,
  setAuth: (accessToken, usuario) =>
    set({ accessToken, usuario, isAuthenticated: true }),
  setAccessToken: (accessToken) =>
    set({ accessToken, isAuthenticated: true }),
  clearAuth: () =>
    set({ accessToken: null, usuario: null, isAuthenticated: false }),
}));
