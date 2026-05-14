# 프로젝트 개편 및 개발 계획 (Project Plan)

## 현재 목표: 단일 클라이언트 앱으로의 전환 (Supabase 마이그레이션)
기존 Node.js 백엔드를 제거하고, 프론트엔드 코드를 루트로 끌어올려 유지보수성을 극대화합니다.

### 1단계: 인프라 정리 및 구조 통합 (완료)
- [x] `docker-compose.yml` 및 하위 폴더의 `Dockerfile` 등 도커 관련 파일 삭제
- [x] `backend` 폴더 내 백업 필요 데이터 추출 후 폴더 삭제(또는 `_deprecated` 처리)
- [x] `frontend` 폴더 안의 내용물을 프로젝트 루트로 이동 및 설정(`package.json`, `vite.config.ts` 등) 병합
- [x] Vite alias(`@/`) 설정 및 전체 `import` 경로 확인 (빌드 성공)

### 2단계: 레거시 코드 및 안 쓰는 파일 청소 (완료)
- [x] 더 이상 사용되지 않는 UI 컴포넌트(`src/components/` 내) 삭제 (`ChartNotes.tsx` 삭제)
- [x] 사용되지 않는 페이지 및 라우팅 정리 (`EducationOverview.tsx` 삭제)
- [x] `COMPONENT_GRAPH.md` 최신화

### 3단계: Supabase 전면 도입 (완료)
- [x] `src/api/client.ts` 삭제 및 모든 통신 로직을 `src/api/supabase.ts`로 전환
- [x] 백엔드 `auth.ts` 로직 -> Supabase Auth 전환
- [x] 백엔드 `settings.ts` 로직 -> Supabase DB 통신 전환
- [x] 메일 파싱/로깅 처리(`emails.ts`) -> Supabase Edge Functions / DB 트리거로 재구축 준비

### 4단계: 프론트엔드 Import 절대 경로 리팩토링 (완료)
- [x] 기존 상대 경로(`../../..`)를 `@/` 기반의 절대 경로로 일괄 변경
- [x] TypeScript 빌드 에러 및 파일 누락 점검

---

## 5단계: 페이지별 통합 테스트 및 DB 로그 검증 계획
각 페이지의 주요 기능(CRUD)을 실행하며 프론트엔드 콘솔 오류와 Supabase 백엔드(API, Postgres) 로그를 교차 검증합니다. 오류 누락을 방지하기 위해 다음 체크리스트를 순차적으로 진행합니다.

### 공통 검증 항목 (매 페이지마다 수행)
- **프론트엔드**: 브라우저 개발자 도구 콘솔의 에러/경고(빨간색/노란색 텍스트) 확인
- **백엔드**: MCP Supabase 도구를 사용해 로그 확인 (`mcp_supabase_get_logs`로 `api` 및 `postgres` 서비스 에러 탐지)

### 1. 로그인 페이지 (`LoginPage.tsx`)
- [ ] 정상 계정(`bmccrokhp`) 로그인 시도 및 대시보드 리다이렉트 확인
- [ ] 브라우저 콘솔 오류 없음 확인
- [ ] Supabase `auth` 및 `api` 로그에 500 에러 등 이상 없음 확인

### 2. 대시보드 (`Dashboard.tsx`)
- [ ] 페이지 로드 시 통계 데이터(기업 수, 참여자 수 등) 패치 확인
- [ ] 브라우저 콘솔 오류 없음 확인
- [ ] Supabase `api`/`postgres` 로그: 데이터 집계 쿼리 실행 시 에러/지연 없음 확인

### 3. 참여 기업 관리 (`CompanyManagementPage.tsx`)
- [ ] 기업 목록 정상 로드 및 페이지네이션/필터링 작동 확인
- [ ] 신규 기업 추가 기능 테스트 (MOU 체결 여부 등)
- [ ] 기존 기업 정보 수정 및 서랍(Drawer) 열기/닫기 테스트
- [ ] 브라우저 콘솔 및 Supabase 데이터베이스 로그 검증 (RLS 위반, 타입 에러 등)

### 4. 교육 참여자 관리 (`ParticipantsPage.tsx`)
- [ ] 참여자 목록 정상 로드 및 필터링 작동 확인
- [ ] 신규 참여자 등록 및 소속 기업 매핑 테스트
- [ ] 참여자 정보 수정 기능 테스트
- [ ] 일괄 업로드(Excel) 또는 다중 선택 기능 테스트 (해당 기능 존재 시)
- [ ] 브라우저 콘솔 및 Supabase 로그 검증 (특히 외래키 제약조건 오류 확인)

### 5. 교육 과정/회차 관리 (`CourseManagementPage.tsx`)
- [ ] 상위 과정 및 세부 프로그램(회차) 목록 로드 확인
- [ ] 신규 회차 등록 및 상태(계획/진행/종료) 변경 테스트
- [ ] 과정-기업 매핑 및 과정-참여자(Enrollments) 데이터 조회 확인
- [ ] 브라우저 콘솔 및 Supabase 로그 검증

### 6. 이메일 템플릿 관리 (`TemplateEditor.tsx`)
- [ ] 기존 템플릿 목록 조회 및 템플릿 에디터 열기 확인
- [ ] 변수 치환(`{{변수명}}`) 기능 및 템플릿 저장 테스트
- [ ] 브라우저 콘솔 및 Supabase 로그 검증

### 7. 이메일 발송 이력 (`EmailLogsPage.tsx`)
- [ ] 발송 이력(Logs) 및 작업(Jobs) 목록 정상 조회 확인
- [ ] 브라우저 콘솔 및 Supabase 로그 검증