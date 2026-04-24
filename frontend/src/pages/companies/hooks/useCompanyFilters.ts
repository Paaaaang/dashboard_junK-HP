import { useState } from "react";
import { useDebounce } from "../../../hooks/useDebounce";
import type { CompanyRecord } from "../../../types/models";

export type TabKey = "ALL" | "TRAINING" | "SUPPORT" | "SEMINAR";

export const TAB_ITEMS: Array<{ key: TabKey; label: string }> = [
  { key: "ALL", label: "전체" },
  { key: "TRAINING", label: "훈련비" },
  { key: "SUPPORT", label: "지원비" },
  { key: "SEMINAR", label: "세미나" },
];

export function useCompanyFilters() {
  const [activeTab, setActiveTab] = useState<TabKey>("ALL");
  const [searchRaw, setSearchRaw] = useState("");
  const searchDebounced = useDebounce(searchRaw, 300);

  const filterCompanies = (companies: CompanyRecord[], tabTargetGroupName: string | null) => {
    const normalizedSearch = searchDebounced.trim().toLowerCase();

    const searched = companies.filter((company) => {
      if (!normalizedSearch) return true;
      return (
        company.companyName.toLowerCase().includes(normalizedSearch) ||
        company.location.toLowerCase().includes(normalizedSearch) ||
        company.manager.toLowerCase().includes(normalizedSearch) ||
        company.email.toLowerCase().includes(normalizedSearch)
      );
    });

    const tabFiltered =
      activeTab === "ALL" || !tabTargetGroupName
        ? searched
        : searched.filter((company) =>
            company.participations.some(
              (participation) =>
                participation.courseType === tabTargetGroupName &&
                participation.enabled &&
                participation.programNames.length > 0,
            ),
          );

    return tabFiltered;
  };

  return {
    activeTab,
    setActiveTab,
    searchRaw,
    setSearchRaw,
    searchDebounced,
    filterCompanies,
  };
}
