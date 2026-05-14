import { useState, useCallback } from "react";
import type { CompanyParticipation } from "@/types/models";

interface TooltipInfo {
  content: React.ReactNode;
  style: React.CSSProperties;
}

export function useCompanyTooltips() {
  const [tooltipInfo, setTooltipInfo] = useState<TooltipInfo | null>(null);

  const handleLocationEnter = useCallback(
    (event: React.MouseEvent<HTMLTableCellElement>, locationText: string) => {
      const span = event.currentTarget.querySelector<HTMLSpanElement>(".location-text");
      if (!span || span.scrollWidth <= span.clientWidth) return;

      const rect = span.getBoundingClientRect();
      setTooltipInfo({
        content: locationText,
        style: {
          left: rect.left + rect.width / 2,
          top: rect.top,
          transform: "translateX(-50%) translateY(calc(-100% - 8px))",
        },
      });
    },
    [],
  );

  const handleParticipationEnter = useCallback(
    (event: React.MouseEvent<HTMLTableCellElement>, participations: CompanyParticipation[]) => {
      if (participations.length === 0) return;

      const rect = event.currentTarget.getBoundingClientRect();
      const content = (
        <div className="flex flex-col gap-1 min-w-[120px]">
          {participations.map((p) => (
            <div key={p.courseType} className="flex items-center justify-between gap-3 text-white">
              <span className="text-xs font-semibold">{p.courseType}</span>
              <span className="text-[10px] bg-white/20 px-1.5 rounded">{p.programNames.length}개 과정</span>
            </div>
          ))}
        </div>
      );

      setTooltipInfo({
        content,
        style: {
          left: rect.left + rect.width / 2,
          top: rect.top,
          transform: "translateX(-50%) translateY(calc(-100% - 8px))",
        },
      });
    },
    [],
  );

  const hideTooltip = useCallback(() => {
    setTooltipInfo(null);
  }, []);

  return {
    tooltipInfo,
    handleLocationEnter,
    handleParticipationEnter,
    hideTooltip,
  };
}
