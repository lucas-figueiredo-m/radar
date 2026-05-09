<p align="center">
  <h1 align="center">Radar</h1>
  <p align="center">Unified DevTools for React Native</p>
  <p align="center">Built by <a href="https://www.figueiredolucas.com.br">Lucas Figueiredo</a></p>
</p>

Radar replaces the fragmented React Native debugging ecosystem (React DevTools, Flipper, Reactotron, Xcode Instruments, Android Profiler) with a single desktop app. One tool, every debugging panel, plus AI integration via MCP.

## Features

- **Console** - Log viewer with recursive serialization, syntax highlighting, collapsible objects, and log grouping
- **Network** - Fetch + XHR interception with full request/response inspection and GraphQL detection
- **Component Tree** - React fiber tree explorer with props/hooks inspection, source tracing, and editor integration
- **Profiler** - Flamegraph and ranked views with render trigger analysis and commit timeline
- **Performance** - Real-time native metrics (UI FPS, CPU, RAM, JS Heap) with startup timing (TTI)
- **State Management** - Redux and Zustand store inspection with live snapshots, action history, and state diffs
- **Storage** - AsyncStorage and MMKV browser with in-place editing and multi-instance support
- **AI Integration** - MCP server exposing 18 tools for AI-assisted debugging with any MCP-compatible client

## Quick Start

### 1. Download Radar

Get the latest release from [GitHub Releases](https://github.com/lucas-figueiredo-m/radar-releases/releases/latest).

### 2. Install the SDK

```bash
bun add -d radar-devtools
```

### 3. Initialize in your app

```typescript
import { init } from 'radar-devtools'

if (__DEV__) {
  init({
    // Optional: configure state management
    stores: {
      myReduxStore: { type: 'redux', store: reduxStore },
      myZustandStore: { type: 'zustand', store: useMyStore },
    },
  })
}
```

Open Radar and start debugging.

## MCP Integration

Radar exposes your app's runtime data to AI assistants via the [Model Context Protocol](https://modelcontextprotocol.io). Connect any MCP-compatible client (Claude Code, Cursor, etc.) to `http://localhost:8348/mcp` to give your AI access to console logs, network requests, component tree, performance metrics, and more.

## Development

```bash
# Install dependencies
bun install

# Start the Electron app
bun run dev:app

# Run tests
bun run test

# Lint & typecheck
bun run lint && bun run typecheck
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full development guide.

### Examples

The repo ships two example apps:

- `examples/react-native` — vanilla React Native, included in the root workspace and uses the workspace `radar-devtools`.
- `examples/expo` — Expo canary app, isolated with its own `package.json` + `bun.lock`. Run `cd examples/expo && bun install` separately. It pins the published `radar-devtools` rather than the workspace version so Expo's canary deps don't leak into the root audit graph.

## Tech Stack

- **App**: Electron 34, React 19, Tailwind CSS v4, better-sqlite3
- **SDK**: TypeScript, WebSocket, React Native TurboModules
- **MCP**: HTTP StreamableHTTP transport
- **Build**: Bun workspaces, Vite, electron-builder

## License

[MIT](./LICENSE)
