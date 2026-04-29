import { useEffect, useState, useCallback } from "react";
import { Terminal, CheckCircle2, X, AlertCircle, Layers } from "lucide-react";

interface DebugToast {
  id: string;
  message: string;
  isError?: boolean;
}

interface HoverInfo {
  rect: DOMRect;
  name: string;
  className: string;
}

export function DebugMode() {
  const isDev = import.meta.env.DEV;
  const [isEnabled, setIsEnabled] = useState(false);
  const [toasts, setToasts] = useState<DebugToast[]>([]);
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);

  const addToast = (message: string, isError = false) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, isError }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isEnabled) return;
    const target = e.target as HTMLElement;
    if (!target || target === document.body || target === document.documentElement || target.closest('.debug-ui-system')) {
      setHoverInfo(null);
      return;
    }
    setHoverInfo({
      rect: target.getBoundingClientRect(),
      name: target.tagName.toLowerCase(),
      className: typeof target.className === 'string' ? target.className.split(' ')[0] : ''
    });
  }, [isEnabled]);

  const handleGlobalClick = useCallback((e: MouseEvent) => {
    if (!isEnabled) return;
    
    if (e.ctrlKey && e.button === 0) {
      e.preventDefault();
      e.stopPropagation();

      const target = e.target as HTMLElement;
      
      // 1. 계층 구조 수집 로직 (상위 5단계 부모 추적)
      const hierarchy = [];
      let current: HTMLElement | null = target;
      while (current && current !== document.body && hierarchy.length < 6) {
        hierarchy.push({
          tagName: current.tagName.toLowerCase(),
          className: typeof current.className === 'string' ? current.className : 'N/A',
          id: current.id || 'N/A',
          // 주요 스타일 정보 (그룹 단위 파악용)
          layout: {
            display: window.getComputedStyle(current).display,
            position: window.getComputedStyle(current).position,
          }
        });
        current = current.parentElement;
      }

      // 2. 최종 메타데이터 구성
      const computedStyle = window.getComputedStyle(target);
      const metadata = {
        selectedElement: {
          tagName: target.tagName.toLowerCase(),
          className: target.className,
          id: target.id,
          textContent: target.textContent?.trim().substring(0, 50),
        },
        // 클릭한 지점부터 부모로 올라가는 전체 구조
        structureHierarchy: hierarchy,
        // 현재 요소의 상세 스타일
        computedStyle: {
          width: computedStyle.width,
          height: computedStyle.height,
          padding: computedStyle.padding,
          margin: computedStyle.margin,
          backgroundColor: computedStyle.backgroundColor,
          color: computedStyle.color,
          fontSize: computedStyle.fontSize,
          fontWeight: computedStyle.fontWeight,
          gap: computedStyle.gap,
          borderRadius: computedStyle.borderRadius,
        },
        reactInfo: {
          hasFiber: !!Object.keys(target).find(key => key.startsWith('__reactFiber')),
        }
      };

      const json = JSON.stringify(metadata, null, 2);
      
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(json)
          .then(() => addToast("계층 구조 정보가 복사되었습니다!"))
          .catch(() => addToast("복사 실패", true));
      } else {
        addToast("Clipboard API 오류", true);
      }
    }
  }, [isEnabled]);

  useEffect(() => {
    if (!isDev) return;
    if (isEnabled) {
      window.addEventListener("click", handleGlobalClick, true);
      window.addEventListener("mousemove", handleMouseMove, true);
      document.body.style.cursor = "crosshair";
    } else {
      window.removeEventListener("click", handleGlobalClick, true);
      window.removeEventListener("mousemove", handleMouseMove, true);
      document.body.style.cursor = "default";
      setHoverInfo(null);
    }
    return () => {
      window.removeEventListener("click", handleGlobalClick, true);
      window.removeEventListener("mousemove", handleMouseMove, true);
      document.body.style.cursor = "default";
    };
  }, [isEnabled, isDev, handleGlobalClick, handleMouseMove]);

  if (!isDev) return null;

  return (
    <div className="debug-ui-system">
      {/* 호버 하이라이트 */}
      {isEnabled && hoverInfo && (
        <div style={{
          position: "fixed",
          top: hoverInfo.rect.top,
          left: hoverInfo.rect.left,
          width: hoverInfo.rect.width,
          height: hoverInfo.rect.height,
          border: "2px solid #3b82f6",
          background: "rgba(59, 130, 246, 0.1)",
          pointerEvents: "none",
          zIndex: 999998,
          boxShadow: "0 0 10px rgba(59, 130, 246, 0.2)"
        }}>
          <div style={{
            position: "absolute",
            top: -22,
            left: -2,
            background: "#3b82f6",
            color: "white",
            fontSize: "10px",
            padding: "2px 6px",
            borderRadius: "4px 4px 0 0",
            whiteSpace: "nowrap",
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            gap: "4px"
          }}>
            <Layers size={10} />
            {hoverInfo.name}{hoverInfo.className && `.${hoverInfo.className}`}
          </div>
        </div>
      )}

      {/* 컨트롤러 */}
      <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 999999, display: "flex", alignItems: "center", gap: 10 }}>
        {isEnabled && (
          <div style={{ background: "#0f172a", color: "#38bdf8", padding: "6px 12px", borderRadius: "8px", fontSize: "11px", fontWeight: "800", border: "1px solid #334155" }}>
            CTRL + CLICK TO COPY STRUCTURE
          </div>
        )}
        <button
          onClick={() => setIsEnabled(!isEnabled)}
          style={{
            background: isEnabled ? "#ef4444" : "#1e293b",
            color: "white",
            border: "none",
            width: 44,
            height: 44,
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 15px rgba(0,0,0,0.4)",
            cursor: "pointer",
            transition: "all 0.2s"
          }}
        >
          {isEnabled ? <X size={20} /> : <Terminal size={20} />}
        </button>
      </div>

      {/* 토스트 알림 (최상단) */}
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: "40px",
        gap: 10,
        zIndex: 2147483647,
        pointerEvents: "none"
      }}>
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              background: t.isError ? "#7f1d1d" : "#0f172a",
              color: "#f8fafc",
              padding: "14px 28px",
              borderRadius: "16px",
              fontSize: "14px",
              fontWeight: "700",
              boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
              border: `1px solid ${t.isError ? "#ef4444" : "#334155"}`,
              display: "flex",
              alignItems: "center",
              gap: 12,
              pointerEvents: "auto",
              animation: "debugToastIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards"
            }}
          >
            {t.isError ? <AlertCircle size={18} color="#f87171" /> : <CheckCircle2 size={18} color="#10b981" />}
            {t.message}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes debugToastIn {
          from { transform: translateY(-40px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
