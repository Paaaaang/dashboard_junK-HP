import { useState, useRef } from 'react';
import { Bug, Code } from 'lucide-react';

interface ElementInfo {
  name: string;
  className: string;
  id: string;
  tagName: string;
  rect: DOMRect;
}

export function DebugMode() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [hoveredElement, setHoveredElement] = useState<ElementInfo | null>(null);
  const [highlight, setHighlight] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const debugRef = useRef<HTMLDivElement>(null);

  // 섹션 정보 수집
  function getElementInfo(target: Element): ElementInfo {
    const rect = target.getBoundingClientRect();
    const className = target.className || 'no-class';
    const id = (target as HTMLElement).id || 'no-id';
    const tagName = target.tagName.toLowerCase();

    let name = 'Element';
    if (className.includes('panel')) name = 'Panel Section';
    else if (className.includes('kpi-card')) name = 'KPI Card';
    else if (className.includes('chart-card')) name = 'Chart Card';
    else if (className.includes('data-table')) name = 'Data Table';
    else if (className.includes('modal')) name = 'Modal';
    else if (className.includes('sidebar')) name = 'Sidebar';
    else if (className.includes('top-rail')) name = 'Top Rail';
    else if (className.includes('dashboard')) name = 'Dashboard';
    else if (className.includes('status-badge')) name = 'Status Badge';

    return { name, className, id, tagName, rect };
  }

  // 복사할 텍스트 생성
  function generateCopyText(info: ElementInfo): string {
    const lines = [
      `Section: ${info.name}`,
      `Element: <${info.tagName}>`,
      `ID: ${info.id}`,
      `Class: ${info.className}`,
      ``,
      `<!-- Copy this selector to inspect -->`,
      `.${info.className.split(' ')[0]}`,
    ];
    return lines.join('\n');
  }

  // 마우스 호버 시 섹션 강조
  function handleMouseMove(event: React.MouseEvent) {
    if (!isEnabled) return;

    const target = event.target as Element;
    
    // workspace-main 내부만 감지
    if (!target.closest('.workspace-main')) {
      setHighlight(null);
      setHoveredElement(null);
      return;
    }

    const info = getElementInfo(target);
    setHoveredElement(info);
    
    // 하이라이트 박스 설정 (스크롤 고려)
    setHighlight({
      top: info.rect.top + window.scrollY,
      left: info.rect.left + window.scrollX,
      width: info.rect.width,
      height: info.rect.height,
    });
  }

  // 호버 해제
  function handleMouseLeave() {
    setHighlight(null);
    setHoveredElement(null);
  }

  // Ctrl + 클릭 시 정보 복사
  function handleDebugClick(event: React.MouseEvent) {
    if (!isEnabled || !event.ctrlKey) return;

    event.preventDefault();
    event.stopPropagation();

    const target = event.target as Element;
    if (!target.closest('.workspace-main')) return;

    const info = getElementInfo(target);
    const copyText = generateCopyText(info);

    navigator.clipboard.writeText(copyText);

    // 임시 피드백
    const feedback = document.createElement('div');
    feedback.style.cssText = `
      position: fixed;
      top: ${info.rect.top}px;
      left: ${info.rect.left}px;
      background: #10b981;
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      z-index: 10000;
      animation: fadeOut 2s ease-out forwards;
      pointer-events: none;
    `;
    feedback.textContent = '✅ 복사됨';
    document.body.appendChild(feedback);

    setTimeout(() => feedback.remove(), 2000);
  }

  return (
    <>
      {/* 하이라이트 박스 */}
      {isEnabled && highlight && (
        <div
          style={{
            position: 'fixed',
            top: highlight.top,
            left: highlight.left,
            width: highlight.width,
            height: highlight.height,
            border: '2px solid #064e3b',
            backgroundColor: 'rgba(6, 78, 59, 0.1)',
            pointerEvents: 'none',
            zIndex: 998,
            borderRadius: '4px',
            boxShadow: '0 0 0 1px rgba(6, 78, 59, 0.3), inset 0 0 0 1px rgba(6, 78, 59, 0.2)',
            transition: 'all 0.1s ease-out',
          }}
        />
      )}

      {/* 디버그 모드 활성화 시 클릭 감지 */}
      {isEnabled && (
        <div
          className="debug-overlay"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleDebugClick}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: 'auto',
            zIndex: 997,
            cursor: 'crosshair',
          }}
        />
      )}

      {/* 플로팅 버튼 */}
      <div className="debug-mode" ref={debugRef}>
        <button
          className={`debug-toggle ${isEnabled ? 'debug-active' : ''}`}
          onClick={() => setIsEnabled(!isEnabled)}
          title={isEnabled ? '디버그 모드: ON (Ctrl+Click으로 복사)' : '디버그 모드: OFF'}
          aria-label="개발자 디버그 모드"
        >
          <Bug className="debug-icon" />
          <span className={`debug-status ${isEnabled ? 'active' : ''}`}>{isEnabled ? 'ON' : 'OFF'}</span>
        </button>

        {/* 호버 중인 섹션 정보 표시 */}
        {isEnabled && hoveredElement && (
          <div className="debug-tooltip">
            <div className="debug-header">
              <Code className="debug-icon-small" />
              <p className="debug-name">{hoveredElement.name}</p>
            </div>
            <div className="debug-content">
              <p className="debug-item">
                <span className="debug-label">Element:</span>
                <span className="debug-value">&lt;{hoveredElement.tagName}&gt;</span>
              </p>
              <p className="debug-item">
                <span className="debug-label">ID:</span>
                <span className="debug-value">{hoveredElement.id}</span>
              </p>
              <p className="debug-item debug-classes">
                <span className="debug-label">Class:</span>
                <code className="debug-code">{hoveredElement.className.split(' ')[0]}</code>
              </p>
            </div>
            <p className="debug-hint">💡 Ctrl+Click으로 정보 복사</p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeOut {
          0% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-8px); }
        }
      `}</style>
    </>
  );
}
