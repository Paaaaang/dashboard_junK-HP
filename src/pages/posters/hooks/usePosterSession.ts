// ── 포스터 AI 세션 관리 훅 ─────────────────────────────────────────
// 페이지 이동 후 복귀 시 상태 유지를 위해 posterSessionCache에서 초기값을 복원합니다.
import { useState } from 'react';
import { callAPI } from '../poster.api';
import {
  buildGenerateSystemPrompt,
  RECOMMENDATION_PROMPT,
  SUMMARY_PROMPT,
  MODIFY_SYSTEM_PROMPT,
} from '../poster.prompts';
import type { ChatMessage, PosterFormData } from '../poster.types';
import { posterSessionCache } from '../posterGlobalState';

interface Options {
  formData: PosterFormData;
  qrDataUrl: string;
}

export function usePosterSession({ formData, qrDataUrl }: Options) {
  // ── AI 설정 상태 (Step 2) ──────────────────────────────────────
  const [aiModel, setAiModelRaw] = useState(() => posterSessionCache.aiModel);
  const [designGuidelines, setDesignGuidelinesRaw] = useState(() => posterSessionCache.designGuidelines);

  // ── AI 디자인 추천 상태 ────────────────────────────────────────
  const [aiReco, setAiRecoRaw] = useState(() => posterSessionCache.aiReco);
  const [isRecommending, setIsRecommending] = useState(false);

  // ── 포스터 생성 상태 (Step 3) ─────────────────────────────────
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerated, setIsGeneratedRaw] = useState(() => posterSessionCache.isGenerated);
  const [generatedMarkup, setGeneratedMarkupRaw] = useState(() => posterSessionCache.generatedMarkup);

  // ── 채팅 상태 (Step 3 오른쪽 패널) ───────────────────────────
  const [messages, setMessagesRaw] = useState<ChatMessage[]>(() => posterSessionCache.messages);
  const [chatInput, setChatInputRaw] = useState(() => posterSessionCache.chatInput);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // ── 캐시 동기화 세터 ─────────────────────────────────────────
  const setAiModel = (v: string) => { posterSessionCache.aiModel = v; setAiModelRaw(v); };
  const setDesignGuidelines = (v: string) => { posterSessionCache.designGuidelines = v; setDesignGuidelinesRaw(v); };
  const setAiReco = (v: string | ((p: string) => string)) => {
    if (typeof v === 'function') {
      setAiRecoRaw(prev => { const next = v(prev); posterSessionCache.aiReco = next; return next; });
    } else {
      posterSessionCache.aiReco = v; setAiRecoRaw(v);
    }
  };
  const setIsGenerated = (v: boolean) => { posterSessionCache.isGenerated = v; setIsGeneratedRaw(v); };
  const setGeneratedMarkup = (v: string) => { posterSessionCache.generatedMarkup = v; setGeneratedMarkupRaw(v); };
  const setMessages = (v: ChatMessage[] | ((p: ChatMessage[]) => ChatMessage[])) => {
    if (typeof v === 'function') {
      setMessagesRaw(prev => { const next = v(prev); posterSessionCache.messages = next; return next; });
    } else {
      posterSessionCache.messages = v; setMessagesRaw(v);
    }
  };
  const setChatInput = (v: string) => { posterSessionCache.chatInput = v; setChatInputRaw(v); };

  // ── HTML 추출 헬퍼 (단일) ─────────────────────────────────────
  const extractHtml = (text: string) => {
    const m = text.match(/```html\n([\s\S]*?)\n```/i);
    return (m ? m[1] : text).trim();
  };

  // ── 스트리밍 중 부분 HTML 추출 (닫는 ``` 없어도 됨) ───────────
  const extractStreamingHtml = (text: string): string => {
    const m = text.match(/```html\n?([\s\S]*)/i);
    if (!m) return '';
    return m[1].replace(/\n```\s*$/, '').trim();
  };

  // ── iframe용 HTML 변환 ────────────────────────────────────────
  const getIframeSrc = (markup: string) => {
    if (!markup) return '';
    const base = `<base href="${window.location.origin}/">`;
    let html = /<head[^>]*>/i.test(markup)
      ? markup.replace(/<head[^>]*>/i, m => m + base)
      : markup;
    if (qrDataUrl) html = html.split('__QR__').join(qrDataUrl);
    return html;
  };

  // ── AI 디자인 추천 ────────────────────────────────────────────
  // "AI 추천 받기" 클릭 시 경량 모델로 색상/레이아웃 텍스트 제안을 받습니다.
  const handleGetRecommendation = async () => {
    if (isRecommending) return;
    setIsRecommending(true);
    setAiReco('');
    try {
      await callAPI(
        `reco-${Date.now()}`,
        RECOMMENDATION_PROMPT,
        [{ role: 'user', content: `교육 정보:\n${JSON.stringify(formData, null, 2)}` }],
        'anthropic/claude-haiku-4.5',
        (chunk, type) => { if (type === 'content') setAiReco(prev => prev + chunk); },
      );
    } catch {
      setAiReco('추천을 가져오는데 실패했습니다.');
    } finally {
      setIsRecommending(false);
    }
  };

  // ── 포스터 HTML 생성 ──────────────────────────────────────────
  const handleGenerate = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setGeneratedMarkup('');
    setMessages([{ role: 'ai', content: '', isStreaming: true, streamType: 'generate' }]);

    try {
      let acc = '';
      let thinkingAcc = '';
      let chunkCount = 0;

      await callAPI(
        `poster-${Date.now()}`,
        buildGenerateSystemPrompt(formData, designGuidelines),
        [{ role: 'user', content: '포스터를 생성해주세요.' }],
        aiModel,
        (chunk, type) => {
          if (type === 'thinking') {
            thinkingAcc += chunk;
            setMessages(prev => {
              const msgs = [...prev];
              if (msgs[0]) msgs[0] = { ...msgs[0], thinking: thinkingAcc };
              return msgs;
            });
          } else if (type === 'content') {
            acc += chunk;
            chunkCount++;
            if (chunkCount % 15 === 0) {
              const html = extractStreamingHtml(acc);
              if (html.includes('<')) setGeneratedMarkup(html);
            }
          }
        },
      );

      const finalHtml = extractHtml(acc);
      if (finalHtml) setGeneratedMarkup(finalHtml);
      setIsGenerated(true);

      let summaryAcc = '';
      await callAPI(
        `poster-summary-${Date.now()}`,
        SUMMARY_PROMPT,
        [{ role: 'user', content: `생성된 포스터 HTML:\n\`\`\`html\n${finalHtml}\n\`\`\`` }],
        'anthropic/claude-haiku-4.5',
        (chunk, type) => {
          if (type === 'content') {
            summaryAcc += chunk;
            setMessages(prev => {
              const msgs = [...prev];
              if (msgs[0]) msgs[0] = { ...msgs[0], content: summaryAcc };
              return msgs;
            });
          }
        },
      );

      setMessages(prev => {
        const msgs = [...prev];
        if (msgs[0]) msgs[0] = { ...msgs[0], isStreaming: false, thinking: thinkingAcc || undefined };
        return msgs;
      });
    } catch (e: any) {
      setMessages([{ role: 'ai', content: `오류가 발생했습니다: ${e.message}`, isStreaming: false }]);
    } finally {
      setIsGenerating(false);
    }
  };

  // ── 포스터 수정 실행 ──────────────────────────────────────────
  const executeModification = async (request: string) => {
    setMessages(prev => [...prev, { role: 'ai', content: '', isStreaming: true, streamType: 'modify' }]);
    try {
      let acc = '';
      let thinkingAcc = '';

      await callAPI(
        'poster-modify',
        MODIFY_SYSTEM_PROMPT,
        [{ role: 'user', content: `[현재 HTML]\n\`\`\`html\n${generatedMarkup}\n\`\`\`\n\n[수정 요청]: ${request}` }],
        aiModel,
        (chunk, type) => {
          if (type === 'thinking') {
            thinkingAcc += chunk;
            setMessages(prev => {
              const msgs = [...prev];
              const last = msgs.length - 1;
              if (msgs[last]) msgs[last] = { ...msgs[last], thinking: thinkingAcc };
              return msgs;
            });
          } else if (type === 'content') {
            acc += chunk;
          }
        },
      );

      const updated = extractHtml(acc);
      if (updated) setGeneratedMarkup(updated);

      setMessages(prev => {
        const msgs = [...prev];
        const last = msgs.length - 1;
        if (msgs[last]) msgs[last] = {
          ...msgs[last],
          content: '수정이 완료되었습니다.',
          isStreaming: false,
          thinking: thinkingAcc || undefined,
        };
        return msgs;
      });
    } catch {
      setMessages(prev => {
        const msgs = [...prev];
        const last = msgs.length - 1;
        if (msgs[last]) msgs[last] = {
          ...msgs[last],
          content: '오류가 발생했습니다. 다시 시도해주세요.',
          isStreaming: false,
        };
        return msgs;
      });
    }
  };

  // ── 채팅 메시지 전송 ──────────────────────────────────────────
  const handleSendMessage = async () => {
    if (!chatInput.trim() || isChatLoading || !isGenerated) return;
    const userMsg = chatInput;
    setChatInput('');
    setIsChatLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    try {
      await executeModification(userMsg);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', content: '오류가 발생했습니다. 다시 시도해주세요.' }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // ── 세션 전체 초기화 ──────────────────────────────────────────
  const reset = () => {
    setDesignGuidelines('');
    setAiReco('');
    setGeneratedMarkup('');
    setIsGenerating(false);
    setIsGenerated(false);
    setMessages([]);
    setChatInput('');
  };

  const clearAiReco = () => setAiReco('');

  return {
    aiModel, setAiModel,
    designGuidelines, setDesignGuidelines,
    aiReco, isRecommending, clearAiReco,
    isGenerating, isGenerated, generatedMarkup, setGeneratedMarkup,
    messages, chatInput, setChatInput, isChatLoading,
    getIframeSrc,
    handleGetRecommendation,
    handleGenerate,
    handleSendMessage,
    reset,
  };
}
