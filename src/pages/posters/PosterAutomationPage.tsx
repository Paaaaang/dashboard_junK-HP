import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import QRCode from 'qrcode';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  Sparkles, Download, Code as CodeIcon, Eye,
  Plus, X, Info, Calendar, MessageSquare, Phone,
  ZoomIn, ZoomOut, Maximize, Send, Bot, User,
  RotateCcw, Printer, Wand2, ChevronRight,
  Loader2,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────
interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
  thinking?: string;
  isStreaming?: boolean;
  streamType?: 'generate' | 'modify';
}

// ── Loading Messages ───────────────────────────────────────────────
const GENERATE_MSGS = [
  '교육 내용을 분석하고 있어요',
  '포스터 구조를 설계하고 있어요',
  '헤더 레이아웃을 구성하고 있어요',
  '색상과 타이포그래피를 조율하고 있어요',
  '교육 안내 섹션을 작성하고 있어요',
  '혜택 카드 디자인을 만들고 있어요',
  '교육 내용 영역을 배치하고 있어요',
  'QR 코드와 로고를 삽입하고 있어요',
  '프린트 CSS를 적용하고 있어요',
  '전체 코드를 검토하고 있어요',
];

const MODIFY_MSGS = [
  '수정 내용을 파악하고 있어요',
  '변경할 부분을 찾고 있어요',
  '기존 디자인을 유지하며 수정하고 있어요',
  '코드를 정밀하게 조정하고 있어요',
  '최종 결과를 검토하고 있어요',
];

