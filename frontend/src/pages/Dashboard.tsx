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
    <div className="dashboard-page dashboard-figma">
      <section className="page-header-row" aria-label="대시보드 제목">
        <h2>대시보드</h2>
      </section>

      <section className="dashboard-figma-kpi-grid" aria-label="핵심 지표 요약 카드">
        {dashboardSummaryCards.map((card) => {
          if ('chart' in card) {
            const maxValue = Math.max(...card.bars.map((bar) => bar.value));

            return (
              <article
                className="dashboard-figma-kpi-card dashboard-figma-kpi-card-chart"
                key={card.chart}
                aria-label={card.title}
              >
                <p className="dashboard-mini-bar-title">{card.title}</p>

                <ul className="dashboard-mini-bar-list">
                  {card.bars.map((bar) => (
                    <li className="dashboard-mini-bar-item" key={bar.label}>
                      <span className="dashboard-mini-bar-label">{bar.label}</span>
                      <span className="dashboard-mini-bar-track" aria-hidden="true">
                        <span
                          className="dashboard-mini-bar-fill"
                          style={{ width: `${(bar.value / maxValue) * 100}%` }}
                        />
                      </span>
                      <span className="dashboard-mini-bar-value">{bar.value}</span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          }

          const Icon = card.icon;
          const TrendIcon = card.trend === 'up' ? TrendingUp : TrendingDown;

          return (
            <article className="dashboard-figma-kpi-card" key={card.label}>
              <div className="dashboard-figma-kpi-main">
                <div className="dashboard-figma-kpi-text-col">
                  <p className="dashboard-figma-kpi-label">{card.label}</p>

                  <p className="dashboard-figma-kpi-value">{card.value}</p>

                  <p
                    className={`dashboard-figma-kpi-trend dashboard-figma-kpi-trend-${card.trend}`}
                    aria-label={`변동 ${card.deltaValue} ${card.deltaLabel}`.trim()}
                  >
                    <TrendIcon className="dashboard-figma-kpi-trend-icon" aria-hidden="true" />
                    <span className="dashboard-figma-kpi-trend-value">{card.deltaValue}</span>
                    {card.deltaLabel ? <span className="dashboard-figma-kpi-trend-note">{card.deltaLabel}</span> : null}
                  </p>
                </div>

                <span className="dashboard-figma-kpi-icon-wrap" aria-hidden="true">
                  <Icon className="dashboard-figma-kpi-icon" />
                </span>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
