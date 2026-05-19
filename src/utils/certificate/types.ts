export type FieldKey =
  | "name"
  | "course_name"
  | "completion_date"
  | "certificate_no"
  | "birth_date"
  | "total_hours"
  | "issue_date"
  | "company_name"
  | "static_text";

export type FieldAlign = "left" | "center" | "right";
export type FieldWeight = "regular" | "bold";

export interface CertificateField {
  id: string;
  key: FieldKey;
  label: string;
  page: number;
  x: number;
  y: number;
  fontSize: number;
  fontWeight: FieldWeight;
  align: FieldAlign;
  color: string;
  staticText?: string;
  dateFormat?: string;
}

export interface CertificateData {
  name: string;
  course_name: string;
  completion_date: string;
  certificate_no: string;
  birth_date?: string;
  total_hours?: number | string;
  company_name?: string;
}

export interface CertificateTemplate {
  id: string;
  name: string;
  description?: string | null;
  pdfPath: string;
  fontPath?: string | null;
  pageWidth: number;
  pageHeight: number;
  fields: CertificateField[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const FIELD_KEY_META: Record<Exclude<FieldKey, "static_text">, { label: string; sample: string }> = {
  name: { label: "이름", sample: "홍길동" },
  course_name: { label: "과정명", sample: "AI 데이터 분석 실무" },
  completion_date: { label: "수료일", sample: "2026-05-19" },
  certificate_no: { label: "수료번호", sample: "CRT-2026-0001" },
  birth_date: { label: "생년월일", sample: "1990-01-15" },
  total_hours: { label: "교육시간", sample: "32" },
  issue_date: { label: "발급일", sample: "2026-05-19" },
  company_name: { label: "소속", sample: "전남대학교" },
};
