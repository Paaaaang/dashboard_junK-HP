import { parseISO, format } from "date-fns";
import { CompanyRecord, CourseGroup } from "../../../types/models";


export function formatBusinessRegNo(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

export function formatPhone(val: string): string {
  const digits = val.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

export function normalizeCompanyParticipations(
  company: CompanyRecord,
  groups: CourseGroup[],
): CompanyRecord {
  const byType = new Map(
    company.participations.map((participation) => [
      participation.courseType,
      participation,
    ]),
  );
  const participations = groups.map((group) => {
    const existing = byType.get(group.name);
    if (existing) return { ...existing };
    return {
      courseType: group.name,
      enabled: false,
      programNames: [],
      status: "미참여" as const,
    };
  });

  return { ...company, participations };
}

export function toDotDate(value: string | undefined): string {
  if (!value) return "-";
  try {
    // If it's an ISO string (contains T)
    if (value.includes("T")) {
      return format(parseISO(value), "yyyy.MM.dd");
    }
    // If it's already YYYY-MM-DD or similar
    return value.split("-").join(".");
  } catch (e) {
    return value;
  }
}

export function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getParticipationCount(company: CompanyRecord): number {
  return company.participations.reduce((count, participation) => {
    if (!participation.enabled) return count;
    return count + participation.programNames.length;
  }, 0);
}
