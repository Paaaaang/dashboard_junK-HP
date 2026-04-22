import {
  Building2,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Megaphone,
  UserCheck,
} from 'lucide-react';
import type { CourseType, EmailTemplate, NavigationItem, KpiCardItem, CompanyRecord, ParticipantRecord, HeatPoint } from '../types/models';

// Premium Dark Green Palette - Professional
export const palette = {
  primary: '#064e3b', // Dark Forest Green
  primarySoft: '#ecfdf5', // soft 배경
  secondary: '#047857', // Hover state
  warning: '#f59e0b', // Amber
  error: '#ef4444', // Red
  info: '#0284c7', // Blue
  success: '#10b981', // Emerald
  cta: '#10b981', // CTA Button - Emerald
} as const;

export const courseCatalog: CourseType[] = ['훈련비과정', '지원비과정', '공유개방 세미나'];

export const trainingTypeCatalog: string[] = ['집체훈련', '원격훈련', '현장훈련', '혼합훈련'];

export const programCatalog: Record<CourseType, string[]> = {
  '훈련비과정': ['스마트팩토리 실무', '고급 CAD 실습', 'IoT 기초', '빅데이터 분석 실무', 'CNC 가공 실무', '전기·전자 기초'],
  '지원비과정': ['품질관리 고도화', '생산성 향상', '원가절감 전략', 'ERP 활용', 'ISO 인증 지원', '공정 개선 실무'],
  '공유개방 세미나': ['AI 현장 적용 세미나', '스마트제조 트렌드', '디지털 전환 전략', 'ESG 경영 세미나', '탄소중립 실무'],
};

// 네비게이션
export const mainNavigation: NavigationItem[] = [
  { to: '/', label: '대시보드', icon: LayoutDashboard },
  { to: '/forms', label: '신청 폼 자동화', icon: FileText },
  { to: '/posters', label: '포스터 자동화', icon: Megaphone },
];

type EducationSubNavigationItem = Omit<NavigationItem, 'icon'>;

export const educationSubNavigation: EducationSubNavigationItem[] = [
  { to: '/companies', label: '기업 관리' },
  { to: '/participants', label: '참여자 및 수료' },
  { to: '/templates', label: '이메일 템플릿' },
];

// KPI 카드 데이터
export const kpiCards: KpiCardItem[] = [
  {
    label: '과정별 참여 기업 수',
    value: '48',
    delta: '+6 (지난달 대비)',
    status: 'success',
    icon: Building2,
  },
  {
    label: '전체 참여자 수',
    value: '312',
    delta: '+18 (이번 주)',
    status: 'info',
    icon: UserCheck,
  },
  {
    label: '전체 달성률',
    value: '82%',
    delta: '+4.2%p',
    status: 'success',
    icon: GraduationCap,
  },
  {
    label: '대기 상태 신청',
    value: '21',
    delta: '승인 필요',
    status: 'warning',
    icon: Building2,
  },
];

// 차트 데이터
export const lineTrendData = [
  { week: '1주차', company: 28, participant: 64 },
  { week: '2주차', company: 32, participant: 78 },
  { week: '3주차', company: 35, participant: 92 },
  { week: '4주차', company: 40, participant: 106 },
  { week: '5주차', company: 48, participant: 118 },
];

export const courseBarData = [
  { course: '훈련비과정', companies: 22, participants: 128 },
  { course: '지원비과정', companies: 15, participants: 102 },
  { course: '공유개방 세미나', companies: 11, participants: 82 },
];

export const insurancePieData = [
  { name: '고용보험 가입', value: 68 },
  { name: '고용보험 미가입', value: 12 },
  { name: '확인중', value: 20 },
];

// 히트맵 데이터
export const dayLabels = ['월', '화', '수', '목', '금'];
export const timeLabels = ['09시', '11시', '13시', '15시', '17시'];
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
export const pipelineRows = [
  {
    company: '한빛테크',
    course: '훈련비과정' as CourseType,
    program: '스마트팩토리 실무',
    insurance: '가입자',
    status: '신청서 발송',
    statusType: 'info' as const,
    updatedAt: '2026-04-16 15:10',
  },
  {
    company: '미래정밀',
    course: '지원비과정' as CourseType,
    program: '품질관리 고도화',
    insurance: '확인중',
    status: '대기',
    statusType: 'warning' as const,
    updatedAt: '2026-04-17 09:20',
  },
  {
    company: '에코솔루션',
    course: '공유개방 세미나' as CourseType,
    program: 'AI 현장 적용 세미나',
    insurance: '비대상',
    status: '승인',
    statusType: 'success' as const,
    updatedAt: '2026-04-17 10:35',
  },
  {
    company: '동남기술',
    course: '훈련비과정' as CourseType,
    program: '고급 CAD 실습',
    insurance: '미가입',
    status: '반려',
    statusType: 'error' as const,
    updatedAt: '2026-04-17 11:02',
  },
];

