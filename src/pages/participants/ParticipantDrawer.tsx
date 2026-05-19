import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  PencilLine, 
  Plus, 
  ChevronDown, 
  Calendar as CalendarIcon
} from "lucide-react";
import { CompletionBadge } from "@/components/ui";
import { ParticipantRecord, ParticipantEnrollment, CompletionStatus } from "@/types/models";
import { LinkCourseModal } from "@/pages/participants/modals/LinkCourseModal";
import { formatPhone, toDotDate } from "@/pages/companies/utils/companyUtils";
import { useCompanyStore, useCourseStore } from "@/stores";
import { Calendar, RangeValue } from "@/components/ui/Calendar";
import { format } from "date-fns";
import { SideDrawer, DrawerSection, DrawerField } from "@/components/shared";

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
  const { courseGroups } = useCourseStore();
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

  const drawerFooter = isEditMode ? (
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
  );

  const headerActions = !isEditMode && (
    <button
      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold text-secondary hover:bg-surface-subtle rounded-xl transition-all"
      onClick={() => setIsEditMode(true)}
    >
      <PencilLine size={16} strokeWidth={2.5} /> 편집
    </button>
  );

  return (
    <>
      <SideDrawer
        isOpen={true}
        onClose={handleCloseAttempt}
        isClosing={isClosing}
        title={participant.name}
        subtitle={
          <button 
            onClick={() => navigate(`/companies?open=${participant.companyId}`)}
            className="text-xs text-info font-bold hover:underline"
          >
            {participant.companyName}
          </button>
        }
        footer={drawerFooter}
        headerActions={headerActions}
      >
        {/* 수강 이력 - Prioritized */}
        <DrawerSection 
          title="수강 이력" 
          collapsible
          defaultCollapsed={false}
          action={
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-brand-primary hover:bg-brand-primary/10 rounded-xl transition-all"
              onClick={() => setShowLinkModal(true)}
            >
              <Plus size={14} strokeWidth={2.5} /> 과정 연결
            </button>
          }
        >
          <div className="space-y-6">
            {courseGroups.length === 0 ? (
              <div className="px-4 py-8 text-center border-2 border-dashed border-border/50 rounded-2xl bg-surface-subtle/20">
                 <p className="text-xs text-tertiary font-medium">관리 중인 교육 과정이 없습니다.</p>
              </div>
            ) : courseGroups.map(group => {
              const enrs = draft.enrollments.filter(e => e.courseType === group.name);
              if (enrs.length === 0 && !isEditMode) return null;

              return (
                <div key={group.id} className="space-y-3">
                  <div className="flex items-center gap-2 border-b border-border/40 pb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-primary"></span>
                    <span className="text-[12px] font-black text-secondary uppercase tracking-widest">{group.name}</span>
                  </div>
                  <div className="space-y-1">
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
        </DrawerSection>

        {/* 기본 정보 */}
        <DrawerSection title="기본 정보" collapsible defaultCollapsed>
          {isEditMode ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <DrawerField label="이름" required value={
                  <input
                    className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-sm font-semibold text-primary focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                    value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  />
                } isEditMode />
                <DrawerField label="직위" value={
                  <input
                    className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-sm font-semibold text-primary focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                    value={draft.position}
                    onChange={(e) => setDraft({ ...draft, position: e.target.value })}
                  />
                } isEditMode />
              </div>

              <DrawerField label="생년월일" value={
                <input
                  type="date"
                  className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-sm font-semibold text-primary focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                  value={draft.birthDate || ""}
                  onChange={(e) => setDraft({ ...draft, birthDate: e.target.value || undefined })}
                />
              } isEditMode />

              <div className="relative">
                <DrawerField label="소속 기업" value={
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
                    <ChevronDown size={16} strokeWidth={2.5} className="absolute right-3 top-1/2 -translate-y-1/2 text-disabled" />
                  </div>
                } isEditMode />
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
                <DrawerField label="연락처" value={
                  <input
                    className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-sm font-semibold text-primary focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                    value={draft.phone}
                    onChange={(e) => setDraft({ ...draft, phone: formatPhone(e.target.value) })}
                    placeholder="010-0000-0000"
                  />
                } isEditMode />
                <DrawerField label="이메일" value={
                  <input
                    className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-sm font-semibold text-primary focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                    value={draft.email}
                    onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                  />
                } isEditMode />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <DrawerField label="직위" value={participant.position || "-"} />
                <DrawerField label="생년월일" value={
                  participant.birthDate
                    ? participant.birthDate.replace(/^(\d{4})-(\d{2})-(\d{2})$/, "$1년 $2월 $3일")
                    : "-"
                } />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <DrawerField 
                  label="연락처" 
                  value={
                    <div className="flex items-center gap-1.5 text-secondary">
                      <span className="font-mono font-bold">{participant.phone || "-"}</span>
                    </div>
                  } 
                  copyValue={participant.phone}
                />
                <DrawerField 
                  label="이메일" 
                  value={
                    <div className="flex items-center gap-1.5 text-secondary">
                      <span className="truncate">{participant.email || "-"}</span>
                    </div>
                  } 
                  copyValue={participant.email}
                />
              </div>
            </div>
          )}
        </DrawerSection>

        {/* 교육 후기 */}
        <DrawerSection title="교육 후기" collapsible defaultCollapsed={!participant.review}>
          {isEditMode ? (
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-tertiary uppercase tracking-wider ml-1">종합 후기 및 피드백</label>
              <textarea
                className="w-full px-4 py-3 bg-surface border border-border rounded-2xl text-sm font-medium text-primary focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all min-h-[120px] resize-none custom-scrollbar"
                value={draft.review || ""}
                onChange={(e) => setDraft({ ...draft, review: e.target.value })}
                placeholder="참여자의 교육 만족도나 특이사항을 입력하세요..."
              />
            </div>
          ) : (
            <div className="bg-surface-subtle/30 rounded-2xl p-5 border border-border/50">
              {participant.review ? (
                <p className="text-sm font-medium text-secondary leading-relaxed whitespace-pre-wrap">
                  {participant.review}
                </p>
              ) : (
                <p className="text-xs text-tertiary italic text-center py-4">등록된 후기가 없습니다.</p>
              )}
            </div>
          )}
        </DrawerSection>
      </SideDrawer>

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
        <div className="fixed inset-0 bg-brand-dark/40 z-[var(--z-popover)] flex items-center justify-center p-4 animate-in fade-in duration-200">
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
    } else if (s === "미수료") {
      updates.completionDate = ""; // Empty string corresponds to null in DB mapping
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
    <div className="transition-all hover:bg-surface-subtle/50 rounded-2xl group">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full px-3 py-3 flex items-center gap-3 text-left"
      >
        <span className={`transition-transform duration-200 text-tertiary ${expanded ? "rotate-180" : ""}`}>
          <ChevronDown size={14} strokeWidth={2.5} />
        </span>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-[13.5px] font-bold text-primary group-hover:text-brand-primary transition-colors">
              {enrollment.subCourseName}
            </p>
            {sessionIndex && (
              <span className="px-1.5 py-0.5 bg-brand-primary/10 text-brand-primary text-[9px] font-black rounded-md">
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
        <div className="px-8 pb-5 pt-1 space-y-5">
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            <DrawerField label="기간 및 시간" value={
              <div className="flex items-center gap-1.5 text-secondary">
                <CalendarIcon size={12} strokeWidth={2.5} className="text-disabled" />
                {toDotDate(enrollment.startDate)} ~ {toDotDate(enrollment.endDate)} ({enrollment.totalHours}시간)
              </div>
            } />
            <DrawerField label="상태 변경" value={
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
            } />
            
            {enrollment.status === "수료" && (
              <>
                <DrawerField label="수료일" value={
                  <Calendar 
                    isSingleDate
                    value={completionDateValue}
                    onChange={(val) => handleDateChange("completionDate", val)}
                  />
                } />
                <DrawerField label="수료 번호" value={
                  <input 
                    type="text"
                    placeholder="CRT-2026-XXXX"
                    value={enrollment.certificateNo || ""} 
                    onChange={(e) => onUpdate(enrollment.id, { certificateNo: e.target.value })}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs font-medium text-primary focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all shadow-sm"
                  />
                } />
              </>
            )}
            
            <div className="col-span-2">
              <DrawerField label="신청일 (폼 접수)" value={
                <Calendar 
                  isSingleDate
                  value={applicationDateValue}
                  onChange={(val) => handleDateChange("applicationDate", val)}
                />
              } />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
