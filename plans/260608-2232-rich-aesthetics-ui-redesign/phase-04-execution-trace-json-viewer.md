---
phase: 4
title: "Execution Trace & JSON Viewer"
status: pending
priority: P1
effort: "4h"
dependencies: [1]
---

# Phase 4: Execution Trace & JSON Viewer

## Overview

Upgrade `executions/[id]/page.tsx` (390 LOC). Replace the raw `<pre>` JSON blocks with `JsonInspector` (Phase 1 component), add Framer Motion stagger to the timeline steps list, and improve the step status row visual design with glow borders matching node status colors.

## Requirements

- Functional: Each step's input + output rendered via `JsonInspector` with copy button
- Functional: Timeline steps animate in sequentially (staggerChildren: 0.07s)
- Functional: SUCCESS step rows have emerald left border; FAILED steps have red left border
- Functional: Step row expands/collapses input+output panels on click (accordion)
- Non-functional: No API changes — same data already returned by `/api/executions/:id/steps`

## Architecture

Current state of `executions/[id]/page.tsx`:
- React Flow canvas on left showing tracer nodes with glow borders (emerald/red — already implemented)
- Right sidebar with a list of `ExecutionStep` objects rendered as `<div>` rows
- Each row has `<pre className="text-xs...">{JSON.stringify(step.input)}</pre>` — raw, no copy

Target state:
- Right sidebar timeline wrapped in `motion.div` with `staggerChildren`
- Each step row wrapped in `motion.div` with slide-in variant
- Click to expand: manage `expandedStepId: string | null` state
- When expanded: render `<JsonInspector data={step.input} label="Input" />` + `<JsonInspector data={step.output ?? step.error} label="Output" />`
- Status border: `border-l-2 border-l-emerald-500` for SUCCESS, `border-l-2 border-l-red-500` for FAILED

**Component structure** (stays in single file — under 200 LOC after refactor due to `<pre>` removal):
```
executions/[id]/page.tsx
  └─ ExecutionDetailPage (client)
       ├─ Left: React Flow tracer canvas (unchanged)
       └─ Right: StepTimeline
            └─ StepRow[] (motion.div, expandable)
                 ├─ StepHeader (icon, name, duration, status badge)
                 └─ StepDetail (JsonInspector ×2, shown when expanded)
```

## Related Code Files

- **Modify:** `n8n/apps/web/src/app/executions/[id]/page.tsx`
- **Read:** `n8n/apps/web/src/components/ui/json-inspector.tsx` (Phase 1 output)

## Implementation Steps

1. **Add imports** at top of `executions/[id]/page.tsx`:
   ```tsx
   import { motion, AnimatePresence } from "framer-motion";
   import { JsonInspector } from "@/components/ui/json-inspector";
   import { ChevronDown } from "lucide-react";
   ```

2. **Add expanded state**:
   ```tsx
   const [expandedStepId, setExpandedStepId] = useState<string | null>(null);
   ```

3. **Wrap the steps list** with a stagger parent:
   ```tsx
   <motion.div
     initial="hidden"
     animate="visible"
     variants={{
       visible: { transition: { staggerChildren: 0.07 } },
     }}
     className="space-y-1.5"
   >
     {steps.map((step) => (
       <StepRow key={step.id} step={step} ... />
     ))}
   </motion.div>
   ```

4. **Replace each step `<div>` row** with an animated, expandable version:
   ```tsx
   const stepVariants = {
     hidden:  { opacity: 0, x: 10 },
     visible: { opacity: 1, x: 0  },
   };

   // Inline or extract as named component:
   function StepRow({ step, expanded, onToggle }: StepRowProps) {
     const isSuccess = step.status === "SUCCESS";
     const borderColor = isSuccess ? "border-l-emerald-500" : "border-l-red-500";

     return (
       <motion.div
         variants={stepVariants}
         transition={{ duration: 0.25 }}
         className={`glass-panel rounded-xl border border-border/30 border-l-2 ${borderColor}
                     cursor-pointer overflow-hidden`}
         onClick={() => onToggle(step.id)}
       >
         {/* Header row */}
         <div className="flex items-center gap-3 px-3 py-2.5">
           <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isSuccess ? "bg-emerald-500" : "bg-red-500"}`} />
           <span className="text-sm font-medium text-slate-200 flex-1 truncate">{step.nodeName}</span>
           <span className="text-[11px] text-slate-500">{step.durationMs}ms</span>
           <motion.div
             animate={{ rotate: expanded ? 180 : 0 }}
             transition={{ duration: 0.2 }}
           >
             <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
           </motion.div>
         </div>

         {/* Expandable detail */}
         <AnimatePresence>
           {expanded && (
             <motion.div
               initial={{ height: 0, opacity: 0 }}
               animate={{ height: "auto", opacity: 1 }}
               exit={{ height: 0, opacity: 0 }}
               transition={{ duration: 0.25 }}
               className="overflow-hidden"
             >
               <div className="px-3 pb-3 space-y-2 border-t border-border/20 pt-2">
                 <JsonInspector data={step.input}           label="Input"  maxHeight="160px" />
                 <JsonInspector data={step.output ?? step.error ?? {}} label="Output" maxHeight="160px" />
               </div>
             </motion.div>
           )}
         </AnimatePresence>
       </motion.div>
     );
   }
   ```

5. **Wire toggle handler**:
   ```tsx
   const handleToggle = (id: string) => {
     setExpandedStepId(prev => prev === id ? null : id);
   };
   // Pass to each StepRow:
   expanded={expandedStepId === step.id}
   onToggle={handleToggle}
   ```

6. **Remove old `<pre>` blocks** — delete any existing `<pre className="text-xs ...">` JSON rendering from the step rows.

7. **Execution list page** (`executions/page.tsx`) — minor: add a `MotionCard` wrapper around each row in the table for entrance animation. Low priority, include if time allows.

8. **TypeCheck** — `pnpm --filter web exec tsc --noEmit`

## Success Criteria

- [ ] Each step row shows expandable input/output with `JsonInspector`
- [ ] Copy button in `JsonInspector` works for both input and output panels
- [ ] Steps animate in sequentially with stagger on page load
- [ ] Expanded step smoothly expands/collapses with height animation
- [ ] SUCCESS rows have emerald left border, FAILED rows have red left border
- [ ] No raw `<pre>` JSON blocks remain on the page
- [ ] TypeScript compiles cleanly

## Risk Assessment

- `AnimatePresence` height animation requires `height: "auto"` target. This works with Framer Motion's layout system. If content overflows unexpectedly, add `overflow: hidden` to the `motion.div`.
- Steps list may have 0 items if execution is in RUNNING state. Guard: `steps?.length > 0 ? ... : <EmptyState>` (already present in existing code — verify it still renders).
- `step.output` can be `null` for FAILED steps — use `step.output ?? step.error ?? {}` as shown above.
