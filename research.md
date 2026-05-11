# 프로젝트 심층 분석 보고서 (최종 업데이트)

> 분석 및 작업 완료 일자: 2026-05-08  
> 작업 범위: 3-Tier 아키텍처 전환, SOLID 리팩터링, 이메일 시스템 연동, 보안 강화, 성능 최적화  
> 총 코드량: 약 28,000줄 이상 (완전 모듈화 및 실데이터 연동 완료)

---

## 1. 프로젝트 개요

**프로젝트명**: Dashboard KHP (전남대학교 K-하이테크 플랫폼 대시보드)

**목적**: 기업 교육 프로그램 관리 및 참여자 추적을 위한 웹 기반 대시보드 시스템

**핵심 성과 (2026-05-11 업데이트)**: 
- **인증 및 보안 (Auth) 시스템 구축 완료**: Custom Express JWT 기반의 인증 시스템을 구현했습니다. `users` 테이블 생성, `bcryptjs`를 이용한 비밀번호 암호화, `jsonwebtoken`을 이용한 토큰 발급 및 검증 미들웨어를 완벽히 적용했습니다. 프론트엔드에서는 `ProtectedRoute`와 전용 로그인 페이지를 통해 비인증 사용자의 접근을 차단하고 보안을 강화했습니다.
- **실시간 데이터 동기화 (Realtime) 통합 완료**: Supabase Realtime을 모든 주요 데이터 스토어(기업, 참여자, 과정, 통계, 템플릿)에 통합했습니다. 이제 다중 사용자 환경에서 데이터가 변경되면 화면 새로고침 없이도 모든 클라이언트의 대시보드와 테이블이 즉각적으로 최신 상태를 유지합니다.
- **이메일 발송 시스템 구축 및 E2E 검증 완료**: 네이버 SMTP 연동을 통한 이메일 일괄 발송 시스템을 구축함. 백그라운드 큐(Job Queue) 폴링을 통한 진행률 추적, 실시간 템플릿 변수 미해결 경고, 첨부파일 용량 검증 및 SMTP 자격증명 테스트 기능을 완벽히 구현했으며, 백엔드 E2E API 테스트 스크립트를 통해 정상 동작을 최종 검증함.
- **고도화된 리치 텍스트 에디터 UX 구현 (2026-05-11)**: 
  - **정밀 포지셔닝**: Hidden Mirror Div를 이용한 Caret 좌표 계산으로 선택 영역 시작 지점에 툴바를 정확히 배치.
  - **실시간 스크롤 동기화**: 에디터 내부 스크롤 시 툴바가 선택된 텍스트를 실시간으로 추적하도록 구현.
  - **서식 지능형 제어**: Bold, Italic, Underline, Color 토글 기능 및 중복 태그 방지 로직 적용.
  - **전문가급 단축키**: Ctrl+B, I, U, S, Z, Y 등 표준 문서 도구 수준의 단축키 통합.
- **참여자 과정 연결 및 회차 정보 보존**: 수강 이력(enrollments) 조회 시 회차(`session_id`) 정보가 유실되던 백엔드 API 이슈를 해결하고, 과정 연결 시 즉시 저장 모드로 전환되도록 UX를 개선하여 데이터 무결성을 확보함.
- **SOLID 아키텍처 완성**: 모든 주요 페이지와 컴포넌트(기업/참여자 관리)를 커스텀 훅과 서브 컴포넌트로 분리하여 유지보수성을 극대화함.
- **3-Tier 아키텍처 확립**: 프론트엔드 - Express 백엔드 - PostgreSQL(Supabase) 구조로의 전환 및 연결 완료.
- **데이터 무결성 및 안정성**: 백엔드 응답 형식을 camelCase로 통일하여 프론트엔드 크래시(저장 후 빈 화면) 이슈 해결.
- **데이터 가독성 개선**: raw ISO 문자열로 표시되던 날짜 데이터를 `YYYY.MM.DD` 형식으로 변환하는 공통 유틸리티(`toDotDate`)를 고도화하고 전면 적용.
- **UI/UX 통일성 확보**: 기업 관리와 참여자 관리 페이지 간의 디자인 불일치(탭 스타일, 선택 바, 모달 레이아웃 등)를 "Modern & Dark Glass" 테마로 전면 통일.
- **공통 컴포넌트 최적화**: `FloatingActionBar`를 고도화하여 다크 테마 기반의 일관된 액션 바 제공 및 코드 중복 제거.
- **코드 품질 안정화**: 프로젝트 전반의 30개 이상의 TypeScript 타입 에러 및 구문 오류를 해결하고, **`npm run build` (TSC 체크 포함) 성공** 확인.
- **과정 및 참여자 연결 로직 보완 (UX Blocker 해결)**: 세부 프로그램 삭제 시 UX 혼선을 막기 위한 확인 모달 및 강제 동기화 로직을 추가하고, 참여자의 수강 이력(enrollments) 저장 시 `session_id`와 `sub_course_id`를 정확히 매핑하여 특정 회차에 대한 기록이 영구적으로 보존되도록 백엔드 스키마와 프론트엔드 연동을 개선함.
- **UX 정교화**: 레이어링 이슈(Z-index) 해결 및 불필요한 UI 요소(과정 추가 버튼 등)를 제거하여 인터페이스 단순화.
- **Courses UI/UX 개선**: 교육 과정 관리 화면의 "박스 중첩" 체감을 줄이기 위해 섹션 간 spacing/padding을 확대하고, 내부 구분선을 정리하며, 빈 상태 박스/카드 전환 효과(transition/scale)를 경량화함. 또한 라벨/배지/CTA 버튼의 텍스트 크기를 상향해 가독성을 개선하고, 지원대상/요약/테이블 등 내부 요소의 불필요한 border를 정리해 중첩감을 추가로 완화함.
- **연결 복구 완료**: `DATABASE_URL` 및 DB 패스워드 설정을 통해 백엔드와 Supabase 간의 통신 정상화. Health Check(`api/health`) 및 실데이터 조회 테스트 통과.
- **레거시 제거**: 구버전 설계서(`PhaseDocs/`), 빌드 결과물(`dist/`), 미사용 모달(`AddCourseModal.tsx`) 등 불필요한 파일 및 폴더 정리 완료.
- **보안 철저화**: RLS(Row Level Security) 정책을 강화하여 프론트엔드의 직접적인 DB 접근을 차단하고 서버측 연결만 허용하는 구조 확립.
- **성능 최적화**: 페이지별 Lazy Loading 및 `xlsx` 라이브러리 지연 로딩을 통해 초기 번들 크기를 400KB 이하(약 360KB)로 절감함.

