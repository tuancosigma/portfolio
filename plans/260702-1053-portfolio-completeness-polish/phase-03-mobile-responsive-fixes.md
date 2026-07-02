---
phase: 3
title: Mobile Responsive Fixes
status: completed
priority: P2
effort: 2h
dependencies: []
---

# Phase 3: Mobile Responsive Fixes

## Overview
Sửa các chỗ layout bị ép/tràn trên màn hình nhỏ. Lỗi đã xác nhận: `developers-section.tsx` dùng `max-w-[50%]` cứng mọi breakpoint → khối mô tả + 4 card dự án bị ép nửa màn hình trên điện thoại (ảnh nền absolute bên phải chiếm chỗ còn lại nhưng mobile không cần chừa).

## Requirements
- Functional: mọi section đọc được thoải mái ở 360px–768px; không tràn ngang (`overflow-x`), không chữ ép cột hẹp.
- Non-functional: KHÔNG đổi layout desktop; chỉ thêm/điều chỉnh responsive prefix.

## Related Code Files

**Fix đã xác nhận:**
- `components/landing/developers-section.tsx` — `className="max-w-[50%] ..."` (khối Description + Features) → `max-w-full lg:max-w-[50%]`. Đồng thời cân nhắc ảnh nền absolute (`w-[55%] h-[85%]` bottom-right): trên mobile cho ẩn hoặc giảm opacity để không đè chữ (`hidden md:block` hoặc `opacity-30 md:opacity-100`).

**Audit (kiểm tra bằng dev server + resize, sửa nếu phát hiện):**
- `components/landing/hero-section.tsx` — headline `whitespace-nowrap` với `clamp(2rem,6vw,7rem)`: kiểm tra 360px xem "Blue Team mindset," có tràn không; nếu tràn → bỏ `whitespace-nowrap` ở breakpoint nhỏ (`whitespace-normal sm:whitespace-nowrap`). Stats 3 cột dưới đáy: gap-10 có thể chật → kiểm tra.
- `components/landing/testimonials-section.tsx` — blockquote `text-3xl` mobile + carousel controls chỉ hiện `lg:` (mobile không có nút prev/next, chỉ auto-rotate + progress click — chấp nhận được, xác nhận progress bars bấm được).
- `components/landing/metrics-section.tsx` — số lớn `text-4xl→6xl` + `whitespace-nowrap overflow-hidden`: kiểm tra không cắt số.
- `components/landing/pricing-section.tsx` (Certifications) — card scale-105 giữa: kiểm tra mobile stack.
- `app/projects/[slug]/page.tsx` + `app/incident-report/page.tsx` — artwork layer `w-full lg:w-[65%]` mobile full-bleed sau chữ: xác nhận gradient overlay đủ tối để chữ đọc được trên mobile.
- `components/landing/navigation.tsx` — nút ⌘K `hidden lg:inline-flex` (đúng, mobile không cần); mobile menu full-screen đã có.

## Implementation Steps
1. Fix `developers-section.tsx` max-width + ảnh nền mobile.
2. Chạy dev server, dùng curl không đủ — kiểm tra bằng mắt ở 360/414/768px (DevTools hoặc resize). Với mỗi phát hiện: sửa bằng responsive prefix nhỏ nhất có thể.
3. Grep `max-w-\[\d+%\]`, `whitespace-nowrap`, `w-\[\d+px\]` trong `components/landing/` để rà chỗ cứng còn lại.
4. Build sạch.

## Success Criteria
- [ ] 360px: không thanh cuộn ngang trên toàn trang chủ + 4 trang con
- [ ] developers-section mobile: chữ full-width, đọc thoải mái
- [ ] Desktop không đổi (so trước/sau bằng mắt)
- [ ] Build sạch

## Risk Assessment
Trung bình-thấp: sửa responsive dễ vô tình ảnh hưởng desktop — mọi thay đổi phải qua prefix (`lg:` giữ giá trị cũ, base đổi cho mobile), không sửa giá trị desktop trực tiếp.
