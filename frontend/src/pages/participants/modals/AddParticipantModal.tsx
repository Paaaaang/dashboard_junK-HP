import { useState, useMemo, useEffect } from "react";
import { X, Plus } from "lucide-react";
import { ToggleSwitch } from "../../../components/ui";
import { CompanyRecord, ParticipantRecord, WorkExperience, DocumentSkill } from "../../../types/models";

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
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white rounded-[32px] shadow-2xl flex flex-col w-full max-w-[560px] max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-4 duration-300"
      >
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <h3 className="text-xl font-bold text-slate-900">참여자 추가</h3>
          <button
            type="button"
            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200"
            onClick={onClose}
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                이름 <span className="text-red-500">*</span>
              </label>
              <input
                id="add-name"
                type="text"
                className={`w-full px-4 py-3 rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 ${
                  errors.name ? "border-red-300" : "border-slate-200"
                }`}
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="홍길동"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? "err-name" : undefined}
              />
              {errors.name && (
                <p id="err-name" role="alert" className="text-xs font-bold text-red-500 mt-1 ml-1">
                  {errors.name}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">직위</label>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
                value={form.position}
                onChange={(e) => set("position", e.target.value)}
                placeholder="선임연구원"
              />
            </div>

            <div className="col-span-2 space-y-2 relative">
              <label className="block text-sm font-semibold text-slate-700">
                소속 기업 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className={`w-full px-4 py-3 rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 ${
                  errors.companyName ? "border-red-300" : "border-slate-200"
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
                <p className="text-xs font-bold text-red-500 mt-1 ml-1">
                  {errors.companyName}
                </p>
              )}
              {showDropdown && (
                <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                  {filteredCompanies.length === 0 && (
                    <p className="px-4 py-3 text-sm text-slate-400 text-center italic">검색 결과 없음</p>
                  )}
                  {filteredCompanies.map((c: CompanyRecord) => (
                    <button
                      type="button"
                      key={c.id}
                      className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors flex items-center justify-between group"
                      onMouseDown={() => {
                        set("companyId", c.id);
                        set("companyName", c.companyName);
                        setCompanySearch("");
                        setShowDropdown(false);
                      }}
                    >
                      <span className="font-medium">{c.companyName}</span>
                      <span className="text-[10px] font-bold text-slate-400 group-hover:text-emerald-500 bg-slate-100 group-hover:bg-emerald-100 px-2 py-0.5 rounded uppercase">Select</span>
                    </button>
                  ))}
                  {companySearch.trim() && (
                    <button
                      type="button"
                      className="w-full text-left px-4 py-3 text-sm text-emerald-600 hover:bg-emerald-50 font-bold border-t border-slate-50 flex items-center gap-2"
                      onMouseDown={() => {
                        set("companyName", companySearch.trim());
                        set("companyId", "");
                        setCompanySearch("");
                        setShowDropdown(false);
                      }}
                    >
                      <Plus className="w-4 h-4" />
                      <span>새 기업으로 등록: {companySearch.trim()}</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                연락처 <span className="text-red-500">*</span>
              </label>
              <input
                id="add-phone"
                type="tel"
                className={`w-full px-4 py-3 rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 ${
                  errors.phone ? "border-red-300" : "border-slate-200"
                }`}
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="010-0000-0000"
                aria-invalid={!!errors.phone}
                aria-describedby={errors.phone ? "err-phone" : undefined}
              />
              {errors.phone && (
                <p id="err-phone" role="alert" className="text-xs font-bold text-red-500 mt-1 ml-1">
                  {errors.phone}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                이메일 <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                className={`w-full px-4 py-3 rounded-xl border bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 ${
                  errors.email ? "border-red-300" : "border-slate-200"
                }`}
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="name@company.com"
              />
              {errors.email && (
                <p className="text-xs font-bold text-red-500 mt-1 ml-1">
                  {errors.email}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">고용보험</label>
              <div
                className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100"
              >
                <ToggleSwitch
                  checked={form.employmentInsurance}
                  onChange={(v) => set("employmentInsurance", v)}
                />
                <span
                  className="text-sm font-bold text-slate-600"
                >
                  {form.employmentInsurance ? "가입" : "미가입"}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">업무경력</label>
              <select
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
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
              <label className="block text-sm font-semibold text-slate-700">문서작성역량</label>
              <select
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
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

        <div className="px-8 py-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
          <button type="button" className="px-6 py-3 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-bold transition-all duration-200" onClick={onClose}>
            취소
          </button>
          <button
            type="button"
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all duration-200 shadow-lg shadow-emerald-600/20"
            onClick={handleSubmit}
          >
            추가
          </button>
        </div>
      </div>
    </div>
  );
}
