# Phase 4: Security & DevOps

**Duration:** Weeks 8-10  
**Priority:** 🟡 HIGH  
**Effort:** 10 person-days  
**Depends on:** Phase 1-2 completion

---

## Overview

Production-ready security hardening and deployment infrastructure with Kubernetes, CI/CD, and observability.

---

## Tasks

### Task 1: Rate Limiting & Security Guards (2 days)

**Rate Limiting:**
```typescript
// apps/api/src/common/guards/rate-limit.guard.ts
@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private redis: Redis) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const key = `rate-limit:${request.ip}:${request.path}`;
    
    const count = await this.redis.incr(key);
    if (count === 1) await this.redis.expire(key, 60);
    
    if (count > 100) {
      throw new TooManyRequestsException(
        'Rate limit exceeded: 100 requests per minute'
      );
    }
    
    return true;
  }
}
```

**Request Signing:**
```typescript
// apps/api/src/common/utils/webhook-verification.ts
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(hash),
    Buffer.from(signature)
  );
}

// Usage in controller
@Post('/webhook/:id')
async handleWebhook(
  @Param('id') webhookId: string,
  @Headers('x-signature') signature: string,
  @Body() body: any,
  @Req() req: Request
) {
  const workflow = await this.workflowsService.findOne(webhookId);
  const rawBody = await getRawBody(req);
  
  if (!verifyWebhookSignature(rawBody, signature, workflow.secret)) {
    throw new UnauthorizedException('Invalid webhook signature');
  }
  
  // Process webhook
}
```

**Files:**
- `apps/api/src/common/guards/rate-limit.guard.ts` (NEW)
- `apps/api/src/common/utils/webhook-verification.ts` (NEW)

---

### Task 2: Audit Logging (2 days)

**Audit Interceptor:**
```typescript
// apps/api/src/common/interceptors/audit.interceptor.ts
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();
    const { method, path, user } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap((response) => {
        const duration = Date.now() - startTime;
        
        this.auditService.log({
          timestamp: new Date(),
          userId: user?.id,
          workspaceId: user?.workspaceId,
          action: `${method} ${path}`,
          statusCode: response?.statusCode || 200,
          duration,
          ip: request.ip,
          userAgent: request.get('user-agent')
        });
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        
        this.auditService.log({
          timestamp: new Date(),
          userId: user?.id,
          workspaceId: user?.workspaceId,
          action: `${method} ${path}`,
          statusCode: error.status || 500,
          error: error.message,
          duration,
          ip: request.ip
        });
        
        throw error;
      })
    );
  }
}
```

**Audit Service:**
```typescript
// apps/api/src/audit/audit.service.ts
@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(data: AuditLogDto) {
    await this.prisma.auditLog.create({ data });
  }

  async findByWorkspace(workspaceId: string, limit = 100) {
    return this.prisma.auditLog.findMany({
      where: { workspaceId },
      orderBy: { timestamp: 'desc' },
      take: limit
    });
  }
}
```

**Files:**
- `apps/api/src/common/interceptors/audit.interceptor.ts` (NEW)
- `apps/api/src/audit/audit.service.ts` (NEW)
- `apps/api/prisma/schema.prisma` (MODIFY - add AuditLog model)

---

### Task 3: Kubernetes Manifests (3 days)

**Deployment:**
```yaml
# infra/k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: n8n-api
  labels:
    app: n8n-api
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: n8n-api
  template:
    metadata:
      labels:
        app: n8n-api
    spec:
      serviceAccountName: n8n-api
      containers:
      - name: api
        image: n8n-clone/api:latest
        imagePullPolicy: Always
        ports:
        - containerPort: 3001
          name: http
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: url
        - name: REDIS_HOST
          value: redis-service
        - name: REDIS_PORT
          value: "6379"
        livenessProbe:
          httpGet:
            path: /health
            port: http
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health/ready
            port: http
          initialDelaySeconds: 10
          periodSeconds: 5
        resources:
          requests:
            cpu: 100m
            memory: 256Mi
          limits:
            cpu: 500m
            memory: 512Mi
```

**Service:**
```yaml
# infra/k8s/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: n8n-api
spec:
  type: LoadBalancer
  selector:
    app: n8n-api
  ports:
  - port: 80
    targetPort: http
    protocol: TCP
```

**ConfigMap & Secrets:**
```yaml
# infra/k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: n8n-config
data:
  LOG_LEVEL: "info"
  API_HOST: "0.0.0.0"

---
# infra/k8s/secrets.yaml (use sealed-secrets in prod)
apiVersion: v1
kind: Secret
metadata:
  name: db-credentials
type: Opaque
data:
  url: <base64-encoded-database-url>
```

**Files:**
- `infra/k8s/deployment.yaml` (NEW)
- `infra/k8s/service.yaml` (NEW)
- `infra/k8s/configmap.yaml` (NEW)
- `infra/k8s/secrets.yaml` (NEW)
- `infra/k8s/ingress.yaml` (NEW)
- Helm charts (optional)

---

### Task 4: GitHub Actions CI/CD (2 days)

**Main Pipeline:**
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
      redis:
        image: redis:7
    
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'
      
      - run: pnpm install
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test
      - run: pnpm build
      - run: pnpm --filter api test:e2e

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run security scan
        run: |
          npm install -g snyk
          snyk auth ${{ secrets.SNYK_TOKEN }}
          snyk test

  build-and-push:
    needs: [lint-and-test, security]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      - uses: docker/setup-buildx-action@v2
      - uses: docker/login-action@v2
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: ghcr.io/n8n-clone/api:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/n8n-api \
            api=ghcr.io/n8n-clone/api:${{ github.sha }}
```

**Files:**
- `.github/workflows/ci.yml` (NEW)
- `.github/workflows/security-scan.yml` (NEW)
- `.github/workflows/deploy.yml` (NEW)

---

### Task 5: Monitoring & Observability (1 day)

**Prometheus + Grafana:**
```yaml
# infra/monitoring/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'n8n-api'
    static_configs:
      - targets: ['localhost:3001']
    metrics_path: '/metrics'
```

**Grafana Dashboards:**
- API latency and throughput
- Error rates and types
- Database query performance
- Cache hit rates
- Workflow execution metrics

**Files:**
- `infra/monitoring/prometheus.yml` (NEW)
- `infra/monitoring/grafana-dashboards/` (NEW)
- `docker-compose.monitoring.yml` (NEW)

---

## Success Criteria

- [ ] Rate limiting prevents abuse
- [ ] Webhook signature verification working
- [ ] Audit logs stored in database
- [ ] Kubernetes deployment successful
- [ ] CI/CD pipeline running on every PR
- [ ] Docker images built and pushed
- [ ] Prometheus metrics accessible
- [ ] Grafana dashboards working
- [ ] Zero security vulnerabilities

---

## Dependencies

- Requires Phase 1-3 complete
- Docker & Kubernetes knowledge required

---

## Next Phase

→ Phase 5: Polish & Release
