# Phase 1: Foundation - Architecture Patterns & Testing

**Duration:** Weeks 1-2  
**Priority:** 🔴 CRITICAL  
**Effort:** 8 person-days  

---

## Overview

Phase 1 establishes solid code patterns and testing infrastructure that all other phases depend on. Without these foundations, scaling becomes increasingly difficult.

### Deliverables
- ✅ Repository Pattern for all data access
- ✅ Centralized error handling & custom exceptions
- ✅ Comprehensive testing framework
- ✅ Swagger/OpenAPI documentation
- ✅ Environment configuration templates

---

## Task 1: Repository Pattern Implementation

### Context
**Current Problem:** Services directly access Prisma, creating tight coupling
```typescript
// ❌ BAD - current approach
export class WorkflowsService {
  constructor(private prisma: PrismaService) {}
  
  async create(data) {
    return this.prisma.workflow.create({ data });
  }
}
```

**Solution:** Repository pattern decouples business logic from data layer
```typescript
// ✅ GOOD - repository pattern
export class WorkflowsRepository {
  async create(data): Promise<Workflow> {
    return this.prisma.workflow.create({ data });
  }
}

export class WorkflowsService {
  constructor(private repository: WorkflowsRepository) {}
  
  async create(data) {
    // Business logic here
    return this.repository.create(data);
  }
}
```

### Implementation Steps

#### Step 1.1: Create base repository class
```typescript
// apps/api/src/common/repository/base.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export abstract class BaseRepository<T, CreateDTO, UpdateDTO> {
  constructor(protected prisma: PrismaService) {}

  protected abstract model: any;

  async create(data: CreateDTO): Promise<T> {
    return this.model.create({ data });
  }

  async findById(id: string): Promise<T | null> {
    return this.model.findUnique({ where: { id } });
  }

  async findAll(): Promise<T[]> {
    return this.model.findMany();
  }

  async update(id: string, data: UpdateDTO): Promise<T> {
    return this.model.update({ where: { id }, data });
  }

  async delete(id: string): Promise<boolean> {
    await this.model.delete({ where: { id } });
    return true;
  }
}
```

#### Step 1.2: Create domain-specific repositories
```typescript
// apps/api/src/workflows/workflows.repository.ts
import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../common/repository/base.repository';
import { PrismaService } from '../prisma/prisma.service';
import { Workflow } from '@prisma/client';
import { CreateWorkflowDto, UpdateWorkflowDto } from './dto';

@Injectable()
export class WorkflowsRepository extends BaseRepository<
  Workflow,
  CreateWorkflowDto,
  UpdateWorkflowDto
> {
  protected model = this.prisma.workflow;

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findByWorkspaceId(workspaceId: string): Promise<Workflow[]> {
    return this.prisma.workflow.findMany({
      where: { workspaceId },
      orderBy: { updatedAt: 'desc' }
    });
  }

  async findActiveByWorkspaceId(workspaceId: string): Promise<Workflow[]> {
    return this.prisma.workflow.findMany({
      where: {
        workspaceId,
        status: 'ACTIVE'
      }
    });
  }

  async findWithExecutionCount(
    workspaceId: string
  ): Promise<(Workflow & { _count: { executions: number } })[]> {
    return this.prisma.workflow.findMany({
      where: { workspaceId },
      include: { _count: { select: { executions: true } } },
      orderBy: { updatedAt: 'desc' }
    });
  }
}
```

#### Step 1.3: Create other repositories
```typescript
// Create similar for:
// - apps/api/src/executions/executions.repository.ts
// - apps/api/src/credentials/credentials.repository.ts
// - apps/api/src/workspace/workspace.repository.ts
// Following the same pattern
```

