# KHP Dashboard 상세 수정 계획

> 기준: Phase 1, Phase 2 설계서 + ui-ux-pro-max 디자인 가이드라인  
> 분석 기준일: 2026-04-24 / 최근 점검일: 2026-04-28

---

## 우선순위 분류

| 우선순위 | 기준 |
|----------|------|
| P0 (Critical) | 기능 버그, 접근성 위반, UX 블로커 |
| P1 (High) | 스펙 미구현, 반응형 이슈, 상태 관리 |
| P2 (Medium) | UI 품질, 애니메이션, 빈 상태 |
| P3 (Low) | 성능 최적화, 코드 리팩터링 |

---

## [NEW] 대대적인 디자인 및 UX 개편 (P0-0)

**현재 상태**: 기존 UI 및 컬러 시스템 일관성에 대한 불만족. `pro-group-header`, `icon-btn-close` 등 CSS 누락으로 인한 기본 스타일(`rgb(240,240,240)`) 표출 문제 확인.
**작업 목표**:
1. UX 관점의 디자인 시스템(컬러, 레이아웃 등) 전면 재설계.
2. 서브 에이전트/전문가 가이드를 통한 피드백 기반 디자인 개편.
3. [x] 누락된 컴포넌트 CSS 확인 및 스타일 적용 (`pro-group-header`, `icon-btn-close` Tailwind 적용 완료).
4. [x] 작업에 필요한 UI 라이브러리 및 패키지 자율 설치 (TailwindCSS 설치 완료).
5. [x] 레이아웃 구조 개편 완료 (Collapsible Sidebar, TopRail, App Shell 등 Tailwind 기반의 Modern & Soft, Emerald 테마 적용 완료).
6. [x] 테이블 및 리스트 UI 개편 완료 (기업 목록, 참여자 목록 테이블에 Tailwind 및 Emerald 테마 적용).
7. [x] 모달 및 드로어 개편 완료 (모든 모달과 드로어에 Modern & Soft 디자인 및 애니메이션 적용).
8. [x] 대시보드 및 공통 UI 컴포넌트(배지, 토글, 빈 상태 등) 개편 완료.
**진행 방식**: 사용자 선호도 조사 후 구체적인 디자인 시스템 수립, 이후 각 단위 작업 완료 시 본 문서 업데이트.

---

## P0 — Critical 수정 사항

### [P0-1] 이모지 아이콘 제거 (`no-emoji-icons` Critical 위반)

**현재 상태(2026-04-28 점검)**: 이모지 제거가 일부 진행되었으나, 아래 파일들에 🟢🔵🟡✅❌📞📧 등 이모지 아이콘이 잔존.

발견된 위치:
- `Participants.tsx` — `COURSE_TYPE_DOT` 상수에서 🟢🔵🟡 과정 타입 구분자
- `Participants.tsx` — `CompletionBadge`에서 `🟢 수료` / `⚪ 미수료`
- `Participants.tsx` — 기업 Popover 내 📞 📧 ✅ ❌ 이모지
- `Participants.tsx` — 드로어 내 고용보험 ✅ ❌ ❓ 표시
- `frontend/src/pages/companies/CompanyDrawer.tsx` — 과정 그룹 구분 이모지 🟢🔵🟡
- `frontend/src/components/DebugMode.tsx` — 디버그 UI 내 이모지

**수정 방법**:

```tsx
// 과정 타입 인디케이터 → SVG 원점 컴포넌트
import { CheckCircle2, Circle, Phone, Mail, CheckCheck, HelpCircle } from "lucide-react";

function CourseTypeDot({ type }: { type: CourseType }) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-block",
        width: 10,
        height: 10,
        borderRadius: "50%",
        background: COURSE_TYPE_COLOR[type],
        flexShrink: 0,
      }}
    />
  );
}

// CompletionBadge → 이모지 제거
function CompletionBadge({ status }: CompletionBadgeProps) {
  const isCompleted = status === "수료";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, ... }}>
      {isCompleted
        ? <CheckCircle2 style={{ width: 12, height: 12 }} aria-hidden="true" />
        : <Circle style={{ width: 12, height: 12 }} aria-hidden="true" />
      }
      {status}
    </span>
  );
}

// 기업 Popover 연락처/이메일
<span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12 }}>
  <Phone style={{ width: 12, height: 12 }} aria-hidden="true" />
  {participant.companyPhone}
</span>

// 고용보험 상태
<span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
  {participant.employmentInsurance === "가입"
    ? <CheckCheck style={{ width: 14, height: 14, color: "#10b981" }} aria-hidden="true" />
    : <HelpCircle style={{ width: 14, height: 14, color: "#94a3b8" }} aria-hidden="true" />
  }
  {participant.employmentInsurance}
</span>
```

---

### [P0-2] 접근성 — focus-visible 누락 요소들

