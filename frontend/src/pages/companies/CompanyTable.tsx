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
  
  const renderSortableHeader = (label: string, sortKey: SortKey, align: "left" | "center" = "center") => {
    const indicator = getSortIndicator(sortKey);
    const isActive = indicator === "↑" || indicator === "↓";

    return (
      <button
        type="button"
        className={`group flex items-center gap-1.5 w-full transition-colors hover:text-brand-primary focus:outline-none ${align === "center" ? "justify-center" : "justify-start"}`}
        onClick={() => onToggleSort(sortKey)}
        aria-label={`${label} 정렬`}
      >
        <span className={`font-black text-[11px] uppercase tracking-widest ${isActive ? "text-brand-primary" : "text-tertiary"}`}>
          {label}
        </span>
        <span className="flex-shrink-0 transition-transform duration-200">
          {indicator === "↑" ? (
            <ChevronUp className="w-3.5 h-3.5 text-brand-primary" strokeWidth={2.5} />
          ) : indicator === "↓" ? (
            <ChevronDown className="w-3.5 h-3.5 text-brand-primary" strokeWidth={2.5} />
          ) : (
            <ArrowUpDown className="w-3 h-3 text-tertiary/30 group-hover:opacity-100 transition-opacity" strokeWidth={2.5} />
          )}
        </span>
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-6 mb-8">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center p-1 bg-surface border border-border rounded-2xl shadow-sm w-fit">
          <div className="flex items-center gap-1">
            {tabItems.map((tab) => (
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
        </div>

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-tertiary group-focus-within:text-brand-primary transition-colors" strokeWidth={2.5} size={18} />
          <input
            type="text"
            placeholder="기업명, 소재지, 담당자 검색..."
            className="pl-11 pr-5 py-2.5 bg-surface border border-border rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all w-[320px] shadow-sm text-primary placeholder:text-tertiary font-medium"
            value={searchText}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-surface rounded-[32px] shadow-soft overflow-hidden border border-border transition-all">
        {/* Inner Header Bar */}
        <div className="px-6 py-2.5 border-b border-border bg-surface-subtle/85 flex items-center justify-between flex-wrap gap-4">
          <p className="text-[11px] font-black text-tertiary uppercase tracking-widest ml-1 flex items-center gap-2">
            Company Directory 
            <span className="w-1 h-1 rounded-full bg-border" /> 
            <span className="text-brand-primary">{paginatedCompanies.length} Listings</span>
          </p>
        </div>
        
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full border-collapse text-left text-sm min-w-[900px]">
            <thead>
              <tr className="bg-surface-subtle/85 text-tertiary font-black text-[11px] uppercase tracking-widest border-b border-border">
                <th scope="col" className="px-5 py-4 w-[60px] text-center">
                  <div className="flex justify-center">
                    <input
                      ref={selectAllRef}
                      type="checkbox"
                      className="w-5 h-5 rounded-lg border-2 border-border text-brand-primary focus:ring-brand-primary/20 transition-all cursor-pointer accent-brand-primary"
                      checked={allVisibleSelected}
                      onChange={(event) =>
                        onToggleVisibleSelection(event.target.checked)
                      }
                      aria-label="전체 선택"
                    />
                  </div>
                </th>
                <th scope="col" className="px-5 py-4 text-center">
                  {renderSortableHeader("기업명", "companyName", "center")}
                </th>
                <th scope="col" className="px-5 py-4 hidden md:table-cell text-center">
                  {renderSortableHeader("소재지", "location", "center")}
                </th>
                <th scope="col" className="px-5 py-4 text-center hidden lg:table-cell">
                  대표자
                </th>
                <th scope="col" className="px-5 py-4 text-center">
                  {renderSortableHeader("협약상태", "mouSigned")}
                </th>
                <th scope="col" className="px-5 py-4 text-center">
                  {renderSortableHeader("참여 과정", "participationCount")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {paginatedCompanies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-32">
                    <EmptyState
                      icon={Search}
                      title={searchText ? "검색 결과가 없습니다" : "등록된 기업이 없습니다"}
                      description={searchText ? "다른 검색어나 필터 조건을 시도해 보세요." : "새로운 기업을 등록하거나 엑셀 파일을 업로드해 보세요."}
                      action={!searchText ? { label: "+ 기업 추가", onClick: onOpenChoiceModal } : undefined}
                    />
                  </td>
                </tr>
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
                        ? "bg-brand-primary/5 hover:bg-brand-primary/10" 
                        : isDrawerOpen 
                          ? "bg-brand-primary/5 border-l-4 border-brand-primary" 
                          : "hover:bg-surface-subtle"
                    }`}
                    onClick={() => onOpenEditDrawer(company)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") onOpenEditDrawer(company);
                    }}
                    tabIndex={0}
                  >
                    <td className="px-5 py-4 text-center">
                      <div className="flex justify-center">
                        <input
                          type="checkbox"
                          className="w-5 h-5 rounded-lg border-2 border-border text-brand-primary focus:ring-brand-primary/20 transition-all cursor-pointer accent-brand-primary"
                          checked={isSelected}
                          onChange={(e) => onToggleCompanySelection(company.id, e)}
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`${company.companyName} 선택`}
                        />
                      </div>
                    </td>

                    <td className="px-5 py-4 text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className={`font-black text-[14.5px] transition-colors ${isDrawerOpen ? "text-brand-primary" : "group-hover:text-brand-primary"}`}>
                          {company.companyName}
                        </span>
                        {company.businessRegNo && (
                          <span className="text-[10px] text-tertiary font-mono tracking-tight bg-background px-1.5 py-0.5 rounded-md font-bold">
                            {company.businessRegNo}
                          </span>
                        )}
                      </div>
                    </td>

                    <td
                      className="px-5 py-4 text-center hidden md:table-cell"
                      onMouseEnter={(event) =>
                        onLocationEnter(event, company.location)
                      }
                      onMouseLeave={onTooltipLeave}
                    >
                      <span className="inline-block max-w-[180px] truncate text-secondary text-[13px] font-medium">
                        {company.location}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-center text-secondary text-[13px] font-medium hidden lg:table-cell">
                      {company.representative}
                    </td>

                    <td className="px-5 py-4 text-center">
                      <StatusBadge
                        status={company.mouSigned ? "success" : "neutral"}
                        label={company.mouSigned ? "체결" : "미체결"}
                        compact
                      />
                    </td>

                    <td
                      className="px-5 py-4 text-center"
                      onMouseEnter={(event) =>
                        onParticipationEnter(event, activeParticipations)
                      }
                      onMouseLeave={onTooltipLeave}
                    >
                      <div className="flex flex-wrap gap-1.5 justify-center max-w-[200px] mx-auto">
                        {activeParticipations.length === 0 ? (
                          <span className="text-tertiary text-xs italic">미참여</span>
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
    </div>
  );
}
