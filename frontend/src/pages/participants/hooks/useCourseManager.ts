import { useState, useMemo, useCallback } from "react";
import { useCourseStore, useCompanyStore } from "../../../stores";
import type { 
  CourseGroup, 
  CourseGroupForm, 
  CourseDetailDraft, 
  CourseDetail, 
  AudienceOption 
} from "../../../types/models";

let localSequence = 0;
function createLocalId(prefix: string): string {
  localSequence += 1;
  return `${prefix}-${Date.now()}-${localSequence}`;
}

function cloneGroupToForm(group: CourseGroup): CourseGroupForm {
  return {
    name: group.name,
    audiences: [...group.audiences],
    details: group.details.map((detail) => ({ ...detail })),
  };
}

function createEmptyGroupForm(): CourseGroupForm {
  return {
    name: "",
    audiences: [],
    details: [],
  };
}

function createEmptyDetailDraft(): CourseDetailDraft {
  return {
    name: "",
    startDate: "",
    endDate: "",
    durationDays: "",
    totalHours: "",
    targetOutcome: "",
    sessions: [],
  };
}

function calculateDurationDays(startDate: string, endDate: string): number | null {
  if (!startDate || !endDate) return null;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const milliseconds = end.getTime() - start.getTime();
  if (Number.isNaN(milliseconds) || milliseconds < 0) return null;
  return Math.floor(milliseconds / (1000 * 60 * 60 * 24)) + 1;
}

const ADDING_NEW_DETAIL = "__new__";

