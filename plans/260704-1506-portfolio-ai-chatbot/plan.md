---
title: 'Portfolio AI chatbot: provider-chain key rotation on Cloudflare Workers'
description: >-
  AI recruiter-assistant chat widget for the portfolio. Server-side provider
  chain (Groq llama-3.3-70b primary with backup keys, Gemini 2.5 Flash
  fallback), keys only in Cloudflare Secrets, graceful degradation,
  brand-matched UI.
status: pending
priority: P2
branch: main
tags:
  - ai
  - chatbot
  - cloudflare-workers
  - groq
  - gemini
blockedBy: []
blocks: []
created: '2026-07-04T08:11:48.024Z'
createdBy: 'ck:plan'
source: skill
---

# Portfolio AI chatbot: provider-chain key rotation on Cloudflare Workers

## Overview

Design đã duyệt tại `plans/reports/brainstorm-260704-1506-portfolio-ai-chatbot-design-report.md` (đọc trước khi implement). Tóm tắt:

- Widget chat trên site → POST `/api/chat` (route handler chạy trong Worker qua OpenNext) → chuỗi provider: Groq `llama-3.3-70b-versatile` (key chính + backup) → Gemini `gemini-2.5-flash` (key chính + backup) → fallback message mềm.
- Key CHỈ nằm trong Cloudflare Secrets / `.dev.vars` local (đã gitignore) — repo public, tuyệt đối không commit. Sau khi deploy chạy ổn, user rotate toàn bộ key (bộ key hiện tại đã lộ trong chat).
- Grounding bằng system prompt chứa toàn bộ dữ liệu portfolio (không RAG — YAGNI). Persona: trợ lý tuyển dụng của Phạm Minh Tuấn, chỉ trả lời chủ đề portfolio.
- Chống đốt quota: cap message 500 ký tự, history ≤ 6 lượt, max_tokens 512, degrade mềm khi hết quota.

Ràng buộc: các route hiện tại giữ static; build Next + cf:build sạch; không thêm dependency mới (gọi fetch thuần, không SDK).

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Provider Chain And Chat API Route](./phase-01-provider-chain-and-chat-api-route.md) | Completed |
| 2 | [Chat Widget UI](./phase-02-chat-widget-ui.md) | Completed |
| 3 | [Secrets Deploy And Verify](./phase-03-secrets-deploy-and-verify.md) | Pending |

## Dependencies

Phase 2 phụ thuộc Phase 1 (API contract). Phase 3 cuối. Lưu ý: cụm motion system đang chưa commit — commit riêng, không trộn với chatbot.
