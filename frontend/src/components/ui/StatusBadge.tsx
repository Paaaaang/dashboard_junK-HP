import { CheckCircle2, AlertTriangle, XCircle, TrendingUp, Clock3, type LucideIcon } from 'lucide-react';
import type { StatusKind } from '../../types/models';

interface StatusBadgeProps {
  status: StatusKind;
  label: string;
  compact?: boolean;
}

const statusStyles: Record<StatusKind, string> = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  warning: 'bg-amber-50 text-amber-700 border-amber-100',
  error: 'bg-rose-50 text-rose-700 border-rose-100',
  info: 'bg-sky-50 text-sky-700 border-sky-100',
  neutral: 'bg-slate-50 text-slate-600 border-slate-100',
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
