import { Search } from "lucide-react";
import { EmptyState } from "@/components";
import type { InstructorRecord } from "@/stores/useInstructorStore";

interface InstructorTableProps {
  instructors: InstructorRecord[];
  isLoading: boolean;
  searchQuery: string;
  onOpenDrawer: (id?: string) => void;
}

export function InstructorTable({
  instructors,
  isLoading,
  searchQuery,
  onOpenDrawer,
}: InstructorTableProps) {
  return (
    <div className="bg-surface border border-border/50 rounded-[32px] overflow-hidden shadow-sm">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-surface-subtle/50">
              <th className="px-6 py-4 text-[10px] font-black text-tertiary uppercase tracking-widest border-b border-border/50 text-center w-16">No</th>
              <th className="px-6 py-4 text-[10px] font-black text-tertiary uppercase tracking-widest border-b border-border/50 text-center">구분</th>
              <th className="px-6 py-4 text-[10px] font-black text-tertiary uppercase tracking-widest border-b border-border/50 text-center">강사명</th>
              <th className="px-6 py-4 text-[10px] font-black text-tertiary uppercase tracking-widest border-b border-border/50 text-center">연락처</th>
              <th className="px-6 py-4 text-[10px] font-black text-tertiary uppercase tracking-widest border-b border-border/50 text-center">이메일</th>
              <th className="px-6 py-4 text-[10px] font-black text-tertiary uppercase tracking-widest border-b border-border/50 text-center">최근/예정 일자</th>
              <th className="px-6 py-4 text-[10px] font-black text-tertiary uppercase tracking-widest border-b border-border/50 text-center">배정 과정명</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30 bg-white text-center">
            {instructors.length === 0 && !isLoading ? (
              <EmptyState
                icon={Search}
                title={searchQuery ? "검색 결과가 없습니다" : "등록된 강사가 없습니다"}
                description={searchQuery ? "다른 검색어를 입력해 보세요." : "새로운 강사를 등록하여 교육 과정에 배정해 보세요."}
              />
            ) : (
              instructors.map((instructor, idx) => {
                const sortedSessions = instructor.assignedSessions ? [...instructor.assignedSessions].sort((a, b) => 
                  new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
                ) : [];
                const latestSession = sortedSessions[0];

                return (
                  <tr 
                    key={instructor.id} 
                    className="hover:bg-brand-primary/[0.02] transition-colors group cursor-pointer" 
                    onClick={() => onOpenDrawer(instructor.id)}
                  >
                    <td className="px-6 py-5 text-center text-xs font-black text-tertiary tabular-nums">
                      {idx + 1}
                    </td>
                    <td className="px-6 py-5">
                      {instructor.specialty ? (
                        <span className="px-2.5 py-1 bg-surface-subtle border border-border/60 text-secondary text-[11px] font-bold rounded-lg whitespace-nowrap">
                          {instructor.specialty}
                        </span>
                      ) : <span className="text-disabled italic text-[11px]">미지정</span>}
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-sm font-black text-primary">{instructor.name}</span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-1.5 text-secondary text-[13px] justify-center">
                        <span className="font-mono font-medium">{instructor.phone || "-"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-1.5 text-secondary text-[13px] justify-center">
                        <span className="font-medium">{instructor.email || "-"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {latestSession ? (
                        <div className="flex flex-col">
                          <span className="text-[12px] font-mono font-bold text-secondary">{latestSession.startDate}</span>
                          {sortedSessions.length > 1 && <span className="text-[9px] font-black text-brand-primary uppercase mt-0.5">+{sortedSessions.length - 1} more</span>}
                        </div>
                      ) : <span className="text-disabled italic text-xs">-</span>}
                    </td>
                    <td className="px-6 py-5">
                      {latestSession ? (
                        <div className="flex flex-col">
                          <span className="text-[13px] font-bold text-primary truncate max-w-[200px]" title={latestSession.subCourseName}>
                            {latestSession.subCourseName}
                          </span>
                          <span className="text-[10px] text-tertiary font-medium">{latestSession.groupName}</span>
                        </div>
                      ) : <span className="text-disabled italic text-xs">-</span>}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