#### Step 1.4: Update services to use repositories
```typescript
// apps/api/src/workflows/workflows.service.ts (REFACTORED)
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { WorkflowsRepository } from './workflows.repository';
import { QueueService } from '../queue/queue.service';
import { SchedulerService } from '../scheduler/scheduler.service';
import { GraphValidator } from '@n8n-clone/workflow-core';
import { CreateWorkflowDto, UpdateWorkflowDto } from './dto';

@Injectable()
export class WorkflowsService {
  constructor(
    private repository: WorkflowsRepository,
    private queueService: QueueService,
    private schedulerService: SchedulerService,
    private graphValidator: GraphValidator
  ) {}

  async create(workspaceId: string, dto: CreateWorkflowDto) {
    const workflow = await this.repository.create({
      ...dto,
      workspaceId
    });

    return workflow;
  }

  async findAll(workspaceId: string) {
    return this.repository.findByWorkspaceId(workspaceId);
  }

  async findOne(workspaceId: string, id: string) {
    const workflow = await this.repository.findById(id);

    if (!workflow || workflow.workspaceId !== workspaceId) {
      throw new NotFoundException('Workflow not found');
    }

    return workflow;
  }

  async update(
    workspaceId: string,
    id: string,
    dto: UpdateWorkflowDto
  ) {
    const workflow = await this.findOne(workspaceId, id);

    // Validate graph if provided
    if (dto.graph) {
      this.graphValidator.validate(dto.graph);
    }

    return this.repository.update(id, dto);
  }

  async delete(workspaceId: string, id: string) {
    const workflow = await this.findOne(workspaceId, id);

    if (workflow.status === 'ACTIVE') {
      throw new BadRequestException(
        'Cannot delete active workflow. Deactivate first.'
      );
    }

    return this.repository.delete(id);
  }

  async activate(workspaceId: string, id: string) {
    const workflow = await this.findOne(workspaceId, id);

    await this.repository.update(id, { status: 'ACTIVE' });

    // Register scheduler jobs if workflow has cron triggers
    await this.schedulerService.registerWorkflowJobs(workflow);

    return workflow;
  }

  async deactivate(workspaceId: string, id: string) {
    const workflow = await this.findOne(workspaceId, id);

    await this.repository.update(id, { status: 'INACTIVE' });

    // Unregister scheduler jobs
    await this.schedulerService.unregisterWorkflowJobs(workflow);

    return workflow;
  }
}
```

#### Step 1.5: Update module to provide repositories
```typescript
// apps/api/src/workflows/workflows.module.ts
import { Module } from '@nestjs/common';
import { WorkflowsService } from './workflows.service';
import { WorkflowsController } from './workflows.controller';
import { WorkflowsRepository } from './workflows.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { QueueModule } from '../queue/queue.module';
import { SchedulerModule } from '../scheduler/scheduler.module';

@Module({
  imports: [PrismaModule, QueueModule, SchedulerModule],
  providers: [WorkflowsService, WorkflowsRepository],
  controllers: [WorkflowsController],
  exports: [WorkflowsService, WorkflowsRepository]
})
export class WorkflowsModule {}
```

### Testing for Task 1
```bash
pnpm --filter api test workflows.repository.spec.ts
pnpm --filter api test workflows.service.spec.ts
```

### Files to Create/Modify
- ✅ `apps/api/src/common/repository/base.repository.ts` (NEW)
- ✅ `apps/api/src/workflows/workflows.repository.ts` (NEW)
- ✅ `apps/api/src/executions/executions.repository.ts` (NEW)
- ✅ `apps/api/src/credentials/credentials.repository.ts` (NEW)
- ✅ `apps/api/src/workspace/workspace.repository.ts` (NEW)
- ✅ `apps/api/src/workflows/workflows.service.ts` (MODIFY)
- ✅ `apps/api/src/workflows/workflows.module.ts` (MODIFY)

**Effort:** 3 person-days  
**Complexity:** Medium

---

## Task 2: Error Handling & Custom Exceptions

### Context
**Current Problem:** Inconsistent error responses, no centralized logging
```typescript
// ❌ Different errors in different controllers
throw new NotFoundException('Workflow not found');
throw new BadRequestException('Invalid graph');
throw new Error('Random error');
```

**Solution:** Standardized exception hierarchy with logging
```typescript
// ✅ GOOD - custom exceptions
throw new WorkflowNotFoundError(id);
throw new InvalidWorkflowGraphError(errors);
```

