import {
  addDays,
  addMonths,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  isValid,
  isWithinInterval,
  parse,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { useClickOutside } from "@/hooks/useClickOutside";
import clsx from "clsx";
import { ko } from "date-fns/locale";
import { twMerge } from "tailwind-merge";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, Check, ChevronDown } from "lucide-react";

const ArrowBottomIcon = ({ className }: { className?: string }) => (
  <ChevronDown className={twMerge("w-4 h-4 text-text-tertiary", className)} strokeWidth={2.5} />
);

const ArrowLeftIcon = () => <ChevronLeft className="w-4 h-4 text-text-secondary" strokeWidth={2.5} />;
const ArrowRightIcon = () => <ChevronRight className="w-4 h-4 text-text-secondary" strokeWidth={2.5} />;
const ClearIcon = () => <X className="w-4 h-4 text-text-tertiary" strokeWidth={2.5} />;

export interface RangeValue {
  start: Date | null;
  end: Date | null;
}

const formatDateRange = (start: Date, end: Date, timezone: string) => {
  const sameDay = isSameDay(start, end);

  const formatSingle = (date: Date) =>
    formatInTimeZone(date, timezone, "yyyy.MM.dd", { locale: ko });

  if (sameDay) {
    return formatSingle(start);
  }

  const startFormatted = formatSingle(start);
  const endFormatted = formatSingle(end);
  
  return `${startFormatted} - ${endFormatted}`;
};

interface CalendarProps {
  allowClear?: boolean;
  isSingleDate?: boolean;
  value: RangeValue | null;
  onChange: (date: RangeValue | null) => void;
  minValue?: Date;
  maxValue?: Date;
  placeholder?: string;
}

