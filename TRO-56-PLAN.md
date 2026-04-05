# TRO-56 Implementation Plan: In-Memory Database + Virtualized Lists

## Executive Summary

Replace all `useState`-based data storage with an in-memory **better-sqlite3** database running in Electron's main process, and add **@tanstack/react-virtual** for list virtualization. This decouples data from the React render cycle, enables efficient SQL-based querying (MCP-ready), and eliminates DOM bloat from large lists.

---

## Database Choice: `better-sqlite3` with `:memory:`

| Criteria | better-sqlite3 | sql.js (WASM) | LokiJS |
|----------|----------------|---------------|--------|
| Performance | Native C++ bindings, fastest | WASM overhead | Fast but no SQL |
| SQL support | Full SQLite | Full SQLite | No SQL (document DB) |
| MCP-ready | SQL queries directly | SQL queries directly | Custom query API |
| Memory-only | `:memory:` flag | `:memory:` flag | In-memory default |
| Electron fit | Runs in main process natively | Runs anywhere (WASM) | Runs anywhere |
| API style | Synchronous (simpler) | Async (WASM) | Sync |

**Winner: `better-sqlite3`** - native performance, synchronous API, full SQL for MCP, zero disk I/O with `:memory:`.

---

## Database Schema (7 tables)

### Table 1: `console_logs`

```sql
CREATE TABLE console_logs (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id       TEXT NOT NULL,
  level           TEXT NOT NULL CHECK (level IN ('log', 'warn', 'error', 'debug')),
  args            TEXT NOT NULL,  -- JSON serialized unknown[]
  timestamp       INTEGER NOT NULL,  -- device-side Date.now()
  db_created_at   INTEGER NOT NULL DEFAULT (unixepoch('now','subsec') * 1000)
);
CREATE INDEX idx_console_device_ts ON console_logs(device_id, timestamp);
CREATE INDEX idx_console_level ON console_logs(device_id, level);
```

### Table 2: `network_requests`

```sql
CREATE TABLE network_requests (
  id                  TEXT PRIMARY KEY,  -- req_N format from device
  device_id           TEXT NOT NULL,
  method              TEXT NOT NULL,
  url                 TEXT NOT NULL,
  request_headers     TEXT,  -- JSON
  request_body        TEXT,  -- JSON
  graphql_type        TEXT CHECK (graphql_type IN ('query', 'mutation')),
  graphql_name        TEXT,
  status              INTEGER,
  status_text         TEXT,
  response_headers    TEXT,  -- JSON
  response_body       TEXT,  -- JSON
  duration            REAL,
  pending             INTEGER NOT NULL DEFAULT 1,
  timestamp           INTEGER NOT NULL,  -- device-side request start
  response_timestamp  INTEGER,           -- device-side response received
  db_created_at       INTEGER NOT NULL DEFAULT (unixepoch('now','subsec') * 1000),
  db_updated_at       INTEGER NOT NULL DEFAULT (unixepoch('now','subsec') * 1000)
);
CREATE INDEX idx_network_device_ts ON network_requests(device_id, timestamp);
CREATE INDEX idx_network_method ON network_requests(device_id, method);
CREATE INDEX idx_network_status ON network_requests(device_id, status);
CREATE INDEX idx_network_graphql ON network_requests(device_id, graphql_type);
```

### Table 3: `component_trees`

```sql
CREATE TABLE component_trees (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id       TEXT NOT NULL,
  session_id      INTEGER NOT NULL DEFAULT 1,
  root_nodes      TEXT NOT NULL,  -- JSON serialized ComponentTreeNode[]
  timestamp       INTEGER NOT NULL,
  db_created_at   INTEGER NOT NULL DEFAULT (unixepoch('now','subsec') * 1000)
);
CREATE INDEX idx_tree_device ON component_trees(device_id, timestamp);
```

### Table 4: `inspected_components`

```sql
CREATE TABLE inspected_components (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id       TEXT NOT NULL,
  session_id      INTEGER NOT NULL DEFAULT 1,
  component_id    TEXT NOT NULL,
  data            TEXT NOT NULL,  -- JSON serialized InspectedComponentData
  timestamp       INTEGER NOT NULL,
  db_created_at   INTEGER NOT NULL DEFAULT (unixepoch('now','subsec') * 1000)
);
CREATE UNIQUE INDEX idx_inspected_device_component ON inspected_components(device_id, component_id);
```

