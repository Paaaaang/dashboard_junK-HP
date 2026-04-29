# Project Instructions

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
- Use `docker-compose up -d` for the full stack (frontend, backend, postgres, redis).
- Frontend is available on port `5173`.
- Backend is available on port `3001`.
