# Design System Inspired by Automation Dashboard

## 1. Visual Theme & Atmosphere

이 대시보드는 AI나 브랜딩보다 **운영 가시성**이 우선이다. 사용자는 페이지에 들어오자마자 시스템이 정상인지, 어떤 작업이 진행 중인지, 어디서 막혔는지를 빠르게 파악해야 한다. 따라서 첫 인상은 화려함보다 안정감, 그리고 정보 밀도에 대한 자신감이어야 한다.

전체 분위기는 엔터프라이즈 콘솔에 가깝다. 밝은 배경 위에 카드와 표, 상태 배지가 정돈된 그리드로 배치되고, 중요 이벤트는 색과 아이콘으로 빠르게 식별된다. 자동화 시스템의 성격상 “예쁜 화면”보다 “읽기 쉬운 화면”이 더 중요하다.

이 UI는 홈 화면이라기보다 **제어실**이다. KPI는 상단에, 핵심 차트는 중앙에, 최근 실행과 실패 목록은 하단이나 우측에 배치해 시선 흐름을 단순하게 유지한다.

**Key Characteristics:**
- 상태 요약이 첫 화면에서 바로 보여야 함.
- KPI 카드 + 차트 그리드 + 실행 로그의 3단 구조.
- 알림, 실패, 지연 상태를 명확히 구분.
- 복잡한 설정은 숨기고, 자주 쓰는 액션만 노출.
- 한 화면에서 “이상 없음 / 주의 / 실패”가 즉시 읽혀야 함.

## 2. Color Palette & Roles

### Primary Colors

**Deep Navy** (`#1e3a8a`)
- Default: `#1e3a8a`
- Hover: `#1e40af`
- Active: `#1d4ed8`
- Disabled: `rgba(30, 58, 138, 0.4)`
- Use: 헤더 배경, 사이드바, 주요 액션 버튼, 강조 영역
- Light Mode: 신뢰감 있는 어두운 톤
- Dark Mode: 더 밝은 Navy(`#3b82f6`)로 대체

**Slate / Cool Gray** (`#F7F8FA`)
- Default: `#F7F8FA`
- Hover: `#eef2f7`
- Active: `#e5e7eb`
- Subtle: `#F3F4F6`
- Use: 페이지 배경, 보조 패널, 테이블 헤더, 비활성 영역

**White** (`#FFFFFF`)
- Use: 카드 배경, 읽기 영역, 주 콘텐츠 바탕
- Shadow (Light Mode): `0 1px 3px rgba(0,0,0,0.1)`, `0 4px 16px rgba(0,0,0,0.06)`
- Shadow (Dark Mode): `0 4px 16px rgba(0,0,0,0.3)`

### Semantic Colors (상태 신호)

**Success Green** (`#16A34A`)
- Default: `#16A34A`
- Hover: `#15803d`
- Active: `#166534`
- Disabled: `rgba(22, 163, 74, 0.4)`
- Light Background: `#ECFDF5` (밝은 녹색 배경)
- Dark Background: `#064e3b` (다크 모드 배경)
- Use: 성공 완료, 정상 실행, 연결 활성화, 작업 성공, 확인 필수 지표
- Badge: 녹색 배경 + 어두운 녹색 텍스트

**Warning Amber** (`#F59E0B`)
- Default: `#F59E0B`
- Hover: `#d97706`
- Active: `#b45309`
- Disabled: `rgba(245, 158, 11, 0.4)`
- Light Background: `#FFFBEB` (밝은 호박색 배경)
- Dark Background: `#78350f` (다크 모드 배경)
- Use: 지연 작업, 부분 실패, 확인 필요, 주의 필요 상태
- Badge: 호박색 배경 + 어두운 갈색 텍스트

**Error Red** (`#DC2626`)
- Default: `#DC2626`
- Hover: `#b91c1c`
- Active: `#991b1b`
- Disabled: `rgba(220, 38, 38, 0.4)`
- Light Background: `#FEF2F2` (밝은 빨강 배경)
- Dark Background: `#7f1d1d` (다크 모드 배경)
- Use: 실패, 중단, 즉시 조치 필요, 오류 상태, 삭제 액션
- Badge: 빨강 배경 + 어두운 빨강 텍스트

**Info Blue** (`#2563EB`)
- Default: `#2563EB`
- Hover: `#1d4ed8`
- Active: `#1e40af`
- Disabled: `rgba(37, 99, 235, 0.4)`
- Light Background: `#EFF6FF` (밝은 파랑 배경)
- Dark Background: `#1e3a8a` (다크 모드 배경)
- Use: 선택 상태, 링크, 보조 강조, 정보 메시지, 진행 중 상태
- Badge: 파랑 배경 + 흰색 텍스트

