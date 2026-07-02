---
phase: 4
title: "Node Security & Edge Cases"
status: pending
priority: P2
effort: "2h"
dependencies: []
---

# Phase 4: Node Security & Edge Cases

## Overview

One confirmed security gap: `execute.command` node uses `child_process.exec()` without a `timeout` option, so a runaway shell command can hang the worker indefinitely regardless of the engine's per-node timeout race. Additionally, several minor hardening improvements across nodes.

## Requirements

- Functional: `execute.command` terminates after `config.timeoutMs` (default 30s) even if the engine signal is delayed
- Functional: `code.javascript` sandbox blocks async infinite loops via `vm` context timeout
- Non-functional: No worker thread starvation from a single hung node

## Architecture

### G8: `execute.command` Timeout

The execution engine passes `AbortSignal` and runs a `Promise.race` timeout — but `child_process.exec()` ignores `AbortSignal` and the race only rejects the Promise, not the spawned process. The child process keeps running.

Fix: pass `timeout` and `killSignal` to `exec()` options directly:

```typescript
const execOptions = {
  cwd: cwd ? path.resolve(cwd) : undefined,
  maxBuffer: 1024 * 1024 * 10,
  timeout: timeoutMs,           // ← kill after N ms
  killSignal: "SIGTERM" as const,
};
```

Also honour the `AbortSignal` by wrapping with `AbortController`:

```typescript
const timeoutMs = Number(ctx.config.timeoutMs) || 30000;
```

### Additional Hardening

**`code.javascript`**: The `vm.Script.runInContext()` already accepts `{ timeout }` but the timeout only covers synchronous code. For async (since we `await` the IIFE result), the timeout fires only on the initial synchronous parse+start. Add an outer `Promise.race` with `setTimeout` to cover the full async execution:

```typescript
const runPromise = (script.runInContext(context, { timeout: timeoutMs }) as Promise<any>);
const timeoutPromise = new Promise<never>((_, reject) =>
  setTimeout(() => reject(new Error(`Script exceeded timeout of ${timeoutMs}ms`)), timeoutMs)
);
const result = await Promise.race([runPromise, timeoutPromise]);
```

**`db.postgres.query`**: Add `connectionTimeoutMillis` and `query_timeout` to `pg.Client` config to prevent queries hanging on slow/unreachable target DBs:

```typescript
const client = new Client({
  ...credentials,
  connectionTimeoutMillis: 10000,
  query_timeout: Number(ctx.config.timeoutMs) || 60000,
});
```

**`http.request`**: Already uses `signal: ctx.signal` which is tied to the execution engine's `AbortController`. No change needed.

**`email.smtp`**: Add SMTP connection timeout via nodemailer's `connectionTimeout` and `greetingTimeout` options:

```typescript
const transporter = nodemailer.createTransport({
  ...smtpConfig,
  connectionTimeout: 15000,
  greetingTimeout: 10000,
  socketTimeout: 30000,
});
```

## Related Code Files

- Modify: `n8n/packages/node-registry/src/nodes/execute.command.ts`
- Modify: `n8n/packages/node-registry/src/nodes/code.javascript.ts`
- Modify: `n8n/packages/node-registry/src/nodes/db.postgres.query.ts`
- Modify: `n8n/packages/node-registry/src/nodes/email.smtp.ts`

## Implementation Steps

### Step 1 — `execute.command.ts` timeout fix

```typescript
export const executeSystemCommand = async (ctx: NodeExecutionContext): Promise<NodeExecutionResult> => {
  const resolvedConfig = ExpressionResolver.resolve(ctx.config, ctx.input);
  const { command, cwd } = resolvedConfig;
  const timeoutMs = Number(ctx.config.timeoutMs) || 30000; // ← read from node config

  if (!command) return { status: "failed", error: "Missing required parameter: 'command'" };
  if (cwd && !fs.existsSync(cwd)) return { status: "failed", error: `CWD "${cwd}" does not exist.` };

  return new Promise((resolve) => {
    const execOptions = {
      cwd: cwd ? path.resolve(cwd) : undefined,
      maxBuffer: 1024 * 1024 * 10,
      timeout: timeoutMs,           // ← process killed after timeout
      killSignal: "SIGTERM" as const,
    };

    exec(command, execOptions, (error, stdout, stderr) => {
      if (error) {
        const isTimeout = error.killed && error.signal === "SIGTERM";
        resolve({
          status: "failed",
          error: isTimeout ? `Command timed out after ${timeoutMs}ms` : error.message,
          output: { stdout: stdout.trim(), stderr: stderr.trim(), exitCode: error.code || 1 },
        });
      } else {
        resolve({ status: "success", output: { stdout: stdout.trim(), stderr: stderr.trim(), exitCode: 0 } });
      }
    });
  });
};
```

### Step 2 — `code.javascript.ts` async timeout

Replace bare `await promiseResult` with a `Promise.race` against a `setTimeout` reject.

### Step 3 — `db.postgres.query.ts` connection timeout

Add `connectionTimeoutMillis: 10000` and `query_timeout: Number(ctx.config.timeoutMs) || 60000` to the `new Client({...})` constructor.

### Step 4 — `email.smtp.ts` transport timeouts

Add `connectionTimeout: 15000`, `greetingTimeout: 10000`, `socketTimeout: 30000` to `nodemailer.createTransport()`.

## Success Criteria

- [ ] `execute.command` with `timeoutMs: 100` and `command: "sleep 5"` → returns `failed` with "timed out" error within ~200ms
- [ ] `code.javascript` with an infinite `while(true){}` loop → returns `failed` with timeout error
- [ ] `db.postgres.query` targeting unreachable host → fails within 10s (not 2min default)
- [ ] `email.smtp` targeting unreachable host → fails within 15s

## Risk Assessment

- **SIGTERM vs SIGKILL**: Some processes ignore SIGTERM. For truly adversarial payloads, SIGKILL is safer but harsher. Accept SIGTERM for now; document that `execute.command` is not intended for untrusted user input.
- **vm timeout doesn't stop event loop**: Node.js `vm` timeout only stops synchronous execution in the sandbox. A `setInterval` inside the sandbox could survive. The outer `Promise.race` + `setTimeout` mitigates this for the current execution, but the sandbox timer may still fire later. Document limitation.
