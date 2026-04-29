import { useState, useMemo } from "react";
import type { ParticipantRecord, CourseType, ParticipantEnrollment } from "../../../types/models";
import { useDebounce } from "../../../hooks/useDebounce";

export type ParticipantTabKey = "ALL" | CourseType;
export type InsuranceFilter = "ALL" | "가입" | "미가입";
export type CompletionFilter = "ALL" | "수료" | "미수료";

export interface ParticipantFilters {
  activeTab: ParticipantTabKey;
  completionFilter: CompletionFilter;
  insuranceFilter: InsuranceFilter;
  searchRaw: string;
}

function calcCompletionSummary(enrollments: ParticipantEnrollment[]) {
  const total = enrollments.length;
  const completed = enrollments.filter((e) => e.status === "수료").length;
  return { total, completed };
}

export function useParticipantFilters(participants: ParticipantRecord[]) {
  const [activeTab, setActiveTab] = useState<ParticipantTabKey>("ALL");
  const [completionFilter, setCompletionFilter] = useState<CompletionFilter>("ALL");
  const [insuranceFilter, setInsuranceFilter] = useState<InsuranceFilter>("ALL");
  const [searchRaw, setSearchRaw] = useState("");
  const searchDebounced = useDebounce(searchRaw, 300);

  const filtered = useMemo(() => {
    let list = [...participants];

    // 1. 기본 정렬 (이름 가나다순)
    list.sort((a, b) => a.name.localeCompare(b.name, "ko"));

    // 2. 탭 필터
    if (activeTab !== "ALL") {
      list = list.filter((p) => p.enrollments.some((e) => e.courseType === activeTab));
    }

    // 3. 수료 상태 필터
    if (completionFilter !== "ALL") {
      list = list.filter((p) => {
        const { completed, total } = calcCompletionSummary(p.enrollments);
        if (completionFilter === "수료") return total > 0 && completed === total;
        return total === 0 || completed < total;
      });
    }

    // 4. 고용보험 필터
    if (insuranceFilter !== "ALL") {
      list = list.filter((p) => p.employmentInsurance === insuranceFilter);
    }

    // 5. 검색어 필터
    if (searchDebounced.trim()) {
      const q = searchDebounced.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.companyName.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) ||
          p.phone.toLowerCase().includes(q)
      );
    }

    return list;
  }, [participants, activeTab, completionFilter, insuranceFilter, searchDebounced]);

  const filtersActive =
    activeTab !== "ALL" ||
    completionFilter !== "ALL" ||
    insuranceFilter !== "ALL" ||
    searchRaw.trim() !== "";

  const resetFilters = () => {
    setActiveTab("ALL");
    setCompletionFilter("ALL");
    setInsuranceFilter("ALL");
    setSearchRaw("");
  };

  return {
    activeTab,
    setActiveTab,
    completionFilter,
    setCompletionFilter,
    insuranceFilter,
    setInsuranceFilter,
    searchRaw,
    setSearchRaw,
    searchDebounced,
    filtered,
    filtersActive,
    resetFilters,
  };
}
