import { CheckCircle2, Circle } from "lucide-react";
import { CompletionStatus } from "@/types/models";

interface CompletionBadgeProps {
  status: CompletionStatus;
}

export function CompletionBadge({ status }: CompletionBadgeProps) {
  const isCompleted = status === "수료";
  const style = isCompleted
    ? "bg-success/10 text-success border-success/20"
    : "bg-surface-subtle text-text-tertiary border-border";
  
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-all
        ${style}
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
