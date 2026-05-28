// ── 로테이션 로딩 메시지 컴포넌트 ─────────────────────────────────
// AI 응답 대기 중에 메시지 배열을 2.8초 간격으로 순환 표시합니다.
// fadeInUp 애니메이션은 전역 CSS에 정의되어 있습니다.
import { useState, useEffect } from 'react';

interface Props {
  msgs: string[];
}

export function RotatingMessage({ msgs }: Props) {
  const [idx, setIdx] = useState(0);

  // msgs 배열 길이만큼 순환
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % msgs.length), 2800);
    return () => clearInterval(t);
  }, [msgs]);

  return (
    <span
      key={idx}
      className="text-xs"
      style={{ animation: 'fadeInUp 0.4s ease', color: 'var(--color-text-secondary)' }}
    >
      {msgs[idx]}
    </span>
  );
}
