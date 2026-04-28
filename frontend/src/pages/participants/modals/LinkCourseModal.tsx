import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { ParticipantRecord, ParticipantEnrollment, CourseType } from "../../../types/models";

const COURSE_TYPES: CourseType[] = [
  "훈련비과정",
  "지원비과정",
  "공유개방 세미나",
];

const COURSE_CATALOG: Record<
  CourseType,
  Array<{ name: string; startDate: string; endDate: string; hours: number }>
> = {
  훈련비과정: [
    {
      name: "스마트팩토리 실무",
      startDate: "2026-04-14",
      endDate: "2026-04-16",
      hours: 16,
    },
    {
      name: "고급 CAD 실습",
      startDate: "2026-05-06",
      endDate: "2026-05-08",
      hours: 20,
    },
    {
      name: "IoT 기초",
      startDate: "2026-05-18",
      endDate: "2026-05-19",
      hours: 12,
    },
    {
      name: "의료기기 품질관리 기초 및 실무",
      startDate: "2026-05-12",
      endDate: "2026-05-14",
      hours: 24,
    },
  ],
  지원비과정: [
    {
      name: "품질관리 고도화",
      startDate: "2026-04-21",
      endDate: "2026-04-23",
      hours: 20,
    },
    {
      name: "생산성 향상",
      startDate: "2026-05-07",
      endDate: "2026-05-08",
      hours: 12,
    },
    {
      name: "ERP 활용",
      startDate: "2026-05-20",
      endDate: "2026-05-22",
      hours: 18,
    },
  ],
  "공유개방 세미나": [
    {
      name: "AI 현장 적용 세미나",
      startDate: "2026-04-05",
      endDate: "2026-04-05",
      hours: 8,
    },
    {
      name: "스마트제조 트렌드",
      startDate: "2026-04-19",
      endDate: "2026-04-19",
      hours: 8,
    },
    {
      name: "디지털 전환 전략",
      startDate: "2026-05-10",
      endDate: "2026-05-10",
      hours: 8,
    },
  ],
};

let _seq = 0;
function uid(prefix: string) {
  _seq += 1;
  return `${prefix}-${Date.now()}-${_seq}`;
}

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
  const [selectedType, setSelectedType] = useState<CourseType>("훈련비과정");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [applicationDate, setApplicationDate] = useState("");

  const enrolledNames = new Set(
    participant.enrollments.map((e) => e.subCourseName),
  );
  const availableCourses = COURSE_CATALOG[selectedType].filter(
    (c) => !enrolledNames.has(c.name),
  );

  useEffect(() => {
    setSelectedCourse("");
  }, [selectedType]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleLink = () => {
    if (!selectedCourse) return;
    const course = COURSE_CATALOG[selectedType].find(
      (c) => c.name === selectedCourse,
    );
    if (!course) return;
    const enrollment: ParticipantEnrollment = {
      id: uid("enr"),
      courseType: selectedType,
      subCourseName: course.name,
      startDate: course.startDate,
      endDate: course.endDate,
      totalHours: course.hours,
      status: "미수료",
      applicationDate: applicationDate || new Date().toISOString().slice(0, 10),
    };
    onLink(participant.id, enrollment);
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white rounded-[32px] shadow-2xl flex flex-col w-full max-w-md max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-4 duration-300"
      >
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <h3 className="text-xl font-bold text-slate-900 truncate mr-4">과정 연결 — {participant.name}</h3>
          <button
            type="button"
            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200"
            onClick={onClose}
            aria-label="닫기"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">과정 구분</label>
            <select
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as CourseType)}
            >
              {COURSE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">세부 과정</label>
            {availableCourses.length === 0 ? (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                <p className="text-sm text-slate-400 italic">
                  이 유형의 연결 가능한 과정이 없습니다<br/>
                  <span className="text-xs mt-1 block">(이미 모두 등록됨)</span>
                </p>
              </div>
            ) : (
              <select
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
              >
                <option value="">과정을 선택하세요</option>
                {availableCourses.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedCourse && (
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
              <p className="text-xs text-emerald-700 leading-relaxed">
                <span className="font-bold mr-1">※ 안내:</span>
                이미 등록된 과정은 목록에서 제외됩니다.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">신청일 (선택)</label>
            <input
              type="date"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
              value={applicationDate}
              onChange={(e) => setApplicationDate(e.target.value)}
            />
          </div>
        </div>

        <div className="px-8 py-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
          <button type="button" className="px-6 py-3 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-bold transition-all duration-200" onClick={onClose}>
            취소
          </button>
          <button
            type="button"
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all duration-200 shadow-lg shadow-emerald-600/20 disabled:opacity-50 disabled:shadow-none"
            disabled={!selectedCourse}
            onClick={handleLink}
          >
            연결
          </button>
        </div>
      </div>
    </div>
  );
}
