# Calendar Component — Isolated Zone

This component (`src/components/ui/Calendar.tsx`) originated from an external template
and has deep Tailwind utility dependencies throughout its structure.

## Rules for this component

- **DO NOT** refactor layout or structure
- **DO** use only master design tokens for colors and shadows:
  - `bg-brand-primary` / `text-brand-primary` → Emerald `#10b981`
  - `bg-cta` / `text-cta` → Green `#22C55E`
  - `bg-background` → Page BG `#f8fafc`
  - `shadow-sm / shadow-md / shadow-lg / shadow-xl` → master shadow tokens
- **DO NOT** add arbitrary color values (`bg-[#...]`, `text-blue-500`, etc.)
- **DO NOT** use default Tailwind shadow classes outside the master set (`shadow-2xl`, `shadow-inner`, etc.)

## Acceptable patterns

```jsx
// OK — uses master token
<div className="bg-brand-primary text-white" />

// OK — uses semantic token
<div className="bg-surface border-border" />

// FORBIDDEN — arbitrary color
<div className="bg-blue-500" />

// FORBIDDEN — default Tailwind shadow
<div className="shadow-2xl" />
```
