import { useState, type Dispatch, type SetStateAction, type RefObject, type MouseEvent, type ChangeEvent } from "react";
import { 
  Search, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  X, 
  Settings2, 
  Check, 
  Copy
} from "lucide-react";
import { EmptyState } from "../../components";
import { useToastStore } from "../../stores";
import type { 
  ParticipantRecord, 
  ParticipantEnrollment, 
  CompletionFilter, 
  InsuranceFilter, 
  ParticipantTabKey 
} from "../../types/models";

interface ParticipantsTableProps {
  activeTab: ParticipantTabKey;
  setActiveTab: (tab: ParticipantTabKey) => void;
  completionFilter: CompletionFilter;
  setCompletionFilter: (f: CompletionFilter) => void;
  insuranceFilter: InsuranceFilter;
  setInsuranceFilter: (f: InsuranceFilter) => void;
  searchRaw: string;
  setSearchRaw: (s: string) => void;
  filtersActive: boolean;
  resetFilters: () => void;
  paginatedParticipants: ParticipantRecord[];
  allFilteredSelected: boolean;
  toggleSelectAll: () => void;
  selectedIds: Set<string>;
  toggleSelect: (id: string, event?: MouseEvent | ChangeEvent) => void;
  openDrawer: (id: string) => void;
  currentPage: number;
  totalPages: number;
  setCurrentPage: Dispatch<SetStateAction<number>>;
  selectAllRef: RefObject<HTMLInputElement>;
  navigate: (path: string) => void;
}

const TAB_ITEMS: Array<{ key: ParticipantTabKey; label: string }> = [
  { key: "ALL", label: "전체" },
  { key: "훈련비과정", label: "훈련비" },
  { key: "지원비과정", label: "지원비" },
  { key: "공유개방 세미나", label: "세미나" },
];

function calcCompletionSummary(enrollments: ParticipantEnrollment[]) {
  const total = enrollments.length;
  const completed = enrollments.filter((e) => e.status === "수료").length;
  return { total, completed };
}

