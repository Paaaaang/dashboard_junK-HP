# KHP Dashboard 상세 수정 계획

> 기준: Phase 1, Phase 2 설계서 + ui-ux-pro-max 디자인 가이드라인  
> 분석 기준일: 2026-04-24 / 최근 점검일: 2026-04-29

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

**현재 상태**: 기존 UI 및 컬러 시스템 일관성에 대한 불만족 해결 완료. Modern & Soft, Emerald 테마 전면 적용.
**작업 목표**:
1. [x] UX 관점의 디자인 시스템(컬러, 레이아웃 등) 전면 재설계.
2. [x] 서브 에이전트/전문가 가이드를 통한 피드백 기반 디자인 개편.
3. [x] 누락된 컴포넌트 CSS 확인 및 스타일 적용.
4. [x] TailwindCSS 기반의 Modern & Soft 디자인 시스템 구축 완료.
5. [x] 레이아웃 구조 개편 완료 (Collapsible Sidebar, TopRail, App Shell).
6. [x] 테이블 및 리스트 UI 개편 완료.
7. [x] 모달 및 드로어 개편 완료 (애니메이션 포함).
8. [x] 대시보드 및 공통 UI 컴포넌트 개편 완료.

---

## [NEW] 데이터베이스 설계 및 MCP 통합 (P1-11)

**현재 상태**: Supabase 기반 관계형 데이터베이스 스키마 구축 완료. MCP 연결을 통해 테이블 생성 완료.
**작업 목표**:
1. [x] Supabase 기반 관계형 데이터베이스 스키마 구축.
2. [ ] RLS(Row Level Security) 정책 설정을 통한 보안 강화.
3. [ ] 백엔드(Express)와 Supabase 클라이언트 연동.
4. [ ] Zustand 스토어를 API 연동 방식으로 전환.

### 데이터베이스 스키마 설계 (PostgreSQL) - **반영 완료**

```sql
-- 1. 기업 테이블
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  business_reg_no TEXT UNIQUE,
  location TEXT,
  representative TEXT,
  manager TEXT,
  phone TEXT,
  email TEXT,
  mou_signed BOOLEAN DEFAULT false,
  mou_signed_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. 과정 그룹 테이블 (훈련비, 지원비, 세미나 등)
CREATE TABLE course_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT
);

-- 3. 세부 과정 테이블 (프로그램)
CREATE TABLE sub_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES course_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  total_hours INTEGER,
  target_outcome INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. 참여자 테이블
CREATE TABLE participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  position TEXT,
  phone TEXT,
  email TEXT,
  employment_insurance TEXT CHECK (employment_insurance IN ('가입', '미가입', '미확인')),
  work_experience TEXT,
  document_skill TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. 수강 이력 테이블 (N:M 관계 해소)
CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
  sub_course_id UUID REFERENCES sub_courses(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('수료', '미수료')) DEFAULT '미수료',
  completion_date DATE,
  certificate_no TEXT,
  application_date DATE DEFAULT CURRENT_DATE,
  UNIQUE(participant_id, sub_course_id)
);
```

### 향후 구현 단계
1. **Migration**: Supabase MCP 도구를 사용하여 위 스키마를 실제 데이터베이스에 적용.
2. **Seed Data**: 기존 Mock 데이터를 SQL Insert 문으로 변환하여 초기 데이터 구축.
3. **API Logic**: `backend/src/api`에 Supabase Client를 연동하고 CRUD 라우트 구현.
4. **Frontend Sync**: `stores/` 내의 fetch logic을 실제 API 호출로 대체.

---

## P0 — Critical 수정 사항

### [P0-1] 이모지 아이콘 제거 (`no-emoji-icons` Critical 위반)

**현재 상태(2026-04-29 점검)**: 완료됨. 모든 이모지 아이콘이 SVG(Lucide)로 교체됨.

---

### [P0-2] 접근성 — focus-visible 누락 요소들

**현재 상태**: 완료됨. 모든 인터랙티브 요소에 `focus-visible` 스타일 적용됨.

---

### [P0-3] 접근성 — aria-label 및 keyboard-nav 누락

**현재 상태**: 완료됨. 드로어, 모달, 버튼 등에 `aria-label`, `aria-expanded` 등 속성 보완 완료.

---

### [P0-4] 터치 타겟 크기 미달 (최소 44×44px)

**현재 상태**: 완료됨. 체크박스 및 아이콘 버튼들의 터치 영역 44px 이상 확보 완료.

---

### [P0-5] 색상 대비 — `--color-text-tertiary` 기준 미달

**현재 상태(2026-04-29 점검)**: 완료됨.

---

## P1 — High 수정 사항

