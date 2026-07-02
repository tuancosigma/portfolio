---
phase: 3
title: "Credential Vault & Webhook UX"
status: pending
priority: P1
effort: "3h"
dependencies: []
---

# Phase 3: Credential Vault & Webhook UX

## Overview

Three UX gaps prevent users from securely managing credentials and webhooks in production: no credential UPDATE endpoint forces delete+recreate to rotate keys; activated webhook URLs are never surfaced to the user; and the credentials page shows no visual encryption status.

## Requirements

- Functional: `PATCH /credentials/:id` updates encrypted data without exposing plaintext
- Functional: Workflow `findOne` response includes active webhook URLs
- Functional: Workflow editor shows webhook URL with copy button when workflow is ACTIVE + has webhook trigger
- Functional: Credentials list shows "AES-256-GCM Encrypted" badge on each credential
- Non-functional: PATCH endpoint re-encrypts with fresh IV/tag — never patches encrypted blob in-place

## Architecture

### G6: Credential UPDATE Endpoint

Add `update(workspaceId, id, input)` to `CredentialsService`:
- Fetch existing credential to verify ownership
- Re-encrypt the new `data` object with `EncryptionUtil.encrypt(data)` (fresh IV + tag)
- `prisma.credential.update({ where: { id }, data: { name, type, encryptedData, iv, tag } })`
- Return same safe projection as `create`: `{ id, name, type, createdAt }`

Add `PATCH /credentials/:id` to `CredentialsController`.

DTO: same `CredentialCreateInput` shape (name, type, data) — all fields optional for partial update.

### G5: Webhook URL in Workflow Response

In `WorkflowsService.findOne()` and `update()`, include active `WebhookEndpoint` rows:

```typescript
const webhookEndpoints = await this.prisma.webhookEndpoint.findMany({
  where: { workflowId: id },
  select: { webhookPath: true, syncMode: true },
});

return {
  ...workflow,
  graph,
  webhookEndpoints: webhookEndpoints.map(e => ({
    url: `${process.env.API_BASE_URL || "http://localhost:3001"}/webhooks/${workflow.workspaceId}/${id}/${e.webhookPath}`,
    syncMode: e.syncMode,
  })),
};
```

### G5 Frontend: Webhook URL Banner in Editor

In `workflows/[id]/editor/page.tsx`, when `workflow.status === "ACTIVE"` and `webhookEndpoints.length > 0`, show a dismissible info banner below the toolbar:

```tsx
{workflow?.status === "ACTIVE" && workflow?.webhookEndpoints?.length > 0 && (
  <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 glass-panel px-4 py-3 flex items-center gap-3 text-sm">
    <Webhook className="w-4 h-4 text-primary flex-shrink-0" />
    <span className="text-slate-300 font-medium">Webhook URL:</span>
    <code className="text-primary font-mono text-xs bg-primary/10 px-2 py-1 rounded">
      {workflow.webhookEndpoints[0].url}
    </code>
    <button onClick={() => navigator.clipboard.writeText(workflow.webhookEndpoints[0].url)}
      className="p-1.5 rounded hover:bg-white/10 transition-colors">
      <Copy className="w-3.5 h-3.5 text-slate-400" />
    </button>
  </div>
)}
```

### G7: "Encrypted & Secured" Visual on Credentials Page

In `credentials/page.tsx`, add an encryption status badge to each credential card:

```tsx
<div className="flex items-center gap-1.5 mt-2">
  <ShieldCheck className="w-3 h-3 text-emerald-400" />
  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
    AES-256-GCM Encrypted
  </span>
</div>
```

Also add a **Edit** (pencil) button per credential that opens the create/edit drawer in update mode, pre-filling name and type but leaving data fields empty (security: never pre-fill plaintext values — show placeholder "Leave blank to keep existing").

## Related Code Files

- Modify: `n8n/apps/api/src/credentials/credentials.service.ts`
- Modify: `n8n/apps/api/src/credentials/credentials.controller.ts`
- Modify: `n8n/apps/api/src/workflows/workflows.service.ts`
- Modify: `n8n/apps/web/src/app/credentials/page.tsx`
- Modify: `n8n/apps/web/src/app/workflows/[id]/editor/page.tsx`
- Modify: `n8n/apps/web/src/utils/api.ts` (add `credentials.update()`)

