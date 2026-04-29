import type { ParticipantRecord } from "../types/models";

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

export type CourseParticipantsMap = Record<string, Record<string, SubCourseWithParticipants>>;

export function transformParticipantsToMap(
  participants: ParticipantRecord[],
  courseGroupNames: Record<string, string> // Map courseType name to groupId
): Record<string, CourseParticipantsMap> {
  const map: Record<string, CourseParticipantsMap> = {};

  participants.forEach((p) => {
    p.enrollments.forEach((enr) => {
      const companyId = p.companyId;
      const groupId = Object.keys(courseGroupNames).find(
        (key) => courseGroupNames[key] === enr.courseType
      );

      if (!groupId) return;

      if (!map[companyId]) map[companyId] = {};
      if (!map[companyId][groupId]) map[companyId][groupId] = {};

      const subCourseId = enr.subCourseName; // Using name as key for now
      if (!map[companyId][groupId][subCourseId]) {
        map[companyId][groupId][subCourseId] = {
          id: subCourseId,
          name: enr.subCourseName,
          startDate: enr.startDate,
          endDate: enr.endDate,
          totalHours: enr.totalHours,
          participants: [],
        };
      }

      map[companyId][groupId][subCourseId].participants.push({
        id: p.id,
        name: p.name,
        email: p.email,
        phone: p.phone,
        position: p.position,
        completedCourses: p.enrollments.filter((e) => e.status === "수료").length,
        totalCourses: p.enrollments.length,
        completed: enr.status === "수료",
      });
    });
  });

  return map;
}
