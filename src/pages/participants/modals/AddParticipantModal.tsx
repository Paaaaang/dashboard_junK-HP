import { useState, useMemo, useEffect } from "react";
import { X, Plus } from "lucide-react";
import { ToggleSwitch } from "@/components/ui";
import { CompanyRecord, ParticipantRecord, WorkExperience, DocumentSkill } from "@/types/models";
import { formatPhone } from "@/pages/companies/utils/companyUtils";

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

let _seq = 0;
function uid(prefix: string) {
  _seq += 1;
  return `${prefix}-${Date.now()}-${_seq}`;
}

interface AddParticipantForm {
  name: string;
  companyId: string;
  companyName: string;
  // New enterprise mini-form fields
  isNewCompany: boolean;
  companyLocation: string;
  companyRepresentative: string;
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

export function AddParticipantModal({
  onClose,
  onAdd,
  allCompanies,
}: AddParticipantModalProps) {
  const [form, setForm] = useState<AddParticipantForm>({
    name: "",
    companyId: "",
    companyName: "",
    isNewCompany: false,
    companyLocation: "",
    companyRepresentative: "",
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
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!form.name.trim()) e.name = "이름을 입력하세요";
    if (!form.companyName.trim()) e.companyName = "소속 기업을 선택하세요";
    if (form.isNewCompany) {
      if (!form.companyLocation.trim()) e.companyLocation = "소재지를 입력하세요";
      if (!form.companyRepresentative.trim()) e.companyRepresentative = "대표명을 입력하세요";
    }
    if (!form.phone.trim()) {
      e.phone = "연락처를 입력하세요";
    } else if (form.phone.replace(/-/g, "").length < 9) {
      e.phone = "유효한 연락처 형식이 아닙니다";
    }
    if (!form.email.trim()) {
      e.email = "이메일을 입력하세요";
    } else if (!emailRegex.test(form.email)) {
      e.email = "올바른 이메일 형식이 아닙니다";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    
    let targetCompanyId: string | null = form.companyId || null;
    let newCompanyData = undefined;

    if (form.isNewCompany) {
      targetCompanyId = null; // Backend will generate real ID from newCompany
      newCompanyData = {
        companyName: form.companyName.trim(),
        location: form.companyLocation.trim(),
        representative: form.companyRepresentative.trim(),
      };
    }

    const newP: ParticipantRecord = {
      id: uid("pt"),
      name: form.name.trim(),
      companyId: targetCompanyId || "", 
      companyName: form.companyName.trim(),
      position: form.position.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      employmentInsurance: form.employmentInsurance ? "가입" : "미가입",
      workExperience: form.workExperience || undefined,
      documentSkill: form.documentSkill || undefined,
      enrollments: [],
      newCompany: newCompanyData, // Attach new company data for transactional creation
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
      className="fixed inset-0 bg-brand-dark/40 flex items-center justify-center z-[200] p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-surface rounded-[32px] shadow-2xl flex flex-col w-full max-w-[560px] max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-4 duration-300"
      >
        <div className="px-8 py-6 border-b border-border flex justify-between items-center bg-surface sticky top-0 z-10">
          <h3 className="text-xl font-bold text-primary">참여자 추가</h3>
          <button
            type="button"
            className="p-2 text-tertiary hover:text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-all duration-200"
            onClick={onClose}
            aria-label="닫기"
          >
            <X className="w-5 h-5" strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-secondary">
                이름 <span className="text-error">*</span>
              </label>
              <input
                id="add-name"
                type="text"
                className={`w-full px-4 py-3 rounded-xl border bg-surface placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all duration-200 ${
                  errors.name ? "border-error/50" : "border-border"
                }`}
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="홍길동"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? "err-name" : undefined}
              />
              {errors.name && (
                <p id="err-name" role="alert" className="text-xs font-bold text-error mt-1 ml-1">
                  {errors.name}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-secondary">직위</label>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-xl border border-border bg-surface placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all duration-200"
                value={form.position}
                onChange={(e) => set("position", e.target.value)}
                placeholder="선임연구원"
              />
            </div>

            <div className="col-span-2 space-y-2 relative">
              <label className="block text-sm font-semibold text-secondary">
                소속 기업 <span className="text-error">*</span>
              </label>
              <input
                type="text"
                className={`w-full px-4 py-3 rounded-xl border bg-surface placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all duration-200 ${
                  errors.companyName ? "border-error/50" : "border-border"
                }`}
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
                <p className="text-xs font-bold text-error mt-1 ml-1">
                  {errors.companyName}
                </p>
              )}
              {showDropdown && (
                <div className="absolute top-full left-0 w-full mt-2 bg-surface border border-border rounded-2xl shadow-xl z-50 overflow-hidden py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                  {filteredCompanies.length === 0 && (
                    <p className="px-4 py-3 text-sm text-tertiary text-center italic">검색 결과 없음</p>
                  )}
                  {filteredCompanies.map((c: CompanyRecord) => (
                    <button
                      type="button"
                      key={c.id}
                      className="w-full text-left px-4 py-3 text-sm text-secondary hover:bg-brand-primary/10 hover:text-brand-primary transition-colors flex items-center justify-between group"
                      onMouseDown={() => {
                        set("companyId", c.id);
                        set("companyName", c.companyName);
                        setCompanySearch("");
                        setShowDropdown(false);
                      }}
                    >
                      <span className="font-medium">{c.companyName}</span>
                      <span className="text-[10px] font-bold text-tertiary group-hover:text-brand-primary bg-surface-subtle group-hover:bg-brand-primary/10 px-2 py-0.5 rounded uppercase">Select</span>
                    </button>
                  ))}
                  {companySearch.trim() && (
                    <button
                      type="button"
                      className="w-full text-left px-4 py-3 text-sm text-brand-primary hover:bg-brand-primary/10 font-bold border-t border-border flex items-center gap-2"
                      onMouseDown={() => {
                        set("companyName", companySearch.trim());
                        set("companyId", "");
                        set("isNewCompany", true);
                        setCompanySearch("");
                        setShowDropdown(false);
                      }}
                    >
                      <Plus className="w-4 h-4" strokeWidth={2.5} />
                      <span>새 기업으로 등록: {companySearch.trim()}</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {form.isNewCompany && (
              <div className="col-span-2 grid grid-cols-2 gap-6 p-6 bg-brand-primary/10 rounded-[24px] border border-brand-primary/20 animate-in zoom-in-95 duration-200">
                <div className="col-span-2 flex items-center justify-between mb-2">
                  <h4 className="text-[13px] font-bold text-brand-primary uppercase tracking-wider">새 기업 필수 정보</h4>
                  <button 
                    type="button" 
                    className="text-[11px] font-bold text-tertiary hover:text-error transition-colors"
                    onClick={() => {
                      set("isNewCompany", false);
                      set("companyName", "");
                    }}
                  >
                    취소
                  </button>
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-tertiary uppercase">대표명 <span className="text-error">*</span></label>
                  <input
                    type="text"
                    className={`w-full px-4 py-2.5 rounded-xl border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all ${
                      errors.companyRepresentative ? "border-error/50" : "border-border"
                    }`}
                    value={form.companyRepresentative}
                    onChange={(e) => set("companyRepresentative", e.target.value)}
                    placeholder="대표자 성함"
                  />
                  {errors.companyRepresentative && <p className="text-[10px] font-bold text-error ml-1">{errors.companyRepresentative}</p>}
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-tertiary uppercase">소재지 <span className="text-error">*</span></label>
                  <input
                    type="text"
                    className={`w-full px-4 py-2.5 rounded-xl border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all ${
                      errors.companyLocation ? "border-error/50" : "border-border"
                    }`}
                    value={form.companyLocation}
                    onChange={(e) => set("companyLocation", e.target.value)}
                    placeholder="광주광역시..."
                  />
                  {errors.companyLocation && <p className="text-[10px] font-bold text-error ml-1">{errors.companyLocation}</p>}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-secondary">
                연락처 <span className="text-error">*</span>
              </label>
              <input
                id="add-phone"
                type="tel"
                className={`w-full px-4 py-3 rounded-xl border bg-surface placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all duration-200 ${
                  errors.phone ? "border-error/50" : "border-border"
                }`}
                value={form.phone}
                onChange={(e) => set("phone", formatPhone(e.target.value))}
                placeholder="010-0000-0000"
                aria-invalid={!!errors.phone}
                aria-describedby={errors.phone ? "err-phone" : undefined}
              />
              {errors.phone && (
                <p id="err-phone" role="alert" className="text-xs font-bold text-error mt-1 ml-1">
                  {errors.phone}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-secondary">
                이메일 <span className="text-error">*</span>
              </label>
              <input
                type="email"
                className={`w-full px-4 py-3 rounded-xl border bg-surface placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all duration-200 ${
                  errors.email ? "border-error/50" : "border-border"
                }`}
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="name@company.com"
              />
              {errors.email && (
                <p className="text-xs font-bold text-error mt-1 ml-1">
                  {errors.email}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-secondary">고용보험</label>
              <div
                className="flex items-center gap-3 p-3 bg-surface-subtle rounded-xl border border-border"
              >
                <ToggleSwitch
                  checked={form.employmentInsurance}
                  onChange={(v) => set("employmentInsurance", v)}
                />
                <span
                  className="text-sm font-bold text-secondary"
                >
                  {form.employmentInsurance ? "가입" : "미가입"}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-secondary">업무경력</label>
              <select
                className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all duration-200"
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

            <div className="col-span-2 space-y-2">
              <label className="block text-sm font-semibold text-secondary">문서작성역량</label>
              <select
                className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all duration-200"
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

        <div className="px-8 py-6 border-t border-border flex justify-end gap-3 bg-surface-subtle/50">
          <button type="button" className="px-6 py-3 bg-surface border border-border text-secondary hover:bg-surface-subtle rounded-xl font-bold transition-all duration-200" onClick={onClose}>
            취소
          </button>
          <button
            type="button"
            className="px-6 py-3 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl font-bold transition-all duration-200 shadow-lg shadow-brand-primary/20"
            onClick={handleSubmit}
          >
            추가
          </button>
        </div>
      </div>
    </div>
  );
}