### Implementation Steps

#### Step 2.1: Create custom exception classes
```typescript
// apps/api/src/common/exceptions/custom-exceptions.ts
import {
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
  GatewayTimeoutException,
  InternalServerErrorException
} from '@nestjs/common';

export class WorkflowNotFoundError extends NotFoundException {
  constructor(workflowId: string) {
    super(`Workflow with ID "${workflowId}" not found`);
  }
}

export class InvalidWorkflowGraphError extends BadRequestException {
  constructor(errors: string[]) {
    super({
      message: 'Invalid workflow graph',
      errors
    });
  }
}

export class WorkflowCycleDetectedError extends BadRequestException {
  constructor(cycle: string[]) {
    super({
      message: 'Workflow graph contains cycle',
      cycle
    });
  }
}

export class ExecutionTimeoutError extends GatewayTimeoutException {
  constructor(workflowId: string, timeout: number) {
    super(
      `Workflow execution exceeded ${timeout}ms timeout`
    );
  }
}

export class CredentialNotFoundError extends NotFoundException {
  constructor(credentialId: string) {
    super(`Credential with ID "${credentialId}" not found`);
  }
}

export class UnauthorizedWorkflowAccessError extends ForbiddenException {
  constructor(workflowId: string, userId: string) {
    super(
      `User "${userId}" does not have access to workflow "${workflowId}"`
    );
  }
}

export class DuplicateWorkflowNameError extends ConflictException {
  constructor(name: string) {
    super(`Workflow with name "${name}" already exists in this workspace`);
  }
}

export class WorkflowAlreadyActiveError extends ConflictException {
  constructor(workflowId: string) {
    super(`Workflow "${workflowId}" is already active`);
  }
}

export class ExecutionDataCorruptedError extends InternalServerErrorException {
  constructor(executionId: string, reason: string) {
    super(
      `Execution data for "${executionId}" is corrupted: ${reason}`
    );
  }
}
```

#### Step 2.2: Create HTTP exception filter
```typescript
// apps/api/src/common/filters/http-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger
} from '@nestjs/common';
import { Request, Response } from 'express';
import { v4 as uuid } from 'uuid';

interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  timestamp: string;
  path: string;
  requestId: string;
  error?: string;
  errors?: any;
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private logger = new Logger('HttpException');

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();
    const requestId = uuid();

    const errorResponse: ErrorResponse = {
      statusCode: status,
      message: exception.message,
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId
    };

    // Add error details if available
    if (typeof exceptionResponse === 'object') {
      const { message, error, errors } = exceptionResponse as any;
      errorResponse.message = message || errorResponse.message;
      if (error) errorResponse.error = error;
      if (errors) errorResponse.errors = errors;
    }

    // Log errors
    const logLevel = status >= 500 ? 'error' : 'warn';
    this.logger[logLevel](
      JSON.stringify({
        requestId,
        method: request.method,
        path: request.url,
        statusCode: status,
        message: errorResponse.message,
        userId: (request as any).user?.id,
        timestamp: new Date().toISOString()
      })
    );

    response.status(status).json(errorResponse);
  }
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private logger = new Logger('AllExceptions');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = uuid();

    const status = 500;
    const errorResponse: ErrorResponse = {
      statusCode: status,
      message: 'Internal Server Error',
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId
    };

    // Log unknown exception
    this.logger.error(
      JSON.stringify({
        requestId,
        method: request.method,
        path: request.url,
        error: exception instanceof Error ? exception.message : String(exception),
        stack: exception instanceof Error ? exception.stack : undefined,
        userId: (request as any).user?.id,
        timestamp: new Date().toISOString()
      })
    );

    response.status(status).json(errorResponse);
  }
}
```

#### Step 2.3: Register exception filter in main.ts
```typescript
// apps/api/src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter, AllExceptionsFilter } from './common/filters';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    })
  );

  // Global exception filters
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalFilters(new HttpExceptionFilter());

  // Enable CORS
  app.enableCors();

  await app.listen(process.env.PORT || 3001);
  console.log(`API running on port ${process.env.PORT || 3001}`);
}

bootstrap();
```

