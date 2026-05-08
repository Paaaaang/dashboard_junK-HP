import { useEffect, useState } from "react";
import { Clock, Filter, AlertCircle, Info, ChevronLeft, ChevronRight, Mail } from "lucide-react";
import { PageHeader } from "../components";
import { useTemplateStore } from "../stores/useTemplateStore";
import { toDotDate } from "./companies/utils/companyUtils";

export function EmailLogsPage() {
  const { logs, isLoading, fetchLogs, templates, fetchTemplates } = useTemplateStore();
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterTemplate, setFilterTemplate] = useState<string>("ALL");
  const [page, setPage] = useState(0);
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
                  <th className="px-6 py-4 text-[10px] font-black text-tertiary uppercase tracking-widest border-b border-border/50">템플릿 / 작업</th>
                  <th className="px-6 py-4 text-[10px] font-black text-tertiary uppercase tracking-widest border-b border-border/50">수신자 정보</th>
                  <th className="px-6 py-4 text-[10px] font-black text-tertiary uppercase tracking-widest border-b border-border/50">상태</th>
                  <th className="px-6 py-4 text-[10px] font-black text-tertiary uppercase tracking-widest border-b border-border/50">오류 메시지</th>
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
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-primary uppercase tracking-tight">{log.templateName || "직접 발송"}</span>
                          {log.jobId && (
                            <span className="text-[9px] font-bold text-disabled truncate max-w-[120px]">JOB: {log.jobId}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="text-xs font-mono font-bold text-secondary">{log.recipientEmail}</span>
                          <span className="text-[10px] text-tertiary font-medium truncate max-w-[180px]">{log.subject}</span>
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
                        {log.errorMessage ? (
                          <div className="flex items-center gap-2 p-2 bg-error/5 border border-error/10 rounded-lg text-[10px] font-bold text-error max-w-[240px]">
                            <AlertCircle size={12} className="shrink-0" />
                            <span className="truncate">{log.errorMessage}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-disabled">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