### Neutral Text Colors

| Role | Light Mode | Dark Mode | Use |
|------|-----------|-----------|-----|
| Primary Text | `#111827` | `#F0F4F8` | 주 텍스트, 제목, 라벨 |
| Secondary Text | `#6B7280` | `#B0BAC9` | 보조 설명, 메타 정보, 타임스탐프 |
| Tertiary Text | `#9CA3AF` | `#808F9E` | 비활성 텍스트, 플레이스홀더 |
| Disabled Text | `#D1D5DB` | `#4B5563` | 비활성 요소, 강제 비활성 상태 |
| Inverse Text | `#FFFFFF` | `#111827` | 어두운 배경 위 텍스트 / 밝은 배경 위 텍스트 |

### Surface Roles (배경 영역)

| Role | Light Mode | Dark Mode | Use |
|------|-----------|-----------|-----|
| Page Background | `#F7F8FA` | `#0F172A` | 페이지 최상단 배경 |
| Card Surface | `#FFFFFF` | `#1E293B` | 카드, 모달, 컨테이너 배경 |
| Subtle Surface | `#F3F4F6` | `#1A202C` | 미묘한 강조, 호버 상태 |
| Active Surface | `#EAF2FF` | `#1E3A8A` | 선택된 행, 활성 영역 |
| Overlay | `rgba(15, 23, 42, 0.5)` | `rgba(255, 255, 255, 0.1)` | 모달 배경, 오버레이 |

### Button States (상호작용)

**Primary Button**
- Default: `#2563EB` bg, `#FFFFFF` text
- Hover: `#1d4ed8` bg
- Active: `#1e40af` bg
- Disabled: `#D1D5DB` bg, `#9CA3AF` text
- Focus: 2px `#2563EB` outline, 4px offset
- Loading: opacity 0.7 + spinner overlay

**Secondary Button**
- Default: `#F3F4F6` bg, `#374151` text
- Hover: `#EBF2F7` bg
- Active: `#E5E7EB` bg
- Disabled: `#E5E7EB` bg, `#9CA3AF` text
- Focus: 2px `#2563EB` outline

**Danger Button**
- Default: `#DC2626` bg, `#FFFFFF` text
- Hover: `#b91c1c` bg
- Active: `#991b1b` bg
- Disabled: `rgba(220, 38, 38, 0.4)` bg
- Focus: 2px `#DC2626` outline

### Key Principle
대시보드에서는 색이 장식이 아니라 **의미**여야 한다. 특히 자동화 상태는 숫자보다 상태 색과 배지로 먼저 인식되므로, semantic color는 일관되게 유지해야 한다. 모든 색상은 Light Mode와 Dark Mode에서 충분한 명도 대비(*WCAG AA* 4.5:1 이상)를 유지해야 한다.

## 3. Typography Rules

### Font Family

**Korean UI (제국 모든 한글 UI)**
```css
font-family: 'Pretendard', 'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
font-variant-numeric: tabular-nums;
```
- `Pretendard`: 높은 가독성, 한글 최적화, 가변 폰트 지원
- `tabular-nums`: 숫자와 표의 정렬을 위해 필수
- Fallback: 시스템 폰트로 안정성 확보

**English / English Mixing**
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif;
font-variant-numeric: tabular-nums;
font-feature-settings: 'ss01';
```
- `Inter`: 높은 레그 안정성, 모니터형 대시보드 최적
- 숫자 집약적 UI이므로 `tabular-nums` 필수

**숫자와 표가 매우 많기 때문에 `tabular-nums` (고정폭 숫자)를 지원하는 폰트 구성이 필수다.** 가변폭 숫자는 테이블의 가독성을 방해한다.

### Hierarchy

| Role | Size | Weight | Line Height | Letter Spacing | Use | Condition |
|------|------|--------|-------------|----------------|-----|----------|
| Page Title | 28px | 700 | 1.2 | -0.02px | 대시보드 제목 | 한 페이지에 1~2개만 |
| Section Title | 18px | 600 | 1.3 | -0.01px | 카드, 차트, 로그 섹션 제목 | 각 섹션의 헤더 |
| KPI Value | 32px | 700 | 1.1 | 0px | 핵심 수치 (처리량, 성공률) | 절대 문장에 사용 금지 |
| KPI Label | 13px | 500 | 1.4 | 0px | 지표명 | KPI Value 바로 아래 |
| Body | 14px | 400 | 1.55 | -0.01px | 일반 설명, 라벨, 상태 메시지 | 표 외 주요 텍스트 |
| Table Text | 13px | 400 | 1.45 | 0px | 데이터 테이블, 리스트 항목 | 표 내부 데이터만 |
| Meta / Timestamp | 12px | 400 | 1.4 | 0px | 실행 시각, 상태 설명, 보조 정보 | 회색 텍스트로 처리 |
| Badge Text | 12px | 600 | 1.0 | 0px | 상태 배지 내 텍스트 | 가운데 정렬, 최소 12px 높이 |
| Caption | 11px | 400 | 1.4 | 0px | 차트 범례, 주석 | 옅은 회색으로 표시 |

### Key Principles for Dashboard Typography

1. **숫자가 먼저 보이게**: KPI Value는 라벨보다 2배 이상 크게, bold 처리
2. **제목은 짧고 명확하게**: 2단어 이상 피하기, 동사 중심
3. **표는 가독성 중심**: 줄바꿈 최소화, 행 높이 최소 40px, 숫자 우정렬
4. **타임스탐프는 보조 정보**: 항상 Meta/Secondary 텍스트 색상 (`#6B7280`)
5. **과한 굵기보다 대비와 위치**: 색, 크기, 위치로 위계 설정, weight 300~500만 사용
6. **실시간 데이터 강조**: 업데이트된 값은 1초간 하이라이트
7. **오류/경고는 아이콘 + 색 + 텍스트**: 텍스트만으로는 절대 불충분

