import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Search,
  Plus,
  Mail,
  Download,
  X,
  ChevronRight,
  ChevronDown,
  PencilLine,
  Check,
  CheckCircle2,
  Circle,
  CheckCheck,
  HelpCircle,
} from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { EmptyState } from "../components/EmptyState";
import { initialCompanies } from "../constants";
import { useCompanyStore, useParticipantStore } from "../stores";
import { useDebounce } from "../hooks/useDebounce";
import type {
  ParticipantRecord,
  ParticipantEnrollment,
  CompletionStatus,
  WorkExperience,
  DocumentSkill,
  CourseType,
  CompanyRecord,
} from "../types/models";

// ── Types ──────────────────────────────────────────────────────────────────────

type TabKey = "ALL" | "훈련비과정" | "지원비과정" | "공유개방 세미나";
type InsuranceFilter = "ALL" | "가입" | "미가입";
type CompletionFilter = "ALL" | "수료" | "미수료";

const WORK_EXPERIENCE_OPTIONS: WorkExperience[] = [
  "3년차 이하",
  "3~5년차",
  "5~10년차",
  "10년차 이상",
];

const DOCUMENT_SKILL_OPTIONS: DocumentSkill[] = [
  "없음",
  "기초 수준",
  "일부 작성 경험 있음",
  "능숙",
  "전문가 수준",
];

const COURSE_TYPE_COLOR: Record<CourseType, string> = {
  훈련비과정: "#10b981",
  지원비과정: "#3b82f6",
  "공유개방 세미나": "#f59e0b",
};

const COURSE_TYPE_DOT: Record<CourseType, string> = {
  훈련비과정: "🟢",
  지원비과정: "🔵",
  "공유개방 세미나": "🟡",
};

let _seq = 0;
function uid(prefix: string) {
  _seq += 1;
  return `${prefix}-${Date.now()}-${_seq}`;
}

// ── Utility helpers ────────────────────────────────────────────────────────────

function calcCompletionSummary(enrollments: ParticipantEnrollment[]) {
  const total = enrollments.length;
  const completed = enrollments.filter((e) => e.status === "수료").length;
  return { total, completed };
}

function completionVariant(completed: number, total: number) {
  if (total === 0) return "gray";
  if (completed === total) return "green";
  if (completed === 0) return "gray";
  return "default";
}

function formatDateRange(start: string, end: string) {
  // e.g. "2026.05.12 ~ 05.14 (3일)"
  const s = new Date(start);
  const e = new Date(end);
  const days =
    Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const sStr = `${s.getFullYear()}.${String(s.getMonth() + 1).padStart(2, "0")}.${String(s.getDate()).padStart(2, "0")}`;
  const eStr = `${String(e.getMonth() + 1).padStart(2, "0")}.${String(e.getDate()).padStart(2, "0")}`;
  return `${sStr} ~ ${eStr} (${days}일)`;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

interface CompletionBadgeProps {
  status: CompletionStatus;
}
function CompletionBadge({ status }: CompletionBadgeProps) {
  const isCompleted = status === "수료";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 12,
        fontWeight: 600,
        padding: "2px 8px",
        borderRadius: 999,
        background: isCompleted ? "#ecfdf5" : "#f1f5f9",
        color: isCompleted ? "#065f46" : "#64748b",
      }}
    >
      {isCompleted ? (
        <CheckCircle2 style={{ width: 12, height: 12 }} aria-hidden="true" />
      ) : (
        <Circle style={{ width: 12, height: 12 }} aria-hidden="true" />
      )}{" "}
      {status}
    </span>
  );
}

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (v: boolean) => void;
}
function ToggleSwitch({ checked, onChange }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        width: 42,
        height: 24,
        borderRadius: 12,
        border: 0,
        background: checked ? "var(--color-cta)" : "#cbd5e1",
        cursor: "pointer",
        position: "relative",
        transition: "background 0.2s",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 3,
          left: checked ? 21 : 3,
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "#fff",
          transition: "left 0.2s",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        }}
      />
    </button>
  );
}

// ── Toast ──────────────────────────────────────────────────────────────────────

