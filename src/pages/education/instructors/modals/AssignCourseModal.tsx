import { useState, useMemo } from "react";
import { X, ChevronDown, Check, Loader2, Search, AlertCircle } from "lucide-react";
import { useCourseStore, useInstructorStore, useToastStore } from "@/stores";
import { ModalPortal } from "@/components/Modal";
import { toDotDate } from "@/pages/companies/utils/companyUtils";

interface AssignCourseModalProps {
  instructorId: string;
  instructorName: string;
  onClose: () => void;
}

export function AssignCourseModal({
  instructorId,
  instructorName,
  onClose,
}: AssignCourseModalProps) {
  const { courseGroups } = useCourseStore();
  const { instructors, assignInstructorToMultipleSessions } = useInstructorStore();
  const { addToast } = useToastStore();
  
  // Find current instructor to check already assigned sessions
  const currentInstructor = instructors.find(i => i.id === instructorId);
  const alreadyAssignedSubCourseIds = useMemo(() => 
    currentInstructor?.assignedSessions?.map(s => s.subCourseId) || []
  , [currentInstructor]);

  const [selectedGroupId, setSelectedGroupId] = useState("");
  // key: subCourseId, value: sessionId
  const [selectedAssignments, setSelectedAssignments] = useState<Record<string, string>>({});
  const [focusedCourseId, setFocusedCourseId] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);
  
  const selectedGroup = courseGroups.find(g => g.id === selectedGroupId);
  const focusedSubCourse = selectedGroup?.details.find(d => d.id === focusedCourseId);
  const sessions = focusedSubCourse?.sessions || [];
  
  const selectedCount = Object.keys(selectedAssignments).length;

  const handleToggleCourse = (courseId: string, defaultSessionId: string) => {
    if (alreadyAssignedSubCourseIds.includes(courseId)) return;

    setSelectedAssignments(prev => {
      const next = { ...prev };
      if (next[courseId]) {
        delete next[courseId];
        if (focusedCourseId === courseId) setFocusedCourseId("");
      } else {
        next[courseId] = defaultSessionId;
        setFocusedCourseId(courseId);
      }
      return next;
    });
  };

  const handleSelectSession = (sessionId: string) => {
    if (!focusedCourseId) return;
    setSelectedAssignments(prev => ({
      ...prev,
      [focusedCourseId]: sessionId
    }));
  };

  const handleAssign = async () => {
    const sessionIds = Object.values(selectedAssignments);
    if (sessionIds.length === 0) return;
    
    setIsAssigning(true);
    try {
      await assignInstructorToMultipleSessions(instructorId, sessionIds);
      addToast(`${instructorName} 강사가 ${sessionIds.length}개 과정에 배정되었습니다.`, "success");
      onClose();
    } catch (err: any) {
      addToast(`배정 실패: ${err.message}`, "error");
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 bg-brand-dark/40 flex items-center justify-center z-[var(--z-popover)] p-4 animate-in fade-in duration-200">
        <div className="bg-surface rounded-[32px] flex flex-col w-full max-w-[520px] max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300" style={{ boxShadow: "var(--shadow-xl)" }}>
          {/* Header */}
          <div className="px-8 py-6 border-b border-border flex justify-between items-center bg-surface sticky top-0 z-10">
            <div className="flex flex-col gap-0.5">
              <h3 className="text-xl font-bold text-primary">강사 과정 배정</h3>
              <p className="text-xs text-tertiary font-medium">{instructorName} 강사</p>
            </div>
            <button type="button" className="p-2 text-tertiary hover:text-brand-primary hover:bg-brand-primary/10 rounded-full transition-all" onClick={onClose}>
              <X size={20} strokeWidth={2.5} />
            </button>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
            {/* 1. Group Selection */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-tertiary uppercase tracking-widest ml-1">1. 과정 구분 선택</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-disabled" size={14} />
                <select 
                  className="w-full pl-10 pr-10 py-3 bg-surface border border-border rounded-2xl text-sm font-bold focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all appearance-none cursor-pointer shadow-sm"
                  value={selectedGroupId}
                  onChange={(e) => { 
                    setSelectedGroupId(e.target.value); 
                    setFocusedCourseId(""); 
                    setSelectedAssignments({});
                  }}
                >
                  <option value="">과정 그룹을 선택하세요</option>
                  {courseGroups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-tertiary pointer-events-none" size={16} strokeWidth={2.5} />
              </div>
            </div>

            {/* 2. Sub-course Selection */}
            {selectedGroupId && (
              <div className="space-y-6 animate-in slide-in-from-top-2 duration-300">
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[11px] font-black text-tertiary uppercase tracking-widest">2. 세부 과정 선택 (다중 선택 가능)</label>
                    {selectedCount > 0 && (
                      <span className="text-[10px] font-black text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-full">
                        {selectedCount}개 선택됨
                      </span>
                    )}
                  </div>
                  <div className="grid gap-2 max-h-[240px] overflow-y-auto custom-scrollbar p-1">
                    {selectedGroup?.details.map(d => {
                      const isAlreadyAssigned = alreadyAssignedSubCourseIds.includes(d.id);
                      const isSelected = !!selectedAssignments[d.id];
                      const isFocused = focusedCourseId === d.id;
                      
                      return (
                        <button
                          key={d.id}
                          type="button"
                          disabled={isAlreadyAssigned}
                          onClick={() => handleToggleCourse(d.id, d.sessions?.[0]?.id || "")}
                          className={`w-full text-left px-5 py-3 rounded-2xl border transition-all flex items-center justify-between group relative ${
                            isAlreadyAssigned
                              ? "bg-surface-subtle border-border/50 opacity-60 cursor-not-allowed"
                              : isSelected
                                ? isFocused
                                  ? "bg-brand-primary/10 border-brand-primary text-brand-primary shadow-sm"
                                  : "bg-brand-primary/5 border-brand-primary/30 text-brand-primary"
                                : "bg-surface border-border text-secondary hover:border-brand-primary/50 hover:bg-brand-primary/[0.02]"
                          }`}
                        >
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-black">{d.name}</span>
                              {isAlreadyAssigned && (
                                <span className="flex items-center gap-0.5 text-[9px] font-bold text-tertiary bg-disabled/10 px-1.5 py-0.5 rounded">
                                  <AlertCircle size={10} /> 배정됨
                                </span>
                              )}
                            </div>
                            <span className={`text-[10px] font-bold ${isSelected ? "text-brand-primary/70" : "text-tertiary"}`}>
                              {d.sessions && d.sessions.length > 0 
                                ? `기본 기간: ${toDotDate(d.sessions[0].startDate)} ~ ${toDotDate(d.sessions[0].endDate)}`
                                : "등록된 회차 없음"}
                            </span>
                          </div>
                          {isSelected && <Check size={16} strokeWidth={3} />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Session Selection (Only for focused course) */}
                {focusedCourseId && focusedSubCourse && sessions.length > 1 && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-300 bg-surface-subtle/30 p-4 rounded-[24px] border border-border/50">
                    <label className="text-[11px] font-black text-brand-primary uppercase tracking-widest ml-1 flex items-center gap-2">
                      3. [{focusedSubCourse.name}] 회차 변경 <span className="text-[9px] bg-brand-primary/10 px-1.5 py-0.5 rounded-full">{sessions.length}개 회차 있음</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {sessions.map((session, idx) => (
                        <button
                          key={session.id}
                          type="button"
                          onClick={() => handleSelectSession(session.id)}
                          className={`flex-1 min-w-[100px] px-3 py-2.5 rounded-xl border-2 transition-all text-center group ${
                            selectedAssignments[focusedCourseId] === session.id
                              ? "bg-brand-primary border-brand-primary text-white shadow-md scale-[1.02]"
                              : "bg-surface border-border text-secondary hover:border-brand-primary/30"
                          }`}
                        >
                          <p className={`text-[10px] font-black uppercase tracking-tighter ${selectedAssignments[focusedCourseId] === session.id ? "text-white/80" : "text-tertiary"}`}>
                            {idx + 1}회차
                          </p>
                          <p className="text-[11px] font-bold mt-0.5 tabular-nums">
                            {toDotDate(session.startDate)}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 py-6 border-t border-border flex gap-3 bg-surface-subtle/50">
            <button 
              type="button" 
              className="flex-1 py-3.5 text-sm font-bold text-secondary bg-surface border border-border hover:bg-surface-subtle rounded-2xl transition-all" 
              onClick={onClose}
              disabled={isAssigning}
            >
              취소
            </button>
            <button 
              type="button" 
              className="flex-[2] py-3.5 text-sm font-bold text-white bg-brand-primary hover:bg-brand-primary-hover rounded-2xl shadow-lg shadow-brand-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              disabled={selectedCount === 0 || isAssigning}
              onClick={handleAssign}
            >
              {isAssigning ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} strokeWidth={3} />}
              <span>{isAssigning ? "배정 중..." : `과정 배정 완료 ${selectedCount > 0 ? `(${selectedCount})` : ""}`}</span>
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
