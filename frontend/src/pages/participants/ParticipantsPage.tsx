import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Mail, Download, Search, ChevronDown, X, ChevronLeft, ChevronRight } from "lucide-react";

import { FloatingActionBar, DataPageLayout } from "../../components";
import { useCompanyStore, useParticipantStore, useToastStore } from "../../stores";
import type { ParticipantRecord, CompletionFilter, InsuranceFilter, ParticipantTabKey } from "../../types/models";
import { ParticipantDrawer } from "./ParticipantDrawer";
import { AddParticipantModal } from "./modals/AddParticipantModal";
import { AddParticipantChoiceModal } from "./modals/AddParticipantChoiceModal";
import { UploadModal } from "./modals/UploadModal";
import { BulkEmailModal } from "./modals/BulkEmailModal";
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

const TAB_ITEMS: Array<{ key: ParticipantTabKey; label: string }> = [
  { key: "ALL", label: "전체" },
  { key: "훈련비과정", label: "훈련비" },
  { key: "지원비과정", label: "지원비" },
  { key: "공유개방 세미나", label: "세미나" },
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
  const [showEmailModal, setShowEmailModal] = useState(false);
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
    <DataPageLayout
      title="참여자 관리"
      headerActions={
        <button 
          type="button" 
          className="btn btn-primary" 
          onClick={() => setShowChoiceModal(true)}
        >
          <span>참여자 추가</span>
        </button>
      }
      filterBar={
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center p-1 bg-surface border border-border/40 rounded-2xl shadow-subtle w-fit">
            <div className="flex items-center gap-1">
              {TAB_ITEMS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  className={`px-5 py-2 text-sm font-bold rounded-xl transition-all duration-200 ${
                    activeTab === tab.key
                      ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20 scale-[1.02]"
                      : "text-secondary hover:text-primary hover:bg-surface-subtle"
                  }`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="relative">
                <select 
                  className="px-4 pr-10 py-2.5 bg-surface border border-border/40 rounded-xl text-[11px] font-black uppercase tracking-widest text-secondary shadow-subtle cursor-pointer appearance-none min-w-[130px] focus:outline-none focus:ring-2 focus:ring-brand-primary/10"
                  value={completionFilter}
                  onChange={(e) => setCompletionFilter(e.target.value as CompletionFilter)}
                >
                  <option value="ALL">수료 상태: 전체</option>
                  <option value="수료">수료 완료</option>
                  <option value="미수료">미수료</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-tertiary pointer-events-none" strokeWidth={2.5} size={12} />
              </div>
              
              <div className="relative">
                <select 
                  className="px-4 pr-10 py-2.5 bg-surface border border-border/40 rounded-xl text-[11px] font-black uppercase tracking-widest text-secondary shadow-subtle cursor-pointer appearance-none min-w-[130px] focus:outline-none focus:ring-2 focus:ring-brand-primary/10"
                  value={insuranceFilter}
                  onChange={(e) => setInsuranceFilter(e.target.value as InsuranceFilter)}
                >
                  <option value="ALL">고용보험: 전체</option>
                  <option value="가입">가입</option>
                  <option value="미가입">미가입</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-tertiary pointer-events-none" strokeWidth={2.5} size={12} />
              </div>
            </div>

            {filtersActive && (
              <button 
                onClick={resetFilters}
                className="p-2.5 text-tertiary hover:text-error hover:bg-error/5 rounded-xl transition-all shadow-subtle bg-surface border border-border/40 flex items-center gap-1.5"
                title="필터 초기화"
              >
                <X size={16} strokeWidth={2.5} />
                <span className="text-[10px] font-black uppercase tracking-wider pr-1">Reset</span>
              </button>
            )}

            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-tertiary group-focus-within:text-brand-primary transition-colors" strokeWidth={2.5} size={18} />
              <input
                type="text"
                placeholder="이름 또는 기업명 검색..."
                className="pl-11 pr-5 py-2.5 bg-surface border border-border/40 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-primary/10 focus:border-brand-primary transition-all w-[320px] shadow-subtle text-primary placeholder:text-tertiary font-medium"
                value={searchRaw}
                onChange={(e) => setSearchRaw(e.target.value)}
              />
            </div>
          </div>
        </div>
      }
      pagination={
        <nav className="flex items-center justify-between">
          <p className="text-[11px] font-black text-tertiary uppercase tracking-widest">
            참가자 <span>{paginated.length}</span>/<span>{filtered.length}</span>명
          </p>
          <div className="flex items-center gap-1.5">
            <button
              className="p-2 rounded-xl border border-border/40 bg-surface text-tertiary hover:bg-surface-subtle hover:text-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              <ChevronLeft size={18} strokeWidth={2.5} />
            </button>
            <div className="flex items-center px-4 gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  className={`w-9 h-9 rounded-xl text-sm font-black transition-all ${
                    currentPage === page
                      ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20"
                      : "text-tertiary hover:bg-surface-subtle hover:text-secondary"
                  }`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              className="p-2 rounded-xl border border-border/40 bg-surface text-tertiary hover:bg-surface-subtle hover:text-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              <ChevronRight size={18} strokeWidth={2.5} />
            </button>
          </div>
        </nav>
      }
      floatingBar={
        <FloatingActionBar
          count={selectedIds.size}
          label="참여자 선택됨"
          onClear={clearSelection}
          actions={[
            {
              label: "이메일 발송",
              icon: Mail,
              onClick: () => setShowEmailModal(true),
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
      }
      drawer={
        openParticipant && (
          <ParticipantDrawer
            participant={openParticipant}
            onClose={handleDrawerClose}
            isClosing={isClosing}
            onUpdate={handleUpdateParticipant}
          />
        )
      }
      modals={
        <>
          {showEmailModal && (
            <BulkEmailModal
              selectedParticipants={participants.filter(p => selectedIds.has(p.id))}
              onClose={() => setShowEmailModal(false)}
              onSuccess={clearSelection}
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
        </>
      }
    >
      <ParticipantsTable
        paginatedParticipants={paginated}
        allFilteredSelected={allFilteredSelected}
        toggleSelectAll={toggleSelectAll}
        selectedIds={selectedIds}
        toggleSelect={toggleSelect}
        openDrawer={openDrawer}
        selectAllRef={selectAllRef}
        navigate={navigate}
        filtersActive={filtersActive}
        resetFilters={resetFilters}
      />
    </DataPageLayout>
  );
}
