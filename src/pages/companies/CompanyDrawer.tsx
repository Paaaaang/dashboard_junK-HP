import { Mail, Info, PencilLine, Trash2 } from "lucide-react";
import type { CompanyRecord, SubCourseWithParticipants, SubCourseParticipant, CourseGroup } from "@/types/models";
import { useState, useMemo } from "react";
import { SideDrawer } from "@/components/shared";

// Sub-components
import { BasicInfoSection } from "@/pages/companies/drawer-sections/BasicInfoSection";
import { ManagerInfoSection } from "@/pages/companies/drawer-sections/ManagerInfoSection";
import { MOUStatusSection } from "@/pages/companies/drawer-sections/MOUStatusSection";
import { CourseParticipationSection } from "@/pages/companies/drawer-sections/CourseParticipationSection";

interface CompanyDrawerProps {
  company: CompanyRecord | null;
  draftCompany: CompanyRecord;
  drawerEditMode: boolean;
  drawerNotice: string;
  expandedDrawerGroups: Set<string>;
  expandedSubCourses: Set<string>;
  addParticipantSubCourseId: string | null;
  addParticipantDraft: string;
  addParticipantSessionId: string;
  isSaving: boolean;
  isClosing: boolean;
  courseGroups: CourseGroup[];
  onDrawerClose: () => void;
  onUpdateDraftField: (field: keyof CompanyRecord, value: any) => void;
  onEnterEditMode: () => void;
  onCancelEdit: () => void;
  onSaveDraftCompany: () => void;
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
  onOpenEmailModal: (ids: string[]) => void;
  onDeleteCompany: (id: string) => void;
  onNavigateToCourses: () => void;
  getSubCourseByName: (companyId: string, groupId: string, name: string) => SubCourseWithParticipants | undefined;
  toDotDate: (val: string | undefined) => string;
  getToday: () => string;
  formatBusinessRegNo: (val: string) => string;
}

