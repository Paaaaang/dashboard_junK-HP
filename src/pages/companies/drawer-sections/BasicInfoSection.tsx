import { MapPin } from "lucide-react";
import type { CompanyRecord } from "@/types/models";
import { DrawerSection, DrawerField } from "@/components/shared";

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
    <DrawerSection title="기본 정보" collapsible defaultCollapsed>
      {drawerEditMode ? (
        <div className="space-y-6">
          <DrawerField label="기업명" required value={
            <input 
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-sm font-semibold text-primary focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all" 
              value={draftCompany.companyName} 
              onChange={(e) => onUpdateDraftField("companyName", e.target.value)}
              placeholder="기업명을 입력하세요"
            />
          } isEditMode />

          <div className="grid grid-cols-2 gap-4">
            <DrawerField label="사업자등록번호" value={
              <input 
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-sm font-semibold text-primary focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all" 
                value={draftCompany.businessRegNo} 
                onChange={(e) => onUpdateDraftField("businessRegNo", e.target.value)}
                placeholder="000-00-00000"
              />
            } isEditMode />
            <DrawerField label="대표자명" value={
              <input 
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-sm font-semibold text-primary focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all" 
                value={draftCompany.representative} 
                onChange={(e) => onUpdateDraftField("representative", e.target.value)}
                placeholder="대표자명"
              />
            } isEditMode />
          </div>

          <DrawerField label="소재지" value={
            <input 
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-sm font-semibold text-primary focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all" 
              value={draftCompany.location} 
              onChange={(e) => onUpdateDraftField("location", e.target.value)}
              placeholder="예: 서울특별시 강남구..."
            />
          } isEditMode />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <DrawerField label="대표자" value={draftCompany.representative || "-"} />
            <DrawerField 
              label="사업자번호" 
              value={<span className="font-mono">{formatBusinessRegNo(draftCompany.businessRegNo) || "-"}</span>} 
              copyValue={draftCompany.businessRegNo}
            />
          </div>
          <DrawerField 
            label="소재지" 
            value={
              <div className="flex items-start gap-1.5 text-secondary">
                <MapPin size={14} className="mt-0.5 text-tertiary shrink-0" />
                <span>{draftCompany.location || "-"}</span>
              </div>
            } 
            copyValue={draftCompany.location}
          />
        </div>
      )}
    </DrawerSection>
  );
}
