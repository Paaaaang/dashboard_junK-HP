import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Search,
  Plus,
  Mail,
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";

import { PageHeader } from "../../components/layout";
import { EmptyState } from "../../components/shared";
import { useCompanyStore, useParticipantStore } from "../../stores";
import { useDebounce } from "../../hooks/useDebounce";
import { ParticipantDrawer } from "./ParticipantDrawer";
import { AddParticipantModal } from "./modals/AddParticipantModal";

import type {
  ParticipantEnrollment,
  CourseType,
} from "../../types/models";

// ── Types ──────────────────────────────────────────────────────────────────────

type TabKey = "ALL" | CourseType;
type InsuranceFilter = "ALL" | "가입" | "미가입";
type CompletionFilter = "ALL" | "수료" | "미수료";

const TAB_ITEMS: Array<{ key: TabKey; label: string }> = [
  { key: "ALL", label: "전체" },
  { key: "훈련비과정", label: "훈련비" },
  { key: "지원비과정", label: "지원비" },
  { key: "공유개방 세미나", label: "세미나" },
];

const PAGE_SIZE = 20;

// ── Utility ────────────────────────────────────────────────────────────────────

function calcCompletionSummary(enrollments: ParticipantEnrollment[]) {
  const total = enrollments.length;
  const completed = enrollments.filter((e) => e.status === "수료").length;
  return { total, completed };
}

