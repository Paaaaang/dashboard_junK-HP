import { CheckCircle2, Circle } from "lucide-react";
import { CompletionStatus } from "../../types/models";

interface CompletionBadgeProps {
  status: CompletionStatus;
}

export function CompletionBadge({ status }: CompletionBadgeProps) {
  const isCompleted = status === "수료";
  
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-all
        ${isCompleted 
          ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
          : "bg-slate-50 text-slate-500 border-slate-200"}
      `}
    >
      {isCompleted ? (
        <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
      ) : (
        <Circle className="w-3.5 h-3.5" aria-hidden="true" />
      )}
      {status}
    </span>
  );
}
