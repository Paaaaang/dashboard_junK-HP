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
      className="fixed inset-0 bg-brand-dark/40 flex items-center justify-center z-[200] p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="이메일 템플릿 선택"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-surface rounded-[32px] shadow-2xl flex flex-col w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        <div className="px-8 py-6 border-b border-border flex justify-between items-center bg-surface">
          <h3 className="text-xl font-bold text-primary">이메일 발송</h3>
          <button
            type="button"
            className="p-2 text-tertiary hover:text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-all duration-200"
            onClick={onClose}
            aria-label="닫기"
          >
            <X className="w-5 h-5" strokeWidth={2.5} />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="p-4 bg-brand-primary/10 rounded-2xl border border-brand-primary/20">
            <p className="text-center text-brand-primary font-semibold">
              <span className="text-xl mr-1">{emailRecipientIds.length}</span>개 기업 대상
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-secondary mb-2">
              템플릿 선택
            </label>
            <select
              className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all duration-200"
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

        <div className="px-8 py-6 border-t border-border flex justify-end gap-3 bg-surface-subtle/50">
          <button
            type="button"
            className="px-6 py-3 bg-surface border border-border text-secondary hover:bg-surface-subtle rounded-xl font-bold transition-all duration-200"
            onClick={onClose}
          >
            취소
          </button>
          <button
            type="button"
            className="px-6 py-3 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl font-bold transition-all duration-200 shadow-lg shadow-brand-primary/20"
            onClick={onSend}
          >
            발송
          </button>
        </div>
      </div>
    </div>
  );
}
