# Brainstorm report — AI chatbot cho portfolio (Phương án A, đã duyệt)

## Problem statement
User muốn thêm AI vào portfolio, dùng nhiều API key (Groq + Gemini, mỗi bên có key backup), tự rotate khi hết quota, chất lượng trả lời tốt nhất có thể trong free tier.

## Bối cảnh & ràng buộc
- Site: Next.js 16 App Router, deploy Cloudflare Workers qua OpenNext, hiện 100% route static, repo PUBLIC (`tuancosigma/portfolio`), live: portfolio.tinyly90891.workers.dev
- Ràng buộc cứng: key KHÔNG được vào repo/bundle (repo public) → chỉ nằm trong Cloudflare Secrets, gọi từ route handler server-side
- Free tier: Groq ~1k req/ngày/key; Gemini 2.5 Flash ~250 req/ngày/key (text OK, image = 0)
- Key user đã dán plaintext vào chat 2 lần → **sau khi setup phải rotate key mới**
- `GEMINI_MODEL` user đưa bị dính chuỗi rác (`gemini-2.5-flash1PLDncFcQEo4TNC`) → dùng `gemini-2.5-flash`

## Approaches đã cân nhắc
- **A (CHỌN)**: Next.js API route + provider-chain rotation server-side + system-prompt grounding + widget chat. $0, ~3 file, 1 route dynamic.
- B: Cloudflare Workers AI — zero key ngoài nhưng model yếu hơn, quota chật. Bỏ.
- C: Client gọi API trực tiếp — lộ key công khai. Loại tuyệt đối.

## Thiết kế đã duyệt (A)

### Kiến trúc
```
ChatWidget (client) → POST /api/chat → provider chain:
  Groq llama-3.3-70b-versatile: key chính → backup1 → backup2 → backup3 (trên 429/401/5xx)
  → Gemini gemini-2.5-flash: key chính → backup1 → backup2 → backup3
  → tất cả fail: trả fallback message ("AI đang nghỉ — email tinyly90891@gmail.com")
```

### Files
- `app/api/chat/route.ts` — POST handler (edge/worker runtime qua OpenNext); đọc env: `GROQ_API_KEY`, `GROQ_API_KEY_BACKUP` (csv), `GEMINI_API_KEY`, `GEMINI_API_KEY_BACKUP` (csv); stream SSE về client.
- `lib/ai/provider-chain.ts` — logic rotate: mảng {provider, key, model}, thử tuần tự, retry điều kiện (429/401/403/5xx), timeout mỗi lần thử ~10s. Stateless (Worker), không cần lưu index.
- `lib/ai/system-prompt.ts` — persona "trợ lý tuyển dụng của Phạm Minh Tuấn" + toàn bộ dữ liệu portfolio inline (skills/projects/experience/certs/contact, từ projects-data + nội dung section). Không RAG (YAGNI).
- `components/chat-widget.tsx` — nút nổi góc phải-dưới + panel đen/hồng #eca8d6 đúng brand, streaming text, lịch sử trong state (không lưu server), suggested questions ("What SOC experience does Tuan have?"...). Thêm entry "Ask AI" vào command palette.

### Chống đốt quota (endpoint public)
- Cap message ≤ 500 ký tự, history gửi lên ≤ 6 lượt, max_tokens đầu ra ~512
- Rate limit: Cloudflare WAF rule (free) theo IP; degrade mềm khi hết quota
- Model: Groq `llama-3.3-70b-versatile` chính (thông minh + nhanh), KHÔNG dùng 8b-instant (kém)

### Secrets setup (user tự làm trên Cloudflare dashboard → Worker → Settings → Variables)
`GROQ_API_KEY`, `GROQ_API_KEY_BACKUP`, `GEMINI_API_KEY`, `GEMINI_API_KEY_BACKUP`, tùy chọn `GROQ_MODEL`/`GEMINI_MODEL`. Dev local: `.dev.vars` (đã gitignore).

## Success criteria
- Chat trả lời đúng thông tin portfolio, từ chối câu hỏi ngoài phạm vi lịch sự
- Kill key chính (giả lập 429) → tự chuyển backup/Gemini không lỗi user-facing
- Key không xuất hiện trong repo, bundle, hay response
- Build Next + cf:build sạch; các route cũ vẫn static; route /api/chat hoạt động trên Workers
- Reduced quota → fallback message, widget không crash

## Risks
- Free tier cạn khi viral → degrade mềm, chấp nhận
- Prompt injection ("ignore instructions") → system prompt harden + chỉ trả lời chủ đề portfolio; không có tool/action nào phía sau nên blast radius = 0
- OpenNext streaming SSE trên Workers: hỗ trợ, nhưng cần verify thực tế khi implement

## Next steps
1. `/ck:plan` từ report này (khuyến nghị default mode, không cần --tdd — feature mới, chưa có test hiện hữu)
2. Sau khi deploy: user nhập secrets trên Cloudflare, test, rồi **rotate toàn bộ key đã lộ**

## Unresolved questions
- Không còn — design đã chốt Phương án A nguyên bản.
