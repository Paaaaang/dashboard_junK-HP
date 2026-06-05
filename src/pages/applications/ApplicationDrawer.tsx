import { useState, useEffect, useMemo } from "react";
import { PencilLine, Info } from "lucide-react";
import { SideDrawer, DrawerSection, DrawerField } from "@/components/shared";
import { useCourseStore, useCompanyStore } from "@/stores";
import { formatPhone } from "@/pages/companies/utils/companyUtils";
import type { ApplicationRecord, EmploymentInsuranceStatus } from "@/types/models";

interface ApplicationDrawerProps {
  application: ApplicationRecord;
  onClose: () => void;
  isClosing: boolean;
  onUpdate: (id: string, updates: Partial<ApplicationRecord>) => Promise<void>;
}

export function ApplicationDrawer({
  application,
  onClose,
  isClosing,
  onUpdate,
}: ApplicationDrawerProps) {
  const { courseGroups } = useCourseStore();
  const { companies } = useCompanyStore();

  const [draft, setDraft] = useState<ApplicationRecord>({ ...application });
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState("");

  const [companySearch, setCompanySearch] = useState("");
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);

  // Sync draft when selected application changes
  useEffect(() => {
    setDraft({ ...application });
    setCompanySearch("");
    setIsEditMode(false);
    setNotice("");
  }, [application]);

  const hasChanges = useMemo(() => {
    return JSON.stringify(application) !== JSON.stringify(draft);
  }, [application, draft]);

  // Dropdown filtering
  const filteredCompanies = useMemo(() => {
    if (!companySearch.trim()) return [];
    return companies.filter((c) =>
      c.companyName.toLowerCase().includes(companySearch.toLowerCase())
    );
  }, [companySearch, companies]);

  // Course Matching Helpers
  const matchedGroup = useMemo(() => {
    return courseGroups.find((g) => g.name === draft.courseGroupName) || null;
  }, [draft.courseGroupName, courseGroups]);

  const matchedCourse = useMemo(() => {
    return matchedGroup?.details.find((d) => d.name === draft.subCourseName) || null;
  }, [draft.subCourseName, matchedGroup]);

  const handleSave = async () => {
    if (!draft.name.trim()) {
      setNotice("이름을 입력해 주세요.");
      return;
    }
    if (!draft.companyName.trim()) {
      setNotice("소속 기업명을 입력해 주세요.");
      return;
    }
    setIsSaving(true);
    setNotice("");
    try {
      const updates: Partial<ApplicationRecord> = {
        name: draft.name.trim(),
        companyName: draft.companyName.trim(),
        position: draft.position?.trim() || undefined,
        phone: draft.phone?.trim() || undefined,
        email: draft.email?.trim() || undefined,
        employmentInsurance: draft.employmentInsurance,
        workExperience: draft.workExperience?.trim() || undefined,
        documentSkill: draft.documentSkill?.trim() || undefined,
        mainProduct: draft.mainProduct?.trim() || undefined,
        courseGroupName: draft.courseGroupName?.trim() || undefined,
        subCourseName: draft.subCourseName?.trim() || undefined,
        sessionId: draft.sessionId || undefined,
      };
      await onUpdate(application.id, updates);
      setIsEditMode(false);
      setNotice("정보가 성공적으로 변경되었습니다.");
      setTimeout(() => setNotice(""), 3000);
    } catch (err: any) {
      setNotice(`저장 에러: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setDraft({ ...application });
    setIsEditMode(false);
    setNotice("");
  };

  const handleGroupChange = (groupName: string) => {
    const group = courseGroups.find((g) => g.name === groupName);
    setDraft((prev) => ({
      ...prev,
      courseGroupName: groupName,
      subCourseName: group?.details[0]?.name || "",
      sessionId: undefined,
    }));
  };

  const handleCourseChange = (courseName: string) => {
    setDraft((prev) => ({
      ...prev,
      subCourseName: courseName,
      sessionId: undefined,
    }));
  };

  const drawerFooter = isEditMode ? (
    <>
      <button
        className="flex-1 py-3 text-sm font-bold text-secondary bg-surface-subtle hover:bg-surface-active rounded-2xl transition-all cursor-pointer"
        onClick={handleCancel}
      >
        취소
      </button>
      <button
        className="flex-[2] py-3 text-sm font-bold text-white bg-brand-primary hover:bg-brand-primary-hover rounded-2xl shadow-lg shadow-brand-primary/20 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
        onClick={handleSave}
        disabled={isSaving}
      >
        {isSaving ? "저장 중..." : "저장 완료"}
      </button>
    </>
  ) : (
    <button
      className="w-full py-3 text-sm font-bold text-secondary hover:bg-surface-subtle rounded-2xl transition-all cursor-pointer"
      onClick={onClose}
    >
      닫기
    </button>
  );

  const headerActions = !isEditMode && application.status === "PENDING" && (
    <button
      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold text-secondary hover:bg-surface-subtle rounded-xl transition-all cursor-pointer"
      onClick={() => setIsEditMode(true)}
    >
      <PencilLine size={16} strokeWidth={2.5} /> 편집
    </button>
  );

  return (
    <SideDrawer
      isOpen={true}
      onClose={isEditMode && hasChanges ? () => { if (window.confirm("저장하지 않은 변경사항이 있습니다. 닫으시겠습니까?")) onClose(); } : onClose}
      isClosing={isClosing}
      title={draft.name || "신청 정보"}
      subtitle={
        <span className="text-xs text-tertiary font-bold">
          {draft.companyName || "소속 기업 미지정"}
        </span>
      }
      footer={drawerFooter}
      headerActions={headerActions}
      width="480px"
    >
      {notice && (
        <div className="flex items-center gap-2.5 px-4 py-3 bg-brand-primary/10 text-brand-primary rounded-2xl border border-brand-primary/20 text-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <Info size={16} /> {notice}
        </div>
      )}

      {/* 기본 정보 */}
      <DrawerSection title="인적 사항 및 소속 정보" collapsible defaultCollapsed={false}>
        {isEditMode ? (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <DrawerField label="이름" required value={
                <input
                  className="w-full px-4 py-2.5 bg-surface border border-border/40 rounded-xl text-sm font-semibold text-primary focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              } isEditMode />
              
              <DrawerField label="직위" value={
                <input
                  className="w-full px-4 py-2.5 bg-surface border border-border/40 rounded-xl text-sm font-semibold text-primary focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                  value={draft.position || ""}
                  onChange={(e) => setDraft({ ...draft, position: e.target.value })}
                />
              } isEditMode />
            </div>

            <div className="relative">
              <DrawerField label="소속 기업" required value={
                <div className="relative">
                  <input
                    className="w-full px-4 py-2.5 bg-surface border border-border/40 rounded-xl text-sm font-semibold text-primary focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all pr-10"
                    value={companySearch || draft.companyName}
                    onChange={(e) => {
                      setCompanySearch(e.target.value);
                      setDraft({ ...draft, companyName: e.target.value });
                      setShowCompanyDropdown(true);
                    }}
                    onFocus={() => setShowCompanyDropdown(true)}
                    onBlur={() => setTimeout(() => setShowCompanyDropdown(false), 200)}
                    placeholder="기업명 직접 입력 또는 검색..."
                  />
                </div>
              } isEditMode />
              {showCompanyDropdown && filteredCompanies.length > 0 && (
                <div className="absolute top-full left-0 w-full mt-2 bg-surface border border-border/40 rounded-2xl shadow-xl z-50 overflow-hidden py-1">
                  {filteredCompanies.map((c) => (
                    <button
                      type="button"
                      key={c.id}
                      className="w-full text-left px-4 py-2.5 text-sm text-primary hover:bg-brand-primary/10 hover:text-brand-primary transition-colors flex items-center justify-between group cursor-pointer"
                      onMouseDown={() => {
                        setDraft({ ...draft, companyName: c.companyName });
                        setCompanySearch("");
                        setShowCompanyDropdown(false);
                      }}
                    >
                      <span className="font-bold">{c.companyName}</span>
                      <span className="text-[10px] font-black text-disabled uppercase">선택</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <DrawerField label="연락처" value={
                <input
                  className="w-full px-4 py-2.5 bg-surface border border-border/40 rounded-xl text-sm font-semibold text-primary focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                  value={draft.phone || ""}
                  onChange={(e) => setDraft({ ...draft, phone: formatPhone(e.target.value) })}
                  placeholder="010-0000-0000"
                />
              } isEditMode />

              <DrawerField label="이메일" value={
                <input
                  className="w-full px-4 py-2.5 bg-surface border border-border/40 rounded-xl text-sm font-semibold text-primary focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                  value={draft.email || ""}
                  onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                  placeholder="email@domain.com"
                />
              } isEditMode />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <DrawerField label="고용보험 가입여부" value={
                <select
                  className="w-full px-4 py-2.5 bg-surface border border-border/40 rounded-xl text-sm font-semibold text-primary focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all cursor-pointer"
                  value={draft.employmentInsurance}
                  onChange={(e) => setDraft({ ...draft, employmentInsurance: e.target.value as EmploymentInsuranceStatus })}
                >
                  <option value="미확인">미확인</option>
                  <option value="가입">가입</option>
                  <option value="미가입">미가입</option>
                </select>
              } isEditMode />

              <DrawerField label="업무 경력" value={
                <input
                  className="w-full px-4 py-2.5 bg-surface border border-border/40 rounded-xl text-sm font-semibold text-primary focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                  value={draft.workExperience || ""}
                  onChange={(e) => setDraft({ ...draft, workExperience: e.target.value })}
                  placeholder="예: 3년차 이하"
                />
              } isEditMode />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <DrawerField label="문서 작성 역량" value={
                <input
                  className="w-full px-4 py-2.5 bg-surface border border-border/40 rounded-xl text-sm font-semibold text-primary focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                  value={draft.documentSkill || ""}
                  onChange={(e) => setDraft({ ...draft, documentSkill: e.target.value })}
                  placeholder="예: 기초 수준"
                />
              } isEditMode />

              <DrawerField label="기업 주력 품목" value={
                <input
                  className="w-full px-4 py-2.5 bg-surface border border-border/40 rounded-xl text-sm font-semibold text-primary focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                  value={draft.mainProduct || ""}
                  onChange={(e) => setDraft({ ...draft, mainProduct: e.target.value })}
                  placeholder="예: 의료용 레이저"
                />
              } isEditMode />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <DrawerField label="성명" value={application.name} />
              <DrawerField label="직위" value={application.position || "-"} />
            </div>
            <DrawerField label="소속 기업" value={application.companyName} />
            <div className="grid grid-cols-2 gap-6">
              <DrawerField label="연락처" value={<span className="font-mono font-bold">{application.phone || "-"}</span>} copyValue={application.phone} />
              <DrawerField label="이메일" value={<span className="font-medium">{application.email || "-"}</span>} copyValue={application.email} />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <DrawerField label="고용보험 가입여부" value={application.employmentInsurance} />
              <DrawerField label="업무 경력" value={application.workExperience || "-"} />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <DrawerField label="문서 작성 역량" value={application.documentSkill || "-"} />
              <DrawerField label="기업 주력 품목" value={application.mainProduct || "-"} />
            </div>
          </div>
        )}
      </DrawerSection>

      {/* 교육 신청 정보 */}
      <DrawerSection title="신청 교육 과정 정보" collapsible defaultCollapsed={false}>
        {isEditMode ? (
          <div className="space-y-5">
            <DrawerField label="교육 구분" value={
              <select
                className="w-full px-4 py-2.5 bg-surface border border-border/40 rounded-xl text-sm font-semibold text-primary focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all cursor-pointer"
                value={draft.courseGroupName || ""}
                onChange={(e) => handleGroupChange(e.target.value)}
              >
                <option value="">교육 구분 선택...</option>
                {courseGroups.map((g) => (
                  <option key={g.id} value={g.name}>{g.name}</option>
                ))}
              </select>
            } isEditMode />

            <DrawerField label="세부 프로그램" value={
              <select
                className="w-full px-4 py-2.5 bg-surface border border-border/40 rounded-xl text-sm font-semibold text-primary focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all cursor-pointer"
                value={draft.subCourseName || ""}
                onChange={(e) => handleCourseChange(e.target.value)}
                disabled={!draft.courseGroupName}
              >
                <option value="">세부 과정 선택...</option>
                {matchedGroup?.details.map((d) => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
            } isEditMode />

            <DrawerField label="회차 지정" value={
              <select
                className="w-full px-4 py-2.5 bg-surface border border-border/40 rounded-xl text-sm font-semibold text-primary focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all cursor-pointer"
                value={draft.sessionId || ""}
                onChange={(e) => setDraft({ ...draft, sessionId: e.target.value || undefined })}
                disabled={!draft.subCourseName}
              >
                <option value="">자동 매칭 (가장 가까운 활성 기수 자동 배정)</option>
                {matchedCourse?.sessions?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.sessionNo}회차 ({s.startDate} ~ {s.endDate})
                  </option>
                ))}
              </select>
            } isEditMode />
          </div>
        ) : (
          <div className="space-y-6">
            <DrawerField label="교육 구분" value={application.courseGroupName || "-"} />
            <DrawerField label="세부 프로그램" value={application.subCourseName || "-"} />
            <DrawerField 
              label="기수 배정" 
              value={
                application.sessionId && matchedCourse ? (
                  (() => {
                    const session = matchedCourse.sessions?.find((s) => s.id === application.sessionId);
                    return session 
                      ? `${session.sessionNo}회차 (${session.startDate} ~ ${session.endDate})` 
                      : "자동 매칭 대기";
                  })()
                ) : (
                  <span className="text-tertiary font-bold italic">자동 매칭 대기 (가장 빠른 기수)</span>
                )
              } 
            />
          </div>
        )}
      </DrawerSection>
    </SideDrawer>
  );
}
