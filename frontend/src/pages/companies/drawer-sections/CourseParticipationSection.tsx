import { Plus, Trash2, Info, X, Check, ChevronDown, ChevronUp, Settings2, ChevronRight } from "lucide-react";
import type { CompanyRecord, SubCourseWithParticipants, SubCourseParticipant, CourseGroup } from "../../../types/models";

interface CourseParticipationSectionProps {
  draftCompany: CompanyRecord;
  courseGroups: CourseGroup[];
  expandedDrawerGroups: Set<string>;
  expandedSubCourses: Set<string>;
  addParticipantSubCourseId: string | null;
  addParticipantDraft: string;
  addParticipantSessionId: string;
  onToggleDrawerGroup: (groupName: string) => void;
  onToggleSubCourse: (id: string) => void;
  onRemoveCourseProgram: (courseType: string, programName: string) => void;
  onAddParticipantClick: (subCourseId: string) => void;
  onAddParticipantDraftChange: (val: string) => void;
  onAddParticipantSessionChange: (val: string) => void;
  onConfirmAddParticipant: (subCourseId: string, groupId: string, sessionId?: string) => void;
  onRemoveParticipant: (groupId: string, subCourseId: string, ptId: string) => void;
  onShowParticipantPopover: (pt: SubCourseParticipant, e: React.MouseEvent) => void;
  onHideParticipantPopover: () => void;
  onNavigateToCourses: () => void;
  getSubCourseByName: (companyId: string, groupId: string, name: string) => SubCourseWithParticipants | undefined;
}

