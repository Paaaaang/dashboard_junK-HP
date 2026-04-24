import type { LucideIcon } from "lucide-react";

export type StatusKind = "success" | "warning" | "error" | "info" | "neutral";
export type InsuranceTarget = "ALL" | "INSURED" | "UNINSURED";
export type CourseType = "훈련비과정" | "지원비과정" | "공유개방 세미나";

export interface NavigationItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

export interface KpiCardItem {
  label: string;
  value: string;
  delta: string;
  status: StatusKind;
  icon: LucideIcon;
}

export interface CompanyParticipation {
  courseType: string;
  enabled: boolean;
  programNames: string[];
  status: "미참여" | "대기" | "참여중" | "완료";
}

export interface CompanyRecord {
  id: string;
  companyName: string;
  businessRegNo: string;
  location: string;
  representative: string;
  manager: string;
  phone: string;
  email: string;
  mouSigned: boolean;
  mouSignedDate?: string;
  createdAt?: string;
  participations: CompanyParticipation[];
}

export type CompletionStatus = "수료" | "미수료";
export type EmploymentInsuranceStatus = "가입" | "미가입" | "미확인";
export type WorkExperience =
  | "3년차 이하"
  | "3~5년차"
  | "5~10년차"
  | "10년차 이상";
export type DocumentSkill =
  | "없음"
  | "기초 수준"
  | "일부 작성 경험 있음"
  | "능숙"
  | "전문가 수준";

export interface ParticipantEnrollment {
  id: string;
  courseType: CourseType;
  subCourseName: string;
  startDate: string;
  endDate: string;
  totalHours: number;
  status: CompletionStatus;
  completionDate?: string;
  certificateNo?: string;
  applicationDate?: string;
}

export interface ParticipantRecord {
  id: string;
  name: string;
  companyId: string;
  companyName: string;
  companyLocation?: string;
  companyRepresentative?: string;
  companyManager?: string;
  companyPhone?: string;
  companyEmail?: string;
  mouSigned?: boolean;
  position: string;
  phone: string;
  email: string;
  employmentInsurance: EmploymentInsuranceStatus;
  workExperience?: WorkExperience;
  documentSkill?: DocumentSkill;
  enrollments: ParticipantEnrollment[];
}

export interface EmailTemplate {
  id: string;
  name: string;
  audience: InsuranceTarget;
  subject: string;
  body: string;
}

export interface HeatPoint {
  x: number;
  y: number;
  value: number;
  day: string;
  time: string;
}