**자동화 대시보드의 텍스트는 설명문이 아니라 운영 신호다.** 문장형 카피보다 짧은 레이블과 빠른 스캐닝이 가능한 타이포그래피가 필수다.

## 4. Component Stylings

### KPI Cards

**States**
- **Default**: 
  - Background: `#FFFFFF` (Light) / `#1E293B` (Dark)
  - Border: `1px solid #E5E7EB` (Light) / `1px solid #334155` (Dark)
  - Shadow: `0 1px 3px rgba(0,0,0,0.1)`
  - Radius: `14px`
  - Padding: `16px`
- **Hover**: 
  - Background: `#F9FAFB` (Light) / `#334155` (Dark)
  - Border: `1px solid #D1D5DB`
  - Cursor: pointer (선택 가능한 경우)
- **Active (클릭됨)**:
  - Background: `#EAF2FF`
  - Border: `2px solid #2563EB`
  - Outline: `3px solid rgba(37,99,235,0.1)`
- **Loading**:
  - Background: unchanged
  - Opacity: `0.6`
  - Overlay: spinning loader animation

**Structure**
```
[Label] {font: 13px, weight 500, color: #6B7280}
[Value] {font: 32px, weight 700, color: #111827, tabular-nums}
[Delta] {font: 12px, 색상은 상태별 (↑ green, ↓ red)}
[Sparkline] {미니 라인 차트, 높이 40px, 색상 semantic}
```

**Use Case**: 처리량, 성공률, 대기열, 실패율

### Status Badge

**Success Badge**
- Default: `#ECFDF5` bg, `#065F46` text
- Dark Mode: `#064e3b` bg, `#ECFDF5` text
- Icon: ✓ checkmark (선택)
- Radius: `999px` (pill shape)
- Padding: `6px 10px`
- Font: 12px, weight 600
- Use: 작업 완료, 정상 실행, 연결 활성화

**Warning Badge**
- Default: `#FFFBEB` bg, `#B45309` text
- Dark Mode: `#78350f` bg, `#FCD34D` text
- Icon: ⚠ warning (선택)
- Radius: `999px`
- Padding: `6px 10px`
- Font: 12px, weight 600
- Use: 지연, 부분 실패, 확인 필요

**Error Badge**
- Default: `#FEF2F2` bg, `#991b1b` text
- Dark Mode: `#7f1d1d` bg, `#FECACA` text
- Icon: ✕ X mark (선택)
- Radius: `999px`
- Padding: `6px 10px`
- Font: 12px, weight 600
- Use: 실패, 중단, 즉시 조치 필요

**Neutral Badge**
- Default: `#F3F4F6` bg, `#6B7280` text
- Dark Mode: `#374151` bg, `#D1D5DB` text
- Radius: `999px`
- Padding: `6px 10px`
- Font: 12px, weight 600
- Use: 대기 중, 미설정, 정보 페이지

### Primary Action Button

**States**
- **Default**:
  - Background: `#2563EB`
  - Text: `#FFFFFF`
  - Radius: `10px`
  - Height: `40px` to `44px`
  - Padding: `10px 16px`
  - Box Shadow: `0 1px 3px rgba(0,0,0,0.1)`
  - Font: 14px, weight 500