function completionVariant(completed: number, total: number) {
  if (total === 0) return "gray";
  if (completed === total) return "green";
  return "default";
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export function ParticipantsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { participants, upsertParticipant } = useParticipantStore();
  const { companies: allCompanies } = useCompanyStore();

  const [activeTab, setActiveTab] = useState<TabKey>("ALL");
  const [completionFilter, setCompletionFilter] = useState<CompletionFilter>("ALL");
  const [insuranceFilter, setInsuranceFilter] = useState<InsuranceFilter>("ALL");
  const [searchRaw, setSearchRaw] = useState("");
  const searchDebounced = useDebounce(searchRaw, 300);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [openParticipantId, setOpenParticipantId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [toasts, setToasts] = useState<Array<{ id: string; message: string }>>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const lastSelectedIdRef = useRef<string | null>(null);
  const selectAllRef = useRef<HTMLInputElement>(null);

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

  // Filter & Sort (Default: Alphabetical)
  const filtered = useMemo(() => {
    let list = [...participants];

    // 1. 기본 정렬 (이름 가나다순)
    list.sort((a, b) => a.name.localeCompare(b.name, "ko"));

    // 2. 탭 필터
    if (activeTab !== "ALL") {
      list = list.filter((p) => p.enrollments.some((e) => e.courseType === activeTab));
    }

    // 3. 수료 상태 필터
    if (completionFilter !== "ALL") {
      list = list.filter((p) => {
        const { completed, total } = calcCompletionSummary(p.enrollments);
        if (completionFilter === "수료") return total > 0 && completed === total;
        return total === 0 || completed < total;
      });
    }

    // 4. 고용보험 필터
    if (insuranceFilter !== "ALL") {
      list = list.filter((p) => p.employmentInsurance === insuranceFilter);
    }

    // 5. 검색어 필터
    if (searchDebounced.trim()) {
      const q = searchDebounced.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.companyName.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) ||
          p.phone.toLowerCase().includes(q),
      );
    }

    return list;
  }, [participants, activeTab, completionFilter, insuranceFilter, searchDebounced]);

  // Pagination
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, completionFilter, insuranceFilter, searchDebounced]);

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

  const filtersActive = activeTab !== "ALL" || completionFilter !== "ALL" || insuranceFilter !== "ALL" || searchDebounced.trim() !== "";

  return (
    <div className="min-h-screen pb-20">
      <PageHeader title="참여자 관리" />

      {/* ── Filters & Action Bar ── */}
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex p-1 bg-white border border-slate-200 rounded-2xl shadow-soft w-fit">
            {TAB_ITEMS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`px-5 py-2 text-sm font-semibold rounded-xl transition-all duration-200 ${
                  activeTab === tab.key
                    ? "bg-emerald-500 text-white shadow-soft scale-[1.02]"
                    : "text-slate-500 hover:text-emerald-600 hover:bg-emerald-50/50"
                }`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 text-white rounded-xl font-bold shadow-soft hover:bg-emerald-600 transition-all hover:scale-[1.02] active:scale-[0.98]"
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>참여자 추가</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[320px]">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="search"
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm placeholder:text-slate-400"
              placeholder="이름, 기업명, 이메일, 연락처 검색"
              value={searchRaw}
              onChange={(e) => setSearchRaw(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                className="pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm cursor-pointer appearance-none min-w-[140px]"
                value={completionFilter}
                onChange={(e) => setCompletionFilter(e.target.value as CompletionFilter)}
              >
                <option value="ALL">수료 상태</option>
                <option value="수료">수료 완료</option>
                <option value="미수료">미수료</option>
              </select>
              <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                <ChevronRight className="rotate-90 text-slate-400" size={14} />
              </div>
            </div>

            <div className="relative">
              <select
                className="pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm cursor-pointer appearance-none min-w-[130px]"
                value={insuranceFilter}
                onChange={(e) => setInsuranceFilter(e.target.value as InsuranceFilter)}
              >
                <option value="ALL">고용보험</option>
                <option value="가입">보험 가입</option>
                <option value="미가입">미가입</option>
              </select>
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                <ChevronRight className="rotate-90 text-slate-400" size={14} />
              </div>
            </div>

            {filtersActive && (
              <button
                type="button"
                className="flex items-center gap-1.5 px-4 py-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all text-sm font-medium"
                onClick={() => {
                  setActiveTab("ALL");
                  setCompletionFilter("ALL");
                  setInsuranceFilter("ALL");
                  setSearchRaw("");
                }}
              >
                <X size={16} />
                <span>초기화</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Data Table ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th scope="col" className="px-5 py-4 w-12 text-center">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer transition-colors"
                    aria-label="전체 선택"
                  />
                </th>
                <th scope="col" className="px-4 py-4 text-left text-[13px] font-semibold text-slate-500 tracking-tight">이름</th>
                <th scope="col" className="px-4 py-4 text-left text-[13px] font-semibold text-slate-500 tracking-tight">소속 기업</th>
                <th scope="col" className="px-4 py-4 text-left text-[13px] font-semibold text-slate-500 tracking-tight">직위</th>
                <th scope="col" className="px-4 py-4 text-left text-[13px] font-semibold text-slate-500 tracking-tight">연락처</th>
                <th scope="col" className="px-4 py-4 text-left text-[13px] font-semibold text-slate-500 tracking-tight">이메일</th>
                <th scope="col" className="px-4 py-4 text-left text-[13px] font-semibold text-slate-500 tracking-tight">수료 현황</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-24">
                    <EmptyState
                      icon={Search}
                      title={filtersActive ? "검색 결과가 없습니다" : "등록된 참여자가 없습니다"}
                      description={filtersActive ? "다른 검색어나 필터 조건을 시도해 보세요." : "새로운 참여자를 추가해 보세요."}
                      action={!filtersActive ? { label: "참여자 추가", onClick: () => setShowAddModal(true) } : undefined}
                    />
                  </td>
                </tr>
              ) : (
                paginated.map((p) => {
                  const { completed, total } = calcCompletionSummary(p.enrollments);
                  const variant = completionVariant(completed, total);
                  const isSelected = selectedIds.has(p.id);
                  return (
                    <tr
                      key={p.id}
                      className={`group transition-colors cursor-pointer hover:bg-emerald-50/40 ${
                        isSelected ? "bg-emerald-50/60" : ""
                      }`}
                      onClick={() => openDrawer(p.id)}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") openDrawer(p.id);
                      }}
                    >
                      <td
                        className="px-5 py-5 text-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelect(p.id, e);
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer transition-colors"
                          aria-label={`${p.name} 선택`}
                        />
                      </td>
                      <td className="px-4 py-5">
                        <span className="text-sm font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
                          {p.name}
                        </span>
                      </td>
                      <td className="px-4 py-5">
                        {p.companyId ? (
                          <button
                            type="button"
                            className="text-emerald-600 font-medium text-[13px] hover:text-emerald-700 hover:underline transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/companies?open=${p.companyId}`);
                            }}
                          >
                            {p.companyName}
                          </button>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-5">
                        <span className="text-sm text-slate-500">{p.position || "—"}</span>
                      </td>
                      <td className="px-4 py-5">
                        <span className="text-[13px] text-slate-500 font-mono tracking-tight">
                          {p.phone || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-5">
                        <span className="text-[13px] text-slate-400 italic font-medium">
                          {p.email || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-5">
                        <div className="flex flex-col gap-1.5 min-w-[100px]">
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span className={variant === "green" ? "text-emerald-600" : "text-slate-500"}>
                              {completed}/{total}
                            </span>
                            <span className="text-slate-400 font-medium">
                              {total > 0 ? Math.round((completed / total) * 100) : 0}%
                            </span>
                          </div>
                          <div className="h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                            <div
                              className={`h-full transition-all duration-700 ease-out ${
                                variant === "green" ? "bg-emerald-500" : "bg-slate-300"
                              }`}
                              style={{ width: total > 0 ? `${(completed / total) * 100}%` : "0%" }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <nav aria-label="페이지 네비게이션" className="flex justify-center items-center gap-2 mt-10">
          <button
            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 disabled:opacity-30 disabled:hover:bg-transparent rounded-xl transition-all"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            <ChevronLeft size={22} />
          </button>
          <div className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <span className="text-sm font-bold text-emerald-600">{currentPage}</span>
            <span className="text-slate-300 font-light text-lg mx-1">/</span>
            <span className="text-sm font-medium text-slate-500">{totalPages}</span>
          </div>
          <button
            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 disabled:opacity-30 disabled:hover:bg-transparent rounded-xl transition-all"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            <ChevronRight size={22} />
          </button>
        </nav>
      )}

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
          onUpdate={(updated) => upsertParticipant(updated)}
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