**현재 문제**: 여러 인터랙티브 요소에 `focus-visible` 스타일이 없거나 불완전함.
- `ToggleSwitch` 컴포넌트에 focus-visible 없음
- sub-course 행 — `role="button"`, `tabIndex={0}` 있으나 CSS focus ring 없음
- `.course-tree-group-select`, `.chip-option`, `.choice-btn`에 focus 스타일 없음

**수정 방법**:

```css
/* tables.css 수정 */
.row-clickable:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: -2px;
  position: relative;
  z-index: 1;
}

/* modal.css 추가 */
.course-tree-group-select:focus-visible,
.chip-option:focus-visible,
.choice-btn:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* buttons.css 추가 */
button[role="switch"]:focus-visible {
  outline: 2px solid var(--color-cta);
  outline-offset: 2px;
}
```

---

### [P0-3] 접근성 — aria-label 및 keyboard-nav 누락

**현재 문제**:
- 드로어 그룹 헤더 버튼에 `aria-expanded` 없음
- sub-course 토글 div에 `aria-expanded` 없음
- 드로어 닫기 버튼에 `aria-label` 없음

**수정 방법**:

```tsx
// 드로어 그룹 헤더
<button
  type="button"
  className="drawer-course-group-header"
  onClick={() => toggleDrawerGroup(group.name)}
  aria-expanded={expanded}
  aria-controls={`group-body-${group.id}`}
>

// 드로어 닫기 버튼
<button
  type="button"
  className="icon-btn"
  onClick={closeDrawer}
  aria-label="드로어 닫기"
>
  <ChevronRight className="icon-sm" />
</button>

// sub-course 토글 → div에서 button으로 변경
<button
  type="button"
  style={{ /* 기존 스타일 */ background: "none", border: "none", cursor: "pointer" }}
  onClick={() => toggleSubCourse(subCourseId)}
  aria-expanded={subExpanded}
  aria-controls={`sub-course-body-${subCourseId}`}
>
```

---

### [P0-4] 터치 타겟 크기 미달 (최소 44×44px)

**현재 문제**:
- 체크박스 14px — WCAG 미달
- `.tree-icon-btn` 28×28px — 미달
- `.detail-delete-btn` 26×26px — 미달
- `.section-icon-btn` 28×28px — 미달

**수정 방법**:

```css
/* tables.css */
.company-select-col {
  width: 44px;
  min-width: 44px;
}

.company-select-col input[type="checkbox"],
.data-table th input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

/* modal.css — 패딩으로 터치 영역 44px 확보 */
.tree-icon-btn {
  width: 32px;
  height: 32px;
  padding: 6px;
  box-sizing: content-box;
}

.section-icon-btn {
  width: 32px;
  height: 32px;
  padding: 6px;
  box-sizing: content-box;
}

.detail-delete-btn {
  width: 30px;
  height: 30px;
  padding: 7px;
  box-sizing: content-box;
}
```

---

### [P0-5] 색상 대비 — `--color-text-tertiary` 기준 미달

**현재 상태(2026-04-28 점검)**: `frontend/src/styles/variables.css`에서 `--color-text-tertiary: #475569`로 적용되어 WCAG AA(4.5:1) 기준을 충족함.

**수정 방법**:

```css
/* variables.css */
:root {
  --color-text-tertiary: #475569; /* Slate-600: ~5.5:1 대비 — 기준 충족 */
}
```

---

## P1 — High 수정 사항

### [P1-1] 설계서 스펙 미구현 — Shift+클릭 범위 선택

**설계서 Phase 1 섹션 11-2, Phase 2 섹션 8-2**: "Shift + 클릭 → 마지막 선택 행 ~ 현재 클릭 행까지 범위 선택"

**수정 방법** (CompanyManagementPage.tsx, Participants.tsx 동일 적용):

```tsx
// 상태 추가
const lastSelectedIdRef = useRef<string | null>(null);

// toggleSelect 수정
const toggleSelect = useCallback((id: string, event?: React.MouseEvent) => {
  if (event?.shiftKey && lastSelectedIdRef.current) {
    const ids = filtered.map((p) => p.id);
    const lastIdx = ids.indexOf(lastSelectedIdRef.current);
    const currIdx = ids.indexOf(id);
    if (lastIdx !== -1 && currIdx !== -1) {
      const start = Math.min(lastIdx, currIdx);
      const end = Math.max(lastIdx, currIdx);
      const rangeIds = ids.slice(start, end + 1);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        rangeIds.forEach((rid) => next.add(rid));
        return next;
      });
      return;
    }
  }
  setSelectedIds((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
  lastSelectedIdRef.current = id;
}, [filtered]);

// 체크박스 셀
<td onClick={(e) => { e.stopPropagation(); toggleSelect(p.id, e); }}>
  <input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => {}} />
</td>
```

---

### [P1-2] 설계서 스펙 미구현 — 헤더 체크박스 indeterminate 상태 (Participants.tsx)

**현재 상태(2026-04-28 점검)**: `frontend/src/pages/companies/CompanyManagementPage.tsx`에는 있으나 Participants.tsx 미구현.

**수정 방법**:

```tsx
// Participants.tsx
const selectAllRef = useRef<HTMLInputElement>(null);

useEffect(() => {
  if (selectAllRef.current) {
    const hasPartial = selectedIds.size > 0 && !allFilteredSelected;
    selectAllRef.current.indeterminate = hasPartial;
  }
}, [selectedIds, allFilteredSelected]);

// JSX
<input
  ref={selectAllRef}
  type="checkbox"
  checked={allFilteredSelected}
  onChange={toggleSelectAll}
  aria-label="전체 선택"
/>
```

---

### [P1-3] 설계서 스펙 미구현 — 엑셀 업로드 3-Step 컬럼 매핑

**현재 상태(2026-04-28 점검)**: `frontend/src/pages/companies/modals/UploadModal.tsx`에서 Step 1~3(컬럼 매핑 포함)이 구현되어 있음.

**수정 방법**:

```tsx
// 상태 추가
type UploadStep = 1 | 2 | 3;
const [uploadStep, setUploadStep] = useState<UploadStep>(1);
const [rawRows, setRawRows] = useState<Record<string, unknown>[]>([]);
const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});

const SYSTEM_FIELDS = [
  { key: "companyName", label: "기업명 *" },
  { key: "businessRegNo", label: "사업자번호" },
  { key: "location", label: "소재지" },
  { key: "representative", label: "대표자명" },
  { key: "manager", label: "담당자" },
  { key: "phone", label: "연락처" },
  { key: "email", label: "이메일" },
  { key: "__skip__", label: "건너뛰기" },
];

// Step 2 UI
{uploadStep === 2 && rawRows.length > 0 && (
  <div className="upload-modal-body">
    <h4>컬럼 매핑 확인</h4>
    <p className="upload-hint">각 컬럼을 시스템 필드에 연결하세요.</p>
    {/* 미리보기 테이블 (최대 5행) */}
    <div className="upload-preview-table">
      {Object.keys(rawRows[0]).map((colName) => (
        <div key={colName} style={{ display: "flex", gap: 12, alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--color-border)" }}>
          <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{colName}</span>
          <span style={{ flex: 1, fontSize: 12, color: "var(--color-text-tertiary)" }}>
            {String(rawRows[0][colName] ?? "")}
          </span>
          <select
            className="select-field"
            style={{ width: 140 }}
            value={columnMapping[colName] ?? "__skip__"}
            onChange={(e) =>
              setColumnMapping((prev) => ({ ...prev, [colName]: e.target.value }))
            }
          >
            {SYSTEM_FIELDS.map((f) => (
              <option key={f.key} value={f.key}>{f.label}</option>
            ))}
          </select>
        </div>
      ))}
    </div>
  </div>
)}
```

---

### [P1-4] 설계서 스펙 미구현 — 페이지네이션 (20개/페이지)

**설계서 Phase 1 섹션 4-3, Phase 2 섹션 4-3**: "한 페이지 기본 20개"

**수정 방법**:

```tsx
const PAGE_SIZE = 20;
const [currentPage, setCurrentPage] = useState(1);

const paginated = useMemo(() => {
  const start = (currentPage - 1) * PAGE_SIZE;
  return filtered.slice(start, start + PAGE_SIZE);
}, [filtered, currentPage]);

const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

// 필터 변경 시 페이지 리셋
useEffect(() => { setCurrentPage(1); }, [activeTab, completionFilter, insuranceFilter, searchDebounced]);

// 페이지네이션 UI (테이블 하단)
{totalPages > 1 && (
  <nav
    aria-label="페이지 네비게이션"
    style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: 16, paddingBottom: 24 }}
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
    <span style={{ display: "flex", alignItems: "center", fontSize: 13, padding: "0 12px" }}>
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
```

---

### [P1-5] 반응형 — 1024px 미만 드로어 전체 화면

**설계서 Phase 1 섹션 10**: "1024px 미만: 드로어가 전체 화면 오버레이"

**수정 방법**:

```css
/* responsive.css 추가 */
@media (max-width: 1024px) {
  .drawer-panel {
    width: 100%;
    height: 100dvh;
    max-width: 100%;
  }
}

/* 1024~1279px: 이메일 컬럼 숨김 (Phase 2 섹션 10) */
@media (max-width: 1279px) {
  .participants-email-col {
    display: none;
  }
}
```

```tsx
// Participants.tsx — 이메일 헤더/셀 클래스 추가
<th scope="col" className="participants-email-col">이메일</th>
<td className="participants-email-col">{p.email || "—"}</td>
```

---

### [P1-6] 반응형 — 375px 모바일 테이블 수평 스크롤

**ui-ux-pro-max 규칙**: `horizontal-scroll` — Ensure content fits viewport width

**수정 방법**:

