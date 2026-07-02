---
phase: 2
title: About Education Section
status: completed
priority: P2
effort: 2h
dependencies: []
---

# Phase 2: About Education Section

## Overview
Thêm section About/Education vào trang chủ — mảnh nội dung duy nhất từ portfolio gốc chưa lên trang: Career Objective + FPT University — Information Assurance (2021–2025) + coursework.

## Requirements
- Functional: section mới hiển thị Career Objective, Education (trường/ngành/năm), 7 môn học chuyên ngành; có anchor `#about`; vào nav + command palette.
- Non-functional: khớp design language hiện có (IntersectionObserver fade-in, eyebrow label + số section, font-display heading lớn, grid 12 cột, accent `#eca8d6`); không đè hiệu ứng section khác.

## Architecture
- Component mới `components/landing/about-section.tsx` ("use client"), pattern giống `developers-section.tsx`: `useRef` + IntersectionObserver → `isVisible` → Tailwind transition.
- Layout đề xuất: 2 cột — trái: eyebrow "About" + heading "Career objective." + đoạn objective; phải: card Education (FPT University, Information Assurance, 2021–2025) + grid chip 7 môn học (Network Security, System Hardening, OS Security, Web Security, Digital Forensics, Database Security, Vulnerability Assessment).
- Vị trí trong `app/page.tsx`: **sau `<HeroSection />`, trước `<FeaturesSection />`** — người xem biết "ai/mục tiêu gì" trước khi xem skills.

## Related Code Files
- Create: `components/landing/about-section.tsx`
- Modify: `app/page.tsx` (import + mount)
- Modify: `components/landing/navigation.tsx` (thêm `{ name: "About", href: "#about" }` đầu navLinks — cân nhắc giữ 5-6 link cho gọn; nếu chật, thay link "Skills" bằng "About" vì Skills đã reachable qua scroll)
- Modify: `components/command-palette.tsx` (thêm item About vào nhóm Navigation)

## Content (từ portfolio gốc — dùng nguyên văn)
- Objective: "SOC/Blue Team candidate with hands-on experience in SIEM monitoring, alert triage, firewall/WAF configuration, and log-driven investigation. I am seeking a SOC Tier 1 role where I can reduce alert noise, document evidence clearly, and support incident response workflows."
- Education: "FPT University — Information Assurance (2021–2025)"
- Coursework: Network Security, System Hardening, Operating System Security, Web Security, Digital Forensics, Database Security, Vulnerability Assessment

## Implementation Steps
1. Tạo `about-section.tsx` theo pattern IntersectionObserver + layout 2 cột trên.
2. Mount vào `page.tsx` sau Hero; `id="about"`.
3. Thêm nav link + command palette item.
4. Build + xem localhost:3000 — kiểm tra fade-in, anchor scroll, mobile stack 1 cột.

## Success Criteria
- [ ] Section About hiển thị đúng nội dung, đúng style site
- [ ] `#about` anchor hoạt động từ nav + Ctrl+K
- [ ] Mobile: 2 cột stack dọc, không tràn ngang
- [ ] Build sạch

## Risk Assessment
Rủi ro thấp. Chú ý nhịp sáng/tối section: Hero (đen) → About nên nền sáng (background mặc định) để giữ nhịp luân phiên trước Features (cũng sáng) — chấp nhận 2 section sáng liền kề, hoặc cho About nền `bg-foreground` đen nếu nhìn đẹp hơn khi test bằng mắt.
