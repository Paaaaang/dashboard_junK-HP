# Design System Inspired by AI ONI JNU

## 1. Visual Theme & Atmosphere

이 페이지는 대학용 AI 플랫폼답게, 신뢰감과 접근성을 먼저 세우는 **공공 서비스형 UI**에 가깝다. 첫 인상은 과장된 비주얼보다 명확한 목적성이다. 사용자는 곧바로 로그인하거나 회원가입해야 하며, 그 흐름을 방해하는 장식 요소는 최소화되어 있다 [web:13].

전체 분위기는 차분하고 실용적이다. 강한 색 대비나 화려한 배경보다, 기능 진입을 빠르게 돕는 중립적 톤이 적합하다. 페이지 상단에는 전남대학교 맥락과 함께 “필요한 AI 기능을 한곳에서 간편하게”라는 메시지가 보여, 서비스의 핵심 가치가 통합성과 편의성에 있음을 드러낸다 [web:13].

이 디자인은 “AI 도구 모음”보다는 “학교 구성원을 위한 단일 관문”에 가깝다. 따라서 시각 언어도 플랫폼 쇼케이스보다, 안정적인 계정 진입과 서비스 탐색에 맞춰져야 한다 [web:13].

**Key Characteristics:**
- 로그인 중심의 단일 목적 랜딩.
- 공공기관/대학 서비스에 어울리는 차분한 정보성 톤.
- AI 기능을 “한곳에서 간편하게” 연결하는 허브형 구조.
- 소셜 로그인 선택지가 전면에 배치된 빠른 진입 UX.
- 과도한 장식보다 신뢰와 명료성을 우선하는 인터페이스 [web:13].

## 2. Color Palette & Roles

### Primary
- **Navy / Deep Blue**: 대학 및 신뢰 기반 서비스의 핵심 배경 또는 강조색.
- **White**: 로그인 카드, 입력 영역, 주요 텍스트의 기본 배경.
- **Cool Gray**: 구분선, 보조 배경, 비활성 상태.

### Interactive
- **Kakao Yellow**: Kakao 로그인 버튼.
- **Google Brand Colors**: Google 로그인 버튼.
- **Apple Black**: Apple 로그인 버튼.
- **Primary Accent Blue**: 기본 CTA, 링크, 포커스 상태에 사용.

### Text
- **Primary Text**: 진한 남색 또는 거의 검은색.
- **Secondary Text**: 회색 계열의 설명 문구.
- **Inverse Text**: 어두운 배경 위의 흰색 텍스트.

### Semantic Roles
- **Success**: 인증 완료, 제출 성공.
- **Warning**: 계정 연결 필요, 입력 누락.
- **Error**: 로그인 실패, 인증 오류.
- **Info**: AI 서비스 안내, 이용 정책 요약.

이 페이지는 브랜드 컬러보다 **서비스 역할 색상**이 중요하다. 특히 로그인 영역에서는 각 소셜 플랫폼의 정체성을 명확히 보여주는 색이 전환 효율을 높인다 [web:13].

## 3. Typography Rules

### Font Family
- **Korean UI**: Pretendard, Noto Sans KR, system-ui 계열.
- **English UI**: Inter, system-ui, sans-serif.
- 가독성과 친숙함이 중요하므로, 지나치게 개성 강한 서체보다 중립적인 산세리프가 적합하다.

### Hierarchy

| Role | Size | Weight | Line Height | Use |
|------|------|--------|-------------|-----|
| Hero Title | 32px | 700 | 1.2 | 메인 메시지 |
| Section Title | 24px | 600 | 1.25 | 로그인/안내 블록 |
| Body | 16px | 400 | 1.6 | 설명, 안내문 |
| Label | 14px | 500 | 1.4 | 입력 필드, 버튼 라벨 |
| Helper Text | 13px | 400 | 1.5 | 보조 설명 |
| Micro Text | 12px | 400 | 1.4 | 정책, 주의 문구 |

### Principles
- **명료성 우선**: 제목은 짧고 직접적이어야 한다.
- **한국어 중심 리듬**: 한글 UI에서는 자간을 과하게 벌리지 않는다.
- **가독성 있는 여백**: 설명문은 1.5 이상 line-height로 편안하게 읽히게 한다.
- **과도한 굵기 지양**: 700은 헤드라인에만 제한한다.

이 페이지의 핵심은 “정보를 읽게 하는 것”보다 “즉시 행동하게 하는 것”이므로, 타이포그래피는 장식보다 전환을 도와야 한다 [web:13].

## 4. Component Stylings

### Buttons

**Primary CTA**
- Background: `#1d4ed8` 또는 유사한 신뢰감 있는 블루.
- Text: `#ffffff`
- Radius: `10px`
- Padding: `12px 16px`
- Use: 로그인, 시작하기, 가입하기.

**Social Login Button**
- Background: 플랫폼별 공식 컬러.
- Border: `1px solid rgba(0, 0, 0, 0.08)`
- Radius: `10px`
- Icon: 좌측 정렬, 브랜드 식별성 확보.
- Use: Kakao, Google, Apple 로그인 [web:13].

**Secondary Button**
- Background: `#ffffff`
- Text: `#1f2937`
- Border: `1px solid #d1d5db`
- Use: 보조 행동, 뒤로가기, 나중에 하기.

### Inputs
- Background: `#ffffff`
- Border: `1px solid #d1d5db`
- Focus: `2px solid #2563eb`
- Radius: `10px`
- Height: `44px` 이상.
- Placeholder는 연한 회색으로 처리한다.

