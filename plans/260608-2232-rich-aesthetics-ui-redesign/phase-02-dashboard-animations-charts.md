---
phase: 2
title: "Dashboard Animations & Charts"
status: pending
priority: P1
effort: "3h"
dependencies: [1]
---

# Phase 2: Dashboard Animations & Charts

## Overview

Upgrade `dashboard/page.tsx` (730 LOC) with Framer Motion stagger entrance on KPI cards, violet accent in Recharts, and animated recent activity feed. No page restructure — targeted enhancements only.

## Requirements

- Functional: KPI cards animate in staggered (0, 0.05, 0.1, 0.15s delays)
- Functional: AreaChart uses violet-500 as primary stroke/fill instead of orange
- Functional: Activity feed rows fade-in with slide from left
- Functional: Sidebar nav hover transition smoothed with Framer Motion layout
- Non-functional: No data-fetching changes; same API calls, just visual layer

## Architecture

`dashboard/page.tsx` is a large client component. Strategy:
1. Wrap top-level return in `<motion.div>` with `staggerChildren`
2. Replace individual `<div className="stat-card">` wrapping with `<MotionCard delay={n * 0.05}>`
3. Swap chart color constants from `hsl(var(--primary))` to `hsl(var(--violet))`
4. Wrap activity feed list with `motion.ul` + `AnimatePresence` for item exit animations

**Color swap table** (existing → new):
| Element | Before | After |
|---------|--------|-------|
| AreaChart stroke | `hsl(var(--primary))` | `hsl(262 83% 58%)` (violet) |
| AreaChart fill gradient | orange stop | violet-500 → violet-900 fade |
| PieChart success slice | keep emerald-500 | keep emerald-500 |
| PieChart failed slice | keep rose-500 | keep rose-500 |
| KPI trend badge (up) | emerald | emerald (unchanged) |

## Related Code Files

- **Modify:** `n8n/apps/web/src/app/dashboard/page.tsx`
- **Read for reference:** `n8n/apps/web/src/components/ui/motion-card.tsx` (Phase 1 output)

## Implementation Steps

1. **Add `"use client"` directive** — already present; verify it's the first line.

2. **Import Framer Motion** at top of `dashboard/page.tsx`:
   ```tsx
   import { motion, AnimatePresence } from "framer-motion";
   import { MotionCard } from "@/components/ui/motion-card";
   ```

3. **Wrap KPI grid** — locate the 4-card metrics section (currently `<div className="grid grid-cols-4 ...">`) and replace each card wrapper:
   ```tsx
   // Before
   <div className="stat-card ...">...</div>

   // After — apply to each of the 4 cards with delay 0, 0.05, 0.1, 0.15
   <MotionCard delay={0} className="stat-card ...">...</MotionCard>
   ```

4. **Animate section headers** — wrap the two chart section headings with a simple fade-in:
   ```tsx
   <motion.h2
     initial={{ opacity: 0, x: -8 }}
     animate={{ opacity: 1, x: 0 }}
     transition={{ duration: 0.3, delay: 0.2 }}
     className="text-sm font-semibold text-slate-300 mb-3"
   >
     Execution Volume (30d)
   </motion.h2>
   ```

5. **Swap AreaChart accent color** — find the `<AreaChart>` for 30-day trend:
   ```tsx
   // Replace stroke color on <Area> component:
   stroke="hsl(262 83% 58%)"  // was: hsl(var(--primary)) or orange hex

   // Replace gradient stops in <defs><linearGradient>:
   <stop offset="5%"   stopColor="hsl(262 83% 58%)" stopOpacity={0.25} />
   <stop offset="95%"  stopColor="hsl(262 83% 58%)" stopOpacity={0.02} />
   ```

6. **Animate activity feed** — locate `<ul>` / `<div>` rendering recent executions:
   ```tsx
   <motion.div
     initial="hidden"
     animate="visible"
     variants={{ visible: { transition: { staggerChildren: 0.06, delayChildren: 0.3 } } }}
   >
     {activities.map((item) => (
       <motion.div
         key={item.id}
         variants={{ hidden: { opacity: 0, x: -12 }, visible: { opacity: 1, x: 0 } }}
         transition={{ duration: 0.28 }}
         className="activity-row ..."
       >
         {/* existing row content */}
       </motion.div>
     ))}
   </motion.div>
   ```

7. **Add violet hover glow to primary action button** — the "Run Workflow" or "New Workflow" CTA:
   ```tsx
   className="... hover:glow-violet transition-shadow duration-300"
   ```

8. **TypeCheck & visual verify** — run `pnpm --filter web dev` and confirm no console errors.

## Success Criteria

- [ ] KPI cards stagger in on page load (visible 50ms delay between each)
- [ ] AreaChart line/fill uses violet-500 — not orange
- [ ] Activity feed items slide in from left after chart section loads
- [ ] No layout shift or flicker on initial render
- [ ] TypeScript compiles cleanly

## Risk Assessment

- Replacing chart stroke color is a string value swap — zero risk. Only risk: forgetting to update the gradient `stopColor` as well (visible mismatch). Fix: search for all occurrences of old color constant before saving.
- Large component (730 LOC) — only touch the 4 specific areas above. Do not restructure imports or component order; too much risk of merge conflicts in Phase 3.
