import { User } from "lucide-react";
import type { CompanyRecord } from "../../../types/models";
import { formatPhone } from "../utils/companyUtils";

interface ManagerInfoSectionProps {
  draftCompany: CompanyRecord;
  drawerEditMode: boolean;
  onUpdateDraftField: (field: keyof CompanyRecord, value: any) => void;
}

export function ManagerInfoSection({
  draftCompany,
  drawerEditMode,
  onUpdateDraftField,
}: ManagerInfoSectionProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 px-1">
        <div className="p-1.5 bg-brand-primary/10 rounded-lg">
          <User size={16} strokeWidth={2.5} className="text-brand-primary" />
        </div>
        <h4 className="font-bold text-primary">담당자 정보</h4>
      </div>
      
      <div className={`p-5 rounded-2xl border transition-all duration-200 ${drawerEditMode ? "bg-brand-primary/5 border-brand-primary/20 ring-4 ring-brand-primary/5" : "bg-surface-subtle border-border"}`}>
        <div className="grid grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-secondary uppercase tracking-wider">담당자</label>
            {drawerEditMode ? (
              <input 
                className="w-full px-3 py-2 text-[15px] font-semibold text-primary bg-surface border border-border rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                value={draftCompany.manager} 
                onChange={e => onUpdateDraftField("manager", e.target.value)} 
              />
            ) : (
              <div className="text-[15px] font-semibold text-primary bg-surface/50 px-3 py-2 rounded-lg border border-border">
                {draftCompany.manager || "-"}
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-secondary uppercase tracking-wider">연락처</label>
            {drawerEditMode ? (
              <input 
                className="w-full px-3 py-2 text-[15px] font-semibold text-primary bg-surface border border-border rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                value={draftCompany.phone} 
                onChange={e => onUpdateDraftField("phone", formatPhone(e.target.value))} 
              />
            ) : (
              <div className="text-[15px] font-semibold text-primary bg-surface/50 px-3 py-2 rounded-lg border border-border">
                {draftCompany.phone || "-"}
              </div>
            )}
          </div>
        </div>
        <div className="mt-5 space-y-1.5">
          <label className="text-xs font-semibold text-secondary uppercase tracking-wider">이메일</label>
          {drawerEditMode ? (
            <input 
              className="w-full px-3 py-2 text-[15px] font-semibold text-primary bg-surface border border-border rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
              type="email" 
              value={draftCompany.email} 
              onChange={e => onUpdateDraftField("email", e.target.value)} 
            />
          ) : (
            <div className="text-[15px] font-semibold text-primary bg-surface/50 px-3 py-2 rounded-lg border border-border">
              {draftCompany.email || "-"}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
