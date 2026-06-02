import { useState, useMemo, useEffect } from "react";
import { X, Send, Mail, Check, AlertCircle, ChevronRight, Users, Loader2, Paperclip, Search, Calendar as CalendarIcon, BookOpen } from "lucide-react";
import { useTemplateStore, useCourseStore, useToastStore } from "@/stores";
import type { ParticipantRecord } from "@/types/models";

interface BulkEmailModalProps {
  onClose: () => void;
  selectedParticipants: ParticipantRecord[];
  onSuccess?: () => void;
}

export function BulkEmailModal({ onClose, selectedParticipants }: BulkEmailModalProps) {
  const { templates, fetchTemplates, sendBatch, fetchJobStatus, activeJob, subscribeToTemplates, setActiveJob, logs, fetchLogs } = useTemplateStore();
  const { courseGroups, fetchCourseGroups } = useCourseStore();
  const { addToast } = useToastStore();
  
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [isSending, setIsSending] = useState(false);

  // Dynamic Variable Selection State
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [selectedProgramId, setSelectedProgramId] = useState<string>("");
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");

  useEffect(() => {
    fetchTemplates();
    fetchCourseGroups();
    const unsubscribe = subscribeToTemplates();
    return () => {
      unsubscribe();
      setActiveJob(null);
    };
  }, [fetchTemplates, fetchCourseGroups, subscribeToTemplates, setActiveJob]);

  // Fetch logs when job status is completed or has failures to show details
  useEffect(() => {
    if (activeJob?.id && (activeJob.status === 'completed' || activeJob.failedCount > 0)) {
      fetchLogs({ jobId: activeJob.id });
    }
  }, [activeJob?.id, activeJob?.status, activeJob?.failedCount, fetchLogs]);

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

  const needsVariableSelection = useMemo(() => {
    if (!selectedTemplate) return false;
    const combined = selectedTemplate.subject + selectedTemplate.body;
    return combined.includes("{{subCourseName}}") || combined.includes("{{courseDate}}");
  }, [selectedTemplate]);

  const selectedGroup = useMemo(() => courseGroups.find(g => g.id === selectedGroupId), [courseGroups, selectedGroupId]);
  const selectedProgram = useMemo(() => selectedGroup?.details.find(d => d.id === selectedProgramId), [selectedGroup, selectedProgramId]);
  const selectedSession = useMemo(() => selectedProgram?.sessions?.find(s => s.id === selectedSessionId), [selectedProgram, selectedSessionId]);

  const canGoToNext = useMemo(() => {
    if (!selectedTemplateId) return false;
    if (needsVariableSelection) {
      const combined = selectedTemplate!.subject + selectedTemplate!.body;
      const needsProg = combined.includes("{{subCourseName}}");
      const needsDate = combined.includes("{{courseDate}}");
      if (needsProg && !selectedProgramId) return false;
      if (needsDate && !selectedSessionId) return false;
    }
    return true;
  }, [selectedTemplateId, needsVariableSelection, selectedTemplate, selectedProgramId, selectedSessionId]);

  const failureLogs = useMemo(() => 
    logs.filter(log => log.status === 'failed' && log.jobId === activeJob?.id),
    [logs, activeJob?.id]
  );

  // Backup polling for environments where Realtime might be restricted or slow
  useEffect(() => {
    let interval: any;
    if (activeJob && activeJob.status !== 'completed' && activeJob.status !== 'failed' && step === 3) {
      interval = setInterval(() => {
        fetchJobStatus(activeJob.id).catch(console.error);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [activeJob?.id, activeJob?.status, step, fetchJobStatus]);

  const handleSend = async () => {
    if (!selectedTemplateId) return;
    setIsSending(true);
    try {
      const recipients = selectedParticipants.map(p => {
        const participantName = p?.name || "";
        return {
          email: p?.email || "",
          name: participantName,
          variables: {
            name: participantName,
            companyName: p?.companyName || "",
            subCourseName: selectedProgram?.name || "",
            courseDate: selectedSession ? `${selectedSession?.startDate || ""} ~ ${selectedSession?.endDate || ""}` : ""
          }
        };
      }).filter(r => r.email);

      if (recipients.length === 0) {
        throw new Error("이메일 주소가 등록된 참여자가 없습니다.");
      }

      await sendBatch(selectedTemplateId, recipients);
      setStep(3);
    } catch (err: any) {
      addToast(`발송 시작 실패: ${err.message}`, "error");
    } finally {
      setIsSending(false);
    }
  };

  const progressPercent = activeJob && activeJob.totalCount > 0 
    ? Math.round((( (activeJob.sentCount || 0) + (activeJob.failedCount || 0) ) / activeJob.totalCount) * 100) 
    : 0;
  const processedCount = activeJob ? ((activeJob.sentCount || 0) + (activeJob.failedCount || 0)) : 0;
  const isCompleted = activeJob?.status === 'completed';

  return (
    <div className="fixed inset-0 bg-brand-dark/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
         onClick={(e) => {
           if (e.target === e.currentTarget && !isSending && step !== 3) onClose();
         }}>
      <div className="bg-surface rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <header className="px-6 py-5 border-b border-border/50 flex items-center justify-between bg-surface relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-primary/10 rounded-xl text-brand-primary">
              <Mail size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-primary tracking-tight">단체 메일 발송</h3>
              <p className="text-xs text-tertiary font-bold tracking-wider mt-0.5 flex items-center gap-1.5">
                <Users size={12} strokeWidth={2.5} /> {selectedParticipants?.length || 0}명 선택됨
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
            <div className="space-y-8">
              <div className="space-y-4">
                <label className="text-[11px] font-black text-tertiary uppercase tracking-widest px-1 opacity-60">1. 템플릿 선택</label>
                <div className="grid grid-cols-1 gap-3">
                  {!templates || templates.length === 0 ? (
                    <div className="p-12 border-2 border-dashed border-border/40 rounded-[28px] text-center bg-surface-subtle/30">
                      <Mail size={40} className="mx-auto text-tertiary/20 mb-3" />
                      <p className="text-sm text-secondary font-bold">저장된 템플릿이 없습니다.</p>
                    </div>
                  ) : (
                    templates.map(t => (
                      <label
                        key={t.id}
                        className={`relative flex flex-col p-5 cursor-pointer rounded-2xl border-2 transition-all duration-300 ${
                          selectedTemplateId === t.id 
                            ? "border-brand-primary bg-brand-primary/[0.03] shadow-lg shadow-brand-primary/5 ring-4 ring-brand-primary/5" 
                            : "border-border/40 bg-surface hover:border-brand-primary/30"
                        }`}
                      >
                        <input
                          type="radio"
                          name="bulk-email-template"
                          className="sr-only"
                          value={t.id}
                          checked={selectedTemplateId === t.id}
                          onChange={() => {
                            setSelectedTemplateId(t.id);
                            setSelectedGroupId("");
                            setSelectedProgramId("");
                            setSelectedSessionId("");
                          }}
                        />
                        <div className="flex items-center justify-between mb-1.5 pr-8">
                          <span className={`text-[15px] ${selectedTemplateId === t.id ? "font-black text-brand-primary" : "font-bold text-primary"}`}>{t.name}</span>
                          <div className={`absolute right-5 top-6 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
                            selectedTemplateId === t.id ? "border-brand-primary bg-brand-primary rotate-0 scale-100" : "border-border/60 rotate-90 scale-90"
                          }`}>
                            {selectedTemplateId === t.id && <Check size={14} className="text-white" strokeWidth={4} />}
                          </div>
                        </div>
                        <p className="text-xs text-tertiary font-medium line-clamp-1 opacity-70">{t.subject || "제목 없음"}</p>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {needsVariableSelection && (
                <div className="space-y-4 pt-4 border-t border-border/40 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="flex items-center gap-2 px-1">
                    <div className="w-1.5 h-4 bg-brand-primary rounded-full" />
                    <label className="text-[11px] font-black text-primary uppercase tracking-widest">2. 변수 데이터 선택 (프로그램/회차)</label>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4 p-6 bg-brand-primary/[0.02] border border-brand-primary/10 rounded-[28px]">
                    <div className="space-y-2">
                      <span className="text-[10px] font-black text-tertiary uppercase tracking-wider ml-1">과정 구분</span>
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-tertiary" size={14} />
                        <select 
                          className="w-full pl-10 pr-4 py-3 bg-white border border-border/60 rounded-xl text-sm font-bold appearance-none outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all"
                          value={selectedGroupId}
                          onChange={(e) => {
                            setSelectedGroupId(e.target.value);
                            setSelectedProgramId("");
                            setSelectedSessionId("");
                          }}
                        >
                          <option value="">과정 그룹 선택</option>
                          {courseGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <span className="text-[10px] font-black text-tertiary uppercase tracking-wider ml-1">프로그램명</span>
                        <div className="relative">
                          <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-tertiary" size={14} />
                          <select 
                            className="w-full pl-10 pr-4 py-3 bg-white border border-border/60 rounded-xl text-sm font-bold appearance-none outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all disabled:opacity-40"
                            value={selectedProgramId}
                            disabled={!selectedGroupId}
                            onChange={(e) => {
                              setSelectedProgramId(e.target.value);
                              setSelectedSessionId("");
                            }}
                          >
                            <option value="">프로그램 선택</option>
                            {selectedGroup?.details.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[10px] font-black text-tertiary uppercase tracking-wider ml-1">회차(일정)</span>
                        <div className="relative">
                          <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-tertiary" size={14} />
                          <select 
                            className="w-full pl-10 pr-4 py-3 bg-white border border-border/60 rounded-xl text-sm font-bold appearance-none outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all disabled:opacity-40"
                            value={selectedSessionId}
                            disabled={!selectedProgramId}
                            onChange={(e) => setSelectedSessionId(e.target.value)}
                          >
                            <option value="">회차 선택</option>
                            {selectedProgram?.sessions?.map((s, idx) => (
                              <option key={s.id} value={s.id}>{idx + 1}회차 ({s.startDate} ~ {s.endDate})</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : step === 2 ? (
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-xs font-black text-tertiary uppercase tracking-widest px-1">3. 최종 확인</label>
                <div className="p-6 bg-surface border border-border/50 rounded-2xl shadow-sm space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black text-tertiary uppercase mb-1">선택된 템플릿</p>
                      <p className="text-sm font-bold text-primary">{selectedTemplate?.name || "알 수 없는 템플릿"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-tertiary uppercase mb-1">수신자 수</p>
                      <p className="text-sm font-bold text-brand-primary">{selectedParticipants?.length || 0}명</p>
                    </div>
                  </div>

                  {selectedProgram && (
                    <div className="p-4 bg-surface-subtle/50 rounded-xl border border-border/40 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-tertiary uppercase">선택된 프로그램</span>
                        <span className="text-xs font-bold text-primary">{selectedProgram.name}</span>
                      </div>
                      {selectedSession && (
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-tertiary uppercase">선택된 일정</span>
                          <span className="text-xs font-bold text-primary">{selectedSession.startDate} ~ {selectedSession.endDate}</span>
                        </div>
                      )}
                    </div>
                  )}

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
            <div className="space-y-8 py-4">
              <div className="flex flex-col items-center justify-center text-center space-y-4">
                <div className="relative">
                  <div className={`w-24 h-24 border-4 rounded-full flex items-center justify-center transition-all duration-500 ${isCompleted ? "border-success bg-success/5" : "border-brand-primary/10"}`}>
                    {isCompleted ? (
                      <div className="animate-in zoom-in duration-500">
                        <Check size={48} className="text-success" strokeWidth={3} />
                      </div>
                    ) : (
                      <Loader2 size={40} className="text-brand-primary animate-spin" />
                    )}
                  </div>
                  {!isCompleted && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-black text-brand-primary">{progressPercent}%</span>
                    </div>
                  )}
                </div>
                <div>
                  <h4 className={`text-lg font-bold tracking-tight ${isCompleted ? "text-success" : "text-primary"}`}>
                    {isCompleted ? "발송 완료" : "메일 발송 중..."}
                  </h4>
                  <p className="text-xs text-tertiary mt-1">
                    {isCompleted 
                      ? "모든 요청이 서버에서 처리되었습니다." 
                      : "서버에서 순차적으로 발송 처리를 진행하고 있습니다."}
                  </p>
                </div>
              </div>

              <div className="space-y-3 px-4">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-secondary">{isCompleted ? "최종 결과" : "실시간 진행률"}</span>
                  <span className={isCompleted ? "text-primary" : "text-brand-primary"}>{processedCount} / {activeJob?.totalCount || 0} 통</span>
                </div>
                <div className="w-full h-3 bg-surface border border-border/50 rounded-full overflow-hidden p-0.5">
                  <div 
                    className={`h-full rounded-full transition-all duration-700 ${isCompleted ? "bg-success" : "bg-brand-primary shadow-[0_0_10px_rgba(var(--brand-primary-rgb),0.3)]"}`}
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

              {failureLogs.length > 0 && (
                <div className="px-4 space-y-3 animate-in fade-in slide-in-from-top-4 duration-500">
                  <label className="text-[10px] font-black text-error uppercase tracking-widest px-1">실패 내역 ({failureLogs.length})</label>
                  <div className="bg-error/5 border border-error/10 rounded-2xl overflow-hidden">
                    <div className="max-h-[180px] overflow-y-auto custom-scrollbar">
                      <table className="w-full text-left text-[11px] border-collapse">
                        <thead className="sticky top-0 bg-error/10 backdrop-blur-md">
                          <tr>
                            <th className="px-4 py-2 font-black text-error/70">대상자</th>
                            <th className="px-4 py-2 font-black text-error/70">이메일</th>
                            <th className="px-4 py-2 font-black text-error/70">실패 원인</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-error/10">
                          {failureLogs.map(log => (
                            <tr key={log.id} className="hover:bg-error/5 transition-colors">
                              <td className="px-4 py-2.5 font-bold text-primary">{log.recipientName || "알 수 없음"}</td>
                              <td className="px-4 py-2.5 text-secondary">{log.recipientEmail}</td>
                              <td className="px-4 py-2.5 text-error font-medium">{log.errorMessage || "알 수 없는 오류"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
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
              <button onClick={() => setStep(2)} disabled={!canGoToNext} className="flex-[2] py-3.5 text-sm font-bold text-white bg-brand-primary hover:bg-brand-primary-hover rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale">
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
