import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Mail, Download } from "lucide-react";

import { PageHeader, FloatingActionBar } from "../../components";
import { useCompanyStore, useParticipantStore, useToastStore } from "../../stores";
import type { ParticipantRecord } from "../../types/models";
import { ParticipantDrawer } from "./ParticipantDrawer";
import { AddParticipantModal } from "./modals/AddParticipantModal";
import { AddParticipantChoiceModal } from "./modals/AddParticipantChoiceModal";
import { UploadModal } from "./modals/UploadModal";
import { ParticipantsTable } from "./ParticipantsTable";
import { useParticipantFilters } from "./hooks/useParticipantFilters";
import { useParticipantSelection } from "./hooks/useParticipantSelection";
import { useParticipantExcel } from "./hooks/useParticipantExcel";

const PAGE_SIZE = 20;

const SYSTEM_FIELDS = [
  { key: "name", label: "이름 *" },
  { key: "companyName", label: "소속 기업 *" },
  { key: "position", label: "직위" },
  { key: "phone", label: "연락처" },
  { key: "email", label: "이메일" },
  { key: "employmentInsurance", label: "고용보험" },
  { key: "workExperience", label: "경력사항" },
  { key: "documentSkill", label: "서류역량" },
  { key: "__skip__", label: "건너뛰기" },
];

export function ParticipantsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { participants, upsertParticipant, fetchParticipants, error: storeError } = useParticipantStore();
  const { companies: allCompanies } = useCompanyStore();
  const { addToast } = useToastStore();

  const handleUpdateParticipant = async (updated: ParticipantRecord) => {
    if (!updated.name.trim()) {
      addToast("이름을 입력해 주세요.", "error");
      return;
    }
    await upsertParticipant(updated);
    addToast("정보가 저장되었습니다.", "success");
    fetchParticipants(); // Reload table
  };

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

  const {
    selectedIds,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    allFilteredSelected,
    selectAllRef,
  } = useParticipantSelection(filtered) as any;

  const {
    showUploadModal,
    openUploadModal,
    closeUploadModal,
    uploadStep,
    rawRows,
    columnMapping,
    setColumnMapping,
    uploadPreview,
    uploadError,
    parseExcelFile,
    goNextToPreview,
    confirmUpload,
    resetUpload,
  } = useParticipantExcel(allCompanies, addToast);

  const [openParticipantId, setOpenParticipantId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showChoiceModal, setShowChoiceModal] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

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

  const openParticipant = useMemo(
    () => (openParticipantId ? participants.find((p) => p.id === openParticipantId) : null),
    [openParticipantId, participants],
  );

  useEffect(() => {
    if (storeError) {
      addToast(`에러: ${storeError}`, "error");
      useParticipantStore.getState().clearError();
    }
  }, [storeError, addToast]);

  return (
    <div className="min-h-screen pb-20">
      <PageHeader 
        title="참여자 관리" 
        actions={
          <button 
            type="button" 
            className="btn btn-primary" 
            onClick={() => setShowChoiceModal(true)}
          >
            <span>참여자 추가</span>
          </button>
        }
      />

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

      <FloatingActionBar
        count={selectedIds.size}
        label="참여자 선택됨"
        onClear={clearSelection}
        actions={[
          {
            label: "이메일 발송",
            icon: Mail,
            onClick: () => addToast("이메일 발송 기능은 준비 중입니다."),
          },
          {
            label: "내보내기",
            icon: Download,
            onClick: async () => {
              const XLSX = await import("xlsx");
              const selectedData = participants.filter(p => selectedIds.has(p.id));
              
              const rows = selectedData.map(p => ({
                이름: p.name,
                "소속 기업": p.companyName,
                직위: p.position || "-",
                연락처: p.phone,
                이메일: p.email,
                "고용보험 가입여부": p.employmentInsurance,
                "업무 경력": p.workExperience || "-",
                "문서작성 역량": p.documentSkill || "-",
                "참여 과정 수": p.enrollments.length,
                "수료 과정 수": p.enrollments.filter(e => e.status === "수료").length,
                "상세 과정 요약": p.enrollments.map(e => `${e.subCourseName}(${e.status})`).join(", ")
              }));

              const ws = XLSX.utils.json_to_sheet(rows);
              const wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, "참여자 명단");
              XLSX.writeFile(wb, `participants_export_${Date.now()}.xlsx`);
              addToast(`${selectedIds.size}명의 데이터를 내보냈습니다.`, "success");
            }
          }
        ]}
      />

      {/* ── Drawer & Modals ── */}
      {openParticipant && (
        <ParticipantDrawer
          participant={openParticipant}
          onClose={handleDrawerClose}
          isClosing={isClosing}
          onUpdate={handleUpdateParticipant}
        />
      )}

      {showAddModal && (
        <AddParticipantModal
          onClose={() => setShowAddModal(false)}
          allCompanies={allCompanies}
          onAdd={async (p) => {
            await upsertParticipant(p);
            setShowAddModal(false);
            addToast(`${p.name} 참여자가 추가되었습니다.`, "success");
            fetchParticipants();
          }}
        />
      )}

      {showUploadModal && (
        <UploadModal
          onClose={closeUploadModal}
          uploadStep={uploadStep}
          rawRows={rawRows}
          columnMapping={columnMapping}
          onMappingChange={(col, field) => setColumnMapping(prev => ({ ...prev, [col]: field }))}
          onNextStep={goNextToPreview}
          systemFields={SYSTEM_FIELDS}
          uploadPreview={uploadPreview}
          uploadError={uploadError}
          onFileChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              setColumnMapping({}); // Reset mapping on new file
              parseExcelFile(file);
            }
          }}
          onDropzoneDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files?.[0];
            if (file) {
              setColumnMapping({});
              parseExcelFile(file);
            }
          }}
          onConfirm={async () => {
            await confirmUpload();
            fetchParticipants();
          }}
          onReset={resetUpload}
        />
      )}

      {showChoiceModal && (
        <AddParticipantChoiceModal
          onClose={() => setShowChoiceModal(false)}
          onUploadClick={() => { setShowChoiceModal(false); openUploadModal(); }}
          onCreateModalClick={() => { setShowChoiceModal(false); setShowAddModal(true); }}
        />
      )}
    </div>
  );
}
