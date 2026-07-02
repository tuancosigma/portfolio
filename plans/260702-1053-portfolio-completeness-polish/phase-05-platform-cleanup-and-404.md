---
phase: 5
title: Platform Cleanup And 404
status: completed
priority: P2
effort: 1.5h
dependencies: []
---

# Phase 5: Platform Cleanup And 404

## Overview
Dọn dead weight nền tảng: (a) gỡ `@vercel/analytics` — component `<Analytics />` no-op/chết trên Cloudflare Workers, chỉ tốn bundle; (b) thêm trang 404 custom đồng bộ style (hiện dùng `/_not-found` mặc định trắng trơn của Next); (c) xoá `src/` + `dist/` — app Vite/Redux cũ không liên quan, đang gây 8 lỗi tsc rác và phình repo public.

## Requirements
- Functional: 404 page có style site (nền đen, font display, link về home + command palette hint); analytics gỡ sạch không còn import; repo không còn `src/`, `dist/`.
- Non-functional: build Next + cf:build sạch; `npx tsc --noEmit` sạch 100% (hết lỗi rác từ src/).

## Related Code Files
- Modify: `app/layout.tsx` — bỏ `import { Analytics }` + `<Analytics />`
- Modify: `package.json` — `npm uninstall @vercel/analytics`
- Create: `app/not-found.tsx` — server component tĩnh: nền đen, mã "404" lớn font-display, dòng "This page doesn't exist — the trail went cold." (giọng SOC/investigation cho hợp brand), nút "Back to home" (style giống back-link các trang con) + gợi ý nhấn Ctrl+K
- Delete: `src/` (toàn bộ), `dist/` (toàn bộ)
- Verify sau xoá: `tsconfig.json` không có include/path đặc thù trỏ src/ (mặc định Next include `**/*.ts(x)` — xoá thư mục là đủ); grep "src/" và "dist/" trong config (`.dockerignore`, `Dockerfile`, `.repomixignore`, `wrangler.jsonc`) xem có tham chiếu cần dọn.

## Implementation Steps
1. `npm uninstall @vercel/analytics`; gỡ import + JSX khỏi `app/layout.tsx`.
2. Tạo `app/not-found.tsx` (Next App Router convention — tự áp cho mọi 404, kể cả slug project sai).
3. `git rm -r src dist` (đã commit trước đây nên cần git rm, không chỉ xoá file).
4. `npx tsc --noEmit` → kỳ vọng 0 lỗi toàn repo (trước đây 8 lỗi từ src/).
5. `npm run build` + `npm run cf:build` → sạch.
6. Curl `localhost:3000/duong-dan-khong-ton-tai` → 404 + trang custom render; curl `/projects/khong-co` → cùng trang 404 (notFound() từ generateStaticParams).

## Success Criteria
- [ ] `@vercel/analytics` biến mất khỏi package.json, lockfile, layout.tsx
- [ ] Trang 404 custom hiển thị đúng style ở route bất kỳ không tồn tại + project slug sai
- [ ] `src/`, `dist/` không còn trong repo; `npx tsc --noEmit` = 0 lỗi
- [ ] Build Next + OpenNext sạch

## Risk Assessment
Thấp. Hai điểm chú ý: (1) `not-found.tsx` trong App Router phải là default export, không "use client" trừ khi cần — giữ static để route vẫn `○`; (2) xác nhận `dist/` không được serve/tham chiếu bởi wrangler config (đã biết OpenNext chỉ dùng `.open-next/` — grep xác nhận lại cho chắc).
