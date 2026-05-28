// ── Step 2: AI 모델 선택 & 디자인 지침 & 와이어프레임 ──────────────
// 세 가지 기능을 제공합니다:
//   1. AI 모델 선택 → 선택 즉시 모델 설명 카드("현재 모델은?") 표시
//   2. 디자인 지침 작성 → "AI 추천 받기" (텍스트) + "와이어프레임 추천" (3종 병렬)
//   3. 하단 버튼:
//      - "추천 없이 만들기" → 와이어프레임 무시하고 바로 생성
//      - "이 기반으로 생성" → 선택된 와이어프레임을 컨텍스트로 전달 (선택 시만 활성)
import ReactMarkdown from 'react-markdown';
import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { IC, LC } from '../poster.types';

function stripMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^>\s+/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ── 모델 설명 데이터 ──────────────────────────────────────────────
const MODEL_META: Record<string, { grade: string; color: string; note: string }> = {
  'anthropic/claude-opus-4.7':         { grade: '최고품질', color: '#7c3aed', note: '추론 지원 · 복잡한 레이아웃 이해 탁월 · 권장' },
  'anthropic/claude-sonnet-4.6':       { grade: '균형',     color: '#2563eb', note: '품질과 속도의 최적 균형 · 범용 생성' },
  'anthropic/claude-haiku-4.5':        { grade: '경량',     color: '#059669', note: '빠른 응답 · 간단한 포스터에 적합' },
  'gpt-5.4':                           { grade: '최신',     color: '#0ea5e9', note: 'OpenAI 최신 플래그십 모델' },
  'gpt-5.4-mini':                      { grade: '경량',     color: '#0ea5e9', note: 'GPT-5.4 경량 버전 · 빠른 생성' },
  'gpt-5.1':                           { grade: '최신',     color: '#0ea5e9', note: 'GPT-5 시리즈 · 높은 품질' },
  'gpt-4.1':                           { grade: '고품질',   color: '#0ea5e9', note: '안정적인 GPT-4 계열' },
  'gpt-4.1-mini':                      { grade: '경량',     color: '#0ea5e9', note: 'GPT-4.1 경량 · 빠른 속도' },
  'gpt-4o':                            { grade: '균형',     color: '#0ea5e9', note: '멀티모달 지원 · 범용' },
  'gpt-o4-mini':                       { grade: '추론',     color: '#f59e0b', note: '추론 특화 · 복잡한 지침 처리' },
  'gpt-o3':                            { grade: '추론',     color: '#f59e0b', note: '강력한 추론 모델' },
  'gemini-3.1-pro':                    { grade: '최고품질', color: '#ea4335', note: 'Google 최신 플래그십' },
  'gemini-2.5-pro':                    { grade: '고품질',   color: '#ea4335', note: '긴 컨텍스트 · 코드 강점' },
  'gemini-2.5-flash':                  { grade: '균형',     color: '#ea4335', note: '빠른 Gemini 균형 모델' },
  'grok-4':                            { grade: '최고품질', color: '#111827', note: 'xAI 최신 플래그십' },
  'grok-4-1-fast-reasoning':           { grade: '추론',     color: '#111827', note: '빠른 추론 특화' },
  'mistral-large':                     { grade: '고품질',   color: '#f97316', note: 'Mistral 최고 품질' },
  'magistral-medium':                  { grade: '추론',     color: '#f97316', note: '추론 특화 Mistral' },
  'codestral':                         { grade: '코드',     color: '#f97316', note: '코드 생성 특화 · HTML 정밀 작성' },
};

const DEFAULT_META = { grade: 'AI', color: '#6b7280', note: '선택된 모델로 생성합니다' };

interface Props {
  aiModel: string;
  setAiModel: (v: string) => void;
  designGuidelines: string;
  setDesignGuidelines: (v: string) => void;
  aiReco: string;
  isRecommending: boolean;
  onGetRecommendation: () => void;
  onClearReco: () => void;
  onPrev: () => void;
  onGenerate: () => void;
}

