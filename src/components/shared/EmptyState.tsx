import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <tr className="w-full">
      <td colSpan={100} className="py-32 px-4 text-center">     
        <div className="flex flex-col items-center justify-center max-w-md mx-auto">
          <div
            className="w-20 h-20 rounded-3xl bg-surface-subtle flex items-center justify-center mb-6 shadow-sm border border-border/40"
            aria-hidden="true"
          >
            <Icon className="w-10 h-10 text-tertiary" strokeWidth={2} />
          </div>
          
          <div className="space-y-2 mb-8">
            <h3 className="text-xl font-bold text-primary tracking-tight">
              {title}
            </h3>
            {description && (
              <p className="text-sm text-tertiary font-medium leading-relaxed">
                {description}
              </p>
            )}
          </div>

          {action && (
            <button 
              type="button" 
              className="px-6 py-2.5 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg active:scale-95"
              onClick={action.onClick}
            >
              {action.label}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
