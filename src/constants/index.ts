import {
  FileText,
  LayoutDashboard,
  Megaphone,
} from "lucide-react";
import type {
  EmailTemplate,
  NavigationItem,
  CompanyRecord,
} from "@/types/models";

// 네비게이션
export const mainNavigation: NavigationItem[] = [
  { to: "/", label: "대시보드", icon: LayoutDashboard },
  { to: "/forms", label: "신청 폼 자동화(예정)", icon: FileText },
  { to: "/posters", label: "포스터 자동화(예정)", icon: Megaphone },
];

type EducationSubNavigationItem = Omit<NavigationItem, "icon">;

export const educationSubNavigation: EducationSubNavigationItem[] = [
  { to: "/companies", label: "기업" },
  { to: "/participants", label: "참여자" },
  { to: "/courses", label: "교육 과정" },
  { to: "/instructors", label: "강사 풀 관리" },
  { to: "/templates", label: "이메일 시스템 관리" },
];

// 초기 이메일 템플릿 데이터
export const initialTemplates: EmailTemplate[] = [
  {
    id: "tpl-1",
    name: "신청서 발송(고용보험 가입자)",
    audience: "INSURED",
    subject: "[전남대학교] {{courseName}} 신청서 안내",
    body: "안녕하세요 {{companyName}} 담당자님.\n\n{{courseName}} 참여를 위한 신청서 양식을 첨부드립니다.\n제출기한: {{deadline}}\n\n문의: {{contactPhone}}",
    attachments: [],
  },
  {
    id: "tpl-2",
    name: "신청 불가 안내(고용보험 미가입)",
    audience: "UNINSURED",
    subject: "[전남대학교] {{courseName}} 수강 대상 안내",
    body: "안녕하세요 {{companyName}} 담당자님.\n\n해당 과정은 고용보험 가입자만 참여 가능합니다.\n추후 대상 확대 시 재안내드리겠습니다.\n\n문의: {{contactPhone}}",
    attachments: [],
  },
];

export const templateVariableMetadata = [
  { key: "companyName", label: "기업명", description: "참여자가 소속된 기업 명칭" },
  { key: "subCourseName", label: "프로그램명", description: "실제 교육 프로그램 명칭" },
  { key: "courseDate", label: "회차(일정)", description: "교육이 진행되는 회차 및 일정" },
];

export function cloneCompany(company: CompanyRecord): CompanyRecord {
  return {
    ...company,
    participations: company.participations.map((participation) => ({
      ...participation,
    })),
  };
}

