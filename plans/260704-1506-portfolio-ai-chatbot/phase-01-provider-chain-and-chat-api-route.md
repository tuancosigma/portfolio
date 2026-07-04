---
phase: 1
title: Provider Chain And Chat API Route
status: completed
priority: P1
effort: 3h
dependencies: []
---

# Phase 1: Provider Chain And Chat API Route

## Overview
Backend chatbot: route handler `/api/chat` chạy trên Worker + chuỗi provider rotate key server-side. Không SDK — fetch thuần tới 2 API OpenAI-compatible/Gemini.

## Related Code Files
- Create: `lib/ai/provider-chain.ts` — build danh sách attempt từ env: `[{provider:"groq", key, model}...]` (key chính trước, backup CSV sau; Groq hết mới sang Gemini). Hàm `callWithFallback(messages)`: loop tuần tự, mỗi attempt fetch với `AbortSignal.timeout(10_000)`; retry-able khi 429/401/403/5xx/timeout; lỗi khác (400) throw luôn. Trả `ReadableStream` SSE của attempt thành công.
  - Groq: `POST https://api.groq.com/openai/v1/chat/completions` (OpenAI format, `stream: true`)
  - Gemini: `POST https://generativelanguage.googleapis.com/v1beta/models/{model}:streamGenerateContent?alt=sse&key=...` (convert messages sang `contents` format, system prompt → `systemInstruction`)
  - Chuẩn hoá 2 stream format khác nhau về 1 dạng: emit text-delta thuần (`data: {"t":"..."}\n\n`) cho client — client không cần biết provider nào.
- Create: `lib/ai/system-prompt.ts` — export const SYSTEM_PROMPT: persona "recruiter assistant for Pham Minh Tuan's portfolio"; dữ liệu inline: objective, education FPT, skills groups, 2 internships (SWS, Cosigma), 3 projects (import từ `lib/projects-data.ts` — DRY, map thành text lúc module init), certifications, contact, links case study. Quy tắc: chỉ trả lời về Tuấn/portfolio; ngoài phạm vi → từ chối lịch sự + gợi ý email; trả lời EN hoặc VI theo ngôn ngữ người hỏi; ngắn gọn ≤150 từ.
- Create: `app/api/chat/route.ts` — `export async function POST(req)`: parse JSON `{messages}`; validate: mảng ≤ 6 phần tử, mỗi content string ≤ 500 chars, role chỉ user/assistant → 400 nếu sai; prepend system prompt; gọi `callWithFallback`; trả `new Response(stream, {headers: text/event-stream})`. Tất cả provider fail → 200 với message fallback tĩnh (widget hiển thị bình thường). Env đọc bằng `process.env` (OpenNext map Cloudflare vars).
- Create: `.dev.vars.example` — template tên biến (KHÔNG giá trị thật) để user copy thành `.dev.vars`.

## Implementation Steps
1. Viết 3 file lib/route theo spec trên.
2. Kiểm tra `.gitignore` đã có `.dev.vars` (đã thêm từ trước — verify).
3. Tạo `.dev.vars` local với key user đưa (KHÔNG commit) để test dev.
4. Test: `curl -N -X POST localhost:3000/api/chat -d '{"messages":[{"role":"user","content":"What SOC experience does Tuan have?"}]}'` → stream trả lời đúng dữ liệu; test validate (message quá dài → 400); test rotate (key sai ở vị trí chính → vẫn trả lời nhờ backup).
5. `npx tsc --noEmit` + `npm run build` — route mới là dynamic (ƒ), các route cũ vẫn ○/●.

## Success Criteria
- [ ] Stream trả lời đúng nội dung portfolio qua Groq; giả lập key hỏng → tự sang backup/Gemini
- [ ] Validate input hoạt động (400 đúng case); all-fail → fallback message, không 500
- [ ] Không key nào trong code/repo; `.dev.vars` untracked
- [ ] tsc + build sạch, route cũ vẫn static

## Risk Assessment
Gemini key user đưa dạng `AQ.*` (AI Studio) — text generation free tier hoạt động (khác image). Nếu Gemini stream format gây phức tạp: fallback Gemini có thể dùng non-stream (`generateContent`) rồi emit 1 lần — đơn giản hơn, chấp nhận được cho fallback path (KISS).
