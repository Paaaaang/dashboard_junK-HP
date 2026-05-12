import { useState, useMemo, useEffect } from "react";
import { Plus, Trash2, Check, Activity, Settings2, Target, Award, Users, ChevronDown, ChevronRight, LayoutList } from "lucide-react";
import { PageHeader } from "../../components";
import { useCourseStore, useParticipantStore, useToastStore } from "../../stores";
import { useCourseManager } from "../participants/hooks/useCourseManager";
import type { AudienceOption } from "../../types/models";
import { Calendar } from "../../components/ui/Calendar";
import { format } from "date-fns";
import { CourseStatusTable } from "./CourseStatusTable";

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

  return (
    <div className="flex flex-col gap-6 h-full pb-10">
      <PageHeader
        title="교육 과정 관리"
        className="sticky top-0 z-20 bg-background/95 backdrop-blur-md -mx-4 px-4 sm:-mx-6 sm:px-6 pt-4 sm:pt-6"
        actions={
          <div className="flex items-center gap-3">
            <div className="flex bg-surface-subtle p-1 rounded-xl border border-border/50">
              <button 
                onClick={() => setActiveTab("status")} 
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${activeTab === "status" ? "bg-surface shadow-sm text-brand-primary" : "text-tertiary hover:text-secondary"}`}
              >
                <LayoutList size={14} />
                교육 현황
              </button>
              <button 
                onClick={() => setActiveTab("settings")} 
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${activeTab === "settings" ? "bg-surface shadow-sm text-brand-primary" : "text-tertiary hover:text-secondary"}`}
              >
                <Settings2 size={14} />
                과정 설정
              </button>
            </div>
            {activeTab === "settings" && (
              <button
                type="button"
                className="btn btn-primary"
                disabled={!isManagerGroupModified}
                onClick={saveCourseGroup}
              >
                변경 사항 전체 저장
              </button>
            )}
          </div>
        }
      />

      {activeTab === "status" && (
        <div className="px-4 sm:px-6 max-w-7xl mx-auto w-full">
          <CourseStatusTable />
        </div>
      )}

      {activeTab === "settings" && (
        <div className="flex flex-col lg:flex-row gap-6 px-4 sm:px-6">
          {/* Sidebar: Group List */}
          <aside
            className="w-full lg:w-[280px] flex flex-col overflow-hidden shrink-0"
            style={{ background: "var(--color-surface)", borderRadius: 24, boxShadow: "var(--shadow-md)", border: "1px solid var(--color-border)" }}
          >
            <div className="p-5 space-y-4" style={{ borderBottom: "1px solid var(--color-border)" }}>
              <p className="text-[11px] font-black text-tertiary uppercase tracking-widest px-1">과정 구분 리스트</p>
              <button
                type="button"
                className="btn btn-primary w-full justify-center gap-2"
                onClick={startCreateCourseGroup}
              >
                <Plus className="w-4 h-4" strokeWidth={2.5} />
                <span>새 구분 추가</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {courseGroups.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-tertiary gap-3 text-center">
                  <Settings2 size={40} className="opacity-20" strokeWidth={2.5} />
                  <p className="text-sm font-bold italic">등록된 과정이<br />없습니다.</p>
                </div>
              ) : courseGroups.map((group) => {
                const isSelected = group.id === managerSelectedGroupId;
                const isExpanded = managerExpandedGroups.has(group.id);

                return (
                  <div key={group.id} className="space-y-1">
                    <button
                      type="button"
                      className="w-full flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer"
                      style={isSelected
                        ? { background: "var(--brand-primary)", color: "#fff", boxShadow: "var(--shadow-md)" }
                        : { color: "var(--color-text-secondary)" }
                      }
                      onClick={() => { selectGroupForManager(group.id); setSelectedDetailId(null); }}
                      onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = "var(--color-surface-subtle)"; }}
                      onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = ""; }}
                    >
                      <span
                        className="p-1 rounded-lg cursor-pointer"
                        style={{ color: isSelected ? "rgba(255,255,255,0.7)" : "var(--color-text-tertiary)" }}
                        onClick={(e) => toggleManagerGroup(group.id, e)}
                      >
                        {isExpanded ? <ChevronDown className="w-4 h-4" strokeWidth={2.5} /> : <ChevronRight className="w-4 h-4" strokeWidth={2.5} />}
                      </span>
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
                            className="text-[12px] font-bold py-1.5 px-3 rounded-xl border border-transparent truncate cursor-pointer transition-colors"
                            style={selectedDetailId === detail.id
                              ? { background: "rgba(16, 185, 129, 0.1)", color: "var(--brand-primary)", fontWeight: 900 }
                              : { color: "var(--color-text-tertiary)" }
                            }
                            onMouseEnter={e => { if (selectedDetailId !== detail.id) (e.currentTarget as HTMLElement).style.background = "var(--color-surface-subtle)"; }}
                            onMouseLeave={e => { if (selectedDetailId !== detail.id) (e.currentTarget as HTMLElement).style.background = ""; }}
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

          {/* Main Content */}
          <main className="flex-1 flex flex-col min-w-0 overflow-y-auto pb-4 sm:pb-6">
            <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto w-full">
              {/* Course Group Settings Card */}
              <section
                className="overflow-hidden"
                style={{ background: "var(--color-surface)", borderRadius: 24, boxShadow: "var(--shadow-md)", border: "1px solid var(--color-border)" }}
              >
                <header
                  className="px-5 sm:px-6 py-4 flex items-center justify-between"
                  style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-surface-subtle)" }}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl" style={{ background: "rgba(16, 185, 129, 0.1)", color: "var(--brand-primary)" }}>
                      <Settings2 size={18} strokeWidth={2.5} />
                    </div>
                    <h4 className="text-lg font-black text-primary tracking-tight">과정 구분 설정</h4>
                  </div>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => managerSelectedGroupId && setPendingDeleteGroupId(managerSelectedGroupId)}
                    title="구분 삭제"
                    style={{ color: "var(--color-text-tertiary)" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--color-error)"; (e.currentTarget as HTMLElement).style.background = "var(--color-error-bg)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--color-text-tertiary)"; (e.currentTarget as HTMLElement).style.background = ""; }}
                  >
                    <Trash2 size={18} strokeWidth={2.5} />
                  </button>
                </header>

                <div className="p-5 sm:p-8 space-y-8">
                  {managerMessage && (
                    <div
                      className="p-4 rounded-xl border flex items-center gap-3 text-sm font-black"
                      style={{ background: "var(--color-success-bg)", borderColor: "rgba(16,185,129,0.2)", color: "var(--color-success-text)" }}
                    >
                      <div className="w-2 h-2 rounded-full" style={{ background: "var(--color-success)" }} />
                      {managerMessage}
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] gap-6 lg:gap-8">
                    <div className="form-group min-w-0">
                      <label className="form-label ml-1">과정 구분 이름</label>
                      <input
                        className="form-input"
                        value={managerGroupForm.name}
                        onChange={(e) => setManagerGroupForm({ ...managerGroupForm, name: e.target.value })}
                        placeholder="예: 훈련비과정, 지원비과정 등"
                      />
                    </div>

                    <div className="form-group min-w-0">
                      <label className="form-label ml-1">지원 대상 설정</label>
                      <div className="flex flex-wrap gap-2 p-3 rounded-xl min-h-[56px]">
                        {AUDIENCE_OPTIONS.map((option) => {
                          const isChecked = managerGroupForm.audiences.includes(option);
                          return (
                            <label
                              key={option}
                              className="flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer transition-colors"
                              style={isChecked
                                ? { background: "var(--brand-primary)", borderColor: "var(--brand-primary)", color: "#fff" }
                                : { background: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }
                              }
                            >
                              <input
                                type="checkbox"
                                className="sr-only"
                                checked={isChecked}
                                onChange={() => toggleManagerAudience(option)}
                              />
                              <span className="text-[12px] font-black">{option}</span>
                              {isChecked && <Check size={10} strokeWidth={3} />}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Sub-program list */}
                  <div className="space-y-6 pt-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-1">
                      <p className="form-label">세부 프로그램 구성 목록</p>
                      <button
                        type="button"
                        className="btn btn-primary gap-1.5 text-[11px]"
                        style={{ height: 36, padding: "0 16px" }}
                        onClick={startAddDetail}
                      >
                        <Plus size={14} strokeWidth={2.5} /> 프로그램 추가
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-4">
                      {managerGroupForm.details.length === 0 ? (
                        <div
                          className="w-full py-12 text-center rounded-3xl border border-dashed"
                          style={{ background: "rgba(16, 185, 129, 0.03)", borderColor: "var(--color-border)" }}
                        >
                          <p className="text-tertiary text-sm font-bold italic">등록된 세부 과정이 없습니다.</p>
                        </div>
                      ) : managerGroupForm.details.map((detail) => {
                        const achieved = getSubCourseTotalAchieved(detail.name);
                        const rate = detail.targetOutcome > 0 ? Math.round((achieved / detail.targetOutcome) * 100) : 0;
                        const isDetailSelected = detail.id === selectedDetailId;

                        return (
                          <div
                            key={detail.id}
                            className="min-w-[260px] p-5 rounded-3xl border cursor-pointer group relative shrink-0 transition-colors"
                            style={isDetailSelected
                              ? { background: "var(--brand-primary)", borderColor: "var(--brand-primary)", color: "#fff", boxShadow: "var(--shadow-xl)" }
                              : { background: "var(--color-surface)", borderColor: "var(--color-border)" }
                            }
                            onClick={() => {
                              setSelectedDetailId(detail.id);
                              if (managerEditingDetailId !== detail.id) {
                                startEditDetail(managerSelectedGroupId ?? "", detail.id);
                              }
                            }}
                          >
                            <div className="flex justify-between items-center mb-4">
                              <h5 className="text-[14px] font-black leading-tight">{detail.name}</h5>                          
                            </div>

                            <div className="flex items-center gap-6">
                              <div className="flex items-center gap-1.5">
                                <Target size={12} strokeWidth={2.5} style={{ color: isDetailSelected ? "rgba(255,255,255,0.6)" : "var(--color-text-tertiary)" }} />
                                <span className="text-[12px] font-black">{detail.targetOutcome}명</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Award size={12} strokeWidth={2.5} style={{ color: isDetailSelected ? "rgba(255,255,255,0.6)" : "var(--color-text-tertiary)" }} />
                                <span className="text-[12px] font-black">{achieved}명</span>
                              </div>
                              <div
                                className="px-2 py-0.5 rounded-lg text-[10px] font-black"
                                style={isDetailSelected
                                  ? { background: "rgba(255,255,255,0.2)", color: "#fff" }
                                  : { background: "rgba(16, 185, 129, 0.1)", color: "var(--brand-primary)" }
                                }
                              >
                                {rate}%
                              </div>
                              <div className="flex-1" />
                              <button
                                type="button"
                                className="p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                                style={{ color: isDetailSelected ? "rgba(255,255,255,0.6)" : "var(--color-text-tertiary)" }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPendingDeleteDetail({ groupId: managerSelectedGroupId ?? "", detailId: detail.id, detailName: detail.name });
                                }}
                                onMouseEnter={e => {
                                  if (!isDetailSelected) {
                                    (e.currentTarget as HTMLElement).style.color = "var(--color-error)";
                                    (e.currentTarget as HTMLElement).style.background = "var(--color-error-bg)";
                                  }
                                }}
                                onMouseLeave={e => {
                                  if (!isDetailSelected) {
                                    (e.currentTarget as HTMLElement).style.color = "var(--color-text-tertiary)";
                                    (e.currentTarget as HTMLElement).style.background = "";
                                  }
                                }}
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

              {/* Sub-program Detail & Sessions */}
              <section
                className="overflow-hidden"
                style={{ background: "var(--color-surface)", borderRadius: 24, boxShadow: "var(--shadow-md)", border: "1px solid var(--color-border)", minHeight: 400 }}
              >
                {selectedDetail || managerEditingDetailId === ADDING_NEW_DETAIL ? (
                  <>
                    <header
                      className="px-5 sm:px-6 py-4 flex items-center justify-between"
                      style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-surface-subtle)" }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl" style={{ background: "var(--color-info-bg)", color: "var(--color-info)" }}>
                          <Activity size={18} strokeWidth={2.5} />
                        </div>
                        <h4 className="text-lg font-black text-primary tracking-tight">세부 과정 상세 및 회차 관리</h4>
                      </div>
                      <button
                        type="button"
                        className="btn btn-primary gap-1.5 text-[11px]"
                        style={{ height: 36, padding: "0 16px", background: "var(--color-info)" }}
                        onClick={addSession}
                      >
                        <Plus size={14} strokeWidth={2.5} /> 회차 추가
                      </button>
                    </header>

                    <div className="p-5 sm:p-8">
                      {managerDetailForm && (
                        <div className="space-y-10">
                          <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6">
                            <div className="flex-1 form-group">
                              <label className="form-label ml-1">세부 과정명</label>
                              <input
                                className="form-input"
                                value={managerDetailForm.name}
                                onChange={(e) => setManagerDetailForm({ ...managerDetailForm, name: e.target.value })}
                                placeholder="과정 이름을 입력하세요"
                              />
                            </div>
                            <div
                              className="w-full sm:w-[110px] p-3.5 rounded-2xl text-center"
                              style={{ background: "var(--color-info-bg)" }}
                            >
                              <span className="block text-[10px] font-black tracking-wider mb-1" style={{ color: "var(--color-info-text)", opacity: 0.7 }}>TOTAL SESSIONS</span>
                              <span className="text-lg font-black" style={{ color: "var(--color-info)" }}>{managerDetailForm.sessions.length}</span>
                            </div>
                          </div>

                          {/* Session Table */}
                          <div className="rounded-3xl overflow-hidden" style={{ background: "var(--color-surface-subtle)" }}>
                            <div className="overflow-x-auto">
                              <table className="min-w-[820px] w-full text-left border-collapse">
                                <thead>
                                  <tr style={{ background: "var(--color-surface-subtle)", borderBottom: "1px solid var(--color-border)" }}>
                                    <th className="px-4 sm:px-5 py-3 text-[11px] font-black text-tertiary tracking-wider w-[70px] text-center">회차</th>
                                    <th className="px-4 sm:px-5 py-3 text-[11px] font-black text-tertiary tracking-wider min-w-[260px]">교육 기간</th>
                                    <th className="px-4 sm:px-5 py-3 text-[11px] font-black text-tertiary tracking-wider text-center">시간</th>
                                    <th className="px-4 sm:px-5 py-3 text-[11px] font-black text-tertiary tracking-wider text-center">목표</th>
                                    <th className="px-4 sm:px-5 py-3 text-[11px] font-black text-tertiary tracking-wider text-center">수료</th>
                                    <th className="px-4 sm:px-5 py-3 text-[11px] font-black text-tertiary tracking-wider text-center">달성률</th>
                                    <th className="px-4 sm:px-5 py-3 w-[50px]" />
                                  </tr>
                                </thead>
                                <tbody>
                                  {managerDetailForm.sessions.map((session, idx) => {
                                    const achv = getSessionStats(managerDetailForm.name, session.id);
                                    const rate = session.targetOutcome > 0 ? Math.round((achv / session.targetOutcome) * 100) : 0;

                                    return (
                                      <tr
                                        key={session.id}
                                        style={{ borderBottom: "1px solid var(--color-border)" }}
                                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--color-surface-subtle)"}
                                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ""}
                                      >
                                        <td className="px-4 sm:px-6 py-4 text-center">
                                          <span
                                            className="text-sm font-black w-7 h-7 inline-flex items-center justify-center rounded-lg"
                                            style={{ background: "var(--color-surface-subtle)", color: "var(--color-text-primary)" }}
                                          >{idx + 1}</span>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4">
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
                                        <td className="px-4 sm:px-6 py-4 text-center">
                                          <div className="flex items-center justify-center gap-1.5">
                                            <input
                                              type="number"
                                              className="form-input text-center"
                                              style={{ width: 64, padding: "6px 8px", fontSize: 13 }}
                                              value={session.totalHours}
                                              onChange={(e) => updateSession(idx, { totalHours: Number(e.target.value) })}
                                            />
                                            <span className="text-[10px] font-bold text-tertiary">H</span>
                                          </div>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 text-center">
                                          <div className="flex items-center justify-center gap-1.5">
                                            <input
                                              type="number"
                                              className="form-input text-center"
                                              style={{ width: 64, padding: "6px 8px", fontSize: 13, borderColor: "rgba(16, 185, 129, 0.3)", color: "var(--brand-primary)" }}
                                              value={session.targetOutcome}
                                              onChange={(e) => updateSession(idx, { targetOutcome: Number(e.target.value) })}
                                            />
                                            <span className="text-[10px] font-bold text-tertiary">명</span>
                                          </div>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 text-center">
                                          <div className="flex flex-col items-center gap-0.5">
                                            <span className="text-[15px] font-black text-text-primary">{achv}</span>
                                            <p className="text-[9px] font-bold text-tertiary uppercase tracking-tighter">Current</p>
                                          </div>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 text-center">
                                          <div className="flex flex-col items-center gap-1.5">
                                            <span
                                              className="text-[13px] font-black"
                                              style={{ color: rate >= 100 ? "var(--color-success)" : "var(--color-text-primary)" }}
                                            >{rate}%</span>
                                            <div className="w-16 h-1 rounded-full overflow-hidden" style={{ background: "var(--color-surface-subtle)" }}>
                                              <div
                                                className="h-full"
                                                style={{ width: `${Math.min(100, rate)}%`, background: "var(--brand-primary)" }}
                                              />
                                            </div>
                                          </div>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 text-right">
                                          <button
                                            type="button"
                                            className="icon-btn cursor-pointer"
                                            style={{ color: "var(--color-text-tertiary)" }}
                                            onClick={() => removeSession(idx)}
                                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--color-error)"; (e.currentTarget as HTMLElement).style.background = "var(--color-error-bg)"; }}
                                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--color-text-tertiary)"; (e.currentTarget as HTMLElement).style.background = ""; }}
                                          >
                                            <Trash2 size={16} strokeWidth={2.5} />
                                          </button>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                            {managerDetailForm.sessions.length === 0 && (
                              <div className="py-16 text-center">
                                <Users size={32} strokeWidth={2.5} className="mx-auto mb-3" style={{ color: "var(--color-text-tertiary)", opacity: 0.3 }} />
                                <p className="text-tertiary text-sm font-bold">등록된 회차가 없습니다. 상단의 '회차 추가' 버튼을 눌러주세요.</p>
                              </div>
                            )}
                          </div>

                          {/* Footer Actions */}
                          <footer className="pt-6 flex flex-col sm:flex-row gap-3 sm:gap-4" style={{ borderTop: "1px solid var(--color-border)" }}>
                            <button
                              type="button"
                              className="btn btn-primary flex-1 h-14 gap-3 text-base rounded-3xl"
                              onClick={() => {
                                if (applyDetailDraft()) {
                                  addToast("적용되었습니다. 상단의 \"변경 사항 전체 저장\"을 눌러주세요.", "info");
                                }
                              }}
                            >
                              <Check size={22} strokeWidth={3} style={{ color: "var(--color-cta)" }} />
                              <span>프로그램 구성 내용 적용하기</span>
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary px-8 h-14 rounded-3xl"
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
                    <div
                      className="w-24 h-24 rounded-[40px] flex items-center justify-center"
                      style={{ background: "var(--color-surface-subtle)", color: "var(--color-text-tertiary)", opacity: 0.4 }}
                    >
                      <Activity size={48} strokeWidth={2.5} />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-xl font-black text-primary tracking-tight">세부 프로그램 정보를 구성해 주세요</h4>
                      <p className="text-[13px] text-tertiary font-medium leading-relaxed max-w-xs mx-auto">
                        상단 탭에서 구분 그룹을 선택하거나<br />
                        <span className="font-bold" style={{ color: "var(--brand-primary)" }}>'프로그램 추가'</span> 버튼을 눌러 새로운 과정을 설계할 수 있습니다.
                      </p>
                    </div>
                  </div>
                )}
              </section>
            </div>
          </main>
        </div>
      )}

      {/* Delete Detail Confirm Modal */}
      {pendingDeleteDetail && (
        <div className="modal-backdrop">
          <div className="modal-panel modal-panel-sm" style={{ borderRadius: 32, padding: 40, textAlign: "center" }}>
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
              style={{ background: "var(--color-error-bg)", color: "var(--color-error)" }}
            >
              <Trash2 size={32} strokeWidth={2.5} />
            </div>
            <h3 className="text-2xl font-black text-primary mb-2">세부 과정 삭제</h3>
            <p className="text-secondary font-bold mb-6 leading-relaxed">
              <span className="text-text-primary">'{pendingDeleteDetail.detailName}'</span> 과정을 삭제 목록에 추가하시겠습니까?
            </p>
            <div
              className="rounded-2xl p-4 mb-8 text-left flex items-start gap-3"
              style={{ background: "var(--color-warning-bg)", border: "1px solid rgba(245,158,11,0.2)" }}
            >
              <Activity size={16} strokeWidth={3} style={{ color: "var(--color-warning)", marginTop: 2 }} />
              <p className="text-[12px] font-bold leading-relaxed" style={{ color: "var(--color-warning-text)" }}>
                이 작업은 임시 삭제 상태로 설정합니다.<br />
                상단의 <span className="font-black">"변경 사항 전체 저장"</span> 버튼을 눌러야 실제 데이터베이스에서 영구 삭제됩니다.
              </p>
            </div>
            <div className="flex gap-4">
              <button className="btn btn-secondary flex-1 h-12" onClick={() => setPendingDeleteDetail(null)}>취소</button>
              <button
                className="btn btn-primary flex-1 h-12"
                style={{ background: "var(--color-error)" }}
                onClick={() => {
                  removeDetailFromForm(pendingDeleteDetail.groupId, pendingDeleteDetail.detailId);
                  if (selectedDetailId === pendingDeleteDetail.detailId) setSelectedDetailId(null);
                  setPendingDeleteDetail(null);
                  addToast("삭제 목록에 추가되었습니다. 상단의 '전체 저장'을 눌러주세요.", "info");
                }}
              >
                삭제 추가
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Group Confirm Modal */}
      {pendingDeleteGroupId && (
        <div className="modal-backdrop">
          <div className="modal-panel modal-panel-sm" style={{ borderRadius: 32, padding: 40, textAlign: "center" }}>
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
              style={{ background: "var(--color-error-bg)", color: "var(--color-error)" }}
            >
              <Trash2 size={32} strokeWidth={2.5} />
            </div>
            <h3 className="text-2xl font-black text-primary mb-2">과정 구분 삭제</h3>
            <p className="text-secondary font-bold mb-10 leading-relaxed">
              이 과정 구분을 삭제하시겠습니까? <br />
              <span className="font-black" style={{ color: "var(--color-error)" }}>* 소속된 모든 세부 과정 및 데이터가 영구 삭제됩니다.</span>
            </p>
            <div className="flex gap-4">
              <button className="btn btn-secondary flex-1 h-12" onClick={() => setPendingDeleteGroupId(null)}>
                아니오, 취소
              </button>
              <button
                className="btn btn-primary flex-1 h-12"
                style={{ background: "var(--color-error)" }}
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
