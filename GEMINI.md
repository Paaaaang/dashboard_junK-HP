# Project Instructions

## UI/UX Standards (Audit: May 2026)
To maintain a professional "Data-Dense Dashboard" aesthetic, follow these rules (detailed specs in `design-system/khp-dashboard/MASTER.md`):

### Visuals & Icons
- **No Emojis**: Always use SVG icons from Lucide or Heroicons.
- **Typography**: Use `--font-body` (Fira Sans) for general text and `--font-heading` (Fira Code) for headers and data labels.
- **Numbers**: Always use `font-variant-numeric: tabular-nums` for tables and data displays.

### Interaction & Feedback
- **Stable Hovers**: Avoid `scale` transforms that shift layout on hover. Prefer background color shifts or subtle lifts (box-shadow).
- **Cursor**: All clickable/hoverable cards and rows MUST have `cursor-pointer`.
- **Transitions**: Use smooth transitions (150-300ms) for all interactive states.

### Color Consistency
- **Theming**: Use semantic variables (`--brand-primary`, `--color-cta`) instead of hardcoded hex values, especially in chart components.
- **The 90/10 Rule**: 80-90% of the UI must be neutral (White/Gray). Limit brand colors to CTAs, active tabs, and progress indicators. Strictly separate Brand color from Semantic status colors.
- **Contrast**: Ensure all text has at least 4.5:1 contrast ratio.

### Layout Hierarchy (Anti-"Box-in-Box")
- **Whitespace > Borders**: Use spacing and proximity to group related items. Avoid excessive borders and nested gray backgrounds.
- **Typography Hierarchy**: Use size, weight, and contrast (not boxes) to define data importance.
- **Visual Flattening**: Keep visual depth shallow. Prefer flat lists/rows over deeply nested card components.

## Component Lifecycle Management (Create -> Track -> Replace -> Remove)
To prevent redundant or old code ("zombie code") from remaining in the codebase, follow this strict workflow when creating or refactoring components:

1. **Create**: Develop the new component or the updated version (e.g., `NewComponent.tsx`).
2. **Track**: Document the relationship and the plan in `frontend/COMPONENT_GRAPH.md`.
3. **Replace**: Search the entire codebase for usages of the old component and replace them with the new one. Use `grep_search` to find all occurrences.
4. **Remove**: Once verification is complete and no references remain, **delete the old component file immediately**.

## Tailwind CSS v4 Standards
- Use `@import "tailwindcss";` at the top of the main CSS entry point.
- Prefer the `@theme` block in CSS for custom configurations (colors, shadows, etc.) instead of a JavaScript config file.
- Use `@tailwindcss/postcss` for PostCSS integration.

## Docker Workflow
- This project is now a single-tier client app migrated to Supabase.
- Use `npm run dev` to start the local development server.
- Supabase services are managed via the Supabase Dashboard.
- Frontend is available on port `5173`.