export function useCourseManager() {
  const { courseGroups, updateCourseGroup, addCourseGroup, deleteCourseGroup } = useCourseStore();
  const { setCompanies: setGlobalCompanies } = useCompanyStore();

  const [showCourseManager, setShowCourseManager] = useState(false);
  const [managerSelectedGroupId, setManagerSelectedGroupId] = useState<string | null>(courseGroups[0]?.id ?? null);
  const [managerExpandedGroups, setManagerExpandedGroups] = useState<Set<string>>(new Set([courseGroups[0]?.id ?? ""]));
  const [managerGroupForm, setManagerGroupForm] = useState<CourseGroupForm>(
    () => (courseGroups[0] ? cloneGroupToForm(courseGroups[0]) : createEmptyGroupForm())
  );
  const [managerDetailForm, setManagerDetailForm] = useState<CourseDetailDraft | null>(null);
  const [managerEditingDetailId, setManagerEditingDetailId] = useState<string | null>(null);
  const [managerError, setManagerError] = useState("");
  const [managerMessage, setManagerMessage] = useState("");
  const [pendingDeleteGroupId, setPendingDeleteGroupId] = useState<string | null>(null);
  const [managerCancelConfirmPending, setManagerCancelConfirmPending] = useState(false);

  const isManagerGroupModified = useMemo(() => {
    if (!managerSelectedGroupId) return true;
    const original = courseGroups.find((g) => g.id === managerSelectedGroupId);
    if (!original) return true;
    const current = { id: original.id, ...managerGroupForm };
    return JSON.stringify(original) !== JSON.stringify(current);
  }, [managerSelectedGroupId, managerGroupForm, courseGroups]);

  const openCourseManagerModal = useCallback(() => {
    const firstGroup = courseGroups[0];
    setManagerSelectedGroupId(firstGroup?.id ?? null);
    setManagerGroupForm(firstGroup ? cloneGroupToForm(firstGroup) : createEmptyGroupForm());
    setManagerDetailForm(null);
    setManagerEditingDetailId(null);
    setManagerError("");
    setManagerMessage("");
    setPendingDeleteGroupId(null);
    setShowCourseManager(true);
  }, [courseGroups]);

  const forceCloseCourseManager = useCallback(() => {
    setShowCourseManager(false);
    setManagerError("");
    setManagerMessage("");
    setPendingDeleteGroupId(null);
    setManagerDetailForm(null);
    setManagerEditingDetailId(null);
    setManagerCancelConfirmPending(false);
  }, []);

  const closeCourseManager = useCallback(() => {
    if (isManagerGroupModified) {
      setManagerCancelConfirmPending(true);
      return;
    }
    forceCloseCourseManager();
  }, [isManagerGroupModified, forceCloseCourseManager]);

  const selectGroupForManager = (groupId: string) => {
    const group = courseGroups.find((item) => item.id === groupId);
    if (!group) return;
    setManagerSelectedGroupId(group.id);
    setManagerGroupForm(cloneGroupToForm(group));
    setManagerDetailForm(null);
    setManagerEditingDetailId(null);
    setManagerError("");
    setManagerMessage("");
  };

  const startCreateCourseGroup = () => {
    setManagerSelectedGroupId(null);
    setManagerGroupForm(createEmptyGroupForm());
    setManagerDetailForm(null);
    setManagerEditingDetailId(null);
    setManagerError("");
    setManagerMessage("");
  };

  const toggleManagerAudience = (target: AudienceOption) => {
    setManagerGroupForm((prev) => {
      const hasTarget = prev.audiences.includes(target);
      const nextAudiences = hasTarget
        ? prev.audiences.filter((a) => a !== target)
        : [...prev.audiences, target];
      return { ...prev, audiences: nextAudiences };
    });
  };

  const startAddDetail = () => {
    setManagerDetailForm(createEmptyDetailDraft());
    setManagerEditingDetailId(ADDING_NEW_DETAIL);
  };

  const startEditDetail = (groupId: string, detailId: string) => {
    const sourceGroup = groupId === managerSelectedGroupId
      ? { id: groupId, ...managerGroupForm }
      : courseGroups.find((g) => g.id === groupId);
    const detail = sourceGroup?.details.find((d) => d.id === detailId);
    if (!detail || !sourceGroup) return;
    if (groupId !== managerSelectedGroupId) {
      setManagerSelectedGroupId(groupId);
      setManagerGroupForm(cloneGroupToForm(sourceGroup as CourseGroup));
    }
    setManagerEditingDetailId(detail.id);
    setManagerDetailForm({
      name: detail.name,
      startDate: detail.startDate,
      endDate: detail.endDate,
      durationDays: String(detail.durationDays),
      totalHours: String(detail.totalHours),
      targetOutcome: String(detail.targetOutcome),
      sessions: detail.sessions || [{
        id: createLocalId("session"),
        startDate: detail.startDate,
        endDate: detail.endDate,
        totalHours: detail.totalHours,
        targetOutcome: detail.targetOutcome
      }]
    });
  };

  const removeDetailFromForm = (groupId: string, detailId: string) => {
    if (groupId !== managerSelectedGroupId) {
      const group = courseGroups.find((g) => g.id === groupId);
      if (!group) return;
      setManagerSelectedGroupId(groupId);
      setManagerGroupForm({
        name: group.name,
        audiences: [...group.audiences],
        details: group.details.filter((d) => d.id !== detailId),
      });
      return;
    }
    setManagerGroupForm((prev) => ({
      ...prev,
      details: prev.details.filter((d) => d.id !== detailId),
    }));
  };

  const applyDetailDraft = () => {
    if (!managerDetailForm) return false;
    const trimmedName = managerDetailForm.name.trim();
    if (!trimmedName) {
      setManagerError("세부 과정명을 입력해 주세요.");
      return false;
    }
    
    if (managerDetailForm.sessions.length === 0) {
      setManagerError("최소 1개 이상의 세션을 등록해 주세요.");
      return false;
    }

    // Aggregate sessions data
    let totalH = 0;
    let totalT = 0;
    let minDate = "";
    let maxDate = "";

    managerDetailForm.sessions.forEach(s => {
      totalH += Number(s.totalHours) || 0;
      totalT += Number(s.targetOutcome) || 0;
      if (!minDate || (s.startDate && s.startDate < minDate)) minDate = s.startDate;
      if (!maxDate || (s.endDate && s.endDate > maxDate)) maxDate = s.endDate;
    });

    const isEditing = managerEditingDetailId && managerEditingDetailId !== ADDING_NEW_DETAIL;
    const nextDetail: CourseDetail = {
      id: isEditing ? managerEditingDetailId! : createLocalId("detail"),
      name: trimmedName,
      startDate: minDate,
      endDate: maxDate,
      durationDays: calculateDurationDays(minDate, maxDate) || 0,
      totalHours: totalH,
      targetOutcome: totalT,
      sessions: managerDetailForm.sessions
    };

    setManagerGroupForm((prev) => {
      if (isEditing) {
        return {
          ...prev,
          details: prev.details.map((d) => d.id === managerEditingDetailId ? nextDetail : d),
        };
      }
      return { ...prev, details: [...prev.details, nextDetail] };
    });
    setManagerDetailForm(null);
    setManagerEditingDetailId(null);
    setManagerError("");
    return true;
  };

  const saveCourseGroup = () => {
    const trimmedName = managerGroupForm.name.trim();
    if (!trimmedName) {
      setManagerError("과정 구분 이름을 입력해 주세요.");
      return;
    }
    const duplicate = courseGroups.find(g => g.name.toLowerCase() === trimmedName.toLowerCase() && g.id !== managerSelectedGroupId);
    if (duplicate) {
      setManagerError("동일한 과정 구분 이름이 이미 존재합니다.");
      return;
    }
    if (managerGroupForm.details.length === 0) {
      setManagerError("세부 과정을 최소 1개 이상 등록해 주세요.");
      return;
    }

    const nextGroup: CourseGroup = {
      id: managerSelectedGroupId ?? createLocalId("group"),
      name: trimmedName,
      audiences: [...managerGroupForm.audiences],
      details: managerGroupForm.details.map(d => ({ ...d })),
    };

    if (managerSelectedGroupId) {
      const oldGroup = courseGroups.find(g => g.id === managerSelectedGroupId);
      if (!oldGroup) return;

      const removedDetailNames = oldGroup.details
        .map(d => d.name)
        .filter(name => !nextGroup.details.some(d => d.name.toLowerCase() === name.toLowerCase()));

      updateCourseGroup(nextGroup);

      const currRaw = useCompanyStore.getState().companies;
      const nextRaw = currRaw.map(company => {
        let matched = false;
        const nextParticipations = company.participations.map(p => {
          if (p.courseType !== oldGroup.name) return p;
          matched = true;
          const nextProgramNames = p.programNames.filter(name => !removedDetailNames.includes(name));
          return {
            ...p,
            courseType: nextGroup.name,
            programNames: nextProgramNames,
            enabled: nextProgramNames.length > 0 ? p.enabled : false,
            status: nextProgramNames.length > 0 ? p.status : ("미참여" as const),
          };
        });
        if (!matched) {
          nextParticipations.push({
            courseType: nextGroup.name,
            enabled: false,
            programNames: [],
            status: "미참여" as const,
          });
        }
        return { ...company, participations: nextParticipations };
      });
      setGlobalCompanies(nextRaw);

      setManagerGroupForm(cloneGroupToForm(nextGroup));
      setManagerMessage("과정 구분이 저장되었습니다.");
      setManagerError("");
    } else {
      addCourseGroup(nextGroup);
      const currRaw = useCompanyStore.getState().companies;
      const nextRaw = currRaw.map(company => ({
        ...company,
        participations: [
          ...company.participations,
          { courseType: nextGroup.name, enabled: false, programNames: [], status: "미참여" as const }
        ]
      }));
      setGlobalCompanies(nextRaw);
      setManagerSelectedGroupId(nextGroup.id);
      setManagerGroupForm(cloneGroupToForm(nextGroup));
      setManagerMessage("새 과정 구분이 추가되었습니다.");
      setManagerError("");
    }
  };

  const confirmDeleteCourseGroup = () => {
    if (!pendingDeleteGroupId) return;
    const target = courseGroups.find(g => g.id === pendingDeleteGroupId);
    if (!target) return;

    deleteCourseGroup(target.id);
    const currRaw = useCompanyStore.getState().companies;
    const nextRaw = currRaw.map(company => ({
      ...company,
      participations: company.participations.filter(p => p.courseType !== target.name)
    }));
    setGlobalCompanies(nextRaw);

    const remaining = courseGroups.filter(g => g.id !== target.id);
    const firstGroup = remaining[0];
    setManagerSelectedGroupId(firstGroup?.id ?? null);
    setManagerGroupForm(firstGroup ? cloneGroupToForm(firstGroup) : createEmptyGroupForm());
    setManagerMessage("과정 구분이 삭제되었습니다.");
    setManagerError("");
    setPendingDeleteGroupId(null);
  };

  const toggleManagerGroup = (groupId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setManagerExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  return {
    showCourseManager,
    openCourseManagerModal,
    closeCourseManager,
    forceCloseCourseManager,
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
    managerMessage,
    pendingDeleteGroupId,
    setPendingDeleteGroupId,
    managerCancelConfirmPending,
    setManagerCancelConfirmPending,
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
    calculateDurationDays,
  };
}
