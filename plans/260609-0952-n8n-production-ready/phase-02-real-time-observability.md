---
phase: 2
title: "Real-Time Observability"
status: pending
priority: P1
effort: "4h"
dependencies: []
---

# Phase 2: Real-Time Observability

## Overview

Two gaps degrade the execution tracer UX: (1) individual nodes show PENDING until they finish because `node_started` is never persisted to DB, and (2) the tracer UI polls every 2s instead of receiving server-push updates. This phase adds an `ExecutionStep` RUNNING record on `node_started` and introduces an SSE stream endpoint for live execution updates.

## Requirements

- Functional: While a node is executing, the tracer shows it as `RUNNING` (pulsing border) in real time
- Functional: GET `/executions/:id/stream` emits SSE events for each node state transition
- Functional: Frontend switches from polling to SSE when the execution is QUEUED or RUNNING
- Non-functional: SSE stream must close cleanly when execution reaches terminal status (SUCCESS/FAILED/CANCELLED)

## Architecture

### G3: Persist `node_started` in DB

In `worker.processor.ts`, add a `node_started` listener that upserts an `ExecutionStep` row with `status: "RUNNING"`. On `node_completed` / `node_failed`, UPDATE (not create) the existing row to avoid duplicates.

```
node_started  → INSERT ExecutionStep { status: "RUNNING", startedAt: now }
node_completed → UPDATE ExecutionStep { status: "SUCCESS", output, durationMs }
node_failed    → UPDATE ExecutionStep { status: "FAILED", error, durationMs }
```

The Prisma schema needs `startedAt DateTime?` on `ExecutionStep` (optional, non-breaking migration). Use `upsert` on `(executionId, nodeId)` unique pair to avoid PK conflicts from retry loops.

### G4: SSE Streaming Endpoint

Add `GET /executions/:id/stream` to `executions.controller.ts`. This endpoint:
1. Sets headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`
2. Opens a Prisma subscription-style polling loop (100ms interval) since Prisma doesn't support push
3. Emits SSE `data:` events for each new `ExecutionStep` and the parent `Execution` status changes
4. Closes the stream when execution reaches `SUCCESS`, `FAILED`, or `CANCELLED`

**SSE event shape:**
```
event: step
data: {"nodeId":"node_1","nodeName":"HTTP Request","status":"RUNNING","durationMs":null}

event: step  
data: {"nodeId":"node_1","nodeName":"HTTP Request","status":"SUCCESS","durationMs":142}

event: execution
data: {"status":"SUCCESS","finishedAt":"2026-06-09T..."}

event: done
data: {}
```

### Frontend: SSE Consumer in Execution Tracer

Replace the `setInterval` polling in `executions/[id]/page.tsx` with an `EventSource`:

```typescript
const es = new EventSource(`${API_BASE}/executions/${executionId}/stream`, {
  withCredentials: true,
});
es.addEventListener("step", (e) => updateNodeStatus(JSON.parse(e.data)));
es.addEventListener("execution", (e) => setExecution(prev => ({...prev, ...JSON.parse(e.data)})));
es.addEventListener("done", () => es.close());
```

Keep the initial `fetchExecutionLogs()` call to hydrate historical data. SSE supplements it for live updates.

## Related Code Files

- Modify: `n8n/apps/worker/src/worker.processor.ts`
- Modify: `n8n/apps/api/src/executions/executions.controller.ts`
- Modify: `n8n/apps/api/prisma/schema.prisma` (add `startedAt DateTime?` to `ExecutionStep`)
- Modify: `n8n/apps/web/src/app/executions/[id]/page.tsx`
- Create: migration file for `startedAt` column

## Implementation Steps

### Step 1 — Prisma schema + migration

Add to `ExecutionStep` model in `schema.prisma`:
```prisma
startedAt  DateTime?
```

Run: `cd n8n/apps/api && npx prisma migrate dev --name add_execution_step_started_at`

### Step 2 — Worker: upsert on node_started

Replace the `node_completed` / `node_failed` `create` calls with `upsert` keyed on `(executionId, nodeId)`.

Add a unique constraint to schema:
```prisma
@@unique([executionId, nodeId])
```

Then in processor:
```typescript
// node_started
engine.on("node_started", async (data) => {
  const { nodeId, nodeName, nodeType, input } = data;
  await this.prisma.executionStep.upsert({
    where: { executionId_nodeId: { executionId: execution.id, nodeId } },
    create: {
      executionId: execution.id, nodeId, nodeName, nodeType,
      status: "RUNNING", input: maskSecrets(input) as any,
      startedAt: new Date(),
    },
    update: { status: "RUNNING", startedAt: new Date() },
  });
});