### [P1-1] 설계서 스펙 미구현 — Shift+클릭 범위 선택

**현재 상태**: 완료됨. (Companies, Participants 모두 적용)

---

### [P1-2] 설계서 스펙 미구현 — 헤더 체크박스 indeterminate 상태 (Participants.tsx)

**현재 상태**: 완료됨.

---

### [P1-3] 설계서 스펙 미구현 — 엑셀 업로드 3-Step 컬럼 매핑

**현재 상태**: 완료됨. 컬럼 매핑 UI 및 미리보기 기능 구현 완료.

---

### [P1-4] 설계서 스펙 미구현 — 페이지네이션 (20개/페이지)

**현재 상태**: 완료됨.

---

### [P1-5] 반응형 — 1024px 미만 드로어 전체 화면

**현재 상태**: 완료됨.

---

### [P1-6] 반응형 — 375px 모바일 테이블 수평 스크롤

**현재 상태**: 완료됨. 컬럼 선택적 숨김 적용.

---

### [P1-7] 전역 상태 관리 (Zustand) 도입

**현재 상태**: 완료됨. `useCompanyStore`, `useParticipantStore`를 통한 통합 관리.

---

### [P1-9] 기본 정렬 적용

**현재 상태**: 완료됨. 기업명/이름 가나다순 기본 정렬 적용.

---

### [P1-10] 전역 상태 동기화

**현재 상태**: 완료됨. 기업 관리의 참여자 데이터를 전역 참여자 스토어와 연동 완료.

---

## P2 — Medium 수정 사항

### [P2-1] 빈 상태 (Empty State) UI — 설계서 섹션 10

**현재 상태**: 완료됨.

---

### [P2-2] 애니메이션 — prefers-reduced-motion 미지원

**현재 상태**: 완료됨.

---

### [P2-3] 애니메이션 — 드로어 닫기 출구 애니메이션 없음

**현재 상태**: 완료됨.

---

### [P2-4] 드로어 스티키 헤더

**현재 상태**: 완료됨.

---

### [P2-6] z-index 스케일 정리

**현재 상태**: 완료됨. `variables.css` 정의 및 참조 완료.

---

### [P2-7] 로딩 상태 UI — 버튼 비활성화

**현재 상태**: 완료됨. 저장/업로드 시 로딩 표시 및 버튼 비활성화 적용.

---

### [P2-8] 에러 피드백 UI — 필드 근처 표시

**현재 상태**: 완료됨. 유효성 검사 및 토스트 피드백 강화.

---

### [P2-9] Light/Dark Mode — 하드코딩된 배경색 CSS 변수화

**현재 상태**: 완료됨.

---

## P3 — Low 수정 사항

### [P3-1] 번들 크기 최적화 (703KB → 목표 400KB 이하)

**현재 상태**: 진행중. 페이지 lazy loading 및 라이브러리 동기 임포트 최적화.

---

### [P3-2] 기업관리 페이지 파일 분리

**현재 상태**: 완료됨.

---

### [P3-3] 공통 `useDebounce` 훅

**현재 상태**: 완료됨.

---

### [P3-4] 참여자 관리 페이지 파일 분리

**현재 상태**: 완료됨. Hooks, Table, Drawer, Index로 분리 완료.

---

## 파일별 수정 목록

### `frontend/src/pages/companies/CompanyManagementPage.tsx`
- [x] P1-1: Shift+클릭 범위 선택
- [x] P1-3: 엑셀 업로드 Step 2 컬럼 매핑 UI 구현
- [x] P1-4: 페이지네이션 (20개/페이지)
- [x] P1-9: 기본 정렬 적용 (기업명 가나다순)
- [x] P1-10: 전역 상태 동기화
- [x] P2-1: EmptyState 컴포넌트 적용
- [x] P2-3: 드로어 닫기 출구 애니메이션
- [x] P2-7: 저장 버튼 로딩 상태
- [x] P2-8: 폼 유효성 검사 에러 표시

### `frontend/src/pages/participants/ParticipantsPage.tsx`
- [x] P0-1: 이모지 → SVG
- [x] P0-3: 드로어 닫기 버튼 `aria-label`
- [x] P1-1: Shift+클릭 범위 선택
- [x] P1-2: 헤더 체크박스 `indeterminate` 상태
- [x] P1-4: 페이지네이션 버그 수정
- [x] P1-8: 테이블 정렬 기능 구현 (이름 가나다순 기본 정렬)
- [x] P2-1: EmptyState 컴포넌트 적용
- [x] P2-3: 드로어 닫기 출구 애니메이션
- [x] P2-7: 등록/저장 버튼 로딩 상태
- [x] P2-8: 폼 유효성 검사 에러 표시
- [x] P3-4: 파일 분리 완료
