import { useState, useCallback, useRef, useEffect } from "react";
import type { ParticipantRecord } from "@/types/models";

export function useParticipantSelection(filtered: ParticipantRecord[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const lastSelectedIdRef = useRef<string | null>(null);
  const selectAllRef = useRef<HTMLInputElement>(null);

  const allFilteredSelected = filtered.length > 0 && filtered.every((p) => selectedIds.has(p.id));

  useEffect(() => {
    if (selectAllRef.current) {
      const hasPartial = selectedIds.size > 0 && !allFilteredSelected;
      selectAllRef.current.indeterminate = hasPartial;
    }
  }, [selectedIds, allFilteredSelected]);

  const toggleSelect = useCallback((id: string, event?: React.MouseEvent) => {
    if (event?.shiftKey && lastSelectedIdRef.current) {
      const ids = filtered.map((p) => p.id);
      const lastIdx = ids.indexOf(lastSelectedIdRef.current);
      const currIdx = ids.indexOf(id);
      if (lastIdx !== -1 && currIdx !== -1) {
        const start = Math.min(lastIdx, currIdx);
        const end = Math.max(lastIdx, currIdx);
        const rangeIds = ids.slice(start, end + 1);
        setSelectedIds((prev) => {
          const next = new Set(prev);
          rangeIds.forEach((rid) => next.add(rid));
          return next;
        });
        return;
      }
    }
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    lastSelectedIdRef.current = id;
  }, [filtered]);

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filtered.forEach((p) => next.delete(p.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filtered.forEach((p) => next.add(p.id));
        return next;
      });
    }
  };

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  return {
    selectedIds,
    setSelectedIds,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    allFilteredSelected,
    selectAllRef,
  };
}
