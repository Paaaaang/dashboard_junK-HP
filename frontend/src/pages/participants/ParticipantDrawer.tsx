import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  X, 
  PencilLine, 
  Plus, 
  ChevronDown, 
  User,
  GraduationCap,
  Building2,
  Calendar as CalendarIcon
} from "lucide-react";
import { CompletionBadge } from "../../components/ui";
import { ParticipantRecord, ParticipantEnrollment, CourseType, CompletionStatus } from "../../types/models";
import { LinkCourseModal } from "./modals/LinkCourseModal";
import { formatPhone, toDotDate } from "../companies/utils/companyUtils";
import { useCompanyStore, useCourseStore } from "../../stores";
import { Calendar, RangeValue } from "../../components/ui/Calendar";
import { format } from "date-fns";

interface ParticipantDrawerProps {
  participant: ParticipantRecord;
  onClose: () => void;
  isClosing: boolean;
  onUpdate: (updated: ParticipantRecord) => void;
}

export function ParticipantDrawer({
  participant,
  onClose,
  isClosing,
  onUpdate,
}: ParticipantDrawerProps) {
  const navigate = useNavigate();
  const { companies: allCompanies } = useCompanyStore();
  const [draft, setDraft] = useState<ParticipantRecord>({ ...participant });
  const [isEditMode, setIsEditMode] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [cancelConfirmPending, setCancelConfirmPending] = useState(false);

  // Company Search State
  const [companySearch, setCompanySearch] = useState("");
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);

  useEffect(() => {
    setDraft({ ...participant });
    setCompanySearch("");
  }, [participant]);

  const COURSE_TYPES: CourseType[] = ["훈련비과정", "지원비과정", "공유개방 세미나"];

  const filteredCompanies = useMemo(() =>
    allCompanies.filter(c => c.companyName.toLowerCase().includes(companySearch.toLowerCase())),
    [companySearch, allCompanies]
  );

  const hasChanges = useMemo(() => {
    return JSON.stringify(participant) !== JSON.stringify(draft);
  }, [participant, draft]);

  const handleSave = async () => {
    setIsSaving(true);
    await onUpdate(draft);
    setIsSaving(false);
    setIsEditMode(false);
  };

  const handleCloseAttempt = () => {
    if (isEditMode && hasChanges) {
      setCancelConfirmPending(true);
    } else {
      onClose();
    }
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-brand-dark/40 z-[100] ${isClosing ? "animate-fade-out" : "animate-fade-in"}`}
        onClick={handleCloseAttempt}
      />

      <div
        className={`fixed top-0 right-0 h-full w-[480px] bg-surface shadow-2xl z-[101] flex flex-col ${isClosing ? "animate-drawer-out" : "animate-drawer-in"}`}
      >
        <header className="px-6 py-5 bg-surface border-b border-border/50 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-primary/10 rounded-xl text-brand-primary">
              <User size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-primary">{participant.name}</h3>
              <button 
                onClick={() => navigate(`/companies?open=${participant.companyId}`)}
                className="text-xs text-info font-bold hover:underline"
              >
                {participant.companyName}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isEditMode && (
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold text-secondary hover:bg-surface-subtle rounded-xl transition-all"
                onClick={() => setIsEditMode(true)}
              >
                <PencilLine size={16} strokeWidth={2.5} /> 편집
              </button>
            )}
            <button
              className="p-2 text-tertiary hover:text-secondary hover:bg-surface-subtle rounded-full transition-all"
              onClick={handleCloseAttempt}
            >
              <X size={20} strokeWidth={2.5} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          {/* 기본 정보 */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <h4 className="text-xs font-black text-tertiary uppercase tracking-widest">기본 정보</h4>
            </div>
            <div className={`p-6 rounded-[24px] border transition-all ${isEditMode ? "bg-brand-primary/5 border-brand-primary/20 ring-4 ring-brand-primary/5" : "bg-surface-subtle/30 border-border/50"}`}>
              {isEditMode ? (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-tertiary uppercase tracking-wider">이름</label>
                      <input
                        className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-sm font-semibold text-primary focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                        value={draft.name}
                        onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-tertiary uppercase tracking-wider">직위</label>
                      <input
                        className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-sm font-semibold text-primary focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                        value={draft.position}
                        onChange={(e) => setDraft({ ...draft, position: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 relative">
                    <label className="text-xs font-bold text-tertiary uppercase tracking-wider">소속 기업</label>
                    <div className="relative">
                      <input
                        className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-sm font-semibold text-primary focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all pr-10"
                        value={companySearch || draft.companyName}
                        onChange={(e) => {
                          setCompanySearch(e.target.value);
                          setShowCompanyDropdown(true);
                        }}
                        onFocus={() => setShowCompanyDropdown(true)}
                        onBlur={() => setTimeout(() => setShowCompanyDropdown(false), 200)}
                        placeholder="기업 검색..."
                      />
                      <Building2 size={16} strokeWidth={2.5} className="absolute right-3 top-1/2 -translate-y-1/2 text-disabled" />
                    </div>
                    {showCompanyDropdown && (
                      <div className="absolute top-full left-0 w-full mt-2 bg-surface border border-border/50 rounded-2xl shadow-xl z-50 overflow-hidden py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                        {filteredCompanies.length === 0 ? (
                          <p className="px-4 py-3 text-xs text-tertiary text-center italic">검색 결과가 없습니다.</p>
                        ) : (
                          filteredCompanies.slice(0, 5).map((c) => (
                            <button
                              key={c.id}
                              className="w-full text-left px-4 py-2.5 text-sm text-primary hover:bg-brand-primary/10 hover:text-brand-primary transition-colors flex items-center justify-between group"
                              onMouseDown={() => {
                                setDraft({ ...draft, companyId: c.id, companyName: c.companyName });
                                setCompanySearch("");
                                setShowCompanyDropdown(false);
                              }}
                            >
                              <span className="font-bold">{c.companyName}</span>
                              <span className="text-[10px] font-black text-disabled group-hover:text-brand-primary uppercase">선택</span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-tertiary uppercase tracking-wider">연락처</label>
                      <input
                        className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-sm font-semibold text-primary focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                        value={draft.phone}
                        onChange={(e) => setDraft({ ...draft, phone: formatPhone(e.target.value) })}
                        placeholder="010-0000-0000"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-tertiary uppercase tracking-wider">이메일</label>
                      <input
                        className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-sm font-semibold text-primary focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                        value={draft.email}
                        onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-tertiary uppercase tracking-wider">직위</span>
                      <p className="text-sm font-bold text-primary">{participant.position || "-"}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <span className="text-[10px] font-bold text-tertiary uppercase tracking-wider">고용보험</span>
                      <div className="flex justify-end mt-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black ${participant.employmentInsurance === "가입" ? "bg-brand-primary/20 text-brand-primary" : "bg-surface-subtle text-secondary"}`}>
                          {participant.employmentInsurance}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6 pt-6 border-t border-border/50">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-tertiary uppercase tracking-wider">연락처</span>
                      <p className="text-sm font-mono font-bold text-primary tracking-tight">{participant.phone || "-"}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-tertiary uppercase tracking-wider">이메일</span>
                      <p className="text-sm font-medium text-secondary italic truncate">{participant.email || "-"}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* 수강 이력 */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-brand-primary/10 rounded-lg">
                  < GraduationCap size={16} strokeWidth={2.5} className="text-brand-primary" />
                </div>
                <h4 className="text-sm font-black text-primary tracking-tight">수강 이력</h4>
              </div>
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-brand-primary hover:bg-brand-primary/10 rounded-xl transition-all"
                onClick={() => setShowLinkModal(true)}
              >
                <Plus size={14} strokeWidth={2.5} /> 과정 연결
              </button>
            </div>

            <div className="space-y-3">
              {COURSE_TYPES.map(type => {
                const enrs = draft.enrollments.filter(e => e.courseType === type);
                return (
                  <div key={type} className="space-y-2">
                    <div className="px-1 flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-disabled"></span>
                      <span className="text-[11px] font-black text-tertiary uppercase tracking-widest">{type}</span>
                    </div>
                    <div className="space-y-2">
                      {enrs.length === 0 ? (
                        <p className="text-[11px] text-disabled italic px-4 py-2">연결된 과정이 없습니다.</p>
                      ) : enrs.map(e => (
                        <EnrollmentRow 
                          key={e.id} 
                          enrollment={e} 
                          onUpdate={(id, updates) => {
                            setDraft({ 
                              ...draft, 
                              enrollments: draft.enrollments.map(x => x.id === id ? { ...x, ...updates } : x) 
                            });
                            setIsEditMode(true);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <footer className="px-6 py-5 bg-surface border-t border-border/50 flex items-center gap-3">
          {isEditMode ? (
            <>
              <button
                className="flex-1 py-3 text-sm font-bold text-secondary bg-surface-subtle hover:bg-surface-active rounded-2xl transition-all"
                onClick={() => setIsEditMode(false)}
              >
                취소
              </button>
              <button
                className="flex-[2] py-3 text-sm font-bold text-white bg-brand-primary hover:bg-brand-primary-hover rounded-2xl shadow-lg shadow-brand-primary/20 transition-all active:scale-95 disabled:opacity-50"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? "저장 중..." : "저장 완료"}
              </button>
            </>
          ) : (
            <button
              className="w-full py-3 text-sm font-bold text-secondary hover:bg-surface-subtle rounded-2xl transition-all"
              onClick={handleCloseAttempt}
            >
              닫기
            </button>
          )}
        </footer>
      </div>

      {showLinkModal && (
        <LinkCourseModal
          participant={participant}
          onClose={() => setShowLinkModal(false)}
          onLink={(_, enr) => {
            setDraft({ ...draft, enrollments: [...draft.enrollments, enr] });
            setIsEditMode(true);
            setShowLinkModal(false);
          }}
        />
      )}

      {cancelConfirmPending && (
        <div className="fixed inset-0 bg-brand-dark/40 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-surface rounded-[32px] p-8 shadow-2xl w-full max-w-sm animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-primary mb-2">변경 사항 취소</h3>
            <p className="text-sm text-secondary mb-8 leading-relaxed">내용이 저장되지 않았습니다. 취소하시겠습니까?</p>
            <div className="flex gap-3">
              <button className="flex-1 py-3 bg-surface-subtle hover:bg-surface-active text-secondary rounded-xl font-bold transition-all" onClick={() => setCancelConfirmPending(false)}>계속 편집</button>
              <button className="flex-1 py-3 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl font-bold transition-all shadow-lg shadow-brand-primary/20" onClick={() => { setCancelConfirmPending(false); setIsEditMode(false); onClose(); }}>취소</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

interface EnrollmentRowProps {
  enrollment: ParticipantEnrollment;
  onUpdate: (id: string, updates: Partial<ParticipantEnrollment>) => void;
}

function EnrollmentRow({ enrollment, onUpdate }: EnrollmentRowProps) {
  const [expanded, setExpanded] = useState(false);
  const { courseGroups } = useCourseStore();

  // Find session index for display (e.g. 1회차)
  const sessionIndex = useMemo(() => {
    if (!enrollment.sessionId) return null;
    const group = courseGroups.find(g => g.name === enrollment.courseType);
    const detail = group?.details.find(d => d.name === enrollment.subCourseName);
    const idx = detail?.sessions?.findIndex(s => s.id === enrollment.sessionId);
    return idx !== undefined && idx !== -1 ? idx + 1 : null;
  }, [enrollment, courseGroups]);

  const handleStatusChange = (s: CompletionStatus) => {
    const updates: Partial<ParticipantEnrollment> = { status: s };
    if (s === "수료" && !enrollment.completionDate) {
      updates.completionDate = new Date().toISOString().slice(0, 10);
    }
    onUpdate(enrollment.id, updates);
  };

  const completionDateValue: RangeValue = {
    start: enrollment.completionDate ? new Date(enrollment.completionDate) : null,
    end: enrollment.completionDate ? new Date(enrollment.completionDate) : null
  };

  const applicationDateValue: RangeValue = {
    start: enrollment.applicationDate ? new Date(enrollment.applicationDate) : null,
    end: enrollment.applicationDate ? new Date(enrollment.applicationDate) : null
  };

  const handleDateChange = (field: "completionDate" | "applicationDate", val: RangeValue | null) => {
    if (!val || !val.start) {
      onUpdate(enrollment.id, { [field]: "" });
    } else {
      onUpdate(enrollment.id, { [field]: format(val.start, "yyyy-MM-dd") });
    }
  };

  return (
    <div className="bg-surface border border-border/50 rounded-2xl overflow-hidden shadow-sm transition-all hover:border-brand-primary/30 group">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-4 flex items-center gap-3 text-left"
      >
        <span className={`transition-transform duration-200 text-tertiary ${expanded ? "rotate-180" : ""}`}>
          <ChevronDown size={16} strokeWidth={2.5} />
        </span>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-primary group-hover:text-brand-primary transition-colors">
              {enrollment.subCourseName}
            </p>
            {sessionIndex && (
              <span className="px-1.5 py-0.5 bg-brand-primary/10 text-brand-primary text-[10px] font-black rounded-md">
                {sessionIndex}회차
              </span>
            )}
          </div>
          {!expanded && (
            <p className="text-[11px] text-tertiary mt-0.5 font-medium">
              {toDotDate(enrollment.startDate)} ~ {toDotDate(enrollment.endDate)}
            </p>
          )}
        </div>
        <CompletionBadge status={enrollment.status} />
      </button>
      
      {expanded && (
        <div className="px-5 pb-5 pt-1 border-t border-border/20 bg-surface-subtle/30">
          <div className="grid grid-cols-2 gap-4 mt-3">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-tertiary uppercase tracking-wider">기간 및 시간</span>
              <p className="text-sm text-secondary font-medium flex items-center gap-1.5">
                <CalendarIcon size={12} strokeWidth={2.5} className="text-disabled" />
                {toDotDate(enrollment.startDate)} ~ {toDotDate(enrollment.endDate)} ({enrollment.totalHours}시간)
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-tertiary uppercase tracking-wider">상태 변경</span>
              <div className="relative">
                <select 
                  value={enrollment.status} 
                  onChange={(e) => handleStatusChange(e.target.value as CompletionStatus)}
                  className="w-full pl-3 pr-8 py-2 bg-surface border border-border rounded-xl text-xs font-bold text-primary focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all cursor-pointer appearance-none shadow-sm"
                >
                  <option value="미수료">미수료</option>
                  <option value="수료">수료</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-tertiary pointer-events-none" size={12} strokeWidth={2.5} />
              </div>
            </div>
            
            {enrollment.status === "수료" && (
              <>
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-tertiary uppercase tracking-wider">수료일</span>
                  <Calendar 
                    isSingleDate
                    value={completionDateValue}
                    onChange={(val) => handleDateChange("completionDate", val)}
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-tertiary uppercase tracking-wider">수료 번호</span>
                  <input 
                    type="text"
                    placeholder="CRT-2026-XXXX"
                    value={enrollment.certificateNo || ""} 
                    onChange={(e) => onUpdate(enrollment.id, { certificateNo: e.target.value })}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs font-medium text-primary focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all shadow-sm"
                  />
                </div>
              </>
            )}
            
            <div className="space-y-1 col-span-2 pt-2 border-t border-border/20">
              <span className="text-[11px] font-bold text-tertiary uppercase tracking-wider">신청일 (폼 접수)</span>
              <Calendar 
                isSingleDate
                value={applicationDateValue}
                onChange={(val) => handleDateChange("applicationDate", val)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
