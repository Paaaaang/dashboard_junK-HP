import React, { useState, KeyboardEvent } from 'react';
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
  MapPin,
  Users,
  MessageSquare,
  Phone,
  ZoomIn,
  ZoomOut,
  Maximize,
  Globe,
  Mail,
  QrCode
} from 'lucide-react';

interface PosterFormData {
  courseName: string;
  introText: string;
  // Section 1: Education Guide
  targetAudience: string;
  schedule: string;
  location: string;
  applyMethod: string;
  // Section 2: Benefits
  benefits: string[];
  // Section 3: Curriculum
  curriculum: string;
  // Section 4: Inquiries
  contactPhone: string;
  contactEmail: string;
  contactWeb: string;
  designGuidelines: string;
}

export function PosterAutomationPage() {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [isGenerating, setIsGenerating] = useState(false);
  const [benefitInput, setBenefitInput] = useState('');
  const [zoom, setZoom] = useState(0.4);
  
  const [formData, setFormData] = useState<PosterFormData>({
    courseName: '',
    introText: '전남대학교 생체재료개발센터는 글로벌 비임상 CRO 전문기관 및 의료기기 규제과학(RA) 전문교육 기관으로서, 기업/기관 재직자 역량 강화 및 첨단기술분야 인력양성을 위한 무료교육 및 전문가 연계 기술자문을 실시하고 있습니다. 많은 관심과 참여 부탁드립니다.',
    targetAudience: '의료기기 산업 관련 기업 재직자 (고용보험 가입 필수)',
    schedule: '2026. 06. 01.(월) 09:00 ~ 18:00 (1일, 8시간)',
    location: '전남대학교 K-하이테크 플랫폼 2층 교육장 (광주 북구 무등로 68-3, 2층)',
    applyMethod: 'QR코드 스캔 후 신청서 작성',
    benefits: ['교육비 전액 무료', '교재 및 중식 제공', '수료증 발급 (80% 이상 수강 시)', '전문가 기술자문 참여 우대'],
    curriculum: '',
    contactPhone: '062-710-2896',
    contactEmail: 'bmclog@naver.com',
    contactWeb: 'https://bmckhp.kr/',
    designGuidelines: '',
  });

  const [designSystem, setDesignSystem] = useState({
    themeColor: '#1E3A8A',
    fontFamily: "'Fira Sans', sans-serif",
    title: { fontSize: '60px', fontWeight: '900' },
    headerBg: '#f0f7ff',
  });

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

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      alert("AI 디자인 시스템 구축 완료");
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      <PageHeader
        title="포스터 자동화"
        description="레퍼런스 디자인을 기반으로 4대 핵심 섹션을 구성하여 포스터를 생성합니다."
      />

      <div className="flex flex-1 gap-4 min-h-0">
        {/* Left: Preview/Code */}
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

          <div className="card flex-1 flex flex-col p-0 overflow-hidden bg-gray-100 border rounded-tr-lg shadow-xs" style={{ borderColor: "var(--color-border)" }}>
            {activeTab === 'preview' ? (
              <div className="flex-1 overflow-auto p-4 scrollbar-thin flex justify-center">
                <div 
                  className="bg-white shadow-2xl flex flex-col shrink-0"
                  style={{ width: '891px', height: '1260px', transform: `scale(${zoom})`, transformOrigin: 'top center', marginBottom: `calc(1260px * (${zoom} - 1))` }}
                >
                  {/* Poster Header */}
                  <div className="h-64 flex flex-col items-start justify-center px-16 relative overflow-hidden" style={{ backgroundColor: designSystem.themeColor }}>
                    <div className="absolute top-0 right-0 w-1/2 h-full opacity-20 flex items-center justify-center">
                      <ImageIcon size={240} className="text-white" />
                    </div>
                    <span className="text-white/90 font-bold mb-4 tracking-widest text-xl">전남대학교 생체재료개발센터 K-하이테크 플랫폼</span>
                    <h1 className="text-6xl font-black text-white leading-tight uppercase tracking-tight break-keep max-w-[600px]">
                      {formData.courseName || '교육 과정명'}
                    </h1>
                    <div className="mt-6 text-white/80 font-bold text-xl">교육문의: {formData.contactPhone}</div>
                  </div>

                  {/* Intro Area */}
                  <div className="px-16 py-8">
                    <p className="text-xl text-gray-700 leading-relaxed break-keep font-medium">
                      {formData.introText}
                    </p>
                  </div>

                  {/* Core 4 Rows Content */}
                  <div className="flex-1 px-16 flex flex-col gap-6">
                    {/* Row 1: 교육 안내 */}
                    <section>
                      <h2 className="text-2xl font-black mb-4 flex items-center gap-3" style={{ color: designSystem.themeColor }}>
                        <div className="w-2 h-6 bg-current"></div> 교육 안내
                      </h2>
                      <div className="space-y-4 pl-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: designSystem.themeColor }}><Users size={20}/></div>
                          <div className="text-xl font-bold text-gray-800 flex-1 flex gap-2"><span>교육대상</span> <span className="text-gray-400 font-medium">|</span> <span>{formData.targetAudience}</span></div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: designSystem.themeColor }}><Calendar size={20}/></div>
                          <div className="text-xl font-bold text-gray-800 flex-1 flex gap-2"><span>교육일정</span> <span className="text-gray-400 font-medium">|</span> <span>{formData.schedule}</span></div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: designSystem.themeColor }}><MapPin size={20}/></div>
                          <div className="text-xl font-bold text-gray-800 flex-1 flex gap-2"><span>교육장소</span> <span className="text-gray-400 font-medium">|</span> <span>{formData.location}</span></div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: designSystem.themeColor }}><QrCode size={20}/></div>
                          <div className="text-xl font-bold text-gray-800 flex-1 flex gap-2"><span>신청방법</span> <span className="text-gray-400 font-medium">|</span> <span className="text-blue-600">{formData.applyMethod}</span></div>
                        </div>
                      </div>
                    </section>

                    {/* Row 2: 교육 혜택 */}
                    <section>
                      <h2 className="text-2xl font-black mb-4 flex items-center gap-3" style={{ color: designSystem.themeColor }}>
                        <div className="w-2 h-6 bg-current"></div> 교육 혜택
                      </h2>
                      <div className="grid grid-cols-4 gap-4">
                        {formData.benefits.map((b, i) => (
                          <div key={i} className="border-2 rounded-xl p-4 flex flex-col items-center text-center gap-3" style={{ borderColor: designSystem.themeColor + '20' }}>
                            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-1" style={{ backgroundColor: designSystem.themeColor + '10' }}><Sparkles size={32} style={{ color: designSystem.themeColor }}/></div>
                            <span className="text-lg font-bold leading-tight break-keep">{b}</span>
                          </div>
                        ))}
                      </div>
                    </section>

                    {/* Row 3: 교육 내용 */}
                    <section className="flex-1 min-h-0 flex flex-col">
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-black flex items-center gap-3" style={{ color: designSystem.themeColor }}>
                          <div className="w-2 h-6 bg-current"></div> 교육 내용
                        </h2>
                        <div className="w-32 h-32 border-2 p-2 flex flex-col items-center justify-center text-[10px] font-bold" style={{ borderColor: designSystem.themeColor }}>
                          <div className="bg-gray-100 w-full h-full mb-1 flex items-center justify-center text-gray-400">QR</div>
                          교육신청 QR
                        </div>
                      </div>
                      <div className="bg-gray-50 border rounded-xl p-6 flex-1 overflow-hidden font-medium text-xl leading-relaxed whitespace-pre-wrap">
                        {formData.curriculum || '주요 교육 내용 키워드 또는 상세 커리큘럼이 이곳에 노출됩니다.'}
                      </div>
                    </section>

                    {/* Row 4: 문의 사항 */}
                    <section className="py-4 border-y-2" style={{ borderColor: designSystem.themeColor + '20' }}>
                      <h2 className="text-xl font-black mb-3" style={{ color: designSystem.themeColor }}>문의 사항</h2>
                      <div className="flex justify-between text-lg font-bold text-gray-700">
                        <div className="flex items-center gap-2"><Globe size={18} className="text-gray-400"/> 홈페이지: {formData.contactWeb}</div>
                        <div className="flex items-center gap-2"><Phone size={18} className="text-gray-400"/> 전화: {formData.contactPhone}</div>
                        <div className="flex items-center gap-2"><Mail size={18} className="text-gray-400"/> 이메일: {formData.contactEmail}</div>
                      </div>
                    </section>
                  </div>

                  {/* Footer Logos */}
                  <div className="h-24 px-16 flex items-center justify-between opacity-70 grayscale">
                    <div className="font-black text-xl">LOGO 1</div>
                    <div className="font-black text-xl">LOGO 2</div>
                    <div className="font-black text-xl">LOGO 3</div>
                    <div className="font-black text-xl">LOGO 4</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 bg-[#1e1e1e] p-4 font-mono text-[11px] text-gray-300 overflow-auto scrollbar-thin">
                <pre className="whitespace-pre-wrap">{`<!-- AI Generated Poster HTML/CSS Structure -->
<div class="poster-container" style="width: 891px; height: 1260px;">
  <header style="background: ${designSystem.themeColor};">
    <h1>${formData.courseName}</h1>
  </header>
  ...
</div>`}</pre>
              </div>
            )}
          </div>
        </div>

        {/* Right: Input Form */}
        <div className="w-[45%] flex flex-col overflow-y-auto pr-1 pb-4 space-y-3 scrollbar-thin">
          {/* Header Section */}
          <div className="card p-3 space-y-3">
            <h2 className="text-sm font-bold flex items-center gap-2 text-brand-primary"><Info size={14}/> 상단 과정 정보</h2>
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-text-secondary">교육 과정명 (Title)</label>
              <input name="courseName" value={formData.courseName} onChange={handleInputChange} className="w-full p-2 text-sm border rounded-lg focus:ring-1 focus:ring-brand-primary outline-none" placeholder="포스터 중앙 메인 타이틀"/>
              <label className="block text-[10px] font-bold text-text-secondary uppercase">도입 안내 텍스트</label>
              <textarea name="introText" value={formData.introText} onChange={handleInputChange} className="w-full p-2 text-sm border rounded-lg focus:ring-1 focus:ring-brand-primary outline-none h-16 resize-none"/>
            </div>
          </div>

          {/* Row 1: 교육 안내 */}
          <div className="card p-3 space-y-3">
            <h2 className="text-sm font-bold flex items-center gap-2 text-brand-primary"><Calendar size={14}/> 1. 교육 안내 섹션</h2>
            <div className="grid grid-cols-1 gap-2">
              <div><label className="text-[10px] font-bold text-text-secondary">교육 대상</label><input name="targetAudience" value={formData.targetAudience} onChange={handleInputChange} className="w-full p-2 text-xs border rounded-lg outline-none"/></div>
              <div><label className="text-[10px] font-bold text-text-secondary">교육 일정</label><input name="schedule" value={formData.schedule} onChange={handleInputChange} className="w-full p-2 text-xs border rounded-lg outline-none"/></div>
              <div><label className="text-[10px] font-bold text-text-secondary">교육 장소</label><input name="location" value={formData.location} onChange={handleInputChange} className="w-full p-2 text-xs border rounded-lg outline-none"/></div>
              <div><label className="text-[10px] font-bold text-text-secondary">신청 방법</label><input name="applyMethod" value={formData.applyMethod} onChange={handleInputChange} className="w-full p-2 text-xs border rounded-lg outline-none"/></div>
            </div>
          </div>

          {/* Row 2: 교육 혜택 */}
          <div className="card p-3 space-y-3">
            <h2 className="text-sm font-bold flex items-center gap-2 text-brand-primary"><Sparkles size={14}/> 2. 교육 혜택 섹션</h2>
            <div className="space-y-2">
              <div className="relative"><input value={benefitInput} onChange={(e) => setBenefitInput(e.target.value)} onKeyDown={handleAddBenefit} className="w-full p-2 pr-10 text-xs border rounded-lg outline-none" placeholder="혜택 추가 후 Enter"/><button onClick={() => handleAddBenefit()} className="absolute right-1.5 top-1.5 p-1 bg-brand-primary text-white rounded"><Plus size={12}/></button></div>
              <div className="flex flex-wrap gap-1 p-2 bg-background/50 rounded-lg border border-dashed">
                {formData.benefits.map((b, i) => (
                  <div key={i} className="flex items-center gap-1 px-2 py-0.5 bg-brand-primary/10 text-brand-primary rounded-full text-[10px] font-bold border border-brand-primary/20">{b}<button onClick={() => removeBenefit(i)}><X size={10}/></button></div>
                ))}
              </div>
            </div>
          </div>

          {/* Row 3: 교육 내용 */}
          <div className="card p-3 space-y-3">
            <h2 className="text-sm font-bold flex items-center gap-2 text-brand-primary"><MessageSquare size={14}/> 3. 교육 내용 섹션</h2>
            <textarea name="curriculum" value={formData.curriculum} onChange={handleInputChange} className="w-full p-2 text-sm border rounded-lg focus:ring-1 focus:ring-brand-primary outline-none h-20 resize-none" placeholder="커리큘럼 및 세부 상세 내용 입력"/>
          </div>

          {/* Row 4: 문의 사항 */}
          <div className="card p-3 space-y-3">
            <h2 className="text-sm font-bold flex items-center gap-2 text-brand-primary"><Phone size={14}/> 4. 문의 사항 섹션</h2>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-[10px] font-bold text-text-secondary">전화번호</label><input name="contactPhone" value={formData.contactPhone} onChange={handleInputChange} className="w-full p-2 text-xs border rounded-lg outline-none"/></div>
              <div><label className="text-[10px] font-bold text-text-secondary">이메일</label><input name="contactEmail" value={formData.contactEmail} onChange={handleInputChange} className="w-full p-2 text-xs border rounded-lg outline-none"/></div>
              <div className="col-span-2"><label className="text-[10px] font-bold text-text-secondary">홈페이지</label><input name="contactWeb" value={formData.contactWeb} onChange={handleInputChange} className="w-full p-2 text-xs border rounded-lg outline-none"/></div>
            </div>
          </div>

          {/* AI Guide */}
          <div className="card p-3 bg-brand-primary/5 border-brand-primary/20">
            <label className="block text-[10px] font-bold text-brand-primary uppercase mb-1 flex items-center gap-1"><Sparkles size={10}/> AI 디자인 지침</label>
            <textarea name="designGuidelines" value={formData.designGuidelines} onChange={handleInputChange} className="w-full p-2 text-[11px] border rounded-lg bg-white outline-none h-12 resize-none" placeholder="색상 톤, 강조할 부분 등 추가 지침"/>
          </div>

          {/* Actions */}
          <div className="pt-2 sticky bottom-0 bg-background/90 backdrop-blur-sm border-t flex flex-col gap-2">
            <button onClick={handleGenerate} disabled={isGenerating || !formData.courseName} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-white transition-all hover:brightness-110 disabled:opacity-50 shadow-sm" style={{ background: "var(--brand-primary)" }}>
              {isGenerating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><Sparkles size={16}/> AI 포스터 자동 완성</>}
            </button>
            <div className="flex gap-2">
              <button className="flex-1 py-1.5 bg-brand-primary text-white rounded text-xs font-bold flex items-center justify-center gap-1 shadow-sm hover:brightness-110 transition-all" disabled><Download size={14}/> PNG 다운로드</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
