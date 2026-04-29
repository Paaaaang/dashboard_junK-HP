import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Mail, Download, X, Check } from "lucide-react";

import { PageHeader } from "../../components/layout";
import { useCompanyStore, useParticipantStore, useCourseStore } from "../../stores";
import { ParticipantDrawer } from "./ParticipantDrawer";
import { AddParticipantModal } from "./modals/AddParticipantModal";
import { ParticipantsTable } from "./ParticipantsTable";
import { useParticipantFilters } from "./hooks/useParticipantFilters";
import { 
  CourseManagerModal, 
  CourseGroup, 
  CourseGroupForm, 
  CourseDetailDraft, 
  CourseDetail, 
  AudienceOption 
} from "../companies/modals/CourseManagerModal";
import type { CompanyRecord, CompanyParticipation, CourseType, ParticipantEnrollment, ParticipantRecord } from "../../types/models";

const PAGE_SIZE = 20;

const AUDIENCE_OPTIONS: AudienceOption[] = [
  "재직자 (고용보험 가입)",
  "재직자 (고용보험 미가입)",
  "기업 대표",
  "임원",
  "미래인재",
];

const ADDING_NEW_DETAIL = "__new__";

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
  };
}

function calculateDurationDays(
  startDate: string,
  endDate: string,
): number | null {
  if (!startDate || !endDate) return null;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const milliseconds = end.getTime() - start.getTime();
  if (Number.isNaN(milliseconds) || milliseconds < 0) return null;
  return Math.floor(milliseconds / (1000 * 60 * 60 * 24)) + 1;
}

function toDotDate(value: string | undefined): string {
  if (!value) return "-";
  return value.split("-").join(".");
}

