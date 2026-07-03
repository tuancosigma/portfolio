---
phase: 4
title: Migrate Sections To ScrollTrigger
status: completed
priority: P2
effort: 3h
dependencies:
  - 1
  - 3
---

# Phase 4: Migrate Sections To ScrollTrigger

## Overview
Thay pattern IntersectionObserver + Tailwind conditional class bằng GSAP ScrollTrigger thống nhất, thêm depth: stagger card, parallax nhẹ cho ảnh nền, scrub subtle. User đã chọn migrate toàn bộ (không giữ song song 2 hệ).

## Requirements
- Functional: mọi section reveal như cũ hoặc đẹp hơn (fade+rise, stagger card con); ảnh nền lớn (developers, how-it-works tree, footer banner) thêm parallax `yPercent` scrub nhẹ.
- Non-functional: không đổi trạng thái đứng yên (end-state y hệt hiện tại); các hành vi KHÔNG phải reveal giữ nguyên (auto-rotate testimonials/security/infrastructure, canvas animations, BlurWord, AnimatedNumber IO trigger — GIỮ IO cho AnimatedNumber vì nó trigger đếm số, không phải reveal).

## Related Code Files (13 section + 2 page)
Pattern chung mỗi file: bỏ `isVisible` state + IO effect cho phần *reveal*, thay bằng `useRef` container + `useEffect` gọi helper; giữ IO ở chỗ trigger logic (metrics AnimatedNumber).
- Create: `components/motion/use-section-reveal.ts` — hook nhận ref + options, tạo `gsap.context` với ScrollTrigger `start: "top 80%"`, `once: true`, animate `[data-reveal]` children (y: 32→0, opacity, stagger 0.08); cleanup revert.
- Modify: `about-section`, `features-section`, `how-it-works-section`, `infrastructure-section`, `metrics-section` (giữ IO cho AnimatedNumber + time), `integrations-section`, `security-section`, `developers-section`, `testimonials-section`, `pricing-section`, `cta-section`, `hero-section` (entrance timeline thay isVisible), `footer-section` (nếu có reveal).
- Parallax: `developers-section` bg image, `how-it-works` tree image, `footer-section` banner — `gsap.to(img, {yPercent:-8, scrub: true})`.

## Implementation Steps
1. Viết hook `use-section-reveal.ts` + đánh dấu `data-reveal` lên các phần tử đang dùng isVisible.
2. Migrate từng section theo nhóm (3–4 file/lượt), build sau mỗi nhóm.
3. Thêm parallax 3 ảnh nền.
4. Test toàn trang: reveal đúng thứ tự, không flash-of-hidden-content (set initial state bằng CSS `opacity-0` + gsap.set để tránh FOUC), stagger đẹp.

## Success Criteria
- [ ] Không còn IO reveal pattern (grep IntersectionObserver chỉ còn ở AnimatedNumber + hero-webgl pause)
- [ ] End-state mọi section y hệt trước; auto-rotate/canvas/BlurWord không đổi
- [ ] Parallax nhẹ trên 3 ảnh nền, không giật
- [ ] Build + tsc sạch

## Risk Assessment
Cao nhất plan: đụng 13 file. Mitigate: hook chung 1 chỗ, migrate theo nhóm + build từng nhóm, end-state giữ nguyên class Tailwind tĩnh (chỉ bỏ phần conditional), commit riêng phase này để revert dễ.
