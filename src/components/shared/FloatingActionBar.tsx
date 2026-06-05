import { X, LucideIcon } from "lucide-react";

export interface FloatingAction {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost";
}

interface FloatingActionBarProps {
  count: number;
  label: string;
  actions: FloatingAction[];
  onClear: () => void;
}

export function FloatingActionBar({
  count,
  label,
  actions,
  onClear,
}: FloatingActionBarProps) {
  if (count === 0) return null;

  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-40 w-max max-w-[90vw] animate-in fade-in slide-in-from-bottom-6 duration-300">
      <div className="backdrop-blur-md rounded-2xl px-6 py-4 shadow-glass flex items-center gap-8 border border-border/20">
        <div className="flex items-center gap-3 border-r border-border/30 pr-8">
          <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center text-inverse text-sm font-bold shadow-soft">
            {count}
          </div>
          <p className="text-inverse text-sm font-medium">
            {label}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {actions.map((action, idx) => {
            const Icon = action.icon;
            const isDanger = action.variant === "danger";
            return (
              <button
                key={idx}
                type="button"
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all text-sm font-semibold group active:scale-95 ${
                  isDanger 
                    ? "text-error hover:text-error/80 hover:bg-error/10" 
                    : "text-inverse/90 hover:text-inverse hover:bg-surface/10"
                }`}
                onClick={action.onClick}
              >
                <Icon 
                  size={16} 
                  strokeWidth={2.5} 
                  className={`group-hover:scale-110 transition-transform ${
                    isDanger ? "text-error" : "text-brand-primary"
                  }`} 
                />
                <span>{action.label}</span>
              </button>
            );
          })}
          <button
            type="button"
            className="ml-2 flex items-center gap-2 px-4 py-2 text-tertiary hover:text-error hover:bg-error/10 rounded-xl transition-all text-sm font-medium group"
            onClick={onClear}
          >
            <X size={16} strokeWidth={2.5} className="group-hover:rotate-90 transition-transform" />
            <span>선택 해제</span>
          </button>
        </div>
      </div>
    </div>
  );
}
