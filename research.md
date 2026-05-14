# 프로젝트 온보딩 및 아키텍처 가이드 (Research & Architecture)

본 문서는 프로젝트에 새로 합류하는 개발자가 프로젝트의 동작 원리, 폴더 구조, 기술 스택 등을 빠르게 파악할 수 있도록 작성된 상세 가이드입니다. 기존의 기술 리서치 및 결정 사항을 아우르며, 현재 프로젝트의 상태를 대변합니다.

## 1. 기술 스택 (Tech Stack)
- **Frontend Framework:** React 18, TypeScript, Vite
- **State Management:** Zustand (전역 상태 및 데이터 페칭 관리)
- **Styling:** Tailwind CSS v4, PostCSS
- **Backend/Database (BaaS):** Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Data Visualization:** Recharts
- **Icons & UI:** Lucide React, Custom UI Components
- **Utilities:** date-fns (날짜 처리), xlsx (엑셀 파싱 및 추출)

## 2. 시스템 아키텍처 및 동작 원리
이 프로젝트는 기존의 FE/BE 분리(2-Tier) 구조에서 **단일 클라이언트 앱 + Supabase(BaaS)** 구조로 마이그레이션되었습니다. 별도의 백엔드 서버(Node.js) 없이 클라이언트가 데이터베이스 및 인증 서비스와 직접 소통합니다.

### 2.1. 데이터 흐름 (Data Flow)
1. **Zustand Stores (`src/stores/*`)**: 모든 비즈니스 로직과 데이터 페칭은 Zustand 스토어에서 처리됩니다. 
   - 스토어 내에서 `src/api/supabase.ts`에 정의된 클라이언트를 사용하여 데이터베이스(PostgreSQL)에 직접 쿼리를 날립니다.
2. **Realtime Subscription**: Supabase의 Realtime 기능을 적극 활용합니다. Zustand 스토어 내에 `subscribeTo...` 함수들이 정의되어 있으며, 이를 통해 데이터베이스의 변경 사항(`postgres_changes`)을 실시간으로 구독하고, 변경 발생 시 상태를 자동으로 갱신하여 UI에 실시간으로 반영합니다.
3. **Edge Functions**: 클라이언트에서 직접 처리하기 어렵거나 보안이 필요한 작업(예: 대량 이메일 비동기 발송, 외부 SMTP 연동 테스트 등)은 Supabase Edge Functions를 호출(`supabase.functions.invoke`)하여 처리합니다.

### 2.2. 인증 (Authentication)
- Supabase Auth를 사용하며, 이메일/비밀번호 기반의 로그인을 지원합니다.
- 인증 상태는 `useAuthStore`에서 관리되며, 토큰 및 세션 정보는 클라이언트 내부 및 Supabase 세션에 안전하게 유지됩니다.

## 3. 폴더 구조 (Directory Structure)

```text
/
├── .env.example              # 환경 변수 템플릿 (VITE_SUPABASE_URL 등)
├── package.json              # 프론트엔드 의존성 및 스크립트 정의
├── vite.config.ts            # Vite 번들러 설정 (alias `@/` -> `src/` 포함)
├── plan.md                   # 프로젝트 작업 계획 및 진행률
└── src/
    ├── api/                  # 외부 통신 클라이언트 (`supabase.ts`)
    ├── assets/               # 이미지, 아이콘 등 정적 자원
    ├── components/           # 재사용 가능한 UI 컴포넌트
    │   ├── ui/               # 기본 UI 요소 (버튼, 달력, 뱃지 등)
    │   ├── layout/           # 레이아웃 컴포넌트 (Sidebar, TopRail, 모달 등)
    │   └── shared/           # 공통 기능 컴포넌트 (Toast, EmptyState 등)
    ├── constants/            # 전역 상수 선언
    ├── hooks/                # 커스텀 React Hooks (주로 페이지 도메인 내에 배치되기도 함)
    ├── pages/                # 라우트별 메인 뷰 및 도메인 로직
    │   ├── companies/        # 참여 기업 관리 도메인 (모달, Drawer, 훅 분리)
    │   ├── education/        # 교육 과정 관리 도메인
    │   └── participants/     # 참여자 관리 및 단체 이메일 발송 도메인
    ├── stores/               # Zustand 전역 상태 관리 (각 도메인별 API 호출 로직 캡슐화)
    ├── styles/               # 전역 CSS, Tailwind Variables, 애니메이션 설정
    ├── types/                # TypeScript 타입/인터페이스 정의 (`models.ts` 등)
    └── utils/                # 공통 헬퍼 유틸리티 함수 (템플릿 변수 치환 등)
```

## 4. 핵심 도메인 및 기능
- **대시보드 (Dashboard):** `useStatsStore`를 통해 Supabase RPC(`get_dashboard_stats`)를 호출하여 실시간 통계, 참가자 현황, 교육 참여율 등을 차트로 시각화합니다.
- **기업 및 참여자 관리:** CRUD 작업뿐만 아니라 Excel 업로드/다운로드 기능을 제공합니다. 각 도메인 폴더(`src/pages/companies/` 등) 내에 비즈니스 훅(`hooks/`)과 뷰 모달(`modals/`)을 분리하여 SOLID 원칙에 입각한 설계를 유지합니다.
- **이메일 템플릿 및 발송:** `useTemplateStore`에서 이메일 템플릿을 관리하고, Supabase Edge Functions(`send-batch`)를 호출하여 다수의 참여자에게 외부 SMTP(Naver 등)를 경유한 이메일을 백그라운드에서 발송합니다.

