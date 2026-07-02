---
phase: 1
title: "Design System & Dependencies"
status: pending
priority: P1
effort: "2h"
dependencies: []
---

# Phase 1: Design System & Dependencies

## Overview

Foundation layer for all visual upgrades. Installs Framer Motion and react-syntax-highlighter, extends design tokens with violet accent + glow utilities, creates 2 shared UI components (`JsonInspector`, `MotionCard`) that phases 2–5 depend on.

## Requirements

- Functional: violet-500 accent usable via Tailwind (`text-violet-500`, `bg-violet-500/10`)
- Functional: `framer-motion` importable in any `"use client"` component
- Functional: `JsonInspector` renders JSON with syntax highlighting + copy button
- Functional: `MotionCard` wraps children with entrance + hover animation
- Non-functional: no layout regressions on existing pages after CSS changes

## Architecture

Keep orange as `--primary` (brand identity). Add violet as supplementary accent for AI nodes, chart highlights, and secondary CTAs. This avoids breaking any existing `text-primary`/`bg-primary` references throughout the app.

**New CSS utilities** added under `@layer utilities` in `globals.css`:
- `.glow-violet` / `.glow-emerald` / `.glow-red` / `.glow-primary` — box-shadow glow rings
- `.glass-deep` — deeper blur variant (24px) for overlay panels
- `.border-glow-*` — colored border variants for node status rings

**Shared components** in `src/components/ui/`:
- `json-inspector.tsx` — syntax-highlighted JSON panel with copy button
- `motion-card.tsx` — reusable Framer Motion entrance wrapper with stagger support

## Related Code Files

- **Modify:** `n8n/apps/web/package.json`
- **Modify:** `n8n/apps/web/tailwind.config.js`
- **Modify:** `n8n/apps/web/src/app/globals.css`
- **Create:** `n8n/apps/web/src/components/ui/json-inspector.tsx`
- **Create:** `n8n/apps/web/src/components/ui/motion-card.tsx`

## Implementation Steps

1. **Install dependencies** in `n8n/apps/web`:
   ```bash
   cd n8n/apps/web
   pnpm add framer-motion react-syntax-highlighter
   pnpm add -D @types/react-syntax-highlighter
   ```

2. **Update `tailwind.config.js`** — add glow animation keyframes:
   ```js
   // In theme.extend:
   keyframes: {
     "glow-pulse": {
       "0%, 100%": { opacity: "0.6" },
       "50%": { opacity: "1" },
     },
   },
   animation: {
     "glow-pulse": "glow-pulse 2s ease-in-out infinite",
   },
   ```
   > Tailwind v3 already ships a full violet palette — no need to add color tokens manually.

3. **Update `globals.css`** — add CSS variable and utility classes:

   In `:root` block, after the last `--chart-*` variable:
   ```css
   --violet: 262 83% 58%;
   --violet-dim: 262 60% 45%;
   ```

   Under `@layer utilities`:
   ```css
   .glow-violet  { box-shadow: 0 0 20px hsl(var(--violet) / 0.25), 0 0 40px hsl(var(--violet) / 0.1); }
   .glow-emerald { box-shadow: 0 0 20px hsl(var(--success) / 0.3); }
   .glow-red     { box-shadow: 0 0 20px hsl(var(--error) / 0.3); }
   .glow-primary { box-shadow: 0 0 20px hsl(var(--primary) / 0.35); }
   .glass-deep {
     background: rgba(10, 13, 20, 0.88);
     backdrop-filter: blur(24px);
     -webkit-backdrop-filter: blur(24px);
   }
   .border-glow-violet  { border-color: hsl(var(--violet) / 0.45); }
   .border-glow-emerald { border-color: hsl(var(--success) / 0.45); }
   .border-glow-red     { border-color: hsl(var(--error) / 0.45); }
   ```

4. **Create `src/components/ui/json-inspector.tsx`**:
   ```tsx
   "use client";
   import { useState } from "react";
   import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
   import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
   import { Copy, Check } from "lucide-react";

   const PANEL_STYLE = {
     background: "rgba(10,13,20,0.9)",
     borderRadius: "10px",
     fontSize: "11px",
     lineHeight: "1.65",
     padding: "14px 16px",
     border: "1px solid rgba(255,255,255,0.06)",
     margin: 0,
   };

   interface JsonInspectorProps {
     data: unknown;
     label?: string;
     maxHeight?: string;
   }

   export function JsonInspector({ data, label, maxHeight = "200px" }: JsonInspectorProps) {
     const [copied, setCopied] = useState(false);
     const text = JSON.stringify(data, null, 2);

     const copy = () => {
       navigator.clipboard.writeText(text).then(() => {
         setCopied(true);
         setTimeout(() => setCopied(false), 2000);
       });
     };

     return (
       <div className="relative">
         {label && (
           <div className="flex items-center justify-between mb-1.5">
             <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
             <button
               onClick={copy}
               className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold
                          border border-border/60 hover:border-border bg-white/[0.03] hover:bg-white/[0.06]
                          text-slate-400 hover:text-white transition-all duration-150"
             >
               {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
               {copied ? "Copied!" : "Copy"}
             </button>
           </div>
         )}
         <div style={{ maxHeight, overflowY: "auto" }} className="rounded-[10px] scrollbar-thin">
           <SyntaxHighlighter language="json" style={vscDarkPlus} customStyle={PANEL_STYLE} wrapLongLines>
             {text}
           </SyntaxHighlighter>
         </div>
       </div>
     );
   }
   ```

5. **Create `src/components/ui/motion-card.tsx`**:
   ```tsx
   "use client";
   import { motion, HTMLMotionProps } from "framer-motion";
   import { ReactNode } from "react";

   interface MotionCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
     children: ReactNode;
     delay?: number;
     hover?: boolean;
   }

   const variants = {
     hidden:  { opacity: 0, y: 12 },
     visible: { opacity: 1, y: 0  },
   };

   export function MotionCard({ children, delay = 0, hover = true, className = "", ...rest }: MotionCardProps) {
     return (
       <motion.div
         variants={variants}
         initial="hidden"
         animate="visible"
         transition={{ duration: 0.35, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
         whileHover={hover ? { scale: 1.015, transition: { duration: 0.15 } } : undefined}
         className={className}
         {...rest}
       >
         {children}
       </motion.div>
     );
   }
   ```

6. **Typecheck** — verify zero TS errors:
   ```bash
   cd n8n && pnpm --filter web exec tsc --noEmit
   ```

## Success Criteria

- [ ] `framer-motion` and `react-syntax-highlighter` installed with no peer dep warnings
- [ ] `.glow-violet`, `.glow-emerald`, `.glass-deep` classes defined in `globals.css`
- [ ] `JsonInspector` renders JSON with syntax highlighting; copy button writes to clipboard
- [ ] `MotionCard` animates in on mount and scales on hover
- [ ] TypeScript compiles cleanly — zero errors

## Risk Assessment

- `react-syntax-highlighter` bundle size ~200KB. Mitigation: ESM import path (`dist/esm/`) enables tree-shaking; component is only used inside lazy-loaded execution detail panel — no LCP impact.
- `framer-motion` v11 requires React 18 — already satisfied by the project's `react@18.3.1`.
- CSS variable `--violet` must not conflict with any existing Tailwind class that shadows it. Verified: `globals.css` uses numbered `--chart-N` tokens; no `--violet` exists yet.
