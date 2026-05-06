# 프로젝트 심층 분석 보고서 (최종 업데이트)

> 분석 및 작업 완료 일자: 2026-04-30  
> 작업 범위: 3-Tier 아키텍처 전환, SOLID 리팩터링, 보안 강화, 성능 최적화  
> 총 코드량: 약 28,000줄 이상 (완전 모듈화 및 실데이터 연동 완료)

---

## 1. 프로젝트 개요

**프로젝트명**: Dashboard KHP (전남대학교 K-하이테크 플랫폼 대시보드)

**목적**: 기업 교육 프로그램 관리 및 참여자 추적을 위한 웹 기반 대시보드 시스템

**핵심 성과 (2026-05-06 업데이트)**: 
- **SOLID 아키텍처 완성**: 모든 주요 페이지와 컴포넌트(기업/참여자 관리)를 커스텀 훅과 서브 컴포넌트로 분리하여 유지보수성을 극대화함.
- **3-Tier 아키텍처 확립**: 프론트엔드 - Express 백엔드 - PostgreSQL(Supabase) 구조로의 전환 및 연결 완료.
- **데이터 무결성 및 안정성**: 백엔드 응답 형식을 camelCase로 통일하여 프론트엔드 크래시(저장 후 빈 화면) 이슈 해결.
- **데이터 가독성 개선**: raw ISO 문자열로 표시되던 날짜 데이터를 `YYYY.MM.DD` 형식으로 변환하는 공통 유틸리티(`toDotDate`)를 고도화하고 전면 적용.
- **UI/UX 통일성 확보**: 기업 관리와 참여자 관리 페이지 간의 디자인 불일치(탭 스타일, 선택 바, 모달 레이아웃 등)를 "Modern & Dark Glass" 테마로 전면 통일.
- **공통 컴포넌트 최적화**: `FloatingActionBar`를 고도화하여 다크 테마 기반의 일관된 액션 바 제공 및 코드 중복 제거.
- **코드 품질 안정화**: 프로젝트 전반의 30개 이상의 TypeScript 타입 에러 및 구문 오류를 해결하고, **`npm run build` (TSC 체크 포함) 성공** 확인.
- **기능 최적화**: 기업 관리 탭 필터링 로직을 DB 실제 데이터(과정 분류명) 기반으로 수정하여 정상화.
- **UX 정교화**: 레이어링 이슈(Z-index) 해결 및 불필요한 UI 요소(과정 추가 버튼 등)를 제거하여 인터페이스 단순화.
- **연결 복구 완료**: `DATABASE_URL` 및 DB 패스워드 설정을 통해 백엔드와 Supabase 간의 통신 정상화. Health Check(`api/health`) 및 실데이터 조회 테스트 통과.
- **레거시 제거**: 구버전 설계서(`PhaseDocs/`), 빌드 결과물(`dist/`), 미사용 모달(`AddCourseModal.tsx`) 등 불필요한 파일 및 폴더 정리 완료.
- **보안 철저화**: RLS(Row Level Security) 정책을 강화하여 프론트엔드의 직접적인 DB 접근을 차단하고 서버측 연결만 허용하는 구조 확립.
- **성능 최적화**: 페이지별 Lazy Loading 및 `xlsx` 라이브러리 지연 로딩을 통해 초기 번들 크기를 400KB 이하(약 360KB)로 절감함.

---

## 2. 기술 스택 상세

### 2-1. 의존성 목록

**프로덕션 의존성**:
```
zustand@^5.0.12               - 핵심 상태 관리 (백엔드 API 연동 방식)
axios@^1.6.2                 - API 통신 (127.0.0.1 최적화 연동)
lucide-react@^0.294.0        - 24x24 SVG 아이콘 라이브러리 (트리셰이킹 적용)
react@^18.2.0                - UI 라이브러리 (Lazy Loading 적용)
react-router-dom@^6.20.1   - 클라이언트 사이드 라우팅
recharts@^3.8.1            - React 전문 차트 컴포넌트 (Dashboard 고도화)
xlsx@^0.18.5               - 엑셀 파일 처리 (지연 로딩으로 번들 최적화)
```

