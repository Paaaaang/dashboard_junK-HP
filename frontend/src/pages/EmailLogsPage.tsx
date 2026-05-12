import { useEffect, useState } from "react";
import { Clock, Filter, AlertCircle, Info, ChevronLeft, ChevronRight, Mail, ChevronDown, X } from "lucide-react";
import { PageHeader } from "../components";
import { useTemplateStore } from "../stores/useTemplateStore";
import { toDotDate } from "./companies/utils/companyUtils";

interface EmailLog {
  id: string;
  templateName?: string;
  recipientName?: string;
  recipientEmail: string;
  subject?: string;
  bodyRendered?: string;
  status: string;
  errorMessage?: string;
  sentAt?: string;
  createdAt: string;
  senderEmail?: string;
}

export function EmailLogsPage() {
  const { logs, isLoading, fetchLogs, templates, fetchTemplates } = useTemplateStore();
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterTemplate, setFilterTemplate] = useState<string>("ALL");
  const [page, setPage] = useState(0);
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);
  const limit = 50;

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  useEffect(() => {
    const params: any = {
      limit,
      offset: page * limit
    };
    if (filterStatus !== "ALL") params.status = filterStatus;
    if (filterTemplate !== "ALL") params.templateId = filterTemplate;
    
    fetchLogs(params);
  }, [fetchLogs, page, filterStatus, filterTemplate]);

  return (
    <>
      <PageHeader 
        title="이메일 발송 통합 이력" 
        actions={
          <div className="flex items-center gap-3">
            <div className="flex bg-surface-subtle p-1 rounded-xl border border-border/50">
              <button 
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="p-1.5 text-secondary hover:bg-surface rounded-lg disabled:opacity-30 transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="px-3 flex items-center justify-center text-[10px] font-black text-brand-primary uppercase">
                Page {page + 1}
              </div>
              <button 
                onClick={() => setPage(page + 1)}
                disabled={logs.length < limit}
                className="p-1.5 text-secondary hover:bg-surface rounded-lg disabled:opacity-30 transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        }
      />

      <div className="space-y-6">
        {/* Filters */}
        <div className="p-4 bg-surface border border-border/50 rounded-[24px] shadow-sm flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-tertiary" />
            <span className="text-[10px] font-black text-tertiary uppercase tracking-widest">필터링:</span>
          </div>

          <select 
            className="px-3 py-1.5 bg-surface-subtle border border-border rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all"
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(0); }}
          >
            <option value="ALL">모든 상태</option>
            <option value="sent">발송 성공</option>
            <option value="failed">발송 실패</option>
            <option value="pending">대기 중</option>
          </select>

          <select 
            className="px-3 py-1.5 bg-surface-subtle border border-border rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all"
            value={filterTemplate}
            onChange={(e) => { setFilterTemplate(e.target.value); setPage(0); }}
          >
            <option value="ALL">모든 템플릿</option>
            {templates.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>

          <div className="ml-auto flex items-center gap-2 text-[10px] font-bold text-disabled">
            <Info size={12} />
            최근 500건까지 조회 가능합니다.
          </div>
        </div>

        {/* Logs Table */}
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
                {isLoading && logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3 text-disabled">
                        <div className="w-8 h-8 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"></div>
                        <span className="text-xs font-bold">이력 데이터를 불러오는 중...</span>
                      </div>
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-4 text-disabled">
                        <div className="p-4 bg-surface-subtle rounded-2xl">
                          <Mail size={40} strokeWidth={1} />
                        </div>
                        <p className="text-sm font-bold">표시할 발송 이력이 없습니다.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  logs.map(log => (
                    <tr key={log.id} className="hover:bg-brand-primary/5 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2.5 text-xs font-bold text-secondary">
                          <Clock size={14} className="text-disabled" />
                          <div className="flex flex-col">
                            <span>{log.sentAt ? toDotDate(log.sentAt) : toDotDate(log.createdAt)}</span>
                            <span className="text-[10px] text-disabled font-medium">
                              {new Date(log.sentAt || log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-xs font-black text-primary uppercase tracking-tight">
                          {log.templateName || "-"}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-secondary">{log.recipientName || "-"}</span>
                          <span className="text-xs font-mono font-bold text-tertiary">{log.recipientEmail}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${
                          log.status === "sent" ? "bg-success/10 text-success border border-success/20" : 
                          log.status === "failed" ? "bg-error/10 text-error border border-error/20" : 
                          "bg-warning/10 text-warning border border-warning/20"
                        }`}>
                          {log.status === "sent" ? "SUCCESS" : log.status === "failed" ? "FAILED" : "PENDING"}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="p-2 text-secondary hover:bg-surface-subtle rounded-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30"
                          aria-label="상세 내역 보기"
                        >
                          <ChevronDown size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 상세 내역 드로어 */}
      {selectedLog && (
        <>
          <div
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setSelectedLog(null)}
            aria-hidden="true"
          />
          <div className="fixed right-0 top-0 bottom-0 w-full max-w-[480px] bg-surface border-l border-border shadow-xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border/50">
              <div className="flex items-center gap-3">
                <Mail size={20} className="text-brand-primary" />
                <h2 className="text-lg font-black text-primary">발송 상세 내역</h2>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-2 text-secondary hover:bg-surface-subtle rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-brand-primary/30"
                aria-label="닫기"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              {/* 발송 정보 */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-tertiary uppercase tracking-widest">발송 정보</h3>
                <div className="space-y-3 p-4 bg-surface-subtle rounded-xl">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-secondary">발송 일시</span>
                    <div className="text-right">
                      <div className="text-xs font-bold text-primary">
                        {selectedLog.sentAt ? toDotDate(selectedLog.sentAt) : toDotDate(selectedLog.createdAt)}
                      </div>
                      <div className="text-[10px] text-disabled">
                        {new Date(selectedLog.sentAt || selectedLog.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-secondary">템플릿</span>
                    <span className="text-xs font-bold text-primary uppercase">
                      {selectedLog.templateName || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-secondary">상태</span>
                    <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${
                      selectedLog.status === "sent" ? "bg-success/10 text-success" : 
                      selectedLog.status === "failed" ? "bg-error/10 text-error" : 
                      "bg-warning/10 text-warning"
                    }`}>
                      {selectedLog.status === "sent" ? "SUCCESS" : selectedLog.status === "failed" ? "FAILED" : "PENDING"}
                    </span>
                  </div>
                </div>
              </div>

              {/* 수신자 정보 */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-tertiary uppercase tracking-widest">수신자 정보</h3>
                <div className="space-y-3 p-4 bg-surface-subtle rounded-xl">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-secondary">수신자명</span>
                    <span className="text-xs font-bold text-primary">{selectedLog.recipientName || "-"}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-secondary">이메일</span>
                    <span className="text-xs font-mono font-bold text-tertiary break-all text-right">{selectedLog.recipientEmail}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-secondary">발신자</span>
                    <span className="text-xs font-mono font-bold text-tertiary break-all text-right">{selectedLog.senderEmail || "-"}</span>
                  </div>
                </div>
              </div>

              {/* 메시지 정보 */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-tertiary uppercase tracking-widest">메시지</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-secondary">제목</label>
                    <div className="mt-2 p-3 bg-surface-subtle rounded-lg text-xs font-bold text-primary break-words">
                      {selectedLog.subject || "-"}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-secondary">본문</label>
                    <div className="mt-2 p-3 bg-surface-subtle rounded-lg text-xs font-medium text-secondary whitespace-pre-wrap break-words max-h-[300px] overflow-y-auto">
                      {selectedLog.bodyRendered || "-"}
                    </div>
                  </div>
                </div>
              </div>

              {/* 오류 정보 */}
              {selectedLog.errorMessage && (
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-tertiary uppercase tracking-widest">오류 정보</h3>
                  <div className="p-3 bg-error/10 border border-error/20 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle size={16} className="text-error shrink-0 mt-0.5" />
                      <p className="text-xs font-bold text-error break-words">{selectedLog.errorMessage}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
