import { useEffect } from 'react';
import {
  Building2,
  GraduationCap,
  TrendingDown,
  TrendingUp,
  UserCheck,
  AlertCircle,
  Users,
  Activity,
  Award,
  Calendar
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { useStatsStore } from '@/stores/useStatsStore';
import { useToastStore } from '@/stores/useToastStore';

const CHART_COLORS = [
  'var(--brand-primary)',
  'rgba(16, 185, 129, 0.75)',
  'rgba(16, 185, 129, 0.55)',
  'rgba(16, 185, 129, 0.35)',
  'rgba(16, 185, 129, 0.15)'
];

export function Dashboard() {
  const { summary, charts, recentActivity, isLoading, error, fetchStats, clearError } = useStatsStore();
  const { addToast } = useToastStore();

  useEffect(() => { fetchStats(); }, [fetchStats]);

  useEffect(() => {
    if (error) {
      addToast(`에러: ${error}`, "error");
      clearError();
    }
  }, [error, addToast, clearError]);

  const getIcon = (label: string) => {
    if (label.includes('기업')) return Building2;
    if (label.includes('참여자')) return UserCheck;
    if (label.includes('달성률')) return GraduationCap;
    return Building2;
  };

  if (isLoading && summary.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div
          className="w-10 h-10 border-4 rounded-full animate-spin"
          style={{ borderColor: "rgba(16, 185, 129, 0.2)", borderTopColor: "var(--brand-primary)" }}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div
          className="rounded-2xl p-6 flex items-center gap-4"
          style={{ background: "var(--color-error-bg)", border: "1px solid rgba(239,68,68,0.1)", color: "var(--color-error)" }}
        >
          <AlertCircle size={24} />
          <div>
            <h3 className="font-bold">데이터를 불러오지 못했습니다</h3>
            <p className="text-sm opacity-90">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 min-h-full">
      <header className="flex flex-col gap-1 px-1">
        <h2 className="text-2xl font-black text-text-primary tracking-tight">대시보드</h2>
        <p className="text-text-secondary text-sm font-medium italic">시스템의 실시간 핵심 지표를 확인하세요.</p>
      </header>

      {/* Summary Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5 gap-6" aria-label="핵심 지표 요약 카드">
        {summary.map((card, idx) => {
          const Icon = getIcon(card.label);
          const TrendIcon = card.trend === 'up' ? TrendingUp : TrendingDown;
          const isUp = card.trend === 'up';

          return (
            <article
              key={idx}
              className="rounded-3xl p-6 border cursor-default transition-all group"
              style={{ background: "var(--color-surface)", borderColor: "var(--color-border)", boxShadow: "var(--shadow-sm)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-lg)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(16, 185, 129, 0.2)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-sm)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border)"; }}
            >
              <div className="flex justify-between items-start mb-6">
                <div
                  className="p-4 rounded-2xl transition-all"
                  style={{ background: "rgba(16, 185, 129, 0.1)", color: "var(--brand-primary)" }}
                >
                  <Icon className="w-7 h-7" strokeWidth={2.5} />
                </div>
                <div
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-black"
                  style={isUp
                    ? { background: "var(--color-success-bg)", color: "var(--color-success)" }
                    : { background: "var(--color-error-bg)", color: "var(--color-error)" }
                  }
                >
                  <TrendIcon className="w-3 h-3" strokeWidth={3} aria-hidden="true" />
                  <span>{card.deltaValue}</span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-black text-tertiary uppercase tracking-widest">{card.label}</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-black text-text-primary tracking-tighter">{card.value}</p>
                  {card.deltaLabel && (
                    <span className="text-[10px] text-tertiary font-bold">{card.deltaLabel}</span>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Trend Chart */}
        <article
          className="lg:col-span-2 rounded-[32px] p-8 border flex flex-col"
          style={{ background: "var(--color-surface)", borderColor: "var(--color-border)", boxShadow: "var(--shadow-md)" }}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-black text-text-primary tracking-tight">참여 유입 추이</h3>
              <p className="text-[11px] text-tertiary font-black mt-0.5 uppercase tracking-widest">Monthly Participation Trend</p>
            </div>
            <div className="p-2 rounded-xl" style={{ background: "var(--color-background)" }}>
              <TrendingUp size={18} strokeWidth={2.5} style={{ color: "var(--brand-primary)" }} />
            </div>
          </div>
          <div className="h-[300px] w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={charts?.monthlyParticipation || []}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--brand-primary)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--brand-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-tertiary)', fontSize: 11, fontWeight: 700 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-tertiary)', fontSize: 11, fontWeight: 700 }} />
                <Tooltip contentStyle={{ borderRadius: 16, border: 'none', boxShadow: 'var(--shadow-lg)', padding: '12px 16px' }} itemStyle={{ fontWeight: 800, color: 'var(--color-text-primary)' }} />
                <Area type="monotone" dataKey="value" stroke="var(--brand-primary)" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        {/* Insurance Pie Chart */}
        <article
          className="rounded-[32px] p-8 border flex flex-col"
          style={{ background: "var(--color-surface)", borderColor: "var(--color-border)", boxShadow: "var(--shadow-md)" }}
        >
          <div className="mb-8">
            <h3 className="text-lg font-black text-text-primary tracking-tight">고용보험 가입 현황</h3>
            <p className="text-xs text-tertiary font-bold mt-0.5 uppercase tracking-wide">Insurance Distribution</p>
          </div>
          <div className="h-[300px] w-full relative min-h-[300px]">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={charts?.insuranceDistribution || []} cx="50%" cy="45%" innerRadius={60} outerRadius={100} paddingAngle={8} dataKey="value">
                  {(charts?.insuranceDistribution || []).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 16, border: 'none', boxShadow: 'var(--shadow-lg)' }} />
                <Legend verticalAlign="bottom" align="center" iconType="circle" formatter={(value) => <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-secondary)', marginLeft: 4 }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </article>

        {/* Course Bar Chart */}
        <article
          className="lg:col-span-2 rounded-[32px] p-8 border flex flex-col"
          style={{ background: "var(--color-surface)", borderColor: "var(--color-border)", boxShadow: "var(--shadow-md)" }}
        >
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-lg font-black text-text-primary tracking-tight">과정별 참여 기업 분포</h3>
              <p className="text-xs text-tertiary font-bold mt-0.5 uppercase tracking-wide">Course Participation by Companies</p>
            </div>
            <div className="p-2 rounded-xl" style={{ background: "rgba(16, 185, 129, 0.1)" }}>
              <Users size={18} style={{ color: "var(--brand-primary)" }} />
            </div>
          </div>
          <div className="h-[250px] w-full min-h-[250px]">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={charts?.courseCompanies || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border)" />
                <XAxis type="number" axisLine={false} tickLine={false} hide />
                <YAxis type="category" dataKey="label" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-secondary)', fontSize: 13, fontWeight: 800 }} width={120} />
                <Tooltip cursor={{ fill: 'var(--color-surface-subtle)' }} contentStyle={{ borderRadius: 16, border: 'none', boxShadow: 'var(--shadow-lg)' }} />
                <Bar dataKey="value" fill="var(--brand-primary)" radius={[0, 12, 12, 0]} barSize={32}>
                  {(charts?.courseCompanies || []).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? 'var(--brand-primary)' : 'rgba(16, 185, 129, 0.65)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        {/* Sub-Course Chart */}
        <article
          className="rounded-[32px] p-8 border flex flex-col"
          style={{ background: "var(--color-surface)", borderColor: "var(--color-border)", boxShadow: "var(--shadow-md)" }}
        >
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-lg font-black text-text-primary tracking-tight">세부 과정별 참여 현황</h3>
              <p className="text-xs text-tertiary font-bold mt-0.5 uppercase tracking-wide">Sub-Course Participation Details</p>
            </div>
            <div className="p-2 rounded-xl" style={{ background: "var(--color-info-bg)" }}>
              <Activity size={18} style={{ color: "var(--color-info)" }} />
            </div>
          </div>
          <div className="h-[250px] w-full min-h-[250px]">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={charts?.subCourseParticipation || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border)" />
                <XAxis type="number" axisLine={false} tickLine={false} hide />
                <YAxis type="category" dataKey="label" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-secondary)', fontSize: 11, fontWeight: 700 }} width={100} />
                <Tooltip cursor={{ fill: 'var(--color-surface-subtle)' }} contentStyle={{ borderRadius: 16, border: 'none', boxShadow: 'var(--shadow-lg)' }} />
                <Bar dataKey="value" fill="var(--color-info)" radius={[0, 8, 8, 0]} barSize={20}>
                  {(charts?.subCourseParticipation || []).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index < 3 ? 'var(--color-info)' : 'rgba(2,132,199,0.55)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        {/* Top Companies Ranking */}
        <article
          className="rounded-[32px] p-8 border flex flex-col"
          style={{ background: "var(--color-surface)", borderColor: "var(--color-border)", boxShadow: "var(--shadow-md)" }}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-black text-text-primary tracking-tight">참여 우수 기업</h3>
              <p className="text-xs text-tertiary font-bold mt-0.5 uppercase tracking-wide">Top Participating Partners</p>
            </div>
            <div className="p-2 rounded-xl" style={{ background: "var(--color-warning-bg)" }}>
              <Award size={18} style={{ color: "var(--color-warning)" }} />
            </div>
          </div>
          <div className="space-y-4">
            {(charts?.topCompanies || []).length === 0 ? (
              <p className="text-sm text-tertiary text-center py-10 italic">데이터가 없습니다.</p>
            ) : charts?.topCompanies.map((comp, idx) => (
              <div key={comp.name} className="flex items-center gap-4 group">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black"
                  style={idx === 0
                    ? { background: "var(--color-warning-bg)", color: "var(--color-warning)" }
                    : { background: "var(--color-surface-subtle)", color: "var(--color-text-secondary)" }
                  }
                >
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-text-secondary truncate" style={{ transition: "color 200ms" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--brand-primary)"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = ""}
                  >{comp.name}</p>
                  <p className="text-[10px] text-tertiary font-bold uppercase">{comp.value}건 참여 중</p>
                </div>
                <div className="w-12 h-1 rounded-full overflow-hidden" style={{ background: "var(--color-background)" }}>
                  <div
                    className="h-full"
                    style={{ background: "var(--brand-primary)", width: `${(comp.value / (charts?.topCompanies[0]?.value || 1)) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </article>

        {/* Recent Activity Feed */}
        <article
          className="lg:col-span-3 rounded-[32px] p-8 border flex flex-col"
          style={{ background: "var(--color-surface)", borderColor: "var(--color-border)", boxShadow: "var(--shadow-md)" }}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-black text-text-primary tracking-tight">최근 시스템 활동</h3>
              <p className="text-xs text-tertiary font-bold mt-0.5 uppercase tracking-wide">System Activity Log</p>
            </div>
            <div className="p-2 rounded-xl" style={{ background: "var(--color-info-bg)" }}>
              <Activity size={18} style={{ color: "var(--color-info)" }} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {recentActivity?.length === 0 ? (
              <p className="col-span-full text-sm text-tertiary text-center py-10 italic">최근 활동이 없습니다.</p>
            ) : recentActivity?.map((activity, idx) => {
              const isCompany = activity.entity === 'COMPANY';
              const isDelete = activity.type === 'DELETE';
              const isUpdate = activity.type === 'UPDATE';

              return (
                <div
                  key={idx}
                  className="flex flex-col gap-3 p-5 rounded-[24px] border transition-all group cursor-default"
                  style={{ background: "var(--color-surface-subtle)", borderColor: "var(--color-border)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(16, 185, 129, 0.05)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(16, 185, 129, 0.2)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--color-surface-subtle)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border)"; }}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
                      style={{ background: "var(--color-surface)", boxShadow: "var(--shadow-sm)", color: isDelete ? "rgba(239,68,68,0.4)" : isCompany ? "rgba(16, 185, 129, 0.6)" : "rgba(2,132,199,0.4)" }}
                    >
                      {isCompany ? <Building2 size={20} /> : <UserCheck size={20} />}
                    </div>
                    <span
                      className="text-[10px] font-black px-2 py-0.5 rounded-full"
                      style={isDelete
                        ? { background: "var(--color-error-bg)", color: "var(--color-error)" }
                        : isUpdate
                        ? { background: "var(--color-warning-bg)", color: "var(--color-warning)" }
                        : { background: "rgba(16, 185, 129, 0.1)", color: "var(--brand-primary)" }
                      }
                    >
                      {activity.type}
                    </span>
                  </div>
                  <div>
                    <span className="text-[14px] font-bold text-text-primary truncate block">{activity.name}</span>
                    <p className="text-[11px] text-text-secondary mt-1 line-clamp-2 font-medium leading-relaxed">{activity.details}</p>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-tertiary font-bold mt-auto pt-2" style={{ borderTop: "1px solid var(--color-border)" }}>
                    <Calendar size={10} />
                    {new Date(activity.date).toLocaleDateString()}
                  </div>
                </div>
              );
            })}
          </div>
        </article>

      </div>
    </div>
  );
}
