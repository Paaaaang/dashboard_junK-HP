import {
  FileText,
  LayoutDashboard,
  Megaphone,
} from "lucide-react";
import type {
  CourseType,
  EmailTemplate,
  NavigationItem,
  KpiCardItem,
  CompanyRecord,
  ParticipantRecord,
  HeatPoint,
} from "../types/models";

// Premium Dark Green Palette - Professional
export const palette = {
  primary: "#064e3b", // Dark Forest Green
  primarySoft: "#ecfdf5", // soft 배경
  secondary: "#047857", // Hover state
  warning: "#f59e0b", // Amber
  error: "#ef4444", // Red
  info: "#0284c7", // Blue
  success: "#10b981", // Emerald
  cta: "#10b981", // CTA Button - Emerald
} as const;

export const courseCatalog: CourseType[] = [
  "훈련비과정",
  "지원비과정",
  "공유개방 세미나",
];

export const trainingTypeCatalog: string[] = [
  "집체훈련",
  "원격훈련",
  "현장훈련",
  "혼합훈련",
];

export const programCatalog: Record<CourseType, string[]> = {
  훈련비과정: [
    "스마트팩토리 실무",
    "고급 CAD 실습",
    "IoT 기초",
    "빅데이터 분석 실무",
    "CNC 가공 실무",
    "전기·전자 기초",
  ],
  지원비과정: [
    "품질관리 고도화",
    "생산성 향상",
    "원가절감 전략",
    "ERP 활용",
    "ISO 인증 지원",
    "공정 개선 실무",
  ],
  "공유개방 세미나": [
    "AI 현장 적용 세미나",
    "스마트제조 트렌드",
    "디지털 전환 전략",
    "ESG 경영 세미나",
    "탄소중립 실무",
  ],
};

// 네비게이션
export const mainNavigation: NavigationItem[] = [
  { to: "/", label: "대시보드", icon: LayoutDashboard },
  { to: "/forms", label: "신청 폼 자동화", icon: FileText },
  { to: "/posters", label: "포스터 자동화", icon: Megaphone },
];

type EducationSubNavigationItem = Omit<NavigationItem, "icon">;

export const educationSubNavigation: EducationSubNavigationItem[] = [
  { to: "/companies", label: "기업 관리" },
  { to: "/participants", label: "참여자 및 수료" },
  { to: "/templates", label: "이메일 템플릿" },
];

// KPI 카드 데이터 (Placeholder - Now fetched from API)
export const kpiCards: KpiCardItem[] = [];

// 차트 데이터 (Placeholder - Now fetched from API)
export const lineTrendData: any[] = [];
export const courseBarData: any[] = [];
export const insurancePieData: any[] = [];

// 히트맵 데이터
export const dayLabels = ["월", "화", "수", "목", "금"];
export const timeLabels = ["09시", "11시", "13시", "15시", "17시"];
export const heatMatrix = [
  [8, 5, 4, 2, 1],
  [7, 9, 5, 3, 2],
  [5, 7, 10, 6, 3],
  [4, 6, 8, 7, 5],
  [2, 4, 6, 5, 4],
];

export const heatmapData: HeatPoint[] = dayLabels.flatMap((day, dayIndex) =>
  timeLabels.map((time, timeIndex) => ({
    x: dayIndex,
    y: timeIndex,
    value: heatMatrix[dayIndex][timeIndex],
    day,
    time,
  })),
);

// 파이프라인 행 데이터
export const pipelineRows: any[] = [];

// Empty initial states for stores
export const initialCompanies: CompanyRecord[] = [];
export const initialParticipants: ParticipantRecord[] = [];

// 초기 이메일 템플릿 데이터
export const initialTemplates: EmailTemplate[] = [
  {
    id: "tpl-1",
    name: "신청서 발송(고용보험 가입자)",
    audience: "INSURED",
    subject: "[전남대학교] {{courseName}} 신청서 안내",
    body: "안녕하세요 {{companyName}} 담당자님.\n\n{{courseName}} 참여를 위한 신청서 양식을 첨부드립니다.\n제출기한: {{deadline}}\n\n문의: {{contactPhone}}",
  },
  {
    id: "tpl-2",
    name: "신청 불가 안내(고용보험 미가입)",
    audience: "UNINSURED",
    subject: "[전남대학교] {{courseName}} 수강 대상 안내",
    body: "안녕하세요 {{companyName}} 담당자님.\n\n해당 과정은 고용보험 가입자만 참여 가능합니다.\n추후 대상 확대 시 재안내드리겠습니다.\n\n문의: {{contactPhone}}",
  },
];

export const templateVariables = [
  "{{companyName}}",
  "{{courseName}}",
  "{{deadline}}",
  "{{contactPhone}}",
  "{{managerName}}",
];

// 유틸리티 함수
export function createEmptyCompany(): CompanyRecord {
  return {
    id: `company-${Date.now()}`,
    companyName: "",
    businessRegNo: "",
    location: "",
    representative: "",
    manager: "",
    phone: "",
    email: "",
    mouSigned: false,
    mouSignedDate: "",
    createdAt: new Date().toISOString().slice(0, 10),
    participations: courseCatalog.map((courseType) => ({
      courseType,
      enabled: false,
      programNames: [],
      status: "미참여",
    })),
  };
}

export function cloneCompany(company: CompanyRecord): CompanyRecord {
  return {
    ...company,
    participations: company.participations.map((participation) => ({
      ...participation,
    })),
  };
}