---

## 2. 기술 스택 상세

### 2-1. 의존성 목록

**프로덕션 의존성**:
```
nodemailer@^6.9.13            - 네이버 SMTP 기반 이메일 발송
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

1.  **실시간 구독(Realtime) 고도화**: Supabase Realtime 기능을 활용하여 다중 사용자 환경에서 데이터(기업 정보, 참여자 정보, 발송 이력 등)가 변경되었을 때 화면을 새로고침하지 않고도 실시간으로 반영되도록 개선.
2.  **데이터 백업 및 스냅샷**: 중요한 이력 데이터(`enrollments`, `email_logs`)에 대한 자동화된 백업 파이프라인 구축.
3.  **지속적인 UI/UX 정제**: 공통화된 `DataPageLayout` 시스템을 기반으로 대시보드 메인 화면 및 기타 설정 화면들의 시각적 일관성(Visual Consistency) 유지 보수 및 사용자 피드백 기반 미세 조정.


---

## 9. 시스템 동작 기능 및 데이터 흐름 분석

### 9-1. 주요 기능 동작 모듈
1. **기업 관리 (Company Management)**
   - **조회/필터/정렬**: 8개의 커스텀 훅을 통한 고도로 분리된 로직.
   - **MOU 관리**: 실시간 상태 업데이트 및 이력 관리 기반 마련.

2. **참여자 관리 (Participant Management)**
   - **수강 이력**: `enrollments` 테이블 연동을 통한 완전한 영속성 확보.
   - **단체 메일 발송**: `BulkEmailModal`을 통한 일괄 발송 시스템 통합.

3. **이메일 시스템 (Email System)**
   - **템플릿 관리**: 변수 치환 및 실시간 미리보기를 통한 메일 작성 효율화.
   - **발송 이력**: `email_logs` 연동으로 수신자별 성공/실패 여부 추적.

### 9-2. 데이터베이스 엔티티 매핑 분석 (Entity Mapping)

| 구분 | 엔티티 명 | 주요 속성 | 관계 |
| :--- | :--- | :--- | :--- |
| **기업** | `companies` | 명칭, 사업자번호, 소재지, 대표자, 담당자 정보, MOU 상태 | 1 : N (참여자) |
| **참여자** | `participants` | 이름, 소속기업ID, 직위, 연락처, 고용보험 상태, 경력 | N : 1 (기업) |
| **과정 분류** | `course_groups` | 분류명 (훈련비, 지원비, 세미나) | 1 : N (세부 과정) |
| **세부 과정** | `sub_courses` | 과정명, 시작/종료일, 총 시간, 목표 인원 | 1 : N (수강 이력) |
| **수강 이력** | `enrollments` | 참여자ID, 세부과정ID, 수료상태, 수료일, 수료번호 | N : M (참여자-과정) |
| **메일 템플릿** | `email_templates` | 템플릿명, 대상 구분, 제목, 본문, 첨부파일 정보 | 1 : N (발송 이력) |
| **발송 이력** | `email_logs` | 수신 이메일, 템플릿ID, 발송 상태, 에러 메시지, 발송일시 | N : 1 (템플릿) |