### Table 5: `profiler_sessions`

```sql
CREATE TABLE profiler_sessions (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id       TEXT NOT NULL,
  session_id      INTEGER NOT NULL DEFAULT 1,
  timestamp       INTEGER NOT NULL,  -- device-side when session ended
  db_created_at   INTEGER NOT NULL DEFAULT (unixepoch('now','subsec') * 1000)
);
CREATE INDEX idx_profiler_session_device ON profiler_sessions(device_id);
```

### Table 6: `profiler_commits`

```sql
CREATE TABLE profiler_commits (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  profiler_session_id INTEGER NOT NULL REFERENCES profiler_sessions(id) ON DELETE CASCADE,
  device_id           TEXT NOT NULL,
  session_id          INTEGER NOT NULL DEFAULT 1,
  commit_index        INTEGER NOT NULL,
  timestamp           INTEGER NOT NULL,  -- device-side commit time
  duration            REAL NOT NULL,
  components          TEXT NOT NULL,  -- JSON serialized ProfilerComponentData[]
  db_created_at       INTEGER NOT NULL DEFAULT (unixepoch('now','subsec') * 1000)
);
CREATE INDEX idx_commit_session ON profiler_commits(profiler_session_id);
CREATE INDEX idx_commit_device_ts ON profiler_commits(device_id, timestamp);
```

### Table 7: `performance_metrics`

```sql
CREATE TABLE performance_metrics (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id       TEXT NOT NULL,
  session_id      INTEGER NOT NULL DEFAULT 1,
  js_fps          REAL NOT NULL,
  ui_fps          REAL,
  ram             REAL,
  dropped_frames  INTEGER NOT NULL,
  gc_events       INTEGER NOT NULL,
  timestamp       INTEGER NOT NULL,  -- device-side sample time
  db_created_at   INTEGER NOT NULL DEFAULT (unixepoch('now','subsec') * 1000)
);
CREATE INDEX idx_perf_device_ts ON performance_metrics(device_id, timestamp);
```

### Design Decisions

- **`device_id` on every table**: Required for multi-device support and future combined panels
- **`session_id` (default 1)**: On `component_trees`, `inspected_components`, `profiler_sessions`, `profiler_commits`, `performance_metrics` — hardcoded to 1 for now, ready for future benchmark comparison mode where users can run multiple test sessions and compare results
- **`timestamp` (from device)**: Always present — this is the WebSocket timestamp from the device
- **`db_created_at`**: Database-level timestamp for ordering/auditing (SQLite default)
- **`db_updated_at`**: Only on tables that get updated (`network_requests`)
- **JSON columns**: Complex nested data (args, headers, bodies, tree nodes) stored as JSON text — SQLite's `json_extract()` enables querying into them
- **Separate `profiler_commits` table**: Denormalized from sessions for per-commit querying
- **GraphQL fields flattened**: `graphql_type` and `graphql_name` extracted from nested object for direct SQL filtering
- **No `devices` table**: Device state is real-time and transient (detected/connected/offline with timers) — doesn't belong in the DB. Device identification is via `device_id` FK on all data tables.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Electron Main Process                     │
│                                                              │
│  WebSocket Server ──→ Database Layer (better-sqlite3 :memory:)
│       │                    │                                 │
│       │              ┌─────┴──────┐                         │
│       │              │  7 Tables  │                         │
│       │              └─────┬──────┘                         │
│       │                    │                                 │
│  IPC Bridge ←──────── Query API ──────→ Future MCP Server   │
│       │                                                      │
└───────┼──────────────────────────────────────────────────────┘
        │
┌───────┼──────────────────────────────────────────────────────┐
│       │              Electron Renderer                        │
│       ▼                                                      │
│  IPC Client (subscribe/query)                                │
│       │                                                      │
│  React Hooks (useConsoleQuery, useNetworkQuery, etc.)        │
│       │                                                      │
│  Virtualized Lists (@tanstack/react-virtual)                 │
│       │                                                      │
│  UI Components (ConsolePanel, NetworkPanel, etc.)            │
└──────────────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

1. **Database lives in Electron main process** — better-sqlite3 is a native Node module, runs in main process only
2. **IPC bridge for renderer access** — Renderer queries DB via IPC channels, receives results
3. **Subscription model** — Renderer subscribes to data changes (e.g., "new console log for device X"), DB notifies via IPC push
4. **No React state for raw data** — Hooks hold query results only, not the full dataset
5. **Query API is the MCP interface** — Same SQL/query layer serves both UI and future MCP server

