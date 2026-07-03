---
phase: 1
title: Motion Foundation Lenis GSAP
status: completed
priority: P1
effort: 2h
dependencies: []
---

# Phase 1: Motion Foundation Lenis GSAP

## Overview
Cài `gsap` + `lenis` + `ogl`; dựng provider smooth scroll toàn site; nối Lenis ↔ ScrollTrigger; gỡ `scroll-behavior: smooth` khỏi CSS (xung đột Lenis, đang gây warning Next).

## Related Code Files
- Create: `components/motion/smooth-scroll-provider.tsx` — "use client"; khởi tạo Lenis trong useEffect, drive qua `gsap.ticker`, `lenis.on("scroll", ScrollTrigger.update)`, cleanup destroy; tôn trọng `prefers-reduced-motion` (không khởi tạo nếu reduce).
- Create: `lib/gsap.ts` — đăng ký plugin 1 lần (`gsap.registerPlugin(ScrollTrigger)`) + export; tránh đăng ký lặp khi HMR.
- Modify: `app/layout.tsx` — bọc `{children}` trong `<SmoothScrollProvider>`.
- Modify: `app/globals.css:92` — xoá `scroll-behavior: smooth` (Lenis lo anchor scrolling; fix luôn warning `data-scroll-behavior` còn treo).
- Kiểm tra: anchor links (`scrollIntoView` trong command palette, `href="#..."` trong nav) — Lenis wrap window scroll nên thường vẫn chạy; chỉ sửa nếu test thấy hỏng.

## Implementation Steps
1. `npm install gsap lenis ogl`
2. Tạo `lib/gsap.ts`, `components/motion/smooth-scroll-provider.tsx`.
3. Mount provider trong layout; xoá CSS smooth.
4. Test: cuộn mượt; anchor #about/#contact từ nav + Ctrl+K scroll đúng; scroll-progress bar vẫn chạy (window scroll thật vẫn diễn ra).

## Success Criteria
- [ ] Cuộn có quán tính mượt desktop; mobile giữ native
- [ ] Anchor navigation + scroll-progress + navigation isScrolled hoạt động
- [ ] Warning `scroll-behavior` biến mất
- [ ] Build + tsc sạch

## Risk Assessment
Lenis đổi cảm giác cuộn toàn site — revert được bằng 1 commit. IO reveals hiện có vẫn chạy vì window scroll thật vẫn xảy ra.
