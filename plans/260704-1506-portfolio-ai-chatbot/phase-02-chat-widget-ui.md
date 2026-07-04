---
phase: 2
title: Chat Widget UI
status: completed
priority: P2
effort: 2.5h
dependencies:
  - 1
---

# Phase 2: Chat Widget UI

## Overview
Widget chat nổi trên toàn site, brand đen/hồng `#eca8d6` khớp thiết kế hiện có, gọi `/api/chat`, stream chữ theo thời gian thực. Tích hợp vào command palette.

## Related Code Files
- Create: `components/chat-widget.tsx` — "use client". Nút tròn nổi góc phải-dưới (`fixed bottom-6 right-6 z-50`, icon MessageCircle từ lucide-react, style khớp `MagneticButton`/nav CTA). Click → mở panel (dùng `components/ui/sheet.tsx` hoặc custom fixed div — ưu tiên tái dùng shadcn Sheet có sẵn, side="right" hoặc bottom trên mobile).
  - State: `messages: {role, content}[]`, `input`, `isStreaming`.
  - Submit: POST `/api/chat` với `{messages: [...history, newUserMsg]}`; đọc `ReadableStream` qua `getReader()`, append từng chunk vào message assistant đang stream (giống hiệu ứng typing).
  - Suggested prompts ban đầu (3 chip): "What's Tuan's SOC experience?", "Tell me about the WAF project", "How can I contact him?".
  - Empty state, loading dots khi chờ token đầu, disable input khi `isStreaming`.
  - Giới hạn client-side: input maxLength 500, disable submit nếu rỗng/đang stream.
  - Style: nền `bg-black`/`text-white` panel, input border `border-foreground/20`, accent `#eca8d6` cho bubble user + nút gửi — nhất quán site.
- Modify: `app/layout.tsx` — mount `<ChatWidget />` cạnh `<CommandPalette />`.
- Modify: `components/command-palette.tsx` — thêm item "Ask AI" (icon MessageCircle) trong nhóm Contact, dispatch custom event `open-chat-widget` (pattern giống `open-command-palette` đã có) để mở panel từ palette.

## Implementation Steps
1. Kiểm tra `components/ui/sheet.tsx` đã có (từ shadcn scaffold) — dùng lại, không viết panel từ đầu.
2. Viết ChatWidget với luồng stream ở trên.
3. Mount layout + wire command palette.
4. Test tay trên dev server: gửi câu hỏi, thấy chữ chạy dần; thử câu ngoài phạm vi (vd "viết code Python cho tôi") → AI từ chối đúng theo system prompt; mobile viewport panel không tràn.

## Success Criteria
- [ ] Widget mở/đóng mượt, gọi đúng API, stream hiển thị real-time
- [ ] Suggested prompts hoạt động, disable đúng lúc streaming
- [ ] "Ask AI" trong Ctrl+K mở được widget
- [ ] Responsive mobile không vỡ layout
- [ ] tsc + build sạch

## Risk Assessment
Thấp — thuần frontend, không đụng section hiện có. Chú ý z-index không đè lên scroll-progress bar (z-60) và command palette dialog.
