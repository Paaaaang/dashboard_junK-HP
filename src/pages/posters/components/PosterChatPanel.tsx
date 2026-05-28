// ── Step 3: AI 채팅 수정 패널 ─────────────────────────────────────
// 우측 고정 너비(w-80) 패널로, 포스터 생성 후 수정 요청을 주고받습니다.
// 메시지 구조:
//   - 사용자: 오른쪽 정렬 회색 버블
//   - AI: 왼쪽 정렬, ThinkingPanel(추론) + 내용 버블
// 생성 완료 전에는 입력창이 비활성화됩니다.
import { useRef, useEffect } from 'react';
import { Bot, User, Sparkles, Loader2, Send } from 'lucide-react';
import { RotatingMessage } from './RotatingMessage';
import { ThinkingPanel } from './ThinkingPanel';
import type { ChatMessage } from '../poster.types';
import { GENERATE_MSGS, MODIFY_MSGS } from '../poster.types';

interface Props {
  messages: ChatMessage[];
  chatInput: string;
  setChatInput: (v: string) => void;
  isChatLoading: boolean;
  isGenerated: boolean;
  isGenerating: boolean;
  aiModel: string;
  onSend: () => void;
}

export function PosterChatPanel({
  messages, chatInput, setChatInput,
  isChatLoading, isGenerated, isGenerating,
  aiModel, onSend,
}: Props) {
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 새 메시지 추가 시 자동 스크롤
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="w-80 flex flex-col min-h-0 border rounded-xl overflow-hidden bg-white" style={{ borderColor: 'var(--color-border)' }}>
      {/* ── 패널 헤더 ── */}
      <div className="px-4 py-3 border-b bg-gray-50 shrink-0 flex items-center gap-2" style={{ borderColor: 'var(--color-border)' }}>
        <div className="w-7 h-7 rounded-full bg-brand-primary flex items-center justify-center shrink-0">
          <Bot size={14} className="text-white" />
        </div>
        <div>
          <p className="text-xs font-bold text-gray-800">AI 어시스턴트</p>
          {/* 선택된 모델명에서 provider 접두사(anthropic/) 제거 후 표시 */}
          <p className="text-[10px] text-gray-400">{aiModel.split('/').pop()}</p>
        </div>
      </div>

      {/* ── 메시지 목록 ── */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin">
        {/* 메시지가 없을 때 안내 문구 */}
        {messages.length === 0 && (
          <div className="text-center text-xs text-gray-400 py-10">
            <Bot size={28} className="mx-auto mb-2 opacity-20" />
            <p>생성이 완료되면<br />여기서 수정 요청을 할 수 있어요</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'items-start'}`}>
            {/* 아바타 - 스트리밍 중 AI는 sparkles 아이콘으로 표시 */}
            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
              msg.role === 'user' ? 'bg-gray-200 text-gray-600' : 'bg-brand-primary text-white'
            }`}>
              {msg.role === 'user'
                ? <User size={11} />
                : msg.isStreaming ? <Sparkles size={11} className="animate-pulse" /> : <Bot size={11} />}
            </div>

            {/* 버블 영역 */}
            <div className={`space-y-1.5 ${msg.role === 'user' ? 'items-end flex flex-col' : ''}`} style={{ maxWidth: '85%' }}>
              {/* 추론/내용 모두 없을 때 로테이션 로딩 메시지 표시 */}
              {msg.role === 'ai' && msg.isStreaming && !msg.thinking && !msg.content && (
                <div className="flex items-center gap-1.5 px-1 py-0.5">
                  <Loader2 size={10} className="animate-spin flex-shrink-0" style={{ color: 'var(--brand-primary)' }} />
                  <RotatingMessage msgs={msg.streamType === 'generate' ? GENERATE_MSGS : MODIFY_MSGS} />
                </div>
              )}

              {/* 추론 패널 - thinking 값이 있을 때만 표시 */}
              {msg.role === 'ai' && msg.thinking !== undefined && (
                <ThinkingPanel thinking={msg.thinking} isStreaming={msg.isStreaming} />
              )}

              {/* 메시지 내용 버블 */}
              {msg.content && (
                <div className={`px-3 py-2 text-xs leading-relaxed rounded-2xl whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-gray-100 text-gray-800 rounded-tr-sm'
                    : 'bg-brand-primary/5 border border-brand-primary/10 text-gray-800 rounded-tl-sm'
                }`}>
                  {msg.content}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* ── 입력창 - 생성 완료 전에는 비활성화 ── */}
      <div className="p-2 border-t shrink-0" style={{ borderColor: 'var(--color-border)' }}>
        <div className={`flex items-center gap-1 border rounded-lg px-2 transition-all bg-white ${
          !isGenerated || isGenerating
            ? 'opacity-50'
            : 'focus-within:ring-2 focus-within:ring-brand-primary/20'
        }`} style={{ borderColor: 'var(--color-border)' }}>
          <input
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            // IME 조합 중(한국어 입력 중)에는 Enter 키 이벤트 무시
            onKeyDown={e => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) { e.preventDefault(); onSend(); } }}
            disabled={!isGenerated || isChatLoading || isGenerating}
            placeholder={!isGenerated || isGenerating ? '생성 후 활성화' : '수정 요청 입력...'}
            className="flex-1 bg-transparent border-none outline-none text-xs px-1 py-2"
          />
          <button
            onClick={onSend}
            disabled={!chatInput.trim() || isChatLoading || !isGenerated || isGenerating}
            className="p-1.5 bg-brand-primary text-white rounded-md disabled:opacity-40 hover:brightness-110 transition-colors shrink-0"
          >
            <Send size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