### Testing for Task 2
```typescript
// apps/api/src/common/filters/http-exception.filter.spec.ts
describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockResponse: any;
  let mockRequest: any;

  beforeEach(() => {
    filter = new HttpExceptionFilter();

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    mockRequest = {
      url: '/workflows',
      method: 'GET'
    };
  });

  it('should catch HttpException and return formatted response', () => {
    const exception = new NotFoundException('Workflow not found');
    const host = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest
      })
    } as any;

    filter.catch(exception, host);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 404,
        message: 'Workflow not found',
        path: '/workflows'
      })
    );
  });
});
```

### Files to Create/Modify
- ✅ `apps/api/src/common/exceptions/custom-exceptions.ts` (NEW)
- ✅ `apps/api/src/common/filters/http-exception.filter.ts` (NEW)
- ✅ `apps/api/src/common/filters/index.ts` (NEW)
- ✅ `apps/api/src/main.ts` (MODIFY)

**Effort:** 2 person-days  
**Complexity:** Low-Medium

---

## Task 3: Comprehensive Testing Framework

### Context
**Current State:** No unit or integration tests  
**Goal:** Establish testing patterns for all services

### Implementation Steps

#### Step 3.1: Setup Jest configuration
```typescript
// apps/api/jest.config.ts
import type { Config } from 'jest';

const config: Config = {
  displayName: 'api',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]sx?$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json'
      }
    ]
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../coverage/apps/api',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.module.ts',
    '!src/main.ts',
    '!src/**/*.interface.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
};

export default config;
```

#### Step 3.2: Create test helpers
```typescript
// apps/api/test/helpers/prisma.mock.ts
export const createMockPrismaService = () => ({
  workflow: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  },
  execution: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn()
  },
  // ... other models
});

export const createMockQueueService = () => ({
  addJob: jest.fn().mockResolvedValue({ id: 'job-1' }),
  registerJob: jest.fn().mockResolvedValue(true),
  unregisterJob: jest.fn().mockResolvedValue(true)
});
```

