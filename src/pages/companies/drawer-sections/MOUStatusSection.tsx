import { FileCheck } from "lucide-react";
import { StatusBadge } from "@/components";
import type { CompanyRecord } from "@/types/models";
import { Calendar, RangeValue } from "@/components/ui/Calendar";

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
      onUpdateDraftField("mouSignedDate", "");
    } else {
      const d = new Date(val.start.getTime() - (val.start.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
      onUpdateDraftField("mouSignedDate", d);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 px-1">
        <div className="p-1.5 bg-brand-primary/10 rounded-lg">
          <FileCheck size={16} strokeWidth={2.5} className="text-brand-primary" />
        </div>
        <h4 className="font-bold text-primary">협약 상태</h4>
      </div>
      
      <div className={`p-5 rounded-2xl border transition-all duration-200 ${drawerEditMode ? "bg-brand-primary/5 border-brand-primary/20 ring-4 ring-brand-primary/5" : "bg-surface-subtle border-border"}`}>
        <div className="grid grid-cols-1 gap-6">
          <div className="flex items-center justify-between bg-surface/50 p-4 rounded-xl border border-border">
            <div className="space-y-0.5">
              <label className="text-[11px] font-bold text-tertiary uppercase tracking-widest">MOU 협약 여부</label>
              <p className="text-sm font-bold text-secondary">{draftCompany.mouSigned ? "협약 체결 완료" : "미체결 상태"}</p>
            </div>
            {drawerEditMode ? (
              <label className="relative inline-flex items-center cursor-pointer scale-110">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={draftCompany.mouSigned} 
                  onChange={e => { 
                    onUpdateDraftField("mouSigned", e.target.checked); 
                    if (!e.target.checked) onUpdateDraftField("mouSignedDate", ""); 
                    else if (!draftCompany.mouSignedDate) onUpdateDraftField("mouSignedDate", getToday()); 
                  }} 
                />
                <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-surface after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
              </label>
            ) : (
              <StatusBadge status={draftCompany.mouSigned ? "success" : "neutral"} label={draftCompany.mouSigned ? "체결" : "미체결"} />
            )}
          </div>

          {draftCompany.mouSigned && (
            <div className="flex items-center justify-between p-4 bg-brand-primary/5 rounded-xl border border-brand-primary/10 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="space-y-0.5">
                <label className="text-[11px] font-bold text-brand-primary/60 uppercase tracking-widest">최종 체결일</label>
                <p className="text-sm font-black text-primary tracking-tight">협약 체결 일자</p>
              </div>
              <div className="w-[180px]">
                {drawerEditMode ? (
                  <Calendar 
                    isSingleDate
                    value={mouDateValue}
                    onChange={handleDateChange}
                  />
                ) : (
                  <div className="flex flex-col items-end">
                    <div className="text-[16px] font-black text-brand-primary bg-surface px-5 py-2.5 rounded-2xl shadow-premium border border-brand-primary/20 min-w-[140px] text-center tracking-[0.05em] font-mono">
                      {toDotDate(draftCompany.mouSignedDate)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
