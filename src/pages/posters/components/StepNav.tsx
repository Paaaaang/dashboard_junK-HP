// ── 단계 네비게이터 컴포넌트 ──────────────────────────────────────
// PageHeader actions 영역에 표시되는 3단계 진행 표시기입니다.
// 클릭 가능 조건:
//   - 이전 단계 (s < step): 항상 이동 가능
//   - Step 3: isGenerated가 true일 때만 이동 가능
import React from 'react';
import { ChevronRight } from 'lucide-react';

interface Props {
  step: 1 | 2 | 3;
  setStep: (s: 1 | 2 | 3) => void;
  isGenerated: boolean;
}

const LABELS = ['정보 입력', 'AI 설정', '생성 & 수정'];

export function StepNav({ step, setStep, isGenerated }: Props) {
  return (
    <div className="flex items-center gap-1">
      {([1, 2, 3] as const).map((s, i) => {
        const active = step === s;
        const done = step > s;
        const clickable = s < step || (s === 3 && isGenerated);
        return (
          <React.Fragment key={s}>
            {/* 단계 버튼 - active/done/disabled 상태에 따라 스타일 변경 */}
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
              {LABELS[i]}
            </button>
            {/* 마지막 버튼 다음에는 구분자 없음 */}
            {i < 2 && <ChevronRight size={12} className="text-gray-300 shrink-0" />}
          </React.Fragment>
        );
      })}
    </div>
  );
}