function RotatingMessage({ msgs }: { msgs: string[] }) {
  const [idx, setIdx] = useState(0);
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

function ThinkingPanel({ thinking, isStreaming }: { thinking: string; isStreaming?: boolean }) {
  const [open, setOpen] = useState(true);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isStreaming && ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [thinking, isStreaming]);
  useEffect(() => {
    if (!isStreaming) setOpen(false);
  }, [isStreaming]);
  return (
    <div className="rounded-xl border text-[11px] w-full overflow-hidden" style={{ borderColor: '#e9d5ff' }}>
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

interface PosterFormData {
  courseName: string;
  introText: string;
  width: number;
  height: number;
  targetAudience: string;
  schedule: string;
  location: string;
  applyMethod: string;
  benefits: string[];
  curriculum: string;
  qrLink: string;
  contactPhone: string;
  contactEmail: string;
  contactWeb: string;
}

// ── Constants ──────────────────────────────────────────────────────
const INITIAL_FORM: PosterFormData = {
  courseName: '',
  introText: '전남대학교 생체재료개발센터는 글로벌 비임상 CRO 전문기관 및 의료기기 규제과학(RA) 전문교육 기관으로서, 기업/기관 재직자 역량 강화 및 첨단기술분야 인력양성을 위한 무료교육 및 전문가 연계 기술자문을 실시하고 있습니다. 많은 관심과 참여 부탁드립니다.',
  width: 891,
  height: 1260,
  targetAudience: '의료기기 산업 관련 기업 재직자 (고용보험 가입 필수)',
  schedule: '2026. 06. 01.(월) 09:00 ~ 18:00 (1일, 8시간)',
  location: '전남대학교 K-하이테크 플랫폼 2층 교육장 (광주 북구 무등로 68-3, 2층)',
  applyMethod: 'QR코드 스캔 후 신청서 작성',
  benefits: ['교육비 전액 무료', '교재 및 중식 제공', '수료증 발급 (80% 이상 수강 시)', '전문가 기술자문 참여 우대'],
  curriculum: '',
  qrLink: '',
  contactPhone: '062-710-2896',
  contactEmail: 'bmclog@naver.com',
  contactWeb: 'https://bmckhp.kr/',
};

const CHECKERBOARD: React.CSSProperties = {
  backgroundImage: `linear-gradient(45deg, #c0c0c0 25%, transparent 25%),
    linear-gradient(-45deg, #c0c0c0 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #c0c0c0 75%),
    linear-gradient(-45deg, transparent 75%, #c0c0c0 75%)`,
  backgroundSize: '20px 20px',
  backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
  backgroundColor: '#d8d8d8',
};

const IC = 'w-full p-2 text-sm bg-gray-50 border border-transparent rounded-lg focus:outline-none focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all';
const LC = 'block text-[10px] font-bold text-text-secondary mb-1 uppercase tracking-wide';

// ── Component ──────────────────────────────────────────────────────
export function PosterAutomationPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [formData, setFormData] = useState<PosterFormData>(INITIAL_FORM);
  const [benefitInput, setBenefitInput] = useState('');

  // AI Settings
  const [aiModel, setAiModel] = useState('anthropic/claude-opus-4.7');
  const [designGuidelines, setDesignGuidelines] = useState('');
  const [aiReco, setAiReco] = useState('');
  const [isRecommending, setIsRecommending] = useState(false);

  // QR
  const [qrDataUrl, setQrDataUrl] = useState('');

  useEffect(() => {
    if (!formData.qrLink.trim()) { setQrDataUrl(''); return; }
    QRCode.toDataURL(formData.qrLink, { width: 200, margin: 1, color: { dark: '#000000', light: '#ffffff' } })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(''));
  }, [formData.qrLink]);

  // Generation
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);
  const [generatedMarkup, setGeneratedMarkup] = useState('');

  // Preview
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [zoom, setZoom] = useState(0.4);

  // Chat
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Helpers ──────────────────────────────────────────────────────
  const extractHtml = (text: string) => {
    const m = text.match(/```html\n([\s\S]*?)\n```/i);
    return (m ? m[1] : text).trim();
  };

  const getIframeSrc = (markup: string) => {
    if (!markup) return '';
    const base = `<base href="${window.location.origin}/">`;
    let html = /<head[^>]*>/i.test(markup)
      ? markup.replace(/<head[^>]*>/i, m => m + base)
      : markup;
    // Replace QR placeholder with actual data URI at render time
    if (qrDataUrl) html = html.split('__QR__').join(qrDataUrl);
    return html;
  };



  const callAPI = async (
    sessionId: string,
    system: string,
    msgs: Array<{ role: string; content: string }>,
    model: string,
    onChunk: (chunk: string, type: 'content' | 'thinking') => void,
  ) => {
    const url = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '');
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error('Supabase 설정 누락');

    const res = await fetch(`${url}/functions/v1/generate-with-timely`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}`, apikey: key },
      body: JSON.stringify({ sessionId, model, instructions: system, messages: msgs, stream: true, thinking: true }),
    });
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      throw new Error(e.error || `HTTP ${res.status}`);
    }
    if (!res.body) throw new Error('No response body');

    const reader = res.body.getReader();
    const dec = new TextDecoder('utf-8');
    let done = false;
    let buf = '';
    while (!done) {
      const { value, done: d } = await reader.read();
      done = d;
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop() || '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const s = line.slice(6).trim();
        if (!s || s === '[DONE]') continue;
        try {
          const p = JSON.parse(s);
          // Native Timely format: { type: 'token'|'thinking', content: '...' }
          if (p.type === 'token') {
            onChunk(p.content, 'content');
          } else if (p.type === 'thinking') {
            onChunk(p.content, 'thinking');
          // Bridge OpenAI-compatible format: { choices: [{ delta: { content, reasoning_content } }] }
          } else if (p.choices?.[0]?.delta) {
            const d = p.choices[0].delta;
            if (d.content) onChunk(d.content, 'content');
            if (d.reasoning_content) onChunk(d.reasoning_content, 'thinking');
          // Fallback: plain message field
          } else if (typeof p.message === 'string') {
            onChunk(p.message, 'content');
          }
        } catch { /* ignore */ }
      }
    }
  };

  // ── Handlers ─────────────────────────────────────────────────────
  const handleReset = () => {
    if (!window.confirm('모든 작업이 초기화됩니다. 새 포스터를 만드시겠습니까?')) return;
    setFormData(INITIAL_FORM);
    setDesignGuidelines('');
    setAiReco('');
    setGeneratedMarkup('');
    setIsGenerating(false);
    setIsGenerated(false);
    setBenefitInput('');
    setZoom(0.4);
    setMessages([]);
    setChatInput('');
    setActiveTab('preview');
    setStep(1);
  };

  const handleGetRecommendation = async () => {
    if (isRecommending) return;
    setIsRecommending(true);
    setAiReco('');
    try {
      await callAPI(
        `reco-${Date.now()}`,
        `당신은 시각 디자인 전문가입니다. 제공된 교육 프로그램 정보를 분석하여 포스터 디자인 지침을 제안하세요.
포함 항목: 추천 색상 팔레트(HEX 코드, 주색/보조색/배경색), 타이포그래피 분위기, 레이아웃 방향, 전체 무드.
300자 이내, 한국어로 간결하게.`,
        [{ role: 'user', content: `교육 정보:\n${JSON.stringify(formData, null, 2)}` }],
        'anthropic/claude-haiku-4.5',
        (chunk, type) => { if (type === 'content') setAiReco(prev => prev + chunk); },
      );
    } catch {
      setAiReco('추천을 가져오는데 실패했습니다.');
    } finally {
      setIsRecommending(false);
    }
  };

  const handleGenerate = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setGeneratedMarkup('');

    setMessages([{
      role: 'ai',
      content: '',
      isStreaming: true,
      streamType: 'generate',
    }]);

    try {
      let acc = '';
      let thinkingAcc = '';

      await callAPI(
        `poster-${Date.now()}`,
        `You are a senior design engineer specializing in Korean educational event posters.
