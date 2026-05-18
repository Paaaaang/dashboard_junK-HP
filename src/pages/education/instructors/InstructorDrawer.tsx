import { useState, useEffect } from "react";
import { Edit2, Plus, Calendar as CalendarIcon, X } from "lucide-react";
import { SideDrawer, DrawerSection, DrawerField } from "@/components/shared";
import { formatPhone } from "@/pages/companies/utils/companyUtils";
import type { InstructorRecord } from "@/stores/useInstructorStore";
import { AssignCourseModal } from "./modals/AssignCourseModal";
import { useInstructorStore } from "@/stores";

interface InstructorDrawerProps {
  instructor: InstructorRecord | null;
  isOpen: boolean;
  onClose: () => void;
  isClosing: boolean;
  onUpdate: (data: Partial<InstructorRecord>) => Promise<void>;
}

export function InstructorDrawer({
  instructor,
  isOpen,
  onClose,
  isClosing,
  onUpdate,
}: InstructorDrawerProps) {
  const [isEditMode, setIsEditMode] = useState(!instructor?.id);
  const [isSaving, setIsSaving] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [draft, setDraft] = useState<Partial<InstructorRecord>>({
    name: "",
    specialty: "",
    phone: "",
    email: "",
  });

  const { removeInstructorFromSession } = useInstructorStore();

  useEffect(() => {
    if (instructor) {
      setDraft({ ...instructor });
      setIsEditMode(!instructor.id || instructor.id.startsWith("new-"));
    }
  }, [instructor]);

  const handleSave = async () => {
    if (!draft.name?.trim()) return;
    setIsSaving(true);
    try {
      await onUpdate(draft);
      if (instructor?.id) setIsEditMode(false);
      else onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveAssignment = async (sessionId: string, sessionName: string) => {
    if (!instructor?.id || !confirm(`'${sessionName}' 과정 배정을 취소하시겠습니까?`)) return;
    try {
      await removeInstructorFromSession(instructor.id, sessionId);
    } catch (err) {
      console.error("Remove assignment failed:", err);
    }
  };

  const footer = isEditMode ? (
    <>
      <button
        className="flex-1 py-3 text-sm font-bold text-secondary bg-surface-subtle hover:bg-surface-active rounded-2xl transition-all"
        onClick={() => instructor?.id ? setIsEditMode(false) : onClose()}
      >
        취소
      </button>
      <button
        className="flex-[2] py-3 text-sm font-bold text-white bg-brand-primary hover:bg-brand-primary-hover rounded-2xl shadow-lg shadow-brand-primary/20 transition-all disabled:opacity-50"
        onClick={handleSave}
        disabled={isSaving}
      >
        {isSaving ? "저장 중..." : "저장 완료"}
      </button>
    </>
  ) : (
    <button
      className="w-full py-3 text-sm font-bold text-secondary hover:bg-surface-subtle rounded-2xl transition-all"
      onClick={onClose}
    >
      닫기
    </button>
  );

  const headerActions = instructor?.id && !isEditMode && (
    <button
      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold text-secondary hover:bg-surface-subtle rounded-xl transition-all"
      onClick={() => setIsEditMode(true)}
    >
      <Edit2 size={16} strokeWidth={2.5} /> 편집
    </button>
  );

  return (
    <>
      <SideDrawer
        isOpen={isOpen}
        onClose={onClose}
        isClosing={isClosing}
        title={instructor?.id ? draft.name || "" : "새 강사 등록"}
        subtitle={instructor?.id ? "강사 상세 정보" : "기본 정보를 입력하여 등록하세요."}
        footer={footer}
        headerActions={headerActions}
      >
        <DrawerSection title="강사 기본 정보" collapsible={false}>
          <div className="space-y-6">
            <DrawerField label="구분" value={
              isEditMode ? (
                <input
                  className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-sm font-semibold text-primary placeholder:text-tertiary focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                  value={draft.specialty || ""}
                  onChange={(e) => setDraft({ ...draft, specialty: e.target.value })}
                  placeholder="강사 분야를 입력해 주세요"
                />
              ) : (
                <span className="text-sm font-bold text-primary">{draft.specialty || "-"}</span>
              )
            } isEditMode={isEditMode} />

            <DrawerField label="강사명" required={true} value={
              isEditMode ? (
                <input
                  className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-sm font-semibold text-primary placeholder:text-tertiary focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                  value={draft.name || ""}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  placeholder="성함 입력"
                />
              ) : (
                <span className="text-sm font-bold text-primary">{draft.name || ""}</span>
              )
            } isEditMode={isEditMode} />

            <div className="grid grid-cols-2 gap-4">
              <DrawerField label="연락처" value={
                isEditMode ? (
                  <input
                    className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-sm font-semibold text-primary placeholder:text-tertiary focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                    value={draft.phone || ""}
                    onChange={(e) => setDraft({ ...draft, phone: formatPhone(e.target.value) })}
                    placeholder="010-0000-0000"
                  />
                ) : (
                  <span className="text-sm font-mono font-bold text-primary">{draft.phone || "-"}</span>
                )
              } isEditMode={isEditMode} copyValue={draft.phone} />

              <DrawerField label="이메일" value={
                isEditMode ? (
                  <input
                    className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-sm font-semibold text-primary placeholder:text-tertiary focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                    value={draft.email || ""}
                    onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                    placeholder="example@email.com"
                  />
                ) : (
                  <span className="text-sm font-medium text-secondary truncate">{draft.email || "-"}</span>
                )
              } isEditMode={isEditMode} copyValue={draft.email} />
            </div>
          </div>
        </DrawerSection>

        <DrawerSection 
          title="배정된 교육 회차" 
          collapsible 
          defaultCollapsed={false}
          action={
            instructor?.id ? (
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-brand-primary hover:bg-brand-primary/10 rounded-xl transition-all"
                onClick={() => setShowAssignModal(true)}
              >
                <Plus size={14} strokeWidth={2.5} /> 과정 배정
              </button>
            ) : undefined
          }
        >
          {!instructor?.id ? (
            <div className="py-10 text-center bg-surface-subtle/30 rounded-2xl border-2 border-dashed border-border/50">
              <p className="text-[12px] text-tertiary font-bold">강사 기본 정보를 먼저 저장(등록)한 후, 교육 과정을 배정할 수 있습니다.</p>
            </div>
          ) : (instructor.assignedSessions && instructor.assignedSessions.length > 0) ? (
            <div className="space-y-2.5">
              {instructor.assignedSessions.map((session: any) => (
                <div key={session.id} className="p-4 bg-surface border border-border/50 rounded-[20px] flex items-center justify-between shadow-subtle group/session hover:border-brand-primary/30 transition-all">
                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] font-black text-primary leading-tight truncate">{session.subCourseName}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="px-1.5 py-0.5 bg-surface-subtle text-tertiary text-[9px] font-black rounded uppercase tracking-wider">{session.groupName}</span>
                      <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-disabled">
                        <CalendarIcon size={10} />
                        <span>{session.startDate || "-"}</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleRemoveAssignment(session.id, session.subCourseName)}
                    className="p-1.5 text-disabled hover:text-error hover:bg-error/5 rounded-lg opacity-0 group-hover/session:opacity-100 transition-all ml-4"
                    title="배정 취소"
                  >
                    <X size={14} strokeWidth={3} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center bg-surface-subtle/20 rounded-[24px] border-2 border-dashed border-border/40">
              <p className="text-xs text-tertiary font-bold italic">배정된 교육 일정이 없습니다.</p>
            </div>
          )}
        </DrawerSection>
      </SideDrawer>

      {showAssignModal && instructor?.id && (
        <AssignCourseModal
          instructorId={instructor.id}
          instructorName={instructor.name}
          onClose={() => setShowAssignModal(false)}
        />
      )}
    </>
  );
}
