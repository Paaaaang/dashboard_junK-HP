import { Mail } from "lucide-react";
import type { CompanyRecord, SubCourseWithParticipants, SubCourseParticipant, CourseGroup } from "@/types/models";
import { useState, useMemo } from "react";

// Sub-components
import { DrawerHeader } from "@/pages/companies/drawer-sections/DrawerHeader";
import { BasicInfoSection } from "@/pages/companies/drawer-sections/BasicInfoSection";
import { ManagerInfoSection } from "@/pages/companies/drawer-sections/ManagerInfoSection";
import { MOUStatusSection } from "@/pages/companies/drawer-sections/MOUStatusSection";
import { CourseParticipationSection } from "@/pages/companies/drawer-sections/CourseParticipationSection";

interface CompanyDrawerProps {
  company: CompanyRecord | null;
  draftCompany: CompanyRecord;
  drawerEditMode: boolean;
  drawerNotice: string;
  drawerNameEditing: boolean;
  drawerNameDraft: string;
  expandedDrawerGroups: Set<string>;
  expandedSubCourses: Set<string>;
  addParticipantSubCourseId: string | null;
  addParticipantDraft: string;
  addParticipantSessionId: string;
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
  onToggleDrawerGroup: (groupName: string) => void;
  onToggleSubCourse: (id: string) => void;
  onRemoveCourseProgram: (courseType: string, programName: string) => void;
  onAddParticipantClick: (subCourseId: string) => void;
  onAddParticipantDraftChange: (val: string) => void;
  onAddParticipantSessionChange: (val: string) => void;
  onConfirmAddParticipant: (subCourseId: string, groupId: string, sessionId?: string) => void;
  onCancelAddParticipant: () => void;
  onRemoveParticipant: (groupId: string, subCourseId: string, ptId: string) => void;
  onShowParticipantPopover: (pt: SubCourseParticipant, e: React.MouseEvent) => void;
  onHideParticipantPopover: () => void;
  onOpenEmailModal: (ids: string[]) => void;
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
  drawerNameEditing,
  drawerNameDraft,
  expandedDrawerGroups,
  expandedSubCourses,
  addParticipantSubCourseId,
  addParticipantDraft,
  addParticipantSessionId,
  isSaving,
  isClosing: isClosingProp,
  courseGroups,
  onDrawerClose,
  onDrawerNameEditToggle,
  onDrawerNameDraftChange,
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

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-brand-dark/40 z-[100] ${isClosingProp ? "animate-fade-out" : "animate-fade-in"}`}
        onClick={handleCloseAttempt} 
      />
      
      {/* Panel */}
      <div 
        className={`fixed top-0 right-0 h-full w-[520px] bg-surface shadow-2xl z-[101] flex flex-col ${isClosingProp ? "animate-drawer-out" : "animate-drawer-in"}`}
        role="dialog" 
        aria-modal="true"
      >
        
        <DrawerHeader 
          draftCompany={draftCompany}
          drawerEditMode={drawerEditMode}
          drawerNameEditing={drawerNameEditing}
          drawerNameDraft={drawerNameDraft}
          onDrawerClose={handleCloseAttempt}
          onDrawerNameEditToggle={onDrawerNameEditToggle}
          onDrawerNameDraftChange={onDrawerNameDraftChange}
          onUpdateDraftField={onUpdateDraftField}
          onEnterEditMode={onEnterEditMode}
        />

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          {drawerNotice && (
            <div className="flex items-center gap-2.5 px-4 py-3 bg-info-bg text-info-text rounded-2xl border border-info/20 text-sm">
              <InfoIcon size={16} /> {drawerNotice}
            </div>
          )}

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
        </div>

        <footer className="sticky bottom-0 px-6 py-5 bg-surface border-t border-border/50 flex items-center gap-3">
          {drawerEditMode ? (
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
          )}
        </footer>
      </div>

      {cancelConfirmPending && (
        <div className="fixed inset-0 bg-brand-dark/40 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
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

function InfoIcon({ size }: { size?: number }) {
  return (
    <svg width={size || 16} height={size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
    </svg>
  );
}
