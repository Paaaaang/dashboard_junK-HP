import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { 
  Sparkles, 
  Image as ImageIcon, 
  Download, 
  Code as CodeIcon, 
  Eye, 
  Plus, 
  X,
  Info,
  Calendar,
  MessageSquare,
  Phone,
  ZoomIn,
  ZoomOut,
  Maximize,
  ChevronDown,
  ChevronUp,
  Send,
  Bot,
  User,
  RotateCcw
} from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
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
  designGuidelines: string;
}

const INITIAL_FORM_DATA: PosterFormData = {
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
  designGuidelines: '',
};

export function PosterAutomationPage() {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [aiModel, setAiModel] = useState<string>('anthropic/claude-opus-4.7');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<number>(0);
  const [reasoningText, setReasoningText] = useState<string>('');
  const [isGenerated, setIsGenerated] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(true);
  const [benefitInput, setBenefitInput] = useState('');
  const [zoom, setZoom] = useState(0.4);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatListRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isGenerating) {
      setElapsedTime(0);
      timer = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isGenerating]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const [formData, setFormData] = useState<PosterFormData>(INITIAL_FORM_DATA);
  const [generatedMarkup, setGeneratedMarkup] = useState<string>('');

  const extractHtmlFromResponse = (response: unknown) => {
    const text = typeof response === 'string' ? response : JSON.stringify(response);
    const match = text.match(/```html\n([\s\S]*?)\n```/i);
    return (match ? match[1] : text).trim();
  };

  const callTimelyAPIStream = async (sessionId: string, instructions: string, messages: Array<{ role: string; content: string }>, onChunk: (chunk: string, type: 'content' | 'thinking') => void) => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase 설정이 누락되었습니다');
      }

      const baseUrl = supabaseUrl.replace(/\/$/, '');

      const response = await fetch(`${baseUrl}/functions/v1/generate-with-timely`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'apikey': supabaseAnonKey,
        },
        body: JSON.stringify({
          sessionId,
          model: aiModel,
          instructions,
          messages,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 404) {
          throw new Error('Edge Function을 찾을 수 없습니다. 배포 여부와 VITE_SUPABASE_URL을 확인해주세요.');
        }
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      
      let done = false;
      let buffer = '';
      
      while (!done) {
        const result = await reader.read();
        done = result.done;
        if (done) break;
        
        buffer += decoder.decode(result.value, { stream: true });
        const lines = buffer.split('\n');
        
        // Keep the last line in the buffer because it might be incomplete
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (dataStr === '[DONE]') continue;
            if (!dataStr) continue;
            
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.choices && parsed.choices[0]) {
                const delta = parsed.choices[0].delta;
                if (delta.content) {
                  onChunk(delta.content, 'content');
                }
                if (delta.reasoning_content) {
                   onChunk(delta.reasoning_content, 'thinking');
                }
              } else if (parsed.message) {
                // native format
                if (typeof parsed.message === 'string') {
                  onChunk(parsed.message, 'content');
                }
              }
            } catch (e) {
              console.warn("Failed to parse SSE line", dataStr);
            }
          }
        }
      }
    } catch (error) {
      console.error('Timely API Stream Error:', error);
      throw error;
    }
  };

  const handleReset = () => {
    if (window.confirm("현재 작업 중인 내용이 모두 초기화됩니다. 새 포스터를 만드시겠습니까?")) {
      setFormData(INITIAL_FORM_DATA);
      setGeneratedMarkup('');
      setIsGenerating(false);
      setGenerationStep(0);
      setIsGenerated(false);
      setIsFormOpen(true);
      setBenefitInput('');
      setZoom(0.4);
      setMessages([]);
      setChatInput('');
      setActiveTab('preview');
      setReasoningText('');
    }
  };

  useEffect(() => {
    if (chatListRef.current) {
      chatListRef.current.scrollTop = chatListRef.current.scrollHeight;
    }
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddBenefit = (e?: KeyboardEvent<HTMLInputElement>) => {
    if (e && e.key !== 'Enter') return;
    if (e) e.preventDefault();
    if (benefitInput.trim() && !formData.benefits.includes(benefitInput.trim())) {
      setFormData(prev => ({ ...prev, benefits: [...prev.benefits, benefitInput.trim()] }));
      setBenefitInput('');
    }
  };

  const removeBenefit = (index: number) => {
    setFormData(prev => ({ ...prev, benefits: prev.benefits.filter((_, i) => i !== index) }));
  };

  const handleZoom = (type: 'in' | 'out' | 'reset') => {
    if (type === 'in') setZoom(prev => Math.min(prev + 0.1, 1.5));
    else if (type === 'out') setZoom(prev => Math.max(prev - 0.1, 0.1));
    else setZoom(0.4);
  };

  const handleDownload = async () => {
    if (!iframeRef.current || !generatedMarkup) return;
    try {
      const html2canvas = (await import('html2canvas')).default;
      const iframeDoc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
      if (iframeDoc && iframeDoc.documentElement) {
        const canvas = await html2canvas(iframeDoc.documentElement, { 
          useCORS: true,
          scale: 2 // Higher resolution
        });
        const link = document.createElement('a');
        link.download = 'poster.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
    } catch (e) {
      console.error("Failed to download image", e);
      alert("이미지 다운로드에 실패했습니다.");
    }
  };

  const handleGenerate = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setGenerationStep(1);
    setReasoningText('');
    
    try {
      setGeneratedMarkup('');
      let accumulatedHtml = '';
      
      await callTimelyAPIStream(
        `poster-gen-${Date.now()}`,
        `You are a Senior Design Systems Engineer and Creative Director.
Create a complete poster as a single HTML document with embedded CSS.

Requirements:
- Use a <style> tag or inline CSS.
- Use the provided data faithfully.
- Do not include any scripts.
- Code Review: Before writing the HTML, thoroughly inspect your planned code for syntax errors, unclosed tags, readability, and responsive layout issues. Auto-correct any flaws.
- Output ONLY one \`\`\`html block containing the final verified code and nothing else.`,
        [{ role: "user", content: `Create Design System & Poster. Raw data: ${JSON.stringify(formData, null, 2)}. Guidelines: ${formData.designGuidelines}` }],
        (chunk, type) => {
          if (type === 'content') {
            accumulatedHtml += chunk;
            setGeneratedMarkup(extractHtmlFromResponse(accumulatedHtml));
            if (generationStep < 3) setGenerationStep(3);
          } else if (type === 'thinking') {
             setReasoningText(prev => prev + chunk);
          }
        }
      );

      setIsGenerated(true);
      setIsFormOpen(false);
      setMessages([{ role: 'ai', content: "HTML/CSS 코드가 생성되었습니다." }]);
    } catch (error: any) {
      console.error("AI Generation Error:", error);
      const errMsg = '포스터 생성 중 오류가 발생했습니다.';
      alert(errMsg);
    } finally {
      setIsGenerating(false);
      setGenerationStep(0);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isChatLoading) return;
    const userMessage = chatInput;
    setChatInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsChatLoading(true);
    
    try {
      let accumulatedHtml = '';
      
      const promptContent = `[Current HTML Code]
\`\`\`html
${generatedMarkup}
\`\`\`

[User Modification Request]
${userMessage}`;

      await callTimelyAPIStream(
        'poster-session-active',
        "You are an expert Frontend Developer and UI/UX Designer. Your task is to modify the provided existing HTML/CSS code based on the user's request. Requirements:\n1. Keep the existing design system, layout, and content intact unless explicitly asked to change them.\n2. Before outputting, self-review the code for any CSS/HTML errors or broken layouts and fix them.\n3. Return the FINAL complete HTML document as a single ```html``` code block. Do not output any conversational text.",
        [{ role: "user", content: promptContent }],
        (chunk, type) => {
          if (type === 'content') {
            accumulatedHtml += chunk;
            setGeneratedMarkup(extractHtmlFromResponse(accumulatedHtml));
          } else if (type === 'thinking') {
             // Optional: handle thinking text for chat
          }
        }
      );

      setMessages(prev => [...prev, { role: 'ai', content: '코드가 업데이트되었습니다.' }]);
    } catch (error: any) {
      console.error('Chat Error:', error);
      setMessages(prev => [...prev, { role: 'ai', content: '통신 중 오류가 발생했습니다. 다시 시도해주세요.' }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleChatKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      <PageHeader
        title="포스터 자동화"
        description="레퍼런스 디자인을 기반으로 4대 핵심 섹션을 구성하여 포스터를 생성합니다."
        actions={
          <div className="flex items-center gap-3">
            <select
              value={aiModel}
              onChange={(e) => setAiModel(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium focus:outline-none shadow-sm"
            >
              <option value="gpt-5.1">GPT-5.1</option>
              <option value="openai/gpt-5.5">GPT-5.5 (Bridge)</option>
              <option value="openai/gpt-4.1-mini">GPT-4.1 Mini (Bridge)</option>
              <option value="openai/gpt-4o-mini">GPT-4o Mini (Bridge)</option>
              <option value="anthropic/claude-opus-4.7">Claude Opus 4.7 (Bridge)</option>
              <option value="anthropic/claude-haiku-4.5">Claude Haiku 4.5 (Bridge)</option>
              <option value="google/gemini-3-flash-preview">Gemini 3 Flash (Bridge)</option>
              <option value="x-ai/grok-4.1-fast">Grok 4.1 Fast (Bridge)</option>
            </select>
            <button onClick={handleReset} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors shadow-sm">
              <RotateCcw size={16} /> 새로 만들기
            </button>
          </div>
        }
      />

      <div className="flex flex-1 gap-4 min-h-0">
        <div className="w-[55%] flex flex-col h-full overflow-hidden">
          <div className="flex items-center justify-between shrink-0">
            <div className="flex bg-surface-variant rounded-t-lg p-0.5 w-fit mb-[-1px] z-10 border border-b-0" style={{ borderColor: "var(--color-border)" }}>
              <button onClick={() => setActiveTab('preview')} className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${activeTab === 'preview' ? 'bg-white shadow-sm text-brand-primary' : 'text-text-secondary'}`}><Eye size={14} /> 미리보기</button>
              <button onClick={() => setActiveTab('code')} className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${activeTab === 'code' ? 'bg-white shadow-sm text-brand-primary' : 'text-text-secondary'}`}><CodeIcon size={14} /> 코드</button>
            </div>
            {activeTab === 'preview' && (
              <div className="flex items-center gap-1 mb-1 px-2 py-0.5 bg-surface border rounded-md shadow-xs" style={{ borderColor: "var(--color-border)" }}>
                <button onClick={() => handleZoom('out')} className="p-1 hover:bg-gray-100 rounded text-text-secondary"><ZoomOut size={14} /></button>
                <span className="text-[10px] font-bold text-text-secondary min-w-[35px] text-center">{Math.round(zoom * 100)}%</span>
                <button onClick={() => handleZoom('in')} className="p-1 hover:bg-gray-100 rounded text-text-secondary"><ZoomIn size={14} /></button>
                <div className="w-[1px] h-3 bg-gray-200 mx-1"></div>
                <button onClick={() => handleZoom('reset')} className="p-1 hover:bg-gray-100 rounded text-text-secondary"><Maximize size={14} /></button>
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col overflow-hidden bg-white border-t border-r rounded-tr-lg" style={{ borderColor: "var(--color-border)" }}>
            {activeTab === 'preview' ? (
              <div className="flex-1 overflow-auto scrollbar-thin flex justify-center items-center bg-gray-50/50">
                <div style={{ width: formData.width * zoom, height: formData.height * zoom }} className="shrink-0 relative shadow-sm border border-gray-200 transition-all duration-200 bg-white">
                  {generatedMarkup ? (
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
                        background: '#fff',
                      }}
                      srcDoc={generatedMarkup}
                    />
                  ) : (
                    <div className="w-full h-full border border-dashed border-gray-300 text-sm text-gray-400 bg-white flex items-center justify-center">
                      AI 포스터를 생성하면 미리보기가 표시됩니다.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 bg-[#1e1e1e] p-4 font-mono text-[11px] text-gray-300 overflow-auto scrollbar-thin">
                <pre className="whitespace-pre-wrap">{generatedMarkup || '아직 생성된 코드가 없습니다.'}</pre>
              </div>
            )}
          </div>
        </div>

        <div className="w-[45%] flex flex-col h-full overflow-hidden">
          <div className="flex items-center justify-between py-3 cursor-pointer hover:opacity-80 transition-opacity shrink-0 mb-4 border-b" onClick={() => setIsFormOpen(!isFormOpen)} style={{ borderColor: "var(--color-border)" }}>
            <div className="flex items-center gap-2"><Info size={16} className="text-brand-primary" /><span className="font-bold text-sm">상세 입력 폼</span>{!isFormOpen && <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full ml-2">접힘</span>}</div>
            {isFormOpen ? <ChevronUp size={18} className="text-gray-500" /> : <ChevronDown size={18} className="text-gray-500" />}
          </div>

          {isFormOpen && (
            <div className="flex-1 flex flex-col overflow-y-auto pr-2 pb-4 space-y-8 scrollbar-thin">
              <div className="space-y-3 pt-2">
                <h2 className="text-sm font-bold flex items-center gap-2 text-text-primary"><Maximize size={14} className="text-brand-primary"/> 생성 규격 설정</h2>
                <div className="grid grid-cols-2 gap-3 pl-5">
                  <div><label className="text-[10px] font-bold text-text-secondary mb-1">가로(px)</label><input type="number" name="width" value={formData.width} onChange={handleInputChange} className="w-full p-2 text-sm bg-gray-50 border border-transparent rounded-lg focus:outline-none focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all"/></div>
                  <div><label className="text-[10px] font-bold text-text-secondary mb-1">세로(px)</label><input type="number" name="height" value={formData.height} onChange={handleInputChange} className="w-full p-2 text-sm bg-gray-50 border border-transparent rounded-lg focus:outline-none focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all"/></div>
                </div>
              </div>
              <div className="space-y-3">
                <h2 className="text-sm font-bold flex items-center gap-2 text-text-primary"><Info size={14} className="text-brand-primary"/> 상단 과정 정보</h2>
                <div className="space-y-3 pl-5">
                  <input name="courseName" value={formData.courseName} onChange={handleInputChange} className="w-full p-2 text-sm bg-gray-50 border border-transparent rounded-lg focus:outline-none focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all" placeholder="교육 과정명"/>
                  <textarea name="introText" value={formData.introText} onChange={handleInputChange} className="w-full p-2 text-sm bg-gray-50 border border-transparent rounded-lg focus:outline-none focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all h-16 resize-none"/>
                </div>
              </div>
              <div className="space-y-3"><h2 className="text-sm font-bold flex items-center gap-2 text-text-primary"><Calendar size={14} className="text-brand-primary"/> 1. 교육 안내 섹션</h2><div className="grid grid-cols-1 gap-3 pl-5"><input name="targetAudience" value={formData.targetAudience} onChange={handleInputChange} className="w-full p-2 text-xs bg-gray-50 border border-transparent rounded-lg focus:outline-none focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all" placeholder="교육 대상"/><input name="schedule" value={formData.schedule} onChange={handleInputChange} className="w-full p-2 text-xs bg-gray-50 border border-transparent rounded-lg focus:outline-none focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all" placeholder="교육 일정"/><input name="location" value={formData.location} onChange={handleInputChange} className="w-full p-2 text-xs bg-gray-50 border border-transparent rounded-lg focus:outline-none focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all" placeholder="교육 장소"/><input name="applyMethod" value={formData.applyMethod} onChange={handleInputChange} className="w-full p-2 text-xs bg-gray-50 border border-transparent rounded-lg focus:outline-none focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all" placeholder="신청 방법"/></div></div>
              <div className="space-y-3"><h2 className="text-sm font-bold flex items-center gap-2 text-text-primary"><Sparkles size={14} className="text-brand-primary"/> 2. 교육 혜택 섹션</h2><div className="space-y-3 pl-5"><div className="relative"><input value={benefitInput} onChange={(e) => setBenefitInput(e.target.value)} onKeyDown={handleAddBenefit} className="w-full p-2 pr-10 text-xs bg-gray-50 border border-transparent rounded-lg focus:outline-none focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all" placeholder="혜택 추가 후 Enter"/><button onClick={() => handleAddBenefit()} className="absolute right-1.5 top-1.5 p-1 bg-brand-primary text-white rounded hover:brightness-110 transition-all"><Plus size={12}/></button></div><div className="flex flex-wrap gap-1.5 p-3 bg-gray-50/50 rounded-lg border border-dashed border-gray-200">{formData.benefits.length > 0 ? formData.benefits.map((b, i) => (<div key={i} className="flex items-center gap-1 px-2.5 py-1 bg-white text-gray-700 rounded-full text-[11px] font-medium border border-gray-200 shadow-sm">{b}<button onClick={() => removeBenefit(i)} className="text-gray-400 hover:text-red-500 transition-colors"><X size={12}/></button></div>)) : <span className="text-xs text-gray-400">등록된 혜택이 없습니다.</span>}</div></div></div>
              <div className="space-y-3"><h2 className="text-sm font-bold flex items-center gap-2 text-text-primary"><MessageSquare size={14} className="text-brand-primary"/> 3. 교육 내용 섹션</h2><div className="space-y-3 pl-5"><textarea name="curriculum" value={formData.curriculum} onChange={handleInputChange} className="w-full p-2 text-sm bg-gray-50 border border-transparent rounded-lg focus:outline-none focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all h-24 resize-none" placeholder="커리큘럼 상세"/><input name="qrLink" value={formData.qrLink} onChange={handleInputChange} className="w-full p-2 text-xs bg-gray-50 border border-transparent rounded-lg focus:outline-none focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all" placeholder="QR코드 링크"/></div></div>
              <div className="space-y-3"><h2 className="text-sm font-bold flex items-center gap-2 text-text-primary"><Phone size={14} className="text-brand-primary"/> 4. 문의 사항 섹션</h2><div className="grid grid-cols-2 gap-3 pl-5"><input name="contactPhone" value={formData.contactPhone} onChange={handleInputChange} className="w-full p-2 text-xs bg-gray-50 border border-transparent rounded-lg focus:outline-none focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all" placeholder="전화번호"/><input name="contactEmail" value={formData.contactEmail} onChange={handleInputChange} className="w-full p-2 text-xs bg-gray-50 border border-transparent rounded-lg focus:outline-none focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all" placeholder="이메일"/></div></div>
              <div className="pt-4 border-t" style={{ borderColor: "var(--color-border)" }}><label className="block text-[10px] font-bold text-brand-primary uppercase mb-2 flex items-center gap-1"><Sparkles size={10}/> AI 디자인 지침</label><textarea name="designGuidelines" value={formData.designGuidelines} onChange={handleInputChange} className="w-full p-3 text-xs bg-brand-primary/5 border border-transparent rounded-lg focus:outline-none focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all h-16 resize-none placeholder-brand-primary/40 text-brand-primary" placeholder="추가 디자인 요청 사항"/></div>

              {!isGenerated && (
                <div className="pt-4 mt-auto sticky bottom-0 bg-background/90 backdrop-blur-md flex flex-col gap-2 z-10 pb-2">
                  <button onClick={handleGenerate} disabled={isGenerating || !formData.courseName} className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-white transition-all hover:brightness-110 disabled:opacity-50 shadow-md relative overflow-hidden" style={{ background: "var(--brand-primary)" }}>
                    {isGenerating ? "생성 중..." : <><Sparkles size={18}/> AI 포스터 자동 완성</>}
                  </button>
                </div>
              )}
            </div>
          )}

          {isGenerating && (
            <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[9999] flex items-center justify-center">
              <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-6 max-w-sm w-full mx-4 border border-gray-100">
                <div className="relative">
                  {generationStep === 1 && <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center animate-bounce"><MessageSquare className="text-brand-primary" size={32} /></div>}
                  {generationStep === 2 && <div className="w-16 h-16 flex items-center justify-center"><div className="absolute inset-0 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"></div><Sparkles className="text-brand-primary animate-pulse" size={32} /></div>}
                  {generationStep === 3 && <div className="w-16 h-16 bg-green-50 rounded-lg flex items-center justify-center animate-pulse border-2 border-green-200"><ImageIcon className="text-green-500 animate-bounce" size={32} /></div>}
                </div>
                <div className="flex flex-col items-center gap-2">
                  <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                    {generationStep === 1 && "내용 파악 중"}
                    {generationStep === 2 && "디자인 시스템 구축 중"}
                    {generationStep === 3 && "미리보기에 디자인 생성 중"}
                    <span className="text-sm font-mono text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded-md">
                      {formatTime(elapsedTime)}
                    </span>
                  </h3>
                  <div className="flex gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${generationStep >= 1 ? 'bg-brand-primary' : 'bg-gray-200'} transition-colors duration-500`}></div>
                    <div className={`w-2 h-2 rounded-full ${generationStep >= 2 ? 'bg-brand-primary' : 'bg-gray-200'} transition-colors duration-500`}></div>
                    <div className={`w-2 h-2 rounded-full ${generationStep >= 3 ? 'bg-brand-primary' : 'bg-gray-200'} transition-colors duration-500`}></div>
                  </div>
                  {reasoningText && (
                    <div className="w-full mt-4 p-3 bg-gray-50 border border-gray-100 rounded-lg max-h-32 overflow-y-auto text-[11px] text-gray-500 font-mono scrollbar-thin whitespace-pre-wrap flex flex-col-reverse">
                      {reasoningText}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {isGenerated && (
            <div className="flex-1 flex flex-col overflow-hidden min-h-0 mt-2">
              <div className="py-2 border-b flex items-center justify-between shrink-0" style={{ borderColor: "var(--color-border)" }}>
                <div className="flex items-center gap-2">
                  <Bot size={18} className="text-brand-primary" />
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-bold text-sm text-gray-800">AI 어시스턴트</span>
                    <span className="text-[10px] font-medium text-gray-400">| {aiModel}</span>
                  </div>
                </div>
                <button onClick={handleDownload} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-xs font-bold hover:bg-gray-200 transition-all flex items-center gap-1.5"><Download size={14}/> PNG 다운로드</button>
              </div>
              <div className="flex-1 overflow-y-auto py-4 space-y-6 scrollbar-thin pr-2">
                <div ref={chatListRef} />
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${msg.role === 'user' ? 'bg-gray-100 text-gray-500' : 'bg-brand-primary text-white shadow-sm'}`}>
                      {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                    </div>
                    <div className={`max-w-[85%] p-3.5 text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user' ? 'bg-gray-100 text-gray-800 rounded-2xl rounded-tr-sm' : 'bg-white border text-gray-800 rounded-2xl rounded-tl-sm shadow-sm'}`} style={msg.role !== 'user' ? { borderColor: "var(--color-border)" } : {}}>
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-3 pb-1 bg-background shrink-0">
                <div className="flex items-center gap-2 bg-white border shadow-sm rounded-xl px-2 py-1.5 focus-within:ring-2 focus-within:ring-brand-primary/20 transition-all" style={{ borderColor: "var(--color-border)" }}>
                  <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={handleChatKeyDown} placeholder="수정할 내용을 입력하세요" className="flex-1 bg-transparent border-none outline-none text-sm px-3 py-2"/>
                  <button onClick={handleSendMessage} disabled={!chatInput.trim() || isChatLoading} className="p-2 bg-brand-primary text-white rounded-lg disabled:opacity-50 hover:brightness-110 transition-colors shadow-sm"><Send size={16} className="-ml-0.5 mt-0.5" /></button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}