#### Step 3.3: Create service tests
```typescript
// apps/api/src/workflows/workflows.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { WorkflowsService } from './workflows.service';
import { WorkflowsRepository } from './workflows.repository';
import { QueueService } from '../queue/queue.service';
import { SchedulerService } from '../scheduler/scheduler.service';
import { GraphValidator } from '@n8n-clone/workflow-core';
import {
  WorkflowNotFoundError,
  InvalidWorkflowGraphError
} from '../common/exceptions';

describe('WorkflowsService', () => {
  let service: WorkflowsService;
  let repository: WorkflowsRepository;
  let queueService: QueueService;
  let schedulerService: SchedulerService;

  const mockWorkflow = {
    id: 'workflow-1',
    name: 'Test Workflow',
    status: 'INACTIVE',
    workspaceId: 'workspace-1',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkflowsService,
        {
          provide: WorkflowsRepository,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            findByWorkspaceId: jest.fn(),
            update: jest.fn(),
            delete: jest.fn()
          }
        },
        {
          provide: QueueService,
          useValue: {
            addJob: jest.fn(),
            registerJob: jest.fn(),
            unregisterJob: jest.fn()
          }
        },
        {
          provide: SchedulerService,
          useValue: {
            registerWorkflowJobs: jest.fn(),
            unregisterWorkflowJobs: jest.fn()
          }
        },
        {
          provide: GraphValidator,
          useValue: {
            validate: jest.fn()
          }
        }
      ]
    }).compile();

    service = module.get<WorkflowsService>(WorkflowsService);
    repository = module.get<WorkflowsRepository>(WorkflowsRepository);
    queueService = module.get<QueueService>(QueueService);
    schedulerService = module.get<SchedulerService>(SchedulerService);
  });

  describe('create', () => {
    it('should create workflow with initial graph', async () => {
      const createDto = {
        name: 'New Workflow',
        description: 'Test workflow'
      };

      jest
        .spyOn(repository, 'create')
        .mockResolvedValue({ ...mockWorkflow, ...createDto });

      const result = await service.create('workspace-1', createDto);

      expect(repository.create).toHaveBeenCalledWith({
        ...createDto,
        workspaceId: 'workspace-1'
      });
      expect(result.name).toBe('New Workflow');
    });
  });

  describe('findOne', () => {
    it('should return workflow if found', async () => {
      jest
        .spyOn(repository, 'findById')
        .mockResolvedValue(mockWorkflow);

      const result = await service.findOne('workspace-1', 'workflow-1');

      expect(result).toEqual(mockWorkflow);
    });

    it('should throw NotFoundException if workflow not found', async () => {
      jest
        .spyOn(repository, 'findById')
        .mockResolvedValue(null);

      await expect(
        service.findOne('workspace-1', 'workflow-1')
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw error if workflow belongs to different workspace', async () => {
      const otherWorkflow = { ...mockWorkflow, workspaceId: 'other-workspace' };
      jest
        .spyOn(repository, 'findById')
        .mockResolvedValue(otherWorkflow);

      await expect(
        service.findOne('workspace-1', 'workflow-1')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('activate', () => {
    it('should activate workflow and register scheduler jobs', async () => {
      jest
        .spyOn(repository, 'findById')
        .mockResolvedValue(mockWorkflow);
      jest
        .spyOn(repository, 'update')
        .mockResolvedValue({ ...mockWorkflow, status: 'ACTIVE' });

      const result = await service.activate('workspace-1', 'workflow-1');

      expect(repository.update).toHaveBeenCalledWith('workflow-1', {
        status: 'ACTIVE'
      });
      expect(schedulerService.registerWorkflowJobs).toHaveBeenCalledWith(
        mockWorkflow
      );
      expect(result.status).toBe('ACTIVE');
    });
  });

  describe('deactivate', () => {
    it('should deactivate workflow and unregister scheduler jobs', async () => {
      jest
        .spyOn(repository, 'findById')
        .mockResolvedValue({ ...mockWorkflow, status: 'ACTIVE' });
      jest
        .spyOn(repository, 'update')
        .mockResolvedValue({ ...mockWorkflow, status: 'INACTIVE' });

      const result = await service.deactivate('workspace-1', 'workflow-1');

      expect(schedulerService.unregisterWorkflowJobs).toHaveBeenCalled();
      expect(result.status).toBe('INACTIVE');
    });
  });
});
```

#### Step 3.4: Create controller tests
```typescript
// apps/api/src/workflows/workflows.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowsController } from './workflows.controller';
import { WorkflowsService } from './workflows.service';

describe('WorkflowsController', () => {
  let controller: WorkflowsController;
  let service: WorkflowsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkflowsController],
      providers: [
        {
          provide: WorkflowsService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            activate: jest.fn(),
            deactivate: jest.fn()
          }
        }
      ]
    }).compile();

    controller = module.get<WorkflowsController>(WorkflowsController);
    service = module.get<WorkflowsService>(WorkflowsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call service.create with correct params', async () => {
      const createDto = { name: 'Test' };
      const mockUser = { id: 'user-1', workspaceId: 'workspace-1' };

      await controller.create(mockUser as any, createDto);

      expect(service.create).toHaveBeenCalledWith('workspace-1', createDto);
    });
  });
});
```

### Files to Create/Modify
- ✅ `apps/api/jest.config.ts` (NEW)
- ✅ `apps/api/test/helpers/prisma.mock.ts` (NEW)
- ✅ `apps/api/test/helpers/queue.mock.ts` (NEW)
- ✅ `apps/api/src/workflows/workflows.service.spec.ts` (NEW)
- ✅ `apps/api/src/workflows/workflows.controller.spec.ts` (NEW)
- ✅ `apps/api/src/common/filters/http-exception.filter.spec.ts` (NEW)

**Effort:** 2 person-days  
**Complexity:** Medium

---

## Task 4: Swagger API Documentation

### Implementation Steps

