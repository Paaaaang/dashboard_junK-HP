import { X, FileSpreadsheet, UserPlus } from "lucide-react";

interface AddParticipantChoiceModalProps {
  onClose: () => void;
  onUploadClick: () => void;
  onCreateModalClick: () => void;
}

export function AddParticipantChoiceModal({
  onClose,
  onUploadClick,
  onCreateModalClick,
}: AddParticipantChoiceModalProps) {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-brand-dark/40" onClick={onClose} />
      
      <div className="relative bg-surface rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="px-8 py-6 border-b border-border flex items-center justify-between">
          <h2 className="text-xl font-bold text-primary flex items-center gap-2">
            참여자 추가
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-surface-subtle rounded-full transition-colors text-tertiary">
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        <div className="p-8 grid grid-cols-1 gap-4">
          <button
            onClick={onCreateModalClick}
            className="flex items-center gap-5 p-6 rounded-2xl border-2 border-border hover:border-brand-primary hover:bg-brand-primary/10 transition-all text-left group"
          >
            <div className="w-14 h-14 bg-brand-primary/10 rounded-xl flex items-center justify-center text-brand-primary group-hover:scale-110 transition-transform">
              <UserPlus size={28} strokeWidth={2.5} />
            </div>
            <div>
              <p className="font-bold text-primary text-lg">직접 등록하기</p>
              <p className="text-sm text-secondary mt-1">한 명씩 정보를 입력하여 등록합니다.</p>
            </div>
          </button>

          <button
            onClick={onUploadClick}
            className="flex items-center gap-5 p-6 rounded-2xl border-2 border-border hover:border-brand-primary hover:bg-brand-primary/10 transition-all text-left group"
          >
            <div className="w-14 h-14 bg-brand-primary/10 rounded-xl flex items-center justify-center text-brand-primary group-hover:scale-110 transition-transform">
              <FileSpreadsheet size={28} strokeWidth={2.5} />
            </div>
            <div>
              <p className="font-bold text-primary text-lg">엑셀로 일괄 등록</p>
              <p className="text-sm text-secondary mt-1">xlsx, xls 파일을 업로드하여 대량으로 등록합니다.</p>
            </div>
          </button>
        </div>

        <div className="px-8 py-5 bg-surface-subtle/50 text-center">
          <p className="text-xs text-tertiary font-medium tracking-tight uppercase">Dashboard Participant Management</p>
        </div>
      </div>
    </div>
  );
}