- **Hover**: Background `#1d4ed8`, shadow increased
- **Active**: Background `#1e40af`, transform scale(0.98)
- **Disabled**: Background `#D1D5DB`, text `#9CA3AF`, cursor not-allowed
- **Loading**: opacity 0.7, spinner overlay, 클릭 비활성화
- **Focus**: 2px `#2563EB` outline, 4px offset

**Use**: 실행, 재시도, 배포, 동기화, 저장

### Secondary Button

**States**
- **Default**:
  - Background: `#F3F4F6` (Light) / `#1E293B` (Dark)
  - Border: `1px solid #D1D5DB` (Light) / `1px solid #475569` (Dark)
  - Text: `#374151` (Light) / `#E2E8F0` (Dark)
  - Radius: `10px`
  - Height: `40px` to `44px`
- **Hover**: Background `#EBEBF0` + border darker
- **Active**: Background `#E5E7EB`, shadow inset
- **Disabled**: Background `#E5E7EB`, text `#9CA3AF`
- **Focus**: 2px `#2563EB` outline

**Use**: 보기, 필터, 내보내기, 취소, 뒤로

### Danger Action Button

**States**
- **Default**: Background `#DC2626`, text `#FFFFFF`
- **Hover**: Background `#b91c1c`
- **Active**: Background `#991b1b`
- **Disabled**: Background `rgba(220, 38, 38, 0.4)`, text `#9CA3AF`
- **Focus**: 2px `#DC2626` outline
- **Confirmation**: 클릭 후 "정말 삭제?" 재확인 필수

**Use**: 중지, 삭제, 실패 작업 정리, 되돌릴 수 없는 액션

### Table

**Light Mode**
- Header background: `#F9FAFB`
- Header text: `#6B7280`, weight 600, 13px
- Row background: `#FFFFFF`
- Row border: `1px solid #EEF2F7` (행 구분)
- Row height: `44px` (권장, 최소 40px)
- Hover background: `#F3F4F6`
- Active/Selected row: `#EAF2FF` with left `3px solid #2563EB` border
- Text alignment: 좌측(기본), 숫자는 우측, 중앙 정렬 금지
- Font: Table Text (13px, 400 weight, tabular-nums)

**Dark Mode**
- Header background: `#1A202C`
- Header text: `#B0BAC9`, weight 600
- Row background: `#1E293B`
- Row border: `1px solid #334155`
- Hover background: `#334155`
- Active row: `#1E3A8A` with `#3B82F6` left border

**Interaction**
- 전체 행 클릭 가능 (커서: pointer)
- 호버 시 배경 변경 + 약간의 elevation shadow 추가
- 선택 시 좌측 thick border + 배경색 변경
- 체크박스 (있는 경우): 행 선택 시 자동 체크
- 스크롤: 헤더는 sticky 위치, 행은 스크롤 가능

**Use Case**: 작업 목록, 최근 실행, 사용자 기록, 로그, 설정값

### Charts & Visualizations

**Line Chart (추세)**
- Use: 성공률 변화, 처리량, 응답 시간 트렌드
- Color: Primary Blue (`#2563EB`), Secondary Gray (`#9CA3AF`)
- Stroke: 2px, smooth curves (not angular)
- Hover: Data point에 circle marker 표시, 값 tooltip
- Label: 좌측 끝과 우측 끝의 현재값만 표시 (읽기 쉬운 범위만)
- 나머지 값은 hover tooltip으로 제공

**Bar Chart (분포)**
- Use: 작업 유형별 분포, 실패 원인 분류, 시간대별 비교
- Color: Semantic colors (Success/Warning/Error) 또는 순차 팔레트
- Bar height: 값에 비례
- Hover: 값 표시, 약간의 밝기 증가
- x축 라벨: 회전 금지 (세로 읽기), 필요시 약자 사용

**Area Chart (누적)**
- Use: 누적 실행량, 상태별 시간대 분포
- Color: 각 영역별 semantic color (투명도 70%)
- Hover: 각 영역의 값을 구분 색상으로 표시
- Label: 영역 끝값만 표시

**Donut Chart (비율)**
- Use: 상태 비율 (성공/경고/실패), 채널별 비중
- Color: 각 상태별 semantic color
- Center text: 총 값 또는 가장 큰 비중 표시
- Label: 범례로 처리, 차트 위에 % 표시 금지
- Hover: 해당 영역 하이라이트, 정확한 값 tooltip

**Key Principle**: 차트의 모든 라벨은 읽기 쉬운 범위만 노출하고, 상세 정보는 tooltip 또는 우측 패널에서 제공한다. 차트 위에 장황한 설명이나 주석을 올리지 않는다.

## 5. Layout Principles

