import { X, PencilLine, Building2 } from "lucide-react";
import type { CompanyRecord } from "@/types/models";

interface DrawerHeaderProps {
  draftCompany: CompanyRecord;
  drawerEditMode: boolean;
  drawerNameEditing?: boolean; // Deprecated but kept for type compatibility if used elsewhere
  drawerNameDraft?: string; // Deprecated
  onDrawerClose: () => void;
  onDrawerNameEditToggle?: (editing: boolean) => void; // Deprecated
  onDrawerNameDraftChange?: (name: string) => void; // Deprecated
  onUpdateDraftField: (field: keyof CompanyRecord, value: any) => void;
  onEnterEditMode: () => void;
}

export function DrawerHeader({
  draftCompany,
  drawerEditMode,
  onDrawerClose,
  onUpdateDraftField,
  onEnterEditMode,
}: DrawerHeaderProps) {
  return (
    <header className="sticky top-0 z-10 px-6 py-5 bg-surface/80 backdrop-blur-md border-b border-border flex items-center justify-between">
      <div className="flex flex-col gap-1 w-full max-w-[70%]">
        {drawerEditMode ? (
          <div className="relative w-full">
            <Building2 className="absolute left-2.5 top-1/2 -translate-y-1/2 text-tertiary" size={16} />
            <input
              className="text-lg font-black text-primary bg-surface-subtle border border-border/60 outline-none w-full py-1.5 pl-9 pr-3 rounded-lg focus:ring-2 focus:ring-brand-primary/20 transition-all"
              value={draftCompany.companyName}
              onChange={(e) => onUpdateDraftField("companyName", e.target.value)}
              placeholder="기업명을 입력하세요"
              autoFocus
            />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-primary truncate">
              {draftCompany.companyName || "신규 기업 등록"}
            </h3>
          </div>
        )}
        {!drawerEditMode && (
          <p className="flex items-center gap-1.5 text-sm text-secondary">
            기업 상세 관리
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {!drawerEditMode && (
          <button 
            type="button" 
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-secondary hover:bg-surface-subtle rounded-xl transition-colors"
            onClick={onEnterEditMode}
          >
            <PencilLine size={14} strokeWidth={2.5} /> 편집
          </button>
        )}
        <button 
          type="button" 
          className="p-2 text-tertiary hover:text-secondary hover:bg-surface-subtle rounded-full transition-colors"
          onClick={onDrawerClose}
        >
          <X size={20} strokeWidth={2.5} />
        </button>
      </div>
    </header>
  );
}
