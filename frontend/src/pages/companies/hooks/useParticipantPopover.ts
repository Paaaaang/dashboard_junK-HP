import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

export function useParticipantPopover() {
  const navigate = useNavigate();
  const [participantPopover, setParticipantPopover] = useState<{
    participant: any;
    style: React.CSSProperties;
  } | null>(null);
  const popoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showParticipantPopover = useCallback((participant: any, event: React.MouseEvent) => {
    if (popoverTimerRef.current) clearTimeout(popoverTimerRef.current);
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    popoverTimerRef.current = setTimeout(() => {
      const popoverWidth = 220;
      const margin = 8;
      const hasSpaceOnRight = rect.right + popoverWidth + margin < window.innerWidth;
      
      const left = hasSpaceOnRight 
        ? rect.right + margin 
        : rect.left - popoverWidth - margin;

      setParticipantPopover({
        participant,
        style: {
          left,
          top: rect.top,
        },
      });
    }, 300);
  }, []);

  const hideParticipantPopover = useCallback(() => {
    if (popoverTimerRef.current) clearTimeout(popoverTimerRef.current);
    popoverTimerRef.current = setTimeout(() => {
      setParticipantPopover(null);
    }, 200);
  }, []);

  const navigateToParticipant = useCallback((id: string) => {
    setParticipantPopover(null);
    navigate(`/participants?open=${id}`);
  }, [navigate]);

  return {
    participantPopover,
    setParticipantPopover,
    popoverTimerRef,
    showParticipantPopover,
    hideParticipantPopover,
    navigateToParticipant,
  };
}
