import { CourseType } from "../../types/models";

const COURSE_TYPE_COLORS: Record<CourseType, { bg: string, dot: string, text: string }> = {
  훈련비과정: { bg: "bg-emerald-50", dot: "bg-emerald-500", text: "text-emerald-700" },
  지원비과정: { bg: "bg-blue-50", dot: "bg-blue-500", text: "text-blue-700" },
  "공유개방 세미나": { bg: "bg-amber-50", dot: "bg-amber-500", text: "text-amber-700" },
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
