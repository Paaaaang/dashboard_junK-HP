import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '../api/client';

interface User {
  id: string;
  username: string;
  role: string;
  name?: string;
  email?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (username, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.post('/v1/auth/login', { username, password });
          const { token, user } = response.data;
          
          localStorage.setItem('authToken', token);
          set({ 
            user, 
            token, 
            isAuthenticated: true, 
            isLoading: false 
          });
        } catch (err: any) {
          set({ 
            error: err.response?.data?.error || '로그인에 실패했습니다.', 
            isLoading: false 
          });
          throw err;
        }
      },

      logout: () => {
        localStorage.removeItem('authToken');
        set({ 
          user: null, 
          token: null, 
          isAuthenticated: false,
          error: null
        });
      },

      checkAuth: async () => {
        const token = localStorage.getItem('authToken');
        if (!token) {
          set({ isAuthenticated: false, user: null });
          return;
        }

        try {
          const response = await apiClient.get('/v1/auth/me');
          set({ 
            user: response.data.user, 
            token, 
            isAuthenticated: true 
          });
        } catch (err) {
          localStorage.removeItem('authToken');
          set({ isAuthenticated: false, user: null, token: null });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
);