export function PosterAIStep({
  aiModel, setAiModel,
  designGuidelines, setDesignGuidelines,
  aiReco, isRecommending,
  onGetRecommendation, onClearReco,
  onPrev, onGenerate,
}: Props) {
  const meta = MODEL_META[aiModel] ?? DEFAULT_META;
  const [applying, setApplying] = useState(false);

  return (
    <>
      <div className="flex-1 overflow-y-auto space-y-5 pr-1 pb-4 scrollbar-thin">

        {/* ── AI 모델 선택 + 현재 모델 설명 ── */}
        <section className="space-y-2">
          <h2 className={LC}>AI 모델 선택</h2>
          <select value={aiModel} onChange={e => setAiModel(e.target.value)} className={IC}>
            <optgroup label="— Claude (Bridge · 추론 지원)">
              <option value="anthropic/claude-opus-4.7">Claude Opus 4.7 — 최고 품질</option>
              <option value="anthropic/claude-sonnet-4.6">Claude Sonnet 4.6 — 균형</option>
              <option value="anthropic/claude-haiku-4.5">Claude Haiku 4.5 — 경량</option>
            </optgroup>
            <optgroup label="— GPT / o-series (Native)">
              <option value="gpt-5.4">GPT-5.4</option>
              <option value="gpt-5.4-mini">GPT-5.4 Mini</option>
              <option value="gpt-5.1">GPT-5.1</option>
              <option value="gpt-5-mini">GPT-5 Mini</option>
              <option value="gpt-4.1">GPT-4.1</option>
              <option value="gpt-4.1-mini">GPT-4.1 Mini — 경량</option>
              <option value="gpt-4o">GPT-4o</option>
              <option value="gpt-4o-mini">GPT-4o Mini</option>
              <option value="gpt-o4-mini">o4-mini — 추론</option>
              <option value="gpt-o3">o3 — 추론</option>
              <option value="o3-deep-research">o3 Deep Research</option>
            </optgroup>
            <optgroup label="— Gemini (Native)">
              <option value="gemini-3.1-pro">Gemini 3.1 Pro — 최고 품질</option>
              <option value="gemini-3-flash">Gemini 3 Flash</option>
              <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite</option>
              <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
              <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
              <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
            </optgroup>
            <optgroup label="— Grok (Native)">
              <option value="grok-4">Grok 4 — 최고 품질</option>
              <option value="grok-4-1-fast-reasoning">Grok 4.1 Fast Reasoning</option>
              <option value="grok-4-1-fast-non-reasoning">Grok 4.1 Fast</option>
              <option value="grok-3">Grok 3</option>
              <option value="grok-3-mini">Grok 3 Mini</option>
            </optgroup>
            <optgroup label="— Mistral (Native)">
              <option value="mistral-large">Mistral Large</option>
              <option value="mistral-medium">Mistral Medium</option>
              <option value="magistral-medium">Magistral Medium — 추론</option>
              <option value="magistral-small">Magistral Small</option>
              <option value="codestral">Codestral — 코드 특화</option>
            </optgroup>
            <optgroup label="— 기타 (Native)">
              <option value="llama-4-scout-17b">Llama 4 Scout 17B</option>
              <option value="qwen-qwq-32b">Qwen QwQ 32B — 추론</option>
              <option value="solar-pro3">Solar Pro 3</option>
            </optgroup>
          </select>

          {/* 현재 모델은? — 선택된 모델 설명 카드 */}
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-[11px]"
            style={{ background: `${meta.color}12`, border: `1px solid ${meta.color}30` }}
          >
            <span
              className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-black text-white"
              style={{ background: meta.color }}
            >
              {meta.grade}
            </span>
            <span style={{ color: meta.color }}>{meta.note}</span>
          </div>
        </section>

        <section className="space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className={LC}>디자인 지침</h2>
            <button
              onClick={onGetRecommendation}
              disabled={isRecommending}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-[11px] font-bold hover:bg-purple-100 transition-all disabled:opacity-50"
            >
              {isRecommending
                ? <><Loader2 size={11} className="animate-spin" /> 분석 중...</>
                : <><Sparkles size={11} /> AI 추천 받기</>}
            </button>
          </div>
          <textarea
            value={designGuidelines}
            onChange={e => setDesignGuidelines(e.target.value)}
            className={`${IC} h-24 resize-none`}
            placeholder="예: 전남대 그린/블루 계열, 신뢰감 있는 공공기관 스타일, 깔끔한 세로형 레이아웃"
          />
        </section>

        {(aiReco || isRecommending) && (
          <section
            className="space-y-2"
            style={{
              transition: 'opacity 0.35s ease, transform 0.35s ease',
              opacity: applying ? 0 : 1,
              transform: applying ? 'translateY(-6px)' : 'translateY(0)',
              pointerEvents: applying ? 'none' : 'auto',
            }}
            onTransitionEnd={() => {
              if (applying) { onClearReco(); setApplying(false); }
            }}
          >
            <h3 className="text-[11px] font-bold text-purple-700 flex items-center gap-1.5">
              <Sparkles size={12} /> AI 디자인 추천
            </h3>
            <div
              className="rounded-xl p-3 text-[11px] leading-relaxed text-gray-700"
              style={{ background: '#faf5ff', border: '1px solid #e9d5ff' }}
            >
              {isRecommending && !aiReco ? (
                <div className="flex items-center gap-2 text-purple-400 py-1">
                  <Loader2 size={12} className="animate-spin" />
                  <span>디자인 추천을 분석 중...</span>
                </div>
              ) : (
                <ReactMarkdown
                  components={{
                    h2: ({ children }) => <p className="font-bold text-purple-800 mt-2 mb-0.5 first:mt-0">{children}</p>,
                    ul: ({ children }) => <ul className="ml-3 space-y-0.5">{children}</ul>,
                    li: ({ children }) => <li className="flex gap-1 before:content-['·'] before:text-purple-400">{children}</li>,
                    p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                    strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                  }}
                >
                  {aiReco}
                </ReactMarkdown>
              )}
            </div>
            {aiReco && (
              <button
                onClick={() => {
                  setDesignGuidelines(stripMarkdown(aiReco));
                  setApplying(true);
                }}
                className="text-[11px] font-bold text-purple-600 hover:text-purple-800 hover:underline"
              >
                지침에 적용 →
              </button>
            )}
          </section>
        )}

      </div>

      <div className="pt-4 border-t shrink-0 flex gap-2" style={{ borderColor: 'var(--color-border)' }}>
        <button
          onClick={onPrev}
          className="px-4 py-2.5 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all text-sm"
        >
          이전
        </button>
        <button
          onClick={onGenerate}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-white transition-all hover:brightness-110 shadow-md text-sm"
          style={{ background: 'var(--brand-primary)' }}
        >
          <Sparkles size={14} /> 포스터 생성
        </button>
      </div>
    </>
  );
}
