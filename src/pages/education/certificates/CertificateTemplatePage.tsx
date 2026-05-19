import { useEffect, useRef, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { useToastStore } from "@/stores";
import {
  downloadBlob,
  fillCertificateTemplate,
  generateOnePdf,
  isoToKoreanDate,
  type CertificateHtmlData,
} from "@/utils/certificate";

const TODAY = new Date().toISOString().slice(0, 10);

const DEFAULT_SAMPLE: CertificateHtmlData = {
  certNo: "2026-0520001",
  name: "홍길동",
  birthDate: "1990년 01월 15일",
  company: "전남대학교",
  courseName: "AI 데이터 분석 실무",
  trainingDate: "2026.05.20.",
  totalHours: 32,
  issueDate: isoToKoreanDate(TODAY),
};

export function CertificateTemplatePage() {
  const { addToast } = useToastStore();
  const containerRef = useRef<HTMLDivElement>(null);

  const [scale, setScale] = useState(1);
  const [templateHtml, setTemplateHtml] = useState<string | null>(null);
  const [sampleData, setSampleData] = useState<CertificateHtmlData>(DEFAULT_SAMPLE);
  const [previewHtml, setPreviewHtml] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // 템플릿 HTML 로드
  useEffect(() => {
    fetch("/certificate-template.html")
      .then((r) => r.text())
      .then(setTemplateHtml)
      .catch(() => addToast("템플릿 HTML 로드 실패", "error"));
  }, [addToast]);

  // 미리보기 HTML 생성 (sampleData/templateHtml 변경 시 자동 갱신)
  useEffect(() => {
    if (!templateHtml) return;
    const base = `${window.location.origin}/`;
    const filled = fillCertificateTemplate(templateHtml, sampleData).replace(
      "<head>",
      `<head><base href="${base}">`
    );
    setPreviewHtml(filled);
  }, [templateHtml, sampleData]);

  // 컨테이너 너비 기반 스케일 계산
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([e]) => setScale(e.contentRect.width / 794));
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const patch = <K extends keyof CertificateHtmlData>(k: K, v: CertificateHtmlData[K]) =>
    setSampleData((p) => ({ ...p, [k]: v }));

  const handleSamplePdf = async () => {
    setIsGenerating(true);
    try {
      const blob = await generateOnePdf(sampleData);
      downloadBlob(blob, `수료증_샘플_${sampleData.name}.pdf`);
      addToast("샘플 PDF가 생성되었습니다.", "success");
    } catch (err: any) {
      addToast(`PDF 생성 실패: ${err.message}`, "error");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="py-6 max-w-[1400px] mx-auto">
      {/* 헤더 */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-primary">수료증 양식 관리</h1>
          <p className="text-sm font-medium mt-1 text-white">
            HTML 템플릿 미리보기 · HY견고딕 · A4
          </p>
        </div>
        <div />
      </div>

      <div className="grid grid-cols-[1fr_300px] gap-4 items-start">
        {/* ── 왼쪽: 미리보기 ───────────────────────────── */}
        <div className="bg-surface border border-border/50 rounded-3xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border/30 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-tertiary">
              미리보기
            </span>
            <span className="text-[11px] text-tertiary font-medium">
              {Math.round(scale * 100)}% 배율
            </span>
          </div>

          <div className="bg-[#f0f0f0] p-8 flex justify-center items-start min-h-[500px]">
            {/* 스케일 컨테이너 */}
            <div
              ref={containerRef}
              className="w-full max-w-[794px]"
              style={{ height: `${Math.round(1123 * scale)}px` }}
            >
              {previewHtml ? (
                <div
                  className="shadow-2xl"
                  style={{
                    transform: `scale(${scale})`,
                    transformOrigin: "top left",
                    width: "794px",
                    height: "1123px",
                  }}
                >
                  <iframe
                    srcDoc={previewHtml}
                    sandbox="allow-same-origin"
                    style={{ width: "794px", height: "1123px", border: "none", display: "block" }}
                    title="수료증 미리보기"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-48 text-tertiary text-sm font-bold gap-2">
                  <Loader2 size={18} className="animate-spin" /> 템플릿 로딩 중...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── 오른쪽: 컨트롤 ───────────────────────────── */}
        <div className="space-y-3">
          {/* 미리보기 데이터 폼 */}
          <div className="bg-surface border border-border/50 rounded-3xl p-5 space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-tertiary">
              미리보기 데이터
            </p>
            <FormField label="수료번호" value={sampleData.certNo}
              onChange={(v) => patch("certNo", v)} placeholder="2026-0520001" />
            <FormField label="성명" value={sampleData.name}
              onChange={(v) => patch("name", v)} placeholder="홍길동" />
            <FormField label="생년월일" value={sampleData.birthDate ?? ""}
              onChange={(v) => patch("birthDate", v)} placeholder="1990년 01월 15일" />
            <FormField label="소속기업" value={sampleData.company ?? ""}
              onChange={(v) => patch("company", v)} placeholder="전남대학교" />
            <FormField label="훈련과정명" value={sampleData.courseName}
              onChange={(v) => patch("courseName", v)} placeholder="AI 데이터 분석 실무" />
            <FormField label="훈련일자" value={sampleData.trainingDate}
              onChange={(v) => patch("trainingDate", v)} placeholder="2026.05.20." />
            <FormField label="교육시간 (H)" value={String(sampleData.totalHours)}
              onChange={(v) => patch("totalHours", v)} placeholder="32" />
            <FormField label="발급일" value={sampleData.issueDate}
              onChange={(v) => patch("issueDate", v)} placeholder="2026년 05월 20일" />
          </div>

          {/* 샘플 PDF 다운로드 */}
          <button
            onClick={handleSamplePdf}
            disabled={isGenerating || !previewHtml}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand-primary text-white rounded-2xl text-sm font-black shadow-md shadow-brand-primary/20 hover:brightness-105 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {isGenerating
              ? <><Loader2 size={14} className="animate-spin" /> 생성 중...</>
              : <><Download size={14} /> 샘플 PDF 다운로드</>
            }
          </button>

          {/* 안내 */}
          <p className="text-[10px] text-white font-medium text-center leading-relaxed px-2">
            수료증 발급은 세션 관리 → 수료 탭에서 진행합니다.
          </p>
        </div>
      </div>
    </div>
  );
}


function FormField({ label, value, onChange, placeholder }: {
  label: string; value: string;
  onChange: (v: string) => void; placeholder: string;
}) {
  return (
    <div>
      <label className="text-[10px] font-black uppercase tracking-widest text-tertiary">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full px-3 py-1.5 bg-surface border border-border rounded-xl text-xs font-medium text-primary placeholder-disabled outline-none focus:border-brand-primary transition-colors"
      />
    </div>
  );
}
