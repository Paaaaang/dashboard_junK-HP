import { useState, useRef } from "react";
import { BellRing, Settings, LogOut, ChevronDown } from "lucide-react";
import { useClickOutside } from "../../hooks/useClickOutside";
import { SettingsModal } from "./SettingsModal";
import { useAuthStore } from "../../stores/useAuthStore";

export function TopRail() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const { logout, user } = useAuthStore();

  useClickOutside(profileRef, () => setIsProfileOpen(false));

  return (
    <header
      className="h-16 backdrop-blur-md border-b flex items-center justify-between px-6 sticky top-0 z-20 transition-all duration-300"
      style={{ background: "rgba(255,255,255,0.85)", borderColor: "var(--color-border)", boxShadow: "var(--shadow-sm)" }}
    >
      <div className="flex-1 flex items-center" />
      <div className="flex items-center gap-4">
        {/* 알림 버튼 */}
        <button
          className="p-2 rounded-full relative cursor-pointer transition-colors"
          style={{ color: "var(--color-text-tertiary)" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--brand-primary)"; (e.currentTarget as HTMLElement).style.background = "rgba(16, 185, 129, 0.05)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--color-text-tertiary)"; (e.currentTarget as HTMLElement).style.background = ""; }}
          aria-label="알림"
        >
          <BellRing size={20} />
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full border-2"
            style={{ background: "var(--color-error)", borderColor: "var(--color-surface)" }}
          />
        </button>

        {/* 프로필 드롭다운 */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 p-1 pr-2 hover:bg-surface-subtle rounded-full transition-all cursor-pointer"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
              style={{ background: "rgba(16, 185, 129, 0.1)", color: "var(--brand-primary)" }}
            >
              A
            </div>
            <ChevronDown size={14} className={`text-tertiary transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-surface border border-border/50 rounded-2xl shadow-xl py-2 animate-in fade-in slide-in-from-top-2 duration-200 z-30 overflow-hidden">
              <div className="px-4 py-3 border-b border-border/30 mb-1 bg-surface-subtle/50">
                <p className="text-[10px] font-black text-tertiary uppercase tracking-widest">{user?.role === 'admin' ? 'Administrator' : 'User'}</p>
                <p className="text-xs font-bold text-primary truncate">{user?.email || user?.username || 'admin@khp.dashboard'}</p>
              </div>
              
              <button
                onClick={() => { setIsSettingsOpen(true); setIsProfileOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-secondary hover:bg-brand-primary/5 hover:text-brand-primary transition-all"
              >
                <Settings size={14} /> 환경 설정
              </button>

              <div className="h-px bg-border/30 my-1" />

              <button 
                onClick={() => {
                  logout();
                  setIsProfileOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-error hover:bg-error/5 transition-all"
              >
                <LogOut size={14} /> 로그아웃
              </button>

            </div>
          )}
        </div>
      </div>

      {isSettingsOpen && <SettingsModal onClose={() => setIsSettingsOpen(false)} />}
    </header>
  );
}
