import { Building2, GraduationCap, TrendingDown, TrendingUp, UserCheck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type TrendDirection = 'up' | 'down';

interface DashboardSummaryCard {
  label: string;
  value: string;
  icon: LucideIcon;
  trend: TrendDirection;
  deltaValue: string;
  deltaLabel: string;
}

interface DashboardPlaceholderCard {
  chart: 'course-companies';
  title: string;
  bars: Array<{
    label: string;
    value: number;
  }>;
}

const dashboardSummaryCards: Array<DashboardSummaryCard | DashboardPlaceholderCard> = [
  {
    label: '전체 참여 기업수',
    value: '512',
    icon: Building2,
    trend: 'up',
    deltaValue: '8.5%',
    deltaLabel: '지난 달 대비',
  },
  {
    label: '전체 참여자 수',
    value: '1,024',
    icon: UserCheck,
    trend: 'up',
    deltaValue: '1.3%',
    deltaLabel: '지난 주 대비',
  },
  {
    label: '전체 달성률',
    value: '89%',
    icon: GraduationCap,
    trend: 'down',
    deltaValue: '4.3%',
    deltaLabel: '',
  },
  {
    chart: 'course-companies',
    title: '과정별 참여 기업 수',
    bars: [
      { label: '훈련비', value: 22 },
      { label: '지원비', value: 15 },
      { label: '세미나', value: 11 },
    ],
  },
];

export function Dashboard() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-background min-h-full">
      <header className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">대시보드</h2>
        <p className="text-slate-500 text-sm">시스템의 실시간 핵심 지표를 확인하세요.</p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" aria-label="핵심 지표 요약 카드">
        {dashboardSummaryCards.map((card, idx) => {
          if ('chart' in card) {
            const maxValue = Math.max(...card.bars.map((bar) => bar.value));

            return (
              <article
                className="bg-white rounded-2xl p-6 shadow-soft border border-slate-100/50 flex flex-col"
                key={card.chart}
                aria-label={card.title}
              >
                <h3 className="text-sm font-semibold text-slate-500 mb-6">{card.title}</h3>

                <ul className="space-y-5 flex-1 justify-center flex flex-col">
                  {card.bars.map((bar) => (
                    <li className="space-y-1.5" key={bar.label}>
                      <div className="flex justify-between text-xs font-medium px-0.5">
                        <span className="text-slate-600">{bar.label}</span>
                        <span className="text-slate-900">{bar.value}개</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden" aria-hidden="true">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                          style={{ width: `${(bar.value / maxValue) * 100}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </article>
            );
          }

          const Icon = card.icon;
          const TrendIcon = card.trend === 'up' ? TrendingUp : TrendingDown;
          const isUp = card.trend === 'up';

          return (
            <article className="bg-white rounded-2xl p-6 shadow-soft border border-slate-100/50" key={idx}>
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                  <Icon className="w-6 h-6" />
                </div>
                <div
                  className={`flex items-center gap-0.5 px-2 py-1 rounded-lg text-xs font-bold ${
                    isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                  }`}
                >
                  <TrendIcon className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{card.deltaValue}</span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-500">{card.label}</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-slate-900 tracking-tight">{card.value}</p>
                  {card.deltaLabel && (
                    <span className="text-[11px] text-slate-400 font-medium">{card.deltaLabel}</span>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
