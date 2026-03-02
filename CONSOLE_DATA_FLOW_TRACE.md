# Console Data Flow Trace - Radar DevTools

## Executive Summary

This document traces exactly where console log data (console.log, console.warn, console.error, console.debug) is captured from the target app, serialized, transmitted, and received by the DevTools UI.

**Key Finding**: Non-JSON-safe values are lost at **one critical serialization point** in the console pipeline.

---

## 1. Console Capture & Initial Serialization

### Location: `/packages/devtools/src/services/console/index.ts`

**Function**: `patchConsole(send: Send)`

This function patches all console methods (log, warn, error, debug) in the target app.

```typescript
console[level] = (...args: unknown[]) => {
  original[level](...args);  // Call original console first

  send({
    type: 'console',
    level,
    args: args.map(serialize),  // ← SERIALIZATION HAPPENS HERE
    timestamp: Date.now(),
  });
};
```

**Input**: Raw console arguments (can include functions, undefined, Symbols, BigInt, circular objects, Errors)

**Output**: ConsoleMessage with serialized args

---

## 2. THE CRITICAL SERIALIZATION POINT ⚠️

### Location: `/packages/devtools/src/services/console/serialize.ts`

**Function**: `serialize(value: unknown): unknown`

This is where non-JSON-safe values are permanently lost.

```typescript
export const serialize = (value: unknown): unknown => {
  if (value === null || value === undefined) return value;

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean')
    return value;

  if (value instanceof Error)
    return { __type: 'Error', message: value.message, stack: value.stack };

  try {
    return JSON.parse(JSON.stringify(value));  // ← LOSS OF DATA HERE
  } catch {
    return String(value);  // Falls back to [object Object], Function, etc.
  }
};
```

### What Gets Lost:
- **Functions**: `() => {}` → `String(fn)` → `"function () {}"`
- **Undefined inside objects**: `{a: undefined}` → `{}` (removed by JSON.stringify)
- **Symbols**: `Symbol('x')` → removed or throws → `String(value)`
- **BigInt**: `BigInt(123)` → throws → `"123"`
- **Circular references**: `{self: obj}` → throws → `"[object Object]"`
- **undefined primitives**: passed through (but lost in objects)
- **Typed Arrays, Maps, Sets**: lose type info, become objects or arrays

### What's Preserved:
- `null`, `undefined` (at top level)
- Strings, numbers, booleans
- Plain objects (deep clone)
- Arrays (deep clone)
- Error instances (special handling)

---

## 3. Message Type Definition

### Location: `/packages/types/src/console.ts`

```typescript
export type ConsoleMessage = {
  type: 'console';
  level: LogLevel;
  args: unknown[];  // ← Already serialized at this point
  timestamp: number;
};
```

---

## 4. WebSocket Transmission

### Location: `/packages/devtools/src/connection.ts`

**Function**: `send(message: RadarMessage)`

After serialization, the message is JSON.stringified and sent via WebSocket:

```typescript
const send = (message: RadarMessage) => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));  // ← 2nd JSON.stringify (message already has serialized args)
  }
};
```

**Data Flow**:
1. Console args → `serialize()` → serialized args (unknown[])
2. Create ConsoleMessage with serialized args
3. `JSON.stringify(message)` → sends as JSON over WebSocket
4. Transmission via ws://localhost:8347

---

## 5. Server Reception & Relay

### Location: `/apps/app/electron/websocketServer.ts`

**Function**: `startWebSocketServer()`

The Electron main process receives the WebSocket message:

```typescript
socket.on('message', data => {
  try {
    const message = JSON.parse(data.toString()) as ParsedMessage;  // ← Re-parse JSON

    if (isMetadataMessage(message)) {
      // Handle metadata...
      return;
    }

    const deviceId = socketToDeviceId.get(socket);
    const stamped = { ...message, deviceId };
    win.webContents.send('radar:message', stamped);  // ← Send to Renderer via IPC
  } catch (err) {
    console.error('[radar] Failed to parse message:', err);
  }
});
```

**Data Flow**:
1. WebSocket message received as string
2. `JSON.parse()` converts back to object
3. Device ID stamped on message
4. Sent to Renderer process via `win.webContents.send('radar:message', ...)`

---

## 6. Renderer Process Reception

### Location: `/apps/app/src/App.tsx`

**Event Handler**: `onMessage`

```typescript
const onMessage = (
  event: unknown,
  message: Record<string, unknown> & { type: string; deviceId: string },
) => {
  handleConsoleMessage(event, message);  // ← Routes to console handler
  handleNetworkMessage(event, message);
  handleTreeMessage(event, message);
  handleProfilerMessage(event, message);
};

ipcRenderer.on('radar:message', onMessage);
```

---

## 7. Console Hook Processing

### Location: `/apps/app/src/hooks/useConsoleLogs.ts`

**Function**: `useConsoleLogs(selectedDeviceId)`

```typescript
const handleMessage = useCallback(
  (_event: unknown, message: StampedMessage) => {
    if (message.type !== 'console') return;

    const msg = message as StampedConsoleMessage;
    setLogs(prev => {
      const next = [
        ...prev,
        {
          id: nextLogIdRef.current++,
          level: msg.level,
          args: msg.args,  // ← Already serialized from step 2
          timestamp: msg.timestamp,
          deviceId: msg.deviceId,
        },
      ];
      return next.length > MAX_LOGS ? next.slice(-MAX_LOGS) : next;
    });
  },
  [],
);
```

