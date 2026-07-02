---
phase: 1
title: "Critical Bug Fixes"
status: pending
priority: P1
effort: "3h"
dependencies: []
---

# Phase 1: Critical Bug Fixes

## Overview

Two bugs make the scheduler silently broken in production: (1) saving an active workflow's graph never re-registers cron/webhook triggers, and (2) `deregisterSchedules` can accidentally kill OTHER workflows' cron jobs by matching on pattern alone.

## Requirements

- Functional: Saving a graph on an ACTIVE workflow auto-reloads cron + webhook without manual deactivate/reactivate
- Functional: Deregister only removes BullMQ repeatable jobs belonging to the specified workflowId
- Non-functional: Zero downtime — re-registration must not create duplicate BullMQ jobs

## Architecture

### G1: Auto-Reload on Save (`workflows.service.ts`)

In `update()`, after the `$transaction` that bumps the version, check if `workflow.status === "ACTIVE"`. If so:
1. Call `schedulerService.deregisterSchedules(id)` — removes old BullMQ cron jobs + DB `CronSchedule` rows
2. Call `schedulerService.registerSchedules(id, newGraph)` — re-registers with new cron patterns
3. Delete old `WebhookEndpoint` rows for workflowId, then re-create them from the new graph's webhook nodes

This mirrors the exact deactivate → activate cycle already used in `remove()`. The difference: we stay in ACTIVE status throughout.

### G2: Workflow-Scoped BullMQ Deregister (`scheduler.service.ts`)

Current bug: `deregisterSchedules` filters repeatable jobs by `job.pattern === cron.pattern && job.tz === cron.timezone`. This matches any workflow with the same pattern — e.g., two workflows both using `"*/5 * * * *"` would cross-remove each other.

Fix: Embed `workflowId` into the BullMQ repeatable job's `name` field (first arg to `queue.add()`). Change the job name from the generic `"execute-workflow"` to `"cron:${workflowId}:${nodeId}"`. Then in `deregisterSchedules`, filter by `job.name.startsWith("cron:${workflowId}:")`.

Also: store the job name in `CronSchedule.bullJobId` so deregister can use it directly without scanning all repeatable jobs.

## Related Code Files

- Modify: `n8n/apps/api/src/workflows/workflows.service.ts`
- Modify: `n8n/apps/api/src/scheduler/scheduler.service.ts`
- Modify: `n8n/apps/api/prisma/schema.prisma` (if `CronSchedule.bullJobId` not already nullable string)

## Implementation Steps

### Fix G1 — `workflows.service.ts`

1. In the `update()` method, after the `$transaction` block that creates `WorkflowVersion` and updates `Workflow.activeVersion`, add:

```typescript
// Auto-reload triggers when graph changes on an ACTIVE workflow
if (graph && workflow.status === "ACTIVE") {
  // 1. Clear old cron schedules from BullMQ + DB
  await this.schedulerService.deregisterSchedules(id);

  // 2. Re-register cron triggers from new graph
  await this.schedulerService.registerSchedules(id, graph);

  // 3. Rotate webhook endpoints (delete old, create new)
  await this.prisma.$transaction(async (tx) => {
    await tx.webhookEndpoint.deleteMany({ where: { workflowId: id } });

    const webhookNodes = graph.nodes.filter((n) => n.type === "webhook.trigger");
    for (const node of webhookNodes) {
      const securePath = crypto.randomUUID();
      const secret = crypto.randomBytes(32).toString("hex");
      const syncMode = node.config?.responseMode === "sync";
      await tx.webhookEndpoint.create({
        data: { workflowId: id, webhookPath: securePath, secret, syncMode },
      });
    }
  });
}
```

### Fix G2 — `scheduler.service.ts`

2. In `registerSchedules`, change job name from `"execute-workflow"` to `"cron:${workflowId}:${node.id}"`:

```typescript
const jobName = `cron:${workflowId}:${node.id}`;
const addedJob = await this.queueService.addJob(
  jobName,  // ← was "execute-workflow"
  { workflowId, triggerNodeId: node.id, triggerType: "cron", triggerPayload: { ... } },
  { repeat: { pattern: cronPattern, tz: timezone } }
);
// Store job name so deregister can use it directly
await this.prisma.cronSchedule.create({
  data: { workflowId, cron: cronPattern, timezone, bullJobId: jobName },
});
```

3. In `deregisterSchedules`, filter by stored `bullJobId` (job name):

```typescript
for (const schedule of schedules) {
  const queue = this.queueService.getQueue();
  const repeatableJobs = await queue.getRepeatableJobs();

  // Match by name prefix — scoped to this workflowId only
  const matchingJobs = repeatableJobs.filter(
    (job) => schedule.bullJobId
      ? job.name === schedule.bullJobId
      : job.name?.startsWith(`cron:${workflowId}:`) && job.pattern === schedule.cron
  );

  for (const job of matchingJobs) {
    await queue.removeRepeatableByKey(job.key);
  }
}
await this.prisma.cronSchedule.deleteMany({ where: { workflowId } });
```

4. Verify `CronSchedule` model has `bullJobId String?` — already nullable in schema (confirmed).

## Success Criteria

- [ ] Save graph on ACTIVE workflow → BullMQ `getRepeatableJobs()` shows new pattern, not old
- [ ] Two workflows with same cron pattern — deactivating one does NOT remove the other's jobs
- [ ] Webhook path changes on save of ACTIVE workflow (new UUID generated)
- [ ] No duplicate cron jobs after repeated saves

## Risk Assessment

- **Duplicate jobs on race condition**: Guard with `try/catch` around the register step; add `removeOnComplete: true` BullMQ option
- **Webhook downtime**: ~100ms window between delete and create; acceptable for non-sync webhooks

## Security Considerations

- New webhook `secret` generated per activation cycle — old URLs immediately invalidated
- `workflowId` in job name is internal UUID, not user-facing data
