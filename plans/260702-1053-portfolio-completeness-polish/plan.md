---
title: >-
  Portfolio completeness: English unification, About section, responsive,
  performance, platform hygiene
description: >-
  Final polish pass: unify site language to English, add missing About/Education
  section, fix mobile layout squeeze, compress heavy legacy images, and clean
  platform dead weight (Vercel analytics on Cloudflare, missing 404, stale Vite
  app, guessed BASE_URL).
status: completed
priority: P2
branch: main
tags:
  - portfolio
  - polish
  - responsive
  - performance
blockedBy: []
blocks: []
created: '2026-07-02T03:58:37.435Z'
createdBy: 'ck:plan'
source: skill
---

# Portfolio completeness: English unification, About section, responsive, performance, platform hygiene

## Overview

Site portfolio SOC/Blue Team (Next.js 16 App Router, deploy Cloudflare Workers qua OpenNext, repo `tuancosigma/portfolio`, live tại **https://portfolio.tinyly90891.workers.dev**) đã đủ nội dung + hiệu ứng + favicon + artwork. Plan này là đợt hoàn thiện cuối theo 5 hạng mục user đã chốt:

1. **Ngôn ngữ 100% tiếng Anh** — hiện trộn nút VN ("Xem dự án", "Liên hệ", "Về trang chủ") + command palette VN với nội dung EN. Đồng thời sửa `BASE_URL` (đang là domain đoán `tuanpham-portfolio.tuancosigma.workers.dev`) về domain thật.
2. **Section About/Education** — data Career Objective + FPT University (2021–2025) + coursework có sẵn từ portfolio gốc nhưng chưa lên trang chủ.
3. **Mobile responsive** — `developers-section` dùng `max-w-[50%]` cứng mọi breakpoint → chữ ép hẹp trên điện thoại; audit các section khác.
4. **Nén ảnh nặng** — `whale.png` 2.3MB, `bridge.png` 1.1MB (giữ nguyên hình, chỉ nén — như đã làm shield.png 690KB→132KB).
5. **Platform hygiene** — gỡ `@vercel/analytics` (không hoạt động trên Cloudflare Workers), thêm trang 404 custom, dọn `src/` + `dist/` (app Vite cũ không liên quan) khỏi repo.

**Ràng buộc:** không thay/xoá ảnh + video đang dùng; không đổi layout/hiệu ứng section hiện có (trừ fix responsive); giữ mọi route hiện tại static; build Next + `cf:build` phải sạch sau mỗi phase.

**Verify chung:** `npm run build` + `npm run cf:build` 0 lỗi; curl các route 200; dev server localhost:3000 kiểm tra bằng mắt.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [English Unification And Base URL](./phase-01-english-unification-and-base-url.md) | Completed |
| 2 | [About Education Section](./phase-02-about-education-section.md) | Completed |
| 3 | [Mobile Responsive Fixes](./phase-03-mobile-responsive-fixes.md) | Completed |
| 4 | [Image Compression](./phase-04-image-compression.md) | Completed |
| 5 | [Platform Cleanup And 404](./phase-05-platform-cleanup-and-404.md) | Completed |

## Dependencies

Không phụ thuộc plan khác. Plan trước (`260702-1022-favicon-and-professional-images`) đã COMPLETED. Các phase độc lập nhau — có thể chạy tuần tự 1→5 hoặc gộp commit theo nhóm (1+2 nội dung, 3+4 UI/perf, 5 hygiene).