export const Calendar = ({
  allowClear = true,
  isSingleDate = false,
  value,
  onChange,
  minValue,
  maxValue,
  placeholder = "날짜 선택"
}: CalendarProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [isSelecting, setIsSelecting] = useState<boolean>(false);
  const [portalPos, setPortalPos] = useState({ top: 0, left: 0, width: 0 });
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
  
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  const [startDateStr, setStartDateStr] = useState<string>("");
  const [endDateStr, setEndDateStr] = useState<string>("");

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useClickOutside(dropdownRef, (e) => {
    if (triggerRef.current?.contains(e.target as Node)) return;
    setIsOpen(false);
  });

  const findScrollableParent = (element: HTMLElement | null) => {
    let current = element?.parentElement ?? null;
    while (current) {
      const style = window.getComputedStyle(current);
      const overflowY = style.overflowY;
      const overflow = style.overflow;
      const isScrollableStyle =
        overflowY === "auto" ||
        overflowY === "scroll" ||
        overflow === "auto" ||
        overflow === "scroll";

      if (isScrollableStyle && current.scrollHeight > current.clientHeight + 1) {
        return current;
      }

      current = current.parentElement;
    }

    // App 레이아웃 특성상 window/body 스크롤이 막혀 있고 main이 스크롤 컨테이너인 경우가 많아 fallback을 둡니다.
    const main = document.querySelector("main") as HTMLElement | null;
    return main ?? document.body;
  };

  const updatePosition = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const GAP = 8;
    const VIEWPORT_PADDING = 8;
    const DROPDOWN_WIDTH = 320;

    const rect = trigger.getBoundingClientRect();
    const dropdownHeight = dropdownRef.current?.offsetHeight ?? 0;

    const left = Math.min(
      Math.max(VIEWPORT_PADDING, rect.left),
      Math.max(VIEWPORT_PADDING, window.innerWidth - VIEWPORT_PADDING - DROPDOWN_WIDTH)
    );

    const belowTop = rect.bottom + GAP;
    let top = belowTop;

    if (dropdownHeight > 0) {
      const wouldOverflowBottom = belowTop + dropdownHeight > window.innerHeight - VIEWPORT_PADDING;
      const aboveTop = rect.top - GAP - dropdownHeight;

      if (wouldOverflowBottom && aboveTop >= VIEWPORT_PADDING) {
        top = aboveTop;
      } else {
        top = Math.min(belowTop, window.innerHeight - VIEWPORT_PADDING - dropdownHeight);
      }

      top = Math.max(VIEWPORT_PADDING, top);
    }

    setPortalPos({
      top,
      left,
      width: rect.width,
    });
  };

  useEffect(() => {
    if (!isOpen) return;

    const root = findScrollableParent(triggerRef.current);
    setPortalRoot(root);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const root = portalRoot ?? findScrollableParent(triggerRef.current);

    // 첫 렌더 직후에는 dropdown 높이가 0일 수 있어, 한 프레임 뒤에 한 번 더 위치 계산을 합니다.
    updatePosition();
    requestAnimationFrame(updatePosition);

    const onScrollOrResize = () => updatePosition();

    root?.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);
    // 일부 화면에서는 window 스크롤이 살아있을 수 있어 보조로 유지합니다.
    window.addEventListener("scroll", onScrollOrResize, true);

    return () => {
      root?.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("scroll", onScrollOrResize, true);
    };
  }, [isOpen, portalRoot]);

  const prevMonth = () => setCurrentDate(addMonths(currentDate, -1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const daysArray = useMemo(() => {
    const days = [];
    let day = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
    while (day <= end) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [currentDate]);

  const handleDateClick = (day: Date) => {
    if (isSingleDate) {
      onChange({ start: startOfDay(day), end: endOfDay(day) });
      setIsOpen(false);
      return;
    }

    if (!value?.start || (value.start && value.end)) {
      onChange({ start: startOfDay(day), end: null });
      setHoverDate(day);
      setIsSelecting(true);
    } else if (isSelecting) {
      if (day > value.start) {
        onChange({ ...value, end: endOfDay(day) });
      } else {
        onChange({ start: startOfDay(day), end: endOfDay(value.start) });
      }
      setIsSelecting(false);
      setHoverDate(null);
      setIsOpen(false);
    }
  };

  const handleMouseEnter = (day: Date) => {
    if (!isSingleDate && value?.start && !value.end) {
      setHoverDate(day);
    }
  };

  const onApply = () => {
    try {
      if (isSingleDate) {
        const parsedStart = parse(`${startDateStr}`, "yyyy.MM.dd", new Date());
        if (isValid(parsedStart)) {
          onChange({
            start: fromZonedTime(parsedStart, timezone),
            end: fromZonedTime(parsedStart, timezone)
          });
          setIsOpen(false);
        }
        return;
      }

      const parsedStart = parse(`${startDateStr}`, "yyyy.MM.dd", new Date());
      const parsedEnd = parse(`${endDateStr}`, "yyyy.MM.dd", new Date());
      
      if (isValid(parsedStart) && isValid(parsedEnd)) {
        onChange({
          start: fromZonedTime(parsedStart, timezone),
          end: fromZonedTime(endOfDay(parsedEnd), timezone)
        });
        setIsOpen(false);
      }
    } catch (e) {
      console.error("Invalid date format");
    }
  };

  useEffect(() => {
    if (isOpen) {
      setStartDateStr(formatInTimeZone(value?.start || new Date(), timezone, "yyyy.MM.dd"));
      setEndDateStr(formatInTimeZone(value?.end || new Date(), timezone, "yyyy.MM.dd"));
    }
  }, [isOpen, value, timezone]);

  return (
    <div className="relative inline-block w-full">
      <button
        ref={triggerRef}
        type="button"
        className="w-full flex items-center justify-between px-4 py-2.5 bg-surface border border-border rounded-xl text-sm font-medium text-text-secondary hover:border-brand-primary focus:outline-none focus:ring-4 focus:ring-brand-primary/10 transition-all"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 truncate">
          <CalendarIcon size={16} strokeWidth={2.5} className="text-text-tertiary" />
          <span className={value?.start ? "text-text-primary" : "text-text-tertiary"}>
            {value?.start 
              ? (isSingleDate ? formatInTimeZone(value.start, timezone, "yyyy.MM.dd") : (value.end ? formatDateRange(value.start, value.end, timezone) : placeholder))
              : placeholder}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {allowClear && value?.start && (
            <div 
              className="p-1 hover:bg-background rounded-md transition-colors"
              onClick={(e) => { e.stopPropagation(); onChange(null); }}
            >
              <ClearIcon />
            </div>
          )}
          <ArrowBottomIcon className={clsx("transition-transform duration-200", isOpen && "rotate-180")} />
        </div>
      </button>

      {isOpen && createPortal(
        <div 
          ref={dropdownRef}
          style={{ 
            position: 'fixed', 
            top: `${portalPos.top}px`, 
            left: `${portalPos.left}px`,
            zIndex: 9999 
          }}
          className="p-4 bg-surface border border-border rounded-[24px] shadow-xl w-[320px] max-h-[calc(100vh-16px)] overflow-auto animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="flex justify-between items-center mb-4 px-1">
            <h2 className="text-sm font-bold text-text-primary">
              {format(currentDate, "yyyy년 MMMM", { locale: ko })}
            </h2>
            <div className="flex gap-1">
              <button type="button" onClick={prevMonth} className="p-1.5 hover:bg-background rounded-lg transition-colors"><ArrowLeftIcon /></button>
              <button type="button" onClick={nextMonth} className="p-1.5 hover:bg-background rounded-lg transition-colors"><ArrowRightIcon /></button>
            </div>
          </div>

          <div className="grid grid-cols-7 text-center text-[11px] font-black text-text-tertiary uppercase mb-2">
            {["일", "월", "화", "수", "목", "금", "토"].map(d => <div key={d}>{d}</div>)}
          </div>

          <div className="grid grid-cols-7 gap-y-1">
            {daysArray.map((day, idx) => {
              const isStart = value?.start && isSameDay(day, value.start);
              const isEnd = value?.end && isSameDay(day, value.end);
              const isCurrentHover = hoverDate && isSelecting && isSameDay(day, hoverDate);
              const isInRange = !isSingleDate && value?.start && (
                (value.end && isWithinInterval(day, { start: value.start, end: value.end })) ||
                (hoverDate && isWithinInterval(day, { 
                  start: value.start < (hoverDate as Date) ? value.start : hoverDate, 
                  end: value.start < (hoverDate as Date) ? hoverDate : value.start 
                }))
              );
              const isAllowedDate = (minValue ? day >= minValue : true) && (maxValue ? day <= maxValue : true);
              const inMonth = isSameMonth(day, currentDate);

              return (
                <div
                  key={idx}
                  className={clsx(
                    "relative flex items-center justify-center h-9 transition-all",
                    isInRange && !isStart && !isEnd && "bg-brand-primary/10",
                    isStart && !isSingleDate && "bg-brand-primary/10 rounded-l-full",
                    isEnd && !isSingleDate && "bg-brand-primary/10 rounded-r-full",
                    isAllowedDate ? "cursor-pointer" : "cursor-not-allowed opacity-20"
                  )}
                  onMouseEnter={() => isAllowedDate && handleMouseEnter(day)}
                  onClick={() => isAllowedDate && handleDateClick(day)}
                >
                  <div className={clsx(
                    "w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold transition-all",
                    isStart || (isEnd && !isSingleDate) || isCurrentHover ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20 scale-110" : 
                    isToday(day) ? "text-brand-primary border border-brand-primary/20" :
                    inMonth ? "text-text-secondary hover:bg-background" : "text-text-tertiary"
                  )}>
                    {format(day, "d")}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-background space-y-4">
            <div className={clsx("grid gap-3", isSingleDate ? "grid-cols-1" : "grid-cols-2")}>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-text-tertiary uppercase ml-1">{isSingleDate ? "선택 날짜" : "시작"}</label>
                <div className="flex flex-col gap-1">
                  <input 
                    type="text" 
                    className="w-full px-2 py-1.5 border border-border rounded-lg text-[12px] font-bold text-center" 
                    value={startDateStr} 
                    onChange={e => setStartDateStr(e.target.value)}
                  />
                </div>
              </div>
              {!isSingleDate && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-text-tertiary uppercase ml-1">종료</label>
                  <div className="flex flex-col gap-1">
                    <input 
                      type="text" 
                      className="w-full px-2 py-1.5 border border-border rounded-lg text-[12px] font-bold text-center" 
                      value={endDateStr} 
                      onChange={e => setEndDateStr(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
            <button
              type="button"
              className="w-full py-2.5 bg-text-primary text-white rounded-xl text-xs font-bold hover:bg-text-primary/90 transition-all flex items-center justify-center gap-2"
              onClick={onApply}
            >
              <Check size={14} strokeWidth={2.5} /> 적용하기
            </button>
          </div>
        </div>,
        portalRoot ?? document.body
      )}
    </div>
  );
};
