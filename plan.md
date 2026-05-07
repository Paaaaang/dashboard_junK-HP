# KHP Dashboard 상세 수정 계획

> 기준: Phase 1, Phase 2 설계서 + ui-ux-pro-max 디자인 가이드라인  
> 분석 기준일: 2026-04-24 / 최근 점검일: 2026-05-06

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

**현재 상태**: Supabase 기반 PostgreSQL 스키마 구축 및 Express 백엔드 API 통합 완료. 연결 정상화 확인됨.
**작업 목표**:
1. [x] Supabase 기반 관계형 데이터베이스 스키마 구축.
2. [x] RLS(Row Level Security) 정책 설정을 통한 보안 강화 (Direct Supabase API 차단 완료).
3. [x] 백엔드(Express)와 Supabase(PostgreSQL) 연동 복구 (DATABASE_URL 설정 및 Health Check 통과).
4. [x] 프론트엔드에서 MCP 기반 Supabase 환경 변수(`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) 활성화 및 테스트.
5. [x] Zustand 스토어를 API 연동 방식으로 전환.

---

## [NEW] SOLID 아키텍처 및 시각화 고도화 (P3-2, P3-4)

**현재 상태**: 거대 컴포넌트 해체 및 전문 시각화 도입 완료.
**작업 목표**:
1. [x] 기업 관리(`CompanyManagementPage`) SOLID 리팩터링 완료. (Hooks: Filters, Sort, Selection, Modals, Drawer, Excel, Tooltips, Popover)
2. [x] 참여자 관리(`ParticipantsPage`) SOLID 리팩터링 완료. (Hooks: Filters, Selection, Excel, CourseManager)
3. [x] `CompanyDrawer` 섹션별 컴포넌트 분리 완료. (Header, BasicInfo, ManagerInfo, MOUStatus, CourseParticipation)
4. [x] Recharts 기반 대시보드 시각화 업그레이드 완료. (Pie, Bar, Area 차트 도입)

---

## P0 — Critical 수정 사항

### [P0-6] Supabase 연결 복구 (Emergency)

**현재 상태**: 완료됨. 백엔드와 Supabase 간의 연결이 복구되었으며, 500 에러(ECONNREFUSED) 해결됨.
**작업 내용**:
- `backend/.env`에 `DATABASE_URL` 및 패스워드 설정 완료.
- `frontend/.env`에 Supabase 정보 동기화 완료.
- 백엔드 Health Check(`api/health`) 및 데이터 조회 검증 완료.

### [P0-7] 레거시 코드 및 파일 정리

**현재 상태**: 완료됨.
**작업 내용**:
- `PhaseDocs/` 폴더 제거 (설계서 레거시).
- `backend/dist/`, `frontend/dist/` 제거 (빌드 결과물 레거시).
- `AddCourseModal.tsx` 제거 (기능 통폐합에 따른 중복 UI 삭제).
- 미사용 파일 및 폴더 스캔 및 정리.

### [P0-8] 로직 및 안정성 강화 (Critical)

**현재 상태**: 완료됨.
**작업 내용**:
- **저장 후 빈 화면 이슈 해결**: 백엔드(POST/PUT) 응답 데이터를 camelCase로 통일하여 프론트엔드 상태 동기화 오류 수정.
- **탭 필터링 정상화**: 하드코딩된 ID 대신 실제 DB 과정 분류명(훈련비, 지원비, 세미나) 키워드 매칭으로 수정.
- **Z-index 레이어링 수정**: 확인 팝업이 드로어 뒤에 가려지는 이슈 해결 (`!z-[300]` 적용).
- **빌드 안정화**: `npm run build`를 통한 TSC 체크 통과 (문법 및 타입 에러 0개).
- **디자인 시스템 통일**: 탭 리스트, 플로팅 액션 바, 추가 선택 모달 스타일을 "Modern & Dark Glass" 테마로 전면 통일 완료.
- **데이터 현지화 및 포맷팅**: 불필요한 영문 텍스트 제거 및 모든 날짜 표시 형식을 한국 정서에 맞는 `YYYY.MM.DD`로 통일 완료.

---

### [P0-9] 과정 구분/세부 프로그램 삭제 버그 (UX Blocker)

**현재 상태**: 완료됨. 

**증상**:
- 과정 구분(세부 프로그램 구성 목록)에서 삭제 UI는 존재하나, 사용자 체감상 “삭제가 실제로 반영되지 않음”.

**원인 가설/점검 포인트**:
1. **삭제 반영(세부 프로그램)**
   - 삭제는 폼 상태에서만 제거되고, 최종 저장(적용) 시점에만 DB 동기화되는 구조인지 확인.
   - 저장 동작(적용 버튼)이 실제로 `updateCourseGroup`를 호출하는지, 호출 후 `fetchCourseGroups`로 재동기화가 필요한지 점검.

**작업 목표**:
1. [x] **세부 프로그램 구성 목록 삭제 확인 팝업 추가**
   - 삭제 클릭 → 확인 모달 → 확인 시 삭제 처리
2. [x] **세부 프로그램 삭제가 DB에 실제 반영되도록 보장**
   - 삭제 후 “적용/저장” 없이는 DB 반영이 안 되는 구조라면 UX를 명확히(토스트/배지/상태)하거나, 삭제 시 즉시 API 반영(단건 삭제)로 전환
   - 삭제 후 `fetchCourseGroups()` 재호출로 화면/스토어 재동기화
3. [x] **회귀 테스트**
   - 세부 프로그램 삭제 → 저장/새로고침 후 유지 확인

**관련 파일(예상)**:
- `frontend/src/pages/education/CourseManagementPage.tsx`
- `frontend/src/stores/useCourseStore.ts`

---

### [P0-10] 참여자 과정 연결 및 회차 저장 누락 버그 (UX Blocker)

**현재 상태**: 완료됨. 참여자 과정 연결 플로우에서 세부 과정/회차 연결이 정상 작동 및 유지됨.

**증상**:
- 참여자 선택 → 과정 연결 선택 → 과정 구분 선택 → 세부 과정 선택 → 회차 선택 → 완료 흐름에서,
  - 회차 선택/연결이 동작하지 않음
  - 연결 추가가 저장 후 유지되지 않음(새로고침/재진입 시 사라짐)

**원인 가설/점검 포인트**:
1. **참여자 과정 연결(회차) 저장 누락**
   - 현재 백엔드 enrollments 저장 스키마가 `sessionId`를 보존하지 않는지 확인(회차 연결이 영속화되지 않으면 UI에서 사라짐).
   - API가 `subCourseName`(이름) 기준으로 매핑하고 있어 동일명 충돌/오매칭 가능성 점검.

**작업 목표**:
1. [x] **참여자 과정 연결 플로우 복구 (세부 과정 + 회차 연결)**
   - 세부 과정 선택 시 회차가 정상 노출되도록 데이터 로딩/상태 점검
   - 회차가 존재하는 세부 과정의 경우, 회차 선택을 필수로 할지 정책 확정
2. [x] **DB/백엔드 스키마 점검 및 보완(필요 시 설계 변경)**
   - `enrollments`에 `session_id`(예: `sub_course_sessions.id` FK) 저장 가능하도록 확장 여부 검토
   - 참여자 조회 시 `session_id`를 포함해 반환(회차 표시/연결 유지)
   - 저장 요청에서 `subCourseId`/`sessionId` 기반으로 매핑하도록 API 개선(이름 기반 매핑 제거)
3. [x] **회귀 테스트**
   - 참여자 과정 연결(회차 포함) → 저장/새로고침/재진입 후 유지 확인

**관련 파일(예상)**:
- `frontend/src/pages/participants/modals/LinkCourseModal.tsx`
- `frontend/src/pages/participants/ParticipantDrawer.tsx`
- `backend/src/index.ts` (participants/enrollments 저장·조회, sub-course sessions)

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

**현재 상태**: 완료됨. 기업 및 참여자 관리 모두 엑셀 업로드 및 DB 영속성 보장 완료.

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

**현재 상태**: 완료됨. 백엔드 API와 연동된 중앙 집중식 상태 관리.

---

### [P1-9] 기본 정렬 적용

**현재 상태**: 완료됨. 기업명/이름 가나다순 기본 정렬 적용.

---

### [P1-10] 전역 상태 동기화

**현재 상태**: 완료됨. 기업 관리의 참여자 데이터를 전역 참여자 스토어와 연동 완료.



---

### [P1-12] 이메일 발송 시스템 — 네이버 SMTP 기반 외부메일 연동

**현재 상태**: 설계 완료. 상세 구현 계획 수립 완료. 구현 단계 시작 준비 중.

**작업 목표**:
1. [ ] **백엔드 SMTP 메일 서비스 모듈** 구현
   - `nodemailer` 라이브러리 추가 및 네이버 SMTP 설정 (smtp.naver.com:465)
   - 환경변수 설정: `NAVER_EMAIL`, `NAVER_APP_PASSWORD`
   - 첨부파일 처리 로직 (최대 25MB)
   - 메일 서비스 파일: `backend/src/services/mailService.ts`

2. [ ] **EmailTemplate 모델 확장**
   - DB 스키마에 `attachments` 필드 추가
   - `createdAt`, `updatedAt` 타임스탐프 추가 (필요시)

3. [ ] **메일 발송 API 엔드포인트** 구현
   - `POST /api/v1/emails/send` - 단일/복수 발송
   - `POST /api/v1/emails/test` - 테스트 발송
   - `GET /api/v1/emails/logs` - 발송 이력 조회
   - `email_logs` 테이블에 발송 기록 저장

4. [ ] **TemplateEditor 테스트 발송 UI** 추가
   - "테스트 발송" 버튼 + 모달
   - 수신 이메일 입력 + 첨부파일 업로드 기능

5. [ ] **첨부파일 관리 섹션** 추가
   - TemplateEditor에 드래그 앤 드롭 UI
   - 파일 크기/형식 검증 (프론트엔드)

6. [ ] **참여자 일괄 발송 기능** 구현
   - ParticipantsPage에서 체크박스 선택 → "메일 발송" 버튼
   - 템플릿 선택 + 변수 입력 + 발송 모달
   - 수신 그룹: 회사 담당자, 교육 참여자, 외부 이해관계자

7. [ ] **Template Store 업데이트**
   - `attachments` 필드 상태 관리

8. [ ] **타입 정의 확장**
   - `EmailTemplate.attachments` 필드
   - `EmailLog` 인터페이스 정의

**설계 상세**:
- **발송 형식**: Plain Text 유지 (HTML 미지원)
- **SMTP 선택 이유**: OAuth보다 설정이 간단하고, 사용자 자신의 네이버 계정에서 직접 발송 가능
- **첨부파일 용량 제한**: 네이버 기본 한계 25MB 적용
- **로그 저장**: DB에 발송 기록 저장하여 나중에 조회/분석 가능
- **발송 트리거**: 1) 템플릿 에디터에서 테스트 발송 / 2) 참여자 관리 페이지에서 일괄 발송 (1+2 혼합)

**관련 파일**:
- `backend/src/services/mailService.ts` (신규)
- `backend/src/index.ts` - `/api/v1/emails/*` 엔드포인트 추가
- `backend/src/db.ts` - 스키마 확장
- `frontend/src/pages/TemplateEditor.tsx` - 테스트 발송 UI
- `frontend/src/pages/participants/ParticipantsPage.tsx` - 일괄 발송
- `frontend/src/stores/useTemplateStore.ts` - Store 업데이트
- `frontend/src/types/models.ts` - 타입 정의

**Verification**:
- [ ] `POST /api/v1/emails/test` 호출 → 테스트 메일 수신 확인 (Naver 계정)
- [ ] 첨부파일 포함 발송 테스트
- [ ] 복수 수신자 일괄 발송 테스트
- [ ] 템플릿 에디터에서 첨부파일 업로드 → 저장 확인
- [ ] 참여자 선택 → 일괄 발송 → 로그 조회
- [ ] 변수 치환 정상 작동 (회사명, 참여자명 등)

---

## P2 — Medium 수정 사항

### [P2-1] 빈 상태 (Empty State) UI — 설계서 섹션 10

**현재 상태**: 완료됨.

---

### [P2-2] 애니메이션 — prefers-reduced-motion 미지원

**현재 상태**: 완료됨.

---

### [P2-3] 애니메이션 — 드로어 슬라이드 시각 효과

**현재 상태**: 완료됨. CSS Keyframes 기반의 `animate-drawer-in/out` 적용으로 부드러운 Slide-in/out 구현.

---

### [P2-10] 배경 효과 — Backdrop Blur 제거

**현재 상태**: 완료됨. 사용자 요청에 따라 모든 모달 및 드로어의 배경 블러를 제거하고 투명도 위주의 깔끔한 스타일 적용.

---

### [P2-11] 공통 컴포넌트 — 신규 캘린더(Calendar) 통합

**현재 상태**: 완료됨. `date-fns` 기반의 커스텀 한글 캘린더 구현 및 모든 날짜 선택 필드 교체 완료.

---

### [P2-12] UX — 데이터 안정성 (삭제/취소 재확인)

**현재 상태**: 완료됨. 내용 수정 중 닫기 시 저장 요청 팝업 및 삭제 시 재확인 모달 도입.

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

### [P2-8] 에러 피드백 UI — Toast 전환

**현재 상태**: 완료됨. 기존 인라인 알림창을 전역 Toast 시스템으로 일원화하여 UX 개선.

---

### [P2-9] Light/Dark Mode — 하드코딩된 배경색 CSS 변수화

**현재 상태**: 완료됨.

---

## P3 — Low 수정 사항

### [P3-1] 번들 크기 최적화 (703KB → 목표 400KB 이하)

**현재 상태**: 완료됨. 초기 번들 크기 360KB 수준 달성 (`xlsx` 라이브러리 지연 로딩 적용).

---

### [P3-2] 기업관리 페이지 파일 분리

**현재 상태**: 완료됨. (SOLID 아키텍처 적용)

---

### [P3-3] 공통 `useDebounce` 훅

**현재 상태**: 완료됨.

---

### [P3-4] 참여자 관리 페이지 파일 분리

**현재 상태**: 완료됨. (SOLID 아키텍처 적용)

---
[P4]
```markdown
# Task: 이메일 발송 시스템 구현 (네이버 SMTP 기반)

## Context

KHP Dashboard에 교육 신청 안내 메일을 발송하는 시스템을 구현합니다. 설계는 완료되었고, 아래 계획을 **순서대로** 구현해주세요.

**기술 스택**
- 백엔드: Node.js + TypeScript, Express, nodemailer
- 프론트엔드: React + TypeScript + Tailwind (Layout-only) + CSS Variables
- DB: 기존 `backend/src/db.ts` 스키마 확장
- 디자인: 기존 `master.md` 디자인 시스템 + A-2 전략 (색상/그림자/컴포넌트는 CSS 클래스, Tailwind는 layout만)

**중요 제약**
- 네이버 SMTP는 일일 발송 한도 + 분당 rate limit 존재 → 청크/인터벌 필수
- 25MB는 메일 전체 크기 (Base64 후) → raw 파일은 18MB 권장
- 일괄 발송은 **반드시 비동기**로 처리 (동기 시 API 타임아웃)
- 발송 API는 **관리자 인증 필수** (스팸 도구화 방지)

---

## 사전 확인 사항 (구현 시작 전 사용자에게 반드시 질문)

다음 5가지가 결정되어야 구현 가능합니다. 답변을 받기 전까지 코드 작성 금지.

1. 발송 계정: 단일 운영 계정만 사용하는가?
2. 첨부파일 저장: 로컬 파일시스템(`backend/uploads/email-attachments/`)으로 진행해도 되는가?
3. 발송 큐: 별도 큐 라이브러리(BullMQ) 없이 메모리 기반 단순 큐로 진행해도 되는가?
4. 일괄 발송 청크: 10통씩, 1.5초 인터벌로 시작해도 되는가?
5. 로그 보존: `email_logs` 6개월 / 첨부파일 30일로 진행해도 되는가?

---

## Phase 0: 환경 준비

- [ ] `.env.example`에 다음 추가
  ```
  NAVER_EMAIL=
  NAVER_APP_PASSWORD=
  NAVER_SMTP_HOST=smtp.naver.com
  NAVER_SMTP_PORT=465
  EMAIL_DEV_MODE=true   # true면 모든 발송이 NAVER_EMAIL로만 강제 (실수 방지)
  ```
- [ ] `.env`가 `.gitignore`에 있는지 확인
- [ ] README에 네이버 메일 설정 안내 추가 (POP3/SMTP 활성화, 2단계 인증, 앱 비밀번호 발급)

---

## Phase 1: 백엔드 - 데이터 모델

`backend/src/db.ts` 확장:

- [ ] **`email_templates` 확장**
  - `attachments` (JSON): `[{ id, filename, originalName, size, mimeType, path }]`
  - `created_at`, `updated_at`

- [ ] **`email_logs` 신규**
  ```
  id (PK)
  job_id (FK to email_jobs, nullable)
  template_id (FK, nullable)
  sender_email
  recipient_email
  subject
  body_rendered
  status: 'pending' | 'sent' | 'failed'
  error_message (nullable)
  attachments_meta (JSON)
  sent_at (nullable)
  created_at
  ```

- [ ] **`email_jobs` 신규**
  ```
  id (PK, UUID)
  template_id (FK)
  total_count
  sent_count
  failed_count
  status: 'queued' | 'running' | 'completed' | 'failed'
  created_by
  created_at
  completed_at (nullable)
  ```

---

## Phase 2: 백엔드 - 메일 서비스

### 2-1. `backend/src/services/mailService.ts`

```typescript
export async function sendEmail(options: SendOptions): Promise<SendResult>
export function renderTemplate(template: string, vars: Record<string, string>): {
  rendered: string;
  unresolvedVars: string[];
}
export function validateAttachments(files: AttachmentInput[]): ValidationResult
```

요구사항:
- nodemailer SMTP (smtp.naver.com:465, secure:true, pool:true)
- `EMAIL_DEV_MODE=true`이면 모든 수신자를 `NAVER_EMAIL`로 강제 + subject에 `[DEV]` 프리픽스
- 재시도: 일시적 실패 시 최대 3회 지수 백오프 (1s, 2s, 4s)
- 첨부파일 검증:
  - MIME 화이트리스트 (pdf, hwp, docx, xlsx, pptx, png, jpg, zip 등 / 실행파일 차단)
  - 전체 크기(Base64 후) ≤ 25MB
  - 한글 파일명 RFC 2047 인코딩
- 변수 치환: `{{varName}}` 패턴, 미치환 변수 감지

### 2-2. `backend/src/services/emailQueue.ts`

메모리 기반 단순 큐:
- `enqueueBatch(templateId, recipients, variables): jobId` — 즉시 jobId 반환
- 백그라운드에서 청크 단위 발송 (10통씩, 1.5초 인터벌)
- 각 발송 결과를 `email_logs`에 기록
- `email_jobs.sent_count` / `failed_count` 실시간 업데이트
- `getJobStatus(jobId)` 제공

---

## Phase 3: 백엔드 - API 엔드포인트

`backend/src/routes/emails.ts` 신규 생성, `index.ts`에 등록.

모든 엔드포인트에 **관리자 인증 미들웨어** + **rate limiting** 적용 (발송 API 분당 5회, 일괄 발송 분당 1회).

- [ ] `POST /api/v1/emails/preview` — 변수 치환 미리보기 (발송 X)
- [ ] `POST /api/v1/emails/test` — 단일 테스트 발송 (동기)
- [ ] `POST /api/v1/emails/send` — 일괄 발송 (즉시 `{ jobId }` 반환, 202)
- [ ] `GET /api/v1/emails/jobs/:jobId` — 진행 상황 조회
- [ ] `GET /api/v1/emails/logs` — 이력 조회 (페이징, 필터)
- [ ] `POST /api/v1/emails/templates/:id/attachments` — 업로드 (multer)
- [ ] `DELETE /api/v1/emails/templates/:id/attachments/:attachmentId`

---

## Phase 4: 프론트엔드 - 타입 & Store

### 4-1. `frontend/src/types/models.ts`

```typescript
interface AttachmentMeta {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
}

interface EmailTemplate {
  // 기존 필드 +
  attachments: AttachmentMeta[];
}

interface EmailLog { /* DB 스키마 대응 */ }
interface EmailJob { /* DB 스키마 대응 */ }
interface SendResult { success: boolean; recipient: string; error?: string; }
```

### 4-2. `useTemplateStore.ts`
- `attachments` 필드 관리 (추가/삭제, 낙관적 업데이트)

---

## Phase 5: 프론트엔드 - TemplateEditor

`frontend/src/pages/TemplateEditor.tsx` 수정:

- [ ] **첨부파일 섹션** (`components/email/AttachmentUploader.tsx` 신규)
  - 드래그 앤 드롭, 파일 목록, 전체 크기 표시
  - 18MB 권장 / 25MB 한도 경고
  - 차단된 확장자 즉시 안내

- [ ] **미리보기 강화**
  - 샘플/선택 참여자 데이터로 변수 치환
  - 미치환 변수는 빨간 배경 하이라이트

- [ ] **테스트 발송 버튼 + 모달**
  - 수신 이메일 입력 (기본값: 로그인 사용자)
  - 미리보기 → 발송 → 결과 토스트

---

## Phase 6: 프론트엔드 - 일괄 발송 (ParticipantsPage)

`frontend/src/pages/participants/ParticipantsPage.tsx` 수정:

- [ ] **선택 → 발송 흐름**
  - 체크박스 다중 선택 → "메일 발송" 버튼 활성화
  - 템플릿 선택 → 변수 자동 매핑

- [ ] **발송 확인 모달** (`components/email/SendConfirmModal.tsx` 신규)
  - 수신자 수, 템플릿명, 첨부파일 목록 명시
  - **"테스트 발송(본인)"** 과 **"실제 발송(N명)"** 색상 구분
    - 테스트: `.btn-secondary` (회색 계열)
    - 실제: `.btn-cta` (CTA 그린) + 수신자 수 강조
  - 실제 발송은 한 번 더 확인 ("정말 N명에게 발송하시겠습니까?")

- [ ] **진행률 UI**
  - jobId 폴링 (2초 간격)
  - 진행 바 + "23/50 발송 완료"
  - 완료 후 성공/실패 요약 + 실패 건 재발송 버튼

- [ ] **발송 이력 페이지** (`pages/EmailLogsPage.tsx` 신규)
  - 라우트: `/emails/logs`
  - 필터: 날짜 범위, 템플릿, 상태
  - 행 클릭 시 상세(에러 메시지)

---

## Phase 7: 검증

### 기능 테스트
- [ ] 테스트 발송 → 본인 네이버 계정 수신
- [ ] 첨부파일 1MB / 10MB / 25MB 경계 테스트
- [ ] 한글 파일명 정상 수신
- [ ] 변수 치환, 미치환 경고 표시
- [ ] 일괄 발송 10명 진행률 실시간 업데이트
- [ ] 일부 실패 시 재발송 동작
- [ ] 발송 이력 조회/필터링

### 보안/실패 테스트
- [ ] 비인증 호출 → 401
- [ ] Rate limit 초과 → 429
- [ ] `.exe` 첨부 시도 → 차단
- [ ] 25MB 초과 → 차단
- [ ] `EMAIL_DEV_MODE=true` 시 모든 메일이 본인에게만 발송

---

## 작업 진행 방식

1. **Phase 0의 사전 확인 사항 5가지**부터 사용자에게 질문
2. 답변 받은 후 Phase 0 → Phase 7 순서대로 진행
3. 각 Phase 완료 시:
   - 변경 파일 목록 보고
   - 다음 Phase로 넘어가기 전 확인 요청
4. 기존 `CompanyManagementPage`의 디자인 패턴을 참고

## 절대 하지 말아야 할 것

- 동기식 일괄 발송 구현
- 인증 미들웨어 없는 발송 API
- `bg-blue-500`, `shadow-lg` 같은 Tailwind 색상/그림자 utility 사용
- 환경변수 하드코딩
- 한 Phase가 완료되지 않은 상태에서 다음 Phase 진행
- 사용자가 5가지 사전 확인 사항에 답하기 전에 코드 작성 시작
```