---

## New Package: `packages/database`

```
packages/database/
├── package.json          # @radar/database, deps: better-sqlite3, @radar/types
├── tsconfig.json
└── src/
    ├── index.ts          # Barrel export
    ├── createDatabase.ts # Init DB, create tables, return RadarDatabase instance
    ├── schema.ts         # Table creation SQL
    ├── types.ts          # Query result types, insert types
    └── repositories/
        ├── index.ts
        ├── consoleRepository.ts
        ├── networkRepository.ts
        ├── componentTreeRepository.ts
        ├── inspectedComponentRepository.ts
        ├── profilerRepository.ts
        └── performanceRepository.ts
```

Each repository exposes:
- `insert(data)` — Insert new record(s)
- `query(filters)` — Filtered query with pagination
- `count(filters)` — Count matching records
- `clear(deviceId)` — Clear data for a device
- `clearAll()` — Clear all data

---

## Implementation Phases

### Phase 1: Database Layer (`packages/database`) ✅ DONE

1. ✅ Created `packages/database` package with `better-sqlite3` dependency
2. ✅ Implemented `createDatabase()` that initializes `:memory:` SQLite and creates all 7 tables
3. ✅ Implemented all 6 repository modules with typed insert/query/clear operations
4. ✅ Added to workspace references
5. ✅ 19 passing tests

### Phase 2: Electron Main Process Integration ✅ DONE

1. ✅ `apps/app/electron/database.ts` — Initialize database on app start, export singleton
2. ✅ Modified `websocketServer.ts` — On message received, insert into DB before forwarding via IPC
   - Console messages → `consoleRepository.insert()`
   - Network messages → `networkRepository.insertRequest()` / `.updateResponse()`
   - Component tree → `componentTreeRepository.insert()`
   - Profiler → `profilerRepository.insertSession()` + `.insertCommit()`
   - Performance → `performanceRepository.insert()`
   - Inspect component → `inspectedComponentRepository.upsert()`
3. ✅ New IPC channels (17 handlers):
   - `radar:db:console:query` / `count` / `clear`
   - `radar:db:network:query` / `count` / `getById` / `clear`
   - `radar:db:componentTree:getLatest` / `clear`
   - `radar:db:profiler:getSessions` / `getCommitsBySession` / `getLatestSession` / `clear`
   - `radar:db:performance:query` / `count` / `clear`
   - `radar:db:inspectedComponent:getByComponentId` / `clear`
4. ✅ Kept `radar:message` IPC for backward compatibility

### Phase 3: Renderer-Side Database Client ✅ DONE

1. ✅ `apps/app/src/services/databaseClient.ts` — IPC wrapper with typed query/clear methods
2. ✅ Exported from services barrel

### Phase 4: List Virtualization ✅ DONE

1. ✅ Installed `@tanstack/react-virtual` in `apps/app`
2. ✅ **`ConsolePanel`** — Replaced `.map()` with `useVirtualizer`:
   - Flat virtual item list (gap separators + group rows + expanded sub-entries)
   - Dynamic row measurement via `measureElement` for variable heights
   - Smart auto-scroll: tracks "is at bottom" state, only scrolls when user is already at bottom
   - Preserves time gap separators, expand/collapse groups, copy button
3. ✅ **`NetworkPanel`** — Replaced `.map()` with `useVirtualizer`:
   - Fixed row height (35px)
   - Sticky header moved outside virtualizer
   - Preserves selection + detail panel
   - Smart auto-scroll (disabled when request is selected)
4. **Skipped**: ProfilerPanel (RankedView, ComponentStats) and ComponentTreePanel
   - These lists are typically 50-200 items (single commit or visible tree nodes)
   - DOM cost of ~200 nodes is negligible
   - ComponentTreePanel already uses `memo()` and only renders expanded branches
   - Added complexity (tree flattening, scroll sync) isn't justified for these list sizes

### Phase 5: Hook Migration & Cleanup (TODO)

1. **New DB-backed hooks** replacing useState hooks:
   - `useConsoleQuery(deviceId, filter, pagination)` → replaces `useConsoleLogs`
   - `useNetworkQuery(deviceId, filter, pagination)` → replaces `useNetworkRequests`
   - `useComponentTreeQuery(deviceId)` → replaces `useComponentTree`
   - `useProfilerQuery(deviceId, sessionId)` → replaces `useProfiler`
   - `usePerformanceQuery(deviceId, timeRange)` → replaces `usePerformanceMetrics`
