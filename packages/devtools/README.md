# radar-devtools

Client SDK for [Radar](https://github.com/trontechnologies/radar) - Unified DevTools for React Native.

Captures console logs, network requests, component tree, profiler data, performance metrics, storage, and state management data from your React Native app and sends it to the Radar desktop app for inspection.

## Installation

```bash
bun add -d radar-devtools
```

## Quick Start

```typescript
import { init } from 'radar-devtools'

if (__DEV__) {
  init()
}
```

That's it. Open the Radar desktop app and your device will appear automatically.

## Configuration

```typescript
import { init } from 'radar-devtools'

if (__DEV__) {
  init({
    host: 'localhost',       // Radar app host (default: 'localhost')
    port: 8347,              // Radar app port (default: 8347)
    deviceId: 'my-device',   // Custom device identifier
    deviceName: 'My Phone',  // Custom device name

    // State management stores
    stores: {
      redux: { type: 'redux', store: myReduxStore },
      zustand: { type: 'zustand', store: useMyZustandStore },
    },
  })
}
```

## State Management

### Redux

```typescript
import { configureStore } from '@reduxjs/toolkit'
import { init } from 'radar-devtools'

const store = configureStore({ reducer: rootReducer })

if (__DEV__) {
  init({
    stores: {
      main: { type: 'redux', store },
    },
  })
}
```

### Zustand

```typescript
import { create } from 'zustand'
import { init } from 'radar-devtools'

const useAppStore = create((set) => ({ ... }))

if (__DEV__) {
  init({
    stores: {
      app: { type: 'zustand', store: useAppStore },
    },
  })
}
```

## Storage

Storage inspection works automatically if you have either library installed:

- **AsyncStorage** (`@react-native-async-storage/async-storage` >= 1.0.0)
- **MMKV** (`react-native-mmkv` >= 2.0.0)

Both are optional peer dependencies - install only what your app uses.

## Babel Plugin

For source file tracing in the component tree, add the Babel plugin:

```javascript
// babel.config.js
module.exports = {
  plugins: ['radar-devtools/babel-plugin'],
}
```

## What Gets Captured

| Feature | How |
|---------|-----|
| Console logs | Patches `console.log/warn/error/debug` |
| Network | Intercepts `fetch()` and `XMLHttpRequest` |
| Component tree | Hooks into React DevTools global hook |
| Profiler | Captures commit snapshots with render triggers |
| Performance | Native metrics via TurboModules + JS event loop sampling |
| Storage | Reads from AsyncStorage and/or MMKV |
| State | Subscribes to Redux dispatch / Zustand store changes |

## Physical Devices

For physical devices, point to your machine's local IP:

```typescript
init({ host: '192.168.1.100' })
```

## Requirements

- React Native >= 0.72
- React >= 18

## License

[MIT](https://github.com/trontechnologies/radar/blob/main/LICENSE)
