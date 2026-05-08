import { useEffect, useState, useMemo } from "react";
import { Mail, Paperclip, Send, X, AlertCircle, Clock, Plus as PlusIcon } from "lucide-react";
import { templateVariables } from "../constants";
import { PageHeader } from "../components";
import { applyTemplateVariables } from "../utils/templateVariables";
import { useTemplateStore } from "../stores/useTemplateStore";
import { useToastStore } from "../stores/useToastStore";
import { AttachmentUploader } from "../components/email/AttachmentUploader";
import type { EmailTemplate, InsuranceTarget, AttachmentMeta } from "../types/models";
import { toDotDate } from "./companies/utils/companyUtils";

export function TemplateEditorPage() {
  const { 
    templates, 
    logs,
    isLoading, 
    error, 
    fetchTemplates, 
    upsertTemplate, 
    testEmail,
    fetchLogs,
    clearError,
    uploadAttachment,
    deleteAttachment
  } = useTemplateStore();
  const { addToast } = useToastStore();
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [draftTemplate, setDraftTemplate] = useState<EmailTemplate | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [testEmailAddr, setTestEmailAddr] = useState("");
  const [isTestSending, setIsTestSending] = useState(false);
  const [activeTab, setActiveTab] = useState<"editor" | "logs">("editor");

  useEffect(() => {
    fetchTemplates();
    fetchLogs();
  }, [fetchTemplates, fetchLogs]);

  useEffect(() => {
    if (templates.length > 0 && !activeTemplateId) {
      setActiveTemplateId(templates[0].id);
    }
  }, [templates, activeTemplateId]);

  useEffect(() => {
    const selected = templates.find(
      (template) => template.id === activeTemplateId,
    );
    if (selected) {
      setDraftTemplate({ ...selected, attachments: selected.attachments || [] });
    }
  }, [activeTemplateId, templates]);

  useEffect(() => {
    if (error) {
      addToast(`에러: ${error}`, "error");
      clearError();
    }
  }, [error, addToast, clearError]);

  async function saveTemplate() {
    if (!draftTemplate) return;
    setIsSaving(true);
    try {
      await upsertTemplate(draftTemplate);
      addToast("템플릿이 저장되었습니다.", "success");
    } catch (err: any) {
      // Error handled by useEffect
    } finally {
      setIsSaving(false);
    }
  }

  async function handleTestSend() {
    if (!draftTemplate || !testEmailAddr) return;
    setIsTestSending(true);
    const mockData = {
      name: "테스트 수신자",
      companyName: "테스트 기업",
      courseName: "테스트 과정",
      deadline: "2026-12-31",
      contactPhone: "010-0000-0000",
      managerName: "관리자"
    };
    try {
      await testEmail(
        testEmailAddr,
        applyTemplateVariables(draftTemplate.subject, mockData),
        applyTemplateVariables(draftTemplate.body, mockData),
        draftTemplate.attachments
      );
      addToast("테스트 메일이 발송되었습니다.", "success");
      setShowTestModal(false);
      fetchLogs();
    } catch (err: any) {
      // Toast added via store error or local catch
    } finally {
      setIsTestSending(false);
    }
  }

  async function handleUpload(file: File) {
    if (!draftTemplate || draftTemplate.id.startsWith('tpl-')) {
      addToast("먼저 템플릿을 저장한 후 파일을 업로드할 수 있습니다.", "error");
      return;
    }
    try {
      await uploadAttachment(draftTemplate.id, file);
      addToast("파일이 업로드되었습니다.", "success");
    } catch (err: any) {
      // Error handled by store
    }
  }

  async function handleDeleteAttachment(attachmentId: string) {
    if (!draftTemplate) return;
    try {
      await deleteAttachment(draftTemplate.id, attachmentId);
      addToast("파일이 삭제되었습니다.", "success");
    } catch (err: any) {
      // Error handled by store
    }
  }

  function insertVariable(variable: string) {
    if (!draftTemplate) return;
    setDraftTemplate((current) => current ? ({
      ...current,
      body: `${current.body}\n{{${variable}}}`.trim(),
    }) : null);
  }

  const mockData = useMemo(() => ({
    name: "박소영",
    companyName: "한빛테크",
    courseName: "스마트팩토리 실무 과정",
    deadline: "2026-05-02",
    contactPhone: "062-710-2896",
    managerName: "김관리",
  }), []);

  const previewSubject = useMemo(() => 
    draftTemplate ? applyTemplateVariables(draftTemplate.subject, mockData) : "", 
  [draftTemplate, mockData]);

  const unresolvedVars = useMemo(() => {
    if (!draftTemplate) return [];
    const textToCheck = draftTemplate.subject + " " + draftTemplate.body;
    const parts = textToCheck.split(/({{[a-zA-Z0-9_]+}})/g);
    const vars = new Set<string>();
    parts.forEach(part => {
      if (part.startsWith('{{') && part.endsWith('}}')) {
        const varName = part.slice(2, -2);
        if (!Object.keys(mockData).includes(varName)) {
          vars.add(varName);
        }
      }
    });
    return Array.from(vars);
  }, [draftTemplate, mockData]);

  // Function to highlight unresolved variables in preview
  const renderBodyWithHighlights = (text: string) => {
    const parts = text.split(/({{[a-zA-Z0-9_]+}})/g);
    return parts.map((part, i) => {
      if (part.startsWith('{{') && part.endsWith('}}')) {
        const varName = part.slice(2, -2);
        const isResolved = Object.keys(mockData).includes(varName);
        return (
          <span 
            key={i} 
            className={`px-1 rounded ${isResolved ? 'bg-brand-primary/10 text-brand-primary' : 'bg-error/20 text-error font-black shadow-[0_0_0_1px_rgba(255,0,0,0.3)]'}`}
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  if (isLoading && templates.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-10 h-10 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  function createNewTemplate() {
    const newId = `tpl-${Date.now()}`;
    const newTemplate: EmailTemplate = {
      id: newId,
      name: "새 템플릿",
      audience: "ALL",
      subject: "새 메일 제목",
      body: "본문 내용을 입력하세요.",
      attachments: []
    };
    setActiveTemplateId(newId);
    setDraftTemplate(newTemplate);
  }

  return (
    <>
      <PageHeader 
        title="이메일 시스템 관리" 
        actions={
          <div className="flex bg-surface-subtle p-1 rounded-xl border border-border/50">
            <button 
              onClick={() => setActiveTab("editor")}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === "editor" ? "bg-surface shadow-sm text-brand-primary" : "text-tertiary hover:text-secondary"}`}
            >
              템플릿 편집
            </button>
            <button 
              onClick={() => setActiveTab("logs")}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === "logs" ? "bg-surface shadow-sm text-brand-primary" : "text-tertiary hover:text-secondary"}`}
            >
              발송 이력
            </button>
          </div>
        }
      />

      {activeTab === "editor" ? (
        <section aria-label="이메일 템플릿 편집 화면">
          <div className="template-layout">
            <aside className="template-list" aria-label="템플릿 목록">
              <div className="px-3 mb-4 flex items-center justify-between">
                <span className="text-[10px] font-black text-disabled uppercase tracking-widest">저장된 템플릿</span>
                <button 
                  onClick={createNewTemplate}
                  className="p-1 text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-all"
                >
                  <PlusIcon size={14} strokeWidth={3} />
                </button>
              </div>
              {templates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  className={
                    template.id === activeTemplateId
                      ? "template-item template-item-active"
                      : "template-item"
                  }
                  onClick={() => setActiveTemplateId(template.id)}
                >
                  <p className="template-item-title">{template.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      template.audience === "INSURED" ? "bg-brand-primary/10 text-brand-primary" : 
                      template.audience === "UNINSURED" ? "bg-warning/10 text-warning" : "bg-surface-subtle text-tertiary"
                    }`}>
                      {template.audience === "INSURED" ? "가입자" : template.audience === "UNINSURED" ? "미가입자" : "전체"}
                    </span>
                    {template.attachments && template.attachments.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Paperclip size={10} className="text-disabled" />
                        <span className="text-[10px] text-disabled font-bold">{template.attachments.length}</span>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </aside>

            {draftTemplate ? (
              <div className="template-editor-area">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="p-6 bg-surface border border-border/50 rounded-[24px] space-y-5 shadow-sm">
                      <div className="grid grid-cols-2 gap-4">
                        <label className="field">
                          템플릿 이름
                          <input
                            className="w-full px-4 py-2.5 bg-surface-subtle border border-border rounded-xl text-sm font-semibold focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
                            value={draftTemplate.name}
                            onChange={(event) =>
                              setDraftTemplate((current) => current ? ({
                                ...current,
                                name: event.target.value,
                              }) : null)
                            }
                          />
                        </label>

                        <label className="field">
                          대상자 구분
                          <select
                            className="w-full px-4 py-2.5 bg-surface-subtle border border-border rounded-xl text-sm font-bold focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
                            value={draftTemplate.audience}
                            onChange={(event) =>
                              setDraftTemplate((current) => current ? ({
                                ...current,
                                audience: event.target.value as InsuranceTarget,
                              }) : null)
                            }
                          >
                            <option value="ALL">전체</option>
                            <option value="INSURED">고용보험 가입자</option>
                            <option value="UNINSURED">고용보험 미가입자</option>
                          </select>
                        </label>
                      </div>

                      <label className="field">
                        메일 제목
                        <input
                          className="w-full px-4 py-2.5 bg-surface-subtle border border-border rounded-xl text-sm font-semibold focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
                          value={draftTemplate.subject}
                          onChange={(event) =>
                            setDraftTemplate((current) => current ? ({
                              ...current,
                              subject: event.target.value,
                            }) : null)
                          }
                        />
                      </label>

                      <AttachmentUploader 
                        attachments={draftTemplate.attachments || []}
                        onUpload={handleUpload}
                        onDelete={handleDeleteAttachment}
                        isLoading={isLoading}
                      />
                    </div>

                    <div className="p-6 bg-surface border border-border/50 rounded-[24px] space-y-4 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-tertiary uppercase tracking-wider">본문 편집</span>
                        <div className="flex gap-2">
                          {templateVariables.map((variable) => (
                            <button
                              key={variable}
                              type="button"
                              className="px-2 py-1 bg-brand-primary/10 text-brand-primary text-[10px] font-black rounded-lg hover:bg-brand-primary/20 transition-all"
                              onClick={() => insertVariable(variable)}
                            >
                              {variable}
                            </button>
                          ))}
                        </div>
                      </div>
                      <textarea
                        className="w-full h-[320px] p-4 bg-surface-subtle border border-border rounded-2xl text-sm font-medium leading-relaxed focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all resize-none custom-scrollbar"
                        value={draftTemplate.body}
                        onChange={(event) =>
                          setDraftTemplate((current) => current ? ({
                            ...current,
                            body: event.target.value,
                          }) : null)
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="p-6 bg-brand-primary/5 border border-brand-primary/20 rounded-[24px] space-y-4 shadow-inner">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black text-brand-primary uppercase tracking-widest">미리보기 (Preview)</h3>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
                          <span className="text-[10px] font-bold text-success">실시간 렌더링 중</span>
                        </div>
                      </div>
                      
                      {unresolvedVars.length > 0 && (
                        <div className="flex items-center gap-2 p-3 bg-error/10 text-error rounded-xl border border-error/20">
                          <AlertCircle size={16} className="shrink-0" />
                          <span className="text-xs font-bold leading-tight">해결되지 않은 변수가 있습니다: {unresolvedVars.map((v: string) => `{{${v}}}`).join(', ')}. 그대로 발송 시 오류가 발생할 수 있습니다.</span>
                        </div>
                      )}

                      <div className="bg-surface rounded-2xl p-6 border border-brand-primary/10 shadow-lg min-h-[400px] flex flex-col">
                        <div className="pb-4 mb-6 border-b border-border/50 space-y-1">
                          <p className="text-[10px] font-bold text-tertiary uppercase">수신: 박소영 (한빛테크)</p>
                          <p className="text-sm font-bold text-primary">
                            제목: {previewSubject}
                          </p>
                        </div>
                        <div className="text-sm text-secondary font-medium whitespace-pre-wrap leading-relaxed font-sans flex-1 overflow-auto custom-scrollbar">
                          {renderBodyWithHighlights(draftTemplate.body)}
                        </div>
                        
                        {(draftTemplate.attachments?.length || 0) > 0 && (
                          <div className="mt-6 pt-4 border-t border-border/30">
                            <p className="text-[10px] font-bold text-tertiary uppercase mb-2">첨부파일 ({draftTemplate.attachments?.length})</p>
                            <div className="flex flex-wrap gap-2">
                              {draftTemplate.attachments?.map((att: AttachmentMeta) => (
                                <div key={att.id} className="flex items-center gap-1.5 px-2 py-1 bg-surface-subtle rounded border border-border/50 text-[10px] font-bold text-secondary">
                                  <Paperclip size={10} />
                                  {att.originalName}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button
                        type="button"
                        className="flex-1 h-14 bg-surface border border-border hover:bg-surface-subtle text-secondary rounded-2xl font-bold flex items-center justify-center gap-2 transition-all"
                        onClick={() => setShowTestModal(true)}
                      >
                        <Send size={18} /> 테스트 발송
                      </button>
                      <button
                        type="button"
                        className="flex-[2] h-14 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-brand-primary/20 transition-all active:scale-95 disabled:opacity-50"
                        onClick={saveTemplate}
                        disabled={isSaving}
                      >
                        {isSaving ? "저장 중..." : "최종 버전 저장"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="template-editor-area flex flex-col items-center justify-center gap-4 text-tertiary bg-surface-subtle/30 rounded-[32px] border-2 border-dashed border-border/50">
                <div className="p-4 bg-surface rounded-2xl shadow-sm">
                  <Mail size={40} className="text-disabled" />
                </div>
                <p className="text-sm font-bold">템플릿을 선택하여 편집을 시작하세요.</p>
              </div>
            )}
          </div>
        </section>
      ) : (
        <section aria-label="메일 발송 이력">
          <div className="bg-surface border border-border/50 rounded-[32px] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-subtle/50">
                    <th className="px-6 py-4 text-[10px] font-black text-tertiary uppercase tracking-widest border-b border-border/50">발송 일시</th>
                    <th className="px-6 py-4 text-[10px] font-black text-tertiary uppercase tracking-widest border-b border-border/50">템플릿</th>
                    <th className="px-6 py-4 text-[10px] font-black text-tertiary uppercase tracking-widest border-b border-border/50">수신 이메일</th>
                    <th className="px-6 py-4 text-[10px] font-black text-tertiary uppercase tracking-widest border-b border-border/50">상태</th>
                    <th className="px-6 py-4 text-[10px] font-black text-tertiary uppercase tracking-widest border-b border-border/50">상세</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-sm text-disabled italic">최근 발송 이력이 없습니다.</td>
                    </tr>
                  ) : logs.map(log => (
                    <tr key={log.id} className="hover:bg-brand-primary/5 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-secondary">
                          <Clock size={12} className="text-disabled" />
                          {log.sentAt ? `${toDotDate(log.sentAt)} ${new Date(log.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : toDotDate(log.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-black text-primary uppercase">{log.templateName || "직접 발송"}</td>
                      <td className="px-6 py-4 text-xs font-mono font-bold text-secondary tracking-tight">{log.recipientEmail}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                          log.status === "sent" ? "bg-success/10 text-success" : 
                          log.status === "failed" ? "bg-error/10 text-error" : "bg-warning/10 text-warning"
                        }`}>
                          {log.status === "sent" ? "성공" : log.status === "failed" ? "실패" : "대기"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {log.errorMessage ? (
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-error">
                            <AlertCircle size={12} />
                            {log.errorMessage}
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-tertiary">{log.status === "sent" ? "정상 발송됨" : "-"}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {showTestModal && (
        <div className="fixed inset-0 bg-brand-dark/40 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-surface rounded-[32px] p-8 shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                <Send size={20} className="text-brand-primary" /> 테스트 메일 발송
              </h3>
              <button onClick={() => setShowTestModal(false)} className="p-2 hover:bg-surface-subtle rounded-full transition-all">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4 mb-8">
              <label className="field">
                테스트 수신 이메일
                <input 
                  type="email" 
                  placeholder="example@naver.com"
                  className="w-full px-4 py-3 bg-surface-subtle border border-border rounded-xl text-sm font-semibold focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
                  value={testEmailAddr}
                  onChange={(e) => setTestEmailAddr(e.target.value)}
                />
              </label>
              <div className="p-4 bg-brand-primary/5 rounded-2xl border border-brand-primary/10">
                <p className="text-[11px] text-secondary leading-relaxed">
                  작성 중인 템플릿의 <span className="text-brand-primary font-bold">내용과 제목</span>이 그대로 전송됩니다. 
                  변수 영역은 샘플 데이터로 치환됩니다.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                className="flex-1 py-3 text-sm font-bold text-secondary bg-surface-subtle hover:bg-surface-active rounded-xl transition-all"
                onClick={() => setShowTestModal(false)}
              >
                취소
              </button>
              <button 
                className="flex-1 py-3 text-sm font-bold text-white bg-brand-primary hover:bg-brand-primary-hover rounded-xl shadow-lg shadow-brand-primary/20 transition-all disabled:opacity-50"
                onClick={handleTestSend}
                disabled={isTestSending || !testEmailAddr}
              >
                {isTestSending ? "발송 중..." : "발송 시작"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
