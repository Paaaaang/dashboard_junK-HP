# Bug Tracking Plan & Refactoring Checklist

## 0. 🚨 [CRITICAL] DB-FE 데이터 동기화 이슈
- [x] **0-1. 데이터 표시 누락**: 실제 DB에는 데이터가 성공적으로 저장되나 FE에 반영되지 않음. (`useParticipantStore` upsert 로직 및 조인 매핑 수정 완료)

## 1. 기업 관리 페이지 (/companies)
- [x] **1-1. 기업명 편집 모드 통합**: 모달에서 '편집' 버튼 클릭 시 상단 '기업명'도 함께 편집 모드로 전환되도록 수정 완료.
- [x] **1-2. 저장 시 모달 유지**: 편집 완료 후 '저장' 시 사이드 모달이 닫히지 않고 변경 사항 즉시 확인 가능하도록 UX 개선 완료.

## 2. 데이터 매칭 및 참여자 연동 (/participants)
- [x] **1-3. 기업-참여자-교육과정 연결 오류**: 참여자가 교육 과정과 올바르게 연결되지 않는 현상 수정 완료.
- [x] **2-1. 신규 참여자 기업 연동 오류**: `/participants` 페이지에서 새로운 기업을 등록 시 참여자가 기업 페이지와 연동되지 않는 문제 수정 완료.
- [x] **2-2. 과정 연결 허위 모션**: 참여자에게 교육 과정 연결 시 '완료' 모션만 뜨고 리스트에 반영되지 않는 문제 수정 완료.

---

## 3. 🚨 [CRITICAL] 수료/미수료 상태 변경 및 중복 에러 전면 개편

**현상 요약**: 
- `400 Bad Request`: `status`를 '수료'로 변경 시 DB의 CHECK 제약 조건 (`status = '수료'` 일 때 `completion_date IS NOT NULL`) 위반으로 튕겨냄.
- `409 Conflict`: 이미 추가된 인원을 중복해서 DB에 밀어 넣으려다 에러 발생.
- **검색 로직 붕괴**: `SessionManagementDrawer` 내부에서 "기존 명단 필터링"과 "추가할 인원 검색" 상태가 꼬여서 작동하지 않음.

### ✅ 실행 완료 내역 (Checklist)

### 3-1. DB 제약 조건에 맞춘 Store 로직 수정 (`src/stores/useParticipantStore.ts`)
- [x] `bulkUpdateEnrollments` 함수: `status`를 "수료"로 업데이트할 때 `completionDate` 파라미터가 없으면 오늘 날짜를 강제로 주입하도록 로직 추가 완료.
- [x] `bulkUpdateEnrollments` 함수: `in('id', enrollmentIds)` 구문 검증 완료.

### 3-2. SessionManagementDrawer 검색/필터 분리 (`src/pages/education/SessionManagementDrawer.tsx`)
- [x] 상태 분리: 현재 명단을 필터링하는 `searchQuery`와 새로운 인원을 찾는 `addSearchQuery` 상태가 충돌하지 않도록 분리 완료.
- [x] "인원 추가 토글 활성화" 시:
  - 기존 명단을 보여주는 테이블은 숨기고, 추가 화면만 표시하도록 UX 개선 완료.
  - 이미 명단에 있는 인원은 `searchableParticipants` 검색 결과에서 필터링 및 시각적 비활성화 처리 완료.

### 3-3. 이메일 모달 500 에러 (`src/pages/participants/modals/BulkEmailModal.tsx`)
- [x] HMR (Hot Module Replacement) 로딩 실패/500 에러 방어: 이메일 모달 내 변수 매핑 로직에서 null point 에러가 발생하지 않도록 optional chaining (`?.`) 철저히 적용 완료.

### 3-4. ParticipantDrawer 개별 수료 로직 (`src/pages/participants/ParticipantDrawer.tsx`)
- [x] `ParticipantDrawer`의 개별 과정 아코디언에서 '상태 변경' 드롭다운을 통해 '수료'로 변경 시에도 `completionDate`가 정상 처리되도록 방어 로직 추가 완료.

---
# [요청] KHP Dashboard FE 폴더 정합성 점검 및 레거시 정리

## 0. 배경 (Context)

- 프로젝트: KHP Dashboard (전남대학교 K-하이테크 플랫폼 관리 시스템)
- 최근 발생한 주요 변경 사항:
  1. **DB 스키마 재설계 (Supabase)**: 테이블 구조 변경 및 정규화
  2. **FE 폴더 구조 및 컴포넌트 개편**: `src/components` (ui, layout, shared), `src/pages` (도메인별 분리: companies, education, participants), `src/stores` (Zustand) 등으로 구조화됨
- 결과적으로 다음 점검이 필요함:
  - 컴포넌트 및 상태 관리(Zustand)에서 사용하는 타입 및 스키마 정합성 확인
  - 사용되지 않는 **레거시 파일·유틸·타입 정의** 잔존 여부 파악
  - import 경로 점검, dead code 정리, 중복 컴포넌트 통합

## 1. 점검 목표 (Goals)

1. 최신 DB 스키마와 FE 코드(`src/types`, `src/api`)의 **타입/엔티티 정합성 100% 확보**
2. 사용되지 않는 컴포넌트(`src/components`), 페이지(`src/pages`), 스토어(`src/stores`)의 **안전한 제거**
3. 폴더 구조 컨벤션에 맞지 않는 파일의 **올바른 위치 재배치**
4. 점검 결과를 **추적 가능한 리포트**(Markdown 표)로 산출

