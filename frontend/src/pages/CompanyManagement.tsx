import { useMemo, useState, useRef } from "react";
import { Search, Upload, PlusCircle, X, FileSpreadsheet, ChevronRight } from "lucide-react";
import * as XLSX from "xlsx";
import {
  courseCatalog,
  programCatalog as initialProgramCatalog,
  createEmptyCompany,
  cloneCompany,
  initialCompanies,
} from "../constants";
import { PageHeader } from "../components/PageHeader";
import { StatusBadge } from "../components/StatusBadge";
import type { CompanyRecord, CompanyParticipation, CourseType } from "../types/models";

type ModalKind = "choice" | "form" | "upload";

interface TooltipInfo {
  content: React.ReactNode;
  style: React.CSSProperties;
}

const COURSE_LABELS: Record<CourseType, string> = {
  "훈련비과정": "훈련비",
  "지원비과정": "지원비",
  "공유개방 세미나": "세미나",
};

function formatBusinessRegNo(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

export function CompanyManagementPage() {
  const [companies, setCompanies] = useState<CompanyRecord[]>(initialCompanies);
  const [searchText, setSearchText] = useState("");
  // Set<string>: standard CourseType 값 + 사용자 추가 커스텀 필터 모두 수용
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(new Set());
  const [customCourseFilters, setCustomCourseFilters] = useState<string[]>([]);
  const [addingCourseFilter, setAddingCourseFilter] = useState(false);
  const [newCourseText, setNewCourseText] = useState("");

  const [modalKind, setModalKind] = useState<ModalKind | null>(null);
  const [draftCompany, setDraftCompany] = useState<CompanyRecord | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<CompanyRecord[] | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 과정 마스터 카탈로그 (새 과정 추가 시 업데이트)
  const [localProgramCatalog, setLocalProgramCatalog] = useState<Record<CourseType, string[]>>(
    () => ({
      "훈련비과정": [...initialProgramCatalog["훈련비과정"]],
      "지원비과정": [...initialProgramCatalog["지원비과정"]],
      "공유개방 세미나": [...initialProgramCatalog["공유개방 세미나"]],
    }),
  );

  // 칩 드롭다운 상태
  const [openDropdownIdx, setOpenDropdownIdx] = useState<number | null>(null);
  const [programSearch, setProgramSearch] = useState("");

  // 고정 위치 툴팁
  const [tooltipInfo, setTooltipInfo] = useState<TooltipInfo | null>(null);

  // ── 필터링 ────────────────────────────────────────────
  const filteredCompanies = useMemo(() => {
    return companies.filter((company) => {
      const search = searchText.trim().toLowerCase();
      const matchSearch =
        search.length === 0 ||
        company.companyName.toLowerCase().includes(search) ||
        company.manager.toLowerCase().includes(search) ||
        company.email.toLowerCase().includes(search);

      const matchCourse =
        selectedCourses.size === 0 ||
        company.participations.some((p) => {
          if (!p.enabled) return false;
          for (const filter of selectedCourses) {
            // 표준 과정: 정확 일치
            if ((courseCatalog as readonly string[]).includes(filter)) {
              if (p.courseType === filter) return true;
            } else {
              // 커스텀 필터: 과정명/세부과정 부분 일치
              if (
                p.courseType.toLowerCase().includes(filter.toLowerCase()) ||
                p.programNames.some((n) =>
                  n.toLowerCase().includes(filter.toLowerCase()),
                )
              )
                return true;
            }
          }
          return false;
        });

      return matchSearch && matchCourse;
    });
  }, [companies, selectedCourses, searchText]);

  // ── 과정 필터 토글 ────────────────────────────────────
  function toggleCourse(filter: string) {
    setSelectedCourses((prev) => {
      const next = new Set(prev);
      if (next.has(filter)) next.delete(filter);
      else next.add(filter);
      return next;
    });
  }

  function addCustomCourseFilter(name: string) {
    const trimmed = name.trim();
    if (trimmed && !customCourseFilters.includes(trimmed)) {
      setCustomCourseFilters((prev) => [...prev, trimmed]);
    }
    setAddingCourseFilter(false);
    setNewCourseText("");
  }

  function removeCustomCourseFilter(name: string) {
    setCustomCourseFilters((prev) => prev.filter((f) => f !== name));
    setSelectedCourses((prev) => {
      const next = new Set(prev);
      next.delete(name);
      return next;
    });
  }

  // ── 모달 열기/닫기 ────────────────────────────────────
  function openChoiceModal() {
    setModalKind("choice");
  }

  function openCreateModal() {
    setDraftCompany(createEmptyCompany());
    setModalKind("form");
  }

  function openEditModal(company: CompanyRecord) {
    setDraftCompany(cloneCompany(company));
    setModalKind("form");
  }

  function openUploadModal() {
    setUploadFile(null);
    setUploadPreview(null);
    setUploadError(null);
    setModalKind("upload");
  }

  function closeModal() {
    setModalKind(null);
    setDraftCompany(null);
    setUploadFile(null);
    setUploadPreview(null);
    setUploadError(null);
    setOpenDropdownIdx(null);
    setProgramSearch("");
  }

  // ── 폼 상태 업데이트 ──────────────────────────────────
  function updateDraftField<K extends keyof CompanyRecord>(
    field: K,
    value: CompanyRecord[K],
  ) {
    setDraftCompany((cur) => (cur ? { ...cur, [field]: value } : cur));
  }

  function updateParticipation(
    index: number,
    field: "enabled" | "status",
    value: boolean | CompanyParticipation["status"],
  ) {
    setDraftCompany((cur) => {
      if (!cur) return cur;
      return {
        ...cur,
        participations: cur.participations.map((p, i) =>
          i === index ? { ...p, [field]: value } : p,
        ),
      };
    });
  }

  function addProgram(participationIdx: number, name: string) {
    setDraftCompany((cur) => {
      if (!cur) return cur;
      return {
        ...cur,
        participations: cur.participations.map((p, i) =>
          i === participationIdx
            ? { ...p, programNames: [...p.programNames, name] }
            : p,
        ),
      };
    });
    setProgramSearch("");
    setOpenDropdownIdx(null);
  }

  function removeProgram(participationIdx: number, name: string) {
    setDraftCompany((cur) => {
      if (!cur) return cur;
      return {
        ...cur,
        participations: cur.participations.map((p, i) =>
          i === participationIdx
            ? { ...p, programNames: p.programNames.filter((n) => n !== name) }
            : p,
        ),
      };
    });
  }

  function createAndAddProgram(
    participationIdx: number,
    courseType: CourseType,
    name: string,
  ) {
    setLocalProgramCatalog((prev) => ({
      ...prev,
      [courseType]: [...prev[courseType], name],
    }));
    addProgram(participationIdx, name);
  }

  function saveCompany() {
    if (!draftCompany) return;
    setCompanies((cur) => {
      const exists = cur.some((c) => c.id === draftCompany.id);
      return exists
        ? cur.map((c) => (c.id === draftCompany.id ? draftCompany : c))
        : [draftCompany, ...cur];
    });
    closeModal();
  }

  // ── 엑셀 업로드 ───────────────────────────────────────
  function parseExcelFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
          worksheet,
          { defval: "" },
        );

        const parsed: CompanyRecord[] = rows
          .map((row, i) => {
            const company = createEmptyCompany();
            company.id = `upload-${Date.now()}-${i}`;
            for (const [key, val] of Object.entries(row)) {
              const k = key.trim();
              const v = String(val ?? "").trim();
              if (["기업명", "회사명"].includes(k)) company.companyName = v;
              else if (["사업자번호", "사업자등록번호"].includes(k))
                company.businessRegNo = formatBusinessRegNo(v);
              else if (["소재지", "주소"].includes(k)) company.location = v;
              else if (["대표명", "대표자"].includes(k)) company.representative = v;
              else if (["담당자"].includes(k)) company.manager = v;
              else if (["연락처", "전화"].includes(k)) company.phone = v;
              else if (["이메일"].includes(k)) company.email = v;
              else if (["협약서", "협약여부", "협약"].includes(k)) {
                const lower = v.toLowerCase();
                company.mouSigned =
                  lower === "체결" || lower === "y" || lower === "true" || lower === "1";
              }
            }
            return company;
          })
          .filter((c) => c.companyName.trim() !== "");

        if (parsed.length === 0) {
          setUploadError("인식된 기업 데이터가 없습니다. 칼럼명을 확인해 주세요.");
        } else {
          setUploadPreview(parsed);
        }
      } catch {
        setUploadError("파일을 파싱할 수 없습니다. xlsx/xls 형식인지 확인해 주세요.");
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFile(file);
    setUploadError(null);
    setUploadPreview(null);
    parseExcelFile(file);
  }

  function handleDropzoneDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    setUploadFile(file);
    setUploadError(null);
    setUploadPreview(null);
    parseExcelFile(file);
  }

  function confirmUpload() {
    if (!uploadPreview) return;
    setCompanies((cur) => [...uploadPreview, ...cur]);
    closeModal();
  }

  function resetUpload() {
    setUploadPreview(null);
    setUploadFile(null);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // ── 테이블 툴팁 핸들러 ────────────────────────────────
  function handleLocationEnter(
    e: React.MouseEvent<HTMLTableCellElement>,
    location: string,
  ) {
    const span = e.currentTarget.querySelector<HTMLSpanElement>(".location-text");
    if (!span || span.scrollWidth <= span.clientWidth) return;
    const rect = span.getBoundingClientRect();
    setTooltipInfo({
      content: location,
      style: {
        left: rect.left + rect.width / 2,
        top: rect.top,
        transform: "translateX(-50%) translateY(calc(-100% - 8px))",
      },
    });
  }

  function handleParticipationEnter(
    e: React.MouseEvent<HTMLTableCellElement>,
    activeParticipations: CompanyParticipation[],
  ) {
    if (activeParticipations.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipInfo({
      content: (
        <>
          {activeParticipations.map((p) => (
            <div key={p.courseType} className="tooltip-course-row">
              <span className="tooltip-course-type">{p.courseType}</span>
              {p.programNames.length > 0 && (
                <span className="tooltip-course-names">
                  {p.programNames.join(", ")}
                </span>
              )}
            </div>
          ))}
        </>
      ),
      style: {
        left: rect.left,
        top: rect.top + rect.height / 2,
        transform: "translateX(calc(-100% - 8px)) translateY(-50%)",
      },
    });
  }

  // ── 렌더 ──────────────────────────────────────────────
  return (
    <>
      <PageHeader
        title="기업 관리"
        actions={
          <button type="button" className="btn btn-primary" onClick={openChoiceModal}>
            <span>기업 추가</span>
          </button>
        }
      />

      <section aria-label="기업 관리 화면">
        {/* 필터 행 */}
        <div className="filter-row company-filter-row">
          <div className="course-filter-pills">
            {/* 전체 */}
            <button
              type="button"
              className={`course-pill${selectedCourses.size === 0 ? " active" : ""}`}
              onClick={() => setSelectedCourses(new Set())}
            >
              전체
            </button>

            {/* 표준 과정 필터 */}
            {courseCatalog.map((course) => (
              <button
                key={course}
                type="button"
                className={`course-pill${selectedCourses.has(course) ? " active" : ""}`}
                onClick={() => toggleCourse(course)}
              >
                {COURSE_LABELS[course]}
              </button>
            ))}

            {/* 커스텀 필터 (삭제 가능) */}
            {customCourseFilters.map((filter) => (
              <span
                key={filter}
                className={`course-pill-custom${selectedCourses.has(filter) ? " active" : ""}`}
              >
                <button
                  type="button"
                  className="course-pill-custom-label"
                  onClick={() => toggleCourse(filter)}
                >
                  {filter}
                </button>
                <button
                  type="button"
                  className="course-pill-remove"
                  onClick={() => removeCustomCourseFilter(filter)}
                  aria-label={`${filter} 필터 삭제`}
                >
                  ×
                </button>
              </span>
            ))}

            {/* + 추가 */}
            {addingCourseFilter ? (
              <input
                className="course-pill-input"
                value={newCourseText}
                onChange={(e) => setNewCourseText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addCustomCourseFilter(newCourseText);
                  if (e.key === "Escape") {
                    setAddingCourseFilter(false);
                    setNewCourseText("");
                  }
                }}
                onBlur={() => {
                  if (newCourseText.trim()) addCustomCourseFilter(newCourseText);
                  else {
                    setAddingCourseFilter(false);
                    setNewCourseText("");
                  }
                }}
                placeholder="과정명 입력"
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
              />
            ) : (
              <button
                type="button"
                className="course-pill course-pill-add"
                onClick={() => setAddingCourseFilter(true)}
              >
                + 추가
              </button>
            )}
          </div>

          <label className="search-field company-search" htmlFor="company-search">
            <Search className="icon-sm" />
            <input
              id="company-search"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="기업명, 담당자, 이메일 검색"
              aria-label="기업명, 담당자, 이메일 검색"
            />
          </label>
        </div>

        {/* 테이블 */}
        <div className="table-wrap">
          <table className="data-table company-table">
            <thead>
              <tr>
                <th scope="col">기업명</th>
                <th scope="col">소재지</th>
                <th scope="col">대표명</th>
                <th scope="col">담당자</th>
                <th scope="col">연락처</th>
                <th scope="col">이메일</th>
                <th scope="col">협약서 여부</th>
                <th scope="col">참여 과정</th>
              </tr>
            </thead>
            <tbody>
              {filteredCompanies.map((company) => {
                const activeParticipations = company.participations.filter(
                  (p) => p.enabled,
                );
                return (
                  <tr
                    key={company.id}
                    className="row-clickable"
                    onClick={() => openEditModal(company)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") openEditModal(company);
                    }}
                    tabIndex={0}
                  >
                    <td>
                      <div className="company-name-cell">
                        <span className="company-name-text">{company.companyName}</span>
                        {company.businessRegNo && (
                          <span className="company-reg-no">{company.businessRegNo}</span>
                        )}
                      </div>
                    </td>
                    <td
                      onMouseEnter={(e) => handleLocationEnter(e, company.location)}
                      onMouseLeave={() => setTooltipInfo(null)}
                    >
                      <span className="location-text">{company.location}</span>
                    </td>
                    <td>{company.representative}</td>
                    <td>{company.manager}</td>
                    <td>{company.phone}</td>
                    <td>{company.email}</td>
                    <td>
                      <StatusBadge
                        status={company.mouSigned ? "success" : "neutral"}
                        label={company.mouSigned ? "체결" : "미체결"}
                        compact
                      />
                    </td>
                    <td
                      onMouseEnter={(e) =>
                        handleParticipationEnter(e, activeParticipations)
                      }
                      onMouseLeave={() => setTooltipInfo(null)}
                    >
                      <span>{activeParticipations.length}개</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* 기업 추가 방식 선택 모달 */}
      {modalKind === "choice" && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="기업 추가 방식 선택"
        >
          <div className="modal-panel modal-panel-sm">
            <div className="modal-header">
              <h3>기업 추가</h3>
              <button
                type="button"
                className="icon-btn"
                onClick={closeModal}
                aria-label="팝업 닫기"
              >
                <X className="icon-sm" />
              </button>
            </div>
            <div className="modal-content choice-modal-body">
              <button type="button" className="choice-btn" onClick={openUploadModal}>
                <Upload className="choice-icon" />
                <span className="choice-label">업로드</span>
                <span className="choice-desc">엑셀 파일로 일괄 등록</span>
                <ChevronRight className="choice-arrow" />
              </button>
              <button type="button" className="choice-btn" onClick={openCreateModal}>
                <PlusCircle className="choice-icon" />
                <span className="choice-label">직접 입력</span>
                <span className="choice-desc">양식에 직접 기업 정보 입력</span>
                <ChevronRight className="choice-arrow" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 엑셀 업로드 모달 */}
      {modalKind === "upload" && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="엑셀 파일 업로드"
        >
          <div className="modal-panel">
            <div className="modal-header">
              <h3>엑셀 파일 업로드</h3>
              <button
                type="button"
                className="icon-btn"
                onClick={closeModal}
                aria-label="팝업 닫기"
              >
                <X className="icon-sm" />
              </button>
            </div>
            <div className="modal-content upload-modal-body">
              {!uploadPreview ? (
                <>
                  <div
                    className="upload-dropzone"
                    role="button"
                    tabIndex={0}
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") fileInputRef.current?.click();
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDropzoneDrop}
                  >
                    <FileSpreadsheet className="upload-icon" />
                    <p className="upload-hint-main">클릭하거나 파일을 드래그하세요</p>
                    <p className="upload-hint-sub">.xlsx, .xls 파일 지원</p>
                    {uploadFile && (
                      <p className="upload-filename">{uploadFile.name}</p>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                  />
                  {uploadError && <p className="upload-error">{uploadError}</p>}
                  <div className="upload-guide">
                    <p className="upload-guide-title">인식 가능한 칼럼명</p>
                    <p className="upload-guide-text">
                      기업명, 사업자번호, 소재지, 대표명, 담당자, 연락처, 이메일, 협약서
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <p className="upload-preview-info">
                    {uploadPreview.length}개 기업이 인식되었습니다. 내용을 확인 후 삽입하세요.
                  </p>
                  <div className="table-wrap upload-preview-table">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>기업명</th>
                          <th>사업자번호</th>
                          <th>소재지</th>
                          <th>대표명</th>
                          <th>담당자</th>
                          <th>연락처</th>
                          <th>이메일</th>
                        </tr>
                      </thead>
                      <tbody>
                        {uploadPreview.map((c) => (
                          <tr key={c.id}>
                            <td>{c.companyName}</td>
                            <td>{c.businessRegNo}</td>
                            <td>{c.location}</td>
                            <td>{c.representative}</td>
                            <td>{c.manager}</td>
                            <td>{c.phone}</td>
                            <td>{c.email}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost upload-reset"
                    onClick={resetUpload}
                  >
                    다시 선택
                  </button>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={closeModal}>
                취소
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!uploadPreview}
                onClick={confirmUpload}
              >
                삽입
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 직접 입력 / 수정 — 사이드 드로어 */}
      {modalKind === "form" && draftCompany && (
        <>
          <div className="drawer-overlay" onClick={closeModal} />
          <div
            className="drawer-panel"
            role="dialog"
            aria-modal="true"
            aria-label="기업 상세 편집"
          >
            <div className="drawer-header">
              <h3>기업 상세 정보</h3>
              <button
                type="button"
                className="icon-btn"
                onClick={closeModal}
                aria-label="닫기"
              >
                <X className="icon-sm" />
              </button>
            </div>

            <div className="drawer-content">
              {/* 기업 기본 정보 — 기업명(full) / 사업자번호+대표명 / 소재지(full) */}
              <div className="form-section">
                <p className="form-section-title">기업 기본 정보</p>
                <div className="form-grid">
                  <label className="field form-full">
                    기업명
                    <input
                      value={draftCompany.companyName}
                      onChange={(e) => updateDraftField("companyName", e.target.value)}
                    />
                  </label>
                  <label className="field">
                    사업자등록번호
                    <input
                      value={draftCompany.businessRegNo}
                      onChange={(e) =>
                        updateDraftField(
                          "businessRegNo",
                          formatBusinessRegNo(e.target.value),
                        )
                      }
                      placeholder="000-00-00000"
                      maxLength={12}
                    />
                  </label>
                  <label className="field">
                    대표명
                    <input
                      value={draftCompany.representative}
                      onChange={(e) => updateDraftField("representative", e.target.value)}
                    />
                  </label>
                  <label className="field form-full">
                    소재지
                    <input
                      value={draftCompany.location}
                      onChange={(e) => updateDraftField("location", e.target.value)}
                    />
                  </label>
                </div>
              </div>

              {/* 담당자 정보 — 담당자+연락처 / 이메일 */}
              <div className="form-section">
                <p className="form-section-title">담당자 정보</p>
                <div className="form-grid">
                  <label className="field">
                    담당자
                    <input
                      value={draftCompany.manager}
                      onChange={(e) => updateDraftField("manager", e.target.value)}
                    />
                  </label>
                  <label className="field">
                    연락처
                    <input
                      value={draftCompany.phone}
                      onChange={(e) => updateDraftField("phone", e.target.value)}
                    />
                  </label>
                  <label className="field form-full">
                    이메일 주소
                    <input
                      type="email"
                      value={draftCompany.email}
                      onChange={(e) => updateDraftField("email", e.target.value)}
                    />
                  </label>
                </div>
              </div>

              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={draftCompany.mouSigned}
                  onChange={(e) => updateDraftField("mouSigned", e.target.checked)}
                />
                협약서 체결 여부
              </label>

              {/* 참여 과정 섹션 (칩 UI) */}
              <section className="participation-box">
                <h4>참여 과정 상세</h4>
                {draftCompany.participations.map((participation, index) => {
                  const catalogOptions = localProgramCatalog[participation.courseType];
                  const lq = programSearch.toLowerCase();

                  const availablePrograms = catalogOptions.filter(
                    (opt) =>
                      !participation.programNames.includes(opt) &&
                      opt.toLowerCase().includes(lq),
                  );

                  const trimmed = programSearch.trim();
                  const showCreate =
                    openDropdownIdx === index &&
                    trimmed !== "" &&
                    !catalogOptions.some(
                      (opt) => opt.toLowerCase() === trimmed.toLowerCase(),
                    );

                  // 이미 선택된 항목 (드롭다운에서 제거 가능)
                  const selectedInSearch = participation.programNames.filter(
                    (name) => lq === "" || name.toLowerCase().includes(lq),
                  );

                  return (
                    <div className="participation-item" key={participation.courseType}>
                      <div className="participation-header">
                        <label className="checkbox-field">
                          <input
                            type="checkbox"
                            checked={participation.enabled}
                            onChange={(e) => {
                              const enabled = e.target.checked;
                              updateParticipation(index, "enabled", enabled);
                              updateParticipation(
                                index,
                                "status",
                                enabled ? "대기" : "미참여",
                              );
                            }}
                          />
                          <span className="participation-course-label">
                            {participation.courseType}
                          </span>
                        </label>
                        <select
                          className="select-field small"
                          value={participation.status}
                          onChange={(e) =>
                            updateParticipation(
                              index,
                              "status",
                              e.target.value as CompanyParticipation["status"],
                            )
                          }
                          disabled={!participation.enabled}
                        >
                          <option value="미참여">미참여</option>
                          <option value="대기">대기</option>
                          <option value="참여중">참여중</option>
                          <option value="완료">완료</option>
                        </select>
                      </div>

                      {/* 세부 과정 칩 입력 */}
                      <div
                        className={`chip-field${!participation.enabled ? " chip-field-disabled" : ""}`}
                        onClick={() => {
                          if (participation.enabled) {
                            setOpenDropdownIdx(index);
                            setProgramSearch("");
                          }
                        }}
                      >
                        {participation.programNames.map((name) => (
                          <span key={name} className="program-chip">
                            {name}
                            <button
                              type="button"
                              className="chip-remove"
                              disabled={!participation.enabled}
                              onClick={(e) => {
                                e.stopPropagation();
                                removeProgram(index, name);
                              }}
                              aria-label={`${name} 제거`}
                            >
                              ×
                            </button>
                          </span>
                        ))}

                        {participation.enabled && (
                          <div className="chip-input-wrap">
                            <input
                              className="chip-search-input"
                              value={openDropdownIdx === index ? programSearch : ""}
                              placeholder={
                                participation.programNames.length === 0
                                  ? "과정 검색 또는 추가..."
                                  : ""
                              }
                              onFocus={() => {
                                setOpenDropdownIdx(index);
                                setProgramSearch("");
                              }}
                              onChange={(e) => setProgramSearch(e.target.value)}
                              onBlur={() =>
                                setTimeout(() => {
                                  setOpenDropdownIdx(null);
                                  setProgramSearch("");
                                }, 150)
                              }
                              onClick={(e) => e.stopPropagation()}
                            />

                            {openDropdownIdx === index && (
                              <div className="chip-dropdown">
                                {/* 이미 선택된 항목 — 클릭 시 제거 */}
                                {selectedInSearch.length > 0 && (
                                  <>
                                    <div className="chip-section-header">선택됨</div>
                                    {selectedInSearch.map((name) => (
                                      <button
                                        key={`sel-${name}`}
                                        type="button"
                                        className="chip-option chip-option-selected"
                                        onMouseDown={() => removeProgram(index, name)}
                                      >
                                        <span>✓ {name}</span>
                                        <span className="chip-option-remove-icon">×</span>
                                      </button>
                                    ))}
                                  </>
                                )}

                                {/* 추가 가능한 항목 */}
                                {availablePrograms.length > 0 && (
                                  <>
                                    <div className="chip-section-header">추가하기</div>
                                    {availablePrograms.map((opt) => (
                                      <button
                                        key={opt}
                                        type="button"
                                        className="chip-option"
                                        onMouseDown={() => addProgram(index, opt)}
                                      >
                                        {opt}
                                      </button>
                                    ))}
                                  </>
                                )}

                                {/* 새 과정 생성 */}
                                {showCreate && (
                                  <button
                                    type="button"
                                    className="chip-option chip-option-create"
                                    onMouseDown={() =>
                                      createAndAddProgram(
                                        index,
                                        participation.courseType,
                                        trimmed,
                                      )
                                    }
                                  >
                                    <span className="chip-create-icon">+</span>
                                    &ldquo;{trimmed}&rdquo; 새 과정 추가하기
                                  </button>
                                )}

                                {selectedInSearch.length === 0 &&
                                  availablePrograms.length === 0 &&
                                  !showCreate && (
                                    <p className="chip-empty">
                                      선택 가능한 과정이 없습니다
                                    </p>
                                  )}
                              </div>
                            )}
                          </div>
                        )}

                        {!participation.enabled &&
                          participation.programNames.length === 0 && (
                            <span className="chip-disabled-hint">
                              과정 활성화 후 세부 과정을 선택하세요
                            </span>
                          )}
                      </div>
                    </div>
                  );
                })}
              </section>
            </div>

            <div className="drawer-footer">
              <button type="button" className="btn btn-secondary" onClick={closeModal}>
                취소
              </button>
              <button type="button" className="btn btn-primary" onClick={saveCompany}>
                저장
              </button>
            </div>
          </div>
        </>
      )}

      {/* 고정 위치 툴팁 */}
      {tooltipInfo && (
        <div
          className="fixed-tooltip"
          style={tooltipInfo.style}
          aria-hidden="true"
        >
          {tooltipInfo.content}
        </div>
      )}
    </>
  );
}
