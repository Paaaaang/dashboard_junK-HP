import { Link } from "react-router-dom";
import { Building2, Users, Mail } from "lucide-react";
import { PageHeader } from "../components/PageHeader";

export function EducationOverviewPage() {
  return (
    <>
      <PageHeader title="교육 과정 관리" />

      <section aria-label="교육 과정 관리 하위 카테고리">
        <div className="education-overview-grid">
          <Link className="education-overview-card" to="/companies">
            <Building2 className="icon-sm" />
            <h3>기업 관리</h3>
            <p>기업 정보, 협약 여부, 과정 참여 상태를 관리합니다.</p>
          </Link>
          <Link className="education-overview-card" to="/participants">
            <Users className="icon-sm" />
            <h3>참여자 및 수료</h3>
            <p>수료증 번호와 수료일자를 포함한 참여자 이력을 관리합니다.</p>
          </Link>
          <Link className="education-overview-card" to="/templates">
            <Mail className="icon-sm" />
            <h3>이메일 템플릿</h3>
            <p>고용보험 가입 여부에 따라 다른 안내 템플릿을 운영합니다.</p>
          </Link>
        </div>
      </section>
    </>
  );
}
