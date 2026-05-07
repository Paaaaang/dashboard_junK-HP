import { useState, type RefObject, type MouseEvent, type ChangeEvent } from "react";
import { 
  Filter, 
  Check, 
  Copy
} from "lucide-react";
import { EmptyState } from "../../components";
import { useToastStore } from "../../stores";
import type { 
  ParticipantRecord, 
  ParticipantEnrollment 
} from "../../types/models";
interface ParticipantsTableProps {
  paginatedParticipants: ParticipantRecord[];
  allFilteredSelected: boolean;
  toggleSelectAll: () => void;
  selectedIds: Set<string>;
  toggleSelect: (id: string, event?: MouseEvent | ChangeEvent) => void;
  openDrawer: (id: string) => void;
  selectAllRef: RefObject<HTMLInputElement>;
  navigate: (path: string) => void;
  filtersActive: boolean;
  resetFilters: () => void;
}

function calcCompletionSummary(enrollments: ParticipantEnrollment[]) {
  const total = enrollments.length;
  const completed = enrollments.filter((e) => e.status === "수료").length;
  return { total, completed };
}

export function ParticipantsTable({
  paginatedParticipants,
  allFilteredSelected,
  toggleSelectAll,
  selectedIds,
  toggleSelect,
  openDrawer,
  selectAllRef,
  navigate,
  filtersActive,
  resetFilters,
}: ParticipantsTableProps) {
  const { addToast } = useToastStore();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string, type: "phone" | "email") => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(`${id}-${type}`);
    addToast(`${type === "phone" ? "연락처" : "이메일"}가 복사되었습니다.`, "success");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <>
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-surface-subtle/50 text-tertiary font-black text-[11px] uppercase tracking-widest border-b border-border/30">
              <th className="px-5 py-5 w-[60px] text-center">
                <div className="flex justify-center">
                  <input
                    type="checkbox"
                    ref={selectAllRef}
                    className="w-5 h-5 rounded-lg border-2 border-border/50 text-brand-primary focus:ring-brand-primary/20 transition-all cursor-pointer accent-brand-primary"
                    checked={allFilteredSelected}
                    onChange={toggleSelectAll}
                    aria-label="전체 선택"
                  />
                </div>
              </th>
              <th className="px-5 py-5 min-w-[120px] text-center">이름</th>
              <th className="px-5 py-5 min-w-[160px] text-center">소속 기업</th>
              <th className="px-5 py-5 text-center">직위</th>
              <th className="px-5 py-5 text-center">연락처 / 이메일</th>
              <th className="px-5 py-5 min-w-[180px] text-center">참여 과정</th>
              <th className="px-5 py-5 text-center">수료 상태</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {paginatedParticipants.length === 0 ? (
              <EmptyState
                title={filtersActive ? "검색 결과가 없습니다" : "참여자가 없습니다"}
                description={filtersActive ? "필터를 조정하거나 다른 검색어를 입력해 보세요." : "새로운 참여자를 추가하여 관리를 시작하세요."}
                icon={Filter}
                action={filtersActive ? { label: "필터 초기화", onClick: resetFilters } : undefined}
              />
            ) : (
              paginatedParticipants.map((p) => {
                const summary = calcCompletionSummary(p.enrollments);
                return (
                  <tr 
                    key={p.id} 
                    className={`group transition-all cursor-pointer ${
                      selectedIds.has(p.id) 
                        ? "bg-brand-primary/5 hover:bg-brand-primary/10" 
                        : "hover:bg-surface-subtle"
                    }`}
                    onClick={() => openDrawer(p.id)}
                  >
                    <td className="px-5 py-5 text-center">
                      <div className="flex justify-center">
                        <input
                          type="checkbox"
                          className="w-5 h-5 rounded-lg border-2 border-border/50 text-brand-primary focus:ring-brand-primary/20 transition-all cursor-pointer accent-brand-primary"
                          checked={selectedIds.has(p.id)}
                          onChange={(e) => toggleSelect(p.id, e)}
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`${p.name} 선택`}
                        />
                      </div>
                    </td>
                    <td className="px-5 py-5 text-center">
                      <span className="text-[14.5px] font-black group-hover:text-brand-primary transition-colors block">
                        {p.name}
                      </span>
                    </td>
                    <td className="px-5 py-5 text-center">
                      {p.companyId ? (
                        <button
                          type="button"
                          className="text-[13px] text-info hover:text-info/80 font-bold transition-all relative z-10 hover:underline inline-block"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/companies?open=${p.companyId}`);
                          }}
                        >
                          {p.companyName || "-"}
                        </button>
                      ) : (
                        <span className="text-[13px] text-tertiary italic">미지정</span>
                      )}
                    </td>
                    <td className="px-5 py-5 text-[13px] font-medium text-secondary text-center">{p.position || "-"}</td>
                    <td className="px-5 py-5">
                      <div className="flex flex-col items-center gap-1">
                        <button 
                          type="button"
                          className="text-[12px] font-mono font-bold hover:text-brand-primary transition-colors flex items-center justify-center gap-1.5 group/copy w-fit"
                          onClick={(e) => { e.stopPropagation(); handleCopy(p.phone, p.id, "phone"); }}
                        >
                          {p.phone || "-"}
                          <span className="opacity-0 group-hover/copy:opacity-100 transition-opacity">
                            {copiedId === `${p.id}-phone` ? <Check size={10} className="text-success" strokeWidth={3} /> : <Copy size={10} className="text-tertiary" strokeWidth={2.5} />}
                          </span>
                        </button>
                        <button 
                          type="button"
                          className="text-[11px] font-medium text-tertiary truncate max-w-[150px] hover:text-brand-primary transition-colors flex items-center justify-center gap-1.5 group/copy w-fit"
                          onClick={(e) => { e.stopPropagation(); handleCopy(p.email, p.id, "email"); }}
                        >
                          {p.email || "-"}
                          <span className="opacity-0 group-hover/copy:opacity-100 transition-opacity">
                            {copiedId === `${p.id}-email` ? <Check size={10} className="text-success" strokeWidth={3} /> : <Copy size={10} className="text-tertiary" strokeWidth={2.5} />}
                          </span>
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-5">
                      <div className="flex flex-wrap gap-1.5 justify-center max-w-[220px] mx-auto">
                        {p.enrollments.slice(0, 2).map((e: ParticipantEnrollment, idx: number) => (
                          <span key={idx} className="px-2 py-1 bg-surface-subtle text-secondary rounded-lg text-[10px] font-black truncate max-w-[100px]">
                            {e.subCourseName}
                          </span>
                        ))}
                        {p.enrollments.length > 2 && (
                          <span className="px-2 py-1 bg-brand-primary/10 text-brand-primary rounded-lg text-[10px] font-black">
                            +{p.enrollments.length - 2}
                          </span>
                        )}
                        {p.enrollments.length === 0 && <span className="text-[11px] text-tertiary italic">미참여</span>}
                      </div>
                    </td>
                    <td className="px-5 py-5 text-center">
                      <div className="flex justify-center">
                        {p.enrollments.length > 0 ? (
                          <div className="flex flex-col items-center gap-1">
                            <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border transition-all ${
                              summary.completed === summary.total && summary.total > 0
                                ? "bg-success/10 text-success border-success/20"
                                : "bg-surface-subtle text-tertiary border-border/50"
                            }`}>
                              {summary.completed} / {summary.total} 수료
                            </span>
                          </div>
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-border" />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
