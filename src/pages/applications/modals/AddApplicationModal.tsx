import { useState, useMemo, useEffect } from "react";
import { X } from "lucide-react";
import { useCourseStore, useCompanyStore } from "@/stores";
import { formatPhone } from "@/pages/companies/utils/companyUtils";
import type { EmploymentInsuranceStatus } from "@/types/models";

interface AddApplicationModalProps {
  onClose: () => void;
  onAdd: (app: {
    name: string;
    companyName: string;
    position?: string;
    phone?: string;
    email?: string;
    employmentInsurance: EmploymentInsuranceStatus;
    workExperience?: string;
    documentSkill?: string;
    mainProduct?: string;
    courseGroupName: string;
    subCourseName: string;
    sessionId?: string;
  }) => void;
}

export function AddApplicationModal({
  onClose,
  onAdd,
}: AddApplicationModalProps) {
  const { courseGroups } = useCourseStore();
  const { companies } = useCompanyStore();

  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [position, setPosition] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [employmentInsurance, setEmploymentInsurance] = useState<EmploymentInsuranceStatus>("미확인");
  const [workExperience, setWorkExperience] = useState("");
  const [documentSkill, setDocumentSkill] = useState("");
  const [mainProduct, setMainProduct] = useState("");
  
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState("");

  const [companySearch, setCompanySearch] = useState("");
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Memoized data for selectors
  const filteredCompanies = useMemo(() => {
    if (!companySearch.trim()) return [];
    return companies.filter((c) =>
      c.companyName.toLowerCase().includes(companySearch.toLowerCase())
    );
  }, [companySearch, companies]);

  const activeGroup = useMemo(() => {
    return courseGroups.find((g) => g.id === selectedGroupId) || null;
  }, [selectedGroupId, courseGroups]);

  const activeCourse = useMemo(() => {
    return activeGroup?.details.find((d) => d.id === selectedCourseId) || null;
  }, [selectedCourseId, activeGroup]);

  // Reset dependent selectors
  useEffect(() => {
    setSelectedCourseId("");
    setSelectedSessionId("");
  }, [selectedGroupId]);

  useEffect(() => {
    setSelectedSessionId("");
  }, [selectedCourseId]);

  const validate = () => {
    const errs: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!name.trim()) errs.name = "이름을 입력하세요.";
    if (!companyName.trim()) errs.companyName = "기업명을 입력하거나 선택하세요.";
    if (!selectedGroupId) errs.courseGroup = "교육 구분을 선택하세요.";
    if (!selectedCourseId) errs.subCourse = "세부 프로그램을 선택하세요.";

    if (phone.trim() && phone.replace(/-/g, "").length < 9) {
      errs.phone = "유효한 연락처 형식을 입력하세요.";
    }
    if (email.trim() && !emailRegex.test(email)) {
      errs.email = "올바른 이메일 형식을 입력하세요.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const group = courseGroups.find((g) => g.id === selectedGroupId);
    const course = group?.details.find((d) => d.id === selectedCourseId);

    onAdd({
      name: name.trim(),
      companyName: companyName.trim(),
      position: position.trim() || undefined,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      employmentInsurance,
      workExperience: workExperience.trim() || undefined,
      documentSkill: documentSkill.trim() || undefined,
      mainProduct: mainProduct.trim() || undefined,
      courseGroupName: group?.name || "",
      subCourseName: course?.name || "",
      sessionId: selectedSessionId || undefined,
    });
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
      <div className="bg-surface rounded-[32px] shadow-2xl flex flex-col w-full max-w-[560px] max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        <div className="px-8 py-6 border-b border-border/40 flex justify-between items-center bg-surface sticky top-0 z-10">
          <h3 className="text-xl font-bold text-primary font-heading">수동 신청 추가</h3>
          <button
            type="button"
            className="p-2 text-tertiary hover:text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-all duration-200 cursor-pointer"
            onClick={onClose}
          >
            <X className="w-5 h-5" strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-secondary">
                이름 <span className="text-error">*</span>
              </label>
              <input
                type="text"
                className={`w-full px-4 py-3 rounded-xl border bg-surface placeholder:text-tertiary text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all duration-200 ${
                  errors.name ? "border-error/50" : "border-border/40"
                }`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="홍길동"
              />
              {errors.name && <p className="text-xs font-bold text-error mt-1 ml-1">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-secondary">직위</label>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-xl border border-border/40 bg-surface placeholder:text-tertiary text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all duration-200"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="과장"
              />
            </div>

            <div className="col-span-2 space-y-2 relative">
              <label className="block text-sm font-semibold text-secondary">
                소속 기업 <span className="text-error">*</span>
              </label>
              <input
                type="text"
                className={`w-full px-4 py-3 rounded-xl border bg-surface placeholder:text-tertiary text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all duration-200 ${
                  errors.companyName ? "border-error/50" : "border-border/40"
                }`}
                value={companySearch || companyName}
                onChange={(e) => {
                  setCompanySearch(e.target.value);
                  setCompanyName(e.target.value);
                  setShowCompanyDropdown(true);
                }}
                onFocus={() => setShowCompanyDropdown(true)}
                onBlur={() => setTimeout(() => setShowCompanyDropdown(false), 200)}
                placeholder="기업명 검색 또는 직접 입력..."
              />
              {errors.companyName && <p className="text-xs font-bold text-error mt-1 ml-1">{errors.companyName}</p>}
              {showCompanyDropdown && filteredCompanies.length > 0 && (
                <div className="absolute top-full left-0 w-full mt-2 bg-surface border border-border/40 rounded-2xl shadow-xl z-50 overflow-hidden py-1">
                  {filteredCompanies.map((c) => (
                    <button
                      type="button"
                      key={c.id}
                      className="w-full text-left px-4 py-3 text-sm text-secondary hover:bg-brand-primary/10 hover:text-brand-primary transition-colors flex items-center justify-between group cursor-pointer"
                      onMouseDown={() => {
                        setCompanyName(c.companyName);
                        setCompanySearch("");
                        setShowCompanyDropdown(false);
                      }}
                    >
                      <span className="font-bold">{c.companyName}</span>
                      <span className="text-[10px] font-black text-tertiary bg-surface-subtle group-hover:bg-brand-primary/20 px-2 py-0.5 rounded">선택</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-secondary">연락처</label>
              <input
                type="tel"
                className={`w-full px-4 py-3 rounded-xl border bg-surface placeholder:text-tertiary text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all duration-200 ${
                  errors.phone ? "border-error/50" : "border-border/40"
                }`}
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                placeholder="010-0000-0000"
              />
              {errors.phone && <p className="text-xs font-bold text-error mt-1 ml-1">{errors.phone}</p>}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-secondary">이메일</label>
              <input
                type="email"
                className={`w-full px-4 py-3 rounded-xl border bg-surface placeholder:text-tertiary text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all duration-200 ${
                  errors.email ? "border-error/50" : "border-border/40"
                }`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
              />
              {errors.email && <p className="text-xs font-bold text-error mt-1 ml-1">{errors.email}</p>}
            </div>

            <div className="col-span-2 space-y-2">
              <label className="block text-sm font-semibold text-secondary">고용보험 가입여부</label>
              <select
                className="w-full px-4 py-3 rounded-xl border border-border/40 bg-surface text-sm font-semibold text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all duration-200 cursor-pointer"
                value={employmentInsurance}
                onChange={(e) => setEmploymentInsurance(e.target.value as EmploymentInsuranceStatus)}
              >
                <option value="미확인">미확인</option>
                <option value="가입">가입</option>
                <option value="미가입">미가입</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-secondary">업무 경력</label>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-xl border border-border/40 bg-surface placeholder:text-tertiary text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all duration-200"
                value={workExperience}
                onChange={(e) => setWorkExperience(e.target.value)}
                placeholder="예: 3년차 이하"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-secondary">문서 작성 역량</label>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-xl border border-border/40 bg-surface placeholder:text-tertiary text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all duration-200"
                value={documentSkill}
                onChange={(e) => setDocumentSkill(e.target.value)}
                placeholder="예: 기초 수준"
              />
            </div>

            <div className="col-span-2 space-y-2">
              <label className="block text-sm font-semibold text-secondary">기업 주력 품목</label>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-xl border border-border/40 bg-surface placeholder:text-tertiary text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all duration-200"
                value={mainProduct}
                onChange={(e) => setMainProduct(e.target.value)}
                placeholder="예: 의료용 레이저"
              />
            </div>
          </div>

          <div className="border-t border-border/40 pt-6 space-y-4">
            <h4 className="text-xs font-black text-tertiary uppercase tracking-widest font-heading">신청 과정 정보</h4>
            
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-secondary">
                교육 구분 <span className="text-error">*</span>
              </label>
              <select
                className={`w-full px-4 py-3 rounded-xl border bg-surface text-sm font-semibold text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all duration-200 cursor-pointer ${
                  errors.courseGroup ? "border-error/50" : "border-border/40"
                }`}
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
              >
                <option value="">교육 구분 선택...</option>
                {courseGroups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
              {errors.courseGroup && <p className="text-xs font-bold text-error mt-1 ml-1">{errors.courseGroup}</p>}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-secondary">
                세부 프로그램 <span className="text-error">*</span>
              </label>
              <select
                className={`w-full px-4 py-3 rounded-xl border bg-surface text-sm font-semibold text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all duration-200 cursor-pointer ${
                  errors.subCourse ? "border-error/50" : "border-border/40"
                }`}
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                disabled={!selectedGroupId}
              >
                <option value="">세부 과정 선택...</option>
                {activeGroup?.details.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              {errors.subCourse && <p className="text-xs font-bold text-error mt-1 ml-1">{errors.subCourse}</p>}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-secondary">회차(기수) 지정</label>
              <select
                className="w-full px-4 py-3 rounded-xl border border-border/40 bg-surface text-sm font-semibold text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all duration-200 cursor-pointer"
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                disabled={!selectedCourseId}
              >
                <option value="">자동 매칭 (가장 빠른 활성 기수 배정)</option>
                {activeCourse?.sessions?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.sessionNo}회차 ({s.startDate} ~ {s.endDate})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="px-8 py-6 border-t border-border/40 flex justify-end gap-3 bg-surface-subtle/50">
          <button
            type="button"
            className="px-5 py-2.5 bg-surface border border-border/40 text-secondary hover:bg-surface-subtle rounded-xl text-sm font-bold transition-all cursor-pointer"
            onClick={onClose}
          >
            취소
          </button>
          <button
            type="button"
            className="px-5 py-2.5 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-brand-primary/20 cursor-pointer"
            onClick={handleSubmit}
          >
            추가 완료
          </button>
        </div>
      </div>
    </div>
  );
}