### Recommended Layout
- **Top Rail**: 페이지 제목, 날짜 범위, 전역 필터, 주요 액션.
- **KPI Row**: 3~6개의 핵심 지표.
- **Main Grid**: 트렌드 차트, 상태 분포, 작업 큐.
- **Side / Lower Panel**: 최근 실행 로그, 오류 목록, 알림.
- **Detail Drawer**: 특정 작업 클릭 시 상세 정보.

이 구조는 대시보드 UX에서 가장 흔하고 효과적인 패턴이다. 상단은 판단, 중앙은 분석, 하단은 실행 내역이라는 식으로 질문의 우선순위를 맞춘다 [web:35][web:38][web:41].

### Spacing System
- Base unit: 8px.
- 핵심 간격: 8, 12, 16, 24, 32, 40, 48px.
- 카드 내부 패딩은 16~24px.
- 모듈 간 간격은 24~32px.

### Grid & Container
- Max width: `1440px`.
- Desktop grid: 12 columns.
- KPI 영역은 4열 또는 6열 구성.
- 차트와 로그는 2:1 또는 3:2 비율이 적합하다.
- 모바일에서는 1열 스택으로 전환한다.

### Information Hierarchy
- 첫 줄: 시스템 상태.
- 둘째 줄: 핵심 KPI.
- 셋째 줄: 원인 분석용 차트.
- 넷째 줄: 작업 로그와 예외 처리.

대시보드는 “많이 보여주는 것”보다 “먼저 보여줄 것”을 정하는 작업이다. 시선 흐름을 F-패턴이나 top-rail 패턴처럼 상단 우선 구조로 구성하는 것이 좋다 [web:38][web:41].

## 6. Depth & Elevation (깊이감과 레이어)

### Shadow System

| Level | Treatment | Light Mode | Dark Mode | Use |
|-------|-----------|-----------|-----------|-----|
| Flat (0) | No shadow | none | none | 표, 배경, 일반 콘텐츠 |
| Subtle (1) | `0 1px 3px` | `rgba(0,0,0,0.1)` | `rgba(0,0,0,0.3)` | 버튼, Input, 미묘한 elevation |
| Soft Card (2) | `0 4px 16px` | `rgba(0,0,0,0.06)` | `rgba(0,0,0,0.2)` | KPI 카드, 차트 카드, 요약 |
| Floating (3) | `0 10px 24px` | `rgba(0,0,0,0.10)` | `rgba(0,0,0,0.3)` | 드로어, 팝오버, 플로팅 메뉴 |
| Critical (4) | Strong outline | `3px solid #DC2626` | `2px solid #FCA5A5` | 오류 상태, 주의 영역, 중단 경고 |
| Focus | Outline ring | `2px solid #2563EB`, offset 4px | Same | 키보드 포커스, 탭 네비게이션 |

### Elevation Principle

- **최소 섀도 철학**: 섀도는 레이어 분리를 위해서만 사용, 장식 목적 금지
- **색과 테두리 우선**: 섀도보다 배경색 대비와 테두리로 레이어 구분
- **빠른 인지**: 자동화 대시보드에서는 과한 깊이감보다 **가시성과 정보 전달**이 훨씬 중요
- **다크 모드 고려**: 다크 모드에서는 섀도가 더 두드러지므로 투명도 높임

### Critical State Styling

**오류 / 위험 상태**
- 빨강 `#DC2626` 또는 `#991b1b` 사용
- 3px solid border 또는 background fill
- 아이콘 ✕, ⚠ 함께 표시
- Text: bold, 빨강 또는 어두운 빨강
- Animation: 약간의 pulse effect (1초 주기, 2회)

**Focus State**
- 2px solid `#2563EB` outline
- 4px offset (외부)
- 모든 interactive element에 필수
- 다크 모드에서는 outline 밝게 조정 (`#60A5FA`)

## 7. Animation & Motion (대시보드 매동)

### Transitions (제어된 변화)

**Standard Transitions**
```css
/* 메뉴 또는 배경 변경 */
transition: background-color 0.15s ease-out, border-color 0.15s ease-out;

/* 버튼 예시 */
button:hover { 
  background-color: var(--color-primary-hover);
  transition: all 0.2s ease-out;
}

/* 데이터 넣나운 업데이트 */
transition: all 0.08s ease-out;
```

| Case | Duration | Easing | Use |
|------|----------|--------|-----|
| 일반 텍스트, 비지기 | 150ms | ease-out | 버튼 hover, 비지기 close |
| 차트, 데이터 업데이트 | 200-300ms | ease-out | 차트 낙나운 변경 |
| 모달 열기 | 300ms | ease-in-out | 권양으로 드르날 |
| 로딩 스피너 | 2s | linear | 강조된 짧은 스핀 |
| 대독 알림 (Pulse) | 2s | ease-in-out | 오류/중단 경고 |

