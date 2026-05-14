import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useCompanyStore, useParticipantStore, useCourseStore, useTemplateStore, useToastStore } from "@/stores";
import { transformParticipantsToMap } from "@/utils/participantUtils";
import { Mail, Download, X, ChevronRight, Search, ChevronLeft } from "lucide-react";
import { FloatingActionBar, DataPageLayout } from "@/components";
import type {
  CompanyRecord,
  CourseType,
  ParticipantEnrollment,
} from "@/types/models";

// Hooks
import { useCompanyFilters, TAB_ITEMS } from "@/pages/companies/hooks/useCompanyFilters";
import { useCompanySort } from "@/pages/companies/hooks/useCompanySort";
import { useCompanySelection } from "@/pages/companies/hooks/useCompanySelection";
import { useCompanyModals } from "@/pages/companies/hooks/useCompanyModals";
import { useCompanyDrawerState } from "@/pages/companies/hooks/useCompanyDrawerState";
import { useCompanyExcel } from "@/pages/companies/hooks/useCompanyExcel";
import { useCompanyTooltips } from "@/pages/companies/hooks/useCompanyTooltips";
import { useParticipantPopover } from "@/pages/companies/hooks/useParticipantPopover";

// Components
import { CompanyTable } from "@/pages/companies/CompanyTable";
import { CompanyDrawer } from "@/pages/companies/CompanyDrawer";
import { AddCompanyModal } from "@/pages/companies/modals/AddCompanyModal";
import { UploadModal } from "@/pages/companies/modals/UploadModal";
import { EmailModal } from "@/pages/companies/modals/EmailModal";

// Utils
import { 
  normalizeCompanyParticipations, 
  getParticipationCount, 
  toDotDate, 
  getToday, 
  formatBusinessRegNo 
} from "@/pages/companies/utils/companyUtils";

const SYSTEM_FIELDS = [
  { key: "companyName", label: "기업명 *" },
  { key: "businessRegNo", label: "사업자번호" },
  { key: "location", label: "소재지" },
  { key: "representative", label: "대표자명" },
  { key: "manager", label: "담당자" },
  { key: "phone", label: "연락처" },
  { key: "email", label: "이메일" },
  { key: "__skip__", label: "건너뛰기" },
];

