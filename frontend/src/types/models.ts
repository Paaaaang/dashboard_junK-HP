import type { LucideIcon } from 'lucide-react';

export type StatusKind = 'success' | 'warning' | 'error' | 'info' | 'neutral';
export type InsuranceTarget = 'ALL' | 'INSURED' | 'UNINSURED';
export type CourseType = '훈련비과정' | '지원비과정' | '공유개방 세미나';

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
  courseType: CourseType;
  enabled: boolean;
  programNames: string[];
  status: '미참여' | '대기' | '참여중' | '완료';
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
  participations: CompanyParticipation[];
}

export interface ParticipantRecord {
  id: string;
  companyName: string;
  courseType: CourseType;
  name: string;
  birthDate: string;
  certificateNo: string;
  completionDate: string;
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