### Impact Animations (직관적 부고 영향)

**Data Update Highlight**
- 모적: KPI value 업데이트 시 즈거임 하이라이트
- Color: `rgba(37, 99, 235, 0.3)` → transparent
- Duration: 800ms ease-out
- Effect: 각이 강조된 대독되고, 서서히 유낼된다

**Status Change Animation**
- 세대: 감소→열음→나제 비 비방 연크
- 립: Complete 상태로 변갈 때 scale: 1.0 → 1.08 → 1.0
- Duration: 400ms
- Effect: 유저에게 직관적 분식 제공

## 8. Dark Mode Color Scheme

### Dark Mode 마스터 색상

| Component | Light Mode | Dark Mode | Notes |
|-----------|-----------|-----------|-------|
| **Page Background** | `#F7F8FA` | `#0F172A` | 다크 동안 다른 느낌, 4px 더 다운 다운 |
| **Card/Surface** | `#FFFFFF` | `#1E293B` | 다크 모드에서 다른 남은 다운 |
| **Card Hover** | `#F9FAFB` | `#334155` | 카드 hover 상태 |
| **Subtle Surface** | `#F3F4F6` | `#1A202C` | Disabled, 비활성 영역 |
| **Active Surface** | `#EAF2FF` | `#1E3A8A` | 선택된 쇼트, 활성 요근 |
| **Primary Text** | `#111827` | `#F0F4F8` | 대었 텍스트 |
| **Secondary Text** | `#6B7280` | `#B0BAC9` | 메타, 보조 |
| **Tertiary Text** | `#9CA3AF` | `#808F9E` | 비활성, placeholder |
| **Disabled Text** | `#D1D5DB` | `#4B5563` | 비활성 완전 |
| **Border** | `#E5E7EB` | `#334155` | 카드, input 테두리 |
| **Strong Border** | `#D1D5DB` | `#475569` | 강조 중심빈 테두리 |

### Semantic Colors in Dark Mode

**Success Green**
- Light: `#ECFDF5` bg, `#065F46` text
- Dark: `#064e3b` bg, `#ECFDF5` text

**Warning Amber**
- Light: `#FFFBEB` bg, `#B45309` text
- Dark: `#78350f` bg, `#FCD34D` text

**Error Red**
- Light: `#FEF2F2` bg, `#991b1b` text
- Dark: `#7f1d1d` bg, `#FECACA` text

**Info Blue**
- Light: `#EFF6FF` bg, `#0c4a6e` text
- Dark: `#1e3a8a` bg, `#93c5fd` text

### Dark Mode Activation

```css
/* CSS Variable Approach (권장) */
:root {
  --bg-page: #F7F8FA;
  --bg-card: #FFFFFF;
  --text-primary: #111827;
  --text-secondary: #6B7280;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg-page: #0F172A;
    --bg-card: #1E293B;
    --text-primary: #F0F4F8;
    --text-secondary: #B0BAC9;
  }
}

body {
  background-color: var(--bg-page);
  color: var(--text-primary);
}
```

### Dark Mode 되돌릴 유도보단 기로

- 단정 스위치 : 단지 `prefers-color-scheme: dark` 지원
- 사용자 선택지나 Local Storage로 좋아하는 모드 기억
- 단식 스스템: 2초 이넘에는 dark mode 적용 앞따 처리 (flash 방지)

### Desktop
- 표준 해상도에서 가장 많은 정보를 보여준다.
- 다중 차트, 로그, 필터를 한 화면에서 병렬로 배치한다.
- 상세 패널을 우측에 고정할 수 있다.

### Tablet
- KPI는 2열 또는 3열.
- 차트는 세로로 쌓아도 되지만 필터는 상단에 유지한다.
- 테이블은 핵심 열만 노출하고 나머지는 접는다.

### Mobile
- KPI를 카드 스택으로 전환한다.
- 테이블은 리스트형으로 축약한다.
- 필터는 bottom sheet 또는 drawer로 처리한다.
- 긴 로그는 요약 + 상세 보기 구조로 바꾼다.

### Touch Targets
- 버튼과 배지는 최소 `44px` 높이.
- 테이블 행 전체를 클릭 가능하게 하는 것이 좋다.
- 드롭다운과 날짜 선택기는 손가락 입력을 고려해 넓게 만든다.

모바일에서는 대시보드 전체를 축소해서 보여주기보다, “모니터링용 요약판”으로 재해석하는 편이 좋다 [web:41][web:38].

## 9. Agent Prompt Guide

