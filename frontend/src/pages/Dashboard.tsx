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
import { useStatsStore } from '../stores/useStatsStore';
import { useToastStore } from '../stores/useToastStore';

const COLORS = ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#059669']; // Emerald palette

export function Dashboard() {
  const { summary, charts, recentActivity, isLoading, error, fetchStats, clearError } = useStatsStore();
  const { addToast } = useToastStore();

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

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
        <div className="w-10 h-10 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-error-bg border border-error/10 text-error rounded-2xl p-6 flex items-center gap-4">
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
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-background min-h-full animate-in fade-in duration-500">
      <header className="flex flex-col gap-1 px-1">
        <h2 className="text-2xl font-black text-text-primary tracking-tight">대시보드</h2>
        <p className="text-text-secondary text-sm font-medium italic">시스템의 실시간 핵심 지표를 확인하세요.</p>
      </header>

      {/* Summary Cards */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6" aria-label="핵심 지표 요약 카드">
        {summary.map((card, idx) => {
          const Icon = getIcon(card.label);
          const TrendIcon = card.trend === 'up' ? TrendingUp : TrendingDown;
          const isUp = card.trend === 'up';

          return (
            <article className="bg-surface rounded-3xl p-6 shadow-soft border border-border/50 hover:shadow-xl transition-all duration-300 group" key={idx}>
              <div className="flex justify-between items-start mb-6">
                <div className="p-4 rounded-2xl bg-brand-primary/10 text-brand-primary group-hover:scale-110 transition-transform duration-300">
                  <Icon className="w-7 h-7" strokeWidth={2.5} />
                </div>
                <div
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-black ${
                    isUp ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
                  }`}
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
        <article className="lg:col-span-2 bg-surface rounded-[32px] p-8 shadow-soft border border-border/50 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-black text-text-primary tracking-tight">참여 유입 추이</h3>
              <p className="text-[11px] text-text-tertiary font-black mt-0.5 uppercase tracking-widest">Monthly Participation Trend</p>
            </div>
            <div className="p-2 bg-background rounded-xl">
              <TrendingUp size={18} strokeWidth={2.5} className="text-brand-primary" />
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts?.monthlyParticipation || []}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }} 
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', padding: '12px 16px' }}
                  itemStyle={{ fontWeight: 800, color: '#0f172a' }}
                />
                <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        {/* Insurance Pie Chart */}
        <article className="bg-surface rounded-[32px] p-8 shadow-soft border border-border/50 flex flex-col">
          <div className="mb-8">
            <h3 className="text-lg font-black text-text-primary tracking-tight">고용보험 가입 현황</h3>
            <p className="text-xs text-text-tertiary font-bold mt-0.5 uppercase tracking-wide">Insurance Distribution</p>
          </div>
          <div className="h-[300px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts?.insuranceDistribution || []}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {(charts?.insuranceDistribution || []).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  align="center"
                  iconType="circle"
                  formatter={(value) => <span className="text-xs font-bold text-text-secondary ml-1">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </article>

        {/* Course Bar Chart */}
        <article className="lg:col-span-2 bg-surface rounded-[32px] p-8 shadow-soft border border-border/50 flex flex-col">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-lg font-black text-text-primary tracking-tight">과정별 참여 기업 분포</h3>
              <p className="text-xs text-text-tertiary font-bold mt-0.5 uppercase tracking-wide">Course Participation by Companies</p>
            </div>
            <div className="p-2 bg-brand-primary/10 rounded-xl">
              <Users size={18} className="text-brand-primary" />
            </div>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.courseCompanies || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" axisLine={false} tickLine={false} hide />
                <YAxis 
                  type="category" 
                  dataKey="label" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#475569', fontSize: 13, fontWeight: 800 }}
                  width={120}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                />
                <Bar 
                  dataKey="value" 
                  fill="#10b981" 
                  radius={[0, 12, 12, 0]} 
                  barSize={32}
                >
                  {(charts?.courseCompanies || []).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#34d399'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        {/* Sub-Course Detailed Chart */}
        <article className="bg-surface rounded-[32px] p-8 shadow-soft border border-border/50 flex flex-col">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-lg font-black text-text-primary tracking-tight">세부 과정별 참여 현황</h3>
              <p className="text-xs text-text-tertiary font-bold mt-0.5 uppercase tracking-wide">Sub-Course Participation Details</p>
            </div>
            <div className="p-2 bg-info/10 rounded-xl">
              <Activity size={18} className="text-info" />
            </div>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.subCourseParticipation || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" axisLine={false} tickLine={false} hide />
                <YAxis 
                  type="category" 
                  dataKey="label" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#475569', fontSize: 11, fontWeight: 700 }}
                  width={100}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                />
                <Bar 
                  dataKey="value" 
                  fill="#3b82f6" 
                  radius={[0, 8, 8, 0]} 
                  barSize={20}
                >
                  {(charts?.subCourseParticipation || []).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index < 3 ? '#3b82f6' : '#60a5fa'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        {/* Top Companies Ranking */}
        <article className="bg-surface rounded-[32px] p-8 shadow-soft border border-border/50 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-black text-text-primary tracking-tight">참여 우수 기업</h3>
              <p className="text-xs text-text-tertiary font-bold mt-0.5 uppercase tracking-wide">Top Participating Partners</p>
            </div>
            <div className="p-2 bg-warning/10 rounded-xl">
              <Award size={18} className="text-warning" />
            </div>
          </div>
          <div className="space-y-4">
            {(charts?.topCompanies || []).length === 0 ? (
              <p className="text-sm text-text-tertiary text-center py-10 italic">데이터가 없습니다.</p>
            ) : charts?.topCompanies.map((comp, idx) => (
              <div key={comp.name} className="flex items-center gap-4 group">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ${
                  idx === 0 ? "bg-warning/10 text-warning ring-4 ring-warning/5" : 
                  idx === 1 ? "bg-background text-text-secondary" :
                  idx === 2 ? "bg-orange-50 text-orange-600" : "bg-background text-text-tertiary"
                }`}>
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-text-secondary truncate group-hover:text-brand-primary transition-colors">{comp.name}</p>
                  <p className="text-[10px] text-text-tertiary font-bold uppercase">{comp.value}건 참여 중</p>
                </div>
                <div className="w-12 h-1 bg-background rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-brand-primary" 
                    style={{ width: `${(comp.value / (charts?.topCompanies[0]?.value || 1)) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </article>

        {/* Recent Activity Feed */}
        <article className="lg:col-span-3 bg-surface rounded-[32px] p-8 shadow-soft border border-border/50 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-black text-text-primary tracking-tight">최근 시스템 활동</h3>
              <p className="text-xs text-text-tertiary font-bold mt-0.5 uppercase tracking-wide">System Activity Log</p>
            </div>
            <div className="p-2 bg-info/10 rounded-xl">
              <Activity size={18} className="text-info" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {recentActivity?.length === 0 ? (
              <p className="col-span-full text-sm text-text-tertiary text-center py-10 italic">최근 활동이 없습니다.</p>
            ) : recentActivity?.map((activity, idx) => {
              const isCompany = activity.entity === 'COMPANY';
              const isDelete = activity.type === 'DELETE';
              const isUpdate = activity.type === 'UPDATE';
              
              return (
                <div key={idx} className="flex flex-col gap-3 p-5 bg-background/50 hover:bg-brand-primary/5 rounded-[24px] border border-border hover:border-brand-primary/20 transition-all group">
                  <div className="flex items-center justify-between">
                    <div className={`w-10 h-10 rounded-xl bg-surface shadow-sm flex items-center justify-center transition-colors ${
                      isDelete ? 'text-error/40 group-hover:text-error' : 
                      isCompany ? 'text-brand-primary/40 group-hover:text-brand-primary' : 'text-info/40 group-hover:text-info'
                    }`}>
                      {isCompany ? <Building2 size={20} /> : <UserCheck size={20} />}
                    </div>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                      isDelete ? 'bg-error/10 text-error' : 
                      isUpdate ? 'bg-warning/10 text-warning' : 'bg-brand-primary/10 text-brand-primary'
                    }`}>
                      {activity.type}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[14px] font-bold text-text-primary truncate">{activity.name}</span>
                    </div>
                    <p className="text-[11px] text-text-secondary mt-1 line-clamp-2 font-medium leading-relaxed">{activity.details}</p>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-text-tertiary font-bold mt-auto pt-2 border-t border-border">
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