```css
/* responsive.css 수정 */
@media (max-width: 640px) {
  /* 기업 관리: 중요도 낮은 컬럼 숨김 */
  .company-table .col-location,
  .company-table .col-representative {
    display: none;
  }

  /* 참여자 관리: 연락처, 이메일 숨김 */
  .participants-table .col-phone,
  .participants-table .col-email {
    display: none;
  }

  /* 드로어 전체 너비 */
  .drawer-panel {
    width: 100%;
  }

  /* floating action bar */
  .floating-action-bar {
    width: calc(100% - 16px);
    bottom: 12px;
  }
}
```

---

### [P1-7] 전역 상태 관리 (Zustand) 도입

**설계서 Phase 1 섹션 9**: "전역 상태 관리 (Zustand / Context)" 명시.  
현재: 모든 데이터가 각 페이지의 로컬 `useState` — 페이지 이동 시 초기화됨.

**현재 상태(2026-04-28 점검)**: `frontend/package.json`에 `zustand`가 포함되어 있고, `frontend/src/stores/useCompanyStore.ts`, `frontend/src/stores/useParticipantStore.ts` 전역 스토어가 구현되어 있음.

**파일 구조**:
```
frontend/src/stores/
├── useCompanyStore.ts
├── useParticipantStore.ts
└── index.ts
```

```tsx
// frontend/src/stores/useCompanyStore.ts
import { create } from "zustand";
import { initialCompanies } from "../constants";
import type { CompanyRecord } from "../types/models";

interface CompanyStore {
  companies: CompanyRecord[];
  upsertCompany: (company: CompanyRecord) => void;
  deleteCompanies: (ids: string[]) => void;
}

export const useCompanyStore = create<CompanyStore>((set) => ({
  companies: initialCompanies,
  upsertCompany: (company) =>
    set((state) => ({
      companies: state.companies.some((c) => c.id === company.id)
        ? state.companies.map((c) => (c.id === company.id ? company : c))
        : [...state.companies, company],
    })),
  deleteCompanies: (ids) =>
    set((state) => ({
      companies: state.companies.filter((c) => !ids.includes(c.id)),
    })),
}));

// frontend/src/stores/useParticipantStore.ts
import { create } from "zustand";
import { initialParticipants } from "../constants";
import type { ParticipantRecord } from "../types/models";

interface ParticipantStore {
  participants: ParticipantRecord[];
  upsertParticipant: (participant: ParticipantRecord) => void;
  deleteParticipants: (ids: string[]) => void;
}

export const useParticipantStore = create<ParticipantStore>((set) => ({
  participants: initialParticipants,
  upsertParticipant: (participant) =>
    set((state) => ({
      participants: state.participants.some((p) => p.id === participant.id)
        ? state.participants.map((p) => (p.id === participant.id ? participant : p))
        : [...state.participants, participant],
    })),
  deleteParticipants: (ids) =>
    set((state) => ({
      participants: state.participants.filter((p) => !ids.includes(p.id)),
    })),
}));
```

---

## P2 — Medium 수정 사항

### [P2-1] 빈 상태 (Empty State) UI — 설계서 섹션 10

**설계서**: "기업 0개 시 일러스트 + '등록된 기업이 없습니다' + `[+ 기업 추가]` CTA"

**신규 컴포넌트** (`frontend/src/components/EmptyState.tsx`):

```tsx
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <tr>
      <td colSpan={999} style={{ padding: "60px 20px", textAlign: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "var(--color-surface-subtle)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
            aria-hidden="true"
          >
            <Icon style={{ width: 32, height: 32, color: "var(--color-text-tertiary)" }} />
          </div>
          <div style={{ display: "grid", gap: 4 }}>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "var(--color-text-primary)" }}>
              {title}
            </p>
            {description && (
              <p style={{ margin: 0, fontSize: 14, color: "var(--color-text-tertiary)" }}>
                {description}
              </p>
            )}
          </div>
          {action && (
            <button type="button" className="btn btn-primary" onClick={action.onClick}>
              {action.label}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
```

**사용 예시**:
```tsx
// Participants.tsx tbody 내
import { UserX, Search } from "lucide-react";
import { EmptyState } from "../components/EmptyState";

{filtered.length === 0 ? (
  isFiltersActive ? (
    <EmptyState
      icon={Search}
      title="검색 결과가 없습니다"
      description="다른 검색어나 필터 조건을 시도해 보세요."
    />
  ) : (
    <EmptyState
      icon={UserX}
      title="등록된 참여자가 없습니다"
      description="참여자를 추가하여 교육 과정을 관리하세요."
      action={{ label: "+ 참여자 추가", onClick: () => setShowAddModal(true) }}
    />
  )
) : paginated.map(/* 행 렌더링 */)}
```

---

### [P2-2] 애니메이션 — prefers-reduced-motion 미지원

**ui-ux-pro-max 규칙**: `reduced-motion` — Check prefers-reduced-motion