## 2. 점검 기준 (Checklist Criteria)

각 파일/모듈에 대해 다음 7개 기준으로 분류·판정한다.

| No | 기준 | 판정 기호 | 처리 방침 |
|---|---|---|---|
| C1 | Supabase 현재 스키마와 일치하는 컬럼/타입을 사용하는가 | OK / MISMATCH | MISMATCH는 즉시 수정 대상 |
| C2 | `src/api/supabase.ts` 및 Zustand Store에서 참조하는 테이블/컬럼이 현존하는가 | OK / DEAD_API | DEAD_API는 신규 스키마로 매핑 또는 제거 |
| C3 | 해당 파일이 어딘가에서 import되고 있는가 | USED / ORPHAN | ORPHAN은 삭제 후보 |
| C4 | 동일 책임의 중복 컴포넌트/유틸이 존재하는가 (`src/components/ui` vs `shared`) | UNIQUE / DUPLICATE | DUPLICATE는 통합 |
| C5 | 폴더 컨벤션에 맞는 위치인가 (예: 페이지 전용 컴포넌트는 `pages/도메인/` 내에 위치) | OK / MISPLACED | MISPLACED는 이동 |
| C6 | 타입 정의(`src/types/*`)가 최신 상태인가 | OK / STALE | STALE은 재생성 및 갱신 |
| C7 | 주석·TODO·console.log 등 정리 흔적이 남았는가 | CLEAN / DIRTY | DIRTY는 정리 |

## 3. 점검 순서 (Workflow)

**원칙: 위에서 아래로, 가장자리(types/api) → 상태 관리(stores) → 안쪽(UI/pages)으로**

### Phase 1. 스키마 단일 진실 공급원(SoT) 동기화
1. `src/types/*` 폴더 내 타입 정의(`models.ts`, `index.ts`)를 Supabase 스키마와 1:1 매칭 확인
2. 필요시 `supabase gen types typescript --local > src/types/database.ts` 실행하여 타입 갱신

### Phase 2. 데이터 액세스 레이어 및 커스텀 훅
3. `src/api/supabase.ts` 내 데이터 호출 로직 점검
4. 각 도메인 폴더(`src/pages/*/hooks/`) 내 쿼리 로직 점검
5. 쿼리 빌더에서 폐기되거나 변경된 컬럼명을 현 DB 기준으로 grep 확인

### Phase 3. 상태 관리 (Zustand)
6. `src/stores/` 내 파일들 (`useAuthStore.ts`, `useCompanyStore.ts`, `useCourseStore.ts`, `useParticipantStore.ts` 등) 점검
7. 스토어 내 상태 업데이트 및 쿼리 로직이 최신 스키마를 반영하는지 확인

### Phase 4. 컴포넌트·페이지
8. 도메인별 페이지(`Dashboard`, `companies`, `education`, `participants`, `EmailLogsPage`, `TemplateEditor`) UI 점검
9. 공통 컴포넌트(`src/components/ui`, `src/components/shared`, `src/components/layout`)의 props 타입이 스키마와 일치하는지 확인
10. 도메인별 모달/드로워(`AddCompanyModal`, `CompanyDrawer`, `SessionManagementDrawer` 등) 내부 폼 필드 점검

### Phase 5. 레거시·고아 파일 제거
11. 정적 분석 도구를 활용하여 ORPHAN 파일 검출 (예: `npx knip`, TypeScript 분석 등)
12. `src/utils/` (`participantUtils.ts`, `templateVariables.ts` 등) 및 `src/constants/` 내 미사용 변수/함수 정리
13. 검출 결과를 바탕으로 사용되지 않는 컴포넌트 및 로직 삭제

### Phase 6. 정리·검증
14. `tsc --noEmit` 타입 체크 통과
15. `eslint .` (설정된 경우) 린트 통과
16. `npm run build` 성공 확인

## 4. 산출물 (Deliverables)

다음 파일들을 생성·갱신해줘.

1. **`docs/audit/FE_AUDIT_REPORT.md`** — 점검 결과 표
   - 컬럼: 경로 / 종류(component/store/type/hook...) / 판정(C1~C7) / 조치(KEEP/FIX/MOVE/MERGE/DELETE) / 비고
2. **`docs/audit/CLEANUP_PLAN.md`** — 단계별 정리 계획 및 진행 상황 추적
3. 실제 코드 변경 내역 (순차적으로 적용)

## 5. 작업 제약 (Constraints)

- 한 번에 모두 바꾸지 말고 **Phase 단위로 작업 분리**
- 삭제 후보 파일은 확실한 미사용 확인 후 제거
- UI/UX 가이드라인(`GEMINI.md` 및 `design-system/khp-dashboard/MASTER.md`)을 준수하며 컴포넌트 정리 (예: "Box-in-Box" 지양, Tailwind v4 기준 등)

## 6. 시작 지시

먼저 다음을 출력하고 승인받은 뒤 실제 수정을 진행해줘.

**Step 0 산출물**
- Phase 1~6 각 단계에서 **검색·점검할 대상 파일 후보 목록** (경로만)
- 가장 영향이 크거나 의심되는 Top 10 파일 (타입 정의, 주요 스토어, 공통 레이아웃 등)

이후 승인을 기다린 다음 Phase 1부터 순차 진행.