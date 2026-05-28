// ── Step 1: 교육 정보 입력 폼 ──────────────────────────────────────
// 포스터에 들어갈 교육 정보를 입력받는 단계입니다.
// 레이아웃: 좌측(교육안내 + 교육혜택) / 우측(소개문구 + 교육내용 + 문의)
// 모든 상태는 부모(usePosterForm)가 관리하고 props로 전달받습니다.
import React from 'react';
import {
  Plus, X, Info, Calendar, MessageSquare, Phone, Sparkles, ChevronRight,
} from 'lucide-react';
import type { PosterFormData } from '../poster.types';
import { IC, LC } from '../poster.types';

interface Props {
  formData: PosterFormData;
  benefitInput: string;
  setBenefitInput: (v: string) => void;
  qrDataUrl: string;
  onInput: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onAddBenefit: (e?: React.KeyboardEvent<HTMLInputElement>) => void;
  onRemoveBenefit: (i: number) => void;
  onNext: () => void;
}

export function PosterFormStep({
  formData, benefitInput, setBenefitInput, qrDataUrl,
  onInput, onAddBenefit, onRemoveBenefit, onNext,
}: Props) {
  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="shrink-0">
        <label className={LC}>과정명 *</label>
        <input name="courseName" value={formData.courseName} onChange={onInput} className={IC} placeholder="교육 과정명" />
      </div>

      {/* 좌우 2컬럼 메인 영역 */}
      <div className="grid grid-cols-2 gap-3 flex-1 min-h-0">
        {/* ── 좌측: 교육 안내 + 교육 혜택 ── */}
        <div className="flex flex-col gap-3">
          {/* 교육 안내 섹션 */}
          <div className="space-y-1.5">
            <p className={`${LC} flex items-center gap-1`}><Calendar size={10} className="text-brand-primary" />교육 안내</p>
            <div>
              <label className={LC}>교육 대상</label>
              <input name="targetAudience" value={formData.targetAudience} onChange={onInput} className={`${IC} text-xs`} placeholder="교육 대상" />
            </div>
            <div>
              <label className={LC}>일정</label>
              <input name="schedule" value={formData.schedule} onChange={onInput} className={`${IC} text-xs`} placeholder="교육 일정" />
            </div>
            <div>
              <label className={LC}>장소</label>
              <input name="location" value={formData.location} onChange={onInput} className={`${IC} text-xs`} placeholder="교육 장소" />
            </div>
            <div>
              <label className={LC}>신청 방법</label>
              <input name="applyMethod" value={formData.applyMethod} onChange={onInput} className={`${IC} text-xs`} placeholder="신청 방법" />
            </div>
          </div>

          {/* 교육 혜택 태그 입력 섹션 */}
          <div className="space-y-1.5">
            <p className={`${LC} flex items-center gap-1`}><Sparkles size={10} className="text-brand-primary" />교육 혜택</p>
            <div className="relative">
              <input
                value={benefitInput}
                onChange={e => setBenefitInput(e.target.value)}
                onKeyDown={onAddBenefit}
                className={`${IC} pr-9 text-xs`}
                placeholder="항목 입력 후 Enter"
              />
              <button onClick={() => onAddBenefit()} className="absolute right-1.5 top-1.5 p-1 bg-brand-primary text-white rounded hover:brightness-110">
                <Plus size={11} />
              </button>
            </div>
            {/* 혜택 태그 목록 */}
            <div className="flex flex-wrap gap-1">
              {formData.benefits.map((b, i) => (
                <span key={i} className="flex items-center gap-1 px-2 py-0.5 bg-brand-primary/10 text-brand-primary rounded-full text-[10px] font-medium">
                  {b}
                  <button onClick={() => onRemoveBenefit(i)} className="hover:text-red-500">
                    <X size={9} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── 우측: 소개 문구 + 교육 내용 + 문의 정보 ── */}
        <div className="flex flex-col gap-3">
          {/* 소개 문구 */}
          <div className="space-y-1.5">
            <p className={`${LC} flex items-center gap-1`}><Info size={10} className="text-brand-primary" />소개 문구</p>
            <textarea name="introText" value={formData.introText} onChange={onInput} className={`${IC} text-xs resize-none`} style={{ height: '72px' }} />
          </div>

          {/* 교육 내용 + QR 링크 */}
          <div className="space-y-1.5">
            <p className={`${LC} flex items-center gap-1`}><MessageSquare size={10} className="text-brand-primary" />교육 내용</p>
            <textarea name="curriculum" value={formData.curriculum} onChange={onInput} className={`${IC} text-xs resize-none`} style={{ height: '56px' }} placeholder="커리큘럼" />
            <div>
              <label className={LC}>QR 링크</label>
              <div className="flex gap-2 items-start">
                <input name="qrLink" value={formData.qrLink} onChange={onInput} className={`${IC} text-xs flex-1`} placeholder="신청 링크 입력 시 자동 생성" />
                {/* QR 미리보기 - qrDataUrl이 있을 때만 표시 */}
                {qrDataUrl && (
                  <div className="shrink-0 w-14 h-14 border rounded-lg overflow-hidden bg-white" style={{ borderColor: 'var(--color-border)' }}>
                    <img src={qrDataUrl} alt="QR" className="w-full h-full object-contain" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 문의 정보 */}
          <div className="space-y-1.5">
            <p className={`${LC} flex items-center gap-1`}><Phone size={10} className="text-brand-primary" />문의 정보</p>
            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <label className={LC}>전화</label>
                <input name="contactPhone" value={formData.contactPhone} onChange={onInput} className={`${IC} text-xs`} />
              </div>
              <div>
                <label className={LC}>이메일</label>
                <input name="contactEmail" value={formData.contactEmail} onChange={onInput} className={`${IC} text-xs`} />
              </div>
            </div>
            <div>
              <label className={LC}>웹사이트</label>
              <input name="contactWeb" value={formData.contactWeb} onChange={onInput} className={`${IC} text-xs`} />
            </div>
          </div>
        </div>
      </div>

      {/* 다음 단계 버튼 - 과정명이 입력된 경우에만 활성화 */}
      <div className="pt-2 border-t shrink-0" style={{ borderColor: 'var(--color-border)' }}>
        <button
          onClick={onNext}
          disabled={!formData.courseName.trim()}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-white transition-all hover:brightness-110 disabled:opacity-40 shadow-md text-sm"
          style={{ background: 'var(--brand-primary)' }}
        >
          다음: AI 설정 <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}
