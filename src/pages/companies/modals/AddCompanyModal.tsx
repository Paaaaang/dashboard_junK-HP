import { X, Upload, UserPlus, ChevronRight } from "lucide-react";

interface AddCompanyModalProps {
  onClose: () => void;
  onUploadClick: () => void;
  onCreateDrawerClick: () => void;
}

export function AddCompanyModal({
  onClose,
  onUploadClick,
  onCreateDrawerClick,
}: AddCompanyModalProps) {
  return (
    <div
      className="fixed inset-0 bg-brand-dark/40 flex items-center justify-center z-[200] p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="기업 추가 방식 선택"
    >
      <div className="absolute inset-0" onClick={onClose} />
      
      <div className="relative bg-surface rounded-[32px] shadow-2xl flex flex-col w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="px-8 py-6 border-b border-border flex items-center justify-between bg-surface sticky top-0 z-10">
          <h3 className="text-xl font-bold text-primary flex items-center gap-2">기업 추가</h3>
          <button
            type="button"
            className="p-2 hover:bg-surface-subtle rounded-full transition-colors text-tertiary"
            onClick={onClose}
            aria-label="닫기"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        <div className="p-8 grid grid-cols-1 gap-4">
          <button
            type="button"
            className="flex items-center gap-5 p-6 rounded-2xl border-2 border-border hover:border-brand-primary hover:bg-brand-primary/10 transition-all text-left group w-full"
            onClick={onCreateDrawerClick}
          >
            <div className="w-14 h-14 bg-brand-primary/10 rounded-xl flex items-center justify-center text-brand-primary group-hover:scale-110 transition-transform">
              <UserPlus size={28} strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <p className="font-bold text-primary text-lg">직접 등록하기</p>
              <p className="text-sm text-secondary mt-1">사이드 드로어에서 기업 정보를 입력하여 등록합니다.</p>
            </div>
            <ChevronRight className="w-5 h-5 text-tertiary group-hover:text-brand-primary transition-all duration-200" strokeWidth={2.5} />
          </button>

          <button
            type="button"
            className="flex items-center gap-5 p-6 rounded-2xl border-2 border-border hover:border-brand-primary hover:bg-brand-primary/10 transition-all text-left group w-full"
            onClick={onUploadClick}
          >
            <div className="w-14 h-14 bg-brand-primary/10 rounded-xl flex items-center justify-center text-brand-primary group-hover:scale-110 transition-transform">
              <Upload size={28} strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <p className="font-bold text-primary text-lg">엑셀로 일괄 등록</p>
              <p className="text-sm text-secondary mt-1">xlsx, xls 파일을 업로드하여 대량으로 등록합니다.</p>
            </div>
            <ChevronRight className="w-5 h-5 text-tertiary group-hover:text-brand-primary transition-all duration-200" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