### Quick Style Reference
- Background: `#F7F8FA`
- Surface: `#FFFFFF`
- Border: `#E5E7EB`
- Primary: `#2563EB`
- Success: `#16A34A`
- Warning: `#F59E0B`
- Error: `#DC2626`
- Text: `#111827`
- Muted Text: `#6B7280`

### Example Component Prompts
- “운영형 자동화 대시보드 UI를 만들어줘. 상단에 상태 요약, 그 아래 KPI 카드 4개, 가운데 추세 차트 2개, 하단에 최근 실행 로그 테이블을 배치해줘.”
- “AI가 아닌 자동화 시스템 대시보드 스타일로, 차분한 네이비와 화이트 팔레트, 명확한 성공/경고/실패 배지, 읽기 쉬운 표 중심 디자인으로 구성해줘.”
- “필터가 많은 엔터프라이즈 대시보드를 설계해줘. 전역 필터는 상단 고정, 핵심 숫자는 첫 화면, 상세 내역은 우측 드로어로 분리해줘.”

### Design Principles
1. 첫 화면은 설명보다 상태가 먼저다.
2. 숫자보다 이상 징후가 더 빨리 보여야 한다.
3. 작업 흐름은 버튼이 아니라 구조로 이해돼야 한다.
4. 필터는 숨기지 말고 항상 보이게 한다.
5. 자동화 대시보드는 “관찰”과 “조치”가 한 화면에서 이어져야 한다.
### Quick CSS Examples

**KPI Card**
```css
.kpi-card {
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
  border-radius: 14px;
  padding: 16px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.06);
  transition: all 0.15s ease-out;
  cursor: pointer;
}
.kpi-card:hover {
  background-color: #F9FAFB;
  border-color: #D1D5DB;
}
.kpi-value {
  font-size: 32px;
  font-weight: 700;
  color: #111827;
  font-variant-numeric: tabular-nums;
}
```

**Status Badge**
```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 600;
}
.badge-success { background: #ECFDF5; color: #065F46; }
.badge-warning { background: #FFFBEB; color: #B45309; }
.badge-error { background: #FEF2F2; color: #991b1b; }
```

**Primary Button**
```css
.btn-primary {
  background: #2563EB;
  color: #FFFFFF;
  border: none;
  border-radius: 10px;
  padding: 10px 16px;
  height: 40px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease-out;
}
.btn-primary:hover {
  background: #1d4ed8;
  box-shadow: 0 4px 12px rgba(37,99,235,0.3);
}
.btn-primary:active {
  transform: scale(0.98);
}
.btn-primary:focus-visible {
  outline: 2px solid #2563EB;
  outline-offset: 4px;
}
```

**Data Table**
```css
.data-table {
  width: 100%;
  border-collapse: collapse;
  background: #FFFFFF;
}
.data-table thead {
  background: #F9FAFB;
  border-bottom: 1px solid #EEF2F7;
}
.data-table th {
  font-size: 13px;
  font-weight: 600;
  color: #6B7280;
  padding: 12px 16px;
  text-align: left;
}
.data-table tbody tr {
  border-bottom: 1px solid #EEF2F7;
  transition: background-color 0.15s ease-out;
}
.data-table tbody tr:hover {
  background-color: #F3F4F6;
}
.data-table td {
  font-size: 13px;
  color: #374151;
  padding: 12px 16px;
  font-variant-numeric: tabular-nums;
}
```

**Dark Mode Support**
```css
@media (prefers-color-scheme: dark) {
  .kpi-card {
    background: #1E293B;
    border-color: #334155;
  }
  .kpi-value {
    color: #F0F4F8;
  }
  .data-table {
    background: #1E293B;
  }
  .data-table th {
    background: #1A202C;
    color: #B0BAC9;
  }
  /* 나머지 다크 모드 색상 적용 */
}
```

## 10. Do's and Don'ts (대시보드 중점 최종 체크리스트)

### Do ✓

1. **KPI는 상단에서 바로 보이게 배치한다.**
   - 페이지 로드 시 스크롤 없이 핵심 수치가 보여야 함
   - 4~6개 카드를 한 줄에 배치

2. **성공/경고/실패 상태를 색과 배지로 명확히 구분한다.**
   - 텍스트만으로는 절대 불충분
   - semantic color (green/amber/red)는 일관되게 유지
   - 아이콘 + 색 + 배지 조합 필수

3. **실행 로그는 시각적으로 밀도가 높아도 읽기 쉽게 만든다.**
   - 행 높이 최소 40px 유지
   - 숫자는 tabular-nums로 우정렬
   - 상태는 왼쪽에 배지, 타임스탐프는 오른쪽에

