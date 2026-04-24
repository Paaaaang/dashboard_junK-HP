import { Search, Settings2 } from "lucide-react";
import { EmptyState } from "../../components/EmptyState";
import { StatusBadge } from "../../components/StatusBadge";
import type { CompanyRecord, CompanyParticipation } from "../../types/models";
import type { TabKey, TAB_ITEMS } from "./hooks/useCompanyFilters";
import type { SortKey } from "./hooks/useCompanySort";

interface CompanyTableProps {
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
  tabItems: typeof TAB_ITEMS;
  searchText: string;
  onSearchChange: (text: string) => void;
  onOpenCourseManager: () => void;
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
  getSortIndicatorClass: (key: SortKey) => string;
  getCourseTypeTagStyle: (courseType: string) => React.CSSProperties;
  getCourseTypeTagLabel: (courseType: string) => string;
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
  onOpenCourseManager,
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
  getSortIndicatorClass,
  getCourseTypeTagStyle,
  getCourseTypeTagLabel,
  onLocationEnter,
  onParticipationEnter,
  onTooltipLeave,
  selectAllRef,
}: CompanyTableProps) {
  
  const renderSortableHeader = (label: string, sortKey: SortKey) => {
    return (
      <button
        type="button"
        className="table-sort-button"
        onClick={() => onToggleSort(sortKey)}
        aria-label={`${label} 정렬`}
      >
        <span>{label}</span>
        <span className={getSortIndicatorClass(sortKey)}>
          {getSortIndicator(sortKey)}
        </span>
      </button>
    );
  };

  return (
    <section aria-label="기업 관리 화면">
      <div className="filter-row company-filter-row">
        <div className="course-filter-shell">
          <div className="course-filter-pills">
            {tabItems.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`course-pill${activeTab === tab.key ? " active" : ""}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="course-edit-button"
            onClick={onOpenCourseManager}
            aria-label="과정 관리 팝업 열기"
          >
            <Settings2 className="icon-sm" />
          </button>
        </div>

        <label
          className="search-field company-search"
          htmlFor="company-search"
        >
          <Search className="icon-sm" />
          <input
            id="company-search"
            value={searchText}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="기업명, 소재지, 담당자, 이메일 검색"
            aria-label="기업명 검색"
          />
        </label>
      </div>

      <div className="table-wrap">
        <table className="data-table company-table">
          <thead>
            <tr>
              <th scope="col" className="company-select-col">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={(event) =>
                    onToggleVisibleSelection(event.target.checked)
                  }
                  aria-label="전체 선택"
                />
              </th>
              <th scope="col">
                {renderSortableHeader("기업명", "companyName")}
              </th>
              <th scope="col" className="col-location">
                {renderSortableHeader("소재지", "location")}
              </th>
              <th scope="col" className="col-representative">대표자</th>
              <th scope="col">
                {renderSortableHeader("협약상태", "mouSigned")}
              </th>
              <th scope="col">
                {renderSortableHeader("참여 과정", "participationCount")}
              </th>
            </tr>
          </thead>
          <tbody>
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
                  className={`row-clickable${isSelected ? " row-selected" : ""}${isDrawerOpen ? " row-active" : ""}`}
                  style={isDrawerOpen ? { borderLeft: "3px solid var(--color-primary)" } : {}}
                  onClick={() => onOpenEditDrawer(company)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") onOpenEditDrawer(company);
                  }}
                  tabIndex={0}
                >
                  <td
                    className="company-select-col"
                    onClick={(event) => {
                      event.stopPropagation();
                      onToggleCompanySelection(company.id, event);
                    }}
                    onKeyDown={(event) => event.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      aria-label={`${company.companyName} 선택`}
                    />
                  </td>

                  <td>
                    <div className="company-name-cell">
                      <span className="company-name-text">
                        {company.companyName}
                      </span>
                      {company.businessRegNo && (
                        <span className="company-reg-no">
                          {company.businessRegNo}
                        </span>
                      )}
                    </div>
                  </td>

                  <td
                    className="col-location"
                    onMouseEnter={(event) =>
                      onLocationEnter(event, company.location)
                    }
                    onMouseLeave={onTooltipLeave}
                  >
                    <span className="location-text">{company.location}</span>
                  </td>

                  <td className="col-representative">{company.representative}</td>

                  <td>
                    <StatusBadge
                      status={company.mouSigned ? "success" : "neutral"}
                      label={company.mouSigned ? "체결" : "미체결"}
                      compact
                    />
                  </td>

                  <td
                    onMouseEnter={(event) =>
                      onParticipationEnter(event, activeParticipations)
                    }
                    onMouseLeave={onTooltipLeave}
                  >
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "center" }}>
                      {activeParticipations.length === 0 ? (
                        <span style={{ color: "var(--color-text-tertiary)", fontSize: 12 }}>-</span>
                      ) : (
                        activeParticipations.map((p: CompanyParticipation) => {
                          const tagStyle = getCourseTypeTagStyle(p.courseType);
                          const tagLabel = getCourseTypeTagLabel(p.courseType);
                          return (
                            <span
                              key={p.courseType}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                borderRadius: "999px",
                                padding: "2px 8px",
                                fontSize: 11,
                                fontWeight: 600,
                                whiteSpace: "nowrap",
                                ...tagStyle,
                              }}
                              title={p.programNames.join(", ")}
                            >
                              {tagLabel}
                            </span>
                          );
                        })
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
