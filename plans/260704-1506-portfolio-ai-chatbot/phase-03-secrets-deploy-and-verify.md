---
phase: 3
title: "Secrets Deploy And Verify"
status: pending
priority: P1
effort: "1h"
dependencies: [1, 2]
---

# Phase 3: Secrets Deploy And Verify

## Overview
Đưa key thật lên Cloudflare Secrets (không phải file trong repo), deploy, verify hoạt động thật trên production, rồi rotate toàn bộ key đã lộ trong chat trước đó.

## Related Code Files
- Không tạo file code mới. Thao tác vận hành + verify.
- Đảm bảo `.gitignore` có `.dev.vars` (đã có từ setup Cloudflare trước — double-check).

## Implementation Steps
1. **User thực hiện** (Claude không có quyền truy cập Cloudflare dashboard của user): vào Cloudflare dashboard → Workers & Pages → `portfolio` → Settings → Variables and Secrets → add secret (không phải plaintext var) cho: `GROQ_API_KEY`, `GROQ_API_KEY_BACKUP`, `GEMINI_API_KEY`, `GEMINI_API_KEY_BACKUP`, `GROQ_MODEL` (`llama-3.3-70b-versatile`), `GEMINI_MODEL` (`gemini-2.5-flash`).
2. Build + deploy: `npm run cf:deploy` (hoặc qua Cloudflare Git integration retry build đã setup từ trước).
3. Verify production: mở `portfolio.tinyly90891.workers.dev`, mở chat widget, hỏi thử 2-3 câu (kể cả câu ngoài phạm vi để test guardrail).
4. Verify rotation thật: tạm thời trên Cloudflare xoá/đổi sai `GROQ_API_KEY` (giữ nguyên backup) → gửi câu hỏi → xác nhận vẫn trả lời (rotate sang backup/Gemini) → khôi phục key đúng.
5. **Bảo mật bắt buộc:** sau khi xác nhận chạy ổn, user rotate (tạo key mới, xoá key cũ) trên Groq Console + Google AI Studio cho toàn bộ key đã dán plaintext vào chat trong phiên này — cập nhật lại secrets với key mới.
6. Cập nhật `.dev.vars` local theo key mới (không commit).

## Success Criteria
- [ ] Chat hoạt động trên production, trả lời đúng, stream mượt
- [ ] Rotation thật xác nhận qua test tắt key chính
- [ ] Toàn bộ key cũ (đã lộ trong chat) đã bị rotate, secrets cập nhật key mới
- [ ] Không key nào trong git history của commit này (kiểm `git diff` trước commit)

## Risk Assessment
Bước 5 là bắt buộc về bảo mật, không phải tuỳ chọn — key đã dán plaintext 2 lần trong conversation này được xem như đã compromise dù chưa commit vào repo.
