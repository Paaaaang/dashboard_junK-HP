import { useMemo } from "react";
import { useCourseStore, useParticipantStore } from "../../stores";
import { parseISO, format } from "date-fns";

export function CourseStatusTable() {
  const { courseGroups } = useCourseStore();
  const { participants } = useParticipantStore();

  const getSessionAchieved = (courseType: string, subCourseName: string, sessionId: string) => {
    return participants.flatMap(p => 
      p.enrollments.filter(e => 
        e.courseType === courseType && 
        e.subCourseName === subCourseName && 
        e.sessionId === sessionId &&
        e.status === "수료"
      )
    ).length;
  };

  const getSubCourseAchieved = (courseType: string, subCourseName: string) => {
    return participants.flatMap(p => 
      p.enrollments.filter(e => 
        e.courseType === courseType && 
        e.subCourseName === subCourseName &&
        e.status === "수료"
      )
    ).length;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    try {
      const date = parseISO(dateStr);
      return format(date, "M/d");
    } catch {
      return dateStr;
    }
  };

  // We need to calculate row spans
  // 1. Group row span = total number of sessions in all its details (sub-courses) + 1 (for total row). Wait, the image shows "총합" row separate. 
  // Wait, let's look at the image again. 
  // "구분" (1st col) and "대상" (2nd col) span across all subcourses and sessions. The "총합" row spans col 1-4.
  // Actually, in the image, the "총합" row is INSIDE the group?
  // Let's create a structured data for rendering.

  const tableData = useMemo(() => {
    const rows: any[] = [];

    courseGroups.forEach(group => {
      let groupTotalTarget = 0;
      let groupTotalAchieved = 0;
      
      const groupSessionsCount = group.details.reduce((acc, detail) => acc + Math.max(detail.sessions?.length || 1, 1), 0);

      group.details.forEach((detail, dIdx) => {
        const sessions = detail.sessions && detail.sessions.length > 0 ? detail.sessions : [{ id: 'dummy', startDate: '', endDate: '', totalHours: detail.totalHours || 0, targetOutcome: detail.targetOutcome || 0 }];
        const detailSessionsCount = sessions.length;

        sessions.forEach((session, sIdx) => {
          const target = session.targetOutcome || 0;
          let achieved = 0;
          
          if (session.id === 'dummy') {
            achieved = getSubCourseAchieved(group.name, detail.name);
          } else {
            achieved = getSessionAchieved(group.name, detail.name, session.id);
          }

          groupTotalTarget += target;
          groupTotalAchieved += achieved;

          const rate = target > 0 ? ((achieved / target) * 100).toFixed(1) : "0.0";

          rows.push({
            type: 'data',
            groupId: group.id,
            groupName: group.name,
            groupAudiences: group.audiences.join(", "),
            groupRowSpan: dIdx === 0 && sIdx === 0 ? groupSessionsCount : 0,
            
            detailId: detail.id,
            detailName: `${detail.name} (${sessions.length > 1 ? '다회차' : '1일'}, ${session.totalHours}시간)`, // Adjusted format to be generic
            detailRowSpan: sIdx === 0 ? detailSessionsCount : 0,
            
            sessionDate: formatDate(session.startDate),
            target,
            achieved,
            rate,
            
            isFirstDetail: dIdx === 0 && sIdx === 0,
            isFirstSession: sIdx === 0,
          });
        });
      });

      // After all details in a group, add total row
      const groupRate = groupTotalTarget > 0 ? ((groupTotalAchieved / groupTotalTarget) * 100).toFixed(1) : "0.0";
      rows.push({
        type: 'total',
        groupId: group.id,
        target: groupTotalTarget,
        achieved: groupTotalAchieved,
        rate: groupRate
      });
    });

    return rows;
  }, [courseGroups, participants]);

  return (
    <div className="bg-surface border border-border/50 rounded-[32px] overflow-hidden shadow-sm">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-center border-collapse">
          <thead>
            <tr>
              <th rowSpan={2} className="px-4 py-3 text-xs font-black text-secondary bg-surface-subtle border border-border/50 align-middle min-w-[120px]">구분</th>
              <th rowSpan={2} className="px-4 py-3 text-xs font-black text-secondary bg-surface-subtle border border-border/50 align-middle min-w-[140px]">대상</th>
              <th rowSpan={2} className="px-4 py-3 text-xs font-black text-secondary bg-surface-subtle border border-border/50 align-middle min-w-[280px]">과정명</th>
              <th rowSpan={2} className="px-4 py-3 text-xs font-black text-secondary bg-surface-subtle border border-border/50 align-middle min-w-[100px]">진행(예정)일</th>
              <th colSpan={3} className="px-4 py-2 text-xs font-black text-secondary bg-surface-subtle border border-border/50">성과달성</th>
            </tr>
            <tr>
              <th className="px-4 py-2 text-xs font-black text-secondary bg-surface-subtle border border-border/50 min-w-[80px]">목표</th>
              <th className="px-4 py-2 text-xs font-black text-secondary bg-surface-subtle border border-border/50 min-w-[80px]">달성</th>
              <th className="px-4 py-2 text-xs font-black text-secondary bg-surface-subtle border border-border/50 min-w-[100px]">달성률(%)</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {tableData.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-20 text-center text-tertiary font-bold text-sm">등록된 교육 과정 데이터가 없습니다.</td>
              </tr>
            ) : (
              tableData.map((row, idx) => {
                if (row.type === 'total') {
                  return (
                    <tr key={`total-${row.groupId}`} className="bg-surface-subtle/50">
                      <td colSpan={4} className="px-4 py-3 text-sm font-black text-primary border border-border/50">총합</td>
                      <td className="px-4 py-3 text-sm font-black text-primary border border-border/50">{row.target}</td>
                      <td className="px-4 py-3 text-sm font-black text-primary border border-border/50">{row.achieved > 0 ? row.achieved : ""}</td>
                      <td className="px-4 py-3 text-sm font-black text-primary border border-border/50">{row.rate}%</td>
                    </tr>
                  );
                }

                // Determine background color based on group index
                // It helps visually separate groups if needed, but for now we'll stick to a clean look with borders.
                const groupBgClass = "bg-white"; 

                return (
                  <tr key={`row-${idx}`} className={`hover:bg-brand-primary/[0.02] transition-colors ${groupBgClass}`}>
                    {row.groupRowSpan > 0 && (
                      <td rowSpan={row.groupRowSpan} className="px-4 py-3 text-sm font-black text-primary border border-border/50 align-middle">
                        {row.groupName}
                      </td>
                    )}
                    {row.groupRowSpan > 0 && (
                      <td rowSpan={row.groupRowSpan} className="px-4 py-3 text-[13px] font-bold text-secondary border border-border/50 align-middle whitespace-pre-wrap">
                        {row.groupAudiences.replace(/, /g, '\n')}
                      </td>
                    )}
                    {row.detailRowSpan > 0 && (
                      <td rowSpan={row.detailRowSpan} className="px-4 py-3 text-[13px] font-bold text-secondary border border-border/50 align-middle text-left">
                        {row.detailName}
                      </td>
                    )}
                    <td className="px-4 py-3 text-[13px] font-mono font-medium text-secondary border border-border/50">
                      {row.sessionDate}
                    </td>
                    <td className="px-4 py-3 text-[13px] font-mono text-secondary border border-border/50">
                      {row.target}
                    </td>
                    <td className="px-4 py-3 text-[13px] font-mono text-secondary border border-border/50">
                      {row.achieved > 0 ? row.achieved : ""}
                    </td>
                    <td className="px-4 py-3 text-[13px] font-mono border border-border/50" style={{ color: Number(row.rate) >= 100 ? 'var(--color-success)' : Number(row.rate) > 0 ? 'var(--brand-primary)' : 'var(--color-text-secondary)' }}>
                      {row.rate}%
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
