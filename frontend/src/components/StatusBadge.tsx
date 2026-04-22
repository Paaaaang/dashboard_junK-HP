import { CheckCircle2, AlertTriangle, XCircle, TrendingUp, Clock3, type LucideIcon } from 'lucide-react';
import type { StatusKind } from '../types/models';

interface StatusBadgeProps {
  status: StatusKind;
  label: string;
  compact?: boolean;
}

export function StatusBadge({ status, label, compact = false }: StatusBadgeProps) {
  const statusIcon: Record<StatusKind, LucideIcon> = {
    success: CheckCircle2,
    warning: AlertTriangle,
    error: XCircle,
    info: TrendingUp,
    neutral: Clock3,
  };

  const Icon = statusIcon[status];

  return (
    <span className={`status-badge status-${status} ${compact ? 'status-compact' : ''}`}>
      <Icon className="icon-xs" />
      <span>{label}</span>
    </span>
  );
}