2. **Subscription pattern**: Hooks subscribe to DB change notifications, re-query on new data
3. **Pagination support**: Hooks accept offset/limit for virtualized list integration
4. **Update `App.tsx`** — Remove old hooks, wire new query hooks
5. **Remove old hooks**: `useConsoleLogs.ts`, `useNetworkRequests.ts`, etc.
6. **Remove `MAX_LOGS`/`MAX_REQUESTS` constants** — DB handles storage, no need for array slicing
7. **Update clear button handlers** — Call `databaseClient.clear(deviceId, table)`
8. **Update filter UI** — Filters become SQL WHERE clauses, not JS `array.filter()`
9. **Update StatusBar counts** — Use `databaseClient.count()` instead of `array.length`
10. **Profiler reload** — On "Reload and Profile", DELETE from `profiler_commits` and `profiler_sessions` for the current device before starting fresh

### Phase 6: Query API for MCP (TODO)

1. `queryApi.ts` exposes a clean interface:
   ```typescript
   type QueryApi = {
     console: { query, count, clear }
     network: { query, count, clear }
     componentTree: { query, clear }
     profiler: { query, clear }
     performance: { query, clear }
     devices: { list, get }
     raw: (sql: string, params: unknown[]) => unknown[]  // For MCP power users
   }
   ```
2. This is the same API the MCP server will import and use directly
3. No additional work needed when MCP is built — it just imports `@radar/database`

---

## Files Created

| File | Purpose |
|------|---------|
| `packages/database/package.json` | Package config |
| `packages/database/tsconfig.json` | TypeScript config |
| `packages/database/src/index.ts` | Barrel export |
| `packages/database/src/createDatabase.ts` | DB initialization |
| `packages/database/src/createDatabase.test.ts` | 19 tests |
| `packages/database/src/schema.ts` | Table DDL statements |
| `packages/database/src/types.ts` | Insert/query result types |
| `packages/database/src/repositories/index.ts` | Repository barrel |
| `packages/database/src/repositories/consoleRepository.ts` | Console CRUD |
| `packages/database/src/repositories/networkRepository.ts` | Network CRUD |
| `packages/database/src/repositories/componentTreeRepository.ts` | Component tree CRUD |
| `packages/database/src/repositories/inspectedComponentRepository.ts` | Inspected component CRUD |
| `packages/database/src/repositories/profilerRepository.ts` | Profiler CRUD |
| `packages/database/src/repositories/performanceRepository.ts` | Performance CRUD |
| `apps/app/electron/database.ts` | Main process DB singleton |
| `apps/app/src/services/databaseClient.ts` | Renderer IPC client |

## Files Modified

| File | Changes |
|------|---------|
| `apps/app/package.json` | Added `@radar/database`, `better-sqlite3`, `@types/better-sqlite3` |
| `apps/app/electron/websocketServer.ts` | Persists every message to DB before IPC forward |
| `apps/app/electron/main.ts` | Initializes DB, registers 17 IPC query handlers, closes DB on quit |
| `apps/app/vite.config.ts` | Added `better-sqlite3` to Electron externals |
| `apps/app/src/services/index.ts` | Added `databaseClient` export |

## Files to Delete (Phase 5)

| File | Reason |
|------|--------|
| `apps/app/src/hooks/useConsoleLogs.ts` | Replaced by DB-backed hook |
| `apps/app/src/hooks/useNetworkRequests.ts` | Replaced by DB-backed hook |
| `apps/app/src/hooks/constants.ts` | MAX_LOGS/MAX_REQUESTS no longer needed |

---

## Risk Mitigation

- **better-sqlite3 native module**: Needs electron-rebuild. Add `"postinstall": "electron-rebuild"` or configure electron-builder's native module support
- **Variable row heights in ConsolePanel**: Use `@tanstack/react-virtual`'s dynamic measurement with `measureElement`
- **Grouping with virtualization**: Pre-compute groups, virtualize the group list (each group = one virtual item)
- **Auto-scroll preservation**: Track "is at bottom" state, auto-scroll only when user is already at bottom
- **Memory growth**: Implement configurable max row limits per table with `DELETE FROM ... ORDER BY timestamp ASC LIMIT (count - max)` cleanup queries
