import React from "react";
import { Search, Plus, X, Filter, ChevronRight, ChevronLeft, Settings2 } from "lucide-react";
import { EmptyState } from "../../components";
import type { ParticipantRecord, ParticipantEnrollment } from "../../types/models";
import { ParticipantTabKey, CompletionFilter, InsuranceFilter } from "./hooks/useParticipantFilters";

interface ParticipantsTableProps {
  activeTab: ParticipantTabKey;
  setActiveTab: (tab: ParticipantTabKey) => void;
  completionFilter: CompletionFilter;
  setCompletionFilter: (filter: CompletionFilter) => void;
  insuranceFilter: InsuranceFilter;
  setInsuranceFilter: (filter: InsuranceFilter) => void;
  searchRaw: string;
  setSearchRaw: (val: string) => void;
  filtersActive: boolean;
  resetFilters: () => void;
  onOpenCourseManager: () => void;
  onShowAddModal: () => void;
  paginatedParticipants: ParticipantRecord[];
  allFilteredSelected: boolean;
  toggleSelectAll: () => void;
  selectedIds: Set<string>;
  toggleSelect: (id: string, event?: React.MouseEvent) => void;
  openDrawer: (id: string) => void;
  currentPage: number;
  totalPages: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  selectAllRef: React.RefObject<HTMLInputElement>;
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

function completionVariant(completed: number, total: number) {
  if (total === 0) return "gray";
  if (completed === total) return "green";
  return "default";
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
  onOpenCourseManager,
  onShowAddModal,
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
  return (
    <div className="flex flex-col gap-6 mb-8">
      {/* Filters & Action Bar */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center p-1 bg-white border border-slate-200 rounded-2xl shadow-soft w-fit">
          <div className="flex items-center gap-1">
            {TAB_ITEMS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`px-5 py-2 text-sm font-semibold rounded-xl transition-all duration-200 ${
                  activeTab === tab.key
                    ? "bg-emerald-500 text-white shadow-soft scale-[1.02]"
                    : "text-slate-500 hover:text-emerald-600 hover:bg-emerald-50/50"
                }`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="w-px h-4 bg-slate-200 mx-1 flex-shrink-0" />
          <button
            type="button"
            className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100 hover:text-emerald-500 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            onClick={onOpenCourseManager}
            aria-label="과정 관리 팝업 열기"
          >
            <Settings2 className="w-4 h-4" />
          </button>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 text-white rounded-xl font-bold shadow-soft hover:bg-emerald-600 transition-all hover:scale-[1.02] active:scale-[0.98]"
          onClick={onShowAddModal}
        >
          <Plus size={18} strokeWidth={2.5} />
          <span>참여자 추가</span>
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[320px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="search"
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm placeholder:text-slate-400"
            placeholder="이름, 기업명, 이메일, 연락처 검색"
            value={searchRaw}
            onChange={(e) => setSearchRaw(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              className="pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm cursor-pointer appearance-none min-w-[140px]"
              value={completionFilter}
              onChange={(e) => setCompletionFilter(e.target.value as CompletionFilter)}
            >
              <option value="ALL">수료 상태</option>
              <option value="수료">수료 완료</option>
              <option value="미수료">미수료</option>
            </select>
            <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
              <ChevronRight className="rotate-90 text-slate-400" size={14} />
            </div>
          </div>

          <div className="relative">
            <select
              className="pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm cursor-pointer appearance-none min-w-[130px]"
              value={insuranceFilter}
              onChange={(e) => setInsuranceFilter(e.target.value as InsuranceFilter)}
            >
              <option value="ALL">고용보험</option>
              <option value="가입">보험 가입</option>
              <option value="미가입">미가입</option>
            </select>
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
              <ChevronRight className="rotate-90 text-slate-400" size={14} />
            </div>
          </div>

          {filtersActive && (
            <button
              type="button"
              className="flex items-center gap-1.5 px-4 py-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all text-sm font-medium"
              onClick={resetFilters}
            >
              <X size={16} />
              <span>초기화</span>
            </button>
          )}
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th scope="col" className="px-5 py-4 w-12 text-center">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer transition-colors"
                    aria-label="전체 선택"
                  />
                </th>
                <th scope="col" className="px-4 py-4 text-left text-[13px] font-semibold text-slate-500 tracking-tight">이름</th>
                <th scope="col" className="px-4 py-4 text-left text-[13px] font-semibold text-slate-500 tracking-tight">소속 기업</th>
                <th scope="col" className="px-4 py-4 text-left text-[13px] font-semibold text-slate-500 tracking-tight hidden sm:table-cell">직위</th>
                <th scope="col" className="px-4 py-4 text-left text-[13px] font-semibold text-slate-500 tracking-tight hidden md:table-cell">연락처</th>
                <th scope="col" className="px-4 py-4 text-left text-[13px] font-semibold text-slate-500 tracking-tight hidden xl:table-cell">이메일</th>
                <th scope="col" className="px-4 py-4 text-left text-[13px] font-semibold text-slate-500 tracking-tight">수료 현황</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedParticipants.length === 0 ? (
                <EmptyState
                  icon={Search}
                  title={filtersActive ? "검색 결과가 없습니다" : "등록된 참여자가 없습니다"}
                  description={filtersActive ? "다른 검색어나 필터 조건을 시도해 보세요." : "새로운 참여자를 추가해 보세요."}
                  action={!filtersActive ? { label: "참여자 추가", onClick: onShowAddModal } : undefined}
                />
              ) : (
                paginatedParticipants.map((p) => {
                  const { completed, total } = calcCompletionSummary(p.enrollments);
                  const variant = completionVariant(completed, total);
                  const isSelected = selectedIds.has(p.id);
                  return (
                    <tr
                      key={p.id}
                      className={`group transition-colors cursor-pointer hover:bg-emerald-50/40 ${
                        isSelected ? "bg-emerald-50/60" : ""
                      }`}
                      onClick={() => openDrawer(p.id)}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") openDrawer(p.id);
                      }}
                    >
                      <td
                        className="px-5 py-5 text-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelect(p.id, e);
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer transition-colors"
                          aria-label={`${p.name} 선택`}
                        />
                      </td>
                      <td className="px-4 py-5">
                        <span className="text-sm font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
                          {p.name}
                        </span>
                      </td>
                      <td className="px-4 py-5">
                        {p.companyId ? (
                          <button
                            type="button"
                            className="text-emerald-600 font-medium text-[13px] hover:text-emerald-700 hover:underline transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/companies?open=${p.companyId}`);
                            }}
                          >
                            {p.companyName}
                          </button>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-5 hidden sm:table-cell">
                        <span className="text-sm text-slate-500">{p.position || "—"}</span>
                      </td>
                      <td className="px-4 py-5 hidden md:table-cell">
                        <span className="text-[13px] text-slate-500 font-mono tracking-tight">
                          {p.phone || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-5 hidden xl:table-cell">
                        <span className="text-[13px] text-slate-400 italic font-medium">
                          {p.email || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-5">
                        <div className="flex flex-col gap-1.5 min-w-[100px]">
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span className={variant === "green" ? "text-emerald-600" : "text-slate-500"}>
                              {completed}/{total}
                            </span>
                            <span className="text-slate-400 font-medium">
                              {total > 0 ? Math.round((completed / total) * 100) : 0}%
                            </span>
                          </div>
                          <div className="h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                            <div
                              className={`h-full transition-all duration-700 ease-out ${
                                variant === "green" ? "bg-emerald-500" : "bg-slate-300"
                              }`}
                              style={{ width: total > 0 ? `${(completed / total) * 100}%` : "0%" }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <nav aria-label="페이지 네비게이션" className="flex justify-center items-center gap-2 mt-10">
          <button
            type="button"
            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 disabled:opacity-30 disabled:hover:bg-transparent rounded-xl transition-all"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            <ChevronLeft size={22} />
          </button>
          <div className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <span className="text-sm font-bold text-emerald-600">{currentPage}</span>
            <span className="text-slate-300 font-light text-lg mx-1">/</span>
            <span className="text-sm font-medium text-slate-500">{totalPages}</span>
          </div>
          <button
            type="button"
            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 disabled:opacity-30 disabled:hover:bg-transparent rounded-xl transition-all"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            <ChevronRight size={22} />
          </button>
        </nav>
      )}
    </div>
  );
}
