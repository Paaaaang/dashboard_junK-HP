import { useState, useMemo, useEffect } from "react";
import { Plus, Trash2, Check, Activity, Settings2, Target, Award, ChevronDown, ChevronRight, LayoutList, FileText, X } from "lucide-react";
import { PageHeader } from "@/components";
import { useCourseStore, useParticipantStore, useToastStore } from "@/stores";
import { useCourseManager } from "@/pages/participants/hooks/useCourseManager";
import type { AudienceOption } from "@/types/models";
import { Calendar } from "@/components/ui/Calendar";
import { format } from "date-fns";
import { CourseStatusTable } from "@/pages/education/CourseStatusTable";
import { CertificateTemplatePage } from "@/pages/education/certificates";

const AUDIENCE_OPTIONS: AudienceOption[] = [
  "재직자 (고용보험 가입)",
  "재직자 (고용보험 미가입)",
  "기업 대표",
  "임원",
  "미래인재",
];

const ADDING_NEW_DETAIL = "__new__";

export function CourseManagementPage() {
  const [activeTab, setActiveTab] = useState<"status" | "settings">("status");
  const { courseGroups } = useCourseStore();
  const { participants } = useParticipantStore();
  const { addToast } = useToastStore();
  const [isSaving, setIsSaving] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);

  const {
    managerSelectedGroupId,
    managerExpandedGroups,
    managerGroupForm,
    setManagerGroupForm,
    managerDetailForm,
    setManagerDetailForm,
    managerEditingDetailId,
    setManagerEditingDetailId,
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

  const sortedCourseGroups = useMemo(() => {
    return [...courseGroups].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateA - dateB;
    });
  }, [courseGroups]);

  const sortedDetails = useMemo(() => {
    return [...(managerGroupForm?.details || [])].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateA - dateB;
    });
  }, [managerGroupForm?.details]);

  const [selectedDetailId, setSelectedDetailId] = useState<string | null>(null);
  const [pendingDeleteDetail, setPendingDeleteDetail] = useState<{groupId: string, detailId: string, detailName: string} | null>(null);

  const getSessionStats = (detailName: string, sessionId: string) => {
    const enrollments = participants.flatMap(p =>
      p.enrollments.filter(e => e.subCourseName === detailName && e.sessionId === sessionId)
    );
    return enrollments.filter(e => e.status === "수료").length;
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
    setManagerDetailForm({ ...managerDetailForm, sessions: [...managerDetailForm.sessions, newSession] });
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

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveCourseGroup();
    } finally {
      setIsSaving(false);
    }
  };

  const showDetailSection = !!(selectedDetail || managerEditingDetailId === ADDING_NEW_DETAIL);

  return (
    <div className="flex flex-col gap-6 h-full pb-10 animate-in fade-in duration-500">
      <PageHeader
        title="교육 과정 관리"
        className="sticky top-0 z-20 bg-background/95 backdrop-blur-md -mx-4 px-4 sm:-mx-6 sm:px-6 pt-4 sm:pt-6"
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCertModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-secondary border border-border rounded-xl hover:bg-surface-subtle hover:text-primary transition-colors"
            >
              <FileText size={14} />
              수료증 양식
            </button>
            {activeTab === "settings" && isManagerGroupModified && (
              <button
                type="button"
                className="btn btn-primary h-10 px-5 gap-2 shadow-lg shadow-brand-primary/20 animate-in fade-in zoom-in-95 duration-300"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Check size={16} strokeWidth={3} />
                )}
                <span className="text-sm font-bold tabular-nums">변경 사항 전체 저장</span>
              </button>
            )}
            <div className="flex bg-surface-subtle p-1 rounded-xl border border-border/50 shadow-inner">
              <button 
                onClick={() => setActiveTab("status")} 
                className={`px-4 py-1.5 text-[11px] font-black rounded-lg transition-all flex items-center gap-1.5 tracking-widest ${activeTab === "status" ? "bg-surface shadow-sm text-brand-primary" : "text-tertiary hover:text-secondary"}`}
              >
                <LayoutList size={14} />
                교육 현황
              </button>
              <button 
                onClick={() => setActiveTab("settings")} 
                className={`px-4 py-1.5 text-[11px] font-black rounded-lg transition-all flex items-center gap-1.5 tracking-widest ${activeTab === "settings" ? "bg-surface shadow-sm text-brand-primary" : "text-tertiary hover:text-secondary"}`}
              >
                <Settings2 size={14} />
                과정 설정
              </button>
            </div>
          </div>
        }
      />

      {activeTab === "status" && (
        <div className="px-4 sm:px-6 max-w-[1600px] mx-auto w-full">
          <CourseStatusTable />
        </div>
      )}

      {activeTab === "settings" && (
        <div className="flex flex-col lg:flex-row gap-8 px-4 sm:px-6 min-h-0 flex-1">
          {/* Sidebar: Group List */}
          <aside className="w-full lg:w-[280px] flex flex-col shrink-0">
            <div className="bg-surface rounded-2xl border border-border/40 shadow-sm flex flex-col h-full overflow-hidden">
              <div className="p-6 space-y-4 border-b border-border/40 bg-surface-subtle/30">
                <p className="text-[10px] font-black text-tertiary uppercase tracking-[0.2em] px-1 opacity-60">과정 그룹 리스트</p>
                <button
                  type="button"
                  className="w-full py-2.5 px-4 bg-surface border border-border/60 hover:border-cta hover:bg-cta/5 text-secondary hover:text-cta rounded-xl font-bold text-[13px] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm group"
                  onClick={startCreateCourseGroup}
                >
                  <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" strokeWidth={3} />
                  <span>새 구분 추가</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
                {courseGroups.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-tertiary gap-3 text-center">
                    <Settings2 size={40} className="opacity-10" strokeWidth={2} />
                    <p className="text-[12px] font-bold italic opacity-40 leading-relaxed tracking-wider">등록된 과정이<br />없습니다.</p>
                  </div>
                ) : sortedCourseGroups.map((group) => {
                  const isSelected = group.id === managerSelectedGroupId;
                  const isExpanded = managerExpandedGroups.has(group.id);

                  return (
                    <div key={group.id} className="space-y-1">
                      <button
                        type="button"
                        className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl transition-all cursor-pointer group/item ${
                          isSelected ? "bg-surface-subtle border border-border/40" : "hover:bg-surface-subtle/50"
                        }`}
                        onClick={() => { selectGroupForManager(group.id); setSelectedDetailId(null); }}
                      >
                        <span
                          className={`p-1 rounded-lg cursor-pointer transition-colors ${isSelected ? "text-brand-primary" : "text-tertiary opacity-40 hover:opacity-100"}`}
                          onClick={(e) => { e.stopPropagation(); toggleManagerGroup(group.id, e); }}
                        >
                          {isExpanded ? <ChevronDown size={14} strokeWidth={3} /> : <ChevronRight size={14} strokeWidth={3} />}
                        </span>
                        <span className={`flex-1 text-left truncate text-[13px] tracking-tight ${isSelected ? "font-black text-primary" : "font-bold text-secondary"}`}>
                          {group.name}
                        </span>
                      </button>

                      {isExpanded && (
                        <div className="ml-7 pl-3 border-l-2 border-border/20 space-y-1 py-1">
                          {group.details.map((detail) => (
                            <button
                              key={detail.id}
                              onClick={() => {
                                selectGroupForManager(group.id);
                                setSelectedDetailId(detail.id);
                                if (managerEditingDetailId !== detail.id) {
                                  startEditDetail(group.id, detail.id);
                                }
                              }}
                              className={`w-full text-left text-[12px] py-1.5 px-3 rounded-lg truncate cursor-pointer transition-all ${
                                selectedDetailId === detail.id
                                  ? "bg-brand-primary/5 text-brand-primary font-black shadow-sm"
                                  : "text-tertiary font-bold hover:text-secondary hover:bg-surface-subtle"
                              }`}
                            >
                              {detail.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 flex flex-col min-w-0 overflow-y-auto custom-scrollbar pb-10 px-1">
            <div className="space-y-16 max-w-6xl w-full mx-auto">
              
              {/* Group Base Settings */}
              <section className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <header className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-surface-subtle border border-border/40 flex items-center justify-center text-secondary shadow-sm">
                      <Settings2 size={20} strokeWidth={2} />
                    </div>
                    <div>
                      <h4 className="text-2xl font-black text-primary tracking-tight">과정 구분 설정</h4>
                      <p className="text-[11px] font-black text-tertiary uppercase tracking-widest mt-1 opacity-50">기본 정보 및 지원 대상 설정</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="p-2.5 rounded-xl text-tertiary hover:text-error hover:bg-error/5 transition-all cursor-pointer opacity-40 hover:opacity-100"
                    onClick={() => managerSelectedGroupId && setPendingDeleteGroupId(managerSelectedGroupId)}
                  >
                    <Trash2 size={20} strokeWidth={2} />
                  </button>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-[1.2fr_2fr] gap-10 items-start">
                  <div className="form-group space-y-3">
                    <label className="text-[10px] font-black text-tertiary uppercase tracking-widest ml-1 opacity-60">과정 구분 명칭</label>
                    <input
                      className="form-input bg-surface h-12 text-sm font-bold border-border/60 focus:border-brand-primary"
                      value={managerGroupForm.name}
                      onChange={(e) => setManagerGroupForm({ ...managerGroupForm, name: e.target.value })}
                      placeholder="예: 지원비과정"
                    />
                  </div>

                  <div className="form-group space-y-3">
                    <label className="text-[10px] font-black text-tertiary uppercase tracking-widest ml-1 opacity-60">주요 지원 대상</label>
                    <div className="flex flex-wrap gap-2">
                      {AUDIENCE_OPTIONS.map((option) => {
                        const isChecked = managerGroupForm.audiences.includes(option);
                        return (
                          <label
                            key={option}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all cursor-pointer ${
                              isChecked 
                                ? "bg-cta border-cta text-white shadow-md shadow-cta/20" 
                                : "bg-surface border-border/60 text-secondary hover:border-secondary text-[12px] font-bold"
                            }`}
                          >
                            <input type="checkbox" className="sr-only" checked={isChecked} onChange={() => toggleManagerAudience(option)} />
                            <span className="text-[12px] font-bold">{option}</span>
                            {isChecked && <Check size={12} strokeWidth={4} />}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Program List (Skeleton Style Adding) */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 ml-1">
                    <LayoutList size={14} className="text-cta" />
                    <h5 className="text-sm font-black text-primary uppercase tracking-tight">세부 프로그램 구성 목록</h5>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                    {sortedDetails.map((detail) => {
                      const ach = getSubCourseTotalAchieved(detail.name);
                      const target = detail.targetOutcome || 0;
                      const rate = target > 0 ? Math.round((ach / target) * 100) : 0;
                      const isSel = detail.id === selectedDetailId;

                      return (
                        <div
                          key={detail.id}
                          className={`p-4 rounded-xl transition-all cursor-pointer group border-2 ${
                            isSel
                              ? "bg-surface-subtle border-brand-primary shadow-md ring-4 ring-brand-primary/5"
                              : "bg-surface border-transparent hover:bg-surface-subtle/50 hover:border-border/40"
                          }`}
                          onClick={() => {
                            setSelectedDetailId(detail.id);
                            if (managerEditingDetailId !== detail.id) startEditDetail(managerSelectedGroupId ?? "", detail.id);
                          }}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <h5 className={`text-sm leading-tight break-keep flex-1 pr-2 ${isSel ? "font-black text-brand-primary" : "font-bold text-primary"}`}>
                              {detail.name}
                            </h5>
                            <button
                              type="button"
                              className="p-1 rounded-lg text-tertiary hover:text-error hover:bg-error/5 transition-all opacity-0 group-hover:opacity-100 cursor-pointer -mt-1 -mr-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPendingDeleteDetail({ groupId: managerSelectedGroupId ?? "", detailId: detail.id, detailName: detail.name });
                              }}
                            >
                              <Trash2 size={14} strokeWidth={2.5} />
                            </button>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 opacity-50">
                              <Target size={10} strokeWidth={3} />
                              <span className="text-[11px] font-black tabular-nums">{detail.targetOutcome}</span>
                            </div>
                            <div className="flex items-center gap-1 opacity-50">
                              <Award size={10} strokeWidth={3} />
                              <span className="text-[11px] font-black tabular-nums">{ach}</span>
                            </div>
                            <div className="flex-1" />
                            <div className={`px-2 py-0.5 rounded text-[9px] font-black tabular-nums ${
                              isSel ? "bg-brand-primary/10 text-brand-primary" : "bg-border/30 text-tertiary"
                            }`}>
                              {rate}%
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    <button
                      type="button"
                      className={`p-4 rounded-xl border-2 border-dashed border-border/40 bg-transparent hover:bg-surface-subtle hover:border-cta/40 hover:bg-cta/[0.02] transition-all cursor-pointer flex flex-col items-center justify-center min-h-[100px] group ${sortedDetails.length === 0 ? 'col-span-full py-12' : ''}`}
                      onClick={startAddDetail}
                    >
                      <div className="w-8 h-8 rounded-full bg-surface-subtle group-hover:bg-cta/10 group-hover:scale-110 flex items-center justify-center mb-2 transition-all border border-border/20 group-hover:border-cta/20">
                        <Plus className="text-tertiary group-hover:text-cta w-4 h-4" strokeWidth={3} />
                      </div>
                      <p className="text-[12px] font-black text-tertiary group-hover:text-cta tracking-tight">
                        {sortedDetails.length === 0 ? "첫 번째 세부 프로그램을 설계하세요" : "새 프로그램 추가"}
                      </p>
                    </button>
                  </div>
                </div>
              </section>

              {/* Contextual Detail & Session Management */}
              {showDetailSection && (
                <section className="space-y-10 pt-16 border-t border-border/40 animate-in fade-in slide-in-from-top-4 duration-700">
                  <header className="flex items-center gap-4 px-1">
                    <div className="w-10 h-10 rounded-xl bg-cta/5 border border-cta/20 flex items-center justify-center text-cta shadow-sm">
                      <Activity size={20} strokeWidth={2} />
                    </div>
                    <div>
                      <h4 className="text-2xl font-black text-primary tracking-tight">상세 구성 및 회차 관리</h4>
                      <p className="text-[10px] font-black text-cta uppercase tracking-[0.2em] mt-1 opacity-70">실시간 편집 중 (Editing)</p>
                    </div>
                  </header>

                  {managerDetailForm && (
                    <div className="space-y-12">
                      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8 items-end">
                        <div className="form-group space-y-3">
                          <label className="text-[10px] font-black text-tertiary uppercase tracking-widest ml-1 opacity-60">세부 과정 명칭</label>
                          <input
                            className="form-input bg-surface h-14 text-base font-black border-border/40 focus:border-cta"
                            value={managerDetailForm.name}
                            onChange={(e) => setManagerDetailForm({ ...managerDetailForm, name: e.target.value })}
                            placeholder="예: AI 기초 역량 강화 과정"
                          />
                        </div>
                        <div className="p-5 px-10 rounded-2xl bg-surface shadow-sm border border-border/40 text-center flex flex-col justify-center min-w-[140px]">
                          <span className="block text-[9px] font-black text-tertiary tracking-[0.2em] mb-1 opacity-50">총 회차 수</span>
                          <span className="text-2xl font-black text-primary tabular-nums">{managerDetailForm.sessions.length}회</span>
                        </div>
                      </div>

                      <div className="bg-surface rounded-2xl border border-border/40 overflow-hidden shadow-xl shadow-brand-dark/5">
                        <div className="overflow-x-auto custom-scrollbar">
                          <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead>
                              <tr className="bg-surface-subtle/40 border-b border-border/40">
                                <th className="px-6 py-4 text-[10px] font-black text-tertiary uppercase tracking-widest w-20 text-center">번호</th>
                                <th className="px-6 py-4 text-[10px] font-black text-tertiary uppercase tracking-widest min-w-[320px]">교육 일정 (Education Period)</th>
                                <th className="px-6 py-4 text-[10px] font-black text-tertiary uppercase tracking-widest text-center w-32">시간 (Hours)</th>
                                <th className="px-6 py-4 text-[10px] font-black text-tertiary uppercase tracking-widest text-center w-32">목표 (Target)</th>
                                <th className="px-6 py-4 text-[10px] font-black text-tertiary uppercase tracking-widest text-center">진행 현황</th>
                                <th className="px-6 py-4 w-20" />
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/20">
                              {managerDetailForm.sessions.map((session, idx) => {
                                const achv = getSessionStats(managerDetailForm.name, session.id);
                                const rate = session.targetOutcome > 0 ? Math.round((achv / session.targetOutcome) * 100) : 0;

                                return (
                                  <tr key={session.id} className="group hover:bg-surface-subtle/20 transition-colors">
                                    <td className="px-6 py-6 text-center">
                                      <span className="text-xs font-black text-tertiary opacity-40 tabular-nums">0{idx + 1}</span>
                                    </td>
                                    <td className="px-6 py-6">
                                      <Calendar
                                        value={{
                                          start: session.startDate ? new Date(session.startDate) : null,
                                          end: session.endDate ? new Date(session.endDate) : null
                                        }}
                                        onChange={(val) => updateSession(idx, {
                                          startDate: val?.start ? format(val.start, "yyyy-MM-dd") : "",
                                          endDate: val?.end ? format(val.end, "yyyy-MM-dd") : ""
                                        })}
                                      />
                                    </td>
                                    <td className="px-6 py-6">
                                      <div className="flex items-center justify-center gap-2">
                                        <input
                                          type="number"
                                          className="w-16 py-1.5 bg-surface-subtle border border-border/40 rounded-lg text-center text-sm font-bold tabular-nums"
                                          value={session.totalHours === 0 ? "" : session.totalHours}
                                          onChange={(e) => updateSession(idx, { totalHours: Number(e.target.value) || 0 })}
                                          onFocus={(e) => e.target.select()}
                                          placeholder="0"
                                        />
                                        <span className="text-[10px] font-black text-tertiary uppercase opacity-60">H</span>
                                      </div>
                                    </td>
                                    <td className="px-6 py-6">
                                      <div className="flex items-center justify-center gap-2">
                                        <input
                                          type="number"
                                          className="w-16 py-1.5 bg-surface-subtle border border-border/40 rounded-lg text-center text-sm font-black text-cta tabular-nums"
                                          value={session.targetOutcome === 0 ? "" : session.targetOutcome}
                                          onChange={(e) => updateSession(idx, { targetOutcome: Number(e.target.value) || 0 })}
                                          onFocus={(e) => e.target.select()}
                                          placeholder="0"
                                        />
                                        <span className="text-[10px] font-black text-tertiary uppercase opacity-60">명</span>
                                      </div>
                                    </td>
                                    <td className="px-6 py-6">
                                      <div className="flex flex-col items-center gap-2">
                                        <div className="flex items-center gap-3">
                                          <span className="text-[11px] font-black text-secondary tabular-nums">{achv} / {session.targetOutcome}</span>
                                          <span className={`text-[11px] font-black tabular-nums ${rate >= 100 ? "text-cta" : "text-primary"}`}>{rate}%</span>
                                        </div>
                                        <div className="w-32 h-1.5 bg-border/20 rounded-full overflow-hidden">
                                          <div className={`h-full transition-all duration-700 ${rate >= 100 ? "bg-cta" : "bg-brand-primary"}`} style={{ width: `${Math.min(100, rate)}%` }} />
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-6 py-6 text-right">
                                      <button
                                        type="button"
                                        className="p-2 rounded-xl text-tertiary hover:text-error hover:bg-error/5 transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                                        onClick={() => removeSession(idx)}
                                      >
                                        <Trash2 size={16} strokeWidth={2.5} />
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                              
                              {/* Skeleton Row for Adding Session */}
                              <tr 
                                className="group cursor-pointer hover:bg-cta/[0.02] transition-colors"
                                onClick={addSession}
                              >
                                <td colSpan={6} className="px-6 py-8">
                                  <div className="flex items-center justify-center gap-3 text-tertiary group-hover:text-cta transition-all">
                                    <div className="w-8 h-8 rounded-full bg-surface-subtle group-hover:bg-cta/10 group-hover:scale-110 flex items-center justify-center transition-all border border-border/20">
                                      <Plus size={18} strokeWidth={3} />
                                    </div>
                                    <span className="text-[11px] font-black uppercase tracking-[0.1em]">새로운 교육 회차 추가하기</span>
                                  </div>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <footer className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-6">
                        <button
                          type="button"
                          className="btn btn-primary h-14 px-12 gap-3 text-base rounded-2xl shadow-xl shadow-brand-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                          onClick={() => {
                            if (applyDetailDraft()) addToast("설계 내용이 임시 적용되었습니다. 상단의 [전체 저장]을 눌러주세요.", "info");
                          }}
                        >
                          <Check size={24} strokeWidth={4} />
                          <span className="font-black">구성 내용 임시 적용하기</span>
                        </button>
                        <button
                          type="button"
                          className="px-8 py-3 text-tertiary hover:text-secondary font-black text-sm transition-all cursor-pointer uppercase tracking-widest"
                          onClick={() => { setManagerDetailForm(null); setManagerEditingDetailId(null); setSelectedDetailId(null); }}
                        >
                          취소하기 (Cancel)
                        </button>
                      </footer>
                    </div>
                  )}
                </section>
              )}

              {!showDetailSection && (
                <div className="py-32 flex flex-col items-center justify-center text-center opacity-20">
                  <Activity size={80} strokeWidth={1} className="text-tertiary mb-6" />
                  <p className="text-sm font-black text-tertiary uppercase tracking-[0.3em]">과정을 선택하여 상세 구성을 시작하세요</p>
                </div>
              )}
            </div>
          </main>
        </div>
      )}

      {/* Delete Modals - Maintain same logic but apply design polish */}
      {pendingDeleteDetail && (
        <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-surface rounded-3xl shadow-2xl max-w-md w-full p-10 text-center animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 rounded-[32px] bg-error/10 text-error flex items-center justify-center mx-auto mb-8">
              <Trash2 size={40} strokeWidth={2} />
            </div>
            <h3 className="text-2xl font-black text-primary mb-4 tracking-tight">세부 과정 삭제</h3>
            <p className="text-secondary font-bold mb-8 leading-relaxed">
              <span className="text-primary">'{pendingDeleteDetail.detailName}'</span> 과정을<br />삭제 목록에 추가하시겠습니까?
            </p>
            <div className="bg-warning/5 border border-warning/20 rounded-2xl p-5 mb-10 text-left flex items-start gap-4">
              <Activity size={18} className="text-warning shrink-0 mt-0.5" strokeWidth={3} />
              <p className="text-[12px] font-bold text-warning-text leading-relaxed">
                이 작업은 임시 상태입니다. 상단의 <span className="font-black text-primary">"변경 사항 전체 저장"</span> 버튼을 눌러야 실제 DB에서 삭제됩니다.
              </p>
            </div>
            <div className="flex gap-4">
              <button className="flex-1 h-14 rounded-2xl bg-surface-subtle text-secondary font-black text-sm hover:bg-surface-active transition-all" onClick={() => setPendingDeleteDetail(null)}>취소</button>
              <button
                className="flex-1 h-14 rounded-2xl bg-error text-white font-black text-sm shadow-lg shadow-error/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                onClick={() => {
                  removeDetailFromForm(pendingDeleteDetail.groupId, pendingDeleteDetail.detailId);
                  if (selectedDetailId === pendingDeleteDetail.detailId) setSelectedDetailId(null);
                  setPendingDeleteDetail(null);
                  addToast("삭제 목록에 추가되었습니다. 상단의 [전체 저장]을 잊지 마세요.", "info");
                }}
              >
                삭제 추가
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingDeleteGroupId && (
        <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-surface rounded-3xl shadow-2xl max-w-md w-full p-10 text-center animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 rounded-[32px] bg-error/10 text-error flex items-center justify-center mx-auto mb-8">
              <AlertCircle size={40} strokeWidth={2} />
            </div>
            <h3 className="text-2xl font-black text-primary mb-4 tracking-tight">과정 구분 삭제</h3>
            <p className="text-secondary font-bold mb-10 leading-relaxed">
              이 과정 구분을 삭제하시겠습니까? <br />
              <span className="text-error font-black">* 소속된 모든 과정과 데이터가 즉시 삭제됩니다.</span>
            </p>
            <div className="flex gap-4">
              <button className="flex-1 h-14 rounded-2xl bg-surface-subtle text-secondary font-black text-sm hover:bg-surface-active transition-all" onClick={() => setPendingDeleteGroupId(null)}>취소</button>
              <button
                className="flex-1 h-14 rounded-2xl bg-error text-white font-black text-sm shadow-lg shadow-error/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                onClick={() => { confirmDeleteCourseGroup(); setSelectedDetailId(null); setPendingDeleteGroupId(null); }}
              >
                네, 삭제합니다
              </button>
            </div>
          </div>
        </div>
      )}
      {showCertModal && (
        <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm z-[300] flex flex-col animate-in fade-in duration-200">
          <div className="flex items-center justify-between px-6 py-4 bg-surface border-b border-border/30 shrink-0">
            <h2 className="text-base font-black text-primary">수료증 양식 관리</h2>
            <button
              onClick={() => setShowCertModal(false)}
              className="p-2 text-tertiary hover:text-primary rounded-xl hover:bg-surface-subtle transition-colors"
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-6">
            <CertificateTemplatePage />
          </div>
        </div>
      )}
    </div>
  );
}

// Helper icons that were missing
function AlertCircle({ size, strokeWidth, className }: { size: number, strokeWidth: number, className?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={strokeWidth} 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
