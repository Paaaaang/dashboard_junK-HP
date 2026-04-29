---
name: khp-dashboard-audit
description: 'Use when: PhaseDocs/설계서 대비 구현 점검, plan.md 업데이트, 디자인 시스템(variables.css 등) 소스 오브 트루스 추적, 접근성(focus-visible/aria) 및 이모지 아이콘 규칙(no-emoji-icons) 점검. Triggers: PhaseDocs, 설계서, plan.md, audit, 디자인 시스템, 접근성, 이모지 제거.'
argument-hint: '예: "Phase 2 설계서 대비 미구현 항목 점검 후 plan.md 업데이트"'
---

# KHP Dashboard Audit

## When to Use
- `PhaseDocs` 설계 문서 대비 구현 여부를 확인해야 할 때
- `plan.md`의 체크리스트를 실제 코드 기준으로 갱신해야 할 때
- 디자인 시스템이 어떤 파일(토큰/스타일 엔트리) 기반인지 확인/정리해야 할 때
- 접근성(키보드 포커스, aria 속성)과 이모지 아이콘 사용 여부를 스캔해야 할 때

## Procedure
1. **설계서 요구사항 추출**
   - Phase.1/Phase.2 문서에서 인터랙션 규칙(선택/Shift+클릭/페이지네이션/드로어 동작/교차 네비게이션)을 목록화.
2. **코드 구현 스캔(키워드 기반)**
   - 선택/범위: `shiftKey`, `indeterminate`, `lastSelectedIdRef`
   - 교차 네비게이션: `?open=`
   - 반응형/드로어: `.drawer-panel`, `@media (max-width: 1024px)`
   - reduced motion: `prefers-reduced-motion`
   - 이모지: `🟢🔵🟡✅❌📧📞⚪` 등
3. **디자인 시스템 소스 오브 트루스 확인**
   - CSS 엔트리: `frontend/src/index.css` + `frontend/src/styles/index.css`
   - 토큰: `frontend/src/styles/variables.css`
   - 컴포넌트 스타일: `frontend/src/styles/{buttons,tables,modal,responsive}.css`
4. **증거 기반으로 plan 갱신**
   - 완료/부분/미완료를 파일 경로와 함께 기록.
   - 파일명이 리팩터링으로 변경된 경우(예: `pages/companies/*`) `plan.md`의 경로도 함께 정리.

## Output Format
- "구현됨 / 부분 구현 / 미구현" 3묶음으로 요약
- 각 항목은 **근거 파일 경로**를 포함
- 설계서 기준 vs 실제 구현 차이를 1줄로 명시
