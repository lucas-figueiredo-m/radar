# Radar - Project Report

## What Is Radar

Radar is an Electron desktop app that replaces the fragmented ecosystem of React Native debugging tools (React DevTools, Flipper, Reactotron, Xcode Instruments, Android Profiler) with a single, cohesive interface.

## Architecture

```
React Native App
    │  @radar/devtools patches console, fetch, React fiber
    ▼
WebSocket (port 8347)
    │  JSON messages: console, network, componentTree, profiler, metadata
    ▼
Electron Main Process
    │  Stamps messages with deviceId, routes via IPC
    ▼
React Renderer (UI)
    │  Custom hooks per feature, multi-device filtering
    ▼
5-Tab Interface: Console │ Network │ Component Tree │ Profiler │ DevTools
```

### Monorepo Structure

```
radar/
├── apps/
│   ├── app/                    # Electron desktop application (main DevTools UI)
│   └── example/                # React Native test app
├── packages/
│   ├── types/                  # Shared wire protocol type definitions
│   ├── devtools/               # Client SDK (runs in target React Native app)
│   └── designSystem/           # Shared UI tokens and design system
```

### Key Technical Details

- SDK monkey-patches `console.*` and `global.fetch` to intercept calls
- Hooks into `__REACT_DEVTOOLS_GLOBAL_HOOK__` for fiber tree access and profiling
- WebSocket with auto-reconnect (3s) and message queue (1000 max) for resilience
- Multi-device support - each device gets a unique ID, UI filters per selected device
- Bidirectional communication: commands flow back to the device (start/stop profiling, inspect component, etc.)
- Tech stack: React 19, TypeScript, Tailwind CSS v4, Vite, Electron 34, Bun

---

## Current Features (What's Implemented)

### Console (Phase 1 - Complete)

- Captures `log`, `warn`, `error`, `debug` with full serialization
- Custom recursive serializer handling Functions, Symbols, BigInt, circular references, React elements, Errors with stack traces
- Syntax-highlighted values (strings, numbers, booleans, null each color-coded)
- Consecutive log grouping with count badges
- Time gap separators between log bursts
- Collapsible objects/arrays with interactive expansion (up to 10 levels deep)
- Copy-to-clipboard on hover
- Auto-scroll, level filtering with counts

### Network (Phase 1 - Complete)

- Intercepts all `fetch` calls with full request/response capture
- Headers, body (JSON parsed), status, duration
- Two-panel UI: request list + detail panel
- Color-coded methods (GET=cyan, POST=green, DELETE=red) and status codes
- Up to 2000 requests tracked per device

### Component Tree (Phase 1 - Complete)

- Walks React fiber tree on every commit
- Collapsible hierarchical display with regex search and navigation
- File filter dropdown
- Component Inspector: props, hooks, rendered-by chain, source file location
- Source tracing: click to open in VS Code/Cursor/etc.
- Style inspection: resolves memoizedProps.style and StyleSheet references

### Profiler (Phase 2 - In Progress)

- Canvas-based flamegraph with zoom/animation
- Ranked view and aggregate stats table
- Captures actualDuration, selfBaseDuration, treeBaseDuration per component
- Phase detection: mount vs update vs did-not-render
- Render trigger analysis: identifies WHY a component re-rendered
- Commit timeline with color gradient

### Device Management (Phase 1 - Complete)

- Polls for iOS simulators and Android emulators every 2s
- Multi-device support with selector dropdown
- Platform badges, connection status indicators

---

## Differentiators vs Alternatives

| Feature | Radar | React DevTools | Flipper | Reactotron |
|---------|-------|---------------|---------|------------|
| Console with rich serialization | Yes (recursive) | N/A | Basic | Basic |
| Network inspection | Fetch + detail panel | N/A | Plugin-based | Yes |
| Component tree + inspection | Fiber-based + source | Yes (web-only) | Plugin | No |
| Profiler with render triggers | Flamegraph + "why?" | Basic | No | No |
| Style inspection | StyleSheet resolution | No | Plugin | No |
| Unified single tool | All-in-one | Component-only | Plugin ecosystem | Limited |
| Source code integration | Click to open editor | No | No | No |
| Multi-device | Full support | No | Yes | Limited |

---

## Roadmap (from Linear)

### Phase 1 - Foundation (100% Complete)
18 issues done: Electron shell, SDK, WebSocket, console viewer, network table, monorepo, device detection, component tree, log grouping, stack traces, time gaps, syntax highlighting, copy action.

### Phase 2 - Core Features (15% In Progress)
- Simulator/emulator embedding with input forwarding
- Tap-to-inspect on embedded device view
- XHR interception (currently only fetch)
- Console input prompt (eval in running app)
- Source file indicators on console entries
- Storage inspector (AsyncStorage, MMKV)
- Dashboard layout mode

### Phase 3 - Native & Advanced (22% Done)
- Native metrics dashboard (memory, CPU, FPS)
- Sourcemap service for stack traces
- SQLite query execution
- Crash/ANR detection
- Native network interceptors (OkHttp + URLProtocol)
- Full CDP debugger (breakpoints, step-through)

### Phase 4 - AI Integration (0%)
- MCP server exposing all devtool data as tools
- Local LLM connection via terminal process
- Embedded chat UI with contextual awareness
- Quick action prompts
- Tool usage visualization

### Phase 5 - Polish & Monetization (0%)
- Settings UI, keyboard shortcuts, onboarding
- Layout presets, multi-monitor support
- Freemium: Personal $9/mo, Team $14/mo per seat

---

## Linear Ticket Summary

- **Total Issues**: 51
- **Done**: 18
- **In Progress**: 2 (TRO-17 custom serializer, TRO-18 profiler)
- **Backlog**: 6 (including 1 bug: TRO-51 profiler children display)
- **Todo**: 24
- **Active Bug**: TRO-51 - Profiler incorrectly shows children as "did-not-render"
