# SOLID Refactoring Plan - Companies Directory

## 1. Analysis Findings

### Single Responsibility Principle (SRP) Violations
- **CompanyManagementPage.tsx**: Acts as a "God Component". It handles:
  - Global state management (companies, participants).
  - Filtering, sorting, and pagination logic.
  - CRUD operations and normalization for companies.
  - Complex state and logic for 5+ different modals.
  - Excel file parsing and column mapping.
  - Email sending preparation.
  - Course Group and Detail management.
  - UI-only states like tooltips and popovers.

### Interface Segregation Principle (ISP) Violations
- **CompanyDrawer.tsx**: Receives ~30 props, many of which are passed down through multiple levels or are unrelated.
- **CompanyTable.tsx**: Receives ~20 props, including many handlers that could be abstracted.
- **CourseManagerModal.tsx**: Receives ~25 props.

### Dependency Inversion Principle (DIP) Violations
- High-level UI components are tightly coupled to low-level implementation details like Excel parsing (`xlsx` library) and complex data transformations.

### Open/Closed Principle (OCP) Violations
- Adding new features (like a new modal or a new course type) requires modifying the core `CompanyManagementPage` logic and state.

---

## 2. Refactoring Strategy

### Phase 1: Logic Extraction (Hooks)
1. **`useCompanyModals.ts`**: Extract modal visibility and data management (Upload, Email, Course Manager, Add Course).
2. **`useCompanyExcel.ts`**: Extract Excel parsing, mapping, and preview logic.
3. **`useCourseGroups.ts`**: Extract logic for managing `courseGroups` and their details.
4. **`useCompanySelection.ts`**: Extract selection logic (multi-select, shift-select, select all).
5. **`useCompanyDrawer.ts`**: Extract logic for drawer state (expanded groups, participant management).

### Phase 2: Component Decomposition
1. **Modal Containers**: Wrap each modal in a container that handles its specific logic, reducing props passed from the main page.
2. **Sub-components for Drawer**: Split `CompanyDrawer` into smaller components (e.g., `DrawerHeader`, `BasicInfoSection`, `CourseParticipationSection`).
3. **Table Components**: Split `CompanyTable` into `TableHeader` and `TableRow`.

### Phase 3: Service/Utility Extraction
1. **`companyService.ts`**: Move business logic like `normalizeCompanyParticipations`, `createDefaultDetail`, and `calculateDurationDays` here.
2. **`excelService.ts`**: Move raw Excel parsing logic here.

---

## 3. Implementation Steps

1. Create `frontend/src/pages/companies/hooks/useCompanyModals.ts`.
2. Create `frontend/src/pages/companies/hooks/useCourseGroups.ts`.
3. Create `frontend/src/pages/companies/hooks/useCompanySelection.ts`.
4. Create `frontend/src/pages/companies/utils/companyUtils.ts` (moving logic from Page).
5. Refactor `CompanyManagementPage.tsx` to use these hooks.
6. Refactor `CompanyDrawer.tsx` and `CompanyTable.tsx` to simplify props.
7. Verify with `npx tsc --noEmit`.