**현재 상태(2026-04-28 점검)**: `frontend/src/styles/animations.css` 및 `frontend/src/styles/modal.css`에 `@media (prefers-reduced-motion: reduce)` 처리가 추가되어 있음.

**수정 방법**:

```css
/* animations.css 끝에 추가 */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* modal.css — 드로어/플로팅바 개별 처리 */
@media (prefers-reduced-motion: reduce) {
  .drawer-panel {
    animation: none;
  }
  .modal-panel {
    animation: none;
  }
  .floating-action-bar {
    transition: none;
  }
}
```

---

### [P2-3] 애니메이션 — 드로어 닫기 출구 애니메이션 없음

**설계서 Phase 1 섹션 5-1**: "우측에서 좌측으로 300ms ease-out"  
**현재 상태**: 입장 애니메이션만 있고 닫기 시 즉시 사라짐.

**수정 방법**:

```tsx
// 드로어 컴포넌트 패턴
const [isClosing, setIsClosing] = useState(false);

function handleClose() {
  setIsClosing(true);
  setTimeout(() => {
    setSelectedParticipant(null); // 실제 상태 클리어
    setIsClosing(false);
  }, 200);
}

// JSX
<div
  className={`drawer-panel${isClosing ? " closing" : ""}`}
  ...
>
```

```css
/* modal.css 추가 */
.drawer-panel.closing {
  animation: slideOutRight 0.2s ease-in forwards;
}

@keyframes slideOutRight {
  from { transform: translateX(0); opacity: 1; }
  to   { transform: translateX(100%); opacity: 0; }
}
```

---

### [P2-4] 드로어 스티키 헤더

**설계서 Phase 1/2 섹션 5-6**: "기업 정보 섹션은 상단 고정 고려 (sticky)"

**수정 방법**:

```css
/* modal.css */
.drawer-panel {
  display: grid;
  grid-template-rows: auto 1fr auto; /* header / content / footer */
}

.drawer-header {
  position: sticky;
  top: 0;
  background: var(--color-surface);
  z-index: 10;
  border-bottom: 1px solid var(--color-border);
}

/* 참여자/기업 정보 첫 섹션 스티키 */
.drawer-content .drawer-section:first-child {
  position: sticky;
  top: 0;
  background: var(--color-surface);
  z-index: 5;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-border-subtle);
  margin-bottom: 0;
}
```

---

### [P2-5] Typography — 모바일 최소 폰트 크기

**ui-ux-pro-max 규칙**: `readable-font-size` — Minimum 16px body text on mobile

**수정 방법**:

```css
/* responsive.css 추가 */
@media (max-width: 640px) {
  .data-table th,
  .data-table td {
    font-size: 13px; /* 12px → 13px */
  }

  .drawer-info-item strong {
    font-size: 14px;
  }

  /* 모바일에서 hover 툴팁 숨김 (hover 불가) */
  .fixed-tooltip {
    display: none;
  }
}
```

---

### [P2-6] z-index 스케일 정리

**ui-ux-pro-max 규칙**: `z-index-management` — Define z-index scale (10, 20, 30, 50)

**현재 문제**: z-index 값이 파일별로 흩어져 있음 (80, 85, 20, 260, 200, 201, 400, 500, 1000).

**수정 방법**:

```css
/* variables.css에 z-index 스케일 추가 */
:root {
  --z-topbar:         20;
  --z-sidebar:        30;
  --z-sidebar-tip:    35;
  --z-floating-bar:   40;
  --z-tooltip:        50;
  --z-modal-backdrop: 100;
  --z-modal:          110;
  --z-drawer-overlay: 120;
  --z-drawer:         130;
  --z-dropdown:       150;
  --z-fixed-tooltip:  160;
  --z-debug:          999;
}
```

각 CSS 파일에서 하드코딩된 z-index를 변수로 교체:
```css
/* 예: tables.css */
.floating-action-bar { z-index: var(--z-floating-bar); }

/* modal.css */
.modal-backdrop      { z-index: var(--z-modal-backdrop); }
.modal-panel         { z-index: var(--z-modal); }
.drawer-overlay      { z-index: var(--z-drawer-overlay); }
.drawer-panel        { z-index: var(--z-drawer); }
```

---

### [P2-7] 로딩 상태 UI — 버튼 비활성화

**ui-ux-pro-max 규칙**: `loading-buttons` — Disable button during async operations

**수정 방법**:

```tsx
// 저장 버튼 공통 패턴
const [isSaving, setIsSaving] = useState(false);

async function handleSave() {
  setIsSaving(true);
  try {
    await apiCall(data); // 실제 API 연결 시
  } finally {
    setIsSaving(false);
  }
}

// JSX
<button
  type="button"
  className="btn btn-primary"
  onClick={handleSave}
  disabled={isSaving}
  aria-disabled={isSaving}
>
  {isSaving ? (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span
        className="spin-icon"
        style={{ width: 14, height: 14, border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }}
        aria-hidden="true"
      />
      저장 중...
    </span>
  ) : "저장"}
</button>
```

