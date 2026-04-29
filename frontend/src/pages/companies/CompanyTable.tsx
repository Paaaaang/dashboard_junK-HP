import { Search, ChevronUp, ChevronDown, ArrowUpDown } from "lucide-react";
import { EmptyState, StatusBadge, CourseTypeBadge } from "../../components";
import type { CompanyRecord, CompanyParticipation, CourseType } from "../../types/models";
import { TabKey, TAB_ITEMS } from "./hooks/useCompanyFilters";
import type { SortKey } from "./hooks/useCompanySort";

interface CompanyTableProps {
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
  tabItems: typeof TAB_ITEMS;
  searchText: string;
  onSearchChange: (text: string) => void;
  onOpenChoiceModal: () => void;
  paginatedCompanies: CompanyRecord[];
  allVisibleSelected: boolean;
  onToggleVisibleSelection: (checked: boolean) => void;
  selectedCompanyIds: Set<string>;
  onToggleCompanySelection: (id: string, event?: React.MouseEvent | React.ChangeEvent) => void;
  onOpenEditDrawer: (company: CompanyRecord) => void;
  draftCompanyId?: string;
  onToggleSort: (key: SortKey) => void;
  getSortIndicator: (key: SortKey) => string;
  onLocationEnter: (event: React.MouseEvent<HTMLTableCellElement>, location: string) => void;
  onParticipationEnter: (event: React.MouseEvent<HTMLTableCellElement>, participations: CompanyParticipation[]) => void;
  onTooltipLeave: () => void;
  selectAllRef: React.RefObject<HTMLInputElement>;
}

