import { useState, useCallback, useRef, useEffect } from "react";
import type { CompanyRecord } from "../../../types/models";

export function useCompanySelection(filteredCompanies: CompanyRecord[]) {
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<Set<string>>(
    new Set(),
  );
  const lastSelectedIdRef = useRef<string | null>(null);
  const selectAllRef = useRef<HTMLInputElement>(null);

  const visibleCompanyIds = filteredCompanies.map((company) => company.id);

  const selectedVisibleCount = visibleCompanyIds.filter((companyId) =>
    selectedCompanyIds.has(companyId),
  ).length;

  const allVisibleSelected =
    visibleCompanyIds.length > 0 &&
    selectedVisibleCount === visibleCompanyIds.length;
  
  const hasPartialSelection = selectedVisibleCount > 0 && !allVisibleSelected;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = hasPartialSelection;
    }
  }, [hasPartialSelection]);

  const toggleCompanySelection = useCallback(
    (companyId: string, event?: React.MouseEvent | React.ChangeEvent) => {
      if (
        event &&
        "nativeEvent" in event &&
        event.nativeEvent instanceof MouseEvent &&
        event.nativeEvent.shiftKey &&
        lastSelectedIdRef.current
      ) {
        const ids = filteredCompanies.map((company) => company.id);
        const lastIdx = ids.indexOf(lastSelectedIdRef.current);
        const currIdx = ids.indexOf(companyId);
        if (lastIdx !== -1 && currIdx !== -1) {
          const start = Math.min(lastIdx, currIdx);
          const end = Math.max(lastIdx, currIdx);
          const rangeIds = ids.slice(start, end + 1);
          setSelectedCompanyIds((prev) => {
            const next = new Set(prev);
            rangeIds.forEach((rid) => next.add(rid));
            return next;
          });
          return;
        }
      }

      setSelectedCompanyIds((previous) => {
        const next = new Set(previous);
        if (next.has(companyId)) {
          next.delete(companyId);
        } else {
          next.add(companyId);
        }
        return next;
      });
      lastSelectedIdRef.current = companyId;
    },
    [filteredCompanies],
  );

  const toggleVisibleSelection = useCallback(
    (checked: boolean) => {
      setSelectedCompanyIds((previous) => {
        const next = new Set(previous);
        visibleCompanyIds.forEach((companyId) => {
          if (checked) {
            next.add(companyId);
          } else {
            next.delete(companyId);
          }
        });
        return next;
      });
    },
    [visibleCompanyIds],
  );

  const clearSelectedCompanies = useCallback(() => {
    setSelectedCompanyIds(new Set());
  }, []);

  return {
    selectedCompanyIds,
    setSelectedCompanyIds,
    toggleCompanySelection,
    toggleVisibleSelection,
    clearSelectedCompanies,
    allVisibleSelected,
    hasPartialSelection,
    selectAllRef,
  };
}
