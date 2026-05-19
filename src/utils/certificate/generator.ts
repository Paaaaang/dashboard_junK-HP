import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import JSZip from "jszip";
import type { CertificateField, CertificateData } from "./types";

const DEFAULT_REGULAR_URL = "/fonts/NotoSansKR-Regular.otf";
const DEFAULT_BOLD_URL = "/fonts/NotoSansKR-Bold.otf";

const fontBytesCache = new Map<string, Uint8Array>();

async function loadFontBytes(url: string): Promise<Uint8Array> {
  const cached = fontBytesCache.get(url);
  if (cached) return cached;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(
      `한글 폰트(${url})를 불러올 수 없습니다. public/fonts/ 폴더에 NotoSansKR 파일이 있는지 확인하세요.`
    );
  }
  const buf = new Uint8Array(await res.arrayBuffer());
  fontBytesCache.set(url, buf);
  return buf;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const cleaned = hex.replace("#", "");
  const full = cleaned.length === 3
    ? cleaned.split("").map((c) => c + c).join("")
    : cleaned;
  const n = parseInt(full || "000000", 16);
  return {
    r: ((n >> 16) & 0xff) / 255,
    g: ((n >> 8) & 0xff) / 255,
    b: (n & 0xff) / 255,
  };
}

function formatDate(value: string | undefined, format = "YYYY년 MM월 DD일"): string {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  const yyyy = d.getFullYear().toString();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return format
    .replace(/YYYY/g, yyyy)
    .replace(/MM/g, mm)
    .replace(/DD/g, dd);
}

function resolveText(field: CertificateField, data: CertificateData): string {
  switch (field.key) {
    case "static_text":
      return field.staticText ?? "";
    case "name":
      return data.name ?? "";
    case "course_name":
      return data.course_name ?? "";
    case "certificate_no":
      return data.certificate_no ?? "";
    case "company_name":
      return data.company_name ?? "";
    case "total_hours":
      return data.total_hours != null ? `${data.total_hours}` : "";
    case "completion_date":
      return formatDate(data.completion_date, field.dateFormat);
    case "birth_date":
      return formatDate(data.birth_date, field.dateFormat);
    case "issue_date":
      return formatDate(new Date().toISOString().slice(0, 10), field.dateFormat);
    default:
      return "";
  }
}

interface DrawContext {
  page: PDFPage;
  regular: PDFFont;
  bold: PDFFont;
  pageHeight: number;
}

function drawField(ctx: DrawContext, field: CertificateField, text: string) {
  if (!text) return;
  const font = field.fontWeight === "bold" ? ctx.bold : ctx.regular;
  const width = font.widthOfTextAtSize(text, field.fontSize);
  let x = field.x;
  if (field.align === "center") x = field.x - width / 2;
  else if (field.align === "right") x = field.x - width;

  // UI uses top-left origin with y pointing down to the TOP of the text.
  // pdf-lib draws text from baseline at the given (x, y) in bottom-left coords.
  // Approximate baseline = top + fontSize * 0.8 for visual parity with the editor.
  const baselineFromTop = field.y + field.fontSize * 0.8;
  const pdfY = ctx.pageHeight - baselineFromTop;

  const { r, g, b } = hexToRgb(field.color || "#000000");
  ctx.page.drawText(text, {
    x,
    y: pdfY,
    size: field.fontSize,
    font,
    color: rgb(r, g, b),
  });
}

export interface BuildOptions {
  templateBytes: Uint8Array;
  fields: CertificateField[];
  data: CertificateData;
  regularFontUrl?: string;
  boldFontUrl?: string;
}

export async function buildCertificatePdf(opts: BuildOptions): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(opts.templateBytes);
  pdfDoc.registerFontkit(fontkit);

  const [regularBytes, boldBytes] = await Promise.all([
    loadFontBytes(opts.regularFontUrl || DEFAULT_REGULAR_URL),
    loadFontBytes(opts.boldFontUrl || DEFAULT_BOLD_URL),
  ]);
  const regular = await pdfDoc.embedFont(regularBytes, { subset: true });
  const bold = await pdfDoc.embedFont(boldBytes, { subset: true });

  const pages = pdfDoc.getPages();
  for (const field of opts.fields) {
    const pageIndex = Math.max(0, (field.page || 1) - 1);
    if (pageIndex >= pages.length) continue;
    const page = pages[pageIndex];
    const ctx: DrawContext = {
      page,
      regular,
      bold,
      pageHeight: page.getHeight(),
    };
    drawField(ctx, field, resolveText(field, opts.data));
  }
  return pdfDoc.save();
}

export interface BatchInput {
  templateBytes: Uint8Array;
  fields: CertificateField[];
  recipients: { filename: string; data: CertificateData }[];
  regularFontUrl?: string;
  boldFontUrl?: string;
  onProgress?: (current: number, total: number) => void;
}

export async function buildBatchZip(opts: BatchInput): Promise<Blob> {
  const zip = new JSZip();
  const total = opts.recipients.length;
  for (let i = 0; i < total; i++) {
    const { filename, data } = opts.recipients[i];
    const bytes = await buildCertificatePdf({
      templateBytes: opts.templateBytes,
      fields: opts.fields,
      data,
      regularFontUrl: opts.regularFontUrl,
      boldFontUrl: opts.boldFontUrl,
    });
    zip.file(`${filename}.pdf`, bytes);
    opts.onProgress?.(i + 1, total);
  }
  return zip.generateAsync({ type: "blob" });
}

export async function buildBatchMerged(opts: BatchInput): Promise<Uint8Array> {
  const merged = await PDFDocument.create();
  const total = opts.recipients.length;
  for (let i = 0; i < total; i++) {
    const { data } = opts.recipients[i];
    const bytes = await buildCertificatePdf({
      templateBytes: opts.templateBytes,
      fields: opts.fields,
      data,
      regularFontUrl: opts.regularFontUrl,
      boldFontUrl: opts.boldFontUrl,
    });
    const single = await PDFDocument.load(bytes);
    const copied = await merged.copyPages(single, single.getPageIndices());
    copied.forEach((p) => merged.addPage(p));
    opts.onProgress?.(i + 1, total);
  }
  return merged.save();
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