## Implementation Steps

### Step 1 — `CredentialsService.update()`

```typescript
async update(workspaceId: string, id: string, input: Partial<CredentialCreateInput>) {
  const existing = await this.prisma.credential.findFirst({
    where: { id, workspaceId },
  });
  if (!existing) throw new NotFoundException("Credential not found.");

  const updateData: any = {};
  if (input.name !== undefined) updateData.name = input.name;
  if (input.type !== undefined) updateData.type = input.type;
  if (input.data && Object.keys(input.data).length > 0) {
    // Re-encrypt with fresh IV+tag — never patch existing ciphertext
    const { encryptedData, iv, tag } = EncryptionUtil.encrypt(input.data);
    Object.assign(updateData, { encryptedData, iv, tag });
  }

  return this.prisma.credential.update({
    where: { id },
    data: updateData,
    select: { id: true, name: true, type: true, createdAt: true, updatedAt: true },
  });
}
```

### Step 2 — `CredentialsController` PATCH route

```typescript
@Patch(":id")
async update(
  @Req() req: any,
  @Param("id") id: string,
  @Body() body: Partial<CredentialCreateInput>,
) {
  const workspace = await this.getWorkspace(req.user.id);
  return this.credentialsService.update(workspace.workspaceId, id, body);
}
```

### Step 3 — `api.ts` client helper

```typescript
credentials: {
  list: () => apiRequest("/credentials"),
  create: (data: any) => apiRequest("/credentials", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) => apiRequest(`/credentials/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  remove: (id: string) => apiRequest(`/credentials/${id}`, { method: "DELETE" }),
},
```

### Step 4 — `WorkflowsService` — include webhook URLs

Add webhook endpoint fetch to `findOne()` and `update()` return values (see Architecture section above). No schema change needed — `WebhookEndpoint` already exists.

### Step 5 — Credential page UI updates

1. Add `ShieldCheck` import from lucide-react (already imported in dashboard, re-use)
2. Add encryption badge below credential type tag
3. Add Edit button — opens existing create drawer with `editingId` state
4. In drawer: if `editingId`, show "Update Credential" title; data fields use placeholder "Leave blank to keep existing values"; on submit call `api.credentials.update()`

### Step 6 — Workflow editor webhook URL banner

1. Add `webhookEndpoints` to workflow state type
2. Render banner in editor layout (see Architecture section above)
3. Add `Copy` icon import from lucide-react

## Success Criteria

- [ ] `PATCH /credentials/:id` with new data → returns updated credential, re-encrypted with new IV
- [ ] `PATCH /credentials/:id` with empty `data` → only name/type updated, existing cipher unchanged
- [ ] `GET /workflows/:id` includes `webhookEndpoints[].url` when workflow is ACTIVE
- [ ] Workflow editor shows webhook URL banner with copy button when ACTIVE + webhook trigger exists
- [ ] Credentials list shows "AES-256-GCM Encrypted" badge on every credential
- [ ] Edit credential form never pre-fills data fields (plaintext protection)

## Risk Assessment

- **Stale webhook URLs in frontend after save**: The `update()` workflow service now rotates webhook paths on save-while-ACTIVE (Phase 1). Editor must re-fetch `webhookEndpoints` after save to show the new URL.
- **Credential type change via PATCH**: If `type` changes but `data` does not, the old encrypted schema may not match the new type. Consider requiring `data` whenever `type` changes. Log warning if mismatch detected.

## Security Considerations

- PATCH endpoint must verify `workspaceId` ownership before updating — never update by `id` alone
- Never return `encryptedData`, `iv`, or `tag` in API responses — only safe projection fields
- Frontend credential edit form: disable browser autocomplete on data fields (`autoComplete="new-password"`) to prevent credential manager leakage
- Copy-to-clipboard webhook URL: clear clipboard after 60s using `setTimeout(() => navigator.clipboard.writeText(""), 60000)`
