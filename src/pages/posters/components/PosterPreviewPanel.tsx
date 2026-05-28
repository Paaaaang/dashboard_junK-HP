// ── Step 3: 포스터 미리보기 & 내보내기 패널 ─────────────────────
// 좌측 메인 영역을 담당합니다.
// - 미리보기 탭: iframe으로 생성된 HTML을 렌더링, 줌 컨트롤 지원
// - 코드 탭: 생성된 HTML 소스를 표시
// - 인쇄: Blob URL로 새 창을 열어 브라우저 인쇄 다이얼로그 호출
// - PNG 다운로드: html2canvas로 iframe 내용을 캡처
// zoom/activeTab/iframeRef는 이 컴포넌트 내부 상태로 관리합니다.
import { useState, useRef } from 'react';
import {
  Eye, Code as CodeIcon, ZoomIn, ZoomOut, Maximize,
  Printer, Download, RotateCcw, Sparkles,
} from 'lucide-react';
import type { PosterFormData } from '../poster.types';
import { CHECKERBOARD } from '../poster.types';

// A4 @ 96dpi: 210mm × 297mm
const A4_W = 794;
const A4_H = 1123;

interface Props {
  generatedMarkup: string;
  isGenerating: boolean;
  formData: Pick<PosterFormData, 'courseName'>;
  getIframeSrc: (markup: string) => string;
  onReset: () => void;
  onMarkupChange: (markup: string) => void;
}