#### Step 4.1: Add Swagger to main.ts
```typescript
// apps/api/src/main.ts (ADD SWAGGER)
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('N8N Clone API')
    .setDescription(
      'Workflow Automation Platform - REST API for workflow management'
    )
    .setVersion('1.0.0')
    .addServer('http://localhost:3001', 'Development')
    .addServer('https://api.n8n-clone.com', 'Production')
    .addBearerAuth()
    .addTag('workflows', 'Workflow management')
    .addTag('executions', 'Workflow execution tracking')
    .addTag('credentials', 'Credential management')
    .addTag('webhooks', 'Webhook endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Rest of bootstrap
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true
    })
  );

  await app.listen(process.env.PORT || 3001);
  console.log(`API running on port ${process.env.PORT || 3001}`);
  console.log(`Swagger docs available at http://localhost:3001/api/docs`);
}

bootstrap();
```

#### Step 4.2: Add decorators to controllers
```typescript
// apps/api/src/workflows/workflows.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  HttpCode
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WorkflowsService } from './workflows.service';
import { CreateWorkflowDto, UpdateWorkflowDto, WorkflowDto } from './dto';

@ApiTags('workflows')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('workflows')
export class WorkflowsController {
  constructor(private workflowsService: WorkflowsService) {}

  @Post()
  @HttpCode(201)
  @ApiOperation({
    summary: 'Create a new workflow',
    description: 'Creates a new workflow with an initial manual trigger node'
  })
  @ApiBody({ type: CreateWorkflowDto })
  @ApiResponse({
    status: 201,
    description: 'Workflow created successfully',
    type: WorkflowDto
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(@Req() req: any, @Body() createDto: CreateWorkflowDto) {
    return this.workflowsService.create(req.user.workspaceId, createDto);
  }

  @Get()
  @ApiOperation({
    summary: 'List all workflows',
    description: 'Get all workflows in the current workspace'
  })
  @ApiResponse({
    status: 200,
    description: 'List of workflows',
    type: [WorkflowDto]
  })
  findAll(@Req() req: any) {
    return this.workflowsService.findAll(req.user.workspaceId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get workflow details',
    description: 'Get detailed information about a specific workflow'
  })
  @ApiParam({ name: 'id', description: 'Workflow ID' })
  @ApiResponse({
    status: 200,
    description: 'Workflow details',
    type: WorkflowDto
  })
  @ApiResponse({ status: 404, description: 'Workflow not found' })
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.workflowsService.findOne(req.user.workspaceId, id);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update workflow',
    description: 'Update workflow name, description, or graph'
  })
  @ApiParam({ name: 'id', description: 'Workflow ID' })
  @ApiBody({ type: UpdateWorkflowDto })
  @ApiResponse({
    status: 200,
    description: 'Workflow updated',
    type: WorkflowDto
  })
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() updateDto: UpdateWorkflowDto
  ) {
    return this.workflowsService.update(req.user.workspaceId, id, updateDto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Delete workflow',
    description: 'Delete a workflow (must be inactive)'
  })
  @ApiParam({ name: 'id', description: 'Workflow ID' })
  @ApiResponse({ status: 204, description: 'Workflow deleted' })
  @ApiResponse({
    status: 400,
    description: 'Workflow is active'
  })
  @ApiResponse({ status: 404, description: 'Workflow not found' })
  delete(@Req() req: any, @Param('id') id: string) {
    return this.workflowsService.delete(req.user.workspaceId, id);
  }

  @Post(':id/activate')
  @ApiOperation({
    summary: 'Activate workflow',
    description: 'Activate a workflow to start executing on triggers'
  })
  @ApiParam({ name: 'id', description: 'Workflow ID' })
  @ApiResponse({
    status: 200,
    description: 'Workflow activated',
    type: WorkflowDto
  })
  activate(@Req() req: any, @Param('id') id: string) {
    return this.workflowsService.activate(req.user.workspaceId, id);
  }

  @Post(':id/deactivate')
  @ApiOperation({
    summary: 'Deactivate workflow',
    description: 'Deactivate a workflow to stop executing'
  })
  @ApiParam({ name: 'id', description: 'Workflow ID' })
  @ApiResponse({
    status: 200,
    description: 'Workflow deactivated',
    type: WorkflowDto
  })
  deactivate(@Req() req: any, @Param('id') id: string) {
    return this.workflowsService.deactivate(req.user.workspaceId, id);
  }
}
```

#### Step 4.3: Create DTOs with Swagger decorators
```typescript
// apps/api/src/workflows/dto/workflow.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { WorkflowGraph } from '@n8n-clone/shared-types';