4. **필터는 숨기지 말고 항상 현재 상태가 보이게 한다.**
   - 필터 패널은 상단 고정 또는 왼쪽 사이드바
   - 활성 필터는 배지로 표시
   - "필터 초기화" 버튼 항상 노출

5. **숫자 변화량은 절대값과 함께 보여준다.**
   - KPI Delta: "↑ 12.5%" 또는"+1,234"
   - 실시간 업데이트는 1초간 하이라이트
   - Sparkline 미니 차트로 추세 표시

6. **다크 모드를 처음부터 지원 설계한다.**
   - Light/Dark 모두에서 WCAG AA 명도 대비 확보
   - CSS Variable로 색상 통합 관리

7. **Accessibility를 무시하지 않는다.**
   - 모든 interactive element에 focus ring 적용
   - 키보드 tab 네비게이션 지원
   - ARIA labels 추가 (스크린 리더 지원)

8. **상태 변화는 부드러운 애니메이션으로 표시한다.**
   - 데이터 업데이트: 150-200ms transition
   - 로딩 상태: spinner 또는 skeleton
   - 에러/경고: 1초 pulse effect

### Don't ✕

1. **랜딩 페이지처럼 감성적인 히어로 섹션을 쓰지 않는다.**
   - 대시보드는 제어실이지 갤러리가 아님
   - 큰 사진이나 비디오 배경 금지
   - 첫 화면은 정보로 가득 차야 함

2. **너무 많은 컬러를 사용하지 않는다.**
   - Semantic color 3가지 (success/warning/error) + primary blue
   - 5개 이상의 강조색 사용 금지
   - 회색 톤으로 hierarchy 표현

3. **차트 위에 장황한 설명문을 올리지 않는다.**
   - 차트는 시각적으로 명확해야 함
   - 설명이 필요하면 tool tip이나 우측 텍스트 패널 사용
   - 차트 제목은 짧게 (5단어 이내)

4. **중요 액션을 메뉴 깊숙이 숨기지 않는다.**
   - 재시도, 중지, 동기화 버튼은 테이블 행이나 카드 내부에 노출
   - 3단계 이상의 sub-menu 금지
   - 자주 쓰는 액션은 primary button 사용

5. **동일한 상태에 다른 색을 섞어 혼동시키지 않는다.**
   - "실패"는 항상 red 계열
   - "경고"는 항상 amber 계열
   - 색이 바뀌면 사용자가 상태를 오인함

6. **Disabled state를 명확히 하지 않으면 안 된다.**
   - Disabled 원소: opacity 0.5 + cursor not-allowed
   - disabled text color: `#9CA3AF` (회색)
   - 왜 disabled인지 tooltip 제공

7. **과한 섀도나 gradients를 남용하지 않는다.**
   - 섀도는 최대 2~3단계만 사용
   - 그라디언트 배경은 자동화 대시보드에 어울리지 않음
   - 배경은 solid color만 사용

8. **모바일에서 데이터를 무리하게 축소하지 않는다.**
   - 테이블은 리스트 형식으로 재구성
   - 숫자는 줄 바꿈없이 한 줄에 (6자리 이내)
   - 필터는 bottom sheet로 처리

9. **응답성 없는 고정 너비 디자인을 만들지 않는다.**
   - 반응형 그리드 (12 columns) 필수
   - 모바일/태블릿/데스크톱 3가지 레이아웃 필수
   - max-width 1440px 설정

10. **실시간 업데이트 없이 대시보드라 하지 않는다.**
    - 자동 refresh 주기 (30초~5분) 설정
    - 업데이트된 값은 강조 (하이라이트 + 아이콘)
    - WebSocket 또는 polling으로 실시간 데이터 전송

---

## 11. Summary: Apple과의 주요 차이점

| 항목 | Apple Design | Automation Dashboard |
|------|-------------|---------------------|
| **목표** | 제품 판매 (감정 중심) | 운영 가시성 (정보 중심) |
| **색상** | 1가지 accent (blue) | 3가지 semantic (green/amber/red) |
| **타이포그래피** | 영율 + 비율 | 밀도 중심, tabular-nums 필수 |
| **컴포넌트 상태** | 간단 (hover/active) | 자세함 (loading/disabled/error 포함) |
| **애니메이션** | 장식적 | 정보 전달 중심 |
| **다크 모드** | 선택사항 | 필수 |
| **레이아웃** | 여유로운 공간 | 정보 집약도 높음 |
| **Accessibility** | 부분적 | 완전 지원 필수 |

**핵심**: 자동화 대시보드는 Apple의 미니멀리즘 철학을 참고하되, 정보 가시성과 운영 신호 전달에 모든 디자인이 복무해야 한다.