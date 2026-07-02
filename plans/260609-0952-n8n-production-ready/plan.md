---
title: "N8N Clone Production-Ready"
description: "Fix critical scheduler/webhook bugs, add real-time execution observability, complete credential vault UX, harden node security, and add automated tests."
status: pending
priority: P1
branch: ""
tags: [bugfix, backend, frontend, testing]
blockedBy: []
blocks: []
created: "2026-06-09T02:56:55.992Z"
createdBy: "ck:plan"
source: skill
---

# N8N Clone Production-Ready

## Overview

Deep codebase analysis revealed the platform is architecturally solid. All 15 node executors, the execution engine, worker, scheduler, webhooks, and credentials are real implementations — not mocks. However, 8 concrete gaps prevent production use. This plan closes them systematically.

## Codebase Audit Summary

### ✅ Already Fully Implemented (skip re-doing)
- All 15 node executors: `http.request` (SSRF protected), `logic.if`, `code.javascript` (vm sandbox), `email.smtp` (nodemailer), `db.postgres.query` (pg), `execute.command` (child_process), `ai.agent` (OpenAI + Anthropic + Gemini + Groq with agentic tool-call loop), `ai.chunker`, `ai.embeddings` (OpenAI + Gemini batch), `db.vectorstore` (PGVector upsert + cosine search)
- Execution engine: topological sort, retry+timeout, abort signal, sub-workflow recursion, event emitters
- Worker processor: credential decryption, cancel check, ExecutionStep persistence for completed/failed nodes
- Scheduler: BullMQ register/deregister cron jobs
- Webhooks: sync (30s poll) and async modes, secret validation
- Credentials: AES-256-GCM encrypt/decrypt, plaintext never returned
- Execution tracer UI: ReactFlow, JSON inspector, timeline accordion, 2s polling

### ❌ Confirmed Gaps (this plan)
| # | Gap | Severity | Phase |
|---|-----|----------|-------|
| G1 | `workflows.service.ts#update()` does not re-register cron/webhook when ACTIVE workflow graph is saved | 🔴 Critical | 1 |
| G2 | `deregisterSchedules` matches BullMQ jobs by cron pattern only — can remove OTHER workflows' jobs | 🔴 Critical | 1 |
| G3 | `node_started` event not persisted → frontend shows all nodes PENDING until completion | 🟡 High | 2 |
| G4 | No SSE endpoint → execution tracer relies on 2s client polling | 🟡 High | 2 |
| G5 | Webhook URL never shown to user after activation | 🟡 High | 3 |
| G6 | No credential UPDATE endpoint → users must delete+recreate to rotate keys | 🟡 High | 3 |
| G7 | Frontend credentials page lacks "Encrypted & Secured" visual indicators | 🟢 Medium | 3 |
| G8 | `execute.command` node has no child_process `timeout` option | 🟢 Medium | 4 |

## Phases

| Phase | Name | Effort | Status |
|-------|------|--------|--------|
| 1 | [Critical Bug Fixes](./phase-01-critical-bug-fixes.md) | 3h | Pending |
| 2 | [Real-Time Observability](./phase-02-real-time-observability.md) | 4h | Pending |
| 3 | [Credential Vault & Webhook UX](./phase-03-credential-vault-webhook-ux.md) | 3h | Pending |
| 4 | [Node Security & Edge Cases](./phase-04-node-security-edge-cases.md) | 2h | Pending |
| 5 | [Automated Tests](./phase-05-automated-tests.md) | 4h | Pending |

## Dependencies

Phase 2 (SSE) can start in parallel with Phase 3. Phase 5 depends on all prior phases.

## Key Paths

```
n8n/apps/api/src/workflows/workflows.service.ts        ← G1 fix
n8n/apps/api/src/scheduler/scheduler.service.ts        ← G2 fix
n8n/apps/worker/src/worker.processor.ts               ← G3 fix
n8n/apps/api/src/executions/executions.controller.ts   ← G4 SSE endpoint
n8n/apps/api/src/workflows/workflows.controller.ts     ← G5 webhook URL
n8n/apps/api/src/credentials/credentials.service.ts    ← G6 update
n8n/apps/api/src/credentials/credentials.controller.ts ← G6 PATCH endpoint
n8n/apps/web/src/app/credentials/page.tsx              ← G7 UI
n8n/apps/web/src/app/workflows/[id]/editor/page.tsx    ← G5 webhook URL display
n8n/packages/node-registry/src/nodes/execute.command.ts ← G8 timeout
```
