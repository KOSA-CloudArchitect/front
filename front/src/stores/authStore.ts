import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';
import { authService, AuthError } from '../services/authService';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, confirmPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  refreshToken: () => Promise<void>;
  getCurrentUser: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string, confirmNewPassword: string) => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  checkAuthStatus: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authService.login({ email, password });
          
          set({
            user: response.data.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const errorMessage = error instanceof AuthError 
            ? error.message 
            : '로그인 중 오류가 발생했습니다.';
          
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });
          
          throw error;
        }
      },

      register: async (email: string, password: string, confirmPassword: string) => {
        set({ isLoading: true, error: null });
        
        try {
          await authService.register({ email, password, confirmPassword });
          
          set({
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const errorMessage = error instanceof AuthError 
            ? error.message 
            : '회원가입 중 오류가 발생했습니다.';
          
          set({
            isLoading: false,
            error: errorMessage,
          });
          
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        
        try {
          await authService.logout();
        } catch (error) {
          console.warn('로그아웃 요청 실패:', error);
        } finally {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      logoutAll: async () => {
        set({ isLoading: true });
        
        try {
          await authService.logoutAll();
        } catch (error) {
          console.warn('전체 로그아웃 요청 실패:', error);
        } finally {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      refreshToken: async () => {
        try {
          const response = await authService.refreshToken();
          
          set({
            user: response.data.user,
            isAuthenticated: true,
            error: null,
          });
        } catch (error) {
          console.warn('토큰 갱신 실패:', error);
          
          // 토큰 갱신 실패 시 로그아웃
          set({
            user: null,
            isAuthenticated: false,
            error: null,
          });
          
          throw error;
        }
      },

      getCurrentUser: async () => {
        if (!authService.isAuthenticated()) {
          set({ user: null, isAuthenticated: false });
          return;
        }

        set({ isLoading: true });
        
        try {
          const user = await authService.getCurrentUser();
          
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          console.warn('사용자 정보 조회 실패:', error);
          
          // 사용자 정보 조회 실패 시 로그아웃
          authService.clearTokens();
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      changePassword: async (currentPassword: string, newPassword: string, confirmNewPassword: string) => {
        set({ isLoading: true, error: null });
        
        try {
          await authService.changePassword(currentPassword, newPassword, confirmNewPassword);
          
          set({
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const errorMessage = error instanceof AuthError 
            ? error.message 
            : '비밀번호 변경 중 오류가 발생했습니다.';
          
          set({
            isLoading: false,
            error: errorMessage,
          });
          
          throw error;
        }
      },

      clearError: () => set({ error: null }),
      
      setLoading: (loading: boolean) => set({ isLoading: loading }),

      checkAuthStatus: () => {
        const isAuthenticated = authService.isAuthenticated() && !authService.isTokenExpired();
        
        if (!isAuthenticated) {
          authService.clearTokens();
          set({
            user: null,
            isAuthenticated: false,
            error: null,
          });
        } else {
          set({ isAuthenticated: true });
          
          // 사용자 정보가 없으면 조회
          if (!get().user) {
            get().getCurrentUser();
          }
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// 선택자 함수들 (성능 최적화)
export const useAuthUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error);
export const useAuthActions = () => useAuthStore((state) => ({
  login: state.login,
  register: state.register,
  logout: state.logout,
  logoutAll: state.logoutAll,
  refreshToken: state.refreshToken,
  getCurrentUser: state.getCurrentUser,
  changePassword: state.changePassword,
  clearError: state.clearError,
  setLoading: state.setLoading,
  checkAuthStatus: state.checkAuthStatus,
}));