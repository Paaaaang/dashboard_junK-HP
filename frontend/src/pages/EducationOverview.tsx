import { Link } from "react-router-dom";
import { Building2, Users, Mail, ChevronRight } from "lucide-react";
import { PageHeader } from "../components";
import { useCompanyStore, useParticipantStore, useTemplateStore } from "../stores";

export function EducationOverviewPage() {
  const { companies } = useCompanyStore();
  const { participants } = useParticipantStore();
  const { templates } = useTemplateStore();

  const overviewItems = [
    {
      to: "/companies",
      title: "기업",
      description: "기업 정보, 협약 여부, 과정 참여 상태를 관리합니다.",
      icon: Building2,
      count: companies.length,
      unit: "개 기업",
      accentColor: "var(--color-primary)",
      accentBg: "rgba(8,145,178,0.1)",
    },
    {
      to: "/participants",
      title: "참여자",
      description: "수료증 번호와 수료일자를 포함한 참여자 이력을 관리합니다.",
      icon: Users,
      count: participants.length,
      unit: "명 참여",
      accentColor: "var(--color-info)",
      accentBg: "var(--color-info-bg)",
    },
    {
      to: "/templates",
      title: "이메일",
      description: "고용보험 가입 여부에 따라 다른 안내 템플릿을 운영합니다.",
      icon: Mail,
      count: templates.length,
      unit: "개 서식",
      accentColor: "var(--color-warning)",
      accentBg: "var(--color-warning-bg)",
    }
  ];

  return (
    <div>
      <PageHeader title="교육 과정 관리" />

      <section className="px-2" aria-label="교육 과정 관리 하위 카테고리">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {overviewItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="group relative p-8 rounded-[32px] border overflow-hidden transition-all duration-300"
              style={{ background: "var(--color-surface)", borderColor: "var(--color-border)", boxShadow: "var(--shadow-sm)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-xl)"; (e.currentTarget as HTMLElement).style.borderColor = `${item.accentColor}33`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-sm)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border)"; }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500" style={{ background: item.accentColor }} />

              <div className="flex flex-col h-full">
                <div className="flex items-start justify-between mb-8">
                  <div
                    className="p-4 rounded-2xl transition-colors"
                    style={{ background: "var(--color-surface-subtle)" }}
                    ref={el => {
                      if (!el) return;
                      const parent = el.closest('a');
                      if (!parent) return;
                      parent.addEventListener('mouseenter', () => { el.style.background = item.accentBg; el.style.color = item.accentColor; });
                      parent.addEventListener('mouseleave', () => { el.style.background = "var(--color-surface-subtle)"; el.style.color = ""; });
                    }}
                  >
                    <item.icon size={28} strokeWidth={2.5} />
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-4xl font-black text-text-primary tracking-tighter">{item.count}</span>
                    <span className="text-[11px] font-black text-tertiary uppercase tracking-widest">{item.unit}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-black text-text-primary flex items-center gap-2">
                    {item.title}
                    <ChevronRight size={18} strokeWidth={3} className="text-tertiary group-hover:translate-x-1 transition-all" />
                  </h3>
                  <p className="text-[13px] text-text-secondary font-medium leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Banner */}
        <div
          className="mt-12 rounded-[40px] p-10 text-white overflow-hidden relative"
          style={{ background: "var(--color-text)", boxShadow: "0 25px 60px rgba(22,78,99,0.25)" }}
        >
          <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M0,100 C30,80 70,120 100,100 L100,0 L0,0 Z" fill="white" />
            </svg>
          </div>

          <div className="relative z-10 max-w-2xl">
            <h2 className="text-3xl font-black tracking-tight mb-4">데이터 기반의 체계적인 관리</h2>
            <p className="text-lg font-medium leading-relaxed mb-10" style={{ color: "rgba(255,255,255,0.8)" }}>
              K-하이테크 플랫폼의 모든 교육 과정과 참여 기업, 수강생 정보를 한곳에서 관리하세요.
              실시간 통계와 자동화된 템플릿을 통해 운영 효율을 극대화할 수 있습니다.
            </p>
            <div className="flex gap-4">
              <div className="px-6 py-4 rounded-[24px] border" style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(12px)", borderColor: "rgba(255,255,255,0.1)" }}>
                <p className="text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: "var(--color-secondary)", opacity: 0.9 }}>MOU Signed</p>
                <p className="text-2xl font-black">{companies.filter(c => c.mouSigned).length} <span className="text-sm font-bold ml-0.5" style={{ opacity: 0.6 }}>개 기업</span></p>
              </div>
              <div className="px-6 py-4 rounded-[24px] border" style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(12px)", borderColor: "rgba(255,255,255,0.1)" }}>
                <p className="text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: "var(--color-secondary)", opacity: 0.9 }}>Total Enrollments</p>
                <p className="text-2xl font-black">{participants.reduce((acc, p) => acc + p.enrollments.length, 0)} <span className="text-sm font-bold ml-0.5" style={{ opacity: 0.6 }}>건</span></p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export function EducationOverview() {
  return <EducationOverviewPage />;
}