export function CompanyManagementPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Stores
  const { courseGroups } = useCourseStore();
  const { companies: rawCompanies, upsertCompany, error: storeError } = useCompanyStore();
  const { participants, upsertParticipant } = useParticipantStore();
  const { templates } = useTemplateStore();
  const { addToast } = useToastStore();

  // Memoized Data
  const companies = useMemo(() => rawCompanies.map(c => normalizeCompanyParticipations(c, courseGroups)), [rawCompanies, courseGroups]);
  
  const companyParticipants = useMemo(() => {
    const groupNames: Record<string, string> = {};
    courseGroups.forEach((g) => {
      groupNames[g.id] = g.name;
    });
    return transformParticipantsToMap(participants, groupNames);
  }, [participants, courseGroups]);

  // Logic Hooks
  const { 
    activeTab, setActiveTab, searchRaw: searchText, setSearchRaw: setSearchText, searchDebounced, filterCompanies 
  } = useCompanyFilters();
  
  const { sortState, toggleSort, sortCompanies } = useCompanySort();
  
  const tabTargetGroupName = useMemo(() => {
    if (activeTab === "ALL") return null;
    const keyword = activeTab === "TRAINING" ? "훈련비" : activeTab === "SUPPORT" ? "지원비" : "세미나";
    return courseGroups.find((item) => item.name.includes(keyword))?.name ?? null;
  }, [activeTab, courseGroups]);

  const filteredCompanies = useMemo(() => {
    const tabFiltered = filterCompanies(companies, tabTargetGroupName);
    return sortCompanies(tabFiltered, getParticipationCount);
  }, [companies, tabTargetGroupName, filterCompanies, sortCompanies]);

  const {
    selectedCompanyIds,
    toggleCompanySelection,
    toggleVisibleSelection,
    clearSelectedCompanies,
    allVisibleSelected,
    selectAllRef,
  } = useCompanySelection(filteredCompanies);

  const {
    activeModal,
    setActiveModal,
    emailRecipientIds,
    selectedTemplateId,
    setSelectedTemplateId,
    openEmailModal,
    closeModal,
  } = useCompanyModals();

  const {
    draftCompany,
    setDraftCompany,
    drawerEditMode,
    setDrawerEditMode,
    expandedDrawerGroups,
    setExpandedDrawerGroups,
    drawerNotice,
    setDrawerNotice,
    editModeSnapshot,
    drawerNameEditing,
    setDrawerNameEditing,
    drawerNameDraft,
    setDrawerNameDraft,
    cancelConfirmPending,
    setCancelConfirmPending,
    isClosing,
    setIsClosing,
    isSaving,
    setIsSaving,
    expandedSubCourses,
    setExpandedSubCourses,
    addParticipantSubCourseId,
    setAddParticipantSubCourseId,
    addParticipantDraft,
    setAddParticipantDraft,
    addParticipantSessionId,
    setAddParticipantSessionId,
    enterEditMode,
    closeDrawer,
  } = useCompanyDrawerState();

  const {
    uploadFile,
    uploadStep,
    rawRows,
    columnMapping,
    setColumnMapping,
    uploadPreview,
    uploadError,
    resetUpload,
    goNextToPreview,
    handleFileChange,
    handleDropzoneDrop,
    confirmUpload,
  } = useCompanyExcel(courseGroups);

  const {
    tooltipInfo,
    handleLocationEnter,
    handleParticipationEnter,
    hideTooltip,
  } = useCompanyTooltips();

  const {
    participantPopover,
    showParticipantPopover,
    hideParticipantPopover,
    popoverTimerRef,
  } = useParticipantPopover();

  // Confirmation States
  const [pendingRemoveProgram, setPendingRemoveProgram] = useState<{ courseType: string; programName: string } | null>(null);
  const [pendingRemoveParticipant, setPendingRemoveParticipant] = useState<{ groupId: string; subCourseId: string; ptId: string } | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20;
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredCompanies.slice(start, start + PAGE_SIZE);
  }, [filteredCompanies, currentPage]);
  const totalPages = Math.ceil(filteredCompanies.length / PAGE_SIZE);

  useEffect(() => { setCurrentPage(1); }, [activeTab, searchDebounced, sortState, tabTargetGroupName]);

  useEffect(() => {
    if (storeError) {
      addToast(`에러: ${storeError}`, "error");
      useCompanyStore.getState().clearError();
    }
  }, [storeError, addToast]);

  // Initialization
  useEffect(() => {
    const openId = searchParams.get("open");
    if (openId) {
      const target = companies.find((c) => c.id === openId);
      if (target) openEditDrawer(target);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handlers
  function openChoiceModal() { setActiveModal("choice"); }

  function openCreateDrawer() {
    const created = normalizeCompanyParticipations({
      id: `new-${Date.now()}`,
      companyName: "",
      businessRegNo: "",
      location: "",
      representative: "",
      manager: "",
      phone: "",
      email: "",
      mouSigned: false,
      mouSignedDate: undefined,
      createdAt: getToday(),
      participations: []
    }, courseGroups);
    setDraftCompany(created);
    setDrawerEditMode(true);
    setExpandedDrawerGroups(new Set(courseGroups.map((group) => group.name)));
    setDrawerNotice("");
    setActiveModal(null);
  }

  function openEditDrawer(company: CompanyRecord) {
    const normalized = normalizeCompanyParticipations(company, courseGroups);
    const expanded = normalized.participations
      .filter((p) => p.enabled && p.programNames.length > 0)
      .map((p) => p.courseType);

    setDraftCompany(normalized);
    setDrawerEditMode(false);
    setExpandedDrawerGroups(new Set(expanded));
    setDrawerNotice("");
    setActiveModal(null);
  }

  async function handleSaveDraftCompany() {
    if (!draftCompany) return;
    if (!draftCompany.companyName.trim()) {
      setDrawerNotice("기업명을 입력해 주세요.");
      return;
    }
    setIsSaving(true);
    try {
      await upsertCompany(draftCompany);
      setIsSaving(false);
      addToast("정보가 저장되었습니다.", "success");
      closeDrawer();
    } catch (err: any) {
      setDrawerNotice(`저장 실패: ${err.message}`);
      setIsSaving(false);
    }
  }

  function handleConfirmUpload() {
    confirmUpload()
      .then(() => {
        closeModal();
        addToast("기업 데이터가 업로드되었습니다.", "success");
      })
      .catch(() => {});
  }

  // Render Helpers
  const selectedCompany = useMemo(() => companies.find(c => c.id === draftCompany?.id) || null, [companies, draftCompany]);

  return (
    <DataPageLayout
      title="기업 관리"
      headerActions={
        <button type="button" className="btn btn-primary" onClick={openChoiceModal}>
          <span>기업 추가</span>
        </button>
      }
      filterBar={
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
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

          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-tertiary group-focus-within:text-brand-primary transition-colors" strokeWidth={2.5} size={18} />
            <input
              type="text"
              placeholder="기업명, 소재지, 담당자 검색..."
              className="pl-11 pr-5 py-2.5 bg-surface border border-border/40 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-primary/10 focus:border-brand-primary transition-all w-[320px] shadow-subtle text-primary placeholder:text-tertiary font-medium"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
        </div>
      }
      pagination={
        <nav className="flex items-center justify-between">
          <p className="text-[11px] font-black text-tertiary uppercase tracking-widest">
            기업 <span>{paginated.length}</span>/<span>{filteredCompanies.length}</span>
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
          count={selectedCompanyIds.size}
          label="개 기업 선택됨"
          onClear={clearSelectedCompanies}
          actions={[
            {
              label: "이메일 발송",
              icon: Mail,
              onClick: () => openEmailModal(Array.from(selectedCompanyIds)),
            },
            {
              label: "내보내기",
              icon: Download,
              onClick: async () => {
                const XLSX = await import("xlsx");
                const selectedData = companies.filter(c => selectedCompanyIds.has(c.id));
                const rows = selectedData.map(c => ({
                  기업명: c.companyName,
                  사업자번호: c.businessRegNo || "-",
                  소재지: c.location,
                  대표자: c.representative,
                  담당자: c.manager || "-",
                  연락처: c.phone || "-",
                  이메일: c.email || "-",
                  "협약서 여부": c.mouSigned ? "체결" : "미체결",
                  "협약 체결일": toDotDate(c.mouSignedDate),
                  "참여 과정 수": getParticipationCount(c),
                  "참여 과정 목록": c.participations
                    .filter(p => p.enabled && p.programNames.length > 0)
                    .map(p => `${p.courseType}(${p.programNames.join(", ")})`)
                    .join(" | ")
                }));
                const ws = XLSX.utils.json_to_sheet(rows);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "기업관리 명단");
                XLSX.writeFile(wb, `companies_export_${Date.now()}.xlsx`);
                addToast(`${selectedCompanyIds.size}개 기업의 데이터를 내보냈습니다.`, "success");
              }
            }
          ]}
        />
      }
      drawer={
        draftCompany && (
          <CompanyDrawer 
            company={selectedCompany}
            draftCompany={draftCompany}
            drawerEditMode={drawerEditMode}
            drawerNotice={drawerNotice}
            drawerNameEditing={drawerNameEditing}
            drawerNameDraft={drawerNameDraft}
            expandedDrawerGroups={expandedDrawerGroups}
            expandedSubCourses={expandedSubCourses}
            addParticipantSubCourseId={addParticipantSubCourseId}
            addParticipantDraft={addParticipantDraft}
            addParticipantSessionId={addParticipantSessionId}
            isSaving={isSaving}
            isClosing={isClosing}
            courseGroups={courseGroups}
            onDrawerClose={() => { setIsClosing(true); setTimeout(() => { closeDrawer(); setIsClosing(false); }, 200); }}
            onDrawerNameEditToggle={setDrawerNameEditing}
            onDrawerNameDraftChange={setDrawerNameDraft}
            onUpdateDraftField={(f, v) => setDraftCompany(prev => prev ? ({ ...prev, [f]: v }) : prev)}
            onEnterEditMode={enterEditMode}
            onCancelEdit={() => {
              if (JSON.stringify(editModeSnapshot) !== JSON.stringify(draftCompany)) setCancelConfirmPending(true);
              else { setDraftCompany(editModeSnapshot); setDrawerEditMode(false); }
            }}
            onSaveDraftCompany={handleSaveDraftCompany}
            onToggleDrawerGroup={(name) => setExpandedDrawerGroups(prev => {
              const next = new Set(prev);
              if (next.has(name)) next.delete(name); else next.add(name);
              return next;
            })}
            onToggleSubCourse={(id) => setExpandedSubCourses(prev => {
              const next = new Set(prev);
              if (next.has(id)) next.delete(id); else next.add(id);
              return next;
            })}
            onRemoveCourseProgram={(type, name) => setPendingRemoveProgram({ courseType: type, programName: name })}
            onAddParticipantClick={setAddParticipantSubCourseId}
            onAddParticipantDraftChange={setAddParticipantDraft}
            onAddParticipantSessionChange={setAddParticipantSessionId}
            onConfirmAddParticipant={(subName, gId, sId) => {
              const name = addParticipantDraft.trim();
              const group = courseGroups.find(g => g.id === gId);
              const subDetail = group?.details.find(d => d.name === subName);
              const session = subDetail?.sessions?.find(s => s.id === sId);
              if (!name || !group || !subDetail) return;
              const newE: ParticipantEnrollment = { 
                id: `enr-${Date.now()}`, 
                courseType: group.name as CourseType, 
                subCourseName: subName, 
                sessionId: sId || undefined,
                startDate: session?.startDate || subDetail.startDate || "", 
                endDate: session?.endDate || subDetail.endDate || "", 
                totalHours: session?.totalHours || subDetail.totalHours || 0, 
                status: "미수료" 
              };
              const existing = participants.find(p => p.name === name && p.companyId === draftCompany!.id);
              if (existing) { upsertParticipant({ ...existing, enrollments: [...existing.enrollments, newE] }); }
              else {
                upsertParticipant({ 
                  id: `pt-${Date.now()}`, 
                  name, 
                  companyId: draftCompany!.id, 
                  companyName: draftCompany!.companyName, 
                  position: "", phone: "", email: "", employmentInsurance: "미확인", enrollments: [newE] 
                });
              }
              setAddParticipantSubCourseId(null); setAddParticipantDraft(""); setAddParticipantSessionId("");
              addToast(`${name} 참여자가 해당 과정에 추가되었습니다.`, "success");
            }}
            onCancelAddParticipant={() => { setAddParticipantSubCourseId(null); setAddParticipantDraft(""); }}
            onRemoveParticipant={(gId, subName, pId) => setPendingRemoveParticipant({ groupId: gId, subCourseId: subName, ptId: pId })}
            onShowParticipantPopover={showParticipantPopover}
            onHideParticipantPopover={hideParticipantPopover}
            onOpenEmailModal={openEmailModal}
            onNavigateToCourses={() => navigate("/courses")}
            getSubCourseByName={(cId, gId, name) => Object.values(companyParticipants[cId]?.[gId] ?? {}).find(sc => sc.name === name)}
            toDotDate={toDotDate}
            getToday={getToday}
            formatBusinessRegNo={formatBusinessRegNo}
          />
        )
      }
      modals={
        <>
          {activeModal === "choice" && (
            <AddCompanyModal onClose={closeModal} onUploadClick={() => setActiveModal("upload")} onCreateDrawerClick={openCreateDrawer} />
          )}
          {activeModal === "upload" && (
            <UploadModal
              onClose={closeModal}
              uploadFile={uploadFile}
              uploadStep={uploadStep}
              rawRows={rawRows}
              columnMapping={columnMapping}
              onMappingChange={(col, field) => setColumnMapping(prev => ({ ...prev, [col]: field }))}
              onNextStep={goNextToPreview}
              systemFields={SYSTEM_FIELDS}
              uploadPreview={uploadPreview}
              uploadError={uploadError}
              onFileChange={handleFileChange}
              onDropzoneDrop={handleDropzoneDrop}
              onConfirm={handleConfirmUpload}
              onReset={resetUpload}
            />
          )}
          {activeModal === "email" && (
            <EmailModal
              onClose={closeModal}
              emailRecipientIds={emailRecipientIds}
              selectedTemplateId={selectedTemplateId}
              onTemplateChange={setSelectedTemplateId}
              onSend={() => {
                 addToast(`${emailRecipientIds.length}개 기업에 이메일 발송을 준비했습니다.`, "info");
                 setActiveModal(null);
              }}
              templates={templates}
            />
          )}
          {cancelConfirmPending && (
            <div className="modal-backdrop confirm-modal !z-[300]">
              <div className="modal-panel modal-panel-sm">
                <div className="modal-header"><h3>변경 사항 취소</h3><button type="button" className="icon-btn" onClick={() => setCancelConfirmPending(false)}><X className="icon-sm" /></button></div>
                <div className="modal-content"><p>내용이 저장되지 않았습니다. 취소하시겠습니까?</p></div>
                <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setCancelConfirmPending(false)}>계속 편집</button><button className="btn btn-primary" onClick={() => { setDraftCompany(editModeSnapshot); setCancelConfirmPending(false); setDrawerEditMode(false); }}>취소</button></div>
              </div>
            </div>
          )}
          {pendingRemoveProgram && (
            <div className="modal-backdrop confirm-modal !z-[300]">
              <div className="modal-panel modal-panel-sm">
                <div className="modal-header"><h3>과정 삭제 확인</h3><button type="button" className="icon-btn" onClick={() => setPendingRemoveProgram(null)}><X className="icon-sm" /></button></div>
                <div className="modal-content"><p><strong>{pendingRemoveProgram.programName}</strong> 과정을 삭제하시겠습니까?</p></div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setPendingRemoveProgram(null)}>취소</button>
                  <button className="btn btn-primary bg-error hover:opacity-90" onClick={() => {
                    if (draftCompany && pendingRemoveProgram) {
                      const nextP = draftCompany.participations.map(p => p.courseType === pendingRemoveProgram.courseType ? ({ ...p, programNames: p.programNames.filter(n => n !== pendingRemoveProgram.programName) }) : p);
                      setDraftCompany({ ...draftCompany, participations: nextP });
                      setPendingRemoveProgram(null);
                      addToast("과정이 목록에서 제외되었습니다 (저장 시 반영).", "info");
                    }
                  }}>삭제</button>
                </div>
              </div>
            </div>
          )}
          {pendingRemoveParticipant && (
            <div className="modal-backdrop confirm-modal !z-[300]">
              <div className="modal-panel modal-panel-sm">
                <div className="modal-header"><h3>참여자 제외 확인</h3><button type="button" className="icon-btn" onClick={() => setPendingRemoveParticipant(null)}><X className="icon-sm" /></button></div>
                <div className="modal-content">
                  <p>해당 참여자를 이 과정에서 제외하시겠습니까?</p>
                  <p className="text-xs text-tertiary mt-2">* 참여자 정보 자체는 삭제되지 않으며 수강 이력만 삭제됩니다.</p>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setPendingRemoveParticipant(null)}>취소</button>
                  <button className="btn btn-primary bg-error hover:opacity-90" onClick={() => {
                    if (pendingRemoveParticipant) {
                      const { groupId, subCourseId, ptId } = pendingRemoveParticipant;
                      const pt = participants.find(p => p.id === ptId);
                      const group = courseGroups.find(g => g.id === groupId);
                      if (pt && group) {
                        upsertParticipant({ ...pt, enrollments: pt.enrollments.filter(e => !(e.courseType === group.name && e.subCourseName === subCourseId)) });
                        addToast(`${pt.name} 참여자가 과정에서 제외되었습니다.`, "info");
                      }
                      setPendingRemoveParticipant(null);
                    }
                  }}>제외하기</button>
                </div>
              </div>
            </div>
          )}
          {tooltipInfo && <div className="fixed-tooltip" style={tooltipInfo.style}>{tooltipInfo.content}</div>}
          {participantPopover && (
            <div
              style={{ position: "fixed", ...participantPopover.style, background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 20, padding: "20px", boxShadow: "0 10px 30px rgba(0,0,0,0.12)", zIndex: 600, minWidth: 260 }}
              onMouseEnter={() => { if (popoverTimerRef.current) clearTimeout(popoverTimerRef.current); }}
              onMouseLeave={hideParticipantPopover}
              className="animate-in fade-in zoom-in-95 duration-200"
            >
              <div className="flex flex-col gap-1 mb-4">
                <p className="text-lg font-black text-primary m-0">{participantPopover.participant.name}</p>
                <p className="text-xs font-bold text-tertiary m-0 uppercase tracking-tight">{draftCompany?.companyName}</p>
              </div>
              <div className="space-y-2 mb-5">
                <div className="flex items-center gap-2 text-[13px] text-secondary">
                  <span className="w-14 text-[11px] font-black text-tertiary">연락처</span>
                  <span className="font-mono font-bold">{participantPopover.participant.phone || "-"}</span>
                </div>
                <div className="flex items-center gap-2 text-[13px] text-secondary">
                  <span className="w-14 text-[11px] font-black text-tertiary">이메일</span>
                  <span className="font-medium truncate">{participantPopover.participant.email || "-"}</span>
                </div>
              </div>
              <button 
                type="button" 
                className="w-full py-2.5 bg-brand-primary/10 text-brand-primary rounded-xl text-xs font-bold hover:bg-brand-primary/20 transition-all flex items-center justify-center gap-2"
                onClick={() => { hideParticipantPopover(); navigate(`/participants?open=${participantPopover.participant.id}`); }}
              >
                상세 정보 보기 <ChevronRight size={14} strokeWidth={2.5} />
              </button>
            </div>
          )}
        </>
      }
    >
      <CompanyTable
        paginatedCompanies={paginated}
        allVisibleSelected={allVisibleSelected}
        onToggleVisibleSelection={toggleVisibleSelection}
        selectedCompanyIds={selectedCompanyIds}
        onToggleCompanySelection={toggleCompanySelection}
        onOpenEditDrawer={openEditDrawer}
        draftCompanyId={draftCompany?.id}
        onToggleSort={toggleSort}
        getSortIndicator={(key) => (sortState.key !== key || !sortState.direction ? "↕" : sortState.direction === "asc" ? "↑" : "↓")}
        onLocationEnter={handleLocationEnter}
        onParticipationEnter={handleParticipationEnter}
        onTooltipLeave={hideTooltip}
        selectAllRef={selectAllRef}
        onOpenChoiceModal={openChoiceModal}
        searchText={searchText}
      />
    </DataPageLayout>
  );
}