export function PosterPreviewPanel({ generatedMarkup, isGenerating, formData, getIframeSrc, onReset, onMarkupChange }: Props) {
  // ── 내부 UI 상태 ──────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [zoom, setZoom] = useState(1.0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // ── 인쇄 처리 ────────────────────────────────────────────────
  // Blob URL로 독립 HTML 파일을 새 창에서 열고 print()를 호출합니다.
  const handlePrint = () => {
    if (!generatedMarkup) return;
    const blob = new Blob([getIframeSrc(generatedMarkup)], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (!win) { URL.revokeObjectURL(url); alert('팝업이 차단되었습니다. 팝업 허용 후 다시 시도해주세요.'); return; }
    win.onload = () => { win.focus(); win.print(); URL.revokeObjectURL(url); };
  };

  // ── PNG 다운로드 처리 ─────────────────────────────────────────
  // html2canvas로 iframe의 documentElement를 캡처합니다.
  // scale:2 로 2배 해상도 PNG를 생성합니다.
  const handleDownload = async () => {
    if (!generatedMarkup) return;
    try {
      const html2canvas = (await import('html2canvas')).default;
      const doc = iframeRef.current?.contentDocument || iframeRef.current?.contentWindow?.document;
      if (!doc?.documentElement) return;
      const canvas = await html2canvas(doc.documentElement, {
        useCORS: true,
        allowTaint: true,
        scale: 2,
        width: A4_W,
        height: A4_H,
        windowWidth: A4_W,
        windowHeight: A4_H,
        scrollX: 0,
        scrollY: 0,
        x: 0,
        y: 0,
      });
      const a = document.createElement('a');
      a.download = `poster_${formData.courseName || 'poster'}.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
    } catch (e) {
      console.error('Download failed:', e);
      alert('이미지 다운로드에 실패했습니다.');
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* ── 탭 바 + 줌 컨트롤 ── */}
      <div className="flex items-center justify-between mb-2 shrink-0">
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${activeTab === 'preview' ? 'bg-white shadow-sm text-brand-primary' : 'text-gray-500'}`}
          >
            <Eye size={13} /> 미리보기
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${activeTab === 'code' ? 'bg-white shadow-sm text-brand-primary' : 'text-gray-500'}`}
          >
            <CodeIcon size={13} /> 코드
          </button>
        </div>
        {/* 미리보기 탭에서만 줌 컨트롤 표시 */}
        {activeTab === 'preview' && (
          <div className="flex items-center gap-0.5 px-2 py-1 bg-white border rounded-lg shadow-sm" style={{ borderColor: 'var(--color-border)' }}>
            <button onClick={() => setZoom(p => Math.max(p - 0.1, 0.1))} className="p-1 hover:bg-gray-100 rounded text-gray-500"><ZoomOut size={13} /></button>
            <span className="text-[10px] font-bold text-gray-500 min-w-[34px] text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(p => Math.min(p + 0.1, 2))} className="p-1 hover:bg-gray-100 rounded text-gray-500"><ZoomIn size={13} /></button>
            <div className="w-px h-3 bg-gray-200 mx-0.5" />
            <button onClick={() => setZoom(0.4)} className="p-1 hover:bg-gray-100 rounded text-gray-500"><Maximize size={13} /></button>
          </div>
        )}
      </div>

      {/* ── 콘텐츠 영역 ── */}
      <div className="flex-1 min-h-0 rounded-xl overflow-hidden border flex flex-col" style={{ borderColor: 'var(--color-border)' }}>
        {activeTab === 'preview' ? (
          isGenerating && !generatedMarkup ? (
            <div className="poster-loading-bg flex-1" />
          ) : (
            <div className="flex-1 overflow-auto flex items-start justify-center p-8" style={CHECKERBOARD}>
              {generatedMarkup ? (
                <div style={{
                  width: A4_W * zoom,
                  height: A4_H * zoom,
                  flexShrink: 0,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
                  position: 'relative',
                }}>
                  <iframe
                    ref={iframeRef}
                    title="Poster Preview"
                    sandbox="allow-same-origin"
                    style={{
                      width: `${A4_W}px`,
                      height: `${A4_H}px`,
                      transform: `scale(${zoom})`,
                      transformOrigin: 'top left',
                      border: 'none',
                      display: 'block',
                    }}
                    srcDoc={getIframeSrc(generatedMarkup)}
                  />
                  {isGenerating && (
                    <div
                      className="poster-loading-overlay"
                      style={{ position: 'absolute', inset: 0, borderRadius: 2, pointerEvents: 'none' }}
                    />
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 text-gray-400 h-full w-full">
                  <Sparkles size={28} className="opacity-20" />
                  <p className="text-sm">포스터를 생성해주세요</p>
                </div>
              )}
            </div>
          )
        ) : (
          // HTML 소스 편집기
          <div className="flex-1 bg-[#1e1e1e] flex flex-col">
            <textarea
              value={generatedMarkup || ''}
              onChange={e => onMarkupChange(e.target.value)}
              spellCheck={false}
              placeholder="아직 생성된 코드가 없습니다."
              className="flex-1 w-full bg-transparent font-mono text-[11px] text-gray-300 p-4 resize-none outline-none leading-relaxed placeholder:text-gray-600"
              style={{ tabSize: 2 }}
            />
          </div>
        )}
      </div>

      {/* ── 액션 버튼 바 ── */}
      <div className="flex items-center gap-2 mt-2 shrink-0">
        <button onClick={handlePrint} disabled={!generatedMarkup} className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 text-white rounded-lg text-xs font-bold hover:bg-gray-700 transition-all disabled:opacity-40">
          <Printer size={13} /> 인쇄
        </button>
        <button onClick={handleDownload} disabled={!generatedMarkup} className="flex items-center gap-1.5 px-3 py-2 bg-white border text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-50 transition-all disabled:opacity-40" style={{ borderColor: 'var(--color-border)' }}>
          <Download size={13} /> PNG
        </button>
        <div className="flex-1" />
        <button onClick={onReset} className="flex items-center gap-1.5 px-3 py-2 bg-white border text-gray-500 rounded-lg text-xs font-bold hover:bg-gray-50 transition-all" style={{ borderColor: 'var(--color-border)' }}>
          <RotateCcw size={13} /> 새로 만들기
        </button>
      </div>
    </div>
  );
}
