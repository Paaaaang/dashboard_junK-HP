import { Check } from "lucide-react";

interface CourseFloatingActionBarProps {
  isModified: boolean;
  onSave: () => void;
  isLoading?: boolean;
}

export function CourseFloatingActionBar({
  isModified,
  onSave,
  isLoading = false,
}: CourseFloatingActionBarProps) {
  if (!isModified) return null;

  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-6 duration-300">
      <style>{`
        @keyframes gradientBorder {
          0% {
            background-position: 0% center;
          }
          50% {
            background-position: 100% center;
          }
          100% {
            background-position: 0% center;
          }
        }
        .save-button {
          background: linear-gradient(to right, #ffffff, #ffffff) padding-box,
                      linear-gradient(90deg, #10b981, #06d6a0, #3b82f6, #06d6a0, #10b981) border-box;
          border: 2px solid transparent;
          background-size: 200% 100%;
          animation: gradientBorder 2.8s ease-in-out infinite;
          background-attachment: fixed;
        }
      `}</style>
      
      <button
        type="button"
        onClick={onSave}
        disabled={isLoading}
        className="save-button flex items-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-brand-primary rounded-2xl font-semibold text-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin" />
            <span>저장 중...</span>
          </>
        ) : (
          <>
            <Check size={18} strokeWidth={2.5} />
            <span>변경 사항 전체 저장</span>
          </>
        )}
      </button>
    </div>
  );
}
