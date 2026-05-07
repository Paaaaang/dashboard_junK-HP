import { Search, ChevronUp, ChevronDown, ArrowUpDown } from "lucide-react";
import { EmptyState, StatusBadge, CourseTypeBadge } from "../../components";
import type { CompanyRecord, CompanyParticipation, CourseType } from "../../types/models";
import type { SortKey } from "./hooks/useCompanySort";

interface CompanyTableProps {
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
  onOpenChoiceModal: () => void;
  searchText: string;
}

export function CompanyTable({
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
  onOpenChoiceModal,
  searchText,
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
    <>
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full border-collapse text-left text-sm min-w-[900px]">
          <thead>
            <tr className="bg-surface-subtle/50 text-tertiary font-black text-[11px] uppercase tracking-widest border-b border-border/30">
              <th scope="col" className="px-5 py-5 w-[60px] text-center">
                <div className="flex justify-center">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    className="w-5 h-5 rounded-lg border-2 border-border/50 text-brand-primary focus:ring-brand-primary/20 transition-all cursor-pointer accent-brand-primary"
                    checked={allVisibleSelected}
                    onChange={(event) =>
                      onToggleVisibleSelection(event.target.checked)
                    }
                    aria-label="전체 선택"
                  />
                </div>
              </th>
              <th scope="col" className="px-5 py-5 text-center">
                {renderSortableHeader("기업명", "companyName", "center")}
              </th>
              <th scope="col" className="px-5 py-5 hidden md:table-cell text-center">
                {renderSortableHeader("소재지", "location", "center")}
              </th>
              <th scope="col" className="px-5 py-5 text-center hidden lg:table-cell">
                대표자
              </th>
              <th scope="col" className="px-5 py-5 text-center">
                {renderSortableHeader("협약상태", "mouSigned")}
              </th>
              <th scope="col" className="px-5 py-5 text-center">
                {renderSortableHeader("참여 과정", "participationCount")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {paginatedCompanies.length === 0 ? (
              <EmptyState
                icon={Search}
                title={searchText ? "검색 결과가 없습니다" : "등록된 기업이 없습니다"}
                description={searchText ? "다른 검색어나 필터 조건을 시도해 보세요." : "새로운 기업을 등록하거나 엑셀 파일을 업로드해 보세요."}
                action={!searchText ? { label: "+ 기업 추가", onClick: onOpenChoiceModal } : undefined}
              />
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
                  <td className="px-5 py-5 text-center">
                    <div className="flex justify-center">
                      <input
                        type="checkbox"
                        className="w-5 h-5 rounded-lg border-2 border-border/50 text-brand-primary focus:ring-brand-primary/20 transition-all cursor-pointer accent-brand-primary"
                        checked={isSelected}
                        onChange={(e) => onToggleCompanySelection(company.id, e)}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`${company.companyName} 선택`}
                      />
                    </div>
                  </td>

                  <td className="px-5 py-5 text-center">
                    <div className="flex flex-col items-center gap-0.5">
                      <span className={`font-black text-[14.5px] transition-colors ${isDrawerOpen ? "text-brand-primary" : "group-hover:text-brand-primary"}`}>
                        {company.companyName}
                      </span>
                      {company.businessRegNo && (
                        <span className="text-[10px] text-tertiary font-mono tracking-tight bg-surface-subtle px-1.5 py-0.5 rounded-md font-bold">
                          {company.businessRegNo}
                        </span>
                      )}
                    </div>
                  </td>

                  <td
                    className="px-5 py-5 text-center hidden md:table-cell"
                    onMouseEnter={(event) =>
                      onLocationEnter(event, company.location)
                    }
                    onMouseLeave={onTooltipLeave}
                  >
                    <span className="inline-block max-w-[180px] truncate text-secondary text-[13px] font-medium">
                      {company.location}
                    </span>
                  </td>

                  <td className="px-5 py-5 text-center text-secondary text-[13px] font-medium hidden lg:table-cell">
                    {company.representative}
                  </td>

                  <td className="px-5 py-5 text-center">
                    <StatusBadge
                      status={company.mouSigned ? "success" : "neutral"}
                      label={company.mouSigned ? "체결" : "미체결"}
                      compact
                    />
                  </td>

                  <td
                    className="px-5 py-5 text-center"
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
    </>
  );
}