### Cards & Panels
- Background: 흰색 또는 아주 옅은 회색.
- Shadow: `0 8px 24px rgba(0, 0, 0, 0.08)`
- Radius: `16px`
- Use: 로그인 박스, 안내 박스, 서비스 소개 패널.

### Header / Top Area
- 좌측에 학교/서비스 로고, 중앙 또는 상단에 서비스 메시지.
- 네비게이션은 최소화하고, 사용자가 로그인 행동으로 빨리 이동하도록 한다.
- 상단 문구는 기관 신뢰성과 서비스 목적을 함께 전달해야 한다 [web:13].

### Image Treatment
- 실제 서비스에선 이미지보다 아이콘과 로고가 더 중요하다.
- 필요 시 AI, 캠퍼스, 학습을 상징하는 단순한 일러스트를 사용한다.
- 사진은 정보 방해가 되지 않도록 절제한다.

## 5. Layout Principles

### Spacing System
- Base unit: 8px.
- 핵심 간격: 8, 12, 16, 24, 32, 48px.
- 로그인 영역은 밀도가 높아도 숨이 막히지 않게 24px 이상 구획 여백을 둔다.

### Grid & Container
- Max width: `960px` ~ `1120px`.
- 로그인 카드 중심의 1컬럼 구조.
- 데스크톱에서는 좌측 설명 + 우측 로그인 카드의 2컬럼도 가능하다.
- 모바일에서는 반드시 1컬럼으로 단순화한다.

### Whitespace Philosophy
- 공공 서비스에서는 여백이 “고급스러움”보다 “안정감”을 만든다.
- 정보 블록 사이에 충분한 간격을 두어 사용자가 순서를 놓치지 않게 한다.
- 로그인 버튼끼리는 가까이 두되, 역할 구분은 명확히 한다.

### Alignment
- 제목, 설명, 입력창, 버튼은 좌측 정렬을 기본으로 한다.
- 카드 내부의 시각 중심은 수평 가운데보다, 읽기 흐름에 맞춘 좌측 기준이 더 적합하다.

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat | No shadow | 단순 텍스트 영역 |
| Card | Soft shadow | 로그인 패널, 안내 패널 |
| Focus | Blue outline | 입력창, 버튼 포커스 |
| Modal | Higher shadow | 약관, 알림, 인증 팝업 |

이 서비스는 깊은 레이어보다 **명확한 계층**이 중요하다. 섀도는 존재감을 주되, 과하면 기관형 서비스의 신뢰감을 해칠 수 있다. 가장 중요한 것은 입력 영역과 CTA가 한눈에 보이게 하는 것이다 [web:13].

## 7. Do's and Don'ts

### Do
- 로그인/회원가입 경로를 가장 눈에 띄게 배치한다.
- 소셜 로그인은 플랫폼별 정체성을 유지한다.
- 한국어 문구는 짧고 직접적으로 쓴다.
- 카드 기반 레이아웃으로 정보와 행동을 분리한다.
- 포커스 상태를 명확하게 제공한다.

### Don't
- 화려한 배경 이미지로 로그인 흐름을 방해하지 않는다.
- 버튼 색을 임의로 브랜드 컬러와 섞지 않는다.
- 텍스트를 과하게 장식하거나 자간을 넓히지 않는다.
- 한 화면에 너무 많은 기능을 넣지 않는다.
- AI 기능을 설명하는 문장을 길게 늘어놓지 않는다.

## 8. Responsive Behavior

### Mobile
- 로그인 카드가 화면 폭을 거의 가득 채우도록 설계한다.
- 버튼은 터치하기 쉬운 높이(`44px` 이상)를 유지한다.
- 안내 문구는 2~3줄 내로 줄인다.

### Tablet
- 설명 영역과 입력 영역을 분리해 배치할 수 있다.
- 좌우 여백을 넉넉하게 주어 기관 서비스의 안정감을 살린다.

### Desktop
- 좌측에는 서비스 가치 설명, 우측에는 로그인 카드가 적합하다.
- 사용자가 페이지를 읽기보다 바로 행동할 수 있도록 시선 유도 순서를 명확히 한다.

### Touch Targets
- 모든 버튼은 최소 `44x44px`.
- 소셜 로그인 버튼은 로고와 텍스트가 함께 보여야 한다.
- 링크 간 간격은 오터치가 없도록 충분히 둔다.

## 9. Agent Prompt Guide

### Quick Style Reference
- Primary background: `#ffffff`
- Page accent: `#2563eb`
- Text primary: `#111827`
- Text secondary: `#6b7280`
- Border: `#d1d5db`
- Card radius: `16px`
- Button radius: `10px`

### Example Component Prompts
- “전남대학교 AI 플랫폼 느낌의 로그인 페이지를 디자인해줘. 상단에 서비스 메시지, 중앙에 로그인 카드, 하단에 소셜 로그인 버튼 3개를 배치해줘.”
- “공공기관형 AI 서비스 UI로, 신뢰감 있고 차분한 팔레트, 명확한 포커스 상태, 큰 버튼, 읽기 쉬운 한글 타이포그래피를 적용해줘.”
- “로그인 중심 랜딩 페이지를 구성하되, 회원가입보다 로그인 흐름이 먼저 보이도록 우선순위를 잡아줘.”

### Design Principles
1. 목적은 설명이 아니라 진입이다.
2. 색은 적고 역할은 분명해야 한다.
3. 카드와 버튼의 위계가 곧 UX다.
4. 한국어 정보는 짧고 선명해야 한다.
5. 서비스 신뢰감은 여백과 정돈감에서 나온다.