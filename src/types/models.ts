import type { LucideIcon } from "lucide-react";

export type StatusKind = "success" | "warning" | "error" | "info" | "neutral";
export type InsuranceTarget = "ALL" | "INSURED" | "UNINSURED";
export type CourseType = string;

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

export type ParticipantTabKey = "ALL" | string;
export type InsuranceFilter = "ALL" | "가입" | "미가입";
export type CompletionFilter = "ALL" | "수료" | "미수료";

export interface ParticipantEnrollment {
  id: string;
  courseType: CourseType;
  subCourseName: string;
  subCourseId?: string;
  sessionId?: string; // Link to a specific session
  startDate: string;
  endDate: string;
  totalHours: number;
  status: CompletionStatus;
  completionDate?: string;
  certificateNo?: string;
  applicationDate?: string;
  isRetake?: boolean;
  retakeReason?: string;
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
  review?: string;
  newCompany?: {
    companyName: string;
    location: string;
    representative: string;
  };
}

export interface AttachmentMeta {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  path?: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  audience: InsuranceTarget;
  subject: string;
  body: string;
  attachments?: AttachmentMeta[];
  createdAt?: string;
  updatedAt?: string;
}

export interface EmailLog {
  id: string;
  jobId?: string;
  templateId?: string;
  templateName?: string;
  senderEmail: string;
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  bodyRendered?: string;
  status: "sent" | "failed" | "pending";
  errorMessage?: string;
  sentAt?: string;
  createdAt: string;
}

export interface EmailJob {
  id: string;
  templateId: string;
  totalCount: number;
  sentCount: number;
  failedCount: number;
  status: "queued" | "running" | "completed" | "failed";
  createdBy?: string;
  createdAt: string;
  completedAt?: string;
}

export interface HeatPoint {
  x: number;
  y: number;
  value: number;
  day: string;
  time: string;
}

export interface SubCourseParticipant {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  completedCourses: number;
  totalCourses: number;
  completed: boolean;
}

export interface SubCourseWithParticipants {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  totalHours: number;
  participants: SubCourseParticipant[];
}

export type CourseParticipantsMap = Record<
  string,
  Record<string, SubCourseWithParticipants>
>;

// Course Management Types
export type AudienceOption =
  | "재직자 (고용보험 가입)"
  | "재직자 (고용보험 미가입)"
  | "기업 대표"
  | "임원"
  | "미래인재";

export type SessionStatus = "PLANNED" | "ONGOING" | "CLOSED" | "CANCELLED";

export interface CourseSession {
  id: string;
  subCourseId?: string;
  sessionNo?: number;
  startDate: string;
  endDate: string;
  totalHours: number;
  targetOutcome: number;
  status?: SessionStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface CourseDetail {
  id: string;
  groupId?: string;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  durationDays: number;
  totalHours?: number;
  targetOutcome?: number;
  isActive?: boolean;
  sortOrder?: number;
  sessions?: CourseSession[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CourseGroup {
  id: string;
  name: string;
  description?: string;
  sortOrder?: number;
  audiences: AudienceOption[];
  details: CourseDetail[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CourseGroupForm {
  name: string;
  description?: string;
  audiences: AudienceOption[];
  details: CourseDetail[];
}

export interface CourseDetailDraft {
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  durationDays: string;
  totalHours?: string;
  targetOutcome?: string;
  isActive?: boolean;
  sessions: CourseSession[];
}
