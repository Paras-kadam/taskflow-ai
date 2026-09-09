import { create } from 'zustand';
import { authAPI } from '../services/api';
import { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: (silent?: boolean) => Promise<void>;
  checkAuth: () => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
}

const initialToken = typeof localStorage !== 'undefined' ? localStorage.getItem('taskflow-auth-token') : null;

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: initialToken,
  isAuthenticated: false,
  isLoading: true,
  
  login: async (data) => {
    try {
      const response = await authAPI.login(data);
      if (response.token) {
        localStorage.setItem('taskflow-auth-token', response.token);
      }
      set({ user: response.user, token: response.token || null, isAuthenticated: true });
    } catch (error) {
      throw error;
    }
  },
  
  register: async (data) => {
    try {
      const response = await authAPI.register(data);
      if (response.token) {
        localStorage.setItem('taskflow-auth-token', response.token);
      }
      set({ user: response.user, token: response.token || null, isAuthenticated: true });
    } catch (error) {
      throw error;
    }
  },
  
  logout: async (silent = false) => {
    try {
      if (!silent) {
        await authAPI.logout();
      }
    } catch (error) {
      console.error('Logout error', error);
    } finally {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('taskflow-auth-token');
      }
      set({ user: null, token: null, isAuthenticated: false });
    }
  },
  
  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const response = await authAPI.getMe();
      set({ user: response.user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('taskflow-auth-token');
      }
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },
  
  updateProfile: async (data) => {
    try {
      const response = await authAPI.updateProfile(data);
      set({ user: response.user });
    } catch (error) {
      throw error;
    }
  }
}));
