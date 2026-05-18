import { useNavigate } from "react-router-dom";
import { Plus, Trash2, Info, X, Check, ChevronDown, Settings2, ChevronRight } from "lucide-react";
import type { CompanyRecord, SubCourseWithParticipants, SubCourseParticipant, CourseGroup } from "@/types/models";
import { DrawerSection } from "@/components/shared";

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
  const navigate = useNavigate();

  return (
    <DrawerSection 
      title="참여 교육 과정" 
      collapsible
      defaultCollapsed={false}
      action={
        <button 
          type="button" 
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-brand-primary hover:bg-brand-primary/10 rounded-xl transition-all" 
          onClick={onNavigateToCourses}
        >
          <Settings2 size={14} strokeWidth={2.5} /> 과정 관리
        </button>
      }
    >
      <div className="space-y-6">
        {courseGroups.map((group) => {
          const participation = draftCompany.participations.find(p => p.courseType === group.name) ?? { courseType: group.name, enabled: false, programNames: [], status: "미참여" };
          const expanded = expandedDrawerGroups.has(group.name);
          
          if (participation.programNames.length === 0 && !expanded) {
             // Optionally hide empty groups if not expanded to keep it clean
          }

          return (
            <div key={group.id} className="space-y-3">
              <button 
                type="button" 
                className="flex items-center justify-between w-full px-1 text-left group"
                onClick={() => onToggleDrawerGroup(group.name)}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full transition-colors ${participation.programNames.length > 0 ? "bg-brand-primary" : "bg-disabled"}`}></span>
                  <span className="text-[12px] font-black text-secondary uppercase tracking-widest group-hover:text-primary transition-colors">
                    {group.name}
                  </span>
                  <span className="px-1.5 py-0.5 bg-surface-subtle border border-border/50 rounded text-[9px] font-black text-tertiary">
                    {participation.programNames.length}
                  </span>
                </div>
                <div className={`text-tertiary transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}>
                  <ChevronDown size={14} strokeWidth={2.5} />
                </div>
              </button>
              
              {expanded && (
                <div className="space-y-1 ml-3 pl-3 border-l border-border/50">
                  {participation.programNames.length === 0 ? (
                    <p className="text-[11px] text-disabled italic py-2">참여 중인 세부 과정이 없습니다.</p>
                  ) : participation.programNames.map(programName => {
                    const subCourse = getSubCourseByName(draftCompany.id, group.id, programName);
                    const subCourseId = subCourse?.id ?? `sc-${group.id}-${programName}`;
                    const subExpanded = expandedSubCourses.has(subCourseId);
                    
                    const subCourseDetail = group.details.find(d => d.name === programName);
                    const subSessions = subCourseDetail?.sessions || [];

                    return (
                      <div key={subCourseId} className="space-y-1">
                        <div className="flex items-center justify-between py-1.5 group/sub">
                          <div className="flex items-center gap-2">
                            <button 
                              type="button" 
                              className={`flex items-center gap-1.5 text-sm font-bold transition-colors ${subExpanded ? "text-brand-primary" : "text-secondary hover:text-primary"}`}
                              onClick={() => onToggleSubCourse(subCourseId)}
                            >
                              <ChevronRight size={14} strokeWidth={2.5} className={`transition-transform duration-200 ${subExpanded ? "rotate-90" : ""}`} />
                              {programName}
                            </button>
                            <button
                              type="button"
                              onClick={() => navigate(`/participants?search=${encodeURIComponent(draftCompany.companyName)}&tab=${encodeURIComponent(group.name)}`)}
                              className="text-[11px] text-tertiary hover:text-brand-primary hover:underline font-medium"
                            >
                              {subCourse?.participants.length ?? 0}명
                            </button>
                          </div>
                          <button 
                            type="button" 
                            className="p-1 text-tertiary hover:text-error hover:bg-error/5 rounded-lg transition-all opacity-0 group-hover/sub:opacity-100" 
                            onClick={() => onRemoveCourseProgram(group.name, programName)}
                          >
                            <Trash2 size={12} strokeWidth={2.5} />
                          </button>
                        </div>

                        {subExpanded && (
                          <div className="ml-5 space-y-2 py-2">
                            {subCourse?.participants.map(p => (
                              <div key={p.id} className="flex items-center justify-between group/p">
                                <div className="flex items-center gap-2">
                                  <span className="text-[13px] font-semibold text-primary">{p.name}</span>
                                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter ${p.completed ? "bg-brand-primary/10 text-brand-primary" : "bg-surface-subtle text-tertiary"}`}>
                                    {p.completed ? "COMPLETED" : "PENDING"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover/p:opacity-100 transition-opacity">
                                  <button 
                                    className="p-1 text-tertiary hover:text-brand-primary transition-colors" 
                                    onMouseEnter={e => onShowParticipantPopover(p, e)} 
                                    onMouseLeave={onHideParticipantPopover}
                                  >
                                    <Info size={12} strokeWidth={2.5} />
                                  </button>
                                  <button 
                                    className="p-1 text-tertiary hover:text-error transition-colors" 
                                    onClick={() => onRemoveParticipant(group.id, subCourseId, p.id)}
                                  >
                                    <X size={12} strokeWidth={2.5} />
                                  </button>
                                </div>
                              </div>
                            ))}
                            
                            <div className="pt-1">
                              {addParticipantSubCourseId === subCourseId ? (
                                <div className="space-y-2 p-3 bg-surface-subtle/50 rounded-2xl border border-brand-primary/20">
                                  <div className="flex items-center gap-2">
                                    <input 
                                      autoFocus 
                                      className="flex-1 px-2 py-1 text-sm font-semibold outline-none bg-transparent placeholder:text-disabled" 
                                      value={addParticipantDraft} 
                                      onChange={e => onAddParticipantDraftChange(e.target.value)} 
                                      onKeyDown={e => e.key === "Enter" && onConfirmAddParticipant(programName, group.id, addParticipantSessionId)} 
                                      placeholder="이름 입력..." 
                                    />
                                    <button 
                                      className="p-1.5 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-hover shadow-sm" 
                                      onClick={() => onConfirmAddParticipant(programName, group.id, addParticipantSessionId)}
                                    >
                                      <Check size={14} strokeWidth={2.5} />
                                    </button>
                                  </div>
                                  {subSessions.length > 0 && (
                                    <div className="pt-2 border-t border-border/30">
                                      <p className="text-[9px] font-black text-tertiary uppercase mb-2 ml-1">Session Select</p>
                                      <div className="flex flex-wrap gap-1.5">
                                        {subSessions.map((session, sidx) => (
                                          <button
                                            key={session.id}
                                            type="button"
                                            onClick={() => onAddParticipantSessionChange(session.id)}
                                            className={`px-3 py-1 rounded-xl text-[10px] font-bold border transition-all ${
                                              addParticipantSessionId === session.id
                                                ? "bg-brand-primary border-brand-primary text-white shadow-sm"
                                                : "bg-surface border-border/50 text-secondary hover:border-brand-primary/40"
                                            }`}
                                          >
                                            {sidx + 1}회차
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <button 
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-tertiary hover:text-brand-primary hover:bg-brand-primary/5 rounded-xl transition-all" 
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
    </DrawerSection>
  );
}
