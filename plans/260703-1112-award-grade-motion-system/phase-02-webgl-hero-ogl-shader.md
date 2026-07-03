---
phase: 2
title: WebGL Hero OGL Shader
status: completed
priority: P2
effort: 3h
dependencies:
  - 1
---

# Phase 2: WebGL Hero OGL Shader

## Overview
Lớp WebGL nguyên bản (shader tự viết từ đầu) phủ lên Hero: fullscreen quad OGL với fbm noise + mouse-follow glow màu brand `#eca8d6`, blend mềm lên video nền hiện có. Không sao chép shader của site tham khảo — chỉ dùng cùng thư viện OGL và các kỹ thuật ngành phổ biến (value noise/fbm là public domain kiến thức).

## Requirements
- Functional: hiệu ứng khói/sương phát sáng chuyển động chậm, hút nhẹ về phía con trỏ (lerp), độ sáng tăng quanh chuột.
- Non-functional: 60fps desktop; DPR cap 2; pause khi tab ẩn (`document.visibilitychange`) và khi hero ra khỏi viewport (IntersectionObserver); fallback im lặng nếu WebGL fail; `prefers-reduced-motion` → không mount; SSR-safe.

## Related Code Files
- Create: `components/motion/hero-webgl-layer.tsx` — "use client"; OGL `Renderer` + `Program` (triangle fullscreen), uniforms `uTime`, `uMouse` (lerp 0.05), `uResolution`, `uIntensity`; fragment shader tự viết: 3-octave fbm value noise → mist, `smoothstep` radial quanh uMouse → glow hồng; `transparent: true`, additive-ish blend qua alpha thấp.
- Modify: `components/landing/hero-section.tsx` — chèn `<HeroWebglLayer />` giữa video và gradient overlays (z-index giữ chữ đọc rõ).

## Implementation Steps
1. Viết shader GLSL inline (vertex passthrough + fragment fbm/glow) — chú thích rõ từng khối.
2. Component OGL: mount canvas absolute inset-0, rAF qua gsap.ticker (đồng bộ hệ motion), resize observer.
3. Wire vào hero, tinh chỉnh opacity/màu để video vẫn là nền chính.
4. Test console không lỗi WebGL, kiểm tra bằng mắt, đo fps.

## Success Criteria
- [ ] Hiệu ứng chạy mượt, phản ứng chuột, đúng brand color
- [ ] Không lỗi console; pause khi tab ẩn/ra khỏi viewport; reduced-motion không mount
- [ ] Chữ hero + CTA vẫn đọc rõ; video nền không bị che quá tay
- [ ] Build + tsc sạch

## Risk Assessment
GPU yếu → nặng: mitigate bằng DPR cap, 1 quad + shader rẻ (không ray-march), pause ngoài viewport. Xung đột ASCII scene cũ: không — hero hiện chỉ có video + grid.
