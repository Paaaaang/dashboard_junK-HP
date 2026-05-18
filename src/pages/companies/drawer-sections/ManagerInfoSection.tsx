import { Phone, Mail } from "lucide-react";
import type { CompanyRecord } from "@/types/models";
import { DrawerSection, DrawerField } from "@/components/shared";
import { formatPhone } from "@/pages/companies/utils/companyUtils";

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
    <DrawerSection title="담당자 정보" collapsible defaultCollapsed>
      {drawerEditMode ? (
        <div className="space-y-6">
          <DrawerField label="담당자 성함" value={
            <input 
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-sm font-semibold text-primary focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all" 
              value={draftCompany.manager} 
              onChange={(e) => onUpdateDraftField("manager", e.target.value)}
              placeholder="담당자 이름"
            />
          } isEditMode />

          <div className="grid grid-cols-2 gap-4">
            <DrawerField label="연락처" value={
              <input 
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-sm font-semibold text-primary focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all" 
                value={draftCompany.phone} 
                onChange={(e) => onUpdateDraftField("phone", formatPhone(e.target.value))}
                placeholder="010-0000-0000"
              />
            } isEditMode />
            <DrawerField label="이메일" value={
              <input 
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-sm font-semibold text-primary focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all" 
                value={draftCompany.email} 
                onChange={(e) => onUpdateDraftField("email", e.target.value)}
                placeholder="example@company.com"
              />
            } isEditMode />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <DrawerField label="담당자" value={draftCompany.manager || "-"} />
          <div className="grid grid-cols-2 gap-6">
            <DrawerField 
              label="연락처" 
              value={
                <div className="flex items-center gap-1.5 text-secondary">
                  <Phone size={14} className="text-tertiary" />
                  <span className="font-mono">{draftCompany.phone || "-"}</span>
                </div>
              } 
              copyValue={draftCompany.phone}
            />
            <DrawerField 
              label="이메일" 
              value={
                <div className="flex items-center gap-1.5 text-secondary">
                  <Mail size={14} className="text-tertiary" />
                  <span className="truncate">{draftCompany.email || "-"}</span>
                </div>
              } 
              copyValue={draftCompany.email}
            />
          </div>
        </div>
      )}
    </DrawerSection>
  );
}
