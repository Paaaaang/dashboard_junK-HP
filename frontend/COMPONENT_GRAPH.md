# Component Dependency Graph

This file tracks the relationship between components and their usage to ensure safe migrations and removal of old code.

## Workflow: Create -> Track -> Replace -> Remove
1. **Create**: Develop the new component (e.g., `NewComponent.tsx`).
2. **Track**: Add the new and old components to this graph.
3. **Replace**: Update all files using the old component to use the new one.
4. **Remove**: Delete the old component file.

## Component Map

### UI Components
- **ToggleSwitch**
  - Path: `src/components/ui/ToggleSwitch.tsx`
  - Replaced: Manual peer-checked checkbox implementations.
  - Usage: `CompanyDrawer.tsx`, `ParticipantDrawer.tsx`, `AddParticipantModal.tsx`
- **CompletionBadge**
  - Path: `src/components/ui/CompletionBadge.tsx`
  - Usage: `ParticipantDrawer.tsx`, `ParticipantsTable.tsx`
- **StatusBadge**
  - Path: `src/components/ui/StatusBadge.tsx`
  - Usage: `CompanyDrawer.tsx`, `CompanyTable.tsx`, `MOUStatusSection.tsx`
- **CourseTypeBadge**
  - Path: `src/components/ui/CourseTypeBadge.tsx`
  - Usage: `CompanyTable.tsx`

### Shared Components
- **EmptyState**
  - Path: `src/components/shared/EmptyState.tsx`
  - Usage: `CompanyTable.tsx`, `ParticipantsTable.tsx`
- **PageHeader**
  - Path: `src/components/layout/PageHeader.tsx`
  - Usage: All main pages. Now includes centralized action buttons.

### Page Modules (SOLID Refactored)

#### Companies Module
- **Hooks**:
  - `useCompanyFilters`: Filtering logic.
  - `useCompanySort`: Sorting logic.
  - `useCompanySelection`: Selection logic.
  - `useCompanyModals`: Modal orchestration.
  - `useCompanyDrawerState`: Drawer internal state.
  - `useCompanyExcel`: Excel parsing and upload.
  - `useCompanyTooltips`: Table tooltips.
  - `useParticipantPopover`: Participant preview popover.
- **Drawer Sections**:
  - `DrawerHeader`, `BasicInfoSection`, `ManagerInfoSection`, `MOUStatusSection`, `CourseParticipationSection`.

#### Participants Module
- **Hooks**:
  - `useParticipantFilters`: Filtering logic.
  - `useParticipantSelection`: Selection logic.
  - `useParticipantExcel`: Excel parsing and upload.
  - `useCourseManager`: Course management logic.
- **Modals**:
  - `AddParticipantChoiceModal`: Consolidated entry point for adding participants.
  - `AddParticipantModal`: Inline enterprise registration support.
  - `LinkCourseModal`: Synchronized with real-time database courses.
  - `BulkEmailModal`: Multi-recipient email sending via Naver SMTP.

## Completed Migrations
- [x] Unify `index.css` and move to `styles/`.
- [x] Refactor `CompanyManagementPage` and `ParticipantsPage` to SOLID architecture.
- [x] Decompose `CompanyDrawer` into modular sections.
- [x] Transition to 3-tier architecture with Express backend.
- [x] Implement Recharts analytics dashboard.
- [x] Replace inline error alerts with professional Toast system.
- [x] Consolidate participant action buttons.
- [x] Secure database with RLS hardening.
- [x] Implement Naver SMTP-based Email Sending System.
