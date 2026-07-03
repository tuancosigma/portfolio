---
title: >-
  Award-grade motion: Lenis smooth scroll, GSAP ScrollTrigger, split-text
  reveals, OGL WebGL hero
description: >-
  Port the technique stack observed on joseph-san.com (OGL WebGL + GSAP + custom
  smooth scroll) into the portfolio using our own original effects: Lenis smooth
  scroll, GSAP ScrollTrigger section animations, per-char text reveals, and an
  original OGL shader layer in the hero.
status: completed
priority: P2
branch: main
tags:
  - motion
  - webgl
  - gsap
  - lenis
blockedBy: []
blocks: []
created: '2026-07-03T04:20:27.107Z'
createdBy: 'ck:plan'
source: skill
---

# Award-grade motion: Lenis smooth scroll, GSAP ScrollTrigger, split-text reveals, OGL WebGL hero

## Overview

Recon thật từ bundle joseph-san.com (1MB JS): **OGL** (35× Renderer, 94× vertexShader, uniforms uTime/uMouse/uHover, 100× displacement), **GSAP** (ScrollTrigger, Flip, Observer, SplitText), **custom virtual scroll** (34×), không dùng page-transition lib. Ta dùng cùng stack (đều MIT/free) nhưng **tự viết toàn bộ hiệu ứng** — không copy shader/asset/code gốc.

User đã chốt: đủ 4 tầng (smooth scroll + ScrollTrigger reveals + split-text + WebGL hero) và **migrate hết IntersectionObserver reveals sang ScrollTrigger**.

Ràng buộc: giữ nguyên design/nội dung/video; SSR-safe ("use client", chỉ chạy effect sau mount); tôn trọng `prefers-reduced-motion`; build Next + cf:build sạch; route vẫn static. Bundle thêm: gsap ~70KB gz + lenis ~10KB + ogl ~40KB — chấp nhận được.

Fix kèm: bỏ `scroll-behavior: smooth` trong `app/globals.css:92` (xung đột Lenis + đang gây warning Next).

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Motion Foundation Lenis GSAP](./phase-01-motion-foundation-lenis-gsap.md) | Completed |
| 2 | [WebGL Hero OGL Shader](./phase-02-webgl-hero-ogl-shader.md) | Completed |
| 3 | [Split Text Reveals](./phase-03-split-text-reveals.md) | Completed |
| 4 | [Migrate Sections To ScrollTrigger](./phase-04-migrate-sections-to-scrolltrigger.md) | Completed |
| 5 | [Perf Verify And Review](./phase-05-perf-verify-and-review.md) | Completed |

## Dependencies

Phase 2–4 phụ thuộc Phase 1 (provider + gsap setup). Phase 5 chạy cuối.
