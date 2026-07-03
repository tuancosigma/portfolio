---
phase: 5
title: Perf Verify And Review
status: completed
priority: P1
effort: 1h
dependencies:
  - 1
  - 2
  - 3
  - 4
---

# Phase 5: Perf Verify And Review

## Overview
Xác minh toàn hệ motion: hiệu năng, a11y, SSR, build Cloudflare; chạy code-reviewer subagent; commit.

## Implementation Steps
1. `npx tsc --noEmit` = 0 lỗi; `npm run build` + `npm run cf:build` sạch; route vẫn static (`○`/`●`).
2. Console sạch trên localhost (không WebGL error, không hydration warning, hết warning scroll-behavior).
3. Kiểm tra bằng mắt toàn trang chủ + 4 trang con: reveal, split-text, parallax, WebGL hero, smooth scroll, anchor nav, Ctrl+K, scroll-progress.
4. `prefers-reduced-motion: reduce` (DevTools emulation): không smooth scroll, không WebGL, text hiện ngay.
5. Bundle check: first-load JS tăng trong mức chấp nhận (~120KB gz thêm).
6. Spawn `code-reviewer` subagent: acceptance = end-state không đổi, SSR text đầy đủ, cleanup effects đúng (destroy Lenis/renderer/ScrollTrigger revert), không copy code bên ngoài, không secret.
7. Commit + push (hỏi user), nhắc Retry build Cloudflare.

## Success Criteria
- [ ] tsc + build + cf:build 0 lỗi; console sạch
- [ ] Reduced-motion path đúng
- [ ] Code-reviewer DONE không blocking
- [ ] Commit push, plan 5/5 completed

## Risk Assessment
Nếu fps kém trên máy yếu → hạ DPR cap còn 1.5, giảm octave noise; nếu Lenis gây khó chịu → có thể tắt bằng cách bỏ provider (1 dòng layout).
