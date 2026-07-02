# Phase 3: UI/UX Enhancement

**Duration:** Weeks 5-7  
**Priority:** 🟡 HIGH  
**Effort:** 12 person-days  
**Parallel with:** Phase 2 (mostly independent)

---

## Overview

Transform UI from functional to engaging with real-time collaboration, advanced visualization, dark mode, and execution insights dashboard.

---

## Tasks

### Task 1: Real-Time Collaboration (4 days)

**Architecture:**
```typescript
// apps/web/src/features/collaboration/use-collaborative-edit.ts
import { io } from 'socket.io-client';

export function useCollaborativeEdit(workflowId: string) {
  const [state, dispatch] = useReducer(editorReducer, initialState);
  const socketRef = useRef<Socket>(null);

  useEffect(() => {
    socketRef.current = io('/editor', {
      query: { workflowId, userId: currentUser.id },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    socketRef.current.on('workflow:updated', (delta) => {
      dispatch({ type: 'APPLY_REMOTE_CHANGE', payload: delta });
    });

    socketRef.current.on('user:joined', (user) => {
      dispatch({ type: 'ADD_COLLABORATOR', payload: user });
    });

    return () => socketRef.current?.disconnect();
  }, [workflowId]);

  const updateNode = (nodeId: string, updates: Partial<Node>) => {
    socketRef.current?.emit('node:update', { nodeId, updates });
    dispatch({ type: 'UPDATE_NODE', payload: { nodeId, updates } });
  };

  return { state, updateNode, collaborators: state.collaborators };
}
```

**Files:**
- `apps/web/src/features/collaboration/` (NEW)
- `apps/api/src/websocket/` (NEW)
- `apps/web/src/components/editor/collaborators-list.tsx` (NEW)

---

### Task 2: Advanced Workflow Visualization (4 days)

**Features:**
```typescript
// apps/web/src/components/workflow-renderer/advanced-renderer.tsx
export function AdvancedWorkflowRenderer({ graph, execution }: Props) {
  return (
    <div className="relative">
      {/* Performance metrics overlay */}
      <PerformanceMetricsOverlay metrics={execution.metrics} />
      
      {/* Interactive nodes with status */}
      <ReactFlowProvider>
        <ReactFlow 
          nodes={nodes.map(n => ({
            ...n,
            data: {
              ...n.data,
              status: execution.nodeStates[n.id],
              duration: execution.nodeDurations[n.id],
              isSelected: selectedNode === n.id
            }
          }))}
          edges={edges}
          onNodeClick={(e, node) => setSelectedNode(node.id)}
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </ReactFlowProvider>

      {/* Step-by-step execution timeline */}
      <ExecutionTimeline execution={execution} />
      
      {/* Branch visualization */}
      <BranchVisualization graph={graph} execution={execution} />
    </div>
  );
}
```

**Files:**
- `apps/web/src/components/workflow-renderer/advanced-renderer.tsx` (NEW)
- `apps/web/src/components/execution-timeline/` (NEW)
- `apps/web/src/components/branch-visualizer/` (NEW)
- React Flow integrations

---

### Task 3: Dark Mode & Theme System (2 days)

**Implementation:**
```typescript
// apps/web/src/theme/theme-provider.tsx
import { createContext, useContext } from 'react';

type Theme = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: Props) {
  const [theme, setTheme] = useLocalStorage<Theme>('theme', 'auto');
  const isDark = theme === 'dark' || 
    (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
```

**Tailwind Configuration:**
```javascript
// apps/web/tailwind.config.js
module.exports = {
  darkMode: 'class',
  theme: {
    colors: {
      // Light mode
      light: {
        bg: '#ffffff',
        text: '#1f2937'
      },
      // Dark mode
      dark: {
        bg: '#111827',
        text: '#f3f4f6'
      }
    }
  }
};
```

**Files:**
- `apps/web/src/theme/theme-provider.tsx` (NEW)
- `apps/web/tailwind.config.js` (MODIFY)
- Component updates for dark mode

---

### Task 4: Execution Insights Dashboard (2 days)

**Components:**
```typescript
// apps/web/src/features/insights/execution-metrics.tsx
export function ExecutionMetrics({ workflowId }: Props) {
  const { data: metrics } = useQuery(
    ['execution-metrics', workflowId],
    () => api.getExecutionMetrics(workflowId),
    { refetchInterval: 5000 }
  );

  return (
    <div className="grid grid-cols-4 gap-4">
      {/* Success rate */}
      <Card>
        <h3>Success Rate</h3>
        <PercentageChart value={metrics.successRate} />
      </Card>

      {/* Average duration */}
      <Card>
        <h3>Avg Duration</h3>
        <DurationChart data={metrics.durations} />
      </Card>

      {/* Error frequency */}
      <Card>
        <h3>Errors (24h)</h3>
        <BarChart data={metrics.errorFrequency} />
      </Card>

      {/* Execution timeline */}
      <Card>
        <h3>Timeline</h3>
        <TimelineChart data={metrics.timeline} />
      </Card>
    </div>
  );
}
```

**API Endpoint:**
```typescript
// apps/api/src/executions/executions.controller.ts
@Get(':workflowId/metrics')
@ApiOperation({ summary: 'Get execution metrics' })
async getMetrics(@Param('workflowId') workflowId: string) {
  return this.executionsService.getMetrics(workflowId);
}
```

**Files:**
- `apps/web/src/features/insights/` (NEW)
- `apps/api/src/executions/executions.service.ts` (MODIFY)

---

### Task 5: Enhanced Editor UX (2 days)

**Improvements:**
- [ ] Auto-save with debouncing
- [ ] Undo/Redo functionality
- [ ] Keyboard shortcuts
- [ ] Node search & quick add
- [ ] Validation feedback
- [ ] Copy/paste nodes
- [ ] Node groups

**Files:**
- `apps/web/src/features/editor/use-editor-actions.ts` (NEW)
- `apps/web/src/components/node-palette/` (NEW)
- Keyboard bindings setup

---

## Success Criteria

- [ ] Multi-user editing works smoothly
- [ ] Real-time updates sync < 200ms latency
- [ ] Advanced visualization renders performance metrics
- [ ] Dark mode fully functional
- [ ] Insights dashboard shows real-time data
- [ ] All new features have E2E tests
- [ ] Mobile responsive design working

---

## Dependencies

- Phase 1 (error handling for WebSocket)
- Phase 2 (performance optimization)

---

## Next Phase

→ Phase 4: Security & DevOps
