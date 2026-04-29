# 프로젝트 심층 분석 보고서 (최종 업데이트)

> 분석 및 작업 완료 일자: 2026-04-29  
> 작업 범위: Supabase 직접 연동, 백엔드 CRUD 구현, UI/UX 버그 수정 및 최적화  
> 총 코드량: 약 24,000줄 이상 (모듈화 및 실데이터 연동 완료)

---

## 1. 프로젝트 개요

**프로젝트명**: Dashboard KHP (전남대학교 K-하이테크 플랫폼 대시보드)

**목적**: 기업 교육 프로그램 관리 및 참여자 추적을 위한 웹 기반 대시보드 시스템

**핵심 성과 (2026-04-29 업데이트)**: 
- **Supabase 직접 연동**: 프론트엔드에서 Supabase SDK를 사용하여 실시간 데이터 CRUD 구현.
- **백엔드 고도화**: Express 서버에 기업 및 참여자 관리용 REST API 엔드포인트 추가.
- **UI/UX 정밀 튜닝**: 필드 편집 모드 스타일 일치화, 반응형 팝오버 위치 계산 등 사용자 경험 개선.
- **데이터 무결성 확보**: Zustand 스토어와 Supabase DB 간의 동기화 로직 최적화.

---

## 2. 기술 스택 상세

### 2-1. 의존성 목록

**프로덕션 의존성**:
```
@supabase/supabase-js@^2.39.0 - [NEW] Supabase 클라이언트 SDK
zustand@^4.4.7               - 핵심 상태 관리 (실데이터 연동 로직 포함)
axios@^1.6.2                 - API 통신 (백엔드 연동용)
lucide-react@^0.294.0        - 24x24 SVG 아이콘 라이브러리
react@^18.2.0                - UI 라이브러리 (App.tsx 초기 로딩 최적화)
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

---

## 3. 파일/폴더 구조 (리팩터링 결과)

```
frontend/src/
├── api/                    # [NEW] API 통신 모듈 (Supabase client 포함)
├── stores/                 # Zustand 전역 스토어 (실데이터 CRUD 연동)
│   ├── useCompanyStore.ts
│   ├── useParticipantStore.ts
│   └── useCourseStore.ts
├── hooks/                  # 공통 커스텀 훅
│   └── useDebounce.ts      # 검색 입력 지연 처리
├── components/
│   ├── EmptyState.tsx      # 빈 데이터/검색 결과 UI
│   └── ... (기존 컴포넌트)
├── pages/
│   ├── companies/          # 기업 관리 모듈 (모듈화 완료)
│   │   ├── CompanyManagementPage.tsx (오케스트레이터)
│   │   ├── CompanyTable.tsx
│   │   ├── CompanyDrawer.tsx
│   │   ├── modals/ (Add, Upload, Email, CourseManager)
│   │   └── hooks/ (useCompanyFilters, useCompanySort)
│   ├── participants/       # 참여자 관리 모듈
│   └── ...
└── styles/
    └── (Z-index 및 focus-visible 스타일 강화 완료)
```

---

## 4. 데이터 모델

### 4-1. 실데이터 연동 (Supabase)
- 더 이상 Mock 데이터를 사용하지 않으며, 앱 시작 시 `App.tsx`에서 Supabase 데이터를 전역 로드함.
- `upsert`, `delete` 작업이 DB에 즉시 반영됨.

### 4-2. 주요 타입 확장
- `UploadStep`: 엑셀 업로드 시 3단계(파일 선택 → 컬럼 매핑 → 미리보기) 프로세스 타입 정의.
- `CompanyRecord` / `ParticipantRecord` 간의 관계형 매핑 강화.

---

## 5. 핵심 개선 및 구현 기능 (최근 업데이트)

### ✅ Supabase 실데이터 연동 (P0)
- **Direct Connection**: 프론트엔드에서 `@supabase/supabase-js`를 사용하여 `companies`, `participants`, `course_groups`, `sub_courses` 테이블에 직접 접근.
- **CamelCase-SnakeCase 매핑**: DB의 snake_case와 프론트엔드의 camelCase 모델 간 자동 변환 로직 구현.
- **전역 초기화**: `App.tsx`에서 앱 구동 시 필요한 모든 기초 데이터를 Supabase로부터 초기 로드하여 페이지 전환 성능 향상.

### ✅ 백엔드 API 서비스 (P1)
- **RESTful 엔드포인트**: `backend/src/index.ts`에 기업 및 참여자 정보를 처리하는 `POST`, `PUT`, `DELETE` 라우트 구현.
- **커넥션 풀링**: Supabase Transaction mode(Port 6543)를 사용하여 DB 연결 효율성 극대화.

### ✅ UI/UX 완성도 향상 (P1)
- **필드 편집 일관성**: 기업 상세 정보(Drawer)에서 편집 모드 진입 시 입력 필드(`input`)의 크기와 폰트를 기존 표시 영역과 1:1로 매칭하여 레이아웃 흔들림 제거.
- **반응형 팝오버**: 참여자 간략 정보 팝업이 화면 우측에서 잘리지 않도록 가용 공간을 계산하여 좌/우 위치를 자동 조절하는 로직 적용.
- **아이콘 최적화**: '내보내기' 버튼의 아이콘을 기능에 맞는 `Download` 아이콘으로 교체 및 누락된 임포트 보완.

---

## 6. 향후 과제 및 권장 사항

1.  **실시간 구독(Realtime)**: Supabase Realtime 기능을 활용하여 멀티 유저 환경에서 데이터 변경 사항 즉시 반영.
2.  **Row Level Security (RLS)**: 유저별/권한별 데이터 접근 제어 설정 필요.
3.  **에러 핸들링 강화**: 네트워크 단절이나 DB 오류 시 사용자에게 친숙한 경고 메시지 제공.

---

## 9. 시스템 동작 기능 및 데이터 흐름 분석

### 9-1. 주요 기능 동작 모듈
1. **기업 관리 (Company Management)**
   - **조회**: `useCompanyStore`를 통해 Supabase에서 직접 데이터 페칭.
   - **필터링/정렬**: 실시간 필터링 및 정렬 로직 고도화.
   - **MOU 관리**: `CompanyDrawer`에서 체결 상태 실시간 업데이트.

2. **참여자 관리 (Participant Management)**
   - **수강 이력**: `enrollments` 및 `sub_courses` 테이블 조인을 통해 복합 데이터 구성.
   - **이메일/엑셀**: 플로팅 액션바를 통한 일괄 처리 UI.

### 9-2. 데이터베이스 엔티티 매핑 분석 (Entity Mapping)

| 구분 | 엔티티 명 | 주요 속성 | 관계 |
| :--- | :--- | :--- | :--- |
| **기업** | `companies` | 명칭, 사업자번호, 소재지, 대표자, 담당자 정보, MOU 상태 | 1 : N (참여자) |
| **참여자** | `participants` | 이름, 소속기업ID, 직위, 연락처, 고용보험 상태, 경력 | N : 1 (기업) |
| **과정 분류** | `course_groups` | 분류명 (훈련비, 지원비, 세미나) | 1 : N (세부 과정) |
| **세부 과정** | `sub_courses` | 과정명, 시작/종료일, 총 시간, 목표 인원 | 1 : N (수강 이력) |
| **수강 이력** | `enrollments` | 참여자ID, 세부과정ID, 수료상태, 수료일, 수료번호 | N : M (참여자-과정) |
