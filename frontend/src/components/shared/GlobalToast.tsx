import { X, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { useToastStore, ToastType } from "../../stores/useToastStore";

export function GlobalToast() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  const getIcon = (type: ToastType) => {
    switch (type) {
      case "success": return <CheckCircle2 size={18} strokeWidth={2.5} className="text-success" />;
      case "error": return <AlertCircle size={18} strokeWidth={2.5} className="text-error" />;
      default: return <Info size={18} strokeWidth={2.5} className="text-info" />;
    }
  };

  return (
    <div className="fixed bottom-10 right-10 z-[1000] flex flex-col gap-3 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="bg-surface text-primary px-6 py-4 rounded-[20px] text-[13px] font-bold shadow-2xl flex items-center gap-4 border border-border min-w-[300px] animate-in slide-in-from-right-full duration-300 pointer-events-auto"
        >
          <div className="flex-shrink-0">
            {getIcon(t.type)}
          </div>
          <p className="flex-1 leading-snug">{t.message}</p>
          <button 
            onClick={() => removeToast(t.id)} 
            className="text-tertiary hover:text-primary transition-colors p-1"
          >
            <X size={14} strokeWidth={2.5} />
          </button>
        </div>
      ))}
    </div>
  );
}
