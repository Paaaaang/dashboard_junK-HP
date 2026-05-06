import { BellRing } from "lucide-react";

export function TopRail() {
  return (
    <header className="h-16 bg-surface/80 backdrop-blur-md border-b border-border flex items-center justify-between px-6 sticky top-0 z-20 shadow-sm transition-all duration-300">
      <div className="flex-1 flex items-center">
        {/* 나중에 검색바나 브레드크럼 등 추가 가능 */}
      </div>
      <div className="flex items-center gap-4">
        <button
          className="p-2 text-text-tertiary hover:text-brand-primary hover:bg-brand-primary/5 rounded-full transition-colors relative"
          aria-label="알림"
        >
          <BellRing size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full border-2 border-surface"></span>
        </button>
        <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold text-sm shadow-inner">
          A
        </div>
      </div>
    </header>
  );
}