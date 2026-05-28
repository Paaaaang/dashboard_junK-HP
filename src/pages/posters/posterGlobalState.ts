// ── 포스터 페이지 모듈 레벨 상태 캐시 ───────────────────────────────
// SPA 내 페이지 이동 후 복귀 시 상태를 유지하기 위한 캐시입니다.
// React 컴포넌트가 언마운트/리마운트되어도 이 객체는 메모리에 남습니다.
// (브라우저 새로고침 시에는 초기화됩니다.)
import type { PosterFormData, ChatMessage } from './poster.types';
import { INITIAL_FORM } from './poster.types';

// ── 폼 입력 캐시 (Step 1) ─────────────────────────────────────────
export const posterFormCache = {
  formData: { ...INITIAL_FORM } as PosterFormData,
  benefitInput: '',
  qrDataUrl: '',
};

// ── AI 세션 캐시 (Step 2 & 3) ────────────────────────────────────
export const posterSessionCache = {
  step: 1 as 1 | 2 | 3,
  aiModel: 'anthropic/claude-opus-4.7',
  designGuidelines: '',
  aiReco: '',
  isGenerated: false,
  generatedMarkup: '',
  messages: [] as ChatMessage[],
  chatInput: '',
};

// ── 캐시 전체 초기화 ──────────────────────────────────────────────
export function resetPosterCache() {
  posterFormCache.formData = { ...INITIAL_FORM };
  posterFormCache.benefitInput = '';
  posterFormCache.qrDataUrl = '';

  posterSessionCache.step = 1;
  posterSessionCache.aiModel = 'anthropic/claude-opus-4.7';
  posterSessionCache.designGuidelines = '';
  posterSessionCache.aiReco = '';
  posterSessionCache.isGenerated = false;
  posterSessionCache.generatedMarkup = '';
  posterSessionCache.messages = [];
  posterSessionCache.chatInput = '';
}
