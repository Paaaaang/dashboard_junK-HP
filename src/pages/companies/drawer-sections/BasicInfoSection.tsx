import { Building2 } from "lucide-react";
import type { CompanyRecord } from "@/types/models";

interface BasicInfoSectionProps {
  draftCompany: CompanyRecord;
  drawerEditMode: boolean;
  onUpdateDraftField: (field: keyof CompanyRecord, value: any) => void;
  formatBusinessRegNo: (val: string) => string;
}

export function BasicInfoSection({
  draftCompany,
  drawerEditMode,
  onUpdateDraftField,
  formatBusinessRegNo,
}: BasicInfoSectionProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 px-1">
        <div className="p-1.5 bg-brand-primary/10 rounded-lg">
          <Building2 size={16} strokeWidth={2.5} className="text-brand-primary" />
        </div>
        <h4 className="font-bold text-primary">기본 정보</h4>
      </div>
      
      <div className={`p-5 rounded-2xl border transition-all duration-200 ${drawerEditMode ? "bg-brand-primary/5 border-brand-primary/20 ring-4 ring-brand-primary/5" : "bg-surface-subtle border-border"}`}>
        <div className="grid grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-secondary uppercase tracking-wider">사업자번호</label>
            {drawerEditMode ? (
              <input 
                className="w-full px-3 py-2 text-[15px] font-semibold text-primary bg-surface border border-border rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all font-mono tracking-tight"
                value={draftCompany.businessRegNo} 
                onChange={e => onUpdateDraftField("businessRegNo", formatBusinessRegNo(e.target.value))} 
              />
            ) : (
              <div className="text-[15px] font-semibold text-primary font-mono tracking-tight bg-surface/50 px-3 py-2 rounded-lg border border-border">
                {draftCompany.businessRegNo || "-"}
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-secondary uppercase tracking-wider">대표자명</label>
            {drawerEditMode ? (
              <input 
                className="w-full px-3 py-2 text-[15px] font-semibold text-primary bg-surface border border-border rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
                value={draftCompany.representative} 
                onChange={e => onUpdateDraftField("representative", e.target.value)} 
              />
            ) : (
              <div className="text-[15px] font-semibold text-primary bg-surface/50 px-3 py-2 rounded-lg border border-border">
                {draftCompany.representative || "-"}
              </div>
            )}
          </div>
        </div>
        <div className="mt-5 space-y-1.5">
          <label className="text-xs font-semibold text-secondary uppercase tracking-wider">소재지</label>
          {drawerEditMode ? (
            <input 
              className="w-full px-3 py-2 text-[15px] font-semibold text-primary bg-surface border border-border rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all"
              value={draftCompany.location} 
              onChange={e => onUpdateDraftField("location", e.target.value)} 
            />
          ) : (
            <div className="text-[15px] font-semibold text-primary bg-surface/50 px-3 py-2 rounded-lg border border-border">
              {draftCompany.location || "-"}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
