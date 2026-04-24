# KHP Dashboard 상세 수정 계획

> 기준: Phase 1, Phase 2 설계서 + ui-ux-pro-max 디자인 가이드라인  
> 분석 기준일: 2026-04-24

---

## 우선순위 분류

| 우선순위 | 기준 |
|----------|------|
| P0 (Critical) | 기능 버그, 접근성 위반, UX 블로커 |
| P1 (High) | 스펙 미구현, 반응형 이슈, 상태 관리 |
| P2 (Medium) | UI 품질, 애니메이션, 빈 상태 |
| P3 (Low) | 성능 최적화, 코드 리팩터링 |

---

## P0 — Critical 수정 사항

### [P0-1] 이모지 아이콘 제거 (`no-emoji-icons` Critical 위반)

**현재 문제**: `Participants.tsx`와 `CompanyManagement.tsx` 전반에서 이모지가 UI 아이콘으로 사용.

발견된 위치:
- `Participants.tsx` — `COURSE_TYPE_DOT` 상수에서 🟢🔵🟡 과정 타입 구분자
- `Participants.tsx` — `CompletionBadge`에서 `🟢 수료` / `⚪ 미수료`
- `Participants.tsx` — 기업 Popover 내 📞 📧 ✅ ❌ 이모지
- `Participants.tsx` — 드로어 내 고용보험 ✅ ❌ ❓ 표시
- `CompanyManagement.tsx` — 과정 그룹 구분 이모지 🟢🔵🟡
- `CompanyManagement.tsx` — Participant Popover 내 📧

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

**현재 문제**: `--color-text-tertiary: #64748b` (Slate-500) — 흰 배경 대비 약 4.1:1 → WCAG AA 4.5:1 미달.

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

**수정 방법** (CompanyManagement.tsx, Participants.tsx 동일 적용):

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

**현재 상태**: CompanyManagement.tsx에는 있으나 Participants.tsx 미구현.

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

**현재 상태**: Step 1(파일 업로드) + Step 3(확인)만 있음. **Step 2 컬럼 매핑 누락**.

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

**설치**:
```bash
npm install zustand
```

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

const CompanyManagementPage = lazy(() =>
  import("./pages/CompanyManagement").then((m) => ({ default: m.CompanyManagementPage }))
);
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

### [P3-2] CompanyManagement.tsx 파일 분리 (3,600줄)

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

**현재 상태**: 각 페이지에서 debounce를 개별 구현 중.

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
| Step 1 | P0-1~5: 이모지 제거, focus-visible, aria-label, 터치 타겟, 색상 대비 | 2~3h |
| Step 2 | P1-1~4: Shift+클릭, indeterminate, 엑셀 3-step, 페이지네이션 | 4~5h |
| Step 3 | P1-5~7: 반응형, Zustand 상태 관리 도입 | 3~4h |
| Step 4 | P2-1~4: EmptyState, 애니메이션, 드로어 스티키 | 2~3h |
| Step 5 | P2-5~9: 폰트, z-index, 로딩버튼, 에러피드백, 다크모드 | 2~3h |
| Step 6 | P3-1~3: 번들 최적화, 파일 분리, useDebounce | 3~4h |

**총 예상**: 16~22시간

---

## 파일별 수정 목록

### `frontend/src/pages/CompanyManagement.tsx`
- [ ] P0-1: 이모지 → SVG (과정 그룹 헤더 🟢🔵🟡, Popover 내 📧)
- [ ] P0-3: `.drawer-course-group-header` → `aria-expanded`, `aria-controls` 추가
- [ ] P0-3: sub-course 토글 div → `<button>` + `aria-expanded` 교체
- [ ] P0-3: 드로어 닫기 버튼 `aria-label="드로어 닫기"` 추가
- [ ] P1-1: Shift+클릭 범위 선택 (`lastSelectedIdRef`)
- [ ] P1-3: 엑셀 업로드 Step 2 컬럼 매핑 UI 구현
- [ ] P1-4: 페이지네이션 (20개/페이지)
- [ ] P2-1: EmptyState 컴포넌트 적용 (기업 0개, 검색 결과 0개)
- [ ] P2-3: 드로어 닫기 출구 애니메이션 (`isClosing` 상태)
- [ ] P2-7: 저장 버튼 로딩 상태 (`isSaving`)
- [ ] P2-8: 폼 유효성 검사 에러 표시

### `frontend/src/pages/Participants.tsx`
- [ ] P0-1: 이모지 → SVG (CompletionBadge, CompanyPopover, 고용보험 표시, 과정 타입 헤더)
- [ ] P0-2: `ToggleSwitch` focus-visible CSS 추가
- [ ] P0-3: 드로어 닫기 버튼 `aria-label` 추가
- [ ] P1-1: Shift+클릭 범위 선택
- [ ] P1-2: 헤더 체크박스 `indeterminate` 상태 (`selectAllRef`)
- [ ] P1-4: 페이지네이션
- [ ] P2-1: EmptyState 컴포넌트 적용
- [ ] P2-3: 드로어 닫기 출구 애니메이션
- [ ] P2-7: 등록/저장 버튼 로딩 상태
- [ ] P2-8: 폼 유효성 검사 에러 표시

### `frontend/src/styles/variables.css`
- [ ] P0-5: `--color-text-tertiary: #475569`
- [ ] P2-6: z-index 스케일 변수 (`--z-topbar`, `--z-modal` 등)

### `frontend/src/styles/tables.css`
- [ ] P0-2: `.row-clickable:focus-visible` 강화
- [ ] P0-4: 체크박스 터치 타겟 (18px + td 패딩)
- [ ] P2-6: `z-index: 260` → `var(--z-floating-bar)` 교체

### `frontend/src/styles/modal.css`
- [ ] P0-2: `.course-tree-group-select:focus-visible`, `.chip-option:focus-visible` 추가
- [ ] P0-4: `.tree-icon-btn`, `.section-icon-btn`, `.detail-delete-btn` 패딩 확대
- [ ] P2-3: `.drawer-panel.closing` + `@keyframes slideOutRight`
- [ ] P2-4: 드로어 헤더 sticky + grid-template-rows
- [ ] P2-6: z-index 하드코딩 → CSS 변수 교체
- [ ] P2-9: `#ffffff`, `#f8fafc` → `var(--color-surface)`, `var(--color-surface-subtle)`

### `frontend/src/styles/animations.css`
- [ ] P2-2: `@media (prefers-reduced-motion: reduce)` 추가

### `frontend/src/styles/responsive.css`
- [ ] P1-5: 1024px 미만 드로어 전체 화면
- [ ] P1-5: 1024~1279px 이메일 컬럼 숨김
- [ ] P1-6: 640px 이하 테이블 컬럼 선택적 숨김
- [ ] P2-5: 640px 이하 최소 폰트 13~14px

### `frontend/src/styles/buttons.css`
- [ ] P0-2: `button[role="switch"]:focus-visible` 추가

### 신규 파일 생성
- [ ] `frontend/src/components/EmptyState.tsx` (P2-1)
- [ ] `frontend/src/stores/useCompanyStore.ts` (P1-7)
- [ ] `frontend/src/stores/useParticipantStore.ts` (P1-7)
- [ ] `frontend/src/hooks/useDebounce.ts` (P3-3)

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
- [ ] Light mode text contrast 4.5:1 → **P0-5에서 해결 필요** (`#64748b` 미달)
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
- [ ] `prefers-reduced-motion` respected → **P2-2에서 해결 필요**
