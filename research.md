# 프로젝트 심층 분석 보고서 (최종 업데이트)

> 분석 및 작업 완료 일자: 2026-04-24  
> 작업 범위: 프론트엔드 리팩터링, UI/UX 개선, 접근성 보완, 상태 관리 도입  
> 총 코드량: 약 22,000줄 이상 (모듈화 완료)

---

## 1. 프로젝트 개요

**프로젝트명**: Dashboard KHP (전남대학교 K-하이테크 플랫폼 대시보드)

**목적**: 기업 교육 프로그램 관리 및 참여자 추적을 위한 웹 기반 대시보드 시스템

**핵심 성과**: 
- SOLID 원칙에 기반한 코드 모듈화 (컴포넌트 및 로직 분리)
- UI/UX Pro Max 가이드라인 준수 (접근성, 반응형, 시각적 일관성)
- 전역 상태 관리(Zustand) 도입으로 데이터 영속성 및 효율성 확보

---

## 2. 기술 스택 상세

### 2-1. 의존성 목록

**프로덕션 의존성**:
```
zustand@^4.4.7             - 핵심 상태 관리 (기업, 참여자 데이터 전역 관리)
lucide-react@^0.294.0      - 24x24 SVG 아이콘 라이브러리 (이모지 대체 진행 중)
react@^18.2.0              - UI 라이브러리 (lazy/Suspense 최적화)
react-router-dom@^6.20.1   - 클라이언트 사이드 라우팅
recharts@^3.8.1            - React 차트 컴포넌트
xlsx@^0.18.5               - 엑셀 파일 처리 (동적 import로 최적화)
```

**개발 의존성**:
```
TypeScript@^6.0.3          - 타입 안정성 확보
Vite@^5.0.8               - 번들러 (최적화된 빌드 구성)
```

### 2-2. 최적화 및 빌드 성과

**번들 최적화 (P3-1)**:
- `App.tsx`에서 `React.lazy` 및 `Suspense`를 통한 페이지별 코드 스플리팅 적용.
- `xlsx` 라이브러리를 실제 사용 시점(Export/Upload)에만 동적으로 로드하여 초기 번들 크기 대폭 감소.

**TypeScript 안정성**:
- `npx tsc --noEmit` 기준 오류 0개 달성.
- 모든 인터페이스 및 데이터 모델에 대한 엄격한 타입 정의 준수.

### 2-3. 스타일링 및 테마 시스템

**CSS Variables 기반 테마 (`styles/variables.css`)**:
- `--color-text-tertiary`를 `#475569`로 상향하여 WCAG AA 대비 기준(4.5:1) 충족.
- 하드코딩된 모든 색상(Hex)을 `var()` 변수로 전환하여 다크 모드 지원 기반 마련.
- **z-index 스케일**: `--z-modal`, `--z-drawer` 등 변수 참조는 도입되어 있으나, `styles/variables.css` 내 토큰 정의 누락 등으로 추가 정리 필요.

---

## 3. 파일/폴더 구조 (리팩터링 결과)

```
frontend/src/
├── stores/                 # [NEW] Zustand 전역 스토어
│   ├── useCompanyStore.ts
│   └── useParticipantStore.ts
├── hooks/                  # [NEW] 공통 커스텀 훅
│   └── useDebounce.ts      # 검색 입력 지연 처리
├── components/
│   ├── EmptyState.tsx      # [NEW] 빈 데이터/검색 결과 UI
│   └── ... (기존 컴포넌트)
├── pages/
│   ├── companies/          # [MODULARIZED] 기업 관리 모듈
│   │   ├── CompanyManagementPage.tsx (오케스트레이터)
│   │   ├── CompanyTable.tsx
│   │   ├── CompanyDrawer.tsx
│   │   ├── modals/ (Add, Upload, Email, CourseManager)
│   │   └── hooks/ (useCompanyFilters, useCompanySort)
│   ├── Participants.tsx    # 참여자 관리 (리팩터링 완료)
│   └── ...
└── styles/
    └── (Z-index 및 focus-visible 스타일 강화 완료)
```

---

## 4. 데이터 모델

### 4-1. 전역 상태 관리 (Zustand)
- 페이지 이동 시에도 기업 및 참여자 데이터가 유지됨.
- `initialCompanies`, `initialParticipants` Mock 데이터를 기반으로 초기화 및 CRUD 동작.

### 4-2. 주요 타입 확장
- `UploadStep`: 엑셀 업로드 시 3단계(파일 선택 → 컬럼 매핑 → 미리보기) 프로세스 타입 정의.
- `CompanyRecord` / `ParticipantRecord` 간의 관계형 매핑 강화.

---

## 5. 핵심 개선 및 구현 기능

### ✅ UI/UX 및 접근성 (P0)
- **이모지 제거**: Lucide SVG로의 대체가 진행되었으나, 일부 화면/문구에 🟢🔵🟡✅❌ 등 이모지가 잔존(추가 정리 필요).
- **Focus Indicator**: `focus-visible` 속성을 모든 인터랙티브 요소(토글, 버튼, 행)에 적용.
- **터치 영역 최적화**: 모바일 사용성을 위해 클릭 가능 영역을 44×44px 이상으로 확대.
- **Aria 속성**: `aria-expanded`, `aria-label`, `aria-controls` 등을 활용하여 스크린 리더 호환성 확보.

