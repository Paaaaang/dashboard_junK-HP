import { X, Upload, PlusCircle, ChevronRight } from "lucide-react";

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
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="기업 추가 방식 선택"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-[32px] shadow-2xl flex flex-col w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <h3 className="text-xl font-bold text-slate-900">기업 추가</h3>
          <button
            type="button"
            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200"
            onClick={onClose}
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-8 space-y-4">
          <button
            type="button"
            className="flex items-center gap-4 p-6 border-2 border-slate-100 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50/50 group transition-all duration-200 text-left w-full"
            onClick={onUploadClick}
          >
            <div className="p-3 rounded-xl bg-slate-100 group-hover:bg-emerald-100 text-slate-500 group-hover:text-emerald-600 transition-all duration-200">
              <Upload className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <span className="block text-lg font-bold text-slate-900">업로드</span>
              <span className="block text-sm text-slate-500">엑셀 파일로 일괄 등록</span>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 transition-all duration-200" />
          </button>
          <button
            type="button"
            className="flex items-center gap-4 p-6 border-2 border-slate-100 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50/50 group transition-all duration-200 text-left w-full"
            onClick={onCreateDrawerClick}
          >
            <div className="p-3 rounded-xl bg-slate-100 group-hover:bg-emerald-100 text-slate-500 group-hover:text-emerald-600 transition-all duration-200">
              <PlusCircle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <span className="block text-lg font-bold text-slate-900">직접 입력</span>
              <span className="block text-sm text-slate-500">
                사이드 드로어에서 기업 정보를 입력
              </span>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 transition-all duration-200" />
          </button>
        </div>
      </div>
    </div>
  );
}
