# Phase 2: Performance Optimization

**Duration:** Weeks 3-4  
**Priority:** 🔴 CRITICAL  
**Effort:** 8 person-days  
**Depends on:** Phase 1 (uses Repository pattern)

---

## Overview

Optimize database queries, implement caching, and add performance monitoring to reduce latency by 40% and improve scalability.

---

## Tasks

### Task 1: Redis Caching Layer (3 days)

**Implementation:**
```typescript
// packages/cache-manager/src/cache.service.ts
@Injectable()
export class CacheService {
  constructor(private redis: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    return value ? JSON.parse(value) : null;
  }

  async set<T>(key: string, value: T, ttlSeconds = 300): Promise<void> {
    await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
  }

  async invalidate(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}

// Usage in service
async findByWorkspaceId(workspaceId: string) {
  const cacheKey = `workflows:${workspaceId}`;
  const cached = await this.cacheService.get(cacheKey);
  if (cached) return cached;

  const workflows = await this.repository.findByWorkspaceId(workspaceId);
  await this.cacheService.set(cacheKey, workflows, 300);
  return workflows;
}
```

**Caching Strategy:**
- Workflows: 5min TTL
- Executions: 10min TTL
- Credentials: 30min TTL (sensitive data)
- User workspace settings: 1hour TTL

**Files:**
- `packages/cache-manager/src/cache.service.ts` (NEW)
- `apps/api/src/**/*.service.ts` (MODIFY - add caching)
- `apps/api/src/common/decorators/cacheable.decorator.ts` (NEW)

---

### Task 2: Database Optimization (2 days)

**Migrations:**
```sql
-- migrations/add_performance_indexes.sql
CREATE INDEX idx_workflows_workspace_status 
  ON workflows(workspace_id, status);

CREATE INDEX idx_executions_workflow_id_created 
  ON executions(workflow_id, created_at DESC);

CREATE INDEX idx_workflow_versions_workflow_id 
  ON workflow_versions(workflow_id, version DESC);
```

**Query Optimization:**
- Replace N+1 queries with includes
- Add pagination to list endpoints
- Use aggregations for counts

**Files:**
- `apps/api/prisma/migrations/` (NEW)
- Repository methods (MODIFY)

---

### Task 3: Prometheus Metrics (2 days)

**Setup:**
```typescript
// apps/api/src/common/metrics/metrics.service.ts
import { Counter, Histogram, Gauge } from 'prom-client';

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_ms',
  help: 'HTTP request duration',
  labelNames: ['method', 'route', 'status'],
  buckets: [10, 50, 100, 250, 500, 1000, 2500]
});

export const databaseQueryDuration = new Histogram({
  name: 'database_query_duration_ms',
  help: 'Database query duration',
  labelNames: ['operation', 'table'],
  buckets: [1, 5, 10, 25, 50, 100, 250]
});

export const workflowExecutions = new Counter({
  name: 'workflow_executions_total',
  help: 'Total workflow executions',
  labelNames: ['status', 'trigger']
});
```

**Metrics Endpoint:**
```
GET /metrics → Prometheus format
```

**Files:**
- `apps/api/src/common/metrics/metrics.service.ts` (NEW)
- `apps/api/src/main.ts` (MODIFY - register metrics)

---

### Task 4: Load Testing Baseline (1 day)

**Using k6:**
```javascript
// scripts/load-test.js
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m30s', target: 100 },
    { duration: '20s', target: 0 }
  ]
};

export default function () {
  const response = http.get('http://localhost:3001/workflows');
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200
  });
}
```

**Baseline Metrics:**
- [ ] Response time: < 500ms
- [ ] P95 latency: < 1s
- [ ] Throughput: > 100 req/s

---

## Success Criteria

- [ ] Redis cache configured and working
- [ ] Query time reduced by 40%
- [ ] All slow queries optimized (< 200ms)
- [ ] Prometheus metrics accessible
- [ ] Load test baseline established
- [ ] Cache hit rate > 70%

---

## Dependencies

- Requires Phase 1 (Repository pattern)
- Requires Docker + Redis running

---

## Next Phase

→ Phase 3: UX Enhancement
