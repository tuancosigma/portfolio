---
title: "Rich Aesthetics UI Redesign - n8n Clone"
description: "Upgrade n8n/apps/web to premium dark glassmorphism design with Framer Motion, JSON viewer, animated canvas, and enhanced credentials manager"
status: pending
priority: P1
branch: "feat/rich-aesthetics-ui"
tags: ["ui", "design-system", "frontend", "n8n"]
blockedBy: []
blocks: ["260608-2209-n8n-enhancement"]
created: "2026-06-08T15:38:23.555Z"
createdBy: "ck:plan"
source: skill
---

# Rich Aesthetics UI Redesign — n8n Clone

## Overview

`n8n/apps/web` already has a solid dark-mode base (`#0a0d14`, `glass-panel`, `stat-card`, Recharts, React Flow). This plan **enhances** it — not rebuilds — by layering "Rich Aesthetics" upgrades:

- **Violet/emerald accent system** adding violet-500 alongside existing orange primary
- **Framer Motion** entrance animations + hover microinteractions on all interactive elements
- **Upgraded glassmorphism** with deeper blur, glow borders, ambient radial gradients
- **JSON Inspector** with syntax highlighting + copy-to-clipboard on execution trace
- **Animated React Flow** edges with custom styling, glow on selected/running nodes
- **Credentials search/filter** with type tags, lock icons, and encryption badges
- **Workflow list** search/filter + animated card grid

**Scope:** `n8n/apps/web/src` only. No backend/worker changes. No new pages.

## Current State (Read before coding)

| File | Quality | Gap |
|------|---------|-----|
| `src/app/dashboard/page.tsx` | ★★★★☆ | No Framer Motion, orange-only accent |
| `src/app/workflows/page.tsx` | ★★★☆☆ | No search, no card animations |
| `src/app/workflows/[id]/editor/page.tsx` | ★★★★☆ | Canvas edges not animated, no node glow |
| `src/app/executions/[id]/page.tsx` | ★★★☆☆ | Raw `<pre>` JSON viewer, no copy button |
| `src/app/credentials/page.tsx` | ★★★☆☆ | No search, no type filter |
| `src/app/globals.css` | ★★★★☆ | Missing violet tokens, glow utilities |

## Phases

| Phase | Name | Status | Effort |
|-------|------|--------|--------|
| 1 | [Design System & Dependencies](./phase-01-design-system-dependencies.md) | Pending | 2h |
| 2 | [Dashboard Animations & Charts](./phase-02-dashboard-animations-charts.md) | Pending | 3h |
| 3 | [Workflow Canvas & Node Glow](./phase-03-workflow-canvas-node-glow.md) | Pending | 3h |
| 4 | [Execution Trace & JSON Viewer](./phase-04-execution-trace-json-viewer.md) | Pending | 4h |
| 5 | [Credentials Manager Upgrade](./phase-05-credentials-manager-upgrade.md) | Pending | 2h |

## Dependencies

- `framer-motion` — install in `n8n/apps/web`
- `react-syntax-highlighter` + `@types/react-syntax-highlighter` — JSON inspector (Phase 4)
- Existing: `reactflow@11`, `recharts@3`, `lucide-react`, `zustand`, Tailwind CSS

## Cross-Plan Notes

- **Blocks** `260608-2209-n8n-enhancement` Phase 3 — this plan IS the UI upgrade referenced there
- Phase 1 must complete before Phases 2–5

## Modified File Map

```
n8n/apps/web/
├── package.json                              MODIFY — add framer-motion, react-syntax-highlighter
├── tailwind.config.js                        MODIFY — violet palette, glow keyframes
├── src/app/globals.css                       MODIFY — violet tokens, glow utilities
├── src/components/
│   ├── Sidebar.tsx                           MODIFY — violet active indicator, hover animation
│   └── ui/
│       ├── json-inspector.tsx                CREATE — syntax-highlighted JSON viewer + copy btn
│       └── motion-card.tsx                   CREATE — reusable Framer Motion card wrapper
├── src/app/dashboard/page.tsx                MODIFY — staggered entrance, violet chart theme
├── src/app/workflows/page.tsx                MODIFY — search bar, animated card grid
├── src/app/workflows/[id]/editor/page.tsx    MODIFY — glow node borders, animated palette btns
├── src/app/executions/[id]/page.tsx          MODIFY — JsonInspector, animated timeline steps
└── src/app/credentials/page.tsx             MODIFY — search, type tags, animated card entrance
```