---

### [P2-8] 에러 피드백 UI — 필드 근처 표시

**ui-ux-pro-max 규칙**: `error-feedback` — Clear error messages near problem

**수정 방법**:

```tsx
// 공통 폼 유효성 패턴
const [errors, setErrors] = useState<Record<string, string>>({});

function validate() {
  const next: Record<string, string> = {};
  if (!draft.name.trim()) next.name = "이름은 필수 항목입니다.";
  if (!draft.phone.trim()) next.phone = "연락처는 필수 항목입니다.";
  if (draft.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email)) {
    next.email = "올바른 이메일 형식을 입력해 주세요.";
  }
  setErrors(next);
  return Object.keys(next).length === 0;
}

// JSX — 각 필드 아래 에러 메시지
<div className="field">
  <label htmlFor="add-name">이름 *</label>
  <input
    id="add-name"
    type="text"
    value={draft.name}
    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
    aria-invalid={!!errors.name}
    aria-describedby={errors.name ? "err-name" : undefined}
    style={{ borderColor: errors.name ? "var(--color-error)" : undefined }}
  />
  {errors.name && (
    <p id="err-name" role="alert" style={{ margin: "4px 0 0", fontSize: 12, color: "var(--color-error)" }}>
      {errors.name}
    </p>
  )}
</div>
```

---

### [P2-9] Light/Dark Mode — 하드코딩된 배경색 CSS 변수화

**현재 문제**: `modal.css`에서 `#ffffff`, `#f8fafc`가 하드코딩되어 있어 다크 모드 미지원.

**수정 방법**:

```css
/* modal.css — 하드코딩 → CSS 변수 교체 */
.modal-panel {
  background: var(--color-surface);       /* #ffffff → */
}

.drawer-panel {
  background: var(--color-surface);
}

.course-tree-panel {
  background: var(--color-surface-subtle); /* #f8fafc → */
}

/* tables.css */
.data-table thead {
  background: var(--color-surface-subtle); /* #f9fafb → */
}

/* sidebar.css */
.sidebar-flyout {
  background: var(--color-surface);
}
```

---

## P3 — Low 수정 사항

### [P3-1] 번들 크기 최적화 (703KB → 목표 400KB 이하)

**수정 방법**:

```tsx
// App.tsx — 동적 import + Suspense
import { lazy, Suspense } from "react";

const CompanyManagementPage = lazy(() => import("./pages/companies"));
const ParticipantsPage = lazy(() =>
  import("./pages/Participants").then((m) => ({ default: m.ParticipantsPage }))
);
const TemplateEditorPage = lazy(() =>
  import("./pages/TemplateEditor").then((m) => ({ default: m.TemplateEditorPage }))
);

// xlsx 동적 로드
async function handleExportExcel() {
  const XLSX = await import("xlsx");
  const ws = XLSX.utils.json_to_sheet(data);
  // ...
}
```

---

### [P3-2] 기업관리 페이지 파일 분리

**현재 상태(2026-04-28 점검)**: `frontend/src/pages/companies/` 구조로 분리 완료.

**목표 구조**:

```
frontend/src/pages/companies/
├── index.ts
├── CompanyManagementPage.tsx   (~300줄 — 조율 레이어만)
├── CompanyTable.tsx            (테이블 + 필터 + 정렬)
├── CompanyDrawer.tsx           (사이드 드로어)
├── modals/
│   ├── AddCompanyModal.tsx
│   ├── UploadModal.tsx         (3-step 포함)
│   ├── EmailModal.tsx
│   └── CourseManagerModal.tsx
└── hooks/
    ├── useCompanyFilters.ts
    └── useCompanySort.ts
```

---

### [P3-3] 공통 `useDebounce` 훅

**현재 상태(2026-04-28 점검)**: `frontend/src/hooks/useDebounce.ts`가 존재하며, 기업/참여자 검색에 적용되어 있음.

**수정 방법**:

```tsx
// frontend/src/hooks/useDebounce.ts
import { useEffect, useState } from "react";

export function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

// 사용
const searchDebounced = useDebounce(searchTerm, 300);
```

---

## 구현 순서 로드맵

| 단계 | 항목 | 예상 작업량 |
|------|------|------------|
| Step 1 | P0-1~5: 이모지 제거(진행중), focus-visible(부분완료), aria-label(부분완료), 터치 타겟(부분완료), 색상 대비(완료) | 2~3h |
| Step 2 | P1-1~4: Shift+클릭(Participants 미완), indeterminate(Participants 미완), 엑셀 3-step(완료), 페이지네이션(Companies 완료/Participants 불일치) | 4~5h |
| Step 3 | P1-5~7: 반응형(대부분 완료), Zustand 상태 관리 도입(완료) | 3~4h |
| Step 4 | P2-1~4: EmptyState(Companies 완료/Participants 이슈), 애니메이션(완료), 드로어 스티키(완료) | 2~3h |
| Step 5 | P2-5~9: 폰트, z-index(토큰 정의 필요), 로딩버튼, 에러피드백, 다크모드 | 2~3h |
| Step 6 | P3-1~3: 번들 최적화, 파일 분리(완료), useDebounce(완료) | 3~4h |

