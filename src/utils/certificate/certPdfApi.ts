import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import JSZip from "jszip";
import { fillCertificateTemplate, type CertificateHtmlData } from "./htmlGenerator";

let templateCache: string | null = null;
let fontLoadPromise: Promise<void> | null = null;

async function loadTemplate(): Promise<string> {
  if (templateCache) return templateCache;
  const r = await fetch("/certificate-template.html");
  if (!r.ok) throw new Error(`템플릿 로드 실패 (${r.status})`);
  templateCache = await r.text();
  return templateCache;
}

function ensureFont(): Promise<void> {
  if (fontLoadPromise) return fontLoadPromise;
  // URL 방식 대신 ArrayBuffer 로 직접 로드 → FontFace URL 해석 오류 회피
  fontLoadPromise = fetch("/fonts/H2GTRE.TTF")
    .then((r) => {
      if (!r.ok) throw new Error(`폰트 로드 실패 (${r.status})`);
      return r.arrayBuffer();
    })
    .then((buf) => new FontFace("HYGodic", buf).load())
    .then((face) => { document.fonts.add(face); })
    .catch(() => { /* 폰트 없으면 시스템 폰트로 대체 */ });
  return fontLoadPromise;
}

export async function generateOnePdf(data: CertificateHtmlData): Promise<Blob> {
  const [html] = await Promise.all([loadTemplate(), ensureFont()]);
  const filled = fillCertificateTemplate(html, data);

  const parser = new DOMParser();
  const doc = parser.parseFromString(filled, "text/html");
  // @font-face 제거: 폰트는 FontFace API로 이미 로드됨 → html2canvas 재fetch 방지
  const styleText = (doc.querySelector("style")?.textContent ?? "").replace(
    /@font-face\s*\{[^}]*\}/gi,
    ""
  );
  const certEl = doc.querySelector(".certificate");
  if (!certEl) throw new Error("Template parse error: .certificate not found");

  const host = document.createElement("div");
  host.style.cssText =
    "position:fixed;left:-9999px;top:0;width:794px;height:1123px;overflow:hidden;background:white;";

  const styleEl = document.createElement("style");
  styleEl.textContent = styleText;
  host.appendChild(styleEl);

  const clone = certEl.cloneNode(true) as HTMLElement;
  host.appendChild(clone);
  document.body.appendChild(host);

  await document.fonts.ready;
  await new Promise((r) => setTimeout(r, 200));

  const canvas = await html2canvas(clone, {
    scale: 2,
    width: 794,
    height: 1123,
    useCORS: true,
    allowTaint: true,
    logging: false,
    backgroundColor: "#ffffff",
  });

  document.body.removeChild(host);

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, 210, 297);
  return pdf.output("blob");
}

export async function generateBatchZip(
  recipients: CertificateHtmlData[],
  onProgress?: (current: number, total: number) => void
): Promise<Blob> {
  const zip = new JSZip();
  for (let i = 0; i < recipients.length; i++) {
    const blob = await generateOnePdf(recipients[i]);
    zip.file(`${recipients[i].name}_${recipients[i].certNo}.pdf`, await blob.arrayBuffer());
    onProgress?.(i + 1, recipients.length);
  }
  return zip.generateAsync({ type: "blob" });
}
