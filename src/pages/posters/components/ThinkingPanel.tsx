// ── AI 추론 과정 표시 패널 ─────────────────────────────────────────
// Claude 추론 모델의 내부 사고(thinking) 내용을 접기/펼치기로 보여줍니다.
// - 스트리밍 중: 자동 스크롤 + "추론하고 있어요..." 표시
// - 스트리밍 완료: 자동으로 접힘 + "추론 완료" 표시
import { useState, useRef, useEffect } from 'react';
import { Sparkles, ChevronRight, Loader2 } from 'lucide-react';

interface Props {
  thinking: string;
  isStreaming?: boolean;
}

export function ThinkingPanel({ thinking, isStreaming }: Props) {
  const [open, setOpen] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  // 스트리밍 중 내용 추가 시 자동 스크롤
  useEffect(() => {
    if (isStreaming && ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [thinking, isStreaming]);

  // 스트리밍 완료 시 패널 자동 접힘
  useEffect(() => {
    if (!isStreaming) setOpen(false);
  }, [isStreaming]);

  return (
    <div className="rounded-xl border text-[11px] w-full overflow-hidden" style={{ borderColor: '#e9d5ff' }}>
      {/* 헤더 버튼 - 클릭으로 접기/펼치기 */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-2.5 py-1.5 transition-colors"
        style={{ background: '#faf5ff' }}
      >
        <span className="flex items-center gap-1.5 font-semibold" style={{ color: '#7c3aed' }}>
          {isStreaming
            ? <><Loader2 size={10} className="animate-spin" /> 추론하고 있어요...</>
            : <><Sparkles size={10} /> 추론 완료</>}
        </span>
        <ChevronRight
          size={11}
          className="transition-transform duration-200"
          style={{ color: '#a78bfa', transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}
        />
      </button>

      {/* 추론 내용 영역 */}
      {open && (
        <div
          ref={ref}
          className="px-2.5 py-2 max-h-36 overflow-y-auto font-mono text-[9.5px] whitespace-pre-wrap leading-relaxed"
          style={{ background: '#fdf4ff', color: '#6b21a8' }}
        >
          {thinking || <span style={{ color: '#a78bfa' }}>...</span>}
        </div>
      )}
    </div>
  );
}