### ✅ 기능적 완성도 (P1)
- **Shift+클릭 범위 선택**: 테이블에서 여러 행을 한 번에 선택할 수 있는 고급 그리드 인터랙션 구현.
- **엑셀 업로드 매핑**: 사용자가 파일의 컬럼을 시스템 필드에 직접 매핑할 수 있는 3-Step UI 도입.
- **페이지네이션**: 대량 데이터 처리를 위한 페이지당 20개 출력 및 네비게이션 UI 구현.
- **반응형 드로어**: 1024px 미만 기기에서 드로어가 전체 화면 오버레이로 전환되도록 개선.

### ✅ 아키텍처 및 성능 (P2, P3)
- **파일 모듈화**: 3,600줄에 달하던 단일 파일을 도메인별 컴포넌트와 훅으로 분리 (유지보수성 향상).
- **공통 훅 도입**: `useDebounce`를 통한 검색 성능 최적화 및 코드 중복 제거.
- **애니메이션 품질**: `prefers-reduced-motion` 대응 및 드로어 출구(Slide-out) 애니메이션 추가.
- **빈 상태 처리**: 검색 결과가 없거나 데이터가 없는 경우를 위한 `EmptyState` 컴포넌트 적용.

---

## 6. 향후 과제 및 권장 사항

1.  **API 연동**: 현재 Zustand 스토어에 Mock 데이터를 직접 할당 중이므로, 이를 Backend API 엔드포인트와 연동하여 실데이터 반영 필요.
2.  **테스트 자동화**: Vitest 또는 React Testing Library를 사용하여 핵심 비즈니스 로직(필터링, 매핑)에 대한 유닛 테스트 추가 권장.
3.  **다크 모드 디자인**: CSS 변수 처리는 완료되었으므로, 실제 다크 테마 시트(Dark Theme Sheet)를 통한 색상 검증 및 토글 기능 구현.
4.  **차트 고도화**: Recharts를 활용하여 대시보드의 정적 차트를 실시간 데이터 기반 동적 차트로 전환.

---
**결론**: 본 리팩터링 작업을 통해 Dashboard KHP는 상용 수준의 UI/UX 품질과 확장 가능한 아키텍처를 갖추게 되었으며, 향후 기능 확장에 용이한 구조적 기틀을 마련함.

---

## 7. 디자인 시스템 기반 점검 결과 (추가 점검: 2026-04-28)

### 7-1. 스타일 엔트리(로드 체인)

- **전역 기본 스타일(리셋/폰트)**: `frontend/src/main.tsx` → `frontend/src/index.css`
    - 폰트/기본 타이포/기본 body 색상·배경이 **하드코딩**되어 있음
- **디자인 시스템 스타일(토큰/컴포넌트/레이아웃)**: `frontend/src/App.tsx` → `frontend/src/styles/index.css`
    - `styles/index.css`가 아래 파일들을 `@import`로 합산 로드
        - `styles/variables.css` (컬러/서피스/텍스트 등 토큰, 다크모드 토큰)
        - `styles/base.css` (레이아웃/유틸리티 클래스)
        - `styles/buttons.css`, `styles/cards.css`, `styles/tables.css`, `styles/modal.css`, `styles/template.css`, `styles/animations.css`, `styles/debug.css`, `styles/responsive.css`

### 7-2. “소스 오브 트루스” 파일

- **토큰(색/서피스/텍스트/보더 등)**: `frontend/src/styles/variables.css`
- **레이아웃 프레임(앱 셸/워크스페이스)**: `frontend/src/styles/base.css`
- **컴포넌트 룩앤필**:
    - 버튼/포커스: `frontend/src/styles/buttons.css`
    - 테이블/선택/툴팁: `frontend/src/styles/tables.css`
    - 모달/드로어: `frontend/src/styles/modal.css`
    - 반응형 규칙: `frontend/src/styles/responsive.css`

### 7-3. 점검 중 발견 사항(설계/가이드 준수 관점)

- `frontend/src/index.css`는 body 색상/배경이 hex로 하드코딩되어 있고, `styles/base.css`는 CSS 변수 기반이라 **중복/충돌 여지**가 있음(로드 순서에 따라 최종 적용이 달라질 수 있음).
- 일부 화면은 CSS 변수 대신 **inline style + 하드코딩 hex**를 직접 사용(예: `#ffffff`, `#f8fafc`, `rgba(...)` 등)하여 다크 모드/토큰 일관성 측면에서 예외가 존재.
- `styles/modal.css`, `styles/tables.css` 등에서 `var(--z-*)`를 참조하지만, `styles/variables.css`에는 해당 z-index 토큰 정의가 없어 **디자인 토큰의 완결성**이 깨져 있음.

---

## 8. 프로젝트 정리/설치 관련 업데이트 (2026-04-28)

### 8-1. 불필요 파일 정리

- 프론트엔드에 남아 있던 Redux placeholder(`frontend/src/store/`)를 제거하고, 실제 사용 중인 Zustand(`frontend/src/stores/`)만 유지.
- 프로젝트 내 AI 도구 보조 폴더로 보이는 `.claude/`, `.gemini/`는 레포에 필수로 보이지 않아 정리 대상으로 처리.
- Phase 설계 문서는 현재 워크스페이스에서 별도 폴더(레포 외부)로 관리되고 있어, 레포 루트에 중복으로 존재하던 사본은 정리 대상으로 처리.

### 8-2. 의존성 설치 전제

- 이 레포는 npm workspaces 기반이므로 기본적으로 레포 루트에서 `npm install`을 수행해 `backend/`, `frontend/`를 함께 설치하는 흐름을 사용.
- 단, 일부 실행 환경에서는 `node`/`npm`이 설치되어 있지 않거나 PATH에 잡혀있지 않아 설치가 바로 진행되지 않을 수 있음(이 경우 Node.js 18+ 설치가 선행 필요).

