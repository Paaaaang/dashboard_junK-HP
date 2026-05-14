import { useState, useEffect, useMemo } from "react";
import { 
  X, Users, Award, Search, CheckCircle2, XCircle, 
  Trash2, Download, CheckSquare, Square, 
  ChevronRight, AlertCircle, RefreshCw
} from "lucide-react";
import { useParticipantStore, useToastStore } from "@/stores";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface SessionParticipant {
  enrollmentId: string;
  participantId: string;
  name: string;
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
  
  const { addToast } = useToastStore();
  
  const [activeTab, setActiveTab] = useState<"manage" | "cert">("manage");
  const [sessionParticipants, setSessionParticipants] = useState<SessionParticipant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isAddMode, setIsAddMode] = useState(false);
  const [addingSelectedIds, setAddingSelectedIds] = useState<Set<string>>(new Set());
  const [isSystemPreparing, setIsSystemPreparing] = useState(false);

  const loadParticipants = async () => {
    if (!sessionInfo) return;
    setIsLoading(true);
    const data = await fetchSessionParticipants(sessionInfo.id);
    setSessionParticipants(data);
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen && sessionInfo) {
      loadParticipants();
      setSelectedIds(new Set());
      setAddingSelectedIds(new Set());
      setIsAddMode(false);
      setSearchQuery("");
    }
  }, [isOpen, sessionInfo]);

  const filteredParticipants = useMemo(() => {
    return sessionParticipants.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.companyName?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [sessionParticipants, searchQuery]);

  const searchableParticipants = useMemo(() => {
    if (!isAddMode) return [];
    return allParticipants.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.companyName?.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 20);
  }, [allParticipants, isAddMode, searchQuery]);

  const selectedParticipantsForAdd = useMemo(() => {
    return allParticipants.filter(p => addingSelectedIds.has(p.id));
  }, [allParticipants, addingSelectedIds]);

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
      await loadParticipants();
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
      await loadParticipants();
      setSelectedIds(new Set());
    } catch (err) {
      addToast("제외 처리 중 오류가 발생했습니다.", "error");
    }
  };

  const handleBulkAddParticipants = async () => {
    if (!sessionInfo || addingSelectedIds.size === 0) return;
    
    const existingIds = new Set(sessionParticipants.map(p => p.participantId));
    let addedCount = 0;
    let skippedCount = 0;

    setIsLoading(true);
    try {
      for (const pId of Array.from(addingSelectedIds)) {
        if (existingIds.has(pId)) {
          skippedCount++;
          continue;
        }

        await addEnrollment({
          participantId: pId,
          subCourseId: sessionInfo.subCourseId,
          sessionId: sessionInfo.id,
          status: "미수료"
        });
        addedCount++;
      }

      if (addedCount > 0) addToast(`${addedCount}명이 새롭게 추가되었습니다.`, "success");
      if (skippedCount > 0) addToast(`${skippedCount}명은 이미 등록된 인원이라 제외되었습니다.`, "info");
      
      await loadParticipants();
      setAddingSelectedIds(new Set());
      setIsAddMode(false);
    } catch (err) {
      addToast("참여자 추가 중 오류가 발생했습니다.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      
      {/* Drawer */}
      <div className="relative w-full max-w-[640px] bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <header className="px-8 py-6 border-b border-border/50 relative z-20">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 bg-brand-primary/10 text-brand-primary text-[10px] font-black rounded-md uppercase tracking-wider">
                  {sessionInfo?.groupName}
                </span>
                <span className="text-[12px] font-medium text-tertiary">
                  {sessionInfo?.date} 세션
                </span>
              </div>
              <h2 className="text-xl font-black text-primary leading-tight">
                {sessionInfo?.name}
              </h2>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-surface-subtle rounded-xl text-tertiary transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-surface-subtle rounded-xl w-fit">
            <button
              onClick={() => setActiveTab("manage")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === "manage" 
                  ? "bg-white text-brand-primary shadow-sm" 
                  : "text-tertiary hover:text-secondary"
              }`}
            >
              <Users size={16} />
              참여자 관리
            </button>
            <button
              onClick={() => setActiveTab("cert")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === "cert" 
                  ? "bg-white text-brand-primary shadow-sm" 
                  : "text-tertiary hover:text-secondary"
              }`}
            >
              <Award size={16} />
              수료증 발급
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-visible flex flex-col">
          
          {/* Action Bar (Search & Add Toggle) */}
          <div className="px-6 py-4 bg-white border-b border-border/30 flex items-center gap-2 relative z-30 overflow-visible">
            <div className="relative flex-1 overflow-visible">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${isAddMode && activeTab === "manage" ? "text-brand-primary" : "text-tertiary"}`} size={16} />
              <input 
                type="text"
                placeholder={
                  activeTab === "manage" && isAddMode
                    ? "참여자를 추가해 보세요"
                    : activeTab === "manage"
                      ? "찾는 참여자가 있으신가요?"
                      : "수료자 검색..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 bg-surface-subtle rounded-xl text-sm focus:ring-2 focus:ring-brand-primary/20 transition-all font-medium ${
                  isAddMode && activeTab === "manage"
                    ? "border-2 border-brand-primary/50 text-brand-primary placeholder:text-brand-primary/40"
                    : "border-none"
                }`}
              />
            </div>
            
            {activeTab === "manage" && (
              <div className="group relative flex-shrink-0 overflow-visible">
                <button
                  onClick={() => setIsAddMode(!isAddMode)}
                  className="relative"
                >
                  {/* 스위치 토글 */}
                  <div className={`relative w-14 h-7 rounded-full transition-all cursor-pointer ${
                    isAddMode 
                      ? "bg-brand-primary" 
                      : "bg-surface-subtle group-hover:bg-border/50"
                  }`}>
                    {/* 슬라이딩 원 */}
                    <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${
                      isAddMode ? "right-1" : "left-1"
                    }`} />
                  </div>
                </button>

                {/* 커스텀 tooltip - absolute (overflow-visible 체인 통해 표시) */}
                <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-primary text-white text-xs font-bold rounded-lg w-max max-w-none text-center opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-50 shadow-lg whitespace-nowrap">
                  {isAddMode ? "합류중인 참여자를 찾으시나요?" : "참여자를 추가할까요?"}
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {/* Add Mode Section */}
            {isAddMode && activeTab === "manage" && (
              <div className="px-8 py-4 bg-brand-primary/5 border-b border-brand-primary/10 flex flex-col gap-4 relative">
                
                {/* Selected Chips (Above Search) */}
                {addingSelectedIds.size > 0 && (
                  <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                    {selectedParticipantsForAdd.map(p => (
                      <div 
                        key={p.id}
                        className="flex items-center gap-1.5 pl-3 pr-1.5 py-1 bg-white border border-brand-primary/30 rounded-full shadow-sm"
                      >
                        <span className="text-[11px] font-black text-brand-primary">{p.name}</span>
                        <button 
                          onClick={() => removeAddingSelected(p.id)}
                          className="p-0.5 hover:bg-surface-subtle rounded-full text-tertiary hover:text-error transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={handleBulkAddParticipants}
                      className="ml-auto px-4 py-1.5 bg-brand-primary text-white text-[11px] font-black rounded-full shadow-lg shadow-brand-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1.5"
                    >
                      {addingSelectedIds.size}명 일괄 추가
                      <ChevronRight size={12} />
                    </button>
                  </div>
                )}

                {/* Floating Dropdown Results */}
                {searchQuery && (
                  <div className="relative">
                    <div className="absolute -top-2 left-0 right-0 bg-white border border-border/50 rounded-2xl shadow-2xl z-50 max-h-[280px] overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-150">
                      {searchableParticipants.length > 0 ? (
                        <div className="p-2 space-y-0.5">
                          {searchableParticipants.map(p => {
                            const isAlreadyIn = sessionParticipants.some(sp => sp.participantId === p.id);
                            const isSelected = addingSelectedIds.has(p.id);
                            
                            return (
                              <div 
                                key={p.id}
                                className={`flex items-center justify-between px-4 py-2.5 rounded-xl transition-all ${
                                  isAlreadyIn 
                                    ? "opacity-40 grayscale cursor-not-allowed" 
                                    : isSelected
                                      ? "bg-brand-primary/5 text-brand-primary"
                                      : "hover:bg-surface-subtle cursor-pointer group"
                                }`}
                                onClick={() => !isAlreadyIn && toggleAddingSelect(p.id)}
                              >
                                <div className="text-[13px] font-bold flex items-center gap-2">
                                  <span>{p.name}</span>
                                  <span className="text-tertiary/40">|</span>
                                  <span className={isSelected ? "text-brand-primary/70" : "text-tertiary/80"}>{p.companyName}</span>
                                  <span className="text-tertiary/40">|</span>
                                  <span className={isSelected ? "text-brand-primary/60" : "text-tertiary/60"}>{p.position}</span>
                                  {isAlreadyIn && <span className="ml-2 text-[10px] bg-tertiary/10 text-tertiary px-1.5 py-0.5 rounded font-black">등록됨</span>}
                                </div>
                                {isSelected && !isAlreadyIn && <CheckCircle2 size={16} className="text-brand-primary" />}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="py-8 text-center text-[13px] text-tertiary font-medium italic">
                          검색 결과가 없습니다.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Participant List */}
            <div className="px-8 py-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-tertiary">
                <RefreshCw size={32} className="animate-spin" />
                <span className="text-sm font-bold">명단 로딩 중...</span>
              </div>
            ) : filteredParticipants.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                <div className="w-16 h-16 bg-surface-subtle rounded-[24px] flex items-center justify-center text-tertiary">
                  <Search size={32} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-primary">참여자가 없습니다</h3>
                  <p className="text-sm text-tertiary font-medium">이 세션에 등록된 참여자가 아직 없습니다.</p>
                </div>
              </div>
            ) : (
              <table className="w-full">
                <thead className="sticky top-0 bg-white z-10">
                  <tr className="border-b border-border/30">
                    <th className="py-3 px-2 text-center">
                      <button onClick={toggleSelectAll} className="text-brand-primary flex justify-center">
                        {selectedIds.size === filteredParticipants.length ? <CheckSquare size={18} /> : <Square size={18} />}
                      </button>
                    </th>
                    <th className="py-3 text-left text-[11px] font-black text-tertiary uppercase tracking-wider">이름 / 소속</th>
                    <th className="py-3 text-center text-[11px] font-black text-tertiary uppercase tracking-wider">상태</th>
                    {activeTab === "cert" && (
                      <th className="py-3 text-right text-[11px] font-black text-tertiary uppercase tracking-wider">수료증</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {filteredParticipants
                    .filter(p => activeTab === "manage" || p.status === "수료")
                    .map((p) => (
                    <tr key={p.enrollmentId} className="group hover:bg-surface-subtle/50 transition-colors">
                      <td className="py-4 px-2 text-center">
                        <button onClick={() => toggleSelect(p.enrollmentId)} className="text-tertiary hover:text-brand-primary flex justify-center">
                          {selectedIds.has(p.enrollmentId) ? <CheckSquare size={18} className="text-brand-primary" /> : <Square size={18} />}
                        </button>
                      </td>
                      <td className="py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-primary">{p.name}</span>
                          <span className="text-[11px] text-tertiary font-bold">{p.companyName || "소속 없음"}</span>
                        </div>
                      </td>
                      <td className="py-4 text-center">
                        <StatusBadge 
                          status={p.status === "수료" ? "success" : "neutral"}
                          label={p.status}
                        />
                      </td>
                      {activeTab === "cert" && (
                        <td className="py-4 text-right">
                          <div className="text-[10px] font-mono font-bold text-info bg-info/5 px-2 py-0.5 rounded border border-info/10 inline-block">
                            {p.certificateNo || "발급대기"}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            </div>
          </div>
        </main>

        {/* Footer Actions */}
        <footer className="px-8 py-6 border-t border-border/50 bg-surface-subtle/30">
          {selectedIds.size > 0 ? (
            <div className="flex items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-2">
              <div className="text-sm font-black text-brand-primary">
                {selectedIds.size}명 선택됨
              </div>
              <div className="flex gap-2">
                {activeTab === "manage" ? (
                  <>
                    <button 
                      onClick={() => handleBulkStatusUpdate("수료")}
                      className="flex items-center gap-2 px-4 py-2 bg-success text-white rounded-xl text-sm font-bold shadow-sm shadow-success/20 hover:brightness-105 transition-all"
                    >
                      <CheckCircle2 size={16} />
                      수료 처리
                    </button>
                    <button 
                      onClick={() => handleBulkStatusUpdate("미수료")}
                      className="flex items-center gap-2 px-4 py-2 bg-white text-secondary border border-border/50 rounded-xl text-sm font-bold hover:bg-white transition-all"
                    >
                      <XCircle size={16} />
                      미수료
                    </button>
                    <button 
                      onClick={handleRemove}
                      className="flex items-center gap-2 px-4 py-2 bg-error/10 text-error rounded-xl text-sm font-bold hover:bg-error/20 transition-all"
                    >
                      <Trash2 size={16} />
                      제외
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => setIsSystemPreparing(true)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-brand-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-primary/25 hover:brightness-105 transition-all"
                    >
                      <Download size={18} />
                      수료증 발급
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 text-[13px] font-medium text-tertiary">
              <AlertCircle size={14} />
              참여자를 선택하여 일괄 작업을 수행할 수 있습니다.
            </div>
          )}
        </footer>

        {/* System Preparing Popup Modal */}
        {isSystemPreparing && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsSystemPreparing(false)} />
            <div className="relative bg-white rounded-3xl px-8 py-8 max-w-sm shadow-2xl animate-in zoom-in-95 fade-in duration-200">
              <h3 className="text-lg font-black text-primary mb-2">시스템 준비 중</h3>
              <p className="text-sm text-tertiary mb-6 leading-relaxed">수료증 발급 시스템이 준비 중입니다.<br />잠시만 기다려주세요.</p>
              <button 
                onClick={() => setIsSystemPreparing(false)}
                className="w-full px-4 py-2.5 bg-brand-primary text-white rounded-xl font-bold hover:brightness-105 transition-all"
              >
                확인
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