export class WorkflowDto {
  @ApiProperty({
    description: 'Workflow ID',
    example: 'workflow-1'
  })
  id: string;

  @ApiProperty({
    description: 'Workflow name',
    example: 'Email Notification'
  })
  name: string;

  @ApiProperty({
    description: 'Workflow description',
    required: false
  })
  description?: string;

  @ApiProperty({
    enum: ['ACTIVE', 'INACTIVE'],
    description: 'Workflow status'
  })
  status: string;

  @ApiProperty({
    description: 'Workspace ID',
    example: 'workspace-1'
  })
  workspaceId: string;

  @ApiProperty({
    type: Object,
    description: 'Workflow graph structure'
  })
  graph: WorkflowGraph;

  @ApiProperty({
    description: 'Creation timestamp'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp'
  })
  updatedAt: Date;
}

export class CreateWorkflowDto {
  @ApiProperty({
    description: 'Workflow name',
    example: 'Email Notification'
  })
  name: string;

  @ApiProperty({
    description: 'Workflow description',
    required: false
  })
  description?: string;
}

export class UpdateWorkflowDto {
  @ApiProperty({
    description: 'Workflow name',
    required: false
  })
  name?: string;

  @ApiProperty({
    description: 'Workflow description',
    required: false
  })
  description?: string;

  @ApiProperty({
    type: Object,
    description: 'Workflow graph structure',
    required: false
  })
  graph?: WorkflowGraph;
}
```

### Files to Create/Modify
- ✅ `apps/api/src/main.ts` (MODIFY - add Swagger)
- ✅ `apps/api/src/workflows/workflows.controller.ts` (MODIFY - add decorators)
- ✅ `apps/api/src/workflows/dto/workflow.dto.ts` (NEW)
- ✅ Similar for other controllers (executions, credentials, etc.)

**Effort:** 2 person-days  
**Complexity:** Low

---

## Task 5: Environment Configuration Templates

### Files to Create
```bash
# Root
.env.example

# Apps
apps/api/.env.example
apps/web/.env.example
apps/worker/.env.example
```

### Content
```env
# .env.example (root)
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/n8n_clone?schema=public"

# Redis
REDIS_HOST="localhost"
REDIS_PORT=6379
REDIS_PASSWORD=""

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRATION="7d"

# Encryption
MASTER_KEY="your-super-secret-master-key-32-chars"

# API
API_PORT=3001
API_HOST="localhost"

# Frontend
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_WS_URL="ws://localhost:3001"

# Monitoring
LOG_LEVEL="debug"
```

---

## Summary

### Phase 1 Deliverables
- ✅ Repository pattern for all services
- ✅ Custom exception hierarchy
- ✅ Centralized error handling
- ✅ Jest testing framework
- ✅ Swagger/OpenAPI documentation
- ✅ Environment configuration templates

### Quality Metrics
- Code coverage: 70%+
- Zero critical issues
- All services follow consistent patterns
- API fully documented

### Success Criteria
- [ ] All repositories implemented
- [ ] Services use repositories (no Prisma in services)
- [ ] Exception filter catches all errors
- [ ] Error logging working
- [ ] 50+ unit tests passing
- [ ] Swagger UI loads at /api/docs
- [ ] All required env variables documented

---

**Effort Breakdown:**
- Task 1 (Repository Pattern): 3 days
- Task 2 (Error Handling): 2 days
- Task 3 (Testing): 2 days
- Task 4 (Swagger): 1 day (mostly configuration)

**Total:** 8 person-days

---

**Next:** Proceed to Phase 2 (Performance Optimization)
