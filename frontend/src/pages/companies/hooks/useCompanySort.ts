import { useState } from "react";
import type { CompanyRecord } from "../../../types/models";

export type SortKey = "companyName" | "location" | "mouSigned" | "participationCount";
export type SortDirection = "asc" | "desc";

export interface SortState {
  key: SortKey | null;
  direction: SortDirection | null;
}

export function useCompanySort() {
  const [sortState, setSortState] = useState<SortState>({
    key: null,
    direction: null,
  });

  const toggleSort = (key: SortKey) => {
    setSortState((previous) => {
      if (previous.key !== key) {
        return { key, direction: "asc" };
      }
      if (previous.direction === "asc") {
        return { key, direction: "desc" };
      }
      return { key: null, direction: null };
    });
  };

  const sortCompanies = (companies: CompanyRecord[], getParticipationCount: (c: CompanyRecord) => number) => {
    if (!sortState.key || !sortState.direction) {
      return companies;
    }

    const sorted = [...companies].sort((left, right) => {
      if (sortState.key === "companyName") {
        return left.companyName.localeCompare(right.companyName, "ko");
      }
      if (sortState.key === "location") {
        return left.location.localeCompare(right.location, "ko");
      }
      if (sortState.key === "mouSigned") {
        const leftValue = left.mouSigned ? 1 : 0;
        const rightValue = right.mouSigned ? 1 : 0;
        return rightValue - leftValue;
      }
      if (sortState.key === "participationCount") {
        const leftCount = getParticipationCount(left);
        const rightCount = getParticipationCount(right);
        return leftCount - rightCount;
      }
      return 0;
    });

    if (sortState.direction === "desc") {
      sorted.reverse();
    }

    return sorted;
  };

  return {
    sortState,
    setSortState,
    toggleSort,
    sortCompanies,
  };
}
