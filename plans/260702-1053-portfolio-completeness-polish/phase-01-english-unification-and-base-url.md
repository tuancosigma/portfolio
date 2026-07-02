---
phase: 1
title: English Unification And Base URL
status: completed
priority: P1
effort: 1h
dependencies: []
---

# Phase 1: English Unification And Base URL

## Overview
Đổi toàn bộ chuỗi UI tiếng Việt còn sót sang tiếng Anh (site nhắm recruiter EN), và sửa `BASE_URL` từ domain đoán sang domain thật `https://portfolio.tinyly90891.workers.dev`.

## Requirements
- Functional: không còn chuỗi tiếng Việt nào trong UI; sitemap/robots/OG/JSON-LD trỏ đúng domain thật.
- Non-functional: không đổi layout/hành vi; build sạch.

## Related Code Files

**Modify (chuỗi VN → EN), vị trí đã grep xác nhận:**
| File | Dòng | Hiện tại | Đổi thành |
|---|---|---|---|
| `components/landing/hero-section.tsx` | 251 | `Xem dự án` | `View projects` |
| `components/landing/hero-section.tsx` | 254 | `Liên hệ` | `Get in touch` |
| `app/projects/[slug]/page.tsx` | 58 | `Về trang chủ` | `Back to home` |
| `app/incident-report/page.tsx` | 57 | `Về trang chủ` | `Back to home` |
| `components/command-palette.tsx` | 64 | `description="Điều hướng nhanh trên portfolio"` | `description="Quick navigation across the portfolio"` |
| `components/command-palette.tsx` | 65 | placeholder `Tìm section, dự án, hoặc hành động...` | `Search sections, projects, or actions...` |
| `components/command-palette.tsx` | 67 | `Không tìm thấy kết quả.` | `No results found.` |
| `components/command-palette.tsx` | 68 | heading `Điều hướng` | `Navigation` |
| `components/command-palette.tsx` | 95 | heading `Dự án` | `Projects` |
| `components/command-palette.tsx` | 110 | heading `Liên hệ` | `Contact` |

**Modify (BASE_URL — 3 file, 4 chỗ):**
- `app/sitemap.ts` — const `BASE_URL`
- `app/robots.ts` — const `BASE_URL`
- `app/layout.tsx` — `metadata.metadataBase` + `personJsonLd.url`

Giá trị mới thống nhất: `https://portfolio.tinyly90891.workers.dev`

**Optional (không bắt buộc):** comment tiếng Pháp sót từ template (`integrations-section.tsx:70,107`, `infrastructure-section.tsx:38,62`, `how-it-works-section.tsx`) — đổi sang EN nếu tiện, không ảnh hưởng runtime.

## Implementation Steps
1. Edit 10 chuỗi VN theo bảng trên.
2. Edit 4 chỗ BASE_URL/metadataBase/JSON-LD url.
3. Grep lại regex diacritics `[àáảãạ...đĐ]` trên `{app,components,lib}/**/*.{tsx,ts}` — kỳ vọng 0 kết quả (ngoài comment Pháp nếu chưa dọn).
4. `npm run build` → 0 lỗi.
5. Curl `localhost:3000/sitemap.xml` xác nhận domain mới.

## Success Criteria
- [ ] Grep diacritics VN = 0 match trong chuỗi UI
- [ ] `sitemap.xml`, `robots.txt`, OG metadata, JSON-LD đều dùng `portfolio.tinyly90891.workers.dev`
- [ ] Build sạch, các nút Hero/back-link/command palette hiển thị EN đúng

## Risk Assessment
Rủi ro thấp — thay chuỗi thuần. Chú ý: nút Hero dài hơn ("View projects" vs "Xem dự án") vẫn nằm gọn trong `MagneticButton` rounded-full tự co giãn.
