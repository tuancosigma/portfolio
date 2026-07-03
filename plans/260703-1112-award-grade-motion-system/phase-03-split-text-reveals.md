---
phase: 3
title: Split Text Reveals
status: completed
priority: P2
effort: 2h
dependencies:
  - 1
---

# Phase 3: Split Text Reveals

## Overview
Component reveal chữ tách dòng/từ tự viết (không cần SplitText plugin): heading lớn xuất hiện theo kiểu từng mảnh trượt lên từ dưới mask, stagger nhẹ — kỹ thuật chuẩn ngành cho heading display lớn.

## Requirements
- Functional: `<SplitReveal as="h2" mode="words|lines">` bọc text; khi vào viewport, các mảnh translateY(110%)→0 với stagger + ease expo; chạy 1 lần.
- Non-functional: không hydration mismatch (split ở client sau mount, SSR render text nguyên vẹn — SEO giữ nguyên); reduced-motion → hiện luôn; không đổi typography hiện có.

## Related Code Files
- Create: `components/motion/split-reveal.tsx` — "use client"; nhận children string; sau mount tách theo từ, bọc mỗi từ trong `<span class="inline-block overflow-hidden"><span class="inline-block will-change-transform">`; gsap.from với ScrollTrigger `start: "top 85%"`, `once: true`.
- Modify (áp cho heading chính, giữ markup còn lại): `about-section.tsx` ("Career objective."), `features-section.tsx` ("Security skillset."), `infrastructure-section.tsx`, `metrics-section.tsx`, `pricing-section.tsx`, `developers-section.tsx` — thay khối text heading tĩnh bằng SplitReveal, GIỮ nguyên className.

## Implementation Steps
1. Viết `split-reveal.tsx` (đo kỹ: heading có `<br/>` + span màu — hỗ trợ children dạng mảng segment {text, className}).
2. Áp vào 5–6 heading section lớn; heading giữ visual y hệt khi đứng yên.
3. Test SSR: view-source vẫn thấy text đầy đủ; không mismatch console.

## Success Criteria
- [ ] Heading lớn reveal theo từ khi cuộn tới, chạy 1 lần, mượt
- [ ] View-source vẫn có text (SEO), không hydration warning
- [ ] Reduced-motion: text hiện ngay
- [ ] Build + tsc sạch

## Risk Assessment
Heading hiện dùng conditional Tailwind opacity theo isVisible — khi chuyển sang SplitReveal phải gỡ transition cũ trên phần tử đó để không double-animate.
