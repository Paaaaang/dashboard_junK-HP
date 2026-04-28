import { X } from "lucide-react";
import type { EmailTemplate } from "../../../types/models";

interface EmailModalProps {
  onClose: () => void;
  emailRecipientIds: string[];
  selectedTemplateId: string;
  onTemplateChange: (id: string) => void;
  onSend: () => void;
  templates: EmailTemplate[];
}

export function EmailModal({
  onClose,
  emailRecipientIds,
  selectedTemplateId,
  onTemplateChange,
  onSend,
  templates,
}: EmailModalProps) {
  return (
    <div
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="이메일 템플릿 선택"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-[32px] shadow-2xl flex flex-col w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white">
          <h3 className="text-xl font-bold text-slate-900">이메일 발송</h3>
          <button
            type="button"
            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200"
            onClick={onClose}
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
            <p className="text-center text-emerald-800 font-semibold">
              <span className="text-xl mr-1">{emailRecipientIds.length}</span>개 기업 대상
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              템플릿 선택
            </label>
            <select
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
              value={selectedTemplateId}
              onChange={(event) =>
                onTemplateChange(event.target.value)
              }
            >
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="px-8 py-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
          <button
            type="button"
            className="px-6 py-3 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-bold transition-all duration-200"
            onClick={onClose}
          >
            취소
          </button>
          <button
            type="button"
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all duration-200 shadow-lg shadow-emerald-600/20"
            onClick={onSend}
          >
            발송
          </button>
        </div>
      </div>
    </div>
  );
}
