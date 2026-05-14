import { X, PencilLine, Check } from "lucide-react";
import type { CompanyRecord } from "@/types/models";

interface DrawerHeaderProps {
  draftCompany: CompanyRecord;
  drawerEditMode: boolean;
  drawerNameEditing: boolean;
  drawerNameDraft: string;
  onDrawerClose: () => void;
  onDrawerNameEditToggle: (editing: boolean) => void;
  onDrawerNameDraftChange: (name: string) => void;
  onUpdateDraftField: (field: keyof CompanyRecord, value: any) => void;
  onEnterEditMode: () => void;
}

export function DrawerHeader({
  draftCompany,
  drawerEditMode,
  drawerNameEditing,
  drawerNameDraft,
  onDrawerClose,
  onDrawerNameEditToggle,
  onDrawerNameDraftChange,
  onUpdateDraftField,
  onEnterEditMode,
}: DrawerHeaderProps) {
  return (
    <header className="sticky top-0 z-10 px-6 py-5 bg-surface/80 backdrop-blur-md border-b border-border flex items-center justify-between">
      <div className="flex flex-col gap-1">
        {drawerNameEditing ? (
          <div className="relative">
            <input
              className="text-xl font-bold text-primary bg-surface border-b-2 border-brand-primary outline-none w-full py-1 pr-8"
              value={drawerNameDraft}
              onChange={(e) => onDrawerNameDraftChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onUpdateDraftField("companyName", drawerNameDraft);
                  onDrawerNameEditToggle(false);
                } else if (e.key === "Escape") onDrawerNameEditToggle(false);
              }}
              onBlur={() => {
                onUpdateDraftField("companyName", drawerNameDraft);
                onDrawerNameEditToggle(false);
              }}
              autoFocus
            />
            <Check size={18} strokeWidth={2.5} className="absolute right-0 top-1/2 -translate-y-1/2 text-brand-primary" />
          </div>
        ) : (
          <div className="flex items-center gap-2 group">
            <h3 
              className="text-xl font-bold text-primary cursor-pointer"
              onDoubleClick={() => onDrawerNameEditToggle(true)}
            >
              {draftCompany.companyName || "신규 기업 등록"}
            </h3>
            <button
              type="button"
              className="p-1.5 text-tertiary hover:text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
              onClick={() => {
                onDrawerNameDraftChange(draftCompany.companyName);
                onDrawerNameEditToggle(true);
              }}
            >
              <PencilLine size={14} strokeWidth={2.5} />
            </button>
          </div>
        )}
        <p className="flex items-center gap-1.5 text-sm text-secondary">
          기업 상세 관리
        </p>
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
