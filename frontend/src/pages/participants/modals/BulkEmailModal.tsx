import { useState, useMemo, useEffect } from "react";
import { X, Send, Mail, Check, AlertCircle, ChevronRight, Users, Loader2, Paperclip } from "lucide-react";
import { useTemplateStore } from "../../../stores/useTemplateStore";
import { useToastStore } from "../../../stores/useToastStore";
import type { ParticipantRecord } from "../../../types/models";

interface BulkEmailModalProps {
  onClose: () => void;
  selectedParticipants: ParticipantRecord[];
  onSuccess?: () => void;
}

export function BulkEmailModal({ onClose, selectedParticipants }: BulkEmailModalProps) {
  const { templates, fetchTemplates, sendBatch, fetchJobStatus, activeJob } = useTemplateStore();
  const { addToast } = useToastStore();
  
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [isSending, setIsSending] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // Auto-select first template
  useEffect(() => {
    if (!selectedTemplateId && templates.length > 0) {
      setSelectedTemplateId(templates[0].id);
    }
  }, [templates, selectedTemplateId]);

  const selectedTemplate = useMemo(() => 
    templates.find(t => t.id === selectedTemplateId),
    [templates, selectedTemplateId]
  );

  // Polling for job status
  useEffect(() => {
    let interval: any;
    if (jobId) {
      interval = setInterval(async () => {
        try {
          const job = await fetchJobStatus(jobId);
          if (job.status === 'completed' || job.status === 'failed') {
            clearInterval(interval);
            if (job.status === 'completed') {
              addToast(`발송이 완료되었습니다. (성공: ${job.sentCount}, 실패: ${job.failedCount})`, "success");
            }
          }
        } catch (err) {
          console.error("Polling error:", err);
          clearInterval(interval);
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [jobId, fetchJobStatus, addToast]);

  const handleSend = async () => {
    if (!selectedTemplateId) return;
    setIsSending(true);
    try {
      const recipients = selectedParticipants.map(p => ({
        email: p.email,
        variables: {
          name: p.name,
          companyName: p.companyName,
          position: p.position || "",
          phone: p.phone || ""
        }
      }));

      const response = await sendBatch(selectedTemplateId, recipients);
      setJobId(response.jobId);
      setStep(3);
    } catch (err: any) {
      addToast(`발송 시작 실패: ${err.message}`, "error");
    } finally {
      setIsSending(false);
    }
  };

  const progressPercent = activeJob ? Math.round(((activeJob.sentCount + activeJob.failedCount) / activeJob.totalCount) * 100) : 0;
  const processedCount = activeJob ? (activeJob.sentCount + (activeJob.failedCount || 0)) : 0;

  return (
    <div className="fixed inset-0 bg-brand-dark/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200"
         onClick={(e) => {
           if (e.target === e.currentTarget && !isSending && step !== 3) onClose();
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
            disabled={isSending && step !== 3}
            className="p-2 text-tertiary hover:text-secondary hover:bg-surface-subtle rounded-full transition-all disabled:opacity-50"
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
                    </div>
                  ) : (
                    templates.map(t => (
                      <label
                        key={t.id}
                        className={`relative flex flex-col p-4 cursor-pointer rounded-2xl border-2 transition-all duration-200 ${
                          selectedTemplateId === t.id 
                            ? "border-brand-primary bg-brand-primary/5 shadow-md ring-2 ring-brand-primary/10" 
                            : "border-border/50 bg-surface hover:border-brand-primary/30"
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
                        <p className="text-xs text-secondary line-clamp-1">{t.subject || "제목 없음"}</p>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : step === 2 ? (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="space-y-3">
                <label className="text-xs font-black text-tertiary uppercase tracking-widest px-1">2. 최종 확인</label>
                <div className="p-6 bg-surface border border-border/50 rounded-2xl shadow-sm space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black text-tertiary uppercase mb-1">선택된 템플릿</p>
                      <p className="text-sm font-bold text-primary">{selectedTemplate?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-tertiary uppercase mb-1">수신자 수</p>
                      <p className="text-sm font-bold text-brand-primary">{selectedParticipants.length}명</p>
                    </div>
                  </div>

                  {selectedTemplate?.attachments && selectedTemplate.attachments.length > 0 && (
                    <div>
                      <p className="text-[10px] font-black text-tertiary uppercase mb-2">포함된 첨부파일</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedTemplate.attachments.map(att => (
                          <div key={att.id} className="px-2 py-1 bg-surface-subtle rounded border border-border/50 text-[10px] font-bold text-secondary flex items-center gap-1.5">
                            <Paperclip size={10} /> {att.originalName}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="p-4 bg-warning/10 border border-warning/20 rounded-xl flex items-start gap-3">
                    <AlertCircle size={18} className="text-warning shrink-0 mt-0.5" />
                    <p className="text-[11px] text-warning/90 font-medium leading-relaxed">
                      실제 발송은 취소할 수 없습니다. 네이버 SMTP 한도에 따라 분당 약 10통씩 순차적으로 발송됩니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8 py-8 animate-in zoom-in-95 duration-500">
              <div className="flex flex-col items-center justify-center text-center space-y-4">
                <div className="relative">
                  <div className="w-24 h-24 border-4 border-brand-primary/10 rounded-full flex items-center justify-center">
                    <Loader2 size={40} className="text-brand-primary animate-spin" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-black text-brand-primary">{progressPercent}%</span>
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-primary">메일 발송 중...</h4>
                  <p className="text-xs text-tertiary mt-1">서버에서 순차적으로 발송 처리를 진행하고 있습니다.</p>
                </div>
              </div>

              <div className="space-y-3 px-4">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-secondary">진행률</span>
                  <span className="text-brand-primary">{processedCount} / {activeJob?.totalCount || 0} 통</span>
                </div>
                <div className="w-full h-3 bg-surface border border-border/50 rounded-full overflow-hidden p-0.5">
                  <div 
                    className="h-full bg-brand-primary rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(var(--brand-primary-rgb),0.3)]"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter pt-1">
                  <div className="flex items-center gap-1.5 text-success">
                    <div className="w-1.5 h-1.5 rounded-full bg-success" /> 성공: {activeJob?.sentCount || 0}
                  </div>
                  <div className="flex items-center gap-1.5 text-error">
                    <div className="w-1.5 h-1.5 rounded-full bg-error" /> 실패: {activeJob?.failedCount || 0}
                  </div>
                </div>
              </div>

              {activeJob?.status === 'completed' && (
                <div className="p-4 bg-success/5 border border-success/20 rounded-2xl flex items-center justify-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="p-1.5 bg-success/20 rounded-full text-success">
                    <Check size={16} strokeWidth={3} />
                  </div>
                  <span className="text-sm font-bold text-success">발송 작업이 모두 완료되었습니다.</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="px-6 py-5 border-t border-border/50 bg-surface flex items-center gap-3 relative z-10">
          {step === 1 ? (
            <>
              <button onClick={onClose} className="flex-1 py-3.5 text-sm font-bold text-secondary bg-surface-subtle hover:bg-border/30 rounded-xl transition-all">취소</button>
              <button onClick={() => setStep(2)} disabled={!selectedTemplateId} className="flex-[2] py-3.5 text-sm font-bold text-white bg-brand-primary hover:bg-brand-primary-hover rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                다음 단계로 <ChevronRight size={16} strokeWidth={2.5} />
              </button>
            </>
          ) : step === 2 ? (
            <>
              <button onClick={() => setStep(1)} disabled={isSending} className="flex-1 py-3.5 text-sm font-bold text-secondary bg-surface-subtle hover:bg-border/30 rounded-xl transition-all disabled:opacity-50">이전</button>
              <button onClick={handleSend} disabled={isSending} className="flex-[2] py-3.5 text-sm font-bold text-white bg-brand-primary hover:bg-brand-primary-hover rounded-xl shadow-lg shadow-brand-primary/20 transition-all flex items-center justify-center gap-2">
                {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} strokeWidth={2.5} />}
                최종 발송 시작
              </button>
            </>
          ) : (
            <button onClick={onClose} className="w-full py-4 text-sm font-bold text-secondary bg-surface-subtle hover:bg-surface-active rounded-xl transition-all">
              {activeJob?.status === 'completed' ? "닫기" : "백그라운드에서 계속 (닫기)"}
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
