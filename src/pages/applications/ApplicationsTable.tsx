import { Check, X, Mail, Phone } from "lucide-react";
import type { ApplicationRecord } from "@/types/models";

interface ApplicationsTableProps {
  applications: ApplicationRecord[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  allSelected: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  isActionLoading: boolean;
  onRowClick?: (app: ApplicationRecord) => void;
}

export function ApplicationsTable({
  applications,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  allSelected,
  onApprove,
  onReject,
  isActionLoading,
  onRowClick,
}: ApplicationsTableProps) {
  if (applications.length === 0) {
    return (
      <div className="px-6 py-16 text-center border-2 border-dashed border-border/50 rounded-2xl bg-surface-subtle/10">
        <p className="text-sm font-semibold text-tertiary">신청 데이터가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-border/40 text-[11px] font-black text-tertiary uppercase tracking-widest bg-surface-subtle/50">
            <th className="py-4 px-5 w-12 text-center" onClick={(e) => e.stopPropagation()}>
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onToggleSelectAll}
                className="w-4 h-4 rounded border-border text-brand-primary focus:ring-brand-primary/20 cursor-pointer"
              />
            </th>
            <th className="py-4 px-4">신청일</th>
            <th className="py-4 px-4">성명</th>
            <th className="py-4 px-4">소속 기업</th>
            <th className="py-4 px-4">연락처 / 이메일</th>
            <th className="py-4 px-4">신청 과정</th>
            <th className="py-4 px-4 text-center">상태</th>
            <th className="py-4 px-4 text-center w-28">액션</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/20">
          {applications.map((app) => {
            const isPending = app.status === "PENDING";
            return (
              <tr 
                key={app.id}
                className="hover:bg-surface-subtle/30 transition-colors duration-150 group cursor-pointer"
                onClick={() => onRowClick?.(app)}
              >
                <td className="py-4 px-5 text-center" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(app.id)}
                    onChange={() => onToggleSelect(app.id)}
                    className="w-4 h-4 rounded border-border text-brand-primary focus:ring-brand-primary/20 cursor-pointer"
                  />
                </td>
                <td className="py-4 px-4 text-xs font-semibold text-secondary font-mono">
                  {new Date(app.createdAt).toLocaleDateString("ko-KR", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit"
                  })}
                </td>
                <td className="py-4 px-4">
                  <span className="text-sm font-bold text-primary">{app.name}</span>
                  {app.position && (
                    <span className="ml-1.5 text-xs font-semibold text-tertiary">
                      {app.position}
                    </span>
                  )}
                  {app.workExperience && (
                    <span className="ml-1.5 text-[10px] font-black text-brand-primary/80 bg-brand-primary/5 px-1.5 py-0.5 rounded tracking-wider">
                      {app.workExperience}
                    </span>
                  )}
                </td>
                <td className="py-4 px-4 text-sm font-bold text-secondary">
                  {app.companyName}
                </td>
                <td className="py-4 px-4">
                  <div className="flex flex-col gap-0.5 text-xs text-tertiary">
                    {app.phone && (
                      <div className="flex items-center gap-1">
                        <Phone size={10} className="text-disabled" />
                        <span className="font-mono font-bold">{app.phone}</span>
                      </div>
                    )}
                    {app.email && (
                      <div className="flex items-center gap-1">
                        <Mail size={10} className="text-disabled" />
                        <span className="font-medium">{app.email}</span>
                      </div>
                    )}
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-brand-primary uppercase tracking-wider">
                      {app.courseGroupName}
                    </span>
                    <span className="text-xs font-bold text-primary mt-0.5">
                      {app.subCourseName}
                    </span>
                  </div>
                </td>
                <td className="py-4 px-4 text-center">
                  <StatusBadge status={app.status} />
                </td>
                <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                  {isPending ? (
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onApprove(app.id)}
                        disabled={isActionLoading}
                        className="p-1.5 bg-success/10 text-success hover:bg-success/20 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                        title="승인"
                      >
                        <Check size={14} strokeWidth={2.5} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onReject(app.id)}
                        disabled={isActionLoading}
                        className="p-1.5 bg-error/10 text-error hover:bg-error/20 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                        title="반려"
                      >
                        <X size={14} strokeWidth={2.5} />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center text-[10px] font-bold text-disabled font-mono">
                      {app.processedAt ? new Date(app.processedAt).toLocaleDateString("ko-KR", {
                        month: "2-digit",
                        day: "2-digit"
                      }) + " 처리" : "-"}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }: { status: "PENDING" | "APPROVED" | "REJECTED" }) {
  const styles = {
    PENDING: "bg-warning/10 text-warning border-warning/20",
    APPROVED: "bg-success/10 text-success border-success/20",
    REJECTED: "bg-error/10 text-error border-error/20",
  };
  
  const labels = {
    PENDING: "대기중",
    APPROVED: "승인완료",
    REJECTED: "반려됨",
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-black border rounded-md uppercase tracking-wider ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
