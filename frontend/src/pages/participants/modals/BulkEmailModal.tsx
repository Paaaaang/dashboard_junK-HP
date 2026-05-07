import { useState, useMemo, useEffect } from "react";
import { X, Send, Mail, Check, AlertCircle, Info, ChevronRight, Users } from "lucide-react";
import { useTemplateStore } from "../../../stores/useTemplateStore";
import { useToastStore } from "../../../stores/useToastStore";
import type { ParticipantRecord } from "../../../types/models";
import { applyTemplateVariables } from "../../../utils/templateVariables";

interface BulkEmailModalProps {
  onClose: () => void;
  selectedParticipants: ParticipantRecord[];
  onSuccess?: () => void;
}

export function BulkEmailModal({ onClose, selectedParticipants, onSuccess }: BulkEmailModalProps) {
  const { templates, fetchTemplates, sendEmails } = useTemplateStore();
  const { addToast } = useToastStore();
  
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // Auto-select first template if none selected and templates exist
  useEffect(() => {
    if (!selectedTemplateId && templates.length > 0) {
      setSelectedTemplateId(templates[0].id);
    }
  }, [templates, selectedTemplateId]);

  const selectedTemplate = useMemo(() => 
    templates.find(t => t.id === selectedTemplateId),
    [templates, selectedTemplateId]
  );

  const handleSend = async () => {
    if (!selectedTemplateId) return;
    setIsSending(true);
    try {
      const participantIds = selectedParticipants.map(p => p.id);
      await sendEmails(selectedTemplateId, participantIds);
      addToast(`${selectedParticipants.length}명에게 메일 발송을 시작했습니다.`, "success");
      onSuccess?.();
      onClose();
    } catch (err: any) {
      addToast(`발송 중 오류: ${err.message}`, "error");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-brand-dark/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200"
         role="dialog"
         aria-modal="true"
         aria-label="단체 메일 발송"
         onClick={(e) => {
           if (e.target === e.currentTarget && !isSending) onClose();
         }}>
      <div className="bg-surface rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <header className="px-6 py-5 border-b border-border/50 flex items-center justify-between bg-surface relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-primary/10 rounded-xl text-brand-primary">
              <Mail size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-primary tracking-tight">단체 메일 발송</h3>
              <p className="text-xs text-tertiary font-bold tracking-wider mt-0.5 flex items-center gap-1.5">
                <Users size={12} strokeWidth={2.5} /> {selectedParticipants.length}명 선택됨
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            disabled={isSending}
            className="p-2 text-tertiary hover:text-secondary hover:bg-surface-subtle rounded-full transition-all disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-surface-subtle/30 custom-scrollbar">
          {step === 1 ? (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="space-y-3">
                <label className="text-xs font-black text-tertiary uppercase tracking-widest px-1">1. 템플릿 선택</label>
                <div className="grid grid-cols-1 gap-3">
                  {templates.length === 0 ? (
                    <div className="p-8 border-2 border-dashed border-border/50 rounded-2xl text-center bg-surface">
                      <p className="text-sm text-secondary font-medium">저장된 템플릿이 없습니다.</p>
                      <p className="text-xs text-tertiary mt-1">이메일 템플릿 관리 메뉴에서 추가해 주세요.</p>
                    </div>
                  ) : (
                    templates.map(t => (
                      <label
                        key={t.id}
                        className={`relative flex flex-col p-4 cursor-pointer rounded-2xl border-2 transition-all duration-200 ${
                          selectedTemplateId === t.id 
                            ? "border-brand-primary bg-brand-primary/5 shadow-md shadow-brand-primary/5 ring-2 ring-brand-primary/10" 
                            : "border-border/50 bg-surface hover:border-brand-primary/30 hover:bg-surface-subtle"
                        }`}
                      >
                        <input
                          type="radio"
                          name="bulk-email-template"
                          className="sr-only"
                          value={t.id}
                          checked={selectedTemplateId === t.id}
                          onChange={() => setSelectedTemplateId(t.id)}
                        />
                        <div className="flex items-center justify-between mb-1 pr-6">
                          <span className="text-sm font-bold text-primary tracking-tight">{t.name}</span>
                          <div className={`absolute right-4 top-4 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                            selectedTemplateId === t.id ? "border-brand-primary bg-brand-primary" : "border-border"
                          }`}>
                            {selectedTemplateId === t.id && <Check size={12} className="text-white" strokeWidth={3} />}
                          </div>
                        </div>
                        <p className="text-xs text-secondary line-clamp-1 mb-3">{t.subject || "제목 없음"}</p>
                        <div className="flex items-center gap-2 mt-auto">
                          <span className={`px-2 py-1 rounded-md text-[10px] font-black tracking-wide ${
                            t.audience === "INSURED" ? "bg-brand-primary/10 text-brand-primary" : 
                            t.audience === "UNINSURED" ? "bg-warning/10 text-warning" : "bg-surface-subtle border border-border/50 text-tertiary"
                          }`}>
                            {t.audience === "INSURED" ? "가입자 대상" : t.audience === "UNINSURED" ? "미가입자 대상" : "전체 대상"}
                          </span>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {selectedTemplate && (
                <div className="p-5 bg-surface border border-border/50 rounded-2xl space-y-4 shadow-subtle animate-in fade-in duration-300">
                  <div className="flex items-center gap-2 pb-3 border-b border-border/30">
                    <Info size={16} className="text-brand-primary" />
                    <span className="text-[11px] font-black text-brand-primary uppercase tracking-widest">미리보기 (샘플 데이터 적용)</span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-bold text-secondary mb-1">제목</p>
                      <p className="text-sm font-medium text-primary">
                        {applyTemplateVariables(selectedTemplate.subject, { name: "홍길동", companyName: "한빛테크" })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-secondary mb-1">내용</p>
                      <div className="p-4 bg-surface-subtle/50 rounded-xl border border-border/30 max-h-40 overflow-y-auto custom-scrollbar">
                        <pre className="text-xs text-secondary font-medium whitespace-pre-wrap leading-relaxed font-sans">
                          {applyTemplateVariables(selectedTemplate.body, { 
                            name: "홍길동", 
                            companyName: "한빛테크",
                            courseName: "스마트팩토리 과정",
                            deadline: "2026.05.10"
                          })}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="space-y-3">
                <label className="text-xs font-black text-tertiary uppercase tracking-widest px-1">2. 수신자 확인</label>
                <div className="p-6 bg-surface border border-border/50 rounded-2xl shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b border-border/30">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-success/10 rounded-lg text-success">
                        <Check size={16} strokeWidth={3} />
                      </div>
                      <span className="text-sm font-bold text-primary">발송 준비 완료</span>
                    </div>
                    <span className="text-sm font-black text-brand-primary">{selectedParticipants.length}명</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {selectedParticipants.map(p => (
                      <div key={p.id} className="flex items-center gap-3 p-3 bg-surface-subtle/30 hover:bg-surface-subtle rounded-xl border border-border/30 transition-colors">
                        <div className="w-8 h-8 bg-surface shadow-sm rounded-lg border border-border/50 flex items-center justify-center text-[11px] font-black text-tertiary shrink-0">
                          {p.name.slice(0, 1)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-primary truncate">{p.name}</p>
                          <p className="text-[10px] text-tertiary truncate">{p.email || "이메일 없음"}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 bg-warning/10 border border-warning/20 rounded-xl flex items-start gap-3 mt-4">
                    <AlertCircle size={18} className="text-warning shrink-0 mt-0.5" />
                    <p className="text-[11px] text-warning/90 font-medium leading-relaxed">
                      네이버 SMTP 보안 정책에 따라 대량 발송 시 일시적으로 제한될 수 있습니다. 
                      발송 결과는 <strong>발송 이력 탭</strong>에서 실시간으로 확인할 수 있습니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="px-6 py-5 border-t border-border/50 bg-surface flex items-center gap-3 relative z-10">
          {step === 1 ? (
            <>
              <button 
                onClick={onClose}
                className="flex-1 py-3.5 text-sm font-bold text-secondary bg-surface-subtle hover:bg-border/30 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
              >
                취소
              </button>
              <button 
                onClick={() => setStep(2)}
                disabled={!selectedTemplateId}
                className="flex-[2] py-3.5 text-sm font-bold text-white bg-brand-primary hover:bg-brand-primary-hover rounded-xl shadow-md shadow-brand-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-brand-primary/40 ring-offset-1"
              >
                다음: 수신자 확인 <ChevronRight size={16} strokeWidth={2.5} />
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => setStep(1)}
                disabled={isSending}
                className="flex-1 py-3.5 text-sm font-bold text-secondary bg-surface-subtle hover:bg-border/30 rounded-xl transition-all disabled:opacity-50"
              >
                이전
              </button>
              <button 
                onClick={handleSend}
                disabled={isSending}
                className="flex-[2] py-3.5 text-sm font-bold text-white bg-brand-primary hover:bg-brand-primary-hover rounded-xl shadow-md shadow-brand-primary/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSending ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    발송 처리 중...
                  </>
                ) : (
                  <>
                    <Send size={16} strokeWidth={2.5} /> 최종 발송 시작
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
