import { useState, useMemo, useEffect } from "react";
import { Plus, Trash2, Check, Activity, Settings2, Target, Award, Users, ChevronDown, ChevronRight } from "lucide-react";
import { PageHeader } from "../../components";
import { useCourseStore, useParticipantStore, useToastStore } from "../../stores";
import { useCourseManager } from "../participants/hooks/useCourseManager";
import type { AudienceOption } from "../../types/models";
import { Calendar } from "../../components/ui/Calendar";
import { format } from "date-fns";

const AUDIENCE_OPTIONS: AudienceOption[] = [
  "재직자 (고용보험 가입)",
  "재직자 (고용보험 미가입)",
  "기업 대표",
  "임원",
  "미래인재",
];

const ADDING_NEW_DETAIL = "__new__";

export function CourseManagementPage() {
  const { courseGroups } = useCourseStore();
  const { participants } = useParticipantStore();
  const { addToast } = useToastStore();
  
  const {
    managerSelectedGroupId,
    managerExpandedGroups,
    managerGroupForm,
    setManagerGroupForm,
    managerDetailForm,
    setManagerDetailForm,
    managerEditingDetailId,
    setManagerEditingDetailId,
    managerMessage,
    managerError,
    setManagerError,
    pendingDeleteGroupId,
    setPendingDeleteGroupId,
    isManagerGroupModified,
    selectGroupForManager,
    startCreateCourseGroup,
    toggleManagerAudience,
    startAddDetail,
    startEditDetail,
    removeDetailFromForm,
    applyDetailDraft,
    saveCourseGroup,
    confirmDeleteCourseGroup,
    toggleManagerGroup,
  } = useCourseManager();

  useEffect(() => {
    if (managerError) {
      addToast(managerError, "error");
      setManagerError("");
    }
  }, [managerError, addToast, setManagerError]);

  const [selectedDetailId, setSelectedDetailId] = useState<string | null>(null);

  // Session Achievement Logic
  const getSessionStats = (detailName: string, sessionId: string) => {
    const enrollments = participants.flatMap(p => 
      p.enrollments.filter(e => e.subCourseName === detailName && e.sessionId === sessionId)
    );
    const achieved = enrollments.filter(e => e.status === "수료").length;
    return achieved;
  };

  const getSubCourseTotalAchieved = (detailName: string) => {
    const enrollments = participants.flatMap(p => 
      p.enrollments.filter(e => e.subCourseName === detailName)
    );
    return enrollments.filter(e => e.status === "수료").length;
  };

  const selectedDetail = useMemo(() => 
    managerGroupForm.details.find(d => d.id === selectedDetailId) || null
  , [managerGroupForm.details, selectedDetailId]);

  const addSession = () => {
    if (!managerDetailForm) return;
    const newSession = {
      id: `session-${Date.now()}-${managerDetailForm.sessions.length}`,
      startDate: "",
      endDate: "",
      totalHours: 0,
      targetOutcome: 0
    };
    setManagerDetailForm({
      ...managerDetailForm,
      sessions: [...managerDetailForm.sessions, newSession]
    });
  };

  const updateSession = (idx: number, updates: any) => {
    if (!managerDetailForm) return;
    const next = [...managerDetailForm.sessions];
    next[idx] = { ...next[idx], ...updates };
    setManagerDetailForm({ ...managerDetailForm, sessions: next });
  };

  const removeSession = (idx: number) => {
    if (!managerDetailForm) return;
    setManagerDetailForm({
      ...managerDetailForm,
      sessions: managerDetailForm.sessions.filter((_, i) => i !== idx)
    });
  };

  return (
    <div className="flex gap-6 h-full animate-in fade-in duration-500 pb-10">
      {/* Sidebar: Group List (Fixed Position) */}
      <aside className="w-[280px] bg-surface rounded-[32px] shadow-soft border border-border flex flex-col overflow-hidden shrink-0">
        <div className="p-6 space-y-4 border-b border-border">
          <p className="text-[11px] font-black text-tertiary uppercase tracking-widest px-1">과정 구분 리스트</p>
          <button
            type="button"
            className="w-full py-3 px-4 bg-brand-primary text-white rounded-2xl font-black transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-brand-primary/20 active:scale-95"
            onClick={startCreateCourseGroup}
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            <span>새 구분 추가</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {courseGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-tertiary gap-3 text-center">
              <Settings2 size={40} className="opacity-20" strokeWidth={2.5} />
              <p className="text-sm font-bold italic">등록된 과정이<br/>없습니다.</p>
            </div>
          ) : courseGroups.map((group) => {
            const isSelected = group.id === managerSelectedGroupId;
            const isExpanded = managerExpandedGroups.has(group.id);

            return (
              <div key={group.id} className="space-y-1">
                <button
                  type="button"
                  className={`w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all duration-200 ${
                    isSelected 
                      ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20" 
                      : "text-secondary hover:bg-surface-subtle"
                  }`}
                  onClick={() => { selectGroupForManager(group.id); setSelectedDetailId(null); }}
                >
                  <div 
                    className={`p-1 rounded-lg transition-colors ${isSelected ? "text-white/60 hover:bg-brand-primary-active" : "text-tertiary hover:bg-surface-subtle"}`}
                    onClick={(e) => toggleManagerGroup(group.id, e)}
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" strokeWidth={2.5} />
                    ) : (
                      <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
                    )}
                  </div>
                  <span className="flex-1 text-left font-black truncate text-[14px]">{group.name}</span>
                </button>
                {isExpanded && (
                  <ul className="ml-10 space-y-1 pr-2 pt-1 pb-2">
                    {group.details.map((detail) => (
                      <li
                        key={detail.id}
                        onClick={() => {
                          selectGroupForManager(group.id);
                          setSelectedDetailId(detail.id);
                          if (managerEditingDetailId !== detail.id) {
                            startEditDetail(group.id, detail.id);
                          }
                        }}
                        className={`text-[12px] font-bold py-1.5 px-3 rounded-xl border border-transparent truncate cursor-pointer transition-colors ${
                          selectedDetailId === detail.id 
                            ? "bg-brand-primary/10 text-brand-primary font-black" 
                            : "text-tertiary hover:text-secondary hover:bg-surface-subtle"
                        }`}
                      >
                        {detail.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </aside>

      {/* Main Content Area: Top-Down Row Layout */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto custom-scrollbar p-6">
        <PageHeader 
          title="교육 과정 관리" 
          actions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="px-6 py-2.5 bg-brand-primary text-white rounded-xl font-black hover:bg-brand-primary-hover transition-all shadow-lg shadow-brand-primary/20 active:scale-95 disabled:opacity-50"
                disabled={!isManagerGroupModified}
                onClick={saveCourseGroup}
              >
                변경 사항 전체 저장
              </button>
            </div>
          }
        />

        <div className="space-y-6 max-w-7xl mx-auto w-full">
          {/* Top Row: Course Group Settings */}
          <section className="bg-surface rounded-[32px] shadow-soft border border-border overflow-hidden">
            <header className="px-6 py-4 border-b border-border bg-surface-subtle/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-primary/10 text-brand-primary rounded-xl">
                  <Settings2 size={18} strokeWidth={2.5} />
                </div>
                <h4 className="text-base font-black text-primary tracking-tight">과정 구분 설정</h4>
              </div>
              <button
                type="button"
                className="p-2 text-tertiary hover:text-error hover:bg-error/10 rounded-xl transition-all"
                onClick={() => managerSelectedGroupId && setPendingDeleteGroupId(managerSelectedGroupId)}
                title="구분 삭제"
              >
                <Trash2 size={18} strokeWidth={2.5} />
              </button>
            </header>

            <div className="p-6 space-y-6">
              {managerMessage && (
                <div className={`p-4 rounded-2xl border bg-success/10 border-success/20 text-success text-sm font-black flex items-center gap-3 animate-in fade-in slide-in-from-top-2`}>
                  <div className={`w-2 h-2 rounded-full bg-success`} />
                  {managerMessage}
                </div>
              )}

              <div className="flex flex-wrap gap-8">
                <div className="flex-1 min-w-[300px] space-y-2.5">
                  <label className="text-[11px] font-black text-tertiary uppercase tracking-widest ml-1">과정 구분 이름</label>
                  <input
                    className="w-full px-5 py-3 rounded-2xl border border-border bg-surface text-primary focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all font-black text-base shadow-sm placeholder:text-tertiary"
                    value={managerGroupForm.name}
                    onChange={(e) => setManagerGroupForm({ ...managerGroupForm, name: e.target.value })}
                    placeholder="예: 훈련비과정, 지원비과정 등"
                  />
                </div>

                <div className="flex-[1.5] min-w-[400px] space-y-2.5">
                  <label className="text-[11px] font-black text-tertiary uppercase tracking-widest ml-1">지원 대상 설정</label>
                  <div className="flex flex-wrap gap-2 p-2.5 bg-surface-subtle rounded-2xl border border-border min-h-[54px]">
                    {AUDIENCE_OPTIONS.map((option) => {
                      const isChecked = managerGroupForm.audiences.includes(option);
                      return (
                        <label 
                          key={option} 
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all cursor-pointer group ${
                            isChecked 
                              ? "bg-brand-primary border-brand-primary text-white shadow-sm" 
                              : "bg-surface border-border text-secondary hover:border-brand-primary/50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={isChecked}
                            onChange={() => toggleManagerAudience(option)}
                          />
                          <span className={`text-[11px] font-black ${isChecked ? "text-white" : "text-secondary group-hover:text-primary"}`}>
                            {option}
                          </span>
                          {isChecked && <Check size={10} strokeWidth={3} className="text-white/80" />}
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Sub-program Mini List Row */}
              <div className="space-y-4 pt-6 border-t border-border">
                <div className="flex items-center justify-between px-1">
                  <p className="text-[11px] font-black text-tertiary uppercase tracking-widest">세부 프로그램 구성 목록</p>
                  <button
                    type="button"
                    className="flex items-center gap-1.5 px-4 py-2 bg-brand-primary text-white rounded-xl text-[10px] font-black hover:bg-brand-primary-hover transition-all active:scale-95 shadow-lg shadow-brand-primary/10 uppercase tracking-wider"
                    onClick={startAddDetail}
                  >
                    <Plus size={14} strokeWidth={2.5} /> 프로그램 추가
                  </button>
                </div>

                <div className="flex flex-wrap gap-4">
                  {managerGroupForm.details.length === 0 ? (
                    <div className="w-full py-10 text-center bg-surface-subtle rounded-[28px] border border-dashed border-border">
                      <p className="text-tertiary text-sm font-bold italic">등록된 세부 과정이 없습니다.</p>
                    </div>
                  ) : managerGroupForm.details.map((detail) => {
                    const achieved = getSubCourseTotalAchieved(detail.name);
                    const rate = detail.targetOutcome > 0 ? Math.round((achieved / detail.targetOutcome) * 100) : 0;
                    const isSelected = detail.id === selectedDetailId;

                    return (
                      <div 
                        key={detail.id}
                        className={`min-w-[260px] p-5 rounded-[28px] border transition-all cursor-pointer group relative shrink-0 ${
                          isSelected 
                            ? "bg-brand-primary border-brand-primary text-white shadow-xl scale-[1.02]" 
                            : "bg-surface border-border hover:border-brand-primary/30 hover:bg-brand-primary/5"
                        }`}
                        onClick={() => {
                          setSelectedDetailId(detail.id);
                          if (managerEditingDetailId !== detail.id) {
                            startEditDetail(managerSelectedGroupId ?? "", detail.id);
                          }
                        }}
                      >
                        <div className="flex justify-between items-center mb-4">
                          <h5 className={`text-[14px] font-black leading-tight ${isSelected ? "text-white" : "text-primary"}`}>
                            {detail.name}
                          </h5>
                          <div className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${isSelected ? "bg-brand-primary text-white" : "bg-brand-primary/10 text-brand-primary"}`}>
                            {rate}%
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-1.5">
                            <Target size={12} strokeWidth={2.5} className={isSelected ? "text-brand-primary-hover" : "text-tertiary"} />
                            <span className="text-[11px] font-black">{detail.targetOutcome}명</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Award size={12} strokeWidth={2.5} className={isSelected ? "text-brand-primary-hover" : "text-tertiary"} />
                            <span className="text-[11px] font-black">{achieved}명</span>
                          </div>
                          <div className="flex-1" />
                          <button
                            type="button"
                            className={`p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100 ${isSelected ? "text-white/60 hover:bg-white/10 hover:text-white" : "text-tertiary hover:text-error hover:bg-error/10"}`}
                            onClick={(e) => { e.stopPropagation(); removeDetailFromForm(managerSelectedGroupId ?? "", detail.id); if (selectedDetailId === detail.id) setSelectedDetailId(null); }}
                          >
                            <Trash2 size={12} strokeWidth={2.5} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* Bottom Row: Selected Sub-program Detail View & Sessions */}
          <section className="bg-surface rounded-[32px] shadow-soft border border-border overflow-hidden animate-in slide-in-from-bottom-4 duration-500 min-h-[400px]">
            {selectedDetail || managerEditingDetailId === ADDING_NEW_DETAIL ? (
              <>
                <header className="px-6 py-4 border-b border-border bg-surface-subtle/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-info/10 text-info rounded-xl">
                      <Activity size={18} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h4 className="text-base font-black text-primary tracking-tight">세부 과정 상세 및 회차 관리</h4>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className="flex items-center gap-1.5 px-4 py-2 bg-info text-white rounded-xl text-[10px] font-black hover:bg-info/80 transition-all active:scale-95 shadow-lg shadow-info/10 uppercase tracking-wider"
                      onClick={addSession}
                    >
                      <Plus size={14} strokeWidth={2.5} /> 회차 추가
                    </button>
                  </div>
                </header>

                <div className="p-6">
                  {managerDetailForm && (
                    <div className="space-y-8">
                      <div className="flex items-end gap-6">
                        <div className="flex-1 space-y-2">
                          <label className="text-[11px] font-black text-tertiary uppercase tracking-widest ml-1">세부 과정명</label>
                          <input
                            className="w-full px-5 py-3 rounded-2xl border border-border bg-surface text-primary focus:outline-none focus:ring-4 focus:ring-info/10 focus:border-info transition-all font-black text-base shadow-sm placeholder:text-tertiary"
                            value={managerDetailForm.name}
                            onChange={(e) => setManagerDetailForm({ ...managerDetailForm, name: e.target.value })}
                            placeholder="과정 이름을 입력하세요"
                          />
                        </div>
                        <div className="w-[110px] bg-info/5 p-3.5 rounded-2xl border border-info/10 text-center">
                          <span className="block text-[8px] font-black text-info/60 uppercase tracking-widest mb-1">Total Sessions</span>
                          <span className="text-lg font-black text-info">{managerDetailForm.sessions.length}</span>
                        </div>
                      </div>

                      {/* Sessions Row-based Management Table */}
                      <div className="bg-surface border border-border rounded-[32px] shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-surface-subtle/80 border-b border-border">
                              <th className="px-5 py-3 text-[10px] font-black text-tertiary uppercase tracking-widest w-[70px] text-center">회차</th>
                              <th className="px-5 py-3 text-[10px] font-black text-tertiary uppercase tracking-widest min-w-[260px]">교육 기간</th>
                              <th className="px-5 py-3 text-[10px] font-black text-tertiary uppercase tracking-widest text-center">시간</th>
                              <th className="px-5 py-3 text-[10px] font-black text-tertiary uppercase tracking-widest text-center">목표</th>
                              <th className="px-5 py-3 text-[10px] font-black text-tertiary uppercase tracking-widest text-center">수료</th>
                              <th className="px-5 py-3 text-[10px] font-black text-tertiary uppercase tracking-widest text-center">달성률</th>
                              <th className="px-5 py-3 w-[50px]" />
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/50">
                            {managerDetailForm.sessions.map((session, idx) => {
                              const achv = getSessionStats(managerDetailForm.name, session.id);
                              const rate = session.targetOutcome > 0 ? Math.round((achv / session.targetOutcome) * 100) : 0;
                              
                              return (
                                <tr key={session.id} className="hover:bg-surface-subtle transition-colors">
                                  <td className="px-6 py-4 text-center">
                                    <span className="text-sm font-black text-primary bg-surface-subtle w-7 h-7 inline-flex items-center justify-center rounded-lg">{idx + 1}</span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <Calendar 
                                      value={{
                                        start: session.startDate ? new Date(session.startDate) : null,
                                        end: session.endDate ? new Date(session.endDate) : null
                                      }}
                                      onChange={(val) => updateSession(idx, {
                                        startDate: val?.start ? format(val.start, "yyyy-MM-dd") : "",
                                        endDate: val?.end ? format(val.end, "yyyy-MM-dd") : ""
                                      })}
                                      placeholder="기간 선택"
                                    />
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    <div className="flex items-center justify-center gap-1.5">
                                      <input 
                                        type="number"
                                        className="w-16 px-2 py-1.5 border border-border rounded-xl text-[13px] font-black text-center focus:ring-4 focus:ring-info/10 outline-none text-primary"
                                        value={session.totalHours}
                                        onChange={(e) => updateSession(idx, { totalHours: Number(e.target.value) })}
                                      />
                                      <span className="text-[10px] font-bold text-tertiary">H</span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    <div className="flex items-center justify-center gap-1.5">
                                      <input 
                                        type="number"
                                        className="w-16 px-2 py-1.5 border border-brand-primary/20 rounded-xl text-[13px] font-black text-center text-brand-primary focus:ring-4 focus:ring-info/10 outline-none"
                                        value={session.targetOutcome}
                                        onChange={(e) => updateSession(idx, { targetOutcome: Number(e.target.value) })}
                                      />
                                      <span className="text-[10px] font-bold text-tertiary">명</span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    <div className="flex flex-col items-center gap-0.5">
                                      <span className="text-[15px] font-black text-primary">{achv}</span>
                                      <p className="text-[9px] font-bold text-tertiary uppercase tracking-tighter">Current</p>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    <div className="flex flex-col items-center gap-1.5">
                                      <span className={`text-[13px] font-black ${rate >= 100 ? "text-success" : "text-primary"}`}>{rate}%</span>
                                      <div className="w-16 h-1 bg-surface-subtle rounded-full overflow-hidden">
                                        <div className="h-full bg-brand-primary" style={{ width: `${Math.min(100, rate)}%` }} />
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <button
                                      type="button"
                                      className="p-2 text-tertiary hover:text-error hover:bg-error/10 rounded-xl transition-all"
                                      onClick={() => removeSession(idx)}
                                    >
                                      <Trash2 size={16} strokeWidth={2.5} />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        {managerDetailForm.sessions.length === 0 && (
                          <div className="py-16 text-center">
                            <Users size={32} strokeWidth={2.5} className="text-tertiary/20 mx-auto mb-3" />
                            <p className="text-tertiary text-sm font-bold">등록된 회차가 없습니다. 상단의 '회차 추가' 버튼을 눌러주세요.</p>
                          </div>
                        )}
                      </div>

                      {/* Footer Actions */}
                      <footer className="pt-6 flex gap-4 border-t border-border">
                        <button
                          type="button"
                          className="flex-1 py-4.5 bg-brand-primary text-white rounded-[24px] font-black hover:bg-brand-primary/90 transition-all shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex items-center justify-center gap-3 active:scale-[0.98]"
                          onClick={() => {
                            if (applyDetailDraft()) {
                              setSelectedDetailId(null);
                            }
                          }}
                        >
                          <Check size={22} strokeWidth={3} className="text-success" />
                          <span>프로그램 구성 내용 적용하기</span>
                        </button>
                        <button
                          type="button"
                          className="px-8 py-4.5 bg-surface-subtle text-secondary rounded-[24px] font-bold hover:bg-surface-subtle/85 transition-all"
                          onClick={() => { setManagerDetailForm(null); setManagerEditingDetailId(null); setSelectedDetailId(null); }}
                        >
                          취소
                        </button>
                      </footer>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-20 text-center space-y-6">
                <div className="w-24 h-24 bg-surface-subtle rounded-[40px] flex items-center justify-center text-tertiary/20 animate-pulse">
                  <Activity size={48} strokeWidth={2.5} />
                </div>
                <div className="space-y-2">
                  <h4 className="text-xl font-black text-primary tracking-tight">세부 프로그램 정보를 구성해 주세요</h4>
                  <p className="text-[13px] text-tertiary font-medium leading-relaxed max-w-xs mx-auto">
                    상단 탭에서 구분 그룹을 선택하거나<br/>
                    <span className="text-brand-primary font-bold">'프로그램 추가'</span> 버튼을 눌러 새로운 과정을 설계할 수 있습니다.
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Confirmation Modals */}
      {pendingDeleteGroupId && (
        <div className="fixed inset-0 bg-primary/40 flex items-center justify-center z-[200] p-4 animate-in fade-in duration-200">
          <div className="bg-surface rounded-[40px] p-10 shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200 text-center">
            <div className="w-16 h-16 bg-error/10 text-error rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Trash2 size={32} strokeWidth={2.5} />
            </div>
            <h3 className="text-2xl font-black text-primary mb-2">과정 구분 삭제</h3>
            <p className="text-secondary font-bold mb-10 leading-relaxed">
              이 과정 구분을 삭제하시겠습니까? <br/>
              <span className="text-error font-black">* 소속된 모든 세부 과정 및 데이터가 영구 삭제됩니다.</span>
            </p>
            <div className="flex gap-4">
              <button 
                className="flex-1 py-4.5 bg-surface-subtle hover:bg-surface-subtle/85 text-secondary rounded-2xl font-black transition-all"
                onClick={() => setPendingDeleteGroupId(null)}
              >
                아니오, 취소
              </button>
              <button 
                className="flex-1 py-4.5 bg-error hover:bg-error/90 text-white rounded-2xl font-black transition-all shadow-xl shadow-error/20 active:scale-95"
                onClick={() => { confirmDeleteCourseGroup(); setSelectedDetailId(null); }}
              >
                네, 삭제합니다
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
