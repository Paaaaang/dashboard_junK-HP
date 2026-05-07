import { useState, useEffect } from "react";
import { X, Mail, Check, AlertCircle, Send, Users } from "lucide-react";
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
  const [isSending, setIsSending] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  // Auto-select first template if none selected and templates exist
  useEffect(() => {
    if (!selectedTemplateId && templates.length > 0) {
      onTemplateChange(templates[0].id);
    }
  }, [templates, selectedTemplateId, onTemplateChange]);

  const handleSendClick = () => {
    setIsSending(true);
    // Simulate sending delay for UX
    setTimeout(() => {
      onSend();
      // Keep loading state until parent handles it or closes modal
    }, 600);
  };

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  return (
    <div
      className="fixed inset-0 bg-brand-dark/40 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="기업 이메일 발송"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-surface rounded-3xl shadow-xl flex flex-col w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <header className="px-6 py-5 border-b border-border/50 flex items-center justify-between bg-surface relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-primary/10 rounded-xl text-brand-primary">
              <Mail size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-primary tracking-tight">이메일 발송</h3>
              <p className="text-xs text-tertiary font-bold tracking-wider mt-0.5 flex items-center gap-1.5">
                <Users size={12} strokeWidth={2.5} /> {emailRecipientIds.length}개 기업 선택됨
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-tertiary hover:text-secondary hover:bg-surface-subtle rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
            aria-label="닫기"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </header>

        {/* Content */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar bg-surface-subtle/30">
          {step === 1 ? (
            <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
              <div className="space-y-2">
                <label className="text-xs font-black text-tertiary uppercase tracking-widest px-1">템플릿 선택</label>
                <div className="grid gap-3">
                  {templates.length === 0 ? (
                    <div className="p-8 border-2 border-dashed border-border/50 rounded-2xl text-center bg-surface">
                      <p className="text-sm text-secondary font-medium">사용 가능한 템플릿이 없습니다.</p>
                      <p className="text-xs text-tertiary mt-1">이메일 템플릿 관리 메뉴에서 추가해 주세요.</p>
                    </div>
                  ) : (
                    templates.map((template) => (
                      <label
                        key={template.id}
                        className={`relative flex items-start p-4 cursor-pointer rounded-2xl border-2 transition-all duration-200 ${
                          selectedTemplateId === template.id
                            ? "border-brand-primary bg-brand-primary/5 shadow-md shadow-brand-primary/5 ring-2 ring-brand-primary/10"
                            : "border-border/50 bg-surface hover:border-brand-primary/30 hover:bg-surface-subtle"
                        }`}
                      >
                        <input
                          type="radio"
                          name="email-template"
                          className="sr-only"
                          value={template.id}
                          checked={selectedTemplateId === template.id}
                          onChange={(e) => onTemplateChange(e.target.value)}
                        />
                        <div className="flex-1 pr-6">
                          <p className="text-sm font-bold text-primary tracking-tight">{template.name}</p>
                          <p className="text-xs text-secondary mt-1 line-clamp-1">{template.subject || "제목 없음"}</p>
                        </div>
                        <div className={`absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                          selectedTemplateId === template.id ? "border-brand-primary bg-brand-primary" : "border-border"
                        }`}>
                          {selectedTemplateId === template.id && <Check size={12} className="text-white" strokeWidth={3} />}
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {selectedTemplate && (
                <div className="p-4 bg-surface border border-border/50 rounded-2xl space-y-3 shadow-subtle animate-in fade-in duration-300">
                  <div className="flex items-center justify-between pb-3 border-b border-border/30">
                    <span className="text-[11px] font-black text-tertiary uppercase tracking-widest">선택된 템플릿 미리보기</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-secondary mb-1">제목</p>
                    <p className="text-sm font-medium text-primary">{selectedTemplate.subject}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
              <div className="p-6 bg-surface border border-border/50 rounded-2xl shadow-sm text-center space-y-3">
                <div className="w-12 h-12 bg-brand-primary/10 text-brand-primary rounded-full flex items-center justify-center mx-auto mb-2">
                  <Send size={24} className={isSending ? "animate-pulse" : ""} />
                </div>
                <h4 className="text-lg font-bold text-primary">발송을 시작하시겠습니까?</h4>
                <p className="text-sm text-secondary">
                  선택한 <span className="font-bold text-brand-primary">{emailRecipientIds.length}</span>개 기업의 담당자에게 
                  <br />해당 템플릿으로 이메일을 일괄 발송합니다.
                </p>
              </div>

              <div className="p-4 bg-warning/10 border border-warning/20 rounded-xl flex items-start gap-3">
                <AlertCircle size={18} className="text-warning shrink-0 mt-0.5" />
                <p className="text-xs text-warning/90 font-medium leading-relaxed">
                  대량 메일 발송 시 수 분의 시간이 소요될 수 있으며, 스팸 정책에 따라 일부 수신자에게 도달하지 않을 수 있습니다.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="px-6 py-5 border-t border-border/50 bg-surface flex items-center gap-3">
          {step === 1 ? (
            <>
              <button
                type="button"
                className="flex-1 py-3.5 bg-surface-subtle text-secondary hover:bg-border/30 rounded-xl font-bold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                onClick={onClose}
              >
                취소
              </button>
              <button
                type="button"
                disabled={!selectedTemplateId}
                className="flex-[2] py-3.5 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-brand-primary/20 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-brand-primary/40 ring-offset-1"
                onClick={() => setStep(2)}
              >
                다음: 수신자 확인
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                disabled={isSending}
                className="flex-1 py-3.5 bg-surface-subtle text-secondary hover:bg-border/30 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
                onClick={() => setStep(1)}
              >
                이전
              </button>
              <button
                type="button"
                disabled={isSending}
                className="flex-[2] py-3.5 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-brand-primary/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98]"
                onClick={handleSendClick}
              >
                {isSending ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    발송 중...
                  </>
                ) : (
                  <>
                    <Send size={16} strokeWidth={2.5} />
                    최종 발송 시작
                  </>
                )}
              </button>
            </>
          )}
        </footer>
      </div>
    </div>
  );
}
