# Schema Differences Mapping (v1.0 -> v2.0)

This document tracks the mapping between the old schema structure and the new v2.0 Supabase database schema for the KHP Dashboard. It specifically focuses on areas that directly affected Frontend Types.

## Core Schema Restructuring

### 1. Courses and Sessions (`sub_courses` & `sub_course_sessions`)
**Previous State**: Sub-courses contained operational data directly (`startDate`, `endDate`, `totalHours`).
**New State**: Operational data has been extracted into `sub_course_sessions`. `sub_courses` now acts as a blueprint.

| Old UI Property (CourseDetail) | New UI Property | DB Table | DB Column |
|---|---|---|---|
| `startDate` | `startDate` (fallback added) | `sub_course_sessions` | `start_date` |
| `endDate` | `endDate` (fallback added) | `sub_course_sessions` | `end_date` |
| `durationDays` | `durationDays` | `sub_courses` | `duration_days` |
| `totalHours` | `totalHours` (fallback added) | `sub_course_sessions` | `total_hours` |
| `targetOutcome` | `targetOutcome` (fallback added) | `sub_course_sessions` | `target_outcome` |

*Note: The frontend UI components heavily relied on `CourseDetail.startDate` to display timelines. Instead of entirely ripping it out, `models.ts` was updated to retain these fields optionally, allowing Zustand stores (`useCourseStore`) to aggregate and inject the data dynamically (e.g., minimum start date from sessions).*

### 2. Enrollments (`enrollments`)
**Previous State**: `enrollments` mapped directly to a general `course_id`.
**New State**: `enrollments` maps strictly to `session_id`, ensuring a participant is enrolled in a specific operational time block.

| Old Concept | New DB Column | UI Type property |
|---|---|---|
| `course_id` (Implied) | `session_id` | `ParticipantEnrollment.sessionId` |
| `status` (수료/미수료) | `status` | `status` |

### 3. Users and Auth (`users`)
**Previous State**: Manual `password` management.
**New State**: Migrated to `password_hash`.
*Impact: None. The frontend handles authentication exclusively via `@supabase/supabase-js`'s `signInWithPassword`, bypassing direct reads of the `public.users` table.*

### 4. Audience Enumeration (`course_group_audiences`)
**Previous State**: Hardcoded UI strings or arrays.
**New State**: Normalized enum `audience_type` ('INSURED', 'UNINSURED', 'CEO', 'EXECUTIVE', 'FUTURE_TALENT').
*Impact: `useCourseStore` implements `AUDIENCE_DB_TO_UI` mapping to safely translate the DB strings into frontend friendly labels (e.g., "재직자 (고용보험 가입)").*