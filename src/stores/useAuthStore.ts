import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/api/supabase';

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
  logout: () => Promise<void>;
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
          // ID 기반 로그인 지원: 이메일 형식이 아니면 내부 도메인(@admin.local)을 붙임
          const loginEmail = username.includes('@') ? username : `${username}@admin.local`;

          const { data, error } = await supabase.auth.signInWithPassword({
            email: loginEmail,
            password: password,
          });

          if (error) throw error;

          const session = data.session;
          const user = data.user;

          if (session && user) {
            set({ 
              user: {
                id: user.id,
                username: user.email || '',
                role: 'admin', // default role, or get from user metadata
                email: user.email,
              }, 
              token: session.access_token, 
              isAuthenticated: true, 
              isLoading: false 
            });
          }
        } catch (err: any) {
          set({ 
            error: err.message || '로그인에 실패했습니다.', 
            isLoading: false 
          });
          throw err;
        }
      },

      logout: async () => {
        await supabase.auth.signOut();
        set({ 
          user: null, 
          token: null, 
          isAuthenticated: false,
          error: null
        });
      },

      checkAuth: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          set({ isAuthenticated: false, user: null, token: null });
          return;
        }

        const user = session.user;
        set({ 
          user: {
            id: user.id,
            username: user.email || '',
            role: 'admin',
            email: user.email,
          }, 
          token: session.access_token, 
          isAuthenticated: true 
        });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
);
