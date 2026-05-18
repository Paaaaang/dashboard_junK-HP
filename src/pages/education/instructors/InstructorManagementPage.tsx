import { useState, useMemo } from "react";
import { Search, Plus, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components";
import { useInstructorStore, useToastStore } from "@/stores";
import { InstructorTable } from "./InstructorTable";
import { InstructorDrawer } from "./InstructorDrawer";

export function InstructorManagementPage() {
  const { 
    instructors, 
    isLoading, 
    fetchInstructors, 
    upsertInstructor, 
    deleteInstructor 
  } = useInstructorStore();
  const { addToast } = useToastStore();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [selectedInstructorId, setSelectedInstructorId] = useState<string | null>(null);

  const filteredInstructors = useMemo(() => 
    instructors.filter(i => 
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      i.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
  , [instructors, searchQuery]);

  const handleOpenDrawer = (id?: string) => {
    setSelectedInstructorId(id || null);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsDrawerOpen(false);
      setIsClosing(false);
      setSelectedInstructorId(null);
    }, 200);
  };

  const handleUpdateInstructor = async (data: any) => {
    try {
      await upsertInstructor(data);
      addToast("강사 정보가 저장되었습니다.", "success");
      // Drawer closing logic is handled inside InstructorDrawer for new items, 
      // or by setIsEditMode(false) for existing ones.
    } catch (err: any) {
      addToast(`저장 실패: ${err.message}`, "error");
    }
  };

  const handleDeleteInstructor = async (id: string, name: string) => {
    if (!confirm(`'${name}' 강사를 삭제하시겠습니까?`)) return;
    try {
      await deleteInstructor(id);
      addToast("삭제되었습니다.", "success");
    } catch (err: any) {
      addToast(`삭제 실패: ${err.message}`, "error");
    }
  };

  const selectedInstructor = useMemo(() => 
    selectedInstructorId ? instructors.find(i => i.id === selectedInstructorId) || null : null
  , [selectedInstructorId, instructors]);

  return (
    <>
      <PageHeader 
        title="강사 풀 관리" 
        actions={
          <button 
            onClick={() => handleOpenDrawer()}
            className="btn btn-primary"
          >
            <Plus size={16} strokeWidth={2.5} />
            새 강사 등록
          </button>
        }
      />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-tertiary group-focus-within:text-brand-primary transition-colors" strokeWidth={2.5} size={18} />
              <input
                type="text"
                placeholder="강사명, 분야, 이메일 검색..."
                className="pl-11 pr-5 py-2.5 bg-surface border border-border/40 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-primary/10 focus:border-brand-primary transition-all w-[320px] shadow-subtle placeholder:text-disabled font-medium"

                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button 
              onClick={fetchInstructors}
              className="p-2.5 text-tertiary hover:text-brand-primary hover:bg-brand-primary/5 rounded-xl transition-all"
              title="새로고침"
            >
              <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        <InstructorTable 
          instructors={filteredInstructors}
          isLoading={isLoading}
          searchQuery={searchQuery}
          onOpenDrawer={handleOpenDrawer}
          onEdit={(id) => handleOpenDrawer(id)}
          onDelete={handleDeleteInstructor}
        />

        {isDrawerOpen && (
          <InstructorDrawer
            instructor={selectedInstructor}
            isOpen={true}
            onClose={handleCloseDrawer}
            isClosing={isClosing}
            onUpdate={handleUpdateInstructor}
          />
        )}
      </div>
    </>
  );
}
