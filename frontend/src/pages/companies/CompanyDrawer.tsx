import { X, PencilLine, Check, Plus, Trash2, Info, Mail, ChevronUp, ChevronDown, Building2, User, FileCheck } from "lucide-react";
import { StatusBadge } from "../../components";
import type { CompanyRecord } from "../../types/models";
import type { CourseGroup } from "./modals/CourseManagerModal";

interface SubCourseParticipant {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  completedCourses: number;
  totalCourses: number;
  completed: boolean;
}

interface SubCourseWithParticipants {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  totalHours: number;
  participants: SubCourseParticipant[];
}

export type CourseParticipantsMap = Record<
  string,
  Record<string, SubCourseWithParticipants>
>;

interface CompanyDrawerProps {
  draftCompany: CompanyRecord;
  drawerEditMode: boolean;
  drawerNotice: string;
  drawerNameEditing: boolean;
  drawerNameDraft: string;
  expandedDrawerGroups: Set<string>;
  expandedSubCourses: Set<string>;
  addParticipantSubCourseId: string | null;
  addParticipantDraft: string;
  isSaving: boolean;
  isClosing: boolean;
  courseGroups: CourseGroup[];
  onDrawerClose: () => void;
  onDrawerNameEditToggle: (editing: boolean) => void;
  onDrawerNameDraftChange: (name: string) => void;
  onUpdateDraftField: (field: keyof CompanyRecord, value: any) => void;
  onEnterEditMode: () => void;
  onCancelEdit: () => void;
  onSaveDraftCompany: () => void;
  onOpenAddCourseModal: () => void;
  onToggleDrawerGroup: (groupName: string) => void;
  onToggleSubCourse: (id: string) => void;
  onRemoveCourseProgram: (courseType: string, programName: string) => void;
  onAddParticipantClick: (subCourseId: string) => void;
  onAddParticipantDraftChange: (val: string) => void;
  onConfirmAddParticipant: (subCourseId: string, groupId: string) => void;
  onCancelAddParticipant: () => void;
  onRemoveParticipant: (groupId: string, subCourseId: string, ptId: string) => void;
  onShowParticipantPopover: (pt: SubCourseParticipant, e: React.MouseEvent) => void;
  onHideParticipantPopover: () => void;
  onOpenEmailModal: (ids: string[]) => void;
  getSubCourseByName: (companyId: string, groupId: string, name: string) => SubCourseWithParticipants | undefined;
  toDotDate: (val: string | undefined) => string;
  getToday: () => string;
  formatBusinessRegNo: (val: string) => string;
}

