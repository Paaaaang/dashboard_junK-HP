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
  - Usage: `CompanyDrawer.tsx`, `ParticipantDrawer.tsx`
- **CompletionBadge**
  - Path: `src/components/ui/CompletionBadge.tsx`
  - Replaced: Manual status spans in tables and drawers.
  - Usage: `ParticipantDrawer.tsx`, `CompanyDrawer.tsx`
- **StatusBadge**
  - Path: `src/components/ui/StatusBadge.tsx`
  - Replaced: Manual conditional class badges.
  - Usage: `CompanyDrawer.tsx`, `CompanyTable.tsx`, `ParticipantDrawer.tsx`
- **CourseTypeBadge** (New)
  - Path: `src/components/ui/CourseTypeBadge.tsx`
  - Replaced: `COURSE_TYPE_COLORS` constants and local `CourseTypeBadge` in drawers/tables.
  - Usage: `ParticipantDrawer.tsx`, `CompanyTable.tsx`

### Shared Components
- **EmptyState**
  - Path: `src/components/shared/EmptyState.tsx`
  - Usage: `CompanyTable.tsx`, `ParticipantsTable.tsx`

## Pending Migrations
- [x] Merge `index.css` into `styles/index.css` and unify entry point.
- [x] Remove legacy `COURSE_TYPE_COLORS` from `ParticipantDrawer.tsx`.
- [x] Investigate and resolve PostCSS `NaN` error in `styles/index.css` (Simplified config applied).
- [x] Verify all `StatusBadge` usage across the app.
- [x] Fix `CompanyDrawer.tsx` syntax errors and corrupted content.



