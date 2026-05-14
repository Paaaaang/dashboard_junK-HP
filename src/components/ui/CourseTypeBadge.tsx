import { CourseType } from "@/types/models";

const COURSE_TYPE_COLORS: Record<CourseType, { bg: string, dot: string, text: string }> = {
  훈련비과정: { bg: "bg-brand-primary/10", dot: "bg-brand-primary", text: "text-brand-primary" },
  지원비과정: { bg: "bg-info/10", dot: "bg-info", text: "text-info" },
  "공유개방 세미나": { bg: "bg-warning/10", dot: "bg-warning", text: "text-warning" },
};

interface CourseTypeBadgeProps {
  type: CourseType;
  count?: number;
}

export function CourseTypeBadge({ type, count }: CourseTypeBadgeProps) {
  const colors = COURSE_TYPE_COLORS[type];
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${colors.bg} ${colors.text} font-bold text-xs`}>
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
      {type}
      {count !== undefined && <span className="opacity-50 ml-1">({count})</span>}
    </div>
  );
}
