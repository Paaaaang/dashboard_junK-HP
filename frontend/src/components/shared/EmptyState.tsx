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
            className="w-20 h-20 rounded-3xl bg-emerald-50 flex items-center justify-center mb-6 shadow-sm"
            aria-hidden="true"
          >
            <Icon className="w-10 h-10 text-emerald-600" />
          </div>
          
          <div className="space-y-2 mb-8">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">
              {title}
            </h3>
            {description && (
              <p className="text-sm text-slate-500 leading-relaxed">
                {description}
              </p>
            )}
          </div>

          {action && (
            <button 
              type="button" 
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg active:scale-95"
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
