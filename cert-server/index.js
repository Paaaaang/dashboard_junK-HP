/**
 * 수료증 PDF 생성 서버 (Puppeteer)
 * 실행: node cert-server/index.js  |  포트: 3456
 */
const express = require("express");
const puppeteer = require("puppeteer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3456;
const TEMPLATE_PATH = path.join(__dirname, "../public/certificate-template.html");
const FONT_PATH = path.join(__dirname, "../public/fonts/H2GTRE.TTF");

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// ── 폰트를 base64로 한 번만 로드 ──────────────────────────────
let fontB64 = null;
function getFontB64() {
  if (fontB64) return fontB64;
  if (fs.existsSync(FONT_PATH)) {
    fontB64 = fs.readFileSync(FONT_PATH).toString("base64");
    console.log("폰트 로드 완료:", FONT_PATH);
  } else {
    console.warn("폰트 파일 없음:", FONT_PATH, "→ 기본 폰트로 대체됩니다.");
  }
  return fontB64;
}

// 상대 경로 폰트 URL을 base64 data URI로 교체
function injectFont(html) {
  const b64 = getFontB64();
  if (!b64) return html;
  return html.replace(
    /url\(['"]?fonts\/H2GTRE\.TTF['"]?\)/gi,
    `url('data:font/truetype;base64,${b64}')`
  );
}

function fillTemplate(html, data) {
  return html
    .replace(/\{\{CERT_NO\}\}/g, data.certNo || "")
    .replace(/\{\{NAME\}\}/g, data.name || "")
    .replace(/\{\{BIRTH_DATE\}\}/g, data.birthDate || "")
    .replace(/\{\{COMPANY\}\}/g, data.company || "")
    .replace(/\{\{COURSE_NAME\}\}/g, data.courseName || "")
    .replace(/\{\{TRAINING_DATE\}\}/g, data.trainingDate || "")
    .replace(/\{\{TOTAL_HOURS\}\}/g, String(data.totalHours || ""))
    .replace(/\{\{ISSUE_DATE\}\}/g, data.issueDate || "");
}

// ── Puppeteer 브라우저 인스턴스 관리 ─────────────────────────
let browser = null;
async function getBrowser() {
  if (!browser || !browser.connected) {
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }
  return browser;
}

async function renderPdf(data) {
  const templateHtml = fs.readFileSync(TEMPLATE_PATH, "utf-8");
  const html = injectFont(fillTemplate(templateHtml, data));

  const b = await getBrowser();
  const page = await b.newPage();
  try {
    await page.setContent(html, { waitUntil: "domcontentloaded" });
    return await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: 0, bottom: 0, left: 0, right: 0 },
    });
  } finally {
    await page.close();
  }
}

// ── 엔드포인트 ────────────────────────────────────────────────
app.get("/health", (_, res) => res.json({ ok: true }));

app.post("/generate-one", async (req, res) => {
  try {
    const pdf = await renderPdf(req.body);
    res.json({ pdf: pdf.toString("base64") });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  getFontB64(); // 서버 시작 시 폰트 미리 캐싱
  console.log(`수료증 PDF 서버: http://localhost:${PORT}`);
});

process.on("exit", () => browser?.close());