**개발 의존성**:
```
TypeScript@^6.0.3          - 엄격한 타입 안정성 확보 (TSC 오류 0개)
Vite@^5.0.8               - 고성능 빌드 도구 (코드 스플리팅 적용)
```

---

## 3. 시스템 구조 (SOLID 리팩터링 결과)

### 3-1. 모듈별 구성
- **Companies**: `Page` -> `Hooks(Filters, Sort, Selection, Modals, DrawerState, Excel, Tooltips, Popover)` -> `Components(Table, Drawer, Sections, Modals)` -> `Utils`
- **Participants**: `Page` -> `Hooks(Filters, Selection, Excel, CourseManager)` -> `Components(Table, Drawer, Modals)`
- **Courses**: `Page` -> `Redesigned Split-View Editor (Left: Summary List / Right: Performance Detail)` -> `Sub-components`

### 3-2. 데이터 흐름
- **Frontend**: Zustand 스토어에서 `apiClient`(Axios)를 통해 백엔드 호출.
- **Backend**: Express API 엔드포인트에서 `pg pool`을 통해 DB 직접 연결 및 트랜잭션 처리 완료.
- **Database**: PostgreSQL(Supabase) 테이블 간 관계(1:N, N:M)를 통한 정규화된 데이터 저장.

---

## 4. 데이터 모델 (Supabase MCP 연동 상태)
- **Project URL**: https://boduyyabeigqxxvudles.supabase.co
- **Status**: Connected & Operational
- **Tables**: `companies`, `course_groups`, `sub_courses`, `participants`, `enrollments`, `email_templates`, `system_logs`, `company_courses` 정상 작동 확인.

---

## 5. 향후 과제 및 권장 사항

1.  **백엔드 DB 연결 복구**: `backend/.env`에 정확한 `DATABASE_URL` 설정.
2.  **프론트엔드-Supabase 직접 연동 검토**: 보안 요구사항에 따라 백엔드 없이 Supabase SDK를 직접 사용할지 결정.
3.  **실시간 구독(Realtime)**: Supabase Realtime 기능을 백엔드와 연동하여 멀티 유저 환경에서의 실시간 알림/업데이트 구현.


---

## 9. 시스템 동작 기능 및 데이터 흐름 분석

### 9-1. 주요 기능 동작 모듈
1. **기업 관리 (Company Management)**
   - **조회/필터/정렬**: 8개의 커스텀 훅을 통한 고도로 분리된 로직.
   - **MOU 관리**: 실시간 상태 업데이트 및 이력 관리 기반 마련.

2. **참여자 관리 (Participant Management)**
   - **수강 이력**: `enrollments` 테이블 연동을 통한 완전한 영속성 확보.
   - **엑셀/이메일**: 대량 처리를 위한 전용 훅 및 모달 시스템.

### 9-2. 데이터베이스 엔티티 매핑 분석 (Entity Mapping)

| 구분 | 엔티티 명 | 주요 속성 | 관계 |
| :--- | :--- | :--- | :--- |
| **기업** | `companies` | 명칭, 사업자번호, 소재지, 대표자, 담당자 정보, MOU 상태 | 1 : N (참여자) |
| **참여자** | `participants` | 이름, 소속기업ID, 직위, 연락처, 고용보험 상태, 경력 | N : 1 (기업) |
| **과정 분류** | `course_groups` | 분류명 (훈련비, 지원비, 세미나) | 1 : N (세부 과정) |
| **세부 과정** | `sub_courses` | 과정명, 시작/종료일, 총 시간, 목표 인원 | 1 : N (수강 이력) |
| **수강 이력** | `enrollments` | 참여자ID, 세부과정ID, 수료상태, 수료일, 수료번호 | N : M (참여자-과정) |
료상태, 수료일, 수료번호 | N : M (참여자-과정) |
