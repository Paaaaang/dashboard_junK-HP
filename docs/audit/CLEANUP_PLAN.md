# Frontend Cleanup and Refactoring Plan

## Phase 1 & 2: Schema and Store Synchronisation [COMPLETED]
- [x] Extract Database definitions utilizing MCP connected schema -> `src/types/database.ts`.
- [x] Restructure `src/types/models.ts` to logically support the `sub_course_sessions` abstraction without breaking downstream components.
- [x] Verify Zustand Stores (`useParticipantStore`, `useCourseStore`, `useCompanyStore`) properly join `sub_courses` and `sub_course_sessions`.

## Phase 3 & 4: UI/UX Type Safety Verification [COMPLETED]
- [x] Run `tsc --noEmit` and isolate missing Type fallback errors.
- [x] Add inline fallbacks to `LinkCourseModal.tsx` for `startDate` and `totalHours`.
- [x] Add proper `targetOutcome` default mappings in `useCourseManager.ts` and `CourseManagementPage.tsx`.

## Phase 5: Legacy Removal [COMPLETED]
- [x] Execute `knip` static analysis.
- [x] Delete orphaned UI files (`src/components/shared/CourseFloatingActionBar.tsx`).
- [x] Delete unnecessary indexes (`src/pages/participants/index.ts`).
- [x] Strip `src/constants/index.ts` of bulky, obsolete mock objects (`heatmapData`, `palette` configs, etc.).

## Phase 6: Final Validation [COMPLETED]
- [x] Complete build step `npm run build`.

## PR Separation Strategy (Recommended)
As constrained in the original request, the changes made locally can be partitioned into targeted Git Commits/PRs:

1. **PR 1: Type Definitions & Database Source of Truth**
   - Contains: `src/types/database.ts`, `src/types/models.ts`
   - Purpose: Establish the baseline structure mapping.
2. **PR 2: Store/Component Data Alignments**
   - Contains: `useCourseManager.ts`, `CourseManagementPage.tsx`, `LinkCourseModal.tsx`
   - Purpose: Ensuring components correctly handle `session` level abstractions instead of `course` level attributes.
3. **PR 3: Orphan & Dead Code Cleanup**
   - Contains: Deletion of `test-query.js`, `CourseFloatingActionBar.tsx`, cleanup of `src/constants/index.ts` and `src/components/index.ts`.
   - Purpose: Technical debt reduction.