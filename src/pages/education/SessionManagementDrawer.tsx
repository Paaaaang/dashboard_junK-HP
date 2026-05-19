import { useState, useEffect, useMemo } from "react";
import { 
  X, Users, Search, CheckCircle2, XCircle, 
  Trash2, Download, CheckSquare, Square, 
  AlertCircle, RefreshCw, UserCheck, Plus
} from "lucide-react";
import { useParticipantStore, useToastStore, useInstructorStore } from "@/stores";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SideDrawer } from "@/components/shared";
import { IssueCertificateModal } from "@/pages/education/IssueCertificateModal";

interface SessionParticipant {
  enrollmentId: string;
  participantId: string;
  name: string;
  birthDate?: string;
  companyName: string;
  status: string;
  completionDate?: string;
  certificateNo?: string;
}

interface SessionManagementDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sessionInfo: {
    id: string;
    subCourseId: string;
    name: string;
    date: string;
    groupName: string;
  } | null;
}

export function SessionManagementDrawer({ isOpen, onClose, sessionInfo }: SessionManagementDrawerProps) {
  const { 
    participants: allParticipants,
    fetchSessionParticipants, 
    bulkUpdateEnrollments, 
    addEnrollment, 
    removeEnrollment 
  } = useParticipantStore();

  const {
    instructors: allInstructorsPool,
    fetchSessionInstructors,
    assignInstructorToSession,
    removeInstructorFromSession
  } = useInstructorStore();
  
  const { addToast } = useToastStore();
  
  const [activeTab, setActiveTab] = useState<"manage" | "cert" | "instructors">("manage");
  const [sessionParticipants, setSessionParticipants] = useState<SessionParticipant[]>([]);
  const [sessionInstructors, setSessionInstructors] = useState<any[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [addSearchQuery, setAddSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isAddMode, setIsAddMode] = useState(false);
  const [addingSelectedIds, setAddingSelectedIds] = useState<Set<string>>(new Set());
  const [isIssueOpen, setIsIssueOpen] = useState(false);

  const loadData = async () => {
    if (!sessionInfo) return;
    setIsDataLoading(true);
    try {
      const [pData, iData] = await Promise.all([
        fetchSessionParticipants(sessionInfo.id),
        fetchSessionInstructors(sessionInfo.id)
      ]);
      setSessionParticipants(pData);
      setSessionInstructors(iData);
    } catch (err) {
      console.error("Load failed:", err);
    } finally {
      setIsDataLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && sessionInfo) {
      loadData();
      setSelectedIds(new Set());
      setAddingSelectedIds(new Set());
      setIsAddMode(false);
      setSearchQuery("");
      setAddSearchQuery("");
      setActiveTab("manage");
    }
  }, [isOpen, sessionInfo]);

  // Participants Filtering
  const filteredParticipants = useMemo(() => {
    return sessionParticipants.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.companyName?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [sessionParticipants, searchQuery]);

  const searchableParticipants = useMemo(() => {
    if (!isAddMode || activeTab !== "manage") return [];
    const enrolledIds = new Set(sessionParticipants.map(sp => sp.participantId));
    
    return allParticipants.filter(p => {
      if (enrolledIds.has(p.id)) return false;
      const q = addSearchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.companyName?.toLowerCase().includes(q);
    }).slice(0, 20);
  }, [allParticipants, isAddMode, activeTab, addSearchQuery, sessionParticipants]);

  // Instructors Filtering
  const filteredInstructors = useMemo(() => {
    return sessionInstructors.filter(i => 
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.specialty?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [sessionInstructors, searchQuery]);

  const searchableInstructors = useMemo(() => {
    if (!isAddMode || activeTab !== "instructors") return [];
    const assignedIds = new Set(sessionInstructors.map(si => si.id));

    return allInstructorsPool.filter(i => {
      if (assignedIds.has(i.id)) return false;
      const q = addSearchQuery.toLowerCase();
      return i.name.toLowerCase().includes(q) || i.specialty?.toLowerCase().includes(q);
    });
  }, [allInstructorsPool, isAddMode, activeTab, addSearchQuery, sessionInstructors]);

  const handleAssignInstructor = async (id: string) => {
    if (!sessionInfo) return;
    try {
      await assignInstructorToSession(id, sessionInfo.id);
      const updated = await fetchSessionInstructors(sessionInfo.id);
      setSessionInstructors(updated);
      addToast("강사가 배정되었습니다.", "success");
    } catch (err: any) {
      addToast(`배정 실패: ${err.message}`, "error");
    }
  };

  const handleRemoveInstructor = async (id: string, name: string) => {
    if (!sessionInfo || !confirm(`'${name}' 강사를 이 회차에서 제외하시겠습니까?`)) return;
    try {
      await removeInstructorFromSession(id, sessionInfo.id);
      const updated = await fetchSessionInstructors(sessionInfo.id);
      setSessionInstructors(updated);
      addToast("배정이 취소되었습니다.", "success");
    } catch (err: any) {
      addToast(`취소 실패: ${err.message}`, "error");
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleAddingSelect = (id: string) => {
    const next = new Set(addingSelectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setAddingSelectedIds(next);
  };

  const removeAddingSelected = (id: string) => {
    const next = new Set(addingSelectedIds);
    next.delete(id);
    setAddingSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredParticipants.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredParticipants.map(p => p.enrollmentId)));
    }
  };

  const handleBulkStatusUpdate = async (status: "수료" | "미수료") => {
    if (selectedIds.size === 0) return;
    try {
      await bulkUpdateEnrollments(Array.from(selectedIds), status);
      addToast(`${selectedIds.size}명의 상태가 ${status}로 변경되었습니다.`, "success");
      const pData = await fetchSessionParticipants(sessionInfo!.id);
      setSessionParticipants(pData);
      setSelectedIds(new Set());
      if (status === "수료") setActiveTab("cert");
    } catch (err) {
      addToast("상태 변경 중 오류가 발생했습니다.", "error");
    }
  };

  const handleRemove = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`선택한 ${selectedIds.size}명을 이 세션에서 제외하시겠습니까?`)) return;
    
    try {
      for (const id of Array.from(selectedIds)) {
        await removeEnrollment(id);
      }
      addToast("세션에서 제외되었습니다.", "success");
      const pData = await fetchSessionParticipants(sessionInfo!.id);
      setSessionParticipants(pData);
      setSelectedIds(new Set());
    } catch (err) {
      addToast("제외 처리 중 오류가 발생했습니다.", "error");
    }
  };

  const handleBulkAddParticipants = async () => {
    if (!sessionInfo || addingSelectedIds.size === 0) return;
    setIsDataLoading(true);
    try {
      for (const pId of Array.from(addingSelectedIds)) {
        await addEnrollment({
          participantId: pId,
          subCourseId: sessionInfo.subCourseId,
          sessionId: sessionInfo.id,
          status: "미수료"
        });
      }
      addToast("참여자가 추가되었습니다.", "success");
      const pData = await fetchSessionParticipants(sessionInfo.id);
      setSessionParticipants(pData);
      setAddingSelectedIds(new Set());
      setIsAddMode(false);
      setAddSearchQuery("");
      setSearchQuery("");
    } catch (err: any) {
      addToast(`추가 실패: ${err.message}`, "error");
    } finally {
      setIsDataLoading(false);
    }
  };

  const drawerFooter = (
    <>
      {activeTab === "instructors" ? (
        <div className="flex items-center justify-center gap-2 text-[13px] font-medium text-tertiary w-full">
           <UserCheck size={14} /> 강사 탭에서 해당 회차의 강사진을 관리할 수 있습니다.
        </div>
      ) : selectedIds.size > 0 ? (
        <div className="flex items-center justify-between gap-4 w-full animate-in fade-in slide-in-from-bottom-2">
          <div className="text-sm font-black text-brand-primary">
            총 {selectedIds.size}명 선택됨
          </div>
          <div className="flex gap-2">
            {activeTab === "manage" ? (
              <>
                <button onClick={() => handleBulkStatusUpdate("수료")} className="flex items-center gap-2 px-4 py-2 bg-success text-white rounded-xl text-sm font-bold shadow-sm shadow-success/20 hover:brightness-105 transition-all">
                  <CheckCircle2 size={16} /> 수료 처리
                </button>
                <button onClick={() => handleBulkStatusUpdate("미수료")} className="flex items-center gap-2 px-4 py-2 bg-surface border border-border/50 rounded-xl text-sm font-bold hover:bg-surface-subtle transition-all">
                  <XCircle size={16} /> 미수료
                </button>
                <button onClick={handleRemove} className="flex items-center gap-2 px-4 py-2 bg-error/10 text-error rounded-xl text-sm font-bold hover:bg-error/20 transition-all">
                  <Trash2 size={16} /> 명단 제외
                </button>
              </>
            ) : (
              <button onClick={() => setIsIssueOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-brand-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-primary/25 hover:brightness-105 transition-all">
                <Download size={18} /> 선택 수료증 발급
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2 text-[13px] font-medium text-tertiary w-full">
          <AlertCircle size={14} /> 참여자를 선택하여 일괄 처리를 할 수 있습니다.
        </div>
      )}
    </>
  );

  return (
    <>
      <SideDrawer
        isOpen={isOpen}
        onClose={onClose}
        title={sessionInfo?.name || ""}
        icon={Users}
        subtitle={
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-brand-primary/10 text-brand-primary text-[9px] font-black rounded uppercase tracking-wider">
              {sessionInfo?.groupName}
            </span>
            <span className="text-[11px] font-medium text-tertiary">
              {sessionInfo?.date} 교육 회차
            </span>
          </div>
        }
        width="580px"
        footer={drawerFooter}
        headerActions={
          <div className="flex gap-1 p-1 bg-surface-subtle rounded-xl w-fit">
            <button onClick={() => setActiveTab("manage")} className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${activeTab === "manage" ? "bg-white text-brand-primary shadow-sm" : "text-tertiary hover:text-secondary"}`}>명단 관리</button>
            <button onClick={() => setActiveTab("instructors")} className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${activeTab === "instructors" ? "bg-white text-brand-primary shadow-sm" : "text-tertiary hover:text-secondary"}`}>강사 배정</button>
            <button onClick={() => setActiveTab("cert")} className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${activeTab === "cert" ? "bg-white text-brand-primary shadow-sm" : "text-tertiary hover:text-secondary"}`}>수료증</button>
          </div>
        }
      >
        <div className="flex flex-col gap-6 -mt-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${isAddMode ? "text-brand-primary" : "text-tertiary"}`} size={16} />
              <input 
                type="text"
                placeholder={isAddMode ? "검색하여 추가..." : "이름 또는 소속/분야 검색..."}
                value={isAddMode ? addSearchQuery : searchQuery}
                onChange={(e) => { if (isAddMode) setAddSearchQuery(e.target.value); else setSearchQuery(e.target.value); }}
                className={`w-full pl-10 pr-4 py-2.5 bg-surface border border-border/50 rounded-2xl text-sm font-semibold focus:ring-4 focus:ring-brand-primary/5 transition-all outline-none placeholder:text-disabled ${isAddMode ? "border-brand-primary bg-brand-primary/[0.02]" : ""}`}
              />
            </div>
            {activeTab !== "cert" && (
              <button onClick={() => setIsAddMode(!isAddMode)} className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all border ${isAddMode ? "bg-brand-primary text-white border-brand-primary shadow-lg shadow-brand-primary/20" : "bg-surface text-tertiary border-border hover:bg-surface-subtle"}`}>
                {isAddMode ? "목록으로" : activeTab === "manage" ? "참여자 추가" : "강사 배정"}
              </button>
            )}
          </div>

          {isAddMode ? (
            <div className="space-y-6 animate-in fade-in duration-200">
              {activeTab === "manage" ? (
                <>
                  {addingSelectedIds.size > 0 && (
                    <div className="p-4 bg-brand-primary/5 rounded-3xl border border-brand-primary/20 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-brand-primary uppercase tracking-widest ml-1">선택된 참여자 ({addingSelectedIds.size}명)</span>
                        <button onClick={handleBulkAddParticipants} className="px-4 py-2 bg-brand-primary text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-primary/20 hover:bg-brand-primary-hover transition-all">회차에 일괄 추가</button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {allParticipants.filter(p => addingSelectedIds.has(p.id)).map(p => (
                          <div key={p.id} className="flex items-center gap-1.5 pl-3 pr-1.5 py-1 bg-white border border-brand-primary/20 rounded-full shadow-sm">
                            <span className="text-[11px] font-bold text-brand-primary">{p.name}</span>
                            <button onClick={() => removeAddingSelected(p.id)} className="p-0.5 hover:bg-surface-subtle rounded-full text-brand-primary"><X size={12} /></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="space-y-1">
                    {searchableParticipants.map(p => {
                      const isSelected = addingSelectedIds.has(p.id);
                      return (
                        <div key={p.id} className={`flex items-center justify-between px-4 py-3 rounded-2xl transition-all cursor-pointer border ${isSelected ? "bg-brand-primary/5 border-brand-primary/20" : "bg-surface border-transparent hover:bg-surface-subtle"}`} onClick={() => toggleAddingSelect(p.id)}>
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm ${isSelected ? 'bg-brand-primary text-white' : 'bg-surface-subtle text-tertiary'}`}>{p.name.charAt(0)}</div>
                            <div className="flex flex-col"><span className="text-sm font-bold text-primary">{p.name}</span><span className="text-[11px] font-medium text-tertiary">{p.companyName || "소속 없음"}</span></div>
                          </div>
                          {isSelected ? <CheckCircle2 size={20} className="text-brand-primary" /> : <Plus size={20} className="text-disabled" />}
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="space-y-1">
                  {searchableInstructors.map(i => (
                    <div key={i.id} className="flex items-center justify-between px-4 py-3 rounded-2xl hover:bg-surface-subtle transition-all cursor-pointer group border border-transparent hover:border-border/50" onClick={() => handleAssignInstructor(i.id)}>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-brand-primary/10 flex items-center justify-center font-black text-sm text-brand-primary">{i.name.charAt(0)}</div>
                        <div className="flex flex-col"><span className="text-sm font-bold text-primary">{i.name}</span><span className="text-[11px] font-medium text-tertiary">{i.specialty || "분야 미지정"}</span></div>
                      </div>
                      <Plus size={20} className="text-disabled group-hover:text-brand-primary transition-colors" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-300">
              {isDataLoading && (sessionParticipants.length === 0 && sessionInstructors.length === 0) ? (
                 <div className="flex flex-col items-center justify-center py-20 gap-3 text-tertiary"><RefreshCw size={32} className="animate-spin" /><span className="text-sm font-bold">명단을 불러오는 중...</span></div>
              ) : activeTab === "instructors" ? (
                <div className="overflow-hidden border border-border/50 rounded-3xl">
                   <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-surface-subtle/50 border-b border-border/30">
                          <th className="py-3.5 px-6 text-[10px] font-black text-tertiary uppercase tracking-widest">배정된 강사 정보</th>
                          <th className="py-3.5 text-center text-[10px] font-black text-tertiary uppercase tracking-widest w-24">제외</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/20">
                        {filteredInstructors.length === 0 ? (
                          <tr><td colSpan={2} className="py-20 text-center text-xs text-tertiary font-bold italic">배정된 강사가 없습니다.</td></tr>
                        ) : filteredInstructors.map(i => (
                          <tr key={i.id} className="group hover:bg-brand-primary/[0.02]">
                            <td className="py-4 px-6">
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-primary">{i.name}</span>
                                <span className="text-[11px] text-tertiary font-medium">{i.specialty || "-"}</span>
                              </div>
                            </td>
                            <td className="py-4 text-center">
                              <button onClick={() => handleRemoveInstructor(i.id, i.name)} className="p-2 text-tertiary hover:text-error hover:bg-error/5 rounded-lg opacity-0 group-hover:opacity-100 transition-all"><X size={16} /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                   </table>
                </div>
              ) : (
                <div className="overflow-hidden border border-border/50 rounded-3xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-subtle/50 border-b border-border/30">
                        <th className="py-3.5 px-4 text-center w-12"><button onClick={toggleSelectAll} className="text-brand-primary hover:scale-110 transition-transform">{selectedIds.size === filteredParticipants.length && filteredParticipants.length > 0 ? <CheckSquare size={18} /> : <Square size={18} />}</button></th>
                        <th className="py-3.5 text-[10px] font-black text-tertiary uppercase tracking-widest">참여자 정보</th>
                        <th className="py-3.5 text-center text-[10px] font-black text-tertiary uppercase tracking-widest w-24">수료 상태</th>
                        {activeTab === "cert" && <th className="py-3.5 text-right pr-6 text-[10px] font-black text-tertiary uppercase tracking-widest">수료 번호</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      {filteredParticipants.filter(p => activeTab === "manage" || p.status === "수료").map((p) => (
                        <tr key={p.enrollmentId} className="group hover:bg-surface-subtle/30 transition-colors">
                          <td className="py-4 px-4 text-center"><button onClick={() => toggleSelect(p.enrollmentId)} className="text-tertiary hover:text-brand-primary transition-colors">{selectedIds.has(p.enrollmentId) ? <CheckSquare size={18} className="text-brand-primary" /> : <Square size={18} />}</button></td>
                          <td className="py-4"><div className="flex flex-col"><span className="text-sm font-bold text-primary">{p.name}</span><span className="text-[11px] font-medium text-tertiary">{p.companyName || "소속 없음"}</span></div></td>
                          <td className="py-4 text-center"><StatusBadge status={p.status === "수료" ? "success" : "neutral"} label={p.status} /></td>
                          {activeTab === "cert" && <td className="py-4 text-right pr-6"><div className="text-[10px] font-mono font-bold text-info bg-info/5 px-2 py-0.5 rounded border border-info/10 inline-block">{p.certificateNo || "발급 대기"}</div></td>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </SideDrawer>

      <IssueCertificateModal
        isOpen={isIssueOpen}
        onClose={() => setIsIssueOpen(false)}
        courseName={sessionInfo?.name || ""}
        recipients={sessionParticipants
          .filter((p) => selectedIds.has(p.enrollmentId) && p.status === "수료")
          .map((p) => ({
            enrollmentId: p.enrollmentId,
            participantId: p.participantId,
            name: p.name,
            birthDate: p.birthDate,
            companyName: p.companyName,
            completionDate: p.completionDate,
            certificateNo: p.certificateNo,
          }))}
        onIssued={() => {
          if (sessionInfo) {
            fetchSessionParticipants(sessionInfo.id).then(setSessionParticipants);
          }
          setSelectedIds(new Set());
        }}
      />
    </>
  );
}
