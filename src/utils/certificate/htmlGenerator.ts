export interface CertificateHtmlData {
  certNo: string;           // 수료번호 (예: 2026-0520001)
  name: string;             // 성명
  birthDate?: string;       // 생년월일 (예: 1990년 01월 15일)
  company?: string;         // 소속기업
  courseName: string;       // 훈련과정명
  trainingDate: string;     // 훈련일자 (예: 2026.05.20.)
  totalHours: number | string; // 훈련시간
  issueDate: string;        // 발급일 (예: 2026년 05월 20일)
}

export function fillCertificateTemplate(
  html: string,
  data: CertificateHtmlData
): string {
  return html
    .replace(/\{\{CERT_NO\}\}/g, data.certNo)
    .replace(/\{\{NAME\}\}/g, data.name)
    .replace(/\{\{BIRTH_DATE\}\}/g, data.birthDate || "")
    .replace(/\{\{COMPANY\}\}/g, data.company || "")
    .replace(/\{\{COURSE_NAME\}\}/g, data.courseName)
    .replace(/\{\{TRAINING_DATE\}\}/g, data.trainingDate)
    .replace(/\{\{TOTAL_HOURS\}\}/g, String(data.totalHours))
    .replace(/\{\{ISSUE_DATE\}\}/g, data.issueDate);
}

export function isoToKoreanDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  return `${m[1]}년 ${m[2]}월 ${m[3]}일`;
}

export function isoToTrainingDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  return `${m[1]}.${m[2]}.${m[3]}.`;
}
