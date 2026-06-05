import { useEffect, useMemo, useState, useCallback } from "react";
import { useApplicationStore, useToastStore } from "@/stores";
import { Check, X, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { FloatingActionBar, DataPageLayout } from "@/components";
import { ApplicationsTable } from "./ApplicationsTable";
import { AddApplicationModal } from "./modals/AddApplicationModal";
import { ApplicationDrawer } from "./ApplicationDrawer";
import type { ApplicationRecord } from "@/types/models";

export function ApplicationsPage() {
  const {
    applications,
    isLoading,
    error,
    fetchApplications,
    approveApplications,
    rejectApplications,
    addApplication,
    updateApplication,
  } = useApplicationStore();

  const { addToast } = useToastStore();

  // Local state
  const [activeTab, setActiveTab] = useState<"PENDING" | "APPROVED" | "REJECTED" | "ALL">("PENDING");
  const [searchText, setSearchText] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20;

  // Modals & Drawer State
  const [showAddModal, setShowAddModal] = useState(false);
  const [openApplicationId, setOpenApplicationId] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  // Fetch applications on mount
  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Handle store errors
  useEffect(() => {
    if (error) {
      addToast(`오류 발생: ${error}`, "error");
      useApplicationStore.getState().clearError();
    }
  }, [error, addToast]);

  // Tab & search filtering
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      if (activeTab !== "ALL" && app.status !== activeTab) {
        return false;
      }
      if (searchText.trim() !== "") {
        const query = searchText.toLowerCase();
        const matchesName = app.name.toLowerCase().includes(query);
        const matchesCompany = app.companyName.toLowerCase().includes(query);
        const matchesCourse = app.subCourseName.toLowerCase().includes(query);
        return matchesName || matchesCompany || matchesCourse;
      }
      return true;
    });
  }, [applications, activeTab, searchText]);

  // Pagination
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredApplications.slice(start, start + PAGE_SIZE);
  }, [filteredApplications, currentPage]);

  const totalPages = Math.ceil(filteredApplications.length / PAGE_SIZE);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds(new Set()); // Reset selections on tab/search change
  }, [activeTab, searchText]);

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const allVisibleSelected = useMemo(() => {
    if (paginated.length === 0) return false;
    return paginated.every((app) => selectedIds.has(app.id));
  }, [paginated, selectedIds]);

  const handleToggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginated.forEach((app) => next.delete(app.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginated.forEach((app) => next.add(app.id));
        return next;
      });
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  // Action handlers
  const handleApprove = async (id: string) => {
    setIsProcessing(true);
    try {
      await approveApplications([id]);
      addToast("신청서가 성공적으로 승인되어 DB에 반영되었습니다.", "success");
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (err: any) {
      addToast(`승인 실패: ${err.message}`, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (id: string) => {
    setIsProcessing(true);
    try {
      await rejectApplications([id]);
      addToast("신청서가 반려 처리되었습니다.", "info");
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (err: any) {
      addToast(`반려 실패: ${err.message}`, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBatchApprove = async () => {
    const targets = Array.from(selectedIds);
    if (targets.length === 0) return;
    setIsProcessing(true);
    try {
      await approveApplications(targets);
      addToast(`${targets.length}건의 신청서가 승인 완료되었습니다.`, "success");
      setSelectedIds(new Set());
    } catch (err: any) {
      addToast(`일괄 승인 중 실패: ${err.message}`, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBatchReject = async () => {
    const targets = Array.from(selectedIds);
    if (targets.length === 0) return;
    setIsProcessing(true);
    try {
      await rejectApplications(targets);
      addToast(`${targets.length}건의 신청서가 반려 완료되었습니다.`, "info");
      setSelectedIds(new Set());
    } catch (err: any) {
      addToast(`일괄 반려 중 실패: ${err.message}`, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddApplication = async (newApp: any) => {
    try {
      await addApplication(newApp);
      addToast("신청서가 대기 목록에 수동 추가되었습니다.", "success");
      setShowAddModal(false);
    } catch (err: any) {
      addToast(`추가 실패: ${err.message}`, "error");
    }
  };

  const handleUpdateApplication = async (id: string, updates: Partial<ApplicationRecord>) => {
    await updateApplication(id, updates);
    addToast("신청 정보가 수정되었습니다.", "success");
  };

  const openDrawer = useCallback((id: string) => {
    setOpenApplicationId(id);
  }, []);

  const closeDrawer = useCallback(() => {
    setOpenApplicationId(null);
  }, []);

  const handleDrawerClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      closeDrawer();
      setIsClosing(false);
    }, 200);
  }, [closeDrawer]);

  const selectedApplication = useMemo(() => {
    return openApplicationId ? applications.find((a) => a.id === openApplicationId) : null;
  }, [openApplicationId, applications]);

  return (
    <DataPageLayout
      title="신청자 승인 관리"
      headerActions={
        <button
          type="button"
          className="btn btn-primary cursor-pointer"
          onClick={() => setShowAddModal(true)}
        >
          <span>수동 신청 추가</span>
        </button>
      }
      filterBar={
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center p-1 bg-surface border border-border/40 rounded-2xl shadow-subtle w-fit">
            <div className="flex items-center gap-1">
              {[
                { key: "PENDING", label: "대기중" },
                { key: "APPROVED", label: "승인완료" },
                { key: "REJECTED", label: "반려됨" },
                { key: "ALL", label: "전체" }
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  className={`px-5 py-2 text-sm font-bold rounded-xl transition-all duration-200 cursor-pointer ${
                    activeTab === tab.key
                      ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20 scale-[1.02]"
                      : "text-secondary hover:text-primary hover:bg-surface-subtle"
                  }`}
                  onClick={() => setActiveTab(tab.key as any)}
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
              placeholder="이름, 기업명, 과정명 검색..."
              className="pl-11 pr-5 py-2.5 bg-surface border border-border/40 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-primary/10 focus:border-brand-primary transition-all w-[320px] shadow-subtle placeholder:text-disabled font-medium"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
        </div>
      }
      pagination={
        <nav className="flex items-center justify-between">
          <p className="text-[11px] font-black text-tertiary uppercase tracking-widest font-heading">
            신청서 <span>{paginated.length}</span>/<span>{filteredApplications.length}</span>건
          </p>
          <div className="flex items-center gap-1.5">
            <button
              className="p-2 rounded-xl border border-border/40 bg-surface text-tertiary hover:bg-surface-subtle hover:text-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm cursor-pointer"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              <ChevronLeft size={18} strokeWidth={2.5} />
            </button>
            <div className="flex items-center px-4 gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  className={`w-9 h-9 rounded-xl text-sm font-black transition-all cursor-pointer ${
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
              className="p-2 rounded-xl border border-border/40 bg-surface text-tertiary hover:bg-surface-subtle hover:text-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm cursor-pointer"
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              <ChevronRight size={18} strokeWidth={2.5} />
            </button>
          </div>
        </nav>
      }
      floatingBar={
        activeTab === "PENDING" ? (
          <FloatingActionBar
            count={selectedIds.size}
            label="건 신청 선택됨"
            onClear={clearSelection}
            actions={[
              {
                label: "선택 승인",
                icon: Check,
                onClick: handleBatchApprove,
              },
              {
                label: "선택 반려",
                icon: X,
                variant: "danger",
                onClick: handleBatchReject,
              }
            ]}
          />
        ) : undefined
      }
      drawer={
        selectedApplication && (
          <ApplicationDrawer
            application={selectedApplication}
            onClose={handleDrawerClose}
            isClosing={isClosing}
            onUpdate={handleUpdateApplication}
          />
        )
      }
      modals={
        <>
          {showAddModal && (
            <AddApplicationModal
              onClose={() => setShowAddModal(false)}
              onAdd={handleAddApplication}
            />
          )}
        </>
      }
    >
      <ApplicationsTable
        applications={paginated}
        selectedIds={selectedIds}
        onToggleSelect={handleToggleSelect}
        onToggleSelectAll={handleToggleSelectAll}
        allSelected={allVisibleSelected}
        onApprove={handleApprove}
        onReject={handleReject}
        isActionLoading={isProcessing || isLoading}
        onRowClick={(app) => openDrawer(app.id)}
      />
    </DataPageLayout>
  );
}
