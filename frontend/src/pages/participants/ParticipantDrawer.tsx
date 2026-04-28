import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  X, 
  PencilLine, 
  Plus, 
  ChevronDown, 
  User,
  GraduationCap
} from "lucide-react";
import { CompletionBadge, ToggleSwitch } from "../../components";
import { LinkCourseModal } from "./modals/LinkCourseModal";
import { 
  ParticipantRecord, 
  ParticipantEnrollment, 
  CompletionStatus, 
  CourseType, 
  CompanyRecord
} from "../../../types/models";

// ── Helpers ──────────────────────────────────────────────────────────────────

const COURSE_TYPE_COLORS: Record<CourseType, { bg: string, dot: string, text: string }> = {
  훈련비과정: { bg: "bg-emerald-50", dot: "bg-emerald-500", text: "text-emerald-700" },
  지원비과정: { bg: "bg-blue-50", dot: "bg-blue-500", text: "text-blue-700" },
  "공유개방 세미나": { bg: "bg-amber-50", dot: "bg-amber-500", text: "text-amber-700" },
};

function CourseTypeBadge({ type, count }: { type: CourseType, count: number }) {
  const colors = COURSE_TYPE_COLORS[type];
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${colors.bg} ${colors.text} font-bold text-xs`}>
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
      {type}
      <span className="opacity-50 ml-1">({count})</span>
    </div>
  );
}

// ── Sub Components ───────────────────────────────────────────────────────────

interface EnrollmentRowProps {
  enrollment: ParticipantEnrollment;
  onStatusChange: (id: string, s: CompletionStatus) => void;
}

function EnrollmentRow({ enrollment, onStatusChange }: EnrollmentRowProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm transition-all hover:border-emerald-100 group">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-4 flex items-center gap-3 text-left"
      >
        <span className={`transition-transform duration-200 text-slate-400 ${expanded ? "rotate-180" : ""}`}>
          <ChevronDown size={16} />
        </span>
        <div className="flex-1">
          <p className="text-sm font-bold text-slate-700 group-hover:text-emerald-700 transition-colors">
            {enrollment.subCourseName}
          </p>
          {!expanded && (
            <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
              {enrollment.startDate} ~ {enrollment.endDate}
            </p>
          )}
        </div>
        <CompletionBadge status={enrollment.status} />
      </button>
      
      {expanded && (
        <div className="px-5 pb-5 pt-1 border-t border-slate-50 bg-slate-50/30">
          <div className="grid grid-cols-2 gap-4 mt-3">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">기간 및 시간</span>
              <p className="text-sm text-slate-600 font-medium">
                {enrollment.startDate} ~ {enrollment.endDate} ({enrollment.totalHours}h)
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">상태 변경</span>
              <select 
                value={enrollment.status} 
                onChange={(e) => onStatusChange(enrollment.id, e.target.value as CompletionStatus)}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all cursor-pointer"
              >
                <option value="미수료">미수료</option>
                <option value="수료">수료</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

interface DrawerProps {
  participant: ParticipantRecord;
  onClose: () => void;
  onUpdate: (p: ParticipantRecord) => void;
  allCompanies: CompanyRecord[];
  participants?: ParticipantRecord[];
  isClosing?: boolean;
}

export function ParticipantDrawer({
  participant,
  onClose,
  onUpdate,
  isClosing,
}: DrawerProps) {
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ ...participant });
  const [showLinkModal, setShowLinkModal] = useState(false);

  useEffect(() => {
    setDraft({ ...participant });
  }, [participant]);

  const COURSE_TYPES: CourseType[] = ["훈련비과정", "지원비과정", "공유개방 세미나"];

  const handleSave = () => {
    onUpdate(draft);
    setEditing(false);
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] transition-opacity duration-300 ${isClosing ? "opacity-0" : "opacity-100"}`}
        onClick={() => !editing && onClose()} 
      />
      
      {/* Panel */}
      <div 
        className={`fixed top-0 right-0 h-full w-[500px] bg-white shadow-2xl z-[101] flex flex-col transition-transform duration-300 ease-out transform ${isClosing ? "translate-x-full" : "translate-x-0"}`}
      >
        
        {/* HEADER */}
        <header className="sticky top-0 z-10 px-6 py-6 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">{participant.name}</h3>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs font-bold rounded-lg uppercase tracking-wide">
                {participant.position}
              </span>
            </div>
            <button 
              type="button"
              className="group flex items-center gap-1 text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors" 
              onClick={() => navigate(`/companies?open=${participant.companyId}`)}
            >
              {participant.companyName}
              <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            {!editing && (
              <button 
                type="button" 
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                onClick={() => setEditing(true)}
              >
                <PencilLine size={16} /> 편집
              </button>
            )}
            <button 
              type="button" 
              className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-all duration-200" 
              onClick={onClose}
            >
              <X size={24} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-10 custom-scrollbar">
          {/* 참여자 정보 섹션 */}
          <section className="space-y-5">
            <div className="flex items-center gap-2 px-1">
              <div className="p-1.5 bg-emerald-50 rounded-xl">
                <User size={18} className="text-emerald-600" />
              </div>
              <h4 className="font-bold text-slate-800 tracking-tight">참여자 상세 정보</h4>
            </div>
            
            <div className={`p-6 rounded-3xl border transition-all duration-300 ${editing ? "bg-emerald-50/10 border-emerald-200 ring-4 ring-emerald-500/5 shadow-inner" : "bg-slate-50/50 border-slate-100 shadow-sm"}`}>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">연락처</label>
                  {editing ? (
                    <input 
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium text-slate-700"
                      value={draft.phone} 
                      onChange={e => setDraft({...draft, phone: e.target.value})} 
                    />
                  ) : (
                    <div className="text-[15px] font-bold text-slate-700 bg-white/60 px-4 py-2.5 rounded-2xl border border-slate-100 shadow-sm">
                      {participant.phone || "-"}
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">이메일</label>
                  {editing ? (
                    <input 
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium text-slate-700"
                      value={draft.email} 
                      onChange={e => setDraft({...draft, email: e.target.value})} 
                    />
                  ) : (
                    <div className="text-[15px] font-bold text-slate-700 bg-white/60 px-4 py-2.5 rounded-2xl border border-slate-100 shadow-sm overflow-hidden text-ellipsis whitespace-nowrap">
                      {participant.email || "-"}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6 mt-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">고용보험 가입여부</label>
                  <div className="flex items-center gap-3 px-1 py-1">
                    {editing ? (
                      <div className="scale-110 origin-left">
                        <ToggleSwitch 
                          checked={draft.employmentInsurance === "가입"} 
                          onChange={v => setDraft({...draft, employmentInsurance: v ? "가입" : "미가입"})} 
                        />
                      </div>
                    ) : (
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${participant.employmentInsurance === "가입" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                        {participant.employmentInsurance}
                      </span>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">경력 사항</label>
                  <div className="text-[15px] font-bold text-slate-700 bg-white/60 px-4 py-2.5 rounded-2xl border border-slate-100 shadow-sm">
                    {participant.workExperience || "-"}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 수강 이력 섹션 */}
          <section className="space-y-5">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-50 rounded-xl">
                  <GraduationCap size={18} className="text-emerald-600" />
                </div>
                <h4 className="font-bold text-slate-800 tracking-tight">수강 및 참여 이력</h4>
              </div>
              <button 
                type="button" 
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-black text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-all shadow-sm shadow-emerald-100" 
                onClick={() => setShowLinkModal(true)}
              >
                <Plus size={14} /> 과정 연결
              </button>
            </div>

            <div className="space-y-6">
              {COURSE_TYPES.map(ct => {
                const enrs = participant.enrollments.filter(e => e.courseType === ct);
                return (
                  <div key={ct} className="space-y-3">
                    <div className="flex items-center justify-between px-2">
                      <CourseTypeBadge type={ct} count={enrs.length} />
                    </div>
                    
                    <div className="space-y-3">
                      {enrs.length === 0 ? (
                        <div className="px-8 py-10 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200 flex flex-col items-center justify-center gap-2">
                          <p className="text-sm font-bold text-slate-400">등록된 이력이 없습니다</p>
                        </div>
                      ) : enrs.map(e => (
                        <EnrollmentRow 
                          key={e.id} 
                          enrollment={e} 
                          onStatusChange={(id, s) => onUpdate({ ...participant, enrollments: participant.enrollments.map(x => x.id === id ? { ...x, status: s } : x) })}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* FOOTER */}
        <footer className="sticky bottom-0 px-6 py-6 bg-white border-t border-slate-100">
          {editing ? (
            <div className="flex gap-3">
              <button 
                type="button" 
                className="flex-1 py-4 text-sm font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all" 
                onClick={() => setEditing(false)}
              >
                취소
              </button>
              <button 
                type="button" 
                className="flex-[2] py-4 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-2xl transition-all shadow-lg shadow-emerald-200 active:scale-[0.98]" 
                onClick={handleSave}
              >
                변경 사항 저장
              </button>
            </div>
          ) : (
            <button 
              type="button" 
              className="w-full py-4 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all flex items-center justify-center gap-2" 
              onClick={onClose}
            >
              닫기
            </button>
          )}
        </footer>
      </div>

      {showLinkModal && (
        <LinkCourseModal 
          participant={participant} 
          onClose={() => setShowLinkModal(false)} 
          onLink={(id, enr) => { onUpdate({ ...participant, enrollments: [...participant.enrollments, enr] }); setShowLinkModal(false); }}
        />
      )}
    </>
  );
}

function ChevronRight({ size, className }: { size?: number, className?: string }) {
  return (
    <svg 
      width={size || 16} 
      height={size || 16} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
