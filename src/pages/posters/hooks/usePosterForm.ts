// ── 포스터 폼 데이터 관리 훅 ───────────────────────────────────────
// Step 1의 모든 입력 폼 상태를 담당합니다.
// - 기본 필드 입력 (handleInput)
// - 교육 혜택 태그 추가/삭제 (addBenefit / removeBenefit)
// - QR 링크 입력 시 QR 이미지 자동 생성 (useEffect)
// - 페이지 이동 후 복귀 시 상태 유지 (posterFormCache)
import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import type { PosterFormData } from '../poster.types';
import { INITIAL_FORM } from '../poster.types';
import { posterFormCache } from '../posterGlobalState';

export function usePosterForm() {
  // ── 폼 상태 (캐시에서 초기값 복원) ───────────────────────────────
  const [formData, setFormData] = useState<PosterFormData>(() => ({ ...posterFormCache.formData }));
  const [benefitInput, setBenefitInputRaw] = useState(() => posterFormCache.benefitInput);
  const [qrDataUrl, setQrDataUrl] = useState(() => posterFormCache.qrDataUrl);

  // ── 캐시 동기화 헬퍼 ─────────────────────────────────────────────
  const setFormDataSync = (updater: (prev: PosterFormData) => PosterFormData) => {
    setFormData(prev => {
      const next = updater(prev);
      posterFormCache.formData = next;
      return next;
    });
  };

  const setBenefitInput = (v: string) => {
    posterFormCache.benefitInput = v;
    setBenefitInputRaw(v);
  };

  // ── QR 코드 자동 생성 ─────────────────────────────────────────
  // qrLink가 변경될 때마다 data URL로 QR 이미지를 생성합니다.
  // 생성된 URL은 포스터 HTML의 __QR__ 플레이스홀더를 대체합니다.
  useEffect(() => {
    if (!formData.qrLink.trim()) {
      setQrDataUrl('');
      posterFormCache.qrDataUrl = '';
      return;
    }
    QRCode.toDataURL(formData.qrLink, { width: 200, margin: 1, color: { dark: '#000000', light: '#ffffff' } })
      .then(url => { setQrDataUrl(url); posterFormCache.qrDataUrl = url; })
      .catch(() => { setQrDataUrl(''); posterFormCache.qrDataUrl = ''; });
  }, [formData.qrLink]);

  // ── 범용 입력 핸들러 ───────────────────────────────────────────
  // input/textarea의 name 속성을 formData 키로 사용합니다.
  const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFormDataSync(prev => ({ ...prev, [e.target.name]: e.target.value }));

  // ── 교육 혜택 추가 ─────────────────────────────────────────────
  // Enter 키 또는 + 버튼 클릭 시 동작합니다. 중복 항목은 무시합니다.
  const addBenefit = (e?: React.KeyboardEvent<HTMLInputElement>) => {
    if (e && e.key !== 'Enter') return;
    e?.preventDefault();
    const v = benefitInput.trim();
    if (v && !formData.benefits.includes(v)) {
      setFormDataSync(prev => ({ ...prev, benefits: [...prev.benefits, v] }));
      setBenefitInput('');
    }
  };

  // ── 교육 혜택 삭제 ─────────────────────────────────────────────
  const removeBenefit = (index: number) =>
    setFormDataSync(p => ({ ...p, benefits: p.benefits.filter((_, j) => j !== index) }));

  // ── 전체 초기화 ────────────────────────────────────────────────
  const reset = () => {
    posterFormCache.formData = { ...INITIAL_FORM };
    posterFormCache.benefitInput = '';
    posterFormCache.qrDataUrl = '';
    setFormData({ ...INITIAL_FORM });
    setBenefitInputRaw('');
    setQrDataUrl('');
  };

  return {
    formData,
    benefitInput,
    setBenefitInput,
    qrDataUrl,
    handleInput,
    addBenefit,
    removeBenefit,
    reset,
  };
}