export function CompanyDrawer({
  company,
  draftCompany,
  drawerEditMode,
  drawerNotice,
  expandedDrawerGroups,
  expandedSubCourses,
  addParticipantSubCourseId,
  addParticipantDraft,
  addParticipantSessionId,
  isSaving,
  isClosing,
  courseGroups,
  onDrawerClose,
  onUpdateDraftField,
  onEnterEditMode,
  onCancelEdit,
  onSaveDraftCompany,
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
  onOpenEmailModal,
  onDeleteCompany,
  onNavigateToCourses,
  getSubCourseByName,
  toDotDate,
  getToday,
  formatBusinessRegNo,
}: CompanyDrawerProps) {
  const [cancelConfirmPending, setCancelConfirmPending] = useState(false);

  const hasChanges = useMemo(() => {
    if (!company) return false;
    return JSON.stringify(company) !== JSON.stringify(draftCompany);
  }, [company, draftCompany]);

  const handleCloseAttempt = () => {
    if (drawerEditMode && hasChanges) {
      setCancelConfirmPending(true);
    } else {
      onDrawerClose();
    }
  };

  const drawerFooter = drawerEditMode ? (
    <>
      <button 
        className="flex-1 py-3 text-[15px] font-bold text-secondary bg-surface-subtle hover:bg-surface-active rounded-2xl transition-all" 
        onClick={onCancelEdit}
      >
        취소
      </button>
      <button 
        className="flex-[2] py-3 text-[15px] font-bold text-white bg-brand-primary hover:bg-brand-primary-hover rounded-2xl transition-all shadow-lg shadow-brand-primary/20 active:scale-[0.98] disabled:opacity-50" 
        onClick={onSaveDraftCompany} 
        disabled={isSaving}
      >
        {isSaving ? "저장 중..." : "저장"}
      </button>
    </>
  ) : (
    <>
      <button 
        className="flex-1 flex items-center justify-center gap-2 py-3 text-[15px] font-bold text-brand-primary border-2 border-brand-primary/20 hover:bg-brand-primary/10 rounded-2xl transition-all active:scale-[0.98]" 
        onClick={() => onOpenEmailModal([draftCompany.id])}
      >
        <Mail size={18} strokeWidth={2.5} /> 이메일 발송
      </button>
      <button 
        className="px-8 py-3 text-[15px] font-bold text-secondary hover:bg-surface-subtle rounded-2xl transition-all" 
        onClick={handleCloseAttempt}
      >
        닫기
      </button>
    </>
  );

  const headerActions = !drawerEditMode && (
    <div className="flex items-center gap-1">
      <button
        type="button"
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold text-secondary hover:text-error hover:bg-error/5 rounded-xl transition-all duration-200 cursor-pointer"
        onClick={() => onDeleteCompany(draftCompany.id)}
      >
        <Trash2 size={16} strokeWidth={2.5} /> 삭제
      </button>
      <button
        type="button"
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold text-secondary hover:bg-surface-subtle rounded-xl transition-all duration-200 cursor-pointer"
        onClick={onEnterEditMode}
      >
        <PencilLine size={16} strokeWidth={2.5} /> 편집
      </button>
    </div>
  );

  return (
    <>
      <SideDrawer
        isOpen={true}
        onClose={handleCloseAttempt}
        isClosing={isClosing}
        title={draftCompany.companyName || "신규 기업 등록"}
        subtitle={
          draftCompany.businessRegNo && (
            <span className="text-xs text-tertiary font-mono">
              {formatBusinessRegNo(draftCompany.businessRegNo)}
            </span>
          )
        }
        footer={drawerFooter}
        headerActions={headerActions}
        width="520px"
      >
        {drawerNotice && (
          <div className="flex items-center gap-2.5 px-4 py-3 bg-color-info-bg text-color-info-text rounded-2xl border border-color-info/20 text-sm animate-in fade-in slide-in-from-top-2 duration-200">
            <Info size={16} /> {drawerNotice}
          </div>
        )}

        <CourseParticipationSection 
          draftCompany={draftCompany}
          courseGroups={courseGroups}
          expandedDrawerGroups={expandedDrawerGroups}
          expandedSubCourses={expandedSubCourses}
          addParticipantSubCourseId={addParticipantSubCourseId}
          addParticipantDraft={addParticipantDraft}
          addParticipantSessionId={addParticipantSessionId}
          onToggleDrawerGroup={onToggleDrawerGroup}
          onToggleSubCourse={onToggleSubCourse}
          onRemoveCourseProgram={onRemoveCourseProgram}
          onAddParticipantClick={onAddParticipantClick}
          onAddParticipantDraftChange={onAddParticipantDraftChange}
          onAddParticipantSessionChange={onAddParticipantSessionChange}
          onConfirmAddParticipant={onConfirmAddParticipant}
          onRemoveParticipant={onRemoveParticipant}
          onShowParticipantPopover={onShowParticipantPopover}
          onHideParticipantPopover={onHideParticipantPopover}
          getSubCourseByName={getSubCourseByName}
          onNavigateToCourses={onNavigateToCourses}
        />

        <BasicInfoSection 
          draftCompany={draftCompany}
          drawerEditMode={drawerEditMode}
          onUpdateDraftField={onUpdateDraftField}
          formatBusinessRegNo={formatBusinessRegNo}
        />

        <ManagerInfoSection 
          draftCompany={draftCompany}
          drawerEditMode={drawerEditMode}
          onUpdateDraftField={onUpdateDraftField}
        />

        <MOUStatusSection 
          draftCompany={draftCompany}
          drawerEditMode={drawerEditMode}
          onUpdateDraftField={onUpdateDraftField}
          getToday={getToday}
          toDotDate={toDotDate}
        />
      </SideDrawer>

      {cancelConfirmPending && (
        <div className="fixed inset-0 bg-brand-dark/40 z-[var(--z-popover)] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-surface rounded-[32px] p-8 shadow-2xl w-full max-w-sm animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-primary mb-2">변경 사항 취소</h3>
            <p className="text-sm text-secondary mb-8 leading-relaxed">내용이 저장되지 않았습니다. 취소하시겠습니까?</p>
            <div className="flex gap-3">
              <button className="flex-1 py-3 bg-surface-subtle hover:bg-surface-active text-secondary rounded-xl font-bold transition-all" onClick={() => setCancelConfirmPending(false)}>계속 편집</button>
              <button className="flex-1 py-3 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl font-bold transition-all shadow-lg shadow-brand-primary/20" onClick={() => { setCancelConfirmPending(false); onDrawerClose(); }}>취소</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