Generate a complete poster as a single self-contained HTML file. Apply the user's design guidelines fully and creatively — all colors, fonts, weights, backgrounds, and visual style are entirely up to you based on those guidelines.

SECTION ORDER (must follow this exact sequence, 7 sections):
1. Header — full-bleed: spans the entire width with zero margin/padding on the wrapper; internal padding only for text. Contains course title + organization name.
2. Intro — organization description paragraph
3. 교육 안내 — 4 rows: 교육대상 / 교육일정 / 교육장소 / 신청방법; each row has an inline SVG icon + label + value separated by spacing or a thin divider line — NO background boxes on rows or icons.
4. 교육 혜택 — 4 columns; each column: large inline SVG icon + label text below; NO card backgrounds or border boxes — use whitespace only.
5. 교육 내용 — two columns: left = curriculum list, right = QR area
   QR image: ${formData.qrLink ? '<img src="__QR__" alt="교육신청 QR" style="width:140px;height:140px;display:block;">' : 'empty 140×140 placeholder box labeled "교육신청 QR"'}
6. 문의사항 — single row: 홈페이지 / 전화 / 이메일; use thin dividers or spacing — NO icon boxes.
7. Footer — logos in one row, evenly spaced:
   /assets/posters/logos/로고1.png /assets/posters/logos/로고2.png /assets/posters/logos/로고3.png /assets/posters/logos/로고4.png (each height: 44px)

DESIGN PRINCIPLES — strictly follow these:
- ANTI BOX-IN-BOX: Never nest a colored/bordered box inside another box. Use whitespace, padding, and thin horizontal divider lines (1px border-bottom or border-top) to separate content. Section backgrounds are fine, but never add inner card/box backgrounds on top of them.
- ICONS: Render icons inline (SVG) next to text. Never wrap icons in a separate background circle, square, or rounded box.
- FULL-BLEED HEADER: The header element must have width: 100%; margin: 0; padding: 0 on its outer wrapper. Apply background and inner content padding inside.
- TYPOGRAPHY: Base body font-size minimum 15px. Headings proportionally larger. Line-height 1.25–1.35 (tight). Letter-spacing slightly tight (-0.01em to 0em) for Korean text.

LAYOUT & SIZING — critical for fitting within the poster dimensions:
- Outer wrapper: display:flex; flex-direction:column; width:${formData.width}px; height:${formData.height}px; overflow:hidden; box-sizing:border-box;
- Each section gets a flex value so all 7 sections together always fill exactly the poster height — no section uses a fixed pixel height.
  Suggested flex weights (adjust based on content): header:1.2 intro:0.9 교육안내:2 교육혜택:1.8 교육내용:2.5 문의사항:0.8 footer:0.8
- Every element: box-sizing:border-box; overflow:hidden;
- Use only padding (no fixed heights) for inner spacing within sections.
- @media print { @page { size: 210mm 297mm; margin: 0; } * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }

TECHNICAL RULES:
- All styles in one <style> block. No external CSS or JS.
- html, body { width: ${formData.width}px; height: ${formData.height}px; margin: 0; padding: 0; overflow: hidden; }
- Use inline SVG for all icons.
- Output exactly one \`\`\`html\`\`\` code block. No explanations.`,
        [{
          role: 'user',
          content: `포스터 데이터:\n${JSON.stringify(formData, null, 2)}\n\n디자인 지침:\n${designGuidelines || '전문적이고 신뢰감 있는 공공기관 스타일로 자유롭게 디자인하세요.'}`,
        }],
        aiModel,
        (chunk, type) => {
          if (type === 'thinking') {
            thinkingAcc += chunk;
            setMessages(prev => {
              const msgs = [...prev];
              if (msgs[0]) msgs[0] = { ...msgs[0], thinking: thinkingAcc };
              return msgs;
            });
          } else if (type === 'content') {
            acc += chunk;
          }
        },
      );

      const finalHtml = extractHtml(acc);
      if (finalHtml) setGeneratedMarkup(finalHtml);
      setIsGenerated(true);

      // Stream a summary of the generated poster from a lightweight model
      let summaryAcc = '';
      setMessages(prev => {
        const msgs = [...prev];
        if (msgs[0]) msgs[0] = { ...msgs[0], isStreaming: true, thinking: thinkingAcc || undefined };
        return msgs;
      });

      await callAPI(
        `poster-summary-${Date.now()}`,
        `당신은 디자인 리뷰어입니다. 생성된 포스터 HTML을 분석하고 한국어로 간결하게 설명하세요.
다음 항목을 2~3문장으로 요약하세요:
- 사용된 색상 팔레트 (주색, 보조색, 배경색 HEX 포함)
- 헤더 스타일
- 레이아웃 특징
마지막에 "디자인이 마음에 드시나요? 수정이 필요한 부분이 있으면 말씀해 주세요." 문장으로 마무리하세요.
설명 외의 불필요한 서두나 마크다운 헤더는 쓰지 마세요.`,
        [{ role: 'user', content: `생성된 포스터 HTML:\n\`\`\`html\n${finalHtml}\n\`\`\`` }],
        'anthropic/claude-haiku-4.5',
        (chunk, type) => {
          if (type === 'content') {
            summaryAcc += chunk;
            setMessages(prev => {
              const msgs = [...prev];
              if (msgs[0]) msgs[0] = { ...msgs[0], content: summaryAcc };
              return msgs;
            });
          }
        },
      );

      setMessages(prev => {
        const msgs = [...prev];
        if (msgs[0]) msgs[0] = {
          ...msgs[0],
          isStreaming: false,
          thinking: thinkingAcc || undefined,
        };
        return msgs;
      });
    } catch (e: any) {
      setMessages([{
        role: 'ai',
        content: `오류가 발생했습니다: ${e.message}`,
        isStreaming: false,
      }]);
    } finally {
      setIsGenerating(false);
    }
  };

  const goToStep3AndGenerate = () => {
    setStep(3);
    handleGenerate();
  };

  const executeModification = async (request: string) => {
    const context = `[수정 요청]: ${request}`;

    setMessages(prev => [
      ...prev,
      { role: 'ai', content: '', isStreaming: true, streamType: 'modify' },
    ]);

    try {
      let acc = '';
      let thinkingAcc = '';

      await callAPI(
        'poster-modify',
        `You are an expert Frontend Developer in canvas patch mode. You receive a complete poster HTML and a change request.

STRICT PATCH RULES — violating these is a critical failure:
1. Identify the MINIMAL set of CSS properties or HTML attributes that satisfy the request.
2. Change ONLY those properties. Every other character of the original HTML must remain identical.
3. NEVER change: section order, flex/grid structure, footer logos, @media print block, font stacks, overall color scheme (unless explicitly requested).`,
        [{ role: 'user', content: `[Current HTML]\n\`\`\`html\n${generatedMarkup}\n\`\`\`\n\n${context}` }],
        aiModel,
        (chunk, type) => {
          if (type === 'thinking') {
            thinkingAcc += chunk;
            setMessages(prev => {
              const msgs = [...prev];
              const last = msgs.length - 1;
              if (msgs[last]) msgs[last] = { ...msgs[last], thinking: thinkingAcc };
              return msgs;
            });
          } else if (type === 'content') {
            acc += chunk;
          }
        },
      );

      const updated = extractHtml(acc);
      if (updated) setGeneratedMarkup(updated);

      setMessages(prev => {
        const msgs = [...prev];
        const last = msgs.length - 1;
        if (msgs[last]) msgs[last] = {
          ...msgs[last],
          content: '수정이 완료되었습니다.',
          isStreaming: false,
          thinking: thinkingAcc || undefined,
        };
        return msgs;
      });
    } catch {
      setMessages(prev => {
        const msgs = [...prev];
        const last = msgs.length - 1;
        if (msgs[last]) msgs[last] = {
          ...msgs[last],
          content: '오류가 발생했습니다. 다시 시도해주세요.',
          isStreaming: false,
        };
        return msgs;
      });
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isChatLoading || !isGenerated) return;
    const userMsg = chatInput;
    setChatInput('');
    setIsChatLoading(true);

    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);

    try {
      await executeModification(userMsg);
    } catch {
      setMessages(prev => [...prev, {
        role: 'ai',
        content: '오류가 발생했습니다. 다시 시도해주세요.',
      }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handlePrint = () => {
    if (!generatedMarkup) return;
    const blob = new Blob([getIframeSrc(generatedMarkup)], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (!win) { URL.revokeObjectURL(url); alert('팝업이 차단되었습니다. 팝업 허용 후 다시 시도해주세요.'); return; }
    win.onload = () => { win.focus(); win.print(); URL.revokeObjectURL(url); };
  };

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
        width: formData.width,
        height: formData.height,
        windowWidth: formData.width,
        windowHeight: formData.height,
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

  const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const addBenefit = (e?: React.KeyboardEvent<HTMLInputElement>) => {
    if (e && e.key !== 'Enter') return;
    e?.preventDefault();
    const v = benefitInput.trim();
    if (v && !formData.benefits.includes(v)) {
      setFormData(prev => ({ ...prev, benefits: [...prev.benefits, v] }));
      setBenefitInput('');
    }
  };

  // ── Step Navigator ────────────────────────────────────────────────
  const StepNav = () => (
    <div className="flex items-center gap-1">
      {([1, 2, 3] as const).map((s, i) => {
        const labels = ['정보 입력', 'AI 설정', '생성 & 수정'];
        const active = step === s;
        const done = step > s;
        const clickable = s < step || (s === 3 && isGenerated);
        return (
          <React.Fragment key={s}>
            <button
              onClick={() => clickable && setStep(s)}
              disabled={!clickable && s > step}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                active
                  ? 'bg-brand-primary text-white shadow-sm'
                  : done
                  ? 'bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20 cursor-pointer'
                  : s > step
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              <span className="font-black">{s}</span>
              {labels[i]}
            </button>
            {i < 2 && <ChevronRight size={12} className="text-gray-300 shrink-0" />}
          </React.Fragment>
        );
      })}
    </div>
  );

  // ── Step 1: 정보 입력 (전체 표시, 스크롤 없음) ──────────────────
  const renderStep1 = () => (
    <div className="flex flex-col gap-3 h-full">
      {/* Row 1: 과정명 + 규격 */}
      <div className="grid grid-cols-4 gap-2 shrink-0">
        <div className="col-span-2">
          <label className={LC}>과정명 *</label>
          <input name="courseName" value={formData.courseName} onChange={handleInput} className={IC} placeholder="교육 과정명" />
        </div>
        <div>
          <label className={LC}>가로 (px)</label>
          <input type="number" name="width" value={formData.width} onChange={handleInput} className={IC} />
        </div>
        <div>
          <label className={LC}>세로 (px)</label>
          <input type="number" name="height" value={formData.height} onChange={handleInput} className={IC} />
        </div>
      </div>

      {/* Row 2: 좌우 2컬럼 */}
      <div className="grid grid-cols-2 gap-3 flex-1 min-h-0">
        {/* 좌: 교육 안내 + 교육 혜택 */}
        <div className="flex flex-col gap-3">
          <div className="space-y-1.5">
            <p className={`${LC} flex items-center gap-1`}><Calendar size={10} className="text-brand-primary" />교육 안내</p>
            <div>
              <label className={LC}>교육 대상</label>
              <input name="targetAudience" value={formData.targetAudience} onChange={handleInput} className={`${IC} text-xs`} placeholder="교육 대상" />
            </div>
            <div>
              <label className={LC}>일정</label>
              <input name="schedule" value={formData.schedule} onChange={handleInput} className={`${IC} text-xs`} placeholder="교육 일정" />
            </div>
            <div>
              <label className={LC}>장소</label>
              <input name="location" value={formData.location} onChange={handleInput} className={`${IC} text-xs`} placeholder="교육 장소" />
            </div>
            <div>
              <label className={LC}>신청 방법</label>
              <input name="applyMethod" value={formData.applyMethod} onChange={handleInput} className={`${IC} text-xs`} placeholder="신청 방법" />
            </div>
          </div>

          <div className="space-y-1.5">
            <p className={`${LC} flex items-center gap-1`}><Sparkles size={10} className="text-brand-primary" />교육 혜택</p>
            <div className="relative">
              <input
                value={benefitInput}
                onChange={e => setBenefitInput(e.target.value)}
                onKeyDown={addBenefit}
                className={`${IC} pr-9 text-xs`}
                placeholder="항목 입력 후 Enter"
              />
              <button onClick={() => addBenefit()} className="absolute right-1.5 top-1.5 p-1 bg-brand-primary text-white rounded hover:brightness-110">
                <Plus size={11} />
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              {formData.benefits.map((b, i) => (
                <span key={i} className="flex items-center gap-1 px-2 py-0.5 bg-brand-primary/10 text-brand-primary rounded-full text-[10px] font-medium">
                  {b}
                  <button onClick={() => setFormData(p => ({ ...p, benefits: p.benefits.filter((_, j) => j !== i) }))} className="hover:text-red-500">
                    <X size={9} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 우: 소개 + 교육 내용 + 문의 */}
        <div className="flex flex-col gap-3">
          <div className="space-y-1.5">
            <p className={`${LC} flex items-center gap-1`}><Info size={10} className="text-brand-primary" />소개 문구</p>
            <textarea name="introText" value={formData.introText} onChange={handleInput} className={`${IC} text-xs resize-none`} style={{ height: '72px' }} />
          </div>

          <div className="space-y-1.5">
            <p className={`${LC} flex items-center gap-1`}><MessageSquare size={10} className="text-brand-primary" />교육 내용</p>
            <textarea name="curriculum" value={formData.curriculum} onChange={handleInput} className={`${IC} text-xs resize-none`} style={{ height: '56px' }} placeholder="커리큘럼" />
            <div>
              <label className={LC}>QR 링크</label>
              <div className="flex gap-2 items-start">
                <input name="qrLink" value={formData.qrLink} onChange={handleInput} className={`${IC} text-xs flex-1`} placeholder="신청 링크 입력 시 자동 생성" />
                {qrDataUrl && (
                  <div className="shrink-0 w-14 h-14 border rounded-lg overflow-hidden bg-white" style={{ borderColor: 'var(--color-border)' }}>
                    <img src={qrDataUrl} alt="QR" className="w-full h-full object-contain" />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <p className={`${LC} flex items-center gap-1`}><Phone size={10} className="text-brand-primary" />문의 정보</p>
            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <label className={LC}>전화</label>
                <input name="contactPhone" value={formData.contactPhone} onChange={handleInput} className={`${IC} text-xs`} />
              </div>
              <div>
                <label className={LC}>이메일</label>
                <input name="contactEmail" value={formData.contactEmail} onChange={handleInput} className={`${IC} text-xs`} />
              </div>
            </div>
            <div>
              <label className={LC}>웹사이트</label>
              <input name="contactWeb" value={formData.contactWeb} onChange={handleInput} className={`${IC} text-xs`} />
            </div>
          </div>
        </div>
      </div>

      {/* 다음 버튼 */}
      <div className="pt-2 border-t shrink-0" style={{ borderColor: 'var(--color-border)' }}>
        <button
          onClick={() => setStep(2)}
          disabled={!formData.courseName.trim()}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-white transition-all hover:brightness-110 disabled:opacity-40 shadow-md text-sm"
          style={{ background: 'var(--brand-primary)' }}
        >
          다음: AI 설정 <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );

  // ── Step 2: AI 설정 ────────────────────────────────────────────
  const renderStep2 = () => (
    <>
      <div className="flex-1 overflow-y-auto space-y-6 pr-1 pb-4 scrollbar-thin">
        <section className="space-y-2">
          <h2 className={LC}>AI 모델 선택</h2>
          <select value={aiModel} onChange={e => setAiModel(e.target.value)} className={IC}>
            <optgroup label="— Claude (Bridge · 추론 지원)">
              <option value="anthropic/claude-opus-4.7">Claude Opus 4.7 — 최고 품질</option>
              <option value="anthropic/claude-sonnet-4.6">Claude Sonnet 4.6 — 균형</option>
              <option value="anthropic/claude-haiku-4.5">Claude Haiku 4.5 — 경량</option>
            </optgroup>
            <optgroup label="— GPT / o-series (Native)">
              <option value="gpt-5.4">GPT-5.4</option>
              <option value="gpt-5.4-mini">GPT-5.4 Mini</option>
              <option value="gpt-5.1">GPT-5.1</option>
              <option value="gpt-5-mini">GPT-5 Mini</option>
              <option value="gpt-4.1">GPT-4.1</option>
              <option value="gpt-4.1-mini">GPT-4.1 Mini — 경량</option>
              <option value="gpt-4o">GPT-4o</option>
              <option value="gpt-4o-mini">GPT-4o Mini</option>
              <option value="gpt-o4-mini">o4-mini — 추론</option>
              <option value="gpt-o3">o3 — 추론</option>
              <option value="o3-deep-research">o3 Deep Research</option>
            </optgroup>
            <optgroup label="— Gemini (Native)">
              <option value="gemini-3.1-pro">Gemini 3.1 Pro — 최고 품질</option>
              <option value="gemini-3-flash">Gemini 3 Flash</option>
              <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite</option>
              <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
              <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
              <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
            </optgroup>
            <optgroup label="— Grok (Native)">
              <option value="grok-4">Grok 4 — 최고 품질</option>
              <option value="grok-4-1-fast-reasoning">Grok 4.1 Fast Reasoning</option>
              <option value="grok-4-1-fast-non-reasoning">Grok 4.1 Fast</option>
              <option value="grok-3">Grok 3</option>
              <option value="grok-3-mini">Grok 3 Mini</option>
            </optgroup>
            <optgroup label="— Mistral (Native)">
              <option value="mistral-large">Mistral Large</option>
              <option value="mistral-medium">Mistral Medium</option>
              <option value="magistral-medium">Magistral Medium — 추론</option>
              <option value="magistral-small">Magistral Small</option>
              <option value="codestral">Codestral — 코드 특화</option>
            </optgroup>
            <optgroup label="— 기타 (Native)">
              <option value="llama-4-scout-17b">Llama 4 Scout 17B</option>
              <option value="qwen-qwq-32b">Qwen QwQ 32B — 추론</option>
              <option value="solar-pro3">Solar Pro 3</option>
            </optgroup>
          </select>
        </section>

        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className={LC}>디자인 지침</h2>
            <button
              onClick={handleGetRecommendation}
              disabled={isRecommending}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-[11px] font-bold hover:bg-purple-100 transition-all disabled:opacity-50"
            >
              <Wand2 size={11} className={isRecommending ? 'animate-spin' : ''} />
              {isRecommending ? 'AI 분석 중...' : 'AI 추천 받기'}
            </button>
          </div>
          <textarea
            value={designGuidelines}
            onChange={e => setDesignGuidelines(e.target.value)}
            className={`${IC} h-28 resize-none`}
            placeholder="예: 전남대 그린/블루 계열, 신뢰감 있는 공공기관 스타일, 깔끔한 세로형 레이아웃"
          />
        </section>

        {(aiReco || isRecommending) && (
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-bold text-purple-700 flex items-center gap-1.5">
                <Bot size={12} /> AI 디자인 추천
              </h3>
              {aiReco && !isRecommending && (
                <button
                  onClick={() => setDesignGuidelines(p => p ? `${p}\n\n${aiReco}` : aiReco)}
                  className="text-[11px] font-bold text-brand-primary hover:underline"
                >
                  지침에 적용
                </button>
              )}
            </div>
            <div className="p-3 bg-purple-50 border border-purple-100 rounded-xl text-[12px] text-purple-900 leading-relaxed min-h-[60px]">
              {isRecommending && !aiReco
                ? <span className="text-purple-400 animate-pulse">분석 중...</span>
                : (
                  <ReactMarkdown
                    components={{
                      h1: ({ children }) => <p className="font-bold text-[13px] text-purple-800 mb-1 mt-2 first:mt-0">{children}</p>,
                      h2: ({ children }) => <p className="font-bold text-[13px] text-purple-800 mb-1 mt-2 first:mt-0">{children}</p>,
                      h3: ({ children }) => <p className="font-semibold text-[12px] text-purple-700 mb-0.5 mt-1.5">{children}</p>,
                      p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                      strong: ({ children }) => <strong className="font-bold text-purple-800">{children}</strong>,
                      em: ({ children }) => <em className="italic text-purple-700">{children}</em>,
                      ul: ({ children }) => <ul className="list-disc pl-4 my-1 space-y-0.5">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal pl-4 my-1 space-y-0.5">{children}</ol>,
                      li: ({ children }) => <li className="text-purple-900">{children}</li>,
                      code: ({ children }) => <code className="bg-purple-100 text-purple-700 px-1 rounded text-[11px] font-mono">{children}</code>,
                      hr: () => <hr className="border-purple-200 my-2" />,
                    }}
                  >
                    {aiReco}
                  </ReactMarkdown>
                )}
            </div>
          </section>
        )}
      </div>

      <div className="pt-4 border-t shrink-0 flex gap-2" style={{ borderColor: 'var(--color-border)' }}>
        <button onClick={() => setStep(1)} className="px-4 py-2.5 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all text-sm">
          이전
        </button>
        <button
          onClick={goToStep3AndGenerate}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-white transition-all hover:brightness-110 shadow-md text-sm"
          style={{ background: 'var(--brand-primary)' }}
        >
          <Sparkles size={15} /> AI 포스터 생성 시작
        </button>
      </div>
    </>
  );

  // ── Step 3: 생성 & 수정 ────────────────────────────────────────
  const renderStep3 = () => (
    <>
      {/* Preview Panel */}
      <div className="flex-1 flex flex-col min-h-0">
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

        <div className="flex-1 min-h-0 rounded-xl overflow-hidden border" style={{ borderColor: 'var(--color-border)' }}>
          {activeTab === 'preview' ? (
            <div className="w-full h-full overflow-auto flex items-start justify-center p-8" style={CHECKERBOARD}>
              {generatedMarkup ? (
                <div style={{
                  width: formData.width * zoom,
                  height: formData.height * zoom,
                  flexShrink: 0,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
                  position: 'relative',
                }}>
                  <iframe
                    ref={iframeRef}
                    title="Poster Preview"
                    sandbox="allow-same-origin"
                    style={{
                      width: `${formData.width}px`,
                      height: `${formData.height}px`,
                      transform: `scale(${zoom})`,
                      transformOrigin: 'top left',
                      border: 'none',
                      display: 'block',
                    }}
                    srcDoc={getIframeSrc(generatedMarkup)}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 text-gray-400 h-full w-full">
                  {isGenerating
                    ? <Loader2 size={28} className="animate-spin text-brand-primary/40" />
                    : <><Sparkles size={28} className="opacity-20" /><p className="text-sm">포스터를 생성해주세요</p></>}
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-full bg-[#1e1e1e] p-4 overflow-auto">
              <pre className="font-mono text-[11px] text-gray-300 whitespace-pre-wrap">{generatedMarkup || '아직 생성된 코드가 없습니다.'}</pre>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 mt-2 shrink-0">
          <button onClick={handlePrint} disabled={!generatedMarkup} className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 text-white rounded-lg text-xs font-bold hover:bg-gray-700 transition-all disabled:opacity-40">
            <Printer size={13} /> 인쇄
          </button>
          <button onClick={handleDownload} disabled={!generatedMarkup} className="flex items-center gap-1.5 px-3 py-2 bg-white border text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-50 transition-all disabled:opacity-40" style={{ borderColor: 'var(--color-border)' }}>
            <Download size={13} /> PNG
          </button>
          <div className="flex-1" />
          <button onClick={handleReset} className="flex items-center gap-1.5 px-3 py-2 bg-white border text-gray-500 rounded-lg text-xs font-bold hover:bg-gray-50 transition-all" style={{ borderColor: 'var(--color-border)' }}>
            <RotateCcw size={13} /> 새로 만들기
          </button>
        </div>
      </div>

      {/* Chat Panel */}
      <div className="w-80 flex flex-col min-h-0 border rounded-xl overflow-hidden bg-white" style={{ borderColor: 'var(--color-border)' }}>
        <div className="px-4 py-3 border-b bg-gray-50 shrink-0 flex items-center gap-2" style={{ borderColor: 'var(--color-border)' }}>
          <div className="w-7 h-7 rounded-full bg-brand-primary flex items-center justify-center shrink-0">
            <Bot size={14} className="text-white" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-800">AI 어시스턴트</p>
            <p className="text-[10px] text-gray-400">{aiModel.split('/').pop()}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin">
          {messages.length === 0 && (
            <div className="text-center text-xs text-gray-400 py-10">
              <Bot size={28} className="mx-auto mb-2 opacity-20" />
              <p>생성이 완료되면<br />여기서 수정 요청을 할 수 있어요</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'items-start'}`}>
              {/* Avatar */}
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                msg.role === 'user' ? 'bg-gray-200 text-gray-600' : 'bg-brand-primary text-white'
              }`}>
                {msg.role === 'user'
                  ? <User size={11} />
                  : msg.isStreaming ? <Sparkles size={11} className="animate-pulse" /> : <Bot size={11} />}
              </div>

              {/* Bubble area */}
              <div className={`space-y-1.5 ${msg.role === 'user' ? 'items-end flex flex-col' : ''}`} style={{ maxWidth: '85%' }}>
                {/* Rotating loading message — only while thinking hasn't arrived yet */}
                {msg.role === 'ai' && msg.isStreaming && !msg.thinking && !msg.content && (
                  <div className="flex items-center gap-1.5 px-1 py-0.5">
                    <Loader2 size={10} className="animate-spin flex-shrink-0" style={{ color: 'var(--brand-primary)' }} />
                    <RotatingMessage msgs={msg.streamType === 'generate' ? GENERATE_MSGS : MODIFY_MSGS} />
                  </div>
                )}

                {/* Thinking panel — visible while reasoning streams and collapsible after */}
                {msg.role === 'ai' && msg.thinking !== undefined && (
                  <ThinkingPanel thinking={msg.thinking} isStreaming={msg.isStreaming} />
                )}

                {/* Content bubble */}
                {msg.content && (
                  <div className={`px-3 py-2 text-xs leading-relaxed rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-gray-100 text-gray-800 rounded-tr-sm'
                      : 'bg-brand-primary/5 border border-brand-primary/10 text-gray-800 rounded-tl-sm'
                  }`}>
                    {msg.content || (
                      <span className="flex gap-0.5 items-center h-4">
                        {[0, 0.15, 0.3].map((delay, k) => (
                          <span
                            key={k}
                            className="w-1.5 h-1.5 bg-brand-primary/50 rounded-full animate-bounce"
                            style={{ animationDelay: `${delay}s` }}
                          />
                        ))}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <div className="p-2 border-t shrink-0" style={{ borderColor: 'var(--color-border)' }}>
          <div className={`flex items-center gap-1 border rounded-lg px-2 transition-all bg-white ${
            !isGenerated || isGenerating
              ? 'opacity-50'
              : 'focus-within:ring-2 focus-within:ring-brand-primary/20'
          }`} style={{ borderColor: 'var(--color-border)' }}>
            <input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) { e.preventDefault(); handleSendMessage(); } }}
              disabled={!isGenerated || isChatLoading || isGenerating}
              placeholder={!isGenerated || isGenerating ? '생성 후 활성화' : '수정 요청 입력...'}
              className="flex-1 bg-transparent border-none outline-none text-xs px-1 py-2"
            />
            <button
              onClick={handleSendMessage}
              disabled={!chatInput.trim() || isChatLoading || !isGenerated || isGenerating}
              className="p-1.5 bg-brand-primary text-white rounded-md disabled:opacity-40 hover:brightness-110 transition-colors shrink-0"
            >
              <Send size={12} />
            </button>
          </div>
        </div>
      </div>
    </>
  );

  // ── Main Layout ────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full space-y-4">
      <PageHeader
        title="포스터 자동화"
        description="AI가 교육 프로그램 포스터를 자동 생성합니다."
        actions={<StepNav />}
      />

      <div className="flex-1 min-h-0 flex flex-col">
        {step === 1 && (
          <div className="flex-1 min-h-0 flex justify-center">
            <div className="w-full max-w-3xl flex flex-col min-h-0">
              {renderStep1()}
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="flex-1 min-h-0 flex justify-center">
            <div className="w-full max-w-lg flex flex-col min-h-0">
              {renderStep2()}
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="flex-1 min-h-0 flex gap-4">
            {renderStep3()}
          </div>
        )}
      </div>
    </div>
  );
}
