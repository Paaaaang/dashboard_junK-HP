import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, User, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useToastStore } from '@/stores';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, error, isAuthenticated, clearError } = useAuthStore();
  const { addToast } = useToastStore();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const from = (location.state as any)?.from?.pathname || '/';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  useEffect(() => {
    if (error) {
      addToast(error, 'error');
      clearError();
    }
  }, [error, addToast, clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    
    try {
      await login(username, password);
      addToast('성공적으로 로그인되었습니다.', 'success');
    } catch (err) {
      // Error handled by useEffect
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-[24px] bg-brand-primary/10 mb-4 border border-brand-primary/20 shadow-sm shadow-brand-primary/10">
            <Lock className="text-brand-primary" size={32} />
          </div>
          <h1 className="text-2xl font-black text-primary uppercase tracking-tight mb-2">
            KHP Dashboard
          </h1>
          <p className="text-sm font-bold text-tertiary">
            전남대학교 K-하이테크 플랫폼 관리 시스템
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-surface border border-border/50 rounded-[32px] p-8 shadow-xl shadow-black/5 relative overflow-hidden group">
          {/* Subtle Background Glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-primary/5 blur-3xl rounded-full transition-all group-hover:bg-brand-primary/10"></div>
          
          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-tertiary uppercase tracking-widest ml-1">
                  아이디
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-disabled pointer-events-none">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-surface-subtle border border-border rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold placeholder:text-disabled outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all"
                    placeholder="아이디를 입력하세요"
                    required
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-tertiary uppercase tracking-widest ml-1">
                  비밀번호
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-disabled pointer-events-none">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-surface-subtle border border-border rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold placeholder:text-disabled outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all"
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-brand-primary hover:bg-brand-primary-hover text-white font-black py-4 rounded-2xl shadow-lg shadow-brand-primary/20 flex items-center justify-center gap-2 group/btn transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  로그인하기
                  <ArrowRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Footer inside card */}
          <div className="mt-8 pt-6 border-t border-border/30 flex items-center justify-center gap-2 text-[10px] font-bold text-disabled">
            <AlertCircle size={12} />
            관리자 전용 페이지입니다.
          </div>
        </div>

        {/* Outer Footer */}
        <p className="mt-8 text-center text-[10px] font-bold text-tertiary uppercase tracking-widest">
          © 2026 CHONNAM NATIONAL UNIVERSITY. ALL RIGHTS RESERVED.
        </p>
      </div>
    </div>
  );
}