// node_completed  
engine.on("node_completed", async (data) => {
  const { nodeId, nodeName, nodeType, output, durationMs } = data;
  await this.prisma.executionStep.upsert({
    where: { executionId_nodeId: { executionId: execution.id, nodeId } },
    create: { executionId: execution.id, nodeId, nodeName, nodeType,
      status: "SUCCESS", input: maskSecrets(data.input) as any,
      output: maskSecrets(output) as any, durationMs },
    update: { status: "SUCCESS", output: maskSecrets(output) as any, durationMs },
  });
});

// node_failed — same upsert pattern with status: "FAILED"
```

### Step 3 — SSE endpoint in `executions.controller.ts`

```typescript
@Get(":id/stream")
@UseGuards(AuthGuard("jwt"))
async streamExecution(
  @Req() req: any,
  @Param("id") id: string,
  @Res() res: Response,
) {
  // Verify ownership
  const membership = await this.prisma.workspaceMember.findFirst({
    where: { userId: req.user.id },
  });
  const execution = await this.prisma.execution.findFirst({
    where: { id, workflow: { workspaceId: membership?.workspaceId } },
  });
  if (!execution) throw new NotFoundException("Execution not found.");

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const send = (event: string, data: any) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  let lastStepCount = 0;
  let done = false;

  const poll = setInterval(async () => {
    if (done) { clearInterval(poll); return; }

    const current = await this.prisma.execution.findUnique({
      where: { id },
      include: { steps: { orderBy: { startedAt: "asc" } } },
    });
    if (!current) { clearInterval(poll); res.end(); return; }

    // Emit new steps since last poll
    const newSteps = current.steps.slice(lastStepCount);
    for (const step of newSteps) {
      send("step", { nodeId: step.nodeId, nodeName: step.nodeName,
        nodeType: step.nodeType, status: step.status,
        durationMs: step.durationMs ?? null });
    }
    lastStepCount = current.steps.length;

    // Emit terminal execution state
    if (["SUCCESS","FAILED","CANCELLED"].includes(current.status)) {
      send("execution", { status: current.status, finishedAt: current.finishedAt, error: current.error });
      send("done", {});
      done = true;
      clearInterval(poll);
      res.end();
    }
  }, 100);

  req.on("close", () => { clearInterval(poll); done = true; });
}
```

Import `Response` from `express` and add `@Res()` to the method.

### Step 4 — Frontend SSE in `executions/[id]/page.tsx`

1. Remove the `setInterval` polling block from `useEffect`
2. Add SSE consumer after initial fetch:

```typescript
useEffect(() => {
  fetchExecutionLogs();
}, []);

useEffect(() => {
  if (!execution) return;
  if (!["QUEUED","RUNNING"].includes(execution.status)) return;

  const es = new EventSource(
    `${process.env.NEXT_PUBLIC_API_URL}/executions/${executionId}/stream`,
    { withCredentials: true }
  );

  es.addEventListener("step", (e: MessageEvent) => {
    const step = JSON.parse(e.data);
    setNodes(prev => prev.map(n => n.id === step.nodeId
      ? { ...n, data: { ...n.data, status: step.status } }
      : n
    ));
  });

  es.addEventListener("execution", (e: MessageEvent) => {
    const update = JSON.parse(e.data);
    setExecution(prev => ({ ...prev, ...update }));
  });

  es.addEventListener("done", () => es.close());
  es.onerror = () => es.close();

  return () => es.close();
}, [execution?.status]);
```

3. Update `TracerNodeComponent` to render a pulsing orange border when `data.status === "RUNNING"`:
```tsx
data.status === "RUNNING" ? "border-orange-400/60 shadow-[0_0_15px_rgba(251,146,60,0.2)] animate-pulse" :
```

## Success Criteria

- [ ] Node shows orange pulsing border while executing (RUNNING status in DB)
- [ ] Node transitions to green/red immediately when it finishes — no wait for next poll
- [ ] GET `/executions/:id/stream` returns `text/event-stream` content type
- [ ] SSE stream closes with `event: done` after terminal execution state
- [ ] Frontend EventSource closes on component unmount (no memory leaks)
- [ ] Prisma migration applied without data loss

## Risk Assessment

- **SSE in NestJS**: NestJS uses `@Res()` to bypass framework response handling; must call `res.flushHeaders()` before the interval. If using Fastify adapter instead of Express, use `reply.raw`.
- **Upsert unique constraint**: Adding `@@unique([executionId, nodeId])` could fail if existing data has duplicates. Run migration after verifying no duplicate steps in DB.
- **EventSource auth**: NestJS `AuthGuard("jwt")` checks `Authorization` header — browsers send cookies not headers for EventSource. Solution: pass JWT as query param `?token=...` for SSE endpoint only, or use cookie-based auth for that route.