**총 예상**: 16~22시간

---

## 파일별 수정 목록

### `frontend/src/pages/companies/CompanyManagementPage.tsx`
- [ ] P0-1: 이모지 → SVG (과정 그룹 헤더 🟢🔵🟡 등은 `CompanyDrawer.tsx`에 잔존)
- [x] P1-1: Shift+클릭 범위 선택 (`toggleCompanySelection`에 shiftKey 처리)
- [x] P1-3: 엑셀 업로드 Step 2 컬럼 매핑 UI 구현 (`frontend/src/pages/companies/modals/UploadModal.tsx`)
- [x] P1-4: 페이지네이션 (20개/페이지)
- [ ] P1-9: 기본 정렬 적용 (기업명 가나다순 - 현재 `useCompanySort` 초기값이 null임)
- [ ] P1-10: 전역 상태 동기화 (현재 `companyParticipants`가 로컬 상태임 → `useParticipantStore`와 통합 필요)
- [x] P2-1: EmptyState 컴포넌트 적용 (기업 0개, 검색 결과 0개)
- [x] P2-3: 드로어 닫기 출구 애니메이션 (`isClosing` 상태)
- [ ] P2-7: 저장 버튼 로딩 상태 (`isSaving` — 현재 고정값)
- [ ] P2-8: 폼 유효성 검사 에러 표시
- [ ] P2-10: 기업명 인라인 편집 진입 방식 수정 (현재 `onClick` → 설계서 5-2 기준 `onDoubleClick`)

### `frontend/src/pages/companies/CompanyDrawer.tsx`
- [ ] P0-1: 이모지 → SVG (과정 그룹 헤더 🟢🔵🟡)
- [ ] P0-3: `.drawer-course-group-header` → `aria-expanded`, `aria-controls` 추가
- [x] P0-3: sub-course 토글 → `<button>` + `aria-expanded` 적용됨
- [x] P0-3: 드로어 닫기 버튼 `aria-label` 적용됨

### `frontend/src/pages/Participants.tsx`
- [ ] P0-1: 이모지 → SVG (COURSE_TYPE_DOT, 기업 Popover 내 📞📧✅❌ 등 잔존)
- [x] P0-2: `ToggleSwitch` focus-visible CSS (`frontend/src/styles/buttons.css`) 적용됨
- [x] P0-3: 드로어 닫기 버튼 `aria-label` 적용됨
- [ ] P1-1: Shift+클릭 범위 선택 (미구현)
- [ ] P1-2: 헤더 체크박스 `indeterminate` 상태 (`selectAllRef`) (미구현)
- [ ] P1-4: 페이지네이션 버그 수정 (현재 `filtered.map`으로 렌더링되어 전체 리스트가 보임 → `paginated.map`으로 수정 필요)
- [ ] P1-8: 테이블 정렬 기능 구현 (이름, 소속 기업, 직위 등 - 설계서 4-3 기준 이름 가나다순 기본 정렬)
- [ ] P2-1: EmptyState 컴포넌트 적용 (현재 tbody 내 중첩 렌더 구조 이슈)
- [x] P2-3: 드로어 닫기 출구 애니메이션 (`isClosing` + `.drawer-panel.closing`) 적용됨
- [ ] P2-7: 등록/저장 버튼 로딩 상태
- [ ] P2-8: 폼 유효성 검사 에러 표시
- [ ] P3-4: 파일 분리 (`CompanyManagementPage`와 동일하게 Table, Drawer, Hooks 등으로 분리)

### `frontend/src/styles/variables.css`
- [x] P0-5: `--color-text-tertiary: #475569`
- [ ] P2-6: z-index 스케일 변수 (`--z-topbar`, `--z-modal` 등)

### `frontend/src/styles/tables.css`
- [x] P0-2: `.row-clickable:focus-visible` 적용됨
- [ ] P0-4: 체크박스 터치 타겟 (회사 테이블은 CSS 반영됨 / 참여자 테이블은 inline style로 덮여 미완)
- [x] P2-6: 플로팅 바 z-index가 `var(--z-floating-bar)` 참조로 변경됨(단, `--z-*` 토큰 정의는 별도 필요)

### `frontend/src/styles/modal.css`
- [ ] P0-2: `.course-tree-group-select:focus-visible`, `.chip-option:focus-visible` 추가
- [ ] P0-4: `.tree-icon-btn`, `.section-icon-btn` 터치 타겟 확대 (현재 28x28)
- [x] P0-4: `.detail-delete-btn` 터치 타겟 확대 반영됨
- [x] P2-3: `.drawer-panel.closing` + `@keyframes slideOutRight` 적용됨
- [x] P2-4: 드로어 헤더 sticky + grid-template-rows 적용됨
- [ ] P2-6: z-index 하드코딩 → CSS 변수 교체
- [ ] P2-9: `#ffffff`, `#f8fafc` → `var(--color-surface)`, `var(--color-surface-subtle)`

