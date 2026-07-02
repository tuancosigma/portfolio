---
phase: 5
title: "Automated Tests"
status: pending
priority: P2
effort: "4h"
dependencies: [1, 2, 3, 4]
---

# Phase 5: Automated Tests

## Overview

Zero tests currently exist. This phase adds targeted unit tests for the three highest-risk paths: (1) the scheduler cron scoping fix, (2) the workflow update auto-reload, and (3) the execution engine's node propagation and branching logic. Integration tests cover the SSE stream and credential update endpoint.

## Requirements

- Functional: Jest test suites runnable via `pnpm test` in each affected package
- Non-functional: Tests must not require live Redis, Postgres, or external APIs — use mocks/stubs
- Coverage target: ≥80% on modified files

## Architecture

### Test Stack

- **API**: NestJS built-in `@nestjs/testing` + Jest + `jest-mock-extended` for Prisma
- **Worker**: Jest with manual mocks for `bullmq`, `ioredis`, `PrismaService`
- **workflow-core**: Jest — no external dependencies, pure unit tests
- **node-registry**: Jest — mock `fetch`, `nodemailer`, `pg.Client`

### Test Organization

```
n8n/apps/api/src/
  scheduler/scheduler.service.spec.ts      ← cron scoping (G2)
  workflows/workflows.service.spec.ts      ← auto-reload on update (G1)
  credentials/credentials.service.spec.ts  ← update endpoint (G6)
  executions/executions.controller.spec.ts ← SSE stream basic shape

n8n/apps/worker/src/
  worker.processor.spec.ts                 ← node_started upsert (G3)

n8n/packages/workflow-core/src/
  execution-engine.spec.ts                 ← already exists (index.spec.ts), extend it

n8n/packages/node-registry/src/
  nodes/execute.command.spec.ts            ← timeout behaviour (G8)
  nodes/logic.if.spec.ts                   ← branch routing
  nodes/http.request.spec.ts               ← SSRF block
```

## Related Code Files

- Create: `n8n/apps/api/src/scheduler/scheduler.service.spec.ts`
- Create: `n8n/apps/api/src/workflows/workflows.service.spec.ts`
- Create: `n8n/apps/api/src/credentials/credentials.service.spec.ts`
- Modify: `n8n/packages/workflow-core/src/index.spec.ts` (extend)
- Create: `n8n/packages/node-registry/src/nodes/execute.command.spec.ts`
- Create: `n8n/packages/node-registry/src/nodes/logic.if.spec.ts`
- Create: `n8n/packages/node-registry/src/nodes/http.request.spec.ts`

## Implementation Steps

### Step 1 — `scheduler.service.spec.ts`

Test G2: deregister only removes jobs belonging to the target workflowId.

```typescript
describe("SchedulerService.deregisterSchedules", () => {
  it("should only remove repeatable jobs whose name starts with cron:<workflowId>:", async () => {
    const mockRepeatableJobs = [
      { name: "cron:wf-A:node1", key: "key-A", pattern: "*/5 * * * *", tz: "UTC" },
      { name: "cron:wf-B:node1", key: "key-B", pattern: "*/5 * * * *", tz: "UTC" }, // same pattern, different wf
    ];

    const mockQueue = {
      getRepeatableJobs: jest.fn().mockResolvedValue(mockRepeatableJobs),
      removeRepeatableByKey: jest.fn().mockResolvedValue(undefined),
    };
    mockQueueService.getQueue.mockReturnValue(mockQueue);
    mockPrisma.cronSchedule.findMany.mockResolvedValue([
      { workflowId: "wf-A", cron: "*/5 * * * *", timezone: "UTC", bullJobId: "cron:wf-A:node1" },
    ]);

    await service.deregisterSchedules("wf-A");

    // Should only remove wf-A's key, not wf-B's
    expect(mockQueue.removeRepeatableByKey).toHaveBeenCalledTimes(1);
    expect(mockQueue.removeRepeatableByKey).toHaveBeenCalledWith("key-A");
    expect(mockQueue.removeRepeatableByKey).not.toHaveBeenCalledWith("key-B");
  });
});
```

### Step 2 — `workflows.service.spec.ts`

Test G1: saving graph on ACTIVE workflow triggers deregister + register.

```typescript
describe("WorkflowsService.update with ACTIVE workflow", () => {
  it("should deregister + re-register schedules when graph updated on ACTIVE workflow", async () => {
    mockPrisma.workflow.findFirst.mockResolvedValue({
      id: "wf-1", status: "ACTIVE", activeVersion: 2, workspaceId: "ws-1",
    });
    mockPrisma.$transaction.mockImplementation(async (fn) => fn(mockPrisma));
    mockPrisma.workflowVersion.create.mockResolvedValue({});
    mockPrisma.workflow.update.mockResolvedValue({ id: "wf-1", status: "ACTIVE", activeVersion: 3 });
    mockPrisma.webhookEndpoint.deleteMany.mockResolvedValue({});
    mockPrisma.webhookEndpoint.create.mockResolvedValue({});

    const newGraph = { version: "1.0", nodes: [{ id: "n1", type: "cron.trigger", name: "Cron", position: {x:0,y:0}, config: { cron: "0 * * * *" } }], edges: [] };

    await service.update("ws-1", "wf-1", undefined, undefined, newGraph);

    expect(mockScheduler.deregisterSchedules).toHaveBeenCalledWith("wf-1");
    expect(mockScheduler.registerSchedules).toHaveBeenCalledWith("wf-1", newGraph);
  });

  it("should NOT call deregister/register when workflow is INACTIVE", async () => {
    mockPrisma.workflow.findFirst.mockResolvedValue({ id: "wf-2", status: "INACTIVE", activeVersion: 1, workspaceId: "ws-1" });
    // ... setup mocks
    await service.update("ws-1", "wf-2", "new name", undefined, undefined);
    expect(mockScheduler.deregisterSchedules).not.toHaveBeenCalled();
  });
});
```