export function ParticipantsTable({
  activeTab,
  setActiveTab,
  completionFilter,
  setCompletionFilter,
  insuranceFilter,
  setInsuranceFilter,
  searchRaw,
  setSearchRaw,
  filtersActive,
  resetFilters,
  paginatedParticipants,
  allFilteredSelected,
  toggleSelectAll,
  selectedIds,
  toggleSelect,
  openDrawer,
  currentPage,
  totalPages,
  setCurrentPage,
  selectAllRef,
  navigate,
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
    <div className="flex flex-col gap-6 mb-8">
      {/* Top Filter Bar */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center p-1 bg-surface border border-border rounded-2xl shadow-sm w-fit">
          <div className="flex items-center gap-1">
            {TAB_ITEMS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`px-5 py-2 text-sm font-bold rounded-xl transition-all duration-200 ${
                  activeTab === tab.key
                    ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20 scale-[1.02]"
                    : "text-secondary hover:text-primary hover:bg-surface-subtle"
                }`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="w-px h-4 bg-border mx-1 flex-shrink-0" />
          <button
            type="button"
            className="p-1.5 rounded-full text-tertiary hover:bg-surface-subtle hover:text-brand-primary transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
            onClick={() => navigate("/courses")}
            aria-label="과정 관리 페이지 이동"
            title="과정 관리 이동"
          >
            <Settings2 className="w-4 h-4" strokeWidth={2.5} size={18} />
          </button>
        </div>

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-tertiary group-focus-within:text-brand-primary transition-colors" strokeWidth={2.5} size={18} />
          <input
            type="text"
            placeholder="이름 또는 기업명 검색..."
            className="pl-11 pr-5 py-2.5 bg-surface border border-border rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all w-[320px] shadow-sm text-primary placeholder:text-tertiary font-medium"
            value={searchRaw}
            onChange={(e) => setSearchRaw(e.target.value)}
          />
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-surface border border-border rounded-[32px] shadow-soft overflow-hidden">
        {/* Inner Header Bar */}
        <div className="px-6 py-2.5 border-b border-border bg-surface-subtle/85 flex items-center justify-between flex-wrap gap-4">

          <p className="text-[11px] font-black text-tertiary uppercase tracking-widest mr-1 hidden sm:flex items-center gap-2">
            참가자 조회
            <span className="w-1 h-1 rounded-full bg-border" /> 
            <span className="text-brand-primary">{paginatedParticipants.length} 명</span>
          </p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="relative">
                <select 
                  className="px-4 pr-10 py-2 bg-surface border border-border rounded-xl text-[11px] font-black uppercase tracking-widest text-secondary shadow-sm cursor-pointer appearance-none min-w-[130px] focus:outline-none focus:ring-2 focus:ring-brand-primary/10"
                  value={completionFilter}
                  onChange={(e) => setCompletionFilter(e.target.value as CompletionFilter)}
                >
                  <option value="ALL">수료 상태: 전체</option>
                  <option value="수료">수료 완료</option>
                  <option value="미수료">미수료</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-tertiary pointer-events-none" strokeWidth={2.5} size={12} />
              </div>
              
              <div className="relative">
                <select 
                  className="px-4 pr-10 py-2 bg-surface border border-border rounded-xl text-[11px] font-black uppercase tracking-widest text-secondary shadow-sm cursor-pointer appearance-none min-w-[130px] focus:outline-none focus:ring-2 focus:ring-brand-primary/10"
                  value={insuranceFilter}
                  onChange={(e) => setInsuranceFilter(e.target.value as InsuranceFilter)}
                >
                  <option value="ALL">고용보험: 전체</option>
                  <option value="가입">가입</option>
                  <option value="미가입">미가입</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-tertiary pointer-events-none" strokeWidth={2.5} size={12} />
              </div>
            </div>

            {filtersActive && (
              <button 
                onClick={resetFilters}
                className="p-2 text-tertiary hover:text-error hover:bg-error/5 rounded-xl transition-all shadow-sm bg-surface border border-border flex items-center gap-1.5"
                title="필터 초기화"
              >
                <X size={16} strokeWidth={2.5} />
                <span className="text-[10px] font-black uppercase tracking-wider pr-1">Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-surface-subtle/85 text-tertiary font-black text-[11px] uppercase tracking-widest border-b border-border">
                <th className="px-5 py-4 w-[60px] text-center">
                  <div className="flex justify-center">
                    <input
                      type="checkbox"
                      ref={selectAllRef}
                      className="w-5 h-5 rounded-lg border-2 border-border text-brand-primary focus:ring-brand-primary/20 transition-all cursor-pointer accent-brand-primary"
                      checked={allFilteredSelected}
                      onChange={toggleSelectAll}
                      aria-label="전체 선택"
                    />
                  </div>
                </th>
                <th className="px-5 py-4 min-w-[120px] text-center">이름</th>
                <th className="px-5 py-4 min-w-[160px] text-center">소속 기업</th>
                <th className="px-5 py-4 text-center">직위</th>
                <th className="px-5 py-4 text-center">연락처 / 이메일</th>
                <th className="px-5 py-4 min-w-[180px] text-center">참여 과정</th>
                <th className="px-5 py-4 text-center">수료 상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {paginatedParticipants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-32">
                    <EmptyState
                      title={filtersActive ? "검색 결과가 없습니다" : "참여자가 없습니다"}
                      description={filtersActive ? "필터를 조정하거나 다른 검색어를 입력해 보세요." : "새로운 참여자를 추가하여 관리를 시작하세요."}
                      icon={Filter}
                      action={filtersActive ? { label: "필터 초기화", onClick: resetFilters } : undefined}
                    />
                  </td>
                </tr>
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
                      <td className="px-5 py-4 text-center">
                        <div className="flex justify-center">
                          <input
                            type="checkbox"
                            className="w-5 h-5 rounded-lg border-2 border-border text-brand-primary focus:ring-brand-primary/20 transition-all cursor-pointer accent-brand-primary"
                            checked={selectedIds.has(p.id)}
                            onChange={(e) => toggleSelect(p.id, e)}
                            onClick={(e) => e.stopPropagation()}
                            aria-label={`${p.name} 선택`}
                          />
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="text-[14.5px] font-black group-hover:text-brand-primary transition-colors block">
                          {p.name}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
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
                      <td className="px-5 py-4 text-[13px] font-medium text-secondary text-center">{p.position || "-"}</td>
                      <td className="px-5 py-4">
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
                      <td className="px-5 py-4">
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
                      <td className="px-5 py-4 text-center">
                        <div className="flex justify-center">
                          {p.enrollments.length > 0 ? (
                            <div className="flex flex-col items-center gap-1">
                              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border transition-all ${
                                summary.completed === summary.total && summary.total > 0
                                  ? "bg-success/10 text-success border-success/20"
                                  : "bg-surface-subtle text-tertiary border-border"
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

        {/* Pagination */}
        <nav className="p-6 border-t border-border bg-surface-subtle/85 flex items-center justify-between">
          <p className="text-[11px] font-black text-tertiary uppercase tracking-widest">
            참가자 <span>{paginatedParticipants.length}</span>/<span>{totalPages * 20}</span>명
          </p>
          <div className="flex items-center gap-1.5">
            <button
              className="p-2 rounded-xl border border-border bg-surface text-tertiary hover:bg-surface-subtle hover:text-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              <ChevronLeft size={18} strokeWidth={2.5} />
            </button>
            <div className="flex items-center px-4 gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  className={`w-9 h-9 rounded-xl text-sm font-black transition-all ${
                    currentPage === page
                      ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20"
                      : "text-tertiary hover:bg-surface-subtle hover:text-secondary"
                  }`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              className="p-2 rounded-xl border border-border bg-surface text-tertiary hover:bg-surface-subtle hover:text-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              <ChevronRight size={18} strokeWidth={2.5} />
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}