## 5. 온보딩 가이드 (신규 합류자 필수 확인 사항)

### 5.1. 로컬 개발 환경 설정
1. **의존성 설치:** 프로젝트 루트에서 `npm install` 실행
2. **환경 변수 설정:** 루트 경로의 `.env.example`을 복사하여 `.env` (또는 `.env.local`)을 생성하고, Supabase 프로젝트 URL과 Anon Key를 입력합니다.
3. **로컬 서버 실행:** `npm run dev` 실행 (기본 포트: 5173)

### 5.2. 개발 규칙 및 컨벤션 (Conventions)
- **컴포넌트 설계:** 모든 새로운 컴포넌트는 `src/components` 또는 각 도메인(`src/pages/[domain]`) 내에 적절히 배치하며, 단일 책임 원칙(SRP)을 준수하도록 로직(Zustand, Custom Hooks)과 뷰를 분리합니다.
- **경로 참조 (Absolute Imports):** 상대 경로(`../../`) 대신 Vite에 설정된 절대 경로 Alias(`@/`)를 적극 활용합니다. (예: `import { Button } from '@/components/ui/Button'`)
- **UI/UX 스탠다드:** 
  - 이모지 대신 `lucide-react` SVG 아이콘을 사용합니다.
  - 인터랙션 요소(Hover, Transition)는 부드럽고 안정적으로 설계하며, 레이아웃 이동(Shift)을 최소화합니다.
  - 숫자가 표시되는 테이블/차트 등에서는 `font-variant-numeric: tabular-nums`를 사용하여 정렬을 유지합니다.

---

# Component Dependency Graph (Archive)

이 섹션은 프로젝트 초기 마이그레이션 과정에서 컴포넌트의 관계와 레거시 청소 내역을 추적하기 위해 사용되었던 기록입니다.

## Workflow: Create -> Track -> Replace -> Remove
1. **Create**: Develop the new component (e.g., `NewComponent.tsx`).
2. **Track**: Add the new and old components to this graph.
3. **Replace**: Update all files using the old component to use the new one.
4. **Remove**: Delete the old component file.

## Component Map

### UI Components
- **ToggleSwitch**
  - Path: `src/components/ui/ToggleSwitch.tsx`
  - Replaced: Manual peer-checked checkbox implementations.
  - Usage: `CompanyDrawer.tsx`, `ParticipantDrawer.tsx`, `AddParticipantModal.tsx`
- **CompletionBadge**
  - Path: `src/components/ui/CompletionBadge.tsx`
  - Usage: `ParticipantDrawer.tsx`, `ParticipantsTable.tsx`
- **StatusBadge**
  - Path: `src/components/ui/StatusBadge.tsx`
  - Usage: `CompanyDrawer.tsx`, `CompanyTable.tsx`, `MOUStatusSection.tsx`
- **CourseTypeBadge**
  - Path: `src/components/ui/CourseTypeBadge.tsx`
  - Usage: `CompanyTable.tsx`

### Shared Components
- **EmptyState**
  - Path: `src/components/shared/EmptyState.tsx`
  - Usage: `CompanyTable.tsx`, `ParticipantsTable.tsx`
- **PageHeader**
  - Path: `src/components/layout/PageHeader.tsx`
  - Usage: All main pages. Now includes centralized action buttons.

### Page Modules (SOLID Refactored)

#### Companies Module
- **Hooks**:
  - `useCompanyFilters`: Filtering logic.
  - `useCompanySort`: Sorting logic.
  - `useCompanySelection`: Selection logic.
  - `useCompanyModals`: Modal orchestration.
  - `useCompanyDrawerState`: Drawer internal state.
  - `useCompanyExcel`: Excel parsing and upload.
  - `useCompanyTooltips`: Table tooltips.
  - `useParticipantPopover`: Participant preview popover.
- **Drawer Sections**:
  - `DrawerHeader`, `BasicInfoSection`, `ManagerInfoSection`, `MOUStatusSection`, `CourseParticipationSection`.

#### Participants Module
- **Hooks**:
  - `useParticipantFilters`: Filtering logic.
  - `useParticipantSelection`: Selection logic.
  - `useParticipantExcel`: Excel parsing and upload.
  - `useCourseManager`: Course management logic.
- **Modals**:
  - `AddParticipantChoiceModal`: Consolidated entry point for adding participants.
  - `AddParticipantModal`: Inline enterprise registration support.
  - `LinkCourseModal`: Synchronized with real-time database courses.
  - `BulkEmailModal`: Multi-recipient email sending via Naver SMTP.

## Completed Migrations (Archive)
- [x] Removed unused `ChartNotes.tsx` component.
- [x] Removed unused `EducationOverview.tsx` legacy page.
- [x] Unify `index.css` and move to `styles/`.
- [x] Refactor `CompanyManagementPage` and `ParticipantsPage` to SOLID architecture.
- [x] Decompose `CompanyDrawer` into modular sections.
- [x] Transition to 3-tier architecture with Express backend -> **(Updated) Transitioned to BaaS with Supabase**.
- [x] Implement Recharts analytics dashboard.
- [x] Replace inline error alerts with professional Toast system.
- [x] Consolidate participant action buttons.
- [x] Secure database with RLS hardening.
- [x] Implement Naver SMTP-based Email Sending System.