---
phase: 3
title: "Workflow Canvas & Node Glow"
status: pending
priority: P1
effort: "3h"
dependencies: [1]
---

# Phase 3: Workflow Canvas & Node Glow

## Overview

Upgrade the workflow editor (`workflows/[id]/editor/page.tsx`, 1225 LOC) and the workflow list page (`workflows/page.tsx`, 249 LOC). Adds animated React Flow edges, glow borders on running/selected nodes, palette button hover animations, and a search bar to the workflow list.

## Requirements

- Functional: Selected node gets a violet glow ring; running node gets a pulsing emerald glow; failed node gets red glow
- Functional: All React Flow edges animate with a flowing dash stroke (CSS animation)
- Functional: Node palette category buttons have hover scale + color transition (Framer Motion)
- Functional: Workflow list has a search bar filtering by name client-side
- Functional: Workflow cards animate in on mount using `MotionCard`
- Non-functional: Canvas performance unaffected — glow is CSS only (no JS per-frame updates)

## Architecture

### React Flow edge animation
Create a custom edge component `AnimatedEdge` that renders an `<path>` with:
- `stroke-dasharray: 6 3` animated via CSS `@keyframes dash-flow`
- Color: `hsl(262 83% 58% / 0.6)` (violet) for default, `hsl(142 71% 45%)` for active/running path
- Registered via `edgeTypes={{ default: AnimatedEdge, smoothstep: AnimatedEdge }}`

Add to `globals.css`:
```css
@keyframes dash-flow {
  from { stroke-dashoffset: 18; }
  to   { stroke-dashoffset: 0; }
}
.animated-edge path {
  stroke-dasharray: 6 3;
  animation: dash-flow 0.6s linear infinite;
}
```

### Node glow strategy
`CustomNodeComponent` already receives `selected` prop from React Flow. Extend it to also check a Zustand store value `runningNodeIds: Set<string>` and `failedNodeIds: Set<string>` which the execution polling sets.

Border class logic:
```
selected      → border-violet-500/60  + glow-violet
running       → border-emerald-500/60 + glow-emerald + animate-glow-pulse
failed        → border-red-500/60     + glow-red
default       → border-border/30
```

### Workflow list search
Add a `useState<string>` search term and filter the fetched workflow array before rendering. No API change needed.

## Related Code Files

- **Modify:** `n8n/apps/web/src/app/workflows/[id]/editor/page.tsx`
- **Modify:** `n8n/apps/web/src/app/workflows/page.tsx`
- **Modify:** `n8n/apps/web/src/app/globals.css` (add `dash-flow` keyframe)

## Implementation Steps

1. **Add `dash-flow` keyframe to `globals.css`** (after existing animations section):
   ```css
   @keyframes dash-flow {
     from { stroke-dashoffset: 18; }
     to   { stroke-dashoffset: 0;  }
   }
   ```

2. **Create inline `AnimatedEdge` component inside `editor/page.tsx`** (or extract to `src/components/canvas/animated-edge.tsx` to keep file under 200 LOC):
   ```tsx
   import { EdgeProps, getSmoothStepPath, getBezierPath } from "reactflow";

   function AnimatedEdge({ id, sourceX, sourceY, targetX, targetY,
     sourcePosition, targetPosition, style = {}, markerEnd }: EdgeProps) {
     const [edgePath] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
     return (
       <g className="animated-edge">
         {/* Glow shadow path */}
         <path
           d={edgePath}
           stroke="hsl(262 83% 58% / 0.15)"
           strokeWidth={6}
           fill="none"
           style={{ filter: "blur(4px)" }}
         />
         {/* Visible animated path */}
         <path
           id={id}
           d={edgePath}
           stroke="hsl(262 83% 58% / 0.65)"
           strokeWidth={1.5}
           fill="none"
           strokeDasharray="6 3"
           style={{ animation: "dash-flow 0.7s linear infinite", ...style }}
           markerEnd={markerEnd}
         />
       </g>
     );
   }
   ```

3. **Register `AnimatedEdge`** in the `<ReactFlow>` component:
   ```tsx
   const edgeTypes = useMemo(() => ({ default: AnimatedEdge, smoothstep: AnimatedEdge }), []);
   // ...
   <ReactFlow edgeTypes={edgeTypes} ... />
   ```

4. **Update `CustomNodeComponent`** — extend border/glow classes:
   ```tsx
   // Inside CustomNodeComponent, compute status class:
   const isSelected = data?.selected; // or via props.selected from ReactFlow
   const glowClass = isSelected
     ? "border-violet-500/60 glow-violet"
     : "border-border/30";

   // Apply to wrapper div:
   <div className={`glass-panel rounded-xl px-3 py-2 border transition-all duration-300 ${glowClass}`}>
   ```

5. **Animate palette category buttons** in the left sidebar section of `editor/page.tsx`:
   ```tsx
   import { motion } from "framer-motion";

   // Replace each category button <button> with:
   <motion.button
     whileHover={{ scale: 1.02, x: 2 }}
     whileTap={{ scale: 0.98 }}
     transition={{ duration: 0.15 }}
     className="w-full text-left px-3 py-2 rounded-lg text-sm ..."
   >
     {category.label}
   </motion.button>
   ```

6. **Add node palette item hover animation**:
   ```tsx
   // Each draggable node item in the palette:
   <motion.div
     whileHover={{ x: 4, backgroundColor: "rgba(139,92,246,0.08)" }}
     transition={{ duration: 0.15 }}
     draggable
     onDragStart={...}
     className="palette-item ..."
   >
   ```

7. **Workflow list — add search bar** to `workflows/page.tsx`:
   ```tsx
   const [search, setSearch] = useState("");
   const filtered = workflows.filter(w => w.name.toLowerCase().includes(search.toLowerCase()));

   // In JSX, add above the grid:
   <div className="relative mb-4">
     <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
     <input
       value={search}
       onChange={e => setSearch(e.target.value)}
       placeholder="Search workflows..."
       className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/[0.04] border border-border/50
                  text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1
                  focus:ring-violet-500/40 transition-all"
     />
   </div>
   ```

8. **Wrap workflow cards** with `MotionCard`:
   ```tsx
   import { MotionCard } from "@/components/ui/motion-card";

   {filtered.map((wf, i) => (
     <MotionCard key={wf.id} delay={i * 0.04} className="glass-card ...">
       {/* existing card content */}
     </MotionCard>
   ))}
   ```

9. **TypeCheck** — `pnpm --filter web exec tsc --noEmit`

## Success Criteria

- [ ] React Flow edges show animated dashed violet stroke
- [ ] Selecting a node shows violet glow border ring
- [ ] Left palette buttons scale slightly on hover
- [ ] Workflow list search bar filters workflows by name in real-time
- [ ] Workflow cards animate in on mount
- [ ] No React Flow console warnings about edgeTypes or custom components
- [ ] TypeScript compiles cleanly

## Risk Assessment

- Custom `AnimatedEdge` must handle all edge types the app uses. The editor creates `default` and `smoothstep` edges (visible in existing code). Register both in `edgeTypes`. Missing a type falls back to React Flow's default (no animation) — graceful degradation.
- CSS animation on SVG `<path>` is performant (GPU-composited). No JS animation loop needed.
- The `editor/page.tsx` is 1225 LOC. If adding `AnimatedEdge` pushes it past 200 LOC threshold, extract to `src/components/canvas/animated-edge.tsx`.