export function ParticipantsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { participants, upsertParticipant } = useParticipantStore();
  const { companies: allCompanies, setCompanies: setGlobalCompanies } = useCompanyStore();
  const { courseGroups, updateCourseGroup, addCourseGroup, deleteCourseGroup } = useCourseStore();

  const {
    activeTab,
    setActiveTab,
    completionFilter,
    setCompletionFilter,
    insuranceFilter,
    setInsuranceFilter,
    searchRaw,
    setSearchRaw,
    filtered,
    filtersActive,
    resetFilters,
  } = useParticipantFilters(participants);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [openParticipantId, setOpenParticipantId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [toasts, setToasts] = useState<Array<{ id: string; message: string }>>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const lastSelectedIdRef = useRef<string | null>(null);
  const selectAllRef = useRef<HTMLInputElement>(null);

  // ── Course Manager State ──
  const [showCourseManager, setShowCourseManager] = useState(false);
  const [managerSelectedGroupId, setManagerSelectedGroupId] = useState<string | null>(courseGroups[0]?.id ?? null);
  const [managerExpandedGroups, setManagerExpandedGroups] = useState<Set<string>>(new Set([courseGroups[0]?.id ?? ""]));
  const [managerGroupForm, setManagerGroupForm] = useState<CourseGroupForm>(
    () => courseGroups[0] ? cloneGroupToForm(courseGroups[0]) : createEmptyGroupForm()
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

  // ?open=participantId → auto open drawer
  useEffect(() => {
    const openId = searchParams.get("open");
    if (openId) setOpenParticipantId(openId);
  }, [searchParams]);

  const openDrawer = useCallback((id: string) => {
    setOpenParticipantId(id);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("open", id);
      return next;
    });
  }, [setSearchParams]);

  const closeDrawer = useCallback(() => {
    setOpenParticipantId(null);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("open");
      return next;
    });
  }, [setSearchParams]);

  const handleDrawerClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      closeDrawer();
      setIsClosing(false);
    }, 200);
  }, [closeDrawer]);

  // Pagination
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  useEffect(() => {
    setCurrentPage(1);
  }, [filtered]);

  // Selection Logic
  const allFilteredSelected = filtered.length > 0 && filtered.every((p) => selectedIds.has(p.id));

  useEffect(() => {
    if (selectAllRef.current) {
      const hasPartial = selectedIds.size > 0 && !allFilteredSelected;
      selectAllRef.current.indeterminate = hasPartial;
    }
  }, [selectedIds, allFilteredSelected]);

  const toggleSelect = useCallback((id: string, event?: React.MouseEvent) => {
    if (event?.shiftKey && lastSelectedIdRef.current) {
      const ids = filtered.map((p) => p.id);
      const lastIdx = ids.indexOf(lastSelectedIdRef.current);
      const currIdx = ids.indexOf(id);
      if (lastIdx !== -1 && currIdx !== -1) {
        const start = Math.min(lastIdx, currIdx);
        const end = Math.max(lastIdx, currIdx);
        const rangeIds = ids.slice(start, end + 1);
        setSelectedIds((prev) => {
          const next = new Set(prev);
          rangeIds.forEach((rid) => next.add(rid));
          return next;
        });
        return;
      }
    }
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    lastSelectedIdRef.current = id;
  }, [filtered]);

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filtered.forEach((p) => next.delete(p.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filtered.forEach((p) => next.add(p.id));
        return next;
      });
    }
  };

  const addToast = (message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  };

  const openParticipant = useMemo(
    () => (openParticipantId ? participants.find((p) => p.id === openParticipantId) : null),
    [openParticipantId, participants],
  );

  // ── Course Manager Handlers ──
  const openCourseManagerModal = () => {
    const firstGroup = courseGroups[0];
    setManagerSelectedGroupId(firstGroup?.id ?? null);
    setManagerGroupForm(firstGroup ? cloneGroupToForm(firstGroup) : createEmptyGroupForm());
    setManagerDetailForm(null);
    setManagerEditingDetailId(null);
    setManagerError("");
    setManagerMessage("");
    setPendingDeleteGroupId(null);
    setShowCourseManager(true);
  };

  const closeCourseManager = () => {
    if (isManagerGroupModified) {
      setManagerCancelConfirmPending(true);
      return;
    }
    forceCloseCourseManager();
  };

  const forceCloseCourseManager = () => {
    setShowCourseManager(false);
    setManagerError("");
    setManagerMessage("");
    setPendingDeleteGroupId(null);
    setManagerDetailForm(null);
    setManagerEditingDetailId(null);
    setManagerCancelConfirmPending(false);
  };

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
    if (!managerDetailForm) return;
    const trimmedName = managerDetailForm.name.trim();
    if (!trimmedName) {
      setManagerError("세부 과정명을 입력해 주세요.");
      return;
    }
    const autoDuration = calculateDurationDays(managerDetailForm.startDate, managerDetailForm.endDate);
    const durationValue = Number(managerDetailForm.durationDays) || autoDuration || 0;
    const totalHours = Number(managerDetailForm.totalHours) || 0;
    const targetOutcome = Number(managerDetailForm.targetOutcome) || 0;

    if (durationValue <= 0 || totalHours <= 0 || targetOutcome <= 0) {
      setManagerError("진행 기간, 시간, 목표 성과는 1 이상 값이 필요합니다.");
      return;
    }

    const isEditing = managerEditingDetailId && managerEditingDetailId !== ADDING_NEW_DETAIL;
    const nextDetail: CourseDetail = {
      id: isEditing ? managerEditingDetailId! : createLocalId("detail"),
      name: trimmedName,
      startDate: managerDetailForm.startDate,
      endDate: managerDetailForm.endDate,
      durationDays: durationValue,
      totalHours,
      targetOutcome,
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

      useCourseStore.getState().updateCourseGroup(nextGroup);

      // Cascading update to companies participations
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
      useCourseStore.getState().addCourseGroup(nextGroup);
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

    useCourseStore.getState().deleteCourseGroup(target.id);
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

  return (
    <div className="min-h-screen pb-20">
      <PageHeader title="참여자 관리" />

      <ParticipantsTable
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        completionFilter={completionFilter}
        setCompletionFilter={setCompletionFilter}
        insuranceFilter={insuranceFilter}
        setInsuranceFilter={setInsuranceFilter}
        searchRaw={searchRaw}
        setSearchRaw={setSearchRaw}
        filtersActive={filtersActive}
        resetFilters={resetFilters}
        onOpenCourseManager={openCourseManagerModal}
        onShowAddModal={() => setShowAddModal(true)}
        paginatedParticipants={paginated}
        allFilteredSelected={allFilteredSelected}
        toggleSelectAll={toggleSelectAll}
        selectedIds={selectedIds}
        toggleSelect={toggleSelect}
        openDrawer={openDrawer}
        currentPage={currentPage}
        totalPages={totalPages}
        setCurrentPage={setCurrentPage}
        selectAllRef={selectAllRef}
        navigate={navigate}
      />

      {/* ── Floating Selection Bar ── */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-40 w-max max-w-[90vw] animate-in fade-in slide-in-from-bottom-6 duration-300">
          <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl px-6 py-4 shadow-glass flex items-center gap-8 border border-white/10">
            <div className="flex items-center gap-3 border-r border-white/20 pr-8">
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-sm font-bold shadow-soft">
                {selectedIds.size}
              </div>
              <p className="text-white text-sm font-medium">
                참여자 선택됨
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="flex items-center gap-2 px-4 py-2 text-white/90 hover:text-white hover:bg-white/10 rounded-xl transition-all text-sm font-semibold group"
                onClick={() => addToast("이메일 발송 기능은 준비 중입니다.")}
              >
                <Mail size={16} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                <span>이메일 발송</span>
              </button>
              <button
                type="button"
                className="flex items-center gap-2 px-4 py-2 text-white/90 hover:text-white hover:bg-white/10 rounded-xl transition-all text-sm font-semibold group"
                onClick={() => addToast("내보내기 기능은 준비 중입니다.")}
              >
                <Download size={16} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                <span>내보내기</span>
              </button>
              <button
                type="button"
                className="ml-2 flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-xl transition-all text-sm font-medium group"
                onClick={() => setSelectedIds(new Set())}
              >
                <X size={16} className="group-hover:rotate-90 transition-transform" />
                <span>선택 해제</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Drawer & Modals ── */}
      {openParticipant && (
        <ParticipantDrawer
          participant={openParticipant}
          onClose={handleDrawerClose}
          isClosing={isClosing}
          allCompanies={allCompanies}
          participants={participants}
          onUpdate={async (updated) => {
            if (!updated.name.trim()) {
              addToast("이름을 입력해 주세요.");
              return;
            }
            // Simulate API delay
            await new Promise((resolve) => setTimeout(resolve, 800));
            upsertParticipant(updated);
            addToast("정보가 저장되었습니다.");
          }}
        />
      )}

      {showAddModal && (
        <AddParticipantModal
          onClose={() => setShowAddModal(false)}
          allCompanies={allCompanies}
          onAdd={(p) => {
            upsertParticipant(p);
            setShowAddModal(false);
            addToast(`${p.name} 참여자가 추가되었습니다.`);
          }}
        />
      )}

      {showCourseManager && (
        <CourseManagerModal
          onClose={closeCourseManager}
          courseGroups={courseGroups}
          managerSelectedGroupId={managerSelectedGroupId}
          managerExpandedGroups={managerExpandedGroups}
          managerGroupForm={managerGroupForm}
          managerDetailForm={managerDetailForm}
          managerEditingDetailId={managerEditingDetailId}
          managerError={managerError}
          managerMessage={managerMessage}
          audienceOptions={AUDIENCE_OPTIONS}
          addingNewDetailId={ADDING_NEW_DETAIL}
          isManagerGroupModified={isManagerGroupModified}
          onSelectGroup={selectGroupForManager}
          onStartCreateGroup={startCreateCourseGroup}
          onToggleGroup={toggleManagerGroup}
          onDeleteGroupClick={setPendingDeleteGroupId}
          onGroupNameChange={(name) => setManagerGroupForm(prev => ({ ...prev, name }))}
          onToggleAudience={toggleManagerAudience}
          onStartAddDetail={startAddDetail}
          onStartEditDetail={startEditDetail}
          onRemoveDetail={removeDetailFromForm}
          onDetailFormChange={(field, value) => setManagerDetailForm(prev => prev ? ({ ...prev, [field]: value }) : prev)}
          onApplyDetailDraft={applyDetailDraft}
          onCancelDetailEdit={() => { setManagerDetailForm(null); setManagerEditingDetailId(null); }}
          onSaveGroup={saveCourseGroup}
          calculateDurationDays={calculateDurationDays}
          toDotDate={toDotDate}
        />
      )}

      {pendingDeleteGroupId && (
        <div className="modal-backdrop confirm-modal">
          <div className="modal-panel modal-panel-sm">
            <div className="modal-header">
              <h3>과정 삭제</h3>
              <button type="button" className="icon-btn" onClick={() => setPendingDeleteGroupId(null)}><X className="icon-sm" /></button>
            </div>
            <div className="modal-content"><p>과정을 삭제하시겠습니까?</p></div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setPendingDeleteGroupId(null)}>취소</button>
              <button className="btn btn-primary" onClick={confirmDeleteCourseGroup}>삭제</button>
            </div>
          </div>
        </div>
      )}

      {managerCancelConfirmPending && (
        <div className="modal-backdrop confirm-modal">
          <div className="modal-panel modal-panel-sm">
            <div className="modal-header">
              <h3>변경 사항 취소</h3>
              <button type="button" className="icon-btn" onClick={() => setManagerCancelConfirmPending(false)}><X className="icon-sm" /></button>
            </div>
            <div className="modal-content"><p>내용이 저장되지 않았습니다. 닫으시겠습니까?</p></div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setManagerCancelConfirmPending(false)}>계속 편집</button>
              <button className="btn btn-primary" onClick={() => { setManagerCancelConfirmPending(false); forceCloseCourseManager(); }}>닫기</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast Notifications ── */}
      {toasts.length > 0 && (
        <div className="fixed bottom-24 right-6 z-[500] flex flex-col gap-3">
          {toasts.map((t) => (
            <div
              key={t.id}
              className="bg-slate-900 text-white px-6 py-4 rounded-2xl text-[13px] font-semibold shadow-2xl flex items-center gap-3 border border-white/10 min-w-[280px] animate-in slide-in-from-right-full duration-300"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
              <p className="flex-1">{t.message}</p>
              <button onClick={() => setToasts(prev => prev.filter(toast => toast.id !== t.id))} className="text-slate-500 hover:text-white transition-colors">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