export function CompanyDrawer({
  draftCompany,
  drawerEditMode,
  drawerNotice,
  drawerNameEditing,
  drawerNameDraft,
  expandedDrawerGroups,
  expandedSubCourses,
  addParticipantSubCourseId,
  addParticipantDraft,
  isSaving,
  isClosing,
  courseGroups,
  onDrawerClose,
  onDrawerNameEditToggle,
  onDrawerNameDraftChange,
  onUpdateDraftField,
  onEnterEditMode,
  onCancelEdit,
  onSaveDraftCompany,
  onOpenAddCourseModal,
  onToggleDrawerGroup,
  onToggleSubCourse,
  onRemoveCourseProgram,
  onAddParticipantClick,
  onAddParticipantDraftChange,
  onConfirmAddParticipant,
  onRemoveParticipant,
  onShowParticipantPopover,
  onHideParticipantPopover,
  onOpenEmailModal,
  getSubCourseByName,
  toDotDate,
  getToday,
  formatBusinessRegNo,
}: CompanyDrawerProps) {
  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] transition-opacity duration-300 ${isClosing ? "opacity-0" : "opacity-100"}`}
        onClick={() => !drawerEditMode && onDrawerClose()} 
      />
      
      {/* Panel */}
      <div 
        className={`fixed top-0 right-0 h-full w-[520px] bg-white shadow-2xl z-[101] flex flex-col transition-transform duration-300 ease-out transform ${isClosing ? "translate-x-full" : "translate-x-0"}`}
        role="dialog" 
        aria-modal="true"
      >
        
        {/* HEADER */}
        <header className="sticky top-0 z-10 px-6 py-5 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            {drawerNameEditing ? (
              <div className="relative">
                <input
                  className="text-xl font-bold text-slate-800 bg-white border-b-2 border-emerald-500 outline-none w-full py-1 pr-8"
                  value={drawerNameDraft}
                  onChange={(e) => onDrawerNameDraftChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      onUpdateDraftField("companyName", drawerNameDraft);
                      onDrawerNameEditToggle(false);
                    } else if (e.key === "Escape") onDrawerNameEditToggle(false);
                  }}
                  onBlur={() => {
                    onUpdateDraftField("companyName", drawerNameDraft);
                    onDrawerNameEditToggle(false);
                  }}
                  autoFocus
                />
                <Check size={18} className="absolute right-0 top-1/2 -translate-y-1/2 text-emerald-500" />
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <h3 
                  className="text-xl font-bold text-slate-800 cursor-pointer"
                  onDoubleClick={() => onDrawerNameEditToggle(true)}
                >
                  {draftCompany.companyName || "신규 기업 등록"}
                </h3>
                <button
                  type="button"
                  className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  onClick={() => {
                    onDrawerNameDraftChange(draftCompany.companyName);
                    onDrawerNameEditToggle(true);
                  }}
                >
                  <PencilLine size={14} />
                </button>
              </div>
            )}
            <p className="flex items-center gap-1.5 text-sm text-slate-500">
              기업 상세 관리
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!drawerEditMode && (
              <button 
                type="button" 
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                onClick={onEnterEditMode}
              >
                <PencilLine size={14} /> 편집
              </button>
            )}
            <button 
              type="button" 
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              onClick={onDrawerClose}
            >
              <X size={20} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          {drawerNotice && (
            <div className="flex items-center gap-2.5 px-4 py-3 bg-blue-50 text-blue-700 rounded-2xl border border-blue-100 text-sm">
              <Info size={16} /> {drawerNotice}
            </div>
          )}

          {/* 기본 정보 섹션 */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <div className="p-1.5 bg-emerald-50 rounded-lg">
                <Building2 size={16} className="text-emerald-600" />
              </div>
              <h4 className="font-bold text-slate-800">기본 정보</h4>
            </div>
            
            <div className={`p-5 rounded-2xl border transition-all duration-200 ${drawerEditMode ? "bg-emerald-50/10 border-emerald-200 ring-4 ring-emerald-500/5" : "bg-slate-50/50 border-slate-100"}`}>
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">사업자번호</label>
                  {drawerEditMode ? (
                    <input 
                      className="w-full px-3 py-2 text-[15px] font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-mono tracking-tight"
                      value={draftCompany.businessRegNo} 
                      onChange={e => onUpdateDraftField("businessRegNo", formatBusinessRegNo(e.target.value))} 
                    />
                  ) : (
                    <div className="text-[15px] font-semibold text-slate-800 font-mono tracking-tight bg-white/50 px-3 py-2 rounded-lg border border-slate-100">
                      {draftCompany.businessRegNo || "-"}
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">대표자명</label>
                  {drawerEditMode ? (
                    <input 
                      className="w-full px-3 py-2 text-[15px] font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                      value={draftCompany.representative} 
                      onChange={e => onUpdateDraftField("representative", e.target.value)} 
                    />
                  ) : (
                    <div className="text-[15px] font-semibold text-slate-800 bg-white/50 px-3 py-2 rounded-lg border border-slate-100">
                      {draftCompany.representative || "-"}
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-5 space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">소재지</label>
                {drawerEditMode ? (
                  <input 
                    className="w-full px-3 py-2 text-[15px] font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    value={draftCompany.location} 
                    onChange={e => onUpdateDraftField("location", e.target.value)} 
                  />
                ) : (
                  <div className="text-[15px] font-semibold text-slate-800 bg-white/50 px-3 py-2 rounded-lg border border-slate-100">
                    {draftCompany.location || "-"}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* 담당자 정보 섹션 */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <div className="p-1.5 bg-emerald-50 rounded-lg">
                <User size={16} className="text-emerald-600" />
              </div>
              <h4 className="font-bold text-slate-800">담당자 정보</h4>
            </div>
            
            <div className={`p-5 rounded-2xl border transition-all duration-200 ${drawerEditMode ? "bg-emerald-50/10 border-emerald-200 ring-4 ring-emerald-500/5" : "bg-slate-50/50 border-slate-100"}`}>
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">담당자</label>
                  {drawerEditMode ? (
                    <input 
                      className="w-full px-3 py-2 text-[15px] font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                      value={draftCompany.manager} 
                      onChange={e => onUpdateDraftField("manager", e.target.value)} 
                    />
                  ) : (
                    <div className="text-[15px] font-semibold text-slate-800 bg-white/50 px-3 py-2 rounded-lg border border-slate-100">
                      {draftCompany.manager || "-"}
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">연락처</label>
                  {drawerEditMode ? (
                    <input 
                      className="w-full px-3 py-2 text-[15px] font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                      value={draftCompany.phone} 
                      onChange={e => onUpdateDraftField("phone", e.target.value)} 
                    />
                  ) : (
                    <div className="text-[15px] font-semibold text-slate-800 bg-white/50 px-3 py-2 rounded-lg border border-slate-100">
                      {draftCompany.phone || "-"}
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-5 space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">이메일</label>
                {drawerEditMode ? (
                  <input 
                    className="w-full px-3 py-2 text-[15px] font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    type="email" 
                    value={draftCompany.email} 
                    onChange={e => onUpdateDraftField("email", e.target.value)} 
                  />
                ) : (
                  <div className="text-[15px] font-semibold text-slate-800 bg-white/50 px-3 py-2 rounded-lg border border-slate-100">
                    {draftCompany.email || "-"}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* 협약 상태 섹션 */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <div className="p-1.5 bg-emerald-50 rounded-lg">
                <FileCheck size={16} className="text-emerald-600" />
              </div>
              <h4 className="font-bold text-slate-800">협약 상태</h4>
            </div>
            
            <div className={`p-5 rounded-2xl border transition-all duration-200 ${drawerEditMode ? "bg-emerald-50/10 border-emerald-200 ring-4 ring-emerald-500/5" : "bg-slate-50/50 border-slate-100"}`}>
              <div className="flex items-center justify-between">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">MOU 협약</label>
                  <div className="flex items-center gap-3">
                    {drawerEditMode ? (
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer"
                          checked={draftCompany.mouSigned} 
                          onChange={e => { 
                            onUpdateDraftField("mouSigned", e.target.checked); 
                            if (!e.target.checked) onUpdateDraftField("mouSignedDate", ""); 
                            else if (!draftCompany.mouSignedDate) onUpdateDraftField("mouSignedDate", getToday()); 
                          }} 
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                        <span className="ml-3 text-sm font-medium text-slate-600">{draftCompany.mouSigned ? "체결" : "미체결"}</span>
                      </label>
                    ) : (
                      <StatusBadge status={draftCompany.mouSigned ? "success" : "neutral"} label={draftCompany.mouSigned ? "협약 체결" : "미체결"} />
                    )}
                  </div>
                </div>
                {draftCompany.mouSigned && (
                  <div className="space-y-1.5 text-right">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">체결일</label>
                    {drawerEditMode ? (
                      <input 
                        className="px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm"
                        type="date" 
                        value={draftCompany.mouSignedDate ?? ""} 
                        onChange={e => onUpdateDraftField("mouSignedDate", e.target.value)} 
                      />
                    ) : (
                      <div className="text-[14px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                        {toDotDate(draftCompany.mouSignedDate)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* 교육 과정 섹션 */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-50 rounded-lg">
                  <ChevronDown size={16} className="text-emerald-600" />
                </div>
                <h4 className="font-bold text-slate-800">교육 과정</h4>
              </div>
              <button 
                type="button" 
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors" 
                onClick={onOpenAddCourseModal}
              >
                <Plus size={14} /> 추가
              </button>
            </div>

            <div className="space-y-3">
              {courseGroups.map((group) => {
                const participation = draftCompany.participations.find(p => p.courseType === group.name) ?? { courseType: group.name, enabled: false, programNames: [], status: "미참여" };
                const expanded = expandedDrawerGroups.has(group.name);
                return (
                  <div key={group.id} className="overflow-hidden">
                    <button 
                      type="button" 
                      className={`flex items-center justify-between w-full px-5 py-3.5 text-sm font-bold transition-all duration-200 border rounded-2xl ${expanded ? "bg-emerald-50 text-emerald-800 border-emerald-200 shadow-sm" : "bg-white text-slate-700 border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30"}`}
                      onClick={() => onToggleDrawerGroup(group.name)}
                    >
                      <span className="flex items-center gap-2.5">
                        <span className={`w-2 h-2 rounded-full ${expanded ? "bg-emerald-500" : "bg-slate-300"}`}></span>
                        {group.name} 
                        <span className={`px-2 py-0.5 rounded-full text-[11px] ${expanded ? "bg-emerald-200/50 text-emerald-800" : "bg-slate-100 text-slate-500"}`}>
                          {participation.programNames.length}
                        </span>
                      </span>
                      {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    
                    {expanded && (
                      <div className="mt-2 ml-4 pl-4 border-l-2 border-emerald-100 space-y-2 py-1">
                        {participation.programNames.length === 0 ? (
                          <p className="text-sm text-slate-400 py-2 pl-2">참여 과정 없음</p>
                        ) : participation.programNames.map(programName => {
                          const subCourse = getSubCourseByName(draftCompany.id, group.id, programName);
                          const subCourseId = subCourse?.id ?? `sc-${group.id}-${programName}`;
                          const subExpanded = expandedSubCourses.has(subCourseId);
                          return (
                            <div key={subCourseId} className="group/sub">
                              <div className="flex items-center justify-between p-1 hover:bg-slate-50 rounded-xl transition-colors">
                                <button 
                                  type="button" 
                                  className="flex-1 flex items-center gap-2 text-sm text-slate-600 font-medium py-1.5 px-2 text-left"
                                  onClick={() => onToggleSubCourse(subCourseId)}
                                >
                                  <span className={`text-xs transition-transform duration-200 ${subExpanded ? "rotate-90" : ""}`}>
                                    <ChevronRight size={14} />
                                  </span>
                                  <span className={subExpanded ? "text-emerald-700 font-semibold" : ""}>{programName}</span>
                                  <span className="text-[11px] text-slate-400 font-normal">
                                    {subCourse?.participants.length ?? 0}명
                                  </span>
                                </button>
                                <button 
                                  type="button" 
                                  className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover/sub:opacity-100" 
                                  onClick={() => onRemoveCourseProgram(group.name, programName)}
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>

                              {subExpanded && (
                                <div className="mt-1 ml-6 space-y-1 bg-slate-50/50 p-2 rounded-xl border border-slate-100/50">
                                  {subCourse?.participants.map(p => (
                                    <div key={p.id} className="flex items-center justify-between px-3 py-2 bg-white rounded-lg border border-slate-100 shadow-sm group/p">
                                      <span className="text-[13px] font-medium text-slate-700">{p.name}</span>
                                      <div className="flex items-center gap-3">
                                        <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${p.completed ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                                          {p.completed ? "수료" : "미수료"}
                                        </span>
                                        <div className="flex items-center gap-1 opacity-0 group-hover/p:opacity-100 transition-opacity">
                                          <button className="p-1 text-slate-400 hover:text-emerald-500 transition-colors" onMouseEnter={e => onShowParticipantPopover(p, e)} onMouseLeave={onHideParticipantPopover}>
                                            <Info size={12} />
                                          </button>
                                          <button className="p-1 text-slate-400 hover:text-red-500 transition-colors" onClick={() => onRemoveParticipant(group.id, subCourseId, p.id)}>
                                            <X size={12} />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                  <div className="pt-1 px-1">
                                    {addParticipantSubCourseId === subCourseId ? (
                                      <div className="flex items-center gap-2 p-1 bg-white rounded-lg border border-emerald-200">
                                        <input 
                                          autoFocus 
                                          className="flex-1 px-2 py-1 text-sm outline-none" 
                                          value={addParticipantDraft} 
                                          onChange={e => onAddParticipantDraftChange(e.target.value)} 
                                          onKeyDown={e => e.key === "Enter" && onConfirmAddParticipant(subCourseId, group.id)} 
                                          placeholder="참여자 이름..." 
                                        />
                                        <button className="p-1 text-emerald-600 hover:bg-emerald-50 rounded" onClick={() => onConfirmAddParticipant(subCourseId, group.id)}>
                                          <Check size={16} />
                                        </button>
                                      </div>
                                    ) : (
                                      <button 
                                        className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-slate-400 hover:text-emerald-600 hover:bg-emerald-50/50 rounded-lg transition-all border border-dashed border-slate-200 hover:border-emerald-200" 
                                        onClick={() => onAddParticipantClick(subCourseId)}
                                      >
                                        <Plus size={12} /> 참여자 추가
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
        </div>

        <footer className="sticky bottom-0 px-6 py-5 bg-white border-t border-slate-100 flex items-center gap-3">
          {drawerEditMode ? (
            <>
              <button 
                className="flex-1 py-3 text-[15px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all" 
                onClick={onCancelEdit}
              >
                취소
              </button>
              <button 
                className="flex-[2] py-3 text-[15px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-2xl transition-all shadow-lg shadow-emerald-200 active:scale-[0.98] disabled:opacity-50" 
                onClick={onSaveDraftCompany} 
                disabled={isSaving}
              >
                {isSaving ? "저장 중..." : "저장"}
              </button>
            </>
          ) : (
            <>
              <button 
                className="flex-1 flex items-center justify-center gap-2 py-3 text-[15px] font-bold text-emerald-700 border-2 border-emerald-100 hover:bg-emerald-50 rounded-2xl transition-all active:scale-[0.98]" 
                onClick={() => onOpenEmailModal([draftCompany.id])}
              >
                <Mail size={18} /> 이메일 발송
              </button>
              <button 
                className="px-8 py-3 text-[15px] font-bold text-slate-500 hover:bg-slate-50 rounded-2xl transition-all" 
                onClick={onDrawerClose}
              >
                닫기
              </button>
            </>
          )}
        </footer>
      </div>
    </>
  );
}

function ChevronRight({ size, className }: { size?: number, className?: string }) {
  return (
    <svg 
      width={size || 16} 
      height={size || 16} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