interface Toast {
  id: string;
  message: string;
}

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  if (toasts.length === 0) return null;
  return (
    <div
      style={{
        position: "fixed",
        bottom: 80,
        right: 24,
        zIndex: 500,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            background: "#1e293b",
            color: "#f1f5f9",
            padding: "10px 16px",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 500,
            boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
            animation: "slideLeft 0.2s ease-out",
          }}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

// ── Company Hover Popover ──────────────────────────────────────────────────────

interface CompanyPopoverProps {
  participant: ParticipantRecord;
  onNavigate: () => void;
  allParticipants: ParticipantRecord[];
}
function CompanyPopover({
  participant,
  onNavigate,
  allParticipants,
}: CompanyPopoverProps) {
  const participantCount = allParticipants.filter(
    (p) => p.companyId === participant.companyId,
  ).length;
  return (
    <div
      style={{
        position: "absolute",
        top: "calc(100% + 8px)",
        left: 0,
        zIndex: 400,
        background: "#fff",
        border: "1px solid var(--color-border)",
        borderRadius: 12,
        boxShadow: "var(--shadow-floating)",
        padding: "12px 14px",
        minWidth: 240,
        display: "grid",
        gap: 8,
      }}
    >
      <div>
        <div
          style={{
            fontWeight: 700,
            fontSize: 14,
            color: "var(--color-text-primary)",
          }}
        >
          {participant.companyName}
        </div>
        <div style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>
          {participant.companyLocation} · 대표{" "}
          {participant.companyRepresentative}
        </div>
      </div>
      <hr
        style={{
          margin: 0,
          border: 0,
          borderTop: "1px solid var(--color-border)",
        }}
      />
      <div style={{ display: "grid", gap: 4 }}>
        {participant.companyManager && (
          <div style={{ fontSize: 12, display: "flex", gap: 8 }}>
            <span style={{ color: "var(--color-text-tertiary)", width: 44 }}>
              담당자
            </span>
            <span
              style={{ color: "var(--color-text-primary)", fontWeight: 500 }}
            >
              {participant.companyManager}
            </span>
          </div>
        )}
        {participant.companyPhone && (
          <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
            📞 {participant.companyPhone}
          </div>
        )}
        {participant.companyEmail && (
          <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
            📧 {participant.companyEmail}
          </div>
        )}
      </div>
      <hr
        style={{
          margin: 0,
          border: 0,
          borderTop: "1px solid var(--color-border)",
        }}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
          협약 {participant.mouSigned ? "✅ 체결" : "❌ 미체결"} · 참여자{" "}
          {participantCount}명
        </span>
        <button
          type="button"
          className="btn btn-ghost"
          style={{ height: 28, padding: "0 10px", fontSize: 12 }}
          onClick={onNavigate}
        >
          기업 상세 →
        </button>
      </div>
    </div>
  );
}

// ── Enrollment Row (collapsible) ──────────────────────────────────────────────

interface EnrollmentRowProps {
  enrollment: ParticipantEnrollment;
  onStatusChange: (
    enrollmentId: string,
    status: CompletionStatus,
    completionDate?: string,
    certificateNo?: string,
  ) => void;
}
function EnrollmentRow({ enrollment, onStatusChange }: EnrollmentRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [newCompletionDate, setNewCompletionDate] = useState(
    enrollment.completionDate ?? "",
  );
  const [newCertificateNo, setNewCertificateNo] = useState(
    enrollment.certificateNo ?? "",
  );
  const [pendingStatus, setPendingStatus] = useState<CompletionStatus | "">("");

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value as CompletionStatus;
    if (val === enrollment.status) return;
    if (val === "수료") {
      setPendingStatus("수료");
      setChangingStatus(true);
    } else {
      onStatusChange(enrollment.id, "미수료");
    }
  };

  const handleSave = () => {
    if (pendingStatus === "수료") {
      onStatusChange(
        enrollment.id,
        "수료",
        newCompletionDate || undefined,
        newCertificateNo || undefined,
      );
    }
    setChangingStatus(false);
    setPendingStatus("");
  };

  return (
    <div
      style={{
        border: "1px solid var(--color-border)",
        borderRadius: 8,
        overflow: "hidden",
        background: "#fff",
      }}
    >
      {/* Collapsed header */}
      <button
        type="button"
        onClick={() => setExpanded((p) => !p)}
        style={{
          width: "100%",
          border: 0,
          background: "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 12px",
          cursor: "pointer",
          gap: 8,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flex: 1,
            minWidth: 0,
          }}
        >
          <span
            style={{
              color: COURSE_TYPE_COLOR[enrollment.courseType],
              flexShrink: 0,
            }}
          >
            {expanded ? "▾" : "▸"}
          </span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: "var(--color-text-primary)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {enrollment.subCourseName}
          </span>
        </div>
        <CompletionBadge status={enrollment.status} />
      </button>

      {/* Expanded body */}
      {expanded && (
        <div
          style={{
            borderTop: "1px solid var(--color-border)",
            padding: "12px 14px",
            display: "grid",
            gap: 8,
            background: "#f8fafc",
            fontSize: 13,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "100px 1fr",
              gap: "6px 12px",
            }}
          >
            <span style={{ color: "var(--color-text-tertiary)", fontSize: 12 }}>
              진행 기간
            </span>
            <span style={{ color: "var(--color-text-primary)" }}>
              {formatDateRange(enrollment.startDate, enrollment.endDate)}
            </span>

            <span style={{ color: "var(--color-text-tertiary)", fontSize: 12 }}>
              교육 시간
            </span>
            <span style={{ color: "var(--color-text-primary)" }}>
              {enrollment.totalHours}시간
            </span>

            <span style={{ color: "var(--color-text-tertiary)", fontSize: 12 }}>
              수료 상태
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <CompletionBadge status={enrollment.status} />
              <select
                value={enrollment.status}
                onChange={handleSelectChange}
                style={{
                  fontSize: 12,
                  border: "1px solid var(--color-border-strong)",
                  borderRadius: 6,
                  padding: "2px 6px",
                  background: "#fff",
                  color: "var(--color-text-primary)",
                  cursor: "pointer",
                }}
              >
                <option value="미수료">미수료</option>
                <option value="수료">수료</option>
              </select>
            </div>

            {enrollment.completionDate && (
              <>
                <span
                  style={{ color: "var(--color-text-tertiary)", fontSize: 12 }}
                >
                  수료일
                </span>
                <span style={{ color: "var(--color-text-primary)" }}>
                  {enrollment.completionDate}
                </span>
              </>
            )}

            {enrollment.certificateNo && (
              <>
                <span
                  style={{ color: "var(--color-text-tertiary)", fontSize: 12 }}
                >
                  수료번호
                </span>
                <span
                  style={{
                    color: "var(--color-text-primary)",
                    fontFamily: "monospace",
                  }}
                >
                  {enrollment.certificateNo}
                </span>
              </>
            )}

            {enrollment.applicationDate && (
              <>
                <span
                  style={{ color: "var(--color-text-tertiary)", fontSize: 12 }}
                >
                  신청일
                </span>
                <span style={{ color: "var(--color-text-primary)" }}>
                  {enrollment.applicationDate}
                </span>
              </>
            )}
          </div>

          {/* Inline status change to 수료 */}
          {changingStatus && pendingStatus === "수료" && (
            <div
              style={{
                background: "#ecfdf5",
                border: "1px solid #a7f3d0",
                borderRadius: 8,
                padding: "10px 12px",
                display: "grid",
                gap: 8,
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#065f46",
                }}
              >
                수료 처리 정보를 입력하세요
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8,
                }}
              >
                <div className="field">
                  <label>수료일</label>
                  <input
                    type="date"
                    value={newCompletionDate}
                    onChange={(e) => setNewCompletionDate(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>수료번호</label>
                  <input
                    type="text"
                    placeholder="CRT-2026-XXXX"
                    value={newCertificateNo}
                    onChange={(e) => setNewCertificateNo(e.target.value)}
                  />
                </div>
              </div>
              <div
                style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}
              >
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ height: 32, padding: "0 12px", fontSize: 12 }}
                  onClick={() => {
                    setChangingStatus(false);
                    setPendingStatus("");
                  }}
                >
                  취소
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ height: 32, padding: "0 12px", fontSize: 12 }}
                  onClick={handleSave}
                >
                  저장
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Add Participant Modal ───────────────────────────────────────────────────────

interface AddParticipantForm {
  name: string;
  companyId: string;
  companyName: string;
  position: string;
  phone: string;
  email: string;
  employmentInsurance: boolean;
  workExperience: WorkExperience | "";
  documentSkill: DocumentSkill | "";
}

interface AddParticipantModalProps {
  onClose: () => void;
  onAdd: (p: ParticipantRecord) => void;
  allCompanies: CompanyRecord[];
}

function AddParticipantModal({
  onClose,
  onAdd,
  allCompanies,
}: AddParticipantModalProps) {
  const [form, setForm] = useState<AddParticipantForm>({
    name: "",
    companyId: "",
    companyName: "",
    position: "",
    phone: "",
    email: "",
    employmentInsurance: false,
    workExperience: "",
    documentSkill: "",
  });
  const [companySearch, setCompanySearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<keyof AddParticipantForm, string>>
  >({});

  const filteredCompanies = useMemo(
    () =>
      allCompanies.filter((c: CompanyRecord) =>
        c.companyName.toLowerCase().includes(companySearch.toLowerCase()),
      ),
    [companySearch, allCompanies],
  );

  const validate = () => {
    const e: typeof errors = {};
    if (!form.name.trim()) e.name = "이름을 입력하세요";
    if (!form.companyName.trim()) e.companyName = "소속 기업을 선택하세요";
    if (!form.phone.trim()) e.phone = "연락처를 입력하세요";
    if (!form.email.trim()) e.email = "이메일을 입력하세요";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const company = allCompanies.find(
      (c: CompanyRecord) => c.id === form.companyId,
    );
    const newP: ParticipantRecord = {
      id: uid("pt"),
      name: form.name.trim(),
      companyId: form.companyId || uid("company"),
      companyName: form.companyName.trim(),
      companyLocation: company?.location,
      companyRepresentative: company?.representative,
      companyManager: company?.manager,
      companyPhone: company?.phone,
      companyEmail: company?.email,
      mouSigned: company?.mouSigned,
      position: form.position.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      employmentInsurance: form.employmentInsurance ? "가입" : "미가입",
      workExperience: form.workExperience || undefined,
      documentSkill: form.documentSkill || undefined,
      enrollments: [],
    };
    onAdd(newP);
  };

  const set = <K extends keyof AddParticipantForm>(
    key: K,
    value: AddParticipantForm[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-panel modal-panel-sm"
        style={{ width: "min(560px, 100%)" }}
      >
        <div className="modal-header">
          <h3>참여자 추가</h3>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="닫기"
          >
            <X size={16} />
          </button>
        </div>

        <div className="modal-content">
          <div className="form-grid">
            {/* 이름 */}
            <div className="field">
              <label>
                이름 <span style={{ color: "var(--color-error)" }}>*</span>
              </label>
              <input
                id="add-name"
                type="text"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="홍길동"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? "err-name" : undefined}
                style={{
                  borderColor: errors.name ? "var(--color-error)" : undefined,
                }}
              />
              {errors.name && (
                <p
                  id="err-name"
                  role="alert"
                  className="form-error-message"
                  style={{ padding: "4px 8px", marginTop: 0 }}
                >
                  {errors.name}
                </p>
              )}
            </div>

            {/* 직위 */}
            <div className="field">
              <label>직위</label>
              <input
                type="text"
                value={form.position}
                onChange={(e) => set("position", e.target.value)}
                placeholder="선임연구원"
              />
            </div>

            {/* 소속 기업 (Combobox) */}
            <div className="field form-full" style={{ position: "relative" }}>
              <label>
                소속 기업 <span style={{ color: "var(--color-error)" }}>*</span>
              </label>
              <input
                type="text"
                value={companySearch || form.companyName}
                onChange={(e) => {
                  setCompanySearch(e.target.value);
                  set("companyName", e.target.value);
                  set("companyId", "");
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                placeholder="기업명 검색..."
              />
              {errors.companyName && (
                <p
                  className="form-error-message"
                  style={{ padding: "4px 8px", marginTop: 0 }}
                >
                  {errors.companyName}
                </p>
              )}
              {showDropdown && (
                <div
                  className="chip-dropdown"
                  style={{ top: "calc(100% + 4px)" }}
                >
                  {filteredCompanies.length === 0 && (
                    <p className="chip-empty">검색 결과 없음</p>
                  )}
                  {filteredCompanies.map((c: CompanyRecord) => (
                    <button
                      type="button"
                      key={c.id}
                      className="chip-option"
                      onMouseDown={() => {
                        set("companyId", c.id);
                        set("companyName", c.companyName);
                        setCompanySearch("");
                        setShowDropdown(false);
                      }}
                    >
                      {c.companyName}
                    </button>
                  ))}
                  {companySearch.trim() && (
                    <button
                      type="button"
                      className="chip-option chip-option-create"
                      onMouseDown={() => {
                        set("companyName", companySearch.trim());
                        set("companyId", "");
                        setCompanySearch("");
                        setShowDropdown(false);
                      }}
                    >
                      <span className="chip-create-icon">+</span>새 기업으로
                      등록: {companySearch.trim()}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 연락처 */}
            <div className="field">
              <label>
                연락처 <span style={{ color: "var(--color-error)" }}>*</span>
              </label>
              <input
                id="add-phone"
                type="tel"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="010-0000-0000"
                aria-invalid={!!errors.phone}
                aria-describedby={errors.phone ? "err-phone" : undefined}
                style={{
                  borderColor: errors.phone ? "var(--color-error)" : undefined,
                }}
              />
              {errors.phone && (
                <p
                  id="err-phone"
                  role="alert"
                  className="form-error-message"
                  style={{ padding: "4px 8px", marginTop: 0 }}
                >
                  {errors.phone}
                </p>
              )}
            </div>

            {/* 이메일 */}
            <div className="field">
              <label>
                이메일 <span style={{ color: "var(--color-error)" }}>*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="name@company.com"
              />
              {errors.email && (
                <p
                  className="form-error-message"
                  style={{ padding: "4px 8px", marginTop: 0 }}
                >
                  {errors.email}
                </p>
              )}
            </div>

            {/* 고용보험 */}
            <div className="field">
              <label>고용보험</label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  paddingTop: 6,
                }}
              >
                <ToggleSwitch
                  checked={form.employmentInsurance}
                  onChange={(v) => set("employmentInsurance", v)}
                />
                <span
                  style={{ fontSize: 13, color: "var(--color-text-secondary)" }}
                >
                  {form.employmentInsurance ? "가입" : "미가입"}
                </span>
              </div>
            </div>

            {/* 업무경력 */}
            <div className="field">
              <label>업무경력</label>
              <select
                className="select-field"
                style={{ height: 40, padding: "0 12px", borderRadius: 10 }}
                value={form.workExperience}
                onChange={(e) =>
                  set("workExperience", e.target.value as WorkExperience | "")
                }
              >
                <option value="">선택 안 함</option>
                {WORK_EXPERIENCE_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>

            {/* 문서작성역량 */}
            <div className="field form-full">
              <label>문서작성역량</label>
              <select
                className="select-field"
                style={{
                  height: 40,
                  padding: "0 12px",
                  borderRadius: 10,
                  width: "100%",
                }}
                value={form.documentSkill}
                onChange={(e) =>
                  set("documentSkill", e.target.value as DocumentSkill | "")
                }
              >
                <option value="">선택 안 함</option>
                {DOCUMENT_SKILL_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            취소
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSubmit}
          >
            추가
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Link Course Modal ──────────────────────────────────────────────────────────

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

interface LinkCourseModalProps {
  participant: ParticipantRecord;
  onClose: () => void;
  onLink: (participantId: string, enrollment: ParticipantEnrollment) => void;
}

function LinkCourseModal({
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
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-panel modal-panel-sm"
        style={{ width: "min(480px, 100%)" }}
      >
        <div className="modal-header">
          <h3>과정 연결 — {participant.name}</h3>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="닫기"
          >
            <X size={16} />
          </button>
        </div>

        <div className="modal-content">
          <div className="field">
            <label>과정 구분</label>
            <select
              className="select-field"
              style={{
                width: "100%",
                height: 40,
                padding: "0 12px",
                borderRadius: 10,
              }}
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

          <div className="field">
            <label>세부 과정</label>
            {availableCourses.length === 0 ? (
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  color: "var(--color-text-tertiary)",
                  padding: "8px 0",
                }}
              >
                이 유형의 연결 가능한 과정이 없습니다 (이미 모두 등록됨)
              </p>
            ) : (
              <select
                className="select-field"
                style={{
                  width: "100%",
                  height: 40,
                  padding: "0 12px",
                  borderRadius: 10,
                }}
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
            <p
              style={{
                margin: 0,
                fontSize: 12,
                color: "var(--color-text-tertiary)",
                background: "var(--color-surface-subtle)",
                padding: "8px 12px",
                borderRadius: 8,
              }}
            >
              ※ 이미 등록된 과정은 목록에서 제외됩니다
            </p>
          )}

          <div className="field">
            <label>신청일 (선택)</label>
            <input
              type="date"
              value={applicationDate}
              onChange={(e) => setApplicationDate(e.target.value)}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            취소
          </button>
          <button
            type="button"
            className="btn btn-primary"
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

// ── Side Drawer ────────────────────────────────────────────────────────────────

interface DrawerProps {
  participant: ParticipantRecord;
  onClose: () => void;
  onUpdate: (updated: ParticipantRecord) => void;
  allCompanies: typeof initialCompanies;
  participants?: ParticipantRecord[];
  isClosing?: boolean;
}

function ParticipantDrawer({
  participant,
  onClose,
  onUpdate,
  allCompanies,
  participants,
  isClosing,
}: DrawerProps) {
  const navigate = useNavigate();
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(participant.name);
  const [editingInfo, setEditingInfo] = useState(false);
  const [draftInfo, setDraftInfo] = useState({
    companyId: participant.companyId,
    companyName: participant.companyName,
    position: participant.position,
    phone: participant.phone,
    email: participant.email,
    employmentInsurance: participant.employmentInsurance,
    workExperience: participant.workExperience ?? ("" as WorkExperience | ""),
    documentSkill: participant.documentSkill ?? ("" as DocumentSkill | ""),
  });
  const [companySearch, setCompanySearch] = useState("");
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [showCompanyPopover, setShowCompanyPopover] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedCourseTypes, setExpandedCourseTypes] = useState<
    Set<CourseType>
  >(new Set(["훈련비과정", "지원비과정", "공유개방 세미나"]));
  const [showLinkModal, setShowLinkModal] = useState(false);

  // Group enrollments by courseType
  const enrollmentsByType = useMemo(() => {
    const map = new Map<CourseType, ParticipantEnrollment[]>();
    for (const ct of COURSE_TYPES) map.set(ct, []);
    for (const enr of participant.enrollments) {
      map.get(enr.courseType)?.push(enr);
    }
    return map;
  }, [participant.enrollments]);

  const { completed, total } = calcCompletionSummary(participant.enrollments);

  const filteredCompanies = useMemo(
    () =>
      allCompanies.filter((c: CompanyRecord) =>
        c.companyName.toLowerCase().includes(companySearch.toLowerCase()),
      ),
    [companySearch, allCompanies],
  );

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Name editing
  const commitName = () => {
    if (draftName.trim() && draftName !== participant.name) {
      onUpdate({ ...participant, name: draftName.trim() });
    } else {
      setDraftName(participant.name);
    }
    setEditingName(false);
  };

  // Info editing
  const saveInfo = () => {
    setIsSaving(true);
    setTimeout(() => {
      const company = allCompanies.find(
        (c: CompanyRecord) => c.id === draftInfo.companyId,
      );
      onUpdate({
        ...participant,
        companyId: draftInfo.companyId,
        companyName: draftInfo.companyName,
        companyLocation: company?.location ?? participant.companyLocation,
        companyRepresentative:
          company?.representative ?? participant.companyRepresentative,
        companyManager: company?.manager ?? participant.companyManager,
        companyPhone: company?.phone ?? participant.companyPhone,
        companyEmail: company?.email ?? participant.companyEmail,
        mouSigned: company?.mouSigned ?? participant.mouSigned,
        position: draftInfo.position,
        phone: draftInfo.phone,
        email: draftInfo.email,
        employmentInsurance: draftInfo.employmentInsurance,
        workExperience: draftInfo.workExperience || undefined,
        documentSkill: draftInfo.documentSkill || undefined,
      });
      setEditingInfo(false);
      setIsSaving(false);
    }, 400);
  };

  const cancelInfo = () => {
    setDraftInfo({
      companyId: participant.companyId,
      companyName: participant.companyName,
      position: participant.position,
      phone: participant.phone,
      email: participant.email,
      employmentInsurance: participant.employmentInsurance,
      workExperience: participant.workExperience ?? "",
      documentSkill: participant.documentSkill ?? "",
    });
    setEditingInfo(false);
  };

  const handleEnrollmentStatusChange = (
    enrollmentId: string,
    status: CompletionStatus,
    completionDate?: string,
    certificateNo?: string,
  ) => {
    const updated: ParticipantRecord = {
      ...participant,
      enrollments: participant.enrollments.map((e) =>
        e.id === enrollmentId
          ? {
              ...e,
              status,
              completionDate: completionDate ?? e.completionDate,
              certificateNo: certificateNo ?? e.certificateNo,
            }
          : e,
      ),
    };
    onUpdate(updated);
  };

  const handleLinkCourse = (
    participantId: string,
    enrollment: ParticipantEnrollment,
  ) => {
    void participantId;
    onUpdate({
      ...participant,
      enrollments: [...participant.enrollments, enrollment],
    });
    setShowLinkModal(false);
  };

  const toggleCourseType = (ct: CourseType) => {
    setExpandedCourseTypes((prev) => {
      const next = new Set(prev);
      if (next.has(ct)) next.delete(ct);
      else next.add(ct);
      return next;
    });
  };

  const navigateToCompany = () => {
    navigate(`/companies?open=${participant.companyId}`);
  };

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className={`drawer-panel${isClosing ? " closing" : ""}`}>
        {/* Header */}
        <div className="drawer-header">
          <div className="drawer-title-stack" style={{ flex: 1, minWidth: 0 }}>
            {editingName ? (
              <input
                className="drawer-name-input"
                style={{ fontSize: 20 }}
                value={draftName}
                autoFocus
                onChange={(e) => setDraftName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitName();
                  if (e.key === "Escape") {
                    setDraftName(participant.name);
                    setEditingName(false);
                  }
                }}
                onBlur={commitName}
              />
            ) : (
              <button
                type="button"
                className="drawer-name-btn"
                onDoubleClick={() => setEditingName(true)}
                style={{ fontSize: 20 }}
              >
                <h3 style={{ fontSize: 20 }}>{participant.name}</h3>
                <PencilLine className="drawer-name-edit-icon" size={14} />
              </button>
            )}
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: "var(--color-text-tertiary)",
              }}
            >
              <span
                style={{
                  color: participant.companyId
                    ? "var(--color-info)"
                    : "inherit",
                  cursor: participant.companyId ? "pointer" : "default",
                  textDecoration: participant.companyId ? "underline" : "none",
                  position: "relative",
                }}
                onMouseEnter={() => setShowCompanyPopover(true)}
                onMouseLeave={() => setShowCompanyPopover(false)}
                onClick={navigateToCompany}
              >
                {participant.companyName || "—"}
                {showCompanyPopover && participant.companyId && (
                  <CompanyPopover
                    participant={participant}
                    onNavigate={navigateToCompany}
                    allParticipants={participants || []}
                  />
                )}
              </span>
              {participant.position && ` · ${participant.position}`}
            </p>
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="드로어 닫기"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="drawer-content">
          {/* 참여자 정보 섹션 */}
          <div className="drawer-section">
            <div className="drawer-section-header">
              <h4>참여자 정보</h4>
              <div className="section-edit-actions">
                {editingInfo ? (
                  <>
                    <button
                      type="button"
                      className="section-icon-btn save"
                      title="저장 (Enter)"
                      onClick={saveInfo}
                      disabled={isSaving}
                    >
                      <Check size={13} />
                    </button>
                    <button
                      type="button"
                      className="section-icon-btn cancel"
                      title="취소 (Esc)"
                      onClick={cancelInfo}
                    >
                      <X size={13} />
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="section-icon-btn"
                    title="편집"
                    onClick={() => setEditingInfo(true)}
                  >
                    <PencilLine size={13} />
                  </button>
                )}
              </div>
            </div>

            <div
              className={`drawer-info-grid${editingInfo ? " edit-mode" : ""}`}
            >
              {/* 소속 기업 */}
              <div className="drawer-info-item">
                <span>소속 기업</span>
                {editingInfo ? (
                  <div style={{ position: "relative" }}>
                    <input
                      className="inline-edit-input"
                      value={companySearch || draftInfo.companyName}
                      onChange={(e) => {
                        setCompanySearch(e.target.value);
                        setDraftInfo((p) => ({
                          ...p,
                          companyName: e.target.value,
                          companyId: "",
                        }));
                        setShowCompanyDropdown(true);
                      }}
                      onFocus={() => setShowCompanyDropdown(true)}
                      onBlur={() =>
                        setTimeout(() => setShowCompanyDropdown(false), 150)
                      }
                      placeholder="기업명 검색..."
                    />
                    {showCompanyDropdown && (
                      <div className="chip-dropdown">
                        {filteredCompanies.map((c: CompanyRecord) => (
                          <button
                            type="button"
                            key={c.id}
                            className="chip-option"
                            onMouseDown={() => {
                              setDraftInfo((p) => ({
                                ...p,
                                companyId: c.id,
                                companyName: c.companyName,
                              }));
                              setCompanySearch("");
                              setShowCompanyDropdown(false);
                            }}
                          >
                            {c.companyName}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <strong
                    onClick={navigateToCompany}
                    style={{
                      color: participant.companyId
                        ? "var(--color-info)"
                        : "var(--color-text-primary)",
                      cursor: participant.companyId ? "pointer" : "default",
                      textDecoration: participant.companyId
                        ? "underline"
                        : "none",
                    }}
                  >
                    {participant.companyName || "—"}
                  </strong>
                )}
              </div>

              {/* 직위 */}
              <div className="drawer-info-item">
                <span>직위</span>
                {editingInfo ? (
                  <input
                    className="inline-edit-input"
                    value={draftInfo.position}
                    onChange={(e) =>
                      setDraftInfo((p) => ({ ...p, position: e.target.value }))
                    }
                    placeholder="직위"
                  />
                ) : (
                  <strong>{participant.position || "—"}</strong>
                )}
              </div>

              {/* 연락처 */}
              <div className="drawer-info-item">
                <span>연락처</span>
                {editingInfo ? (
                  <input
                    className="inline-edit-input"
                    type="tel"
                    value={draftInfo.phone}
                    onChange={(e) =>
                      setDraftInfo((p) => ({ ...p, phone: e.target.value }))
                    }
                    placeholder="010-0000-0000"
                  />
                ) : (
                  <strong>{participant.phone || "—"}</strong>
                )}
              </div>

              {/* 이메일 */}
              <div className="drawer-info-item">
                <span>이메일</span>
                {editingInfo ? (
                  <input
                    className="inline-edit-input"
                    type="email"
                    value={draftInfo.email}
                    onChange={(e) =>
                      setDraftInfo((p) => ({ ...p, email: e.target.value }))
                    }
                    placeholder="name@company.com"
                  />
                ) : (
                  <strong style={{ wordBreak: "break-all", fontSize: 12 }}>
                    {participant.email || "—"}
                  </strong>
                )}
              </div>

              {/* 고용보험 */}
              <div className="drawer-info-item">
                <span>고용보험</span>
                {editingInfo ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      paddingTop: 4,
                    }}
                  >
                    <ToggleSwitch
                      checked={draftInfo.employmentInsurance === "가입"}
                      onChange={(v) =>
                        setDraftInfo((p) => ({
                          ...p,
                          employmentInsurance: v ? "가입" : "미가입",
                        }))
                      }
                    />
                    <span
                      style={{
                        fontSize: 12,
                        color: "var(--color-text-secondary)",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      {draftInfo.employmentInsurance === "가입" ? (
                        <>
                          <CheckCheck
                            style={{ width: 14, height: 14, color: "#10b981" }}
                            aria-hidden="true"
                          />{" "}
                          가입
                        </>
                      ) : (
                        <>
                          <HelpCircle
                            style={{ width: 14, height: 14, color: "#94a3b8" }}
                            aria-hidden="true"
                          />{" "}
                          미가입
                        </>
                      )}
                    </span>
                  </div>
                ) : (
                  <strong
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    {participant.employmentInsurance === "가입" ? (
                      <>
                        <CheckCheck
                          style={{ width: 14, height: 14, color: "#10b981" }}
                          aria-hidden="true"
                        />{" "}
                        가입
                      </>
                    ) : participant.employmentInsurance === "미가입" ? (
                      <>
                        <HelpCircle
                          style={{ width: 14, height: 14, color: "#94a3b8" }}
                          aria-hidden="true"
                        />{" "}
                        미가입
                      </>
                    ) : (
                      <>
                        <HelpCircle
                          style={{ width: 14, height: 14, color: "#94a3b8" }}
                          aria-hidden="true"
                        />{" "}
                        미확인
                      </>
                    )}
                  </strong>
                )}
              </div>

              {/* 업무경력 */}
              <div className="drawer-info-item">
                <span>업무경력</span>
                {editingInfo ? (
                  <select
                    className="inline-edit-input"
                    value={draftInfo.workExperience}
                    onChange={(e) =>
                      setDraftInfo((p) => ({
                        ...p,
                        workExperience: e.target.value as WorkExperience | "",
                      }))
                    }
                    style={{ padding: "3px 8px" }}
                  >
                    <option value="">미선택</option>
                    {WORK_EXPERIENCE_OPTIONS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                ) : (
                  <strong>{participant.workExperience || "—"}</strong>
                )}
              </div>

              {/* 문서작성역량 */}
              <div className="drawer-info-item drawer-info-full">
                <span>문서작성역량</span>
                {editingInfo ? (
                  <select
                    className="inline-edit-input"
                    value={draftInfo.documentSkill}
                    onChange={(e) =>
                      setDraftInfo((p) => ({
                        ...p,
                        documentSkill: e.target.value as DocumentSkill | "",
                      }))
                    }
                    style={{ padding: "3px 8px" }}
                  >
                    <option value="">미선택</option>
                    {DOCUMENT_SKILL_OPTIONS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                ) : (
                  <strong>{participant.documentSkill || "—"}</strong>
                )}
              </div>
            </div>
          </div>

          {/* 교육 과정 이력 */}
          <div className="drawer-section">
            <div className="drawer-section-header">
              <h4>교육 과정 이력</h4>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  background:
                    completed === total && total > 0 ? "#ecfdf5" : "#f1f5f9",
                  color:
                    completed === total && total > 0 ? "#065f46" : "#64748b",
                  padding: "2px 10px",
                  borderRadius: 999,
                }}
              >
                수료 {completed}/{total}
              </span>
            </div>

            <div className="drawer-course-groups">
              {COURSE_TYPES.map((ct) => {
                const enrollments = enrollmentsByType.get(ct) ?? [];
                const isExpanded = expandedCourseTypes.has(ct);
                return (
                  <div key={ct} className="drawer-course-group">
                    <button
                      type="button"
                      className="drawer-course-group-header"
                      onClick={() => toggleCourseType(ct)}
                    >
                      <span>
                        {COURSE_TYPE_DOT[ct]} {ct}
                      </span>
                      {isExpanded ? (
                        <ChevronDown size={14} />
                      ) : (
                        <ChevronRight size={14} />
                      )}
                    </button>
                    {isExpanded && (
                      <div className="drawer-course-group-body">
                        {enrollments.length === 0 ? (
                          <p className="drawer-course-empty">
                            등록된 과정이 없습니다
                          </p>
                        ) : (
                          enrollments.map((enr) => (
                            <EnrollmentRow
                              key={enr.id}
                              enrollment={enr}
                              onStatusChange={handleEnrollmentStatusChange}
                            />
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              className="btn btn-ghost"
              style={{
                width: "100%",
                justifyContent: "center",
                height: 36,
                fontSize: 13,
              }}
              onClick={() => setShowLinkModal(true)}
            >
              <Plus size={14} />
              과정 연결
            </button>
          </div>
        </div>
      </div>

      {showLinkModal && (
        <LinkCourseModal
          participant={participant}
          onClose={() => setShowLinkModal(false)}
          onLink={handleLinkCourse}
        />
      )}
    </>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

const TAB_ITEMS: Array<{ key: TabKey; label: string }> = [
  { key: "ALL", label: "전체" },
  { key: "훈련비과정", label: "훈련비" },
  { key: "지원비과정", label: "지원비" },
  { key: "공유개방 세미나", label: "세미나" },
];

export function ParticipantsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { participants, upsertParticipant } = useParticipantStore();
  const { companies: allCompanies } = useCompanyStore();
  const [activeTab, setActiveTab] = useState<TabKey>("ALL");
  const [completionFilter, setCompletionFilter] =
    useState<CompletionFilter>("ALL");
  const [insuranceFilter, setInsuranceFilter] =
    useState<InsuranceFilter>("ALL");
  const [searchRaw, setSearchRaw] = useState("");
  const searchDebounced = useDebounce(searchRaw, 300);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [openParticipantId, setOpenParticipantId] = useState<string | null>(
    null,
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const handleSearch = (v: string) => {
    setSearchRaw(v);
  };

  // ?open=participantId → auto open drawer
  useEffect(() => {
    const openId = searchParams.get("open");
    if (openId) setOpenParticipantId(openId);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync drawer open state to URL
  const openDrawer = useCallback(
    (id: string) => {
      setOpenParticipantId(id);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set("open", id);
        return next;
      });
    },
    [setSearchParams],
  );

  const closeDrawer = useCallback(() => {
    setOpenParticipantId(null);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("open");
      return next;
    });
  }, [setSearchParams]);

  const handleDrawerClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      closeDrawer();
      setIsClosing(false);
    }, 200);
  }, [closeDrawer]);

  // Escape: clear selection
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.key === "Escape" &&
        selectedIds.size > 0 &&
        !openParticipantId &&
        !showAddModal
      ) {
        setSelectedIds(new Set());
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [selectedIds.size, openParticipantId, showAddModal]);

  // Filter
  const filtered = useMemo(() => {
    let list = participants;

    if (activeTab !== "ALL") {
      list = list.filter((p: ParticipantRecord) =>
        p.enrollments.some(
          (e: ParticipantEnrollment) => e.courseType === activeTab,
        ),
      );
    }

    if (completionFilter !== "ALL") {
      list = list.filter((p: ParticipantRecord) => {
        const { completed, total } = calcCompletionSummary(p.enrollments);
        if (completionFilter === "수료")
          return total > 0 && completed === total;
        if (completionFilter === "미수료")
          return total === 0 || completed < total;
        return true;
      });
    }

    if (insuranceFilter !== "ALL") {
      list = list.filter((p: ParticipantRecord) => {
        if (insuranceFilter === "가입") return p.employmentInsurance === "가입";
        if (insuranceFilter === "미가입")
          return p.employmentInsurance === "미가입";
        return true;
      });
    }

    if (searchDebounced.trim()) {
      const q = searchDebounced.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.companyName.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) ||
          p.phone.toLowerCase().includes(q),
      );
    }

    return list;
  }, [
    participants,
    activeTab,
    completionFilter,
    insuranceFilter,
    searchDebounced,
  ]);

  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20;

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, completionFilter, insuranceFilter, searchDebounced]);

  const openParticipant = useMemo(
    () =>
      openParticipantId
        ? participants.find(
            (p: ParticipantRecord) => p.id === openParticipantId,
          )
        : null,
    [openParticipantId, participants],
  );

  const allFilteredSelected =
    filtered.length > 0 &&
    filtered.every((p: ParticipantRecord) => selectedIds.has(p.id));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filtered.forEach((p: ParticipantRecord) => next.delete(p.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filtered.forEach((p: ParticipantRecord) => next.add(p.id));
        return next;
      });
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const updateParticipant = (updated: ParticipantRecord) => {
    upsertParticipant(updated);
  };

  const addParticipant = (p: ParticipantRecord) => {
    upsertParticipant(p);
    setShowAddModal(false);
    addToast(`${p.name} 참여자가 추가되었습니다.`);
  };

  const addToast = (message: string) => {
    const id = uid("toast");
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      3000,
    );
  };

  const isFiltered = completionFilter !== "ALL" || insuranceFilter !== "ALL";

  const filtersActive =
    isFiltered || activeTab !== "ALL" || searchDebounced.trim() !== "";

  return (
    <>
      <PageHeader title="참여자 관리" />

      {/* Header row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      ></div>

      {/* Filter row */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          marginBottom: 14,
        }}
      >
        {/* Tabs + secondary filters */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          {/* Tab pills */}
          <div className="course-filter-shell">
            <div className="course-filter-pills">
              {TAB_ITEMS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  className={`course-pill${activeTab === tab.key ? " active" : ""}`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={16} />
            참여자 추가
          </button>
        </div>
        <div className="search-and-filter">
          {/* Search */}
          <div style={{ position: "relative", width: "100%", maxWidth: 400 }}>
            <Search
              size={15}
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--color-text-tertiary)",
                pointerEvents: "none",
              }}
            />
            <input
              type="search"
              className="select-field"
              style={{
                width: "100%",
                paddingLeft: 36,
                height: 38,
                minWidth: "unset",
                borderRadius: 10,
              }}
              placeholder="이름, 기업명, 이메일, 연락처 검색"
              value={searchRaw}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          {/* Secondary filters */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <select
              className="select-field small"
              value={completionFilter}
              onChange={(e) =>
                setCompletionFilter(e.target.value as CompletionFilter)
              }
            >
              <option value="ALL">수료 상태</option>
              <option value="수료">수료</option>
              <option value="미수료">미수료</option>
            </select>

            <select
              className="select-field small"
              value={insuranceFilter}
              onChange={(e) =>
                setInsuranceFilter(e.target.value as InsuranceFilter)
              }
            >
              <option value="ALL">고용보험</option>
              <option value="가입">가입</option>
              <option value="미가입">미가입</option>
            </select>

            {isFiltered && (
              <button
                type="button"
                className="btn btn-ghost"
                style={{ height: 36, padding: "0 10px", fontSize: 13 }}
                onClick={() => {
                  setCompletionFilter("ALL");
                  setInsuranceFilter("ALL");
                }}
              >
                <X size={14} />
                초기화
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table-wrap">
        <table className="data-table participants-table">
          <thead>
            <tr>
              <th scope="col" style={{ width: 38 }}>
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  onChange={toggleSelectAll}
                  style={{ cursor: "pointer", width: 14, height: 14 }}
                  aria-label="전체 선택"
                />
              </th>
              <th scope="col" style={{ width: 120, textAlign: "left" }}>
                이름
              </th>
              <th scope="col" style={{ textAlign: "left" }}>
                소속 기업
              </th>
              <th scope="col" style={{ width: 100, textAlign: "left" }}>
                직위
              </th>
              <th
                scope="col"
                className="col-phone participants-email-col"
                style={{ width: 140, textAlign: "left" }}
              >
                연락처
              </th>
              <th
                scope="col"
                className="col-email participants-email-col"
                style={{ textAlign: "left" }}
              >
                이메일
              </th>
              <th scope="col" style={{ width: 120, textAlign: "left" }}>
                수료 현황
              </th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  style={{ padding: "60px 20px", textAlign: "center" }}
                >
                  {filtersActive ? (
                    <EmptyState
                      icon={Search}
                      title="검색 결과가 없습니다"
                      description="다른 검색어나 필터 조건을 시도해 보세요."
                    />
                  ) : (
                    <EmptyState
                      icon={Search}
                      title="등록된 참여자가 없습니다"
                      description="새로운 참여자를 추가해 보세요."
                      action={{
                        label: "+ 참여자 추가",
                        onClick: () => setShowAddModal(true),
                      }}
                    />
                  )}
                </td>
              </tr>
            ) : (
              filtered.map((p: ParticipantRecord) => {
                const { completed, total } = calcCompletionSummary(
                  p.enrollments,
                );
                const variant = completionVariant(completed, total);
                const isSelected = selectedIds.has(p.id);
                return (
                  <tr
                    key={p.id}
                    className={`row-clickable${isSelected ? " row-selected" : ""}`}
                    onClick={() => openDrawer(p.id)}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") openDrawer(p.id);
                    }}
                  >
                    <td
                      style={{ width: 38, textAlign: "center" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelect(p.id);
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(p.id)}
                        style={{ cursor: "pointer", width: 14, height: 14 }}
                        aria-label={`${p.name} 선택`}
                      />
                    </td>
                    <td style={{ width: 120 }}>
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: "var(--color-text-primary)",
                        }}
                        className="participant-name-link"
                      >
                        {p.name}
                      </span>
                    </td>
                    <td>
                      {p.companyId ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/companies?open=${p.companyId}`);
                          }}
                          style={{
                            background: "transparent",
                            border: 0,
                            cursor: "pointer",
                            color: "var(--color-info)",
                            fontSize: 13,
                            fontWeight: 500,
                            padding: 0,
                            textDecoration: "underline",
                          }}
                        >
                          {p.companyName}
                        </button>
                      ) : (
                        <span style={{ color: "var(--color-text-tertiary)" }}>
                          —
                        </span>
                      )}
                    </td>
                    <td
                      style={{
                        width: 100,
                        color: "var(--color-text-secondary)",
                        fontSize: 14,
                      }}
                    >
                      {p.position || "—"}
                    </td>
                    <td
                      className="col-phone participants-email-col"
                      style={{ width: 140, fontSize: 13 }}
                    >
                      {p.phone || "—"}
                    </td>
                    <td
                      className="col-email participants-email-col"
                      style={{
                        fontSize: 12,
                        color: "var(--color-text-secondary)",
                      }}
                    >
                      {p.email || "—"}
                    </td>
                    <td style={{ width: 120 }}>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 4,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color:
                              variant === "green"
                                ? "#065f46"
                                : variant === "gray"
                                  ? "#64748b"
                                  : "var(--color-text-primary)",
                          }}
                        >
                          {completed}/{total}
                        </span>
                        {/* Mini progress bar */}
                        <div
                          style={{
                            height: 4,
                            borderRadius: 2,
                            background: "#e2e8f0",
                            overflow: "hidden",
                            width: 64,
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              width:
                                total > 0
                                  ? `${(completed / total) * 100}%`
                                  : "0%",
                              background:
                                variant === "green"
                                  ? "#10b981"
                                  : variant === "gray"
                                    ? "#94a3b8"
                                    : "#10b981",
                              borderRadius: 2,
                              transition: "width 0.3s",
                            }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <nav
          aria-label="페이지 네비게이션"
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 4,
            marginTop: 16,
            paddingBottom: 24,
          }}
        >
          <button
            className="btn btn-ghost"
            style={{ height: 36, padding: "0 12px", fontSize: 13 }}
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            aria-label="이전 페이지"
          >
            이전
          </button>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              fontSize: 13,
              padding: "0 12px",
            }}
          >
            {currentPage} / {totalPages}
          </span>
          <button
            className="btn btn-ghost"
            style={{ height: 36, padding: "0 12px", fontSize: 13 }}
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
            aria-label="다음 페이지"
          >
            다음
          </button>
        </nav>
      )}

      {/* Floating action bar */}
      {selectedIds.size > 0 && (
        <div className="floating-action-bar">
          <div className="floating-action-inner">
            <p className="floating-action-count">
              {selectedIds.size}명 참여자 선택됨
            </p>
            <div className="floating-action-buttons">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => addToast("이메일 발송 기능은 준비 중입니다.")}
              >
                <Mail size={15} />
                이메일 발송
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => addToast("내보내기 기능은 준비 중입니다.")}
              >
                <Download size={15} />
                내보내기
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setSelectedIds(new Set())}
              >
                <X size={15} />
                선택 해제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Side Drawer */}
      {openParticipant && (
        <ParticipantDrawer
          participant={openParticipant}
          onClose={handleDrawerClose}
          onUpdate={updateParticipant}
          allCompanies={initialCompanies}
          isClosing={isClosing}
          participants={participants}
        />
      )}

      {/* Add Participant Modal */}
      {showAddModal && (
        <AddParticipantModal
          onClose={() => setShowAddModal(false)}
          onAdd={addParticipant}
          allCompanies={allCompanies}
        />
      )}

      <ToastContainer toasts={toasts} />
    </>
  );
}