### `frontend/src/styles/animations.css`
- [x] P2-2: `@media (prefers-reduced-motion: reduce)` 추가

### `frontend/src/styles/responsive.css`
- [x] P1-5: 1024px 미만 드로어 전체 화면
- [x] P1-5: 1024~1279px 이메일 컬럼 숨김 (CSS는 적용됨 — Participants 마크업 클래스 적용은 점검 필요)
- [x] P1-6: 640px 이하 테이블 컬럼 선택적 숨김
- [ ] P2-5: 640px 이하 최소 폰트 13~14px

### `frontend/src/styles/buttons.css`
- [x] P0-2: `button[role="switch"]:focus-visible` 추가

### 신규 파일 생성
- [x] `frontend/src/components/EmptyState.tsx` (P2-1)
- [x] `frontend/src/stores/useCompanyStore.ts` (P1-7)
- [x] `frontend/src/stores/useParticipantStore.ts` (P1-7)
- [x] `frontend/src/hooks/useDebounce.ts` (P3-3)

---

## PhaseDocs 설계서 대비 추가 점검 결과 (2026-04-28)

아래 항목들은 PhaseDocs(Phase 1/2) 설계서에 명시되어 있으나, 현재 코드 기준으로 **미구현 또는 스펙 불일치**로 확인되어 `plan.md`에 보완 트래킹이 필요함.

- **(Phase 2) 플로팅 액션바 기능**: `이메일 발송`, `내보내기`가 현재 “준비 중” 토스트로 대체되어 있음.
- **(Phase 2) 전체 선택 범위**: 헤더 체크박스가 “현재 페이지 20개”가 아니라 `filtered` 전체를 선택/해제하는 동작으로 스펙과 불일치.
- **(Phase 2) 페이지네이션 적용**: `paginated`를 계산하지만 tbody 렌더가 `filtered` 기준으로 렌더되어 페이지네이션이 실효되지 않음.
- **(Phase 2) Shift+클릭 범위 선택 / indeterminate**: 설계서 규칙(8-2) 대비 미구현.
- **(Phase 2) 1024~1279px 컬럼 숨김**: 설계서는 이메일 컬럼 숨김인데, 현재 마크업 클래스 적용으로 연락처까지 숨길 가능성이 있음.
- **(Phase 1) 기업 검색 범위**: 설계서는 “기업명(사업자번호), 담당자, 이메일”인데 현재 검색 필드/필터가 사업자번호를 포함하지 않음.
- **(Phase 1) 기본 정렬**: 설계서는 기업명 가나다순 기본 정렬인데, 현재 정렬 상태 초기값이 비활성화되어 있음.
- **(Phase 1) 기업명 편집 진입**: 설계서는 “더블 클릭”인데, 현재는 클릭으로 편집 모드 진입.

---

## ui-ux-pro-max Pre-Delivery Checklist

### Visual Quality
- [ ] No emojis used as icons → **P0-1에서 해결** (🟢🔵🟡✅❌📞📧 다수 사용 중)
- [ ] All icons from Lucide React → P0-1과 동시에 해결
- [ ] Hover states don't cause layout shift → `transform: scale` 없음, 양호
- [ ] Use `var()` colors not hardcoded hex → P2-9에서 해결

### Interaction
- [ ] All clickable elements have `cursor-pointer` → sub-course div 확인 필요
- [ ] Hover states provide visual feedback → 양호
- [ ] Transitions 150~300ms → `.btn: 0.15s`, 드로어: 0.25s → 양호
- [ ] Focus states visible → **P0-2에서 해결 필요** (ToggleSwitch 등 누락)

### Light/Dark Mode
- [x] Light mode text contrast 4.5:1 → `--color-text-tertiary` 조정으로 기준 충족
- [ ] Borders visible in both modes → `var(--color-border)` 사용, 양호
- [ ] Hardcoded colors → **P2-9에서 해결**

### Layout
- [ ] Floating elements proper spacing → `.floating-action-bar: bottom: 20px`, 양호
- [ ] Responsive at 375px, 768px, 1024px, 1440px → **P1-5, P1-6에서 해결 필요**
- [ ] No horizontal scroll on mobile → **P1-6에서 해결 필요**

### Accessibility
- [ ] SVG icons with `aria-hidden="true"` → P0-1과 동시에
- [ ] Form inputs have `<label for>` → `modal.css .field label` 있음, 연결 확인
- [ ] Color not only indicator → 수료 상태: 색상+텍스트 → 양호
- [x] `prefers-reduced-motion` respected → `animations.css`/`modal.css`에 대응 추가됨