export function CourseParticipationSection({
  draftCompany,
  courseGroups,
  expandedDrawerGroups,
  expandedSubCourses,
  addParticipantSubCourseId,
  addParticipantDraft,
  addParticipantSessionId,
  onToggleDrawerGroup,
  onToggleSubCourse,
  onRemoveCourseProgram,
  onAddParticipantClick,
  onAddParticipantDraftChange,
  onAddParticipantSessionChange,
  onConfirmAddParticipant,
  onRemoveParticipant,
  onShowParticipantPopover,
  onHideParticipantPopover,
  onNavigateToCourses,
  getSubCourseByName,
}: CourseParticipationSectionProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-brand-primary/10 rounded-lg">
            <ChevronDown size={16} strokeWidth={2.5} className="text-brand-primary" />
          </div>
          <h4 className="font-bold text-primary tracking-tight">교육 과정</h4>
        </div>
        <div className="flex items-center gap-2">
          <button 
            type="button" 
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-secondary hover:bg-surface-subtle rounded-xl transition-all" 
            onClick={onNavigateToCourses}
            title="과정 관리로 이동"
          >
            <Settings2 size={14} strokeWidth={2.5} /> 과정 관리
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {courseGroups.map((group) => {
          const participation = draftCompany.participations.find(p => p.courseType === group.name) ?? { courseType: group.name, enabled: false, programNames: [], status: "미참여" };
          const expanded = expandedDrawerGroups.has(group.name);
          return (
            <div key={group.id} className="overflow-hidden">
              <button 
                type="button" 
                className={`flex items-center justify-between w-full px-5 py-3.5 text-sm font-bold transition-all duration-200 border rounded-2xl ${expanded ? "bg-brand-primary/10 text-brand-primary border-brand-primary/20 shadow-sm" : "bg-surface text-secondary border-border hover:border-brand-primary/30 hover:bg-brand-primary/5"}`}
                onClick={() => onToggleDrawerGroup(group.name)}
              >
                <span className="flex items-center gap-2.5">
                  <span className={`w-2 h-2 rounded-full ${expanded ? "bg-brand-primary" : "bg-tertiary"}`}></span>
                  {group.name} 
                  <span className={`px-2 py-0.5 rounded-full text-[11px] ${expanded ? "bg-brand-primary/20 text-brand-primary" : "bg-surface-subtle text-secondary"}`}>
                    {participation.programNames.length}
                  </span>
                </span>
                {expanded ? <ChevronUp size={16} strokeWidth={2.5} /> : <ChevronDown size={16} strokeWidth={2.5} />}
              </button>
              
              {expanded && (
                <div className="mt-2 ml-4 pl-4 border-l-2 border-brand-primary/10 space-y-2 py-1">
                  {participation.programNames.length === 0 ? (
                    <p className="text-sm text-tertiary py-2 pl-2">참여 과정 없음</p>
                  ) : participation.programNames.map(programName => {
                    const subCourse = getSubCourseByName(draftCompany.id, group.id, programName);
                    const subCourseId = subCourse?.id ?? `sc-${group.id}-${programName}`;
                    const subExpanded = expandedSubCourses.has(subCourseId);
                    
                    const subCourseDetail = group.details.find(d => d.name === programName);
                    const subSessions = subCourseDetail?.sessions || [];

                    return (
                      <div key={subCourseId} className="group/sub">
                        <div className="flex items-center justify-between p-1 hover:bg-surface-subtle rounded-xl transition-colors">
                          <button 
                            type="button" 
                            className="flex-1 flex items-center gap-2 text-sm text-secondary font-medium py-1.5 px-2 text-left"
                            onClick={() => onToggleSubCourse(subCourseId)}
                          >
                            <span className={`text-xs transition-transform duration-200 ${subExpanded ? "rotate-90" : ""}`}>
                              <ChevronRight size={14} strokeWidth={2.5} />
                            </span>
                            <span className={subExpanded ? "text-brand-primary font-semibold" : ""}>{programName}</span>
                            <span className="text-[11px] text-tertiary font-normal">
                              {subCourse?.participants.length ?? 0}명
                            </span>
                          </button>
                          <button 
                            type="button" 
                            className="p-1.5 text-tertiary hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover/sub:opacity-100" 
                            onClick={() => onRemoveCourseProgram(group.name, programName)}
                          >
                            <Trash2 size={12} strokeWidth={2.5} />
                          </button>
                        </div>

                        {subExpanded && (
                          <div className="mt-1 ml-6 space-y-1 bg-surface-subtle/50 p-2 rounded-xl border border-border/50">
                            {subCourse?.participants.map(p => (
                              <div key={p.id} className="flex items-center justify-between px-3 py-2 bg-surface rounded-lg border border-border shadow-sm group/p">
                                <span className="text-[13px] font-medium text-primary">{p.name}</span>
                                <div className="flex items-center gap-3">
                                  <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${p.completed ? "bg-brand-primary/10 text-brand-primary" : "bg-surface-subtle text-secondary"}`}>
                                    {p.completed ? "수료" : "미수료"}
                                  </span>
                                  <div className="flex items-center gap-1 opacity-0 group-hover/p:opacity-100 transition-opacity">
                                    <button className="p-1 text-tertiary hover:text-brand-primary transition-colors" onMouseEnter={e => onShowParticipantPopover(p, e)} onMouseLeave={onHideParticipantPopover}>
                                      <Info size={12} strokeWidth={2.5} />
                                    </button>
                                    <button className="p-1 text-tertiary hover:text-red-500 transition-colors" onClick={() => onRemoveParticipant(group.id, subCourseId, p.id)}>
                                      <X size={12} strokeWidth={2.5} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                            <div className="pt-1 px-1">
                              {addParticipantSubCourseId === subCourseId ? (
                                <div className="flex flex-col gap-2 p-1 bg-surface rounded-lg border border-brand-primary/30">
                                  <div className="flex items-center gap-2">
                                    <input 
                                      autoFocus 
                                      className="flex-1 px-2 py-1 text-sm outline-none bg-transparent" 
                                      value={addParticipantDraft} 
                                      onChange={e => onAddParticipantDraftChange(e.target.value)} 
                                      onKeyDown={e => e.key === "Enter" && onConfirmAddParticipant(programName, group.id, addParticipantSessionId)} 
                                      placeholder="참여자 이름..." 
                                    />
                                    <button className="p-1 text-brand-primary hover:bg-brand-primary/10 rounded" onClick={() => onConfirmAddParticipant(programName, group.id, addParticipantSessionId)}>
                                      <Check size={16} strokeWidth={2.5} />
                                    </button>
                                  </div>
                                  {subSessions.length > 0 && (
                                    <div className="flex flex-wrap gap-1 px-1 pb-1 border-t border-border/30 pt-1.5 mt-0.5">
                                      <span className="text-[9px] font-black text-tertiary uppercase w-full mb-1">회차 선택</span>
                                      {subSessions.map((session, sidx) => (
                                        <button
                                          key={session.id}
                                          type="button"
                                          onClick={() => onAddParticipantSessionChange(session.id)}
                                          className={`px-2 py-0.5 rounded text-[10px] font-black border transition-all ${
                                            addParticipantSessionId === session.id
                                              ? "bg-brand-primary border-brand-primary text-white"
                                              : "bg-surface-subtle border-border text-tertiary hover:border-brand-primary/30"
                                          }`}
                                        >
                                          {sidx + 1}회차
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <button 
                                  className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-tertiary hover:text-brand-primary hover:bg-brand-primary/5 rounded-lg transition-all border border-dashed border-border hover:border-brand-primary/30" 
                                  onClick={() => onAddParticipantClick(subCourseId)}
                                >
                                  <Plus size={12} strokeWidth={2.5} /> 참여자 추가
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}


