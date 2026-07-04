<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Ahnara Mama Design System Guidelines

Apply these styling and UI conventions to keep all public and dashboard views visually consistent.

## 1. Color Palette Swatches
- **Canvas Base Background**: `#E8EFF4` (soft slate-blue canvas)
- **Primary Cards Background**: `#FFFFFF` (clean white surfaces)
- **Green-Yellow Accent (Appointments & Widgets)**:
  - Background Tint: `#E8F3CE` (solid) or `#E8F3CE/45` (low opacity)
  - Card Borders: `#CDE0A4`
  - Internal Dividers: `#C7DB9C`
  - Dark Green Text: `#608216`
  - Active Green Indicators: `#8BB436`
- **Branding Accents**:
  - Core Brand Blue: `#0089C1`
  - Sky Blue Accent: `#009EDA`
  - Coral / Orange Accent: `#FF904C`
- **Core Typography Text**: `#0D090C` (slate black)

## 2. Layout & Spacing Conventions
- **Grid Gaps**: Tight, premium grid spacing set to `gap-3` with content paddings at `p-4` or `p-6`.
- **Top Headers**: Keep clean, transparent (no background/borders) letting the navigation bar blend into the body canvas.
- **Sidebar Alignment**: Use a desktop-only spacer (`hidden lg:block h-[68px]`) to push sidebar widgets down, aligning them with the desktop filters row of the main workspace.

## 3. Component Details
- **Navigation Toggle Bar**: 
  - Shared capsule background: `bg-[#DDEEF3] p-1 rounded-2xl border border-slate-300/30`.
  - Sliding active state: Use Framer Motion `layoutId="activeTabBackground"` on an absolute container inside the active button for smooth spring physics transitions.
  - Active icons: Render with `fill="currentColor"` variant.
  - Icon sizing: Fixed to `w-5 h-5`.
- **Two-Tone Product Cards**:
  - Split layout with top half solid green (`bg-[#E8F3CE]`) and bottom half description in base background blue (`bg-[#E8EFF4]`) separated by a subtle border (`border-[#C7DB9C]/40`).

## 4. Page Entrance Animations
- Always apply staggered upward entrance transitions on loading views:
  - Wrapper animations: `initial={{ opacity: 0, y: 25 }}` to `animate={{ opacity: 1, y: 0 }}`.
  - Staggered delays: Increment delays (e.g. `0.1s`, `0.2s`, `0.3s`, etc.) to guide the user's eye from top-left greeting row, to top widgets, to grid cards, and finally sidebar details.

