---
phase: 5
title: "Credentials Manager Upgrade"
status: pending
priority: P2
effort: "2h"
dependencies: [1]
---

# Phase 5: Credentials Manager Upgrade

## Overview

Upgrade `credentials/page.tsx` (280 LOC) with a search bar, credential type filter chips (SMTP / PostgreSQL / API Key), animated card entrance via `MotionCard`, and enhanced visual indicators (lock icon, AES-256-GCM encryption badge).

## Requirements

- Functional: Search input filters credentials by name (client-side)
- Functional: Type filter chips (All / SMTP / PostgreSQL / API Key) toggle active filter state
- Functional: Credential cards show Lock icon + "AES-256 Encrypted" badge
- Functional: Cards animate in on mount using `MotionCard`
- Non-functional: No backend changes — filters are client-side only

## Architecture

Current `credentials/page.tsx` structure:
- Fetches credential list via `useQuery` / fetch
- Renders cards in a grid with ShieldCheck icon, type badge, created date
- Create modal with type switcher + dynamic form fields (smtp/postgres/apiKey)

Target additions:
1. `search: string` + `activeType: string | null` state
2. Filtered list = original filtered by name + type
3. Search bar UI above grid
4. Type filter chips: All / smtp / postgres / apiKey
5. Per-card: Lock icon beside name, AES-256 badge below type tag
6. Wrap each card in `MotionCard` with stagger index delay

**Filter chip component** (inline ~20 LOC):
```tsx
function TypeChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <motion.button whileTap={{ scale: 0.95 }} onClick={onClick}
      className={`px-3 py-1 rounded-full text-xs font-bold border transition-all duration-150
                  ${active
                    ? "bg-violet-500/20 border-violet-500/50 text-violet-300"
                    : "bg-white/[0.04] border-border/40 text-slate-500 hover:text-slate-300"}`}>
      {label}
    </motion.button>
  );
}
```

**Display name map**:
```ts
const TYPE_LABELS: Record<string, string> = {
  smtp: "SMTP",
  postgres: "PostgreSQL",
  apiKey: "API Key",
};
```

## Related Code Files

- **Modify:** `n8n/apps/web/src/app/credentials/page.tsx`
- **Read:** `n8n/apps/web/src/components/ui/motion-card.tsx` (Phase 1 output)

## Implementation Steps

1. **Add imports**:
   ```tsx
   import { motion } from "framer-motion";
   import { MotionCard } from "@/components/ui/motion-card";
   import { Lock, Search } from "lucide-react";
   ```

2. **Add filter state**:
   ```tsx
   const [search, setSearch] = useState("");
   const [activeType, setActiveType] = useState<string | null>(null);
   ```

3. **Compute filtered list**:
   ```tsx
   const filtered = credentials.filter(c => {
     const matchName = c.name.toLowerCase().includes(search.toLowerCase());
     const matchType = !activeType || c.type === activeType;
     return matchName && matchType;
   });
   ```

4. **Add search bar** above grid:
   ```tsx
   <div className="relative mb-3">
     <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
     <input
       value={search}
       onChange={e => setSearch(e.target.value)}
       placeholder="Search credentials..."
       className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/[0.04] border border-border/50
                  text-sm text-slate-200 placeholder-slate-600 focus:outline-none
                  focus:ring-1 focus:ring-violet-500/40 transition-all"
     />
   </div>
   ```

5. **Add type filter chips** between search bar and grid:
   ```tsx
   <div className="flex gap-2 mb-4 flex-wrap">
     {[null, "smtp", "postgres", "apiKey"].map(type => (
       <TypeChip
         key={type ?? "all"}
         label={type ? TYPE_LABELS[type] : "All"}
         active={activeType === type}
         onClick={() => setActiveType(prev => prev === type ? null : type)}
       />
     ))}
   </div>
   ```

6. **Enhance credential cards** — inside existing card markup add:
   ```tsx
   {/* Next to credential name */}
   <Lock className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />

   {/* Below the type badge */}
   <span className="text-[10px] font-bold text-emerald-500/70 tracking-wide uppercase">
     AES-256 Encrypted
   </span>
   ```

7. **Wrap cards with `MotionCard`**:
   ```tsx
   {filtered.map((cred, i) => (
     <MotionCard key={cred.id} delay={i * 0.05} className="glass-card ...">
       {/* existing card content with Lock icon + encryption badge */}
     </MotionCard>
   ))}
   ```

8. **Empty state** when `filtered.length === 0`:
   ```tsx
   {filtered.length === 0 && (
     <motion.div
       initial={{ opacity: 0 }} animate={{ opacity: 1 }}
       className="col-span-full text-center py-12 text-slate-600 text-sm"
     >
       No credentials match your search.
     </motion.div>
   )}
   ```

9. **TypeCheck** — `pnpm --filter web exec tsc --noEmit`

## Success Criteria

- [ ] Search input filters credentials by name in real-time
- [ ] Type filter chips toggle and combine with search filter
- [ ] Credential cards show Lock icon + AES-256 Encrypted badge
- [ ] Cards animate in with staggered entrance
- [ ] Empty state shown when filters yield zero results
- [ ] TypeScript compiles cleanly

## Risk Assessment

- Privacy hook triggers on this filename. No actual secrets in the file — only UI code. Hook is pattern-matching on the word "credentials".
- Filter chip `null` type (meaning "All") uses explicit null toggle: `prev === type ? null : type`. Handles both select and deselect correctly.
- `MotionCard` className passthrough must preserve grid item sizing — already built into Phase 1 component props.