**Type Definition**: `/apps/app/src/types/console.ts`

```typescript
export type LogEntry = {
  id: number;
  level: LogLevel;
  args: unknown[];  // ← Serialized arguments stored here
  timestamp: number;
  deviceId: string;
};
```

---

## 8. Final Display

### Location: `/apps/app/src/components/ConsolePanel/` (or similar)

The LogEntry with serialized args is displayed to the user.

Additional formatting happens at:
- `/apps/app/src/utils/formatArg.ts` - formats individual arguments
- `/apps/app/src/utils/groupConsecutiveLogs.ts` - groups logs, uses `JSON.stringify(a)` for keys

---

## Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ TARGET APP (React Native / React Web)                           │
├─────────────────────────────────────────────────────────────────┤
│ console.log(fn, undefined, Symbol, BigInt, circular, {a: undef})│
│                        ↓                                         │
│ patchConsole hook intercepts & calls serialize() on each arg    │
│                        ↓                                         │
│ ⚠️ CRITICAL: JSON.parse(JSON.stringify(value)) ⚠️                │
│  - Functions → String(fn)                                       │
│  - undefined → removed if in object                             │
│  - Symbols → removed or String(sym)                             │
│  - BigInt → String(bigint)                                      │
│  - Circular → String(obj)                                       │
│                        ↓                                         │
│ ConsoleMessage { type, level, args: serialized[], timestamp }  │
│                        ↓                                         │
│ JSON.stringify(message) → sent via WebSocket                   │
└─────────────────────────────────────────────────────────────────┘
                         ↓
            ws://localhost:8347
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ ELECTRON MAIN PROCESS (websocketServer.ts)                      │
├─────────────────────────────────────────────────────────────────┤
│ WebSocket message received                                       │
│                        ↓                                         │
│ JSON.parse(data) → message object                              │
│                        ↓                                         │
│ Stamp deviceId & send to Renderer via IPC                       │
└─────────────────────────────────────────────────────────────────┘
                         ↓
              ipcRenderer.send('radar:message')
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ ELECTRON RENDERER (React UI)                                     │
├─────────────────────────────────────────────────────────────────┤
│ App.tsx receives 'radar:message' event                          │
│                        ↓                                         │
│ handleConsoleMessage → useConsoleLogs.handleMessage()           │
│                        ↓                                         │
│ setLogs() stores LogEntry with args (already serialized)        │
│                        ↓                                         │
│ ConsolePanel displays logs with formatArg() helper              │
│                        ↓                                         │
│ User sees [object Object], Function, etc. instead of values     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Findings

### Where Data Loss Happens
**Single Critical Point**: `/packages/devtools/src/services/console/serialize.ts:12`

```typescript
return JSON.parse(JSON.stringify(value));
```

This is the ONLY place where console arguments are serialized. All non-JSON-safe values are lost here.

### Why It Matters
The JSON round-trip is irreversible:
1. `JSON.stringify()` removes non-serializable values
2. `JSON.parse()` restores from the reduced JSON
3. By design, non-JSON-safe values cannot survive this process

### To Fix This Issue
The custom serializer must:
1. Replace this single line
2. Handle each value type explicitly BEFORE JSON.stringify
3. Use metadata markers (like `__type`) to reconstruct on the UI side
4. Example: `{ __type: 'Function', str: fn.toString() }`

---

## Testing Coverage

**Existing Tests**: `/packages/devtools/src/services/console/serialize.test.ts`

All edge cases are already tested:
- ✅ null, undefined, primitives
- ✅ Error instances (special case)
- ✅ Circular references (falls back to String)
- ✅ BigInt (falls back to String)
- ✅ Functions (falls back to String)
- ✅ Plain objects and arrays (JSON round-trip)

---

## Architecture Notes

- **No other serialization happens**: The message passes through multiple JSON.stringify/parse calls, but the args are only serialized once (at the source)
- **No compression or encoding**: Raw JSON over WebSocket
- **No custom replacers**: The serialize function is custom, but doesn't use JSON.stringify's replacer parameter
- **Message queue**: If WebSocket is disconnected, messages are queued (but args are already serialized)

---

## Related Files to Reference

1. **Console service**:
   - `/packages/devtools/src/services/console/index.ts` - patching
   - `/packages/devtools/src/services/console/serialize.ts` - serialization ⚠️
   - `/packages/devtools/src/services/console/serialize.test.ts` - test coverage

2. **Connection**:
   - `/packages/devtools/src/connection.ts` - WebSocket send/receive

3. **Server**:
   - `/apps/app/electron/websocketServer.ts` - receives from target

4. **UI**:
   - `/apps/app/src/hooks/useConsoleLogs.ts` - processes in Renderer
   - `/apps/app/src/types/console.ts` - UI types
   - `/apps/app/src/utils/formatArg.ts` - formatting for display

5. **Types**:
   - `/packages/types/src/console.ts` - shared ConsoleMessage type
   - `/packages/types/src/radarMessage.ts` - message union type
