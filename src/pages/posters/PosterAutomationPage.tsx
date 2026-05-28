// ── 포스터 자동화 페이지 (오케스트레이터) ────────────────────────
// 3단계 워크플로우를 조율하는 최상위 컴포넌트입니다.
// 상태 로직은 훅으로, UI는 각 Step 컴포넌트로 완전히 위임합니다.
//
// 데이터 흐름:
//   usePosterForm    →  PosterFormStep (Step 1)
//   usePosterSession ←  formData, qrDataUrl
//   usePosterSession →  PosterAIStep (Step 2)
//                    →  PosterPreviewPanel + PosterChatPanel (Step 3)
//
// 상태 지속성:
//   posterSessionCache를 통해 SPA 내 다른 페이지 이동 후 복귀해도 상태가 유지됩니다.
import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { usePosterForm } from './hooks/usePosterForm';
import { usePosterSession } from './hooks/usePosterSession';
import { StepNav } from './components/StepNav';
import { PosterFormStep } from './components/PosterFormStep';
import { PosterAIStep } from './components/PosterAIStep';
import { PosterPreviewPanel } from './components/PosterPreviewPanel';
import { PosterChatPanel } from './components/PosterChatPanel';
import { posterSessionCache, resetPosterCache } from './posterGlobalState';

export function PosterAutomationPage() {
  // ── 단계 상태 (캐시에서 복원) ──────────────────────────────────
  const [step, setStepRaw] = useState<1 | 2 | 3>(() => posterSessionCache.step);

  const setStep = (s: 1 | 2 | 3) => {
    posterSessionCache.step = s;
    setStepRaw(s);
  };

  // ── 훅 조합 ───────────────────────────────────────────────────
  const form = usePosterForm();
  const session = usePosterSession({ formData: form.formData, qrDataUrl: form.qrDataUrl });

  // ── 전체 초기화 ────────────────────────────────────────────────
  const handleReset = () => {
    if (!window.confirm('모든 작업이 초기화됩니다. 새 포스터를 만드시겠습니까?')) return;
    resetPosterCache();
    form.reset();
    session.reset();
    setStepRaw(1);
  };

  const goToStep3AndGenerate = () => {
    setStep(3);
    session.handleGenerate();
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      <PageHeader
        title="포스터 자동화"
        description="AI가 교육 프로그램 포스터를 자동 생성합니다."
        actions={<StepNav step={step} setStep={setStep} isGenerated={session.isGenerated} />}
      />

      <div className="flex-1 min-h-0 flex flex-col">
        {/* ── Step 1: 교육 정보 입력 ── */}
        {step === 1 && (
          <div className="flex-1 min-h-0 flex justify-center">
            <div className="w-full max-w-5xl flex flex-col min-h-0">
              <PosterFormStep
                formData={form.formData}
                benefitInput={form.benefitInput}
                setBenefitInput={form.setBenefitInput}
                qrDataUrl={form.qrDataUrl}
                onInput={form.handleInput}
                onAddBenefit={form.addBenefit}
                onRemoveBenefit={form.removeBenefit}
                onNext={() => setStep(2)}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex-1 min-h-0 flex justify-center">
            <div className="w-full max-w-3xl flex flex-col min-h-0">
              <PosterAIStep
                aiModel={session.aiModel}
                setAiModel={session.setAiModel}
                designGuidelines={session.designGuidelines}
                setDesignGuidelines={session.setDesignGuidelines}
                aiReco={session.aiReco}
                isRecommending={session.isRecommending}
                onGetRecommendation={session.handleGetRecommendation}
                onClearReco={session.clearAiReco}
                onPrev={() => setStep(1)}
                onGenerate={goToStep3AndGenerate}
              />
            </div>
          </div>
        )}

        {/* ── Step 3: 포스터 생성 & 채팅 수정 ── */}
        {step === 3 && (
          <div className="flex-1 min-h-0 flex gap-4">
            {/* 좌측: 미리보기 + 내보내기 */}
            <PosterPreviewPanel
              generatedMarkup={session.generatedMarkup}
              isGenerating={session.isGenerating}
              formData={form.formData}
              getIframeSrc={session.getIframeSrc}
              onReset={handleReset}
              onMarkupChange={session.setGeneratedMarkup}
            />
            {/* 우측: AI 채팅 수정 */}
            <PosterChatPanel
              messages={session.messages}
              chatInput={session.chatInput}
              setChatInput={session.setChatInput}
              isChatLoading={session.isChatLoading}
              isGenerated={session.isGenerated}
              isGenerating={session.isGenerating}
              aiModel={session.aiModel}
              onSend={session.handleSendMessage}
            />
          </div>
        )}
      </div>
    </div>
  );
}
