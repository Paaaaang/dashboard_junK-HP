import { BellRing } from "lucide-react";

export function TopRail() {
  return (
    <header
      className="h-16 backdrop-blur-md border-b flex items-center justify-between px-6 sticky top-0 z-20 transition-all duration-300"
      style={{ background: "rgba(255,255,255,0.85)", borderColor: "var(--color-border)", boxShadow: "var(--shadow-sm)" }}
    >
      <div className="flex-1 flex items-center" />
      <div className="flex items-center gap-4">
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
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
          style={{ background: "rgba(16, 185, 129, 0.1)", color: "var(--brand-primary)" }}
        >
          A
        </div>
      </div>
    </header>
  );
}
