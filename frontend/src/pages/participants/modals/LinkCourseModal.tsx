import { useState } from "react";
import { X, ChevronDown, Check } from "lucide-react";
import { ParticipantRecord, ParticipantEnrollment, CourseType } from "../../../types/models";
import { useCourseStore } from "../../../stores";
import { Calendar, RangeValue } from "../../../components/ui/Calendar";
import { format } from "date-fns";
import { toDotDate } from "../../companies/utils/companyUtils";

interface LinkCourseModalProps {
  participant: ParticipantRecord;
  onClose: () => void;
  onLink: (participantId: string, enrollment: ParticipantEnrollment) => void;
}

export function LinkCourseModal({
  participant,
  onClose,
  onLink,
}: LinkCourseModalProps) {
  const { courseGroups } = useCourseStore();
  
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [applicationDate, setApplicationDate] = useState(new Date().toISOString().split('T')[0]);
  
  const selectedGroup = courseGroups.find(g => g.id === selectedGroupId);
  const selectedSubCourse = selectedGroup?.details.find(d => d.id === selectedCourseId);
  const sessions = selectedSubCourse?.sessions || [];
  
  const handleLink = () => {
    if (!selectedGroupId || !selectedCourseId) return;
    
    const group = courseGroups.find(g => g.id === selectedGroupId);
    const sub = group?.details.find(d => d.id === selectedCourseId);
    
    if (!group || !sub) return;

    // Use session info if selected, otherwise fallback to sub-course default
    const session = sub.sessions?.find(s => s.id === selectedSessionId);
    
    const newEnr: ParticipantEnrollment = {
      id: `enr-${Date.now()}`,
      courseType: group.name as CourseType,
      subCourseName: sub.name,
      subCourseId: sub.id,
      sessionId: selectedSessionId || undefined,
      startDate: session?.startDate || sub.startDate,
      endDate: session?.endDate || sub.endDate,
      totalHours: session?.totalHours || sub.totalHours,
      status: "미수료",
      applicationDate: applicationDate
    };

    onLink(participant.id, newEnr);
  };

  const appDateValue: RangeValue = {
    start: applicationDate ? new Date(applicationDate) : null,
    end: applicationDate ? new Date(applicationDate) : null
  };

  return (
    <div className="fixed inset-0 bg-brand-dark/40 flex items-center justify-center z-[200] p-4 animate-in fade-in duration-200">
      <div className="bg-surface rounded-[32px] flex flex-col w-full max-w-[480px] overflow-hidden animate-in zoom-in-95 duration-300" style={{ boxShadow: "var(--shadow-xl)" }}>
        <div className="px-8 py-6 border-b border-border flex justify-between items-center bg-surface sticky top-0">
          <div className="flex flex-col gap-0.5">
            <h3 className="text-xl font-bold text-primary">교육 과정 연결</h3>
            <p className="text-xs text-tertiary font-medium">{participant.name} 참여자</p>
          </div>
          <button type="button" className="p-2 text-tertiary hover:text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-all" onClick={onClose}>
            <X className="w-5 h-5" strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          <div className="space-y-2">
            <label className="form-label ml-1">과정 구분 선택</label>
            <div className="relative">
              <select 
                className="w-full px-5 py-3 bg-surface border border-border rounded-2xl text-sm font-bold text-secondary focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all appearance-none cursor-pointer shadow-sm"
                value={selectedGroupId}
                onChange={(e) => { setSelectedGroupId(e.target.value); setSelectedCourseId(""); }}
              >
                <option value="">과정 그룹을 선택하세요</option>
                {courseGroups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-tertiary pointer-events-none" size={16} strokeWidth={2.5} />
            </div>
          </div>

          {selectedGroupId && (
            <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
              <div className="space-y-2">
                <label className="form-label ml-1">세부 과정 선택</label>
                <div className="grid gap-2 max-h-[180px] overflow-y-auto custom-scrollbar p-1">
                  {selectedGroup?.details.map(d => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => { setSelectedCourseId(d.id); setSelectedSessionId(""); }}
                      className={`w-full text-left px-5 py-3 rounded-2xl border transition-all flex items-center justify-between group ${
                        selectedCourseId === d.id 
                          ? "bg-brand-primary/10 border-brand-primary text-brand-primary" 
                          : "bg-surface border-border text-secondary hover:border-brand-primary hover:bg-brand-primary/5"
                      }`}
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-black">{d.name}</span>
                        <span className={`text-[10px] font-bold ${selectedCourseId === d.id ? "text-brand-primary/70" : "text-tertiary"}`}>
                          기본 기간: {toDotDate(d.startDate)} ~ {toDotDate(d.endDate)}
                        </span>
                      </div>
                      {selectedCourseId === d.id && <Check size={16} strokeWidth={3} />}
                    </button>
                  ))}
                </div>
              </div>

              {selectedCourseId && sessions.length > 0 && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-300">
                  <label className="form-label ml-1 flex items-center gap-2" style={{ color: "var(--brand-primary)" }}>
                    회차 선택 <span className="text-[10px] bg-brand-primary/10 px-1.5 py-0.5 rounded-full">{sessions.length}개 회차 있음</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {sessions.map((session, idx) => (
                      <button
                        key={session.id}
                        type="button"
                        onClick={() => setSelectedSessionId(session.id)}
                        className={`flex-1 min-w-[120px] px-4 py-3 rounded-xl border-2 transition-all text-center group ${
                          selectedSessionId === session.id
                            ? "bg-brand-primary border-brand-primary text-white shadow-md"
                            : "bg-surface border-border text-secondary hover:border-brand-primary/30"
                        }`}
                      >
                        <p className={`text-[11px] font-black uppercase tracking-tighter ${selectedSessionId === session.id ? "text-white/80" : "text-tertiary"}`}>
                          {idx + 1}회차
                        </p>
                        <p className="text-xs font-bold mt-0.5">
                          {toDotDate(session.startDate)}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2 pt-2 border-t border-border">
            <label className="form-label ml-1">신청일 (폼 접수일)</label>
            <Calendar 
              isSingleDate
              value={appDateValue}
              onChange={(val) => setApplicationDate(val?.start ? format(val.start, "yyyy-MM-dd") : "")}
            />
          </div>
        </div>

        <div className="px-8 py-6 border-t border-border flex gap-3 bg-surface-subtle/50">
          <button 
            type="button" 
            className="flex-1 py-3 text-sm font-bold text-secondary bg-surface border border-border hover:bg-surface-subtle rounded-2xl transition-all" 
            onClick={onClose}
          >
            취소
          </button>
          <button 
            type="button" 
            className="flex-[2] py-3 text-sm font-bold text-white bg-brand-primary hover:bg-brand-primary-hover rounded-2xl shadow-lg shadow-brand-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:shadow-none"
            disabled={!selectedCourseId}
            onClick={handleLink}
          >
            과정 연결 완료
          </button>
        </div>
      </div>
    </div>
  );
}