export function CompanyTable({
  activeTab,
  setActiveTab,
  tabItems,
  searchText,
  onSearchChange,
  onOpenChoiceModal,
  paginatedCompanies,
  allVisibleSelected,
  onToggleVisibleSelection,
  selectedCompanyIds,
  onToggleCompanySelection,
  onOpenEditDrawer,
  draftCompanyId,
  onToggleSort,
  getSortIndicator,
  onLocationEnter,
  onParticipationEnter,
  onTooltipLeave,
  selectAllRef,
}: CompanyTableProps) {
  
  const renderSortableHeader = (label: string, sortKey: SortKey) => {
    const indicator = getSortIndicator(sortKey);
    const isActive = indicator === "↑" || indicator === "↓";

    return (
      <button
        type="button"
        className="group flex items-center justify-center gap-1.5 w-full transition-colors hover:text-emerald-600 focus:outline-none"
        onClick={() => onToggleSort(sortKey)}
        aria-label={`${label} 정렬`}
      >
        <span className={`font-semibold text-xs uppercase tracking-wider ${isActive ? "text-emerald-600" : "text-slate-500"}`}>
          {label}
        </span>
        <span className="flex-shrink-0 transition-transform duration-200">
          {indicator === "↑" ? (
            <ChevronUp className="w-3.5 h-3.5 text-emerald-500" />
          ) : indicator === "↓" ? (
            <ChevronDown className="w-3.5 h-3.5 text-emerald-500" />
          ) : (
            <ArrowUpDown className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </span>
      </button>
    );
  };

  return (
    <section aria-label="기업 관리 화면" className="w-full space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Filter Tabs */}
        <div className="flex p-1 bg-white border border-slate-200 rounded-2xl shadow-soft w-fit">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar max-w-[500px]">
            {tabItems.map((tab) => (
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
        </div>

        {/* Search Field */}
        <label
          className="relative flex items-center bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all w-full max-w-sm group"
          htmlFor="company-search"
        >
          <Search className="w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors mr-2.5 flex-shrink-0" />
          <input
            id="company-search"
            className="bg-transparent border-none outline-none text-sm text-slate-700 placeholder:text-slate-400 w-full"
            value={searchText}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="기업명, 소재지, 담당자, 이메일 검색"
            aria-label="기업명 검색"
          />
        </label>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl shadow-soft overflow-hidden border border-slate-100 transition-all">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th scope="col" className="px-4 py-4 w-14 text-center">
                  <div className="flex justify-center">
                    <input
                      ref={selectAllRef}
                      type="checkbox"
                      className="w-4.5 h-4.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-500"
                      checked={allVisibleSelected}
                      onChange={(event) =>
                        onToggleVisibleSelection(event.target.checked)
                      }
                      aria-label="전체 선택"
                    />
                  </div>
                </th>
                <th scope="col" className="px-4 py-4">
                  {renderSortableHeader("기업명", "companyName")}
                </th>
                <th scope="col" className="px-4 py-4 hidden md:table-cell">
                  {renderSortableHeader("소재지", "location")}
                </th>
                <th scope="col" className="px-4 py-4 text-slate-500 font-semibold text-center uppercase tracking-wider text-[11px] hidden lg:table-cell">
                  대표자
                </th>
                <th scope="col" className="px-4 py-4">
                  {renderSortableHeader("협약상태", "mouSigned")}
                </th>
                <th scope="col" className="px-4 py-4">
                  {renderSortableHeader("참여 과정", "participationCount")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedCompanies.length === 0 ? (
                searchText ? (
                  <EmptyState
                    icon={Search}
                    title="검색 결과가 없습니다"
                    description="다른 검색어나 필터 조건을 시도해 보세요."
                  />
                ) : (
                  <EmptyState
                    icon={Search}
                    title="등록된 기업이 없습니다"
                    description="새로운 기업을 등록하거나 엑셀 파일을 업로드해 보세요."
                    action={{ label: "+ 기업 추가", onClick: onOpenChoiceModal }}
                  />
                )
              ) : paginatedCompanies.map((company) => {
                const activeParticipations = company.participations.filter(
                  (participation: CompanyParticipation) =>
                    participation.enabled &&
                    participation.programNames.length > 0,
                );
                const isSelected = selectedCompanyIds.has(company.id);
                const isDrawerOpen = draftCompanyId === company.id;

                return (
                  <tr
                    key={company.id}
                    className={`group transition-all cursor-pointer ${
                      isSelected 
                        ? "bg-emerald-50/60 hover:bg-emerald-50/80" 
                        : isDrawerOpen 
                          ? "bg-emerald-50/30 border-l-4 border-emerald-500" 
                          : "hover:bg-emerald-50/40"
                    }`}
                    onClick={() => onOpenEditDrawer(company)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") onOpenEditDrawer(company);
                    }}
                    tabIndex={0}
                  >
                    <td
                      className="px-4 py-4 text-center"
                      onClick={(event) => {
                        event.stopPropagation();
                        onToggleCompanySelection(company.id, event);
                      }}
                      onKeyDown={(event) => event.stopPropagation()}
                    >
                      <div className="flex justify-center">
                        <input
                          type="checkbox"
                          className="w-4.5 h-4.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-500"
                          checked={isSelected}
                          onChange={() => {}}
                          aria-label={`${company.companyName} 선택`}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className={`font-semibold text-slate-700 transition-colors ${isDrawerOpen ? "text-emerald-700" : "group-hover:text-emerald-700"}`}>
                          {company.companyName}
                        </span>
                        {company.businessRegNo && (
                          <span className="text-[10px] text-slate-400 font-mono tracking-tight bg-slate-50 px-1.5 rounded">
                            {company.businessRegNo}
                          </span>
                        )}
                      </div>
                    </td>

                    <td
                      className="px-4 py-4 text-center hidden md:table-cell"
                      onMouseEnter={(event) =>
                        onLocationEnter(event, company.location)
                      }
                      onMouseLeave={onTooltipLeave}
                    >
                      <span className="inline-block max-w-[150px] truncate text-slate-600 text-xs">
                        {company.location}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-center text-slate-600 text-xs hidden lg:table-cell">
                      {company.representative}
                    </td>

                    <td className="px-4 py-4 text-center">
                      <StatusBadge
                        status={company.mouSigned ? "success" : "neutral"}
                        label={company.mouSigned ? "체결" : "미체결"}
                        compact
                      />
                    </td>

                    <td
                      className="px-4 py-4 text-center"
                      onMouseEnter={(event) =>
                        onParticipationEnter(event, activeParticipations)
                      }
                      onMouseLeave={onTooltipLeave}
                    >
                      <div className="flex flex-wrap gap-1.5 justify-center max-w-[200px] mx-auto">
                        {activeParticipations.length === 0 ? (
                          <span className="text-slate-300 text-xs">-</span>
                        ) : (
                          activeParticipations.map((p: CompanyParticipation) => (
                            <CourseTypeBadge 
                              key={p.courseType} 
                              type={p.courseType as CourseType} 
                            />
                          ))
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
