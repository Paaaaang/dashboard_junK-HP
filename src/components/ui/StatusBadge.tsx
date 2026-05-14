import { CheckCircle2, AlertTriangle, XCircle, TrendingUp, Clock3, type LucideIcon } from 'lucide-react';
import type { StatusKind } from '@/types/models';

interface StatusBadgeProps {
  status: StatusKind;
  label: string;
  compact?: boolean;
}

const statusStyles: Record<StatusKind, string> = {
  success: 'bg-success/10 text-success border-success/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  error: 'bg-error/10 text-error border-error/20',
  info: 'bg-info/10 text-info border-info/20',
  neutral: 'bg-surface-subtle text-text-secondary border-border',
};

const statusIcons: Record<StatusKind, LucideIcon> = {
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
  info: TrendingUp,
  neutral: Clock3,
};

export function StatusBadge({ status, label, compact = false }: StatusBadgeProps) {
  const Icon = statusIcons[status];
  const styleClass = statusStyles[status];

  return (
    <span 
      className={`
        inline-flex items-center gap-1.5 font-medium border rounded-full transition-colors
        ${styleClass}
        ${compact ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs'}
      `}
    >
      <Icon className={`${compact ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />
      <span>{label}</span>
    </span>
  );
}