### Step 3 — `credentials.service.spec.ts`

```typescript
describe("CredentialsService.update", () => {
  it("re-encrypts with fresh IV when data is provided", async () => {
    mockPrisma.credential.findFirst.mockResolvedValue({ id: "c1", workspaceId: "ws-1" });
    mockPrisma.credential.update.mockResolvedValue({ id: "c1", name: "My API", type: "apiKey", createdAt: new Date() });

    const spy = jest.spyOn(EncryptionUtil, "encrypt");
    await service.update("ws-1", "c1", { data: { key: "new-secret" } });

    expect(spy).toHaveBeenCalledWith({ key: "new-secret" });
    expect(mockPrisma.credential.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ encryptedData: expect.any(String) }) })
    );
  });

  it("does not re-encrypt when data is empty/absent", async () => {
    mockPrisma.credential.findFirst.mockResolvedValue({ id: "c1", workspaceId: "ws-1" });
    mockPrisma.credential.update.mockResolvedValue({ id: "c1", name: "Updated", type: "apiKey", createdAt: new Date() });

    const spy = jest.spyOn(EncryptionUtil, "encrypt");
    await service.update("ws-1", "c1", { name: "Updated" });

    expect(spy).not.toHaveBeenCalled();
    expect(mockPrisma.credential.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { name: "Updated" } })
    );
  });

  it("throws NotFoundException for unknown credential", async () => {
    mockPrisma.credential.findFirst.mockResolvedValue(null);
    await expect(service.update("ws-1", "bad-id", { name: "X" })).rejects.toThrow(NotFoundException);
  });
});
```

### Step 4 — `execute.command.spec.ts`

```typescript
describe("executeSystemCommand timeout", () => {
  it("fails with timeout error when command exceeds timeoutMs", async () => {
    const ctx = makeCtx({ config: { command: "sleep 10", timeoutMs: "50" } });
    const result = await executeSystemCommand(ctx);
    expect(result.status).toBe("failed");
    expect(result.error).toMatch(/timed out/i);
  }, 1000);

  it("succeeds with fast command", async () => {
    const ctx = makeCtx({ config: { command: "echo hello" } });
    const result = await executeSystemCommand(ctx);
    expect(result.status).toBe("success");
    expect(result.output?.stdout).toBe("hello");
  });
});
```

### Step 5 — `logic.if.spec.ts`

```typescript
describe("executeLogicIf branching", () => {
  it.each([
    ["equal", "foo", "foo", "true"],
    ["equal", "foo", "bar", "false"],
    ["not_equal", "a", "b", "true"],
    ["contains", "hello world", "world", "true"],
    ["contains", "hello", "xyz", "false"],
    ["greater_than", "10", "5", "true"],
    ["less_than", "3", "5", "true"],
  ])("operator %s: %s vs %s → branch %s", async (operator, v1, v2, branch) => {
    const ctx = makeCtx({ config: { value1: v1, operator, value2: v2 } });
    const result = await executeLogicIf(ctx);
    expect(result.status).toBe("success");
    expect(result.nextBranch).toBe(branch);
  });
});
```

### Step 6 — `http.request.spec.ts` SSRF

```typescript
describe("executeHttpRequest SSRF protection", () => {
  it("blocks requests to 127.0.0.1", async () => {
    jest.spyOn(dns.promises, "lookup").mockResolvedValue([{ address: "127.0.0.1", family: 4 }] as any);
    const ctx = makeCtx({ config: { url: "http://internal-service/admin" } });
    const result = await executeHttpRequest(ctx);
    expect(result.status).toBe("failed");
    expect(result.error).toMatch(/SSRF/i);
  });

  it("allows requests to public IPs", async () => {
    jest.spyOn(dns.promises, "lookup").mockResolvedValue([{ address: "93.184.216.34", family: 4 }] as any);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true, status: 200,
      headers: { get: () => "application/json" },
      json: async () => ({ ok: true }),
    }) as any;
    const ctx = makeCtx({ config: { url: "https://example.com/api", method: "GET" } });
    const result = await executeHttpRequest(ctx);
    expect(result.status).toBe("success");
  });
});
```

### Step 7 — Run tests and fix failures

```bash
cd n8n && pnpm test --filter=@n8n-clone/workflow-core
cd n8n && pnpm test --filter=@n8n-clone/node-registry
cd n8n/apps/api && pnpm test
```

## Success Criteria

- [ ] `scheduler.service.spec.ts`: deregister scoping test passes
- [ ] `workflows.service.spec.ts`: update on ACTIVE calls scheduler; update on INACTIVE does not
- [ ] `credentials.service.spec.ts`: update re-encrypts; skips encryption for name-only update; throws 404 for unknown id
- [ ] `execute.command.spec.ts`: timeout test passes in <1s
- [ ] `logic.if.spec.ts`: all 7 branch cases pass
- [ ] `http.request.spec.ts`: SSRF block test passes; public IP allowed
- [ ] All test suites exit 0 with `pnpm test`
- [ ] No tests rely on live Redis, Postgres, or external APIs

## Risk Assessment

- **`child_process.exec` timeout on Windows CI**: `sleep` command differs (`timeout /T 10` on Windows). Use `jest.setTimeout` and a cross-platform sleep mock for CI portability.
- **Prisma mock**: `jest-mock-extended` requires matching the exact Prisma client type. Use `mockDeep<PrismaClient>()` pattern from NestJS testing guides.
- **`$transaction` mock**: Prisma's `$transaction` with callback arg needs special mock: `mockPrisma.$transaction.mockImplementation(fn => fn(mockPrisma))`.
