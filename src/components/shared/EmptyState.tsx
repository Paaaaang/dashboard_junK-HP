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
            className="w-20 h-20 rounded-3xl bg-brand-primary/10 flex items-center justify-center mb-6 shadow-sm"
            aria-hidden="true"
          >
            <Icon className="w-10 h-10 text-brand-primary" strokeWidth={2.5} />
          </div>
          
          <div className="space-y-2 mb-8">
            <h3 className="text-xl font-bold text-text-primary tracking-tight">
              {title}
            </h3>
            {description && (
              <p className="text-sm text-text-secondary leading-relaxed">
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
