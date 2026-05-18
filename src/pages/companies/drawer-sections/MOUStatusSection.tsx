import { Calendar as CalendarIcon } from "lucide-react";
import type { CompanyRecord } from "@/types/models";
import { DrawerSection, DrawerField } from "@/components/shared";
import { ToggleSwitch } from "@/components/ui";
import { Calendar, RangeValue } from "@/components/ui/Calendar";
import { format } from "date-fns";

interface MOUStatusSectionProps {
  draftCompany: CompanyRecord;
  drawerEditMode: boolean;
  onUpdateDraftField: (field: keyof CompanyRecord, value: any) => void;
  getToday: () => string;
  toDotDate: (val: string | undefined) => string;
}

export function MOUStatusSection({
  draftCompany,
  drawerEditMode,
  onUpdateDraftField,
  getToday,
  toDotDate,
}: MOUStatusSectionProps) {
  const mouDateValue: RangeValue = {
    start: draftCompany.mouSignedDate ? new Date(draftCompany.mouSignedDate) : null,
    end: draftCompany.mouSignedDate ? new Date(draftCompany.mouSignedDate) : null
  };

  const handleDateChange = (val: RangeValue | null) => {
    if (!val || !val.start) {
      onUpdateDraftField("mouSignedDate", undefined);
    } else {
      onUpdateDraftField("mouSignedDate", format(val.start, "yyyy-MM-dd"));
    }
  };

  return (
    <DrawerSection title="협약 정보" collapsible defaultCollapsed>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <DrawerField label="협약서 체결 여부" value={
            <div className="flex items-center gap-3">
              <span className={`text-xs font-bold ${draftCompany.mouSigned ? "text-brand-primary" : "text-tertiary"}`}>
                {draftCompany.mouSigned ? "체결 완료" : "미체결"}
              </span>
              {drawerEditMode && (
                <ToggleSwitch 
                  checked={draftCompany.mouSigned} 
                  onChange={(checked) => {
                    onUpdateDraftField("mouSigned", checked);
                    if (checked && !draftCompany.mouSignedDate) {
                      onUpdateDraftField("mouSignedDate", getToday());
                    }
                  }} 
                />
              )}
            </div>
          } isEditMode={drawerEditMode} />
        </div>

        {draftCompany.mouSigned && (
          <DrawerField label="협약 체결일" value={
            drawerEditMode ? (
              <Calendar 
                isSingleDate
                value={mouDateValue}
                onChange={handleDateChange}
              />
            ) : (
              <div className="flex items-center gap-1.5 text-secondary">
                <CalendarIcon size={14} className="text-tertiary" />
                <span className="font-mono">{toDotDate(draftCompany.mouSignedDate) || "-"}</span>
              </div>
            )
          } isEditMode={drawerEditMode} />
        )}
      </div>
    </DrawerSection>
  );
}