// 초기 기업 데이터
export const initialCompanies: CompanyRecord[] = [
  {
    id: 'company-1',
    companyName: '한빛테크',
    businessRegNo: '123-45-67890',
    location: '광주 북구 첨단과기로 123',
    representative: '김도현',
    manager: '박소영',
    phone: '010-1234-5678',
    email: 'hr@hanbit-tech.co.kr',
    mouSigned: true,
    participations: [
      { courseType: '훈련비과정', enabled: true, programNames: ['스마트팩토리 실무'], status: '참여중' },
      { courseType: '지원비과정', enabled: false, programNames: [], status: '미참여' },
      { courseType: '공유개방 세미나', enabled: true, programNames: ['AI 현장 적용 세미나'], status: '대기' },
    ],
  },
  {
    id: 'company-2',
    companyName: '미래정밀',
    businessRegNo: '987-65-43210',
    location: '전남 나주시 산학로 88',
    representative: '이정민',
    manager: '최수진',
    phone: '010-9876-2468',
    email: 'edu@mirae-precision.com',
    mouSigned: false,
    participations: [
      { courseType: '훈련비과정', enabled: false, programNames: [], status: '미참여' },
      { courseType: '지원비과정', enabled: true, programNames: ['품질관리 고도화'], status: '대기' },
      { courseType: '공유개방 세미나', enabled: false, programNames: [], status: '미참여' },
    ],
  },
];

// 초기 참여자 데이터
export const initialParticipants: ParticipantRecord[] = [
  {
    id: 'pt-1',
    companyName: '한빛테크',
    courseType: '훈련비과정',
    name: '박진우',
    birthDate: '1989-03-21',
    certificateNo: 'JNU-TR-2026-0012',
    completionDate: '2026-03-28',
  },
  {
    id: 'pt-2',
    companyName: '에코솔루션',
    courseType: '지원비과정',
    name: '정하늘',
    birthDate: '1992-11-07',
    certificateNo: 'JNU-SP-2026-0008',
    completionDate: '2026-04-02',
  },
];

// 초기 이메일 템플릿 데이터
export const initialTemplates: EmailTemplate[] = [
  {
    id: 'tpl-1',
    name: '신청서 발송(고용보험 가입자)',
    audience: 'INSURED',
    subject: '[전남대학교] {{courseName}} 신청서 안내',
    body:
      '안녕하세요 {{companyName}} 담당자님.\n\n{{courseName}} 참여를 위한 신청서 양식을 첨부드립니다.\n제출기한: {{deadline}}\n\n문의: {{contactPhone}}',
  },
  {
    id: 'tpl-2',
    name: '신청 불가 안내(고용보험 미가입)',
    audience: 'UNINSURED',
    subject: '[전남대학교] {{courseName}} 수강 대상 안내',
    body:
      '안녕하세요 {{companyName}} 담당자님.\n\n해당 과정은 고용보험 가입자만 참여 가능합니다.\n추후 대상 확대 시 재안내드리겠습니다.\n\n문의: {{contactPhone}}',
  },
];

export const templateVariables = ['{{companyName}}', '{{courseName}}', '{{deadline}}', '{{contactPhone}}', '{{managerName}}'];

// 유틸리티 함수
export function createEmptyCompany(): CompanyRecord {
  return {
    id: `company-${Date.now()}`,
    companyName: '',
    businessRegNo: '',
    location: '',
    representative: '',
    manager: '',
    phone: '',
    email: '',
    mouSigned: false,
    participations: courseCatalog.map((courseType) => ({
      courseType,
      enabled: false,
      programNames: [],
      status: '미참여',
    })),
  };
}

export function cloneCompany(company: CompanyRecord): CompanyRecord {
  return {
    ...company,
    participations: company.participations.map((participation) => ({ ...participation })),
  };
}
