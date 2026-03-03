# JSON Serialization Usage Audit - TRO-17

Complete audit of all JSON serialization patterns in the Radar codebase.

---

## Summary

- **Total Instances Found**: 27
- **JSON.parse(JSON.stringify()) - Deep Clone Pattern**: 1
- **JSON.stringify() - All uses**: 13
- **JSON.parse() - All uses**: 8
- **Other Serialization**: 0 (no structuredClone found)

---

## 1. CRITICAL: Deep Clone Pattern [1 instance]

### Location 1: Deep Clone in Console Serialization
**File**: `/packages/devtools/src/services/console/serialize.ts:12`
**Line**: 12

```typescript
export const serialize = (value: unknown): unknown => {
  if (value === null || value === undefined) return value;
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  )
    return value;
  if (value instanceof Error)
    return { __type: 'Error', message: value.message, stack: value.stack };
  try {
    return JSON.parse(JSON.stringify(value));  // LINE 12
  } catch {
    return String(value);
  }
};
```

**Context**: This is the core serialization function for console log arguments sent from the devtools package to the main app.

**Data Being Serialized**: Any console argument that isn't null, undefined, primitive, or Error. This includes objects, arrays, and complex data structures.

**Why**: Used for deep cloning objects with circular reference protection (try-catch). The fallback is crucial here - if serialization fails, it returns `String(value)` which loses data.

**Issues with Current Implementation**:
- Functions are silently dropped
- undefined values are silently dropped
- Symbols are silently dropped
- BigInt values cause the function to fail and return `String(value)`
- Circular references cause the function to fail
- The fallback `String(value)` is inadequate - just shows `[object Object]`

---

## 2. JSON.stringify() Usage [13 instances]

### Instance 1: Network Request Body Display
**File**: `/apps/example/src/NetworkSection.tsx:35`
**Line**: 35

```typescript
fetch('https://jsonplaceholder.typicode.com/posts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Test Post',
    body: 'Hello from Radar',
    userId: 1,
  }),
})
```

**Context**: Example app sending JSON payload in HTTP request.

**Data Being Serialized**: Simple object with string and number properties.

**Why**: Converting object to string for HTTP transmission.

**Risk Level**: Low - only simple JSON-safe data.

---

### Instance 2: Editor Preference Storage
**File**: `/apps/app/electron/editors.ts:114`
**Line**: 114

```typescript
export const setPreferredEditor = (editorId: string): void => {
  const dir = path.dirname(getPreferencePath());
  mkdirSync(dir, { recursive: true });
  writeFileSync(getPreferencePath(), JSON.stringify({ editorId }), 'utf-8');
};
```

**Context**: Persisting user's preferred code editor to filesystem.

**Data Being Serialized**: Simple object `{ editorId: string }`.

**Why**: File persistence of configuration.

**Risk Level**: Low - only string property.

---

### Instance 3: IPC Command Transmission
**File**: `/apps/app/electron/main.ts:55`
**Line**: 55

```typescript
ipcMain.on(
  'radar:command',
  (_event, payload: { deviceId: string; command: RadarCommand }) => {
    wsHandle?.sendToDevice(payload.deviceId, JSON.stringify(payload.command));
  },
);
```

**Context**: Serializing radar commands for websocket transmission to connected devices.

**Data Being Serialized**: `RadarCommand` type (command object).

**Why**: IPC/websocket serialization for inter-process communication.

**Risk Level**: Medium - depends on RadarCommand structure (needs verification).

---

### Instance 4: Device Detection Test Mock
**File**: `/apps/app/electron/deviceDetection.test.ts:22`
**Line**: 22

```typescript
const SIMCTL_BOOTED_JSON = JSON.stringify({
  devices: {
    'com.apple.CoreSimulator.SimRuntime.iOS-17-4': [
      { udid: 'ABC-123', name: 'iPhone 15', state: 'Booted' },
      { udid: 'DEF-456', name: 'iPhone 14', state: 'Shutdown' },
    ],
  },
});
```

**Context**: Test mock data creation for device detection.

**Data Being Serialized**: Device simulator output structure.

**Why**: Creating mock JSON string for test parsing.

**Risk Level**: Low - test data only.

---

### Instance 5: Network Request Body Display (Display Purpose)
**File**: `/apps/app/src/components/NetworkDetailPanel/index.tsx:57`
**Line**: 57

```typescript
{typeof request.requestBody === 'string'
  ? request.requestBody
  : JSON.stringify(request.requestBody, null, 2)}
```

**Context**: Displaying request body in the devtools network panel UI.

**Data Being Serialized**: Request body object with pretty-printing (null replacer, 2-space indent).

**Why**: Formatting object for human-readable display in UI.

**Risk Level**: Low - display only, handles string fallback.

---

### Instance 6: Network Response Body Display (Display Purpose)
**File**: `/apps/app/src/components/NetworkDetailPanel/index.tsx:76`
**Line**: 76

```typescript
{typeof request.responseBody === 'string'
  ? request.responseBody
  : JSON.stringify(request.responseBody, null, 2)}
```

**Context**: Displaying response body in the devtools network panel UI.

**Data Being Serialized**: Response body object with pretty-printing.

**Why**: Formatting object for human-readable display in UI.

**Risk Level**: Low - display only, handles string fallback.

---

### Instance 7: Test Mock for Editor Preferences
**File**: `/apps/app/electron/editors.test.ts:93`
**Line**: 93

```typescript
describe('getPreferredEditor', () => {
  it('reads and parses JSON file returning editorId', () => {
    mockReadFileSync.mockReturnValue(JSON.stringify({ editorId: 'vscode' }));
    // ...
  });
});
```

**Context**: Unit test creating mock file content.

**Data Being Serialized**: Simple editor preference object.

**Why**: Test mock setup.

**Risk Level**: Low - test code only.

---

### Instance 8: Test Mock for Editor Preferences (write test)
**File**: `/apps/app/electron/editors.test.ts:125`
**Line**: 125

```typescript
expect(mockWriteFileSync).toHaveBeenCalledWith(
  '/mock/user-data/editor-preference.json',
  JSON.stringify({ editorId: 'vscode' }),
  'utf-8',
);
```

**Context**: Test assertion checking file write call.

**Data Being Serialized**: Simple editor preference object.

**Why**: Test assertion mock value.

**Risk Level**: Low - test code only.

---

### Instance 9: Console Log Grouping Key Generation
**File**: `/apps/app/src/utils/groupConsecutiveLogs.ts:4`
**Line**: 4

```typescript
const logContentKey = (entry: LogEntry): string =>
  `${entry.level}:${entry.args.map(a => JSON.stringify(a)).join('|')}`;
```

**Context**: Generating unique key for grouping identical console logs.

**Data Being Serialized**: Individual log arguments (from `LogEntry.args`).

**Why**: Creating a deterministic string key for grouping duplicate logs.

**Risk Level**: HIGH - This serializes arbitrary log arguments which may contain:
- Functions (silently dropped)
- undefined (silently dropped)
- Symbols (cause stringify to fail)
- BigInt (cause stringify to fail)
- Circular refs (cause stringify to fail)

The grouping key would be incomplete/wrong for such values, causing logs to not group properly.

---

### Instance 10: Format Argument for Display
**File**: `/apps/app/src/utils/formatArg.ts:16`
**Line**: 16

```typescript
export const formatArg = (arg: unknown): string => {
  if (arg === null) return 'null';
  if (arg === undefined) return 'undefined';
  if (typeof arg === 'string') return arg;
  if (typeof arg === 'number' || typeof arg === 'boolean') return String(arg);
  if (
    typeof arg === 'object' &&
    arg !== null &&
    '__type' in (arg as Record<string, unknown>) &&
    (arg as Record<string, unknown>).__type === 'Error'
  ) {
    const err = arg as { message: string; stack?: string };
    return `Error: ${err.message}${err.stack ? '\n' + err.stack : ''}`;
  }
  try {
    return JSON.stringify(arg, null, 2);  // LINE 16
  } catch {
    return String(arg);
  }
};
```

**Context**: Formatting console arguments for display in the UI.

**Data Being Serialized**: Objects and arrays (primitives handled before this call).

**Why**: Pretty-printing objects for display with error handling.

**Risk Level**: MEDIUM - Has try-catch fallback to `String(arg)`, but:
- Loses function information (shows `[object Object]`)
- Loses Symbol information
- Loses BigInt information
- Fallback is inadequate
- Functions in objects are completely lost

---

### Instance 11: Test for formatArg with object
**File**: `/apps/app/src/utils/formatArg.test.ts:43`
**Line**: 43

```typescript
it('JSON-stringifies plain objects', () => {
  const obj = { a: 1, b: 'two' };
  expect(formatArg(obj)).toBe(JSON.stringify(obj, null, 2));
});
```

**Context**: Unit test assertion.

**Data Being Serialized**: Simple test object.

**Why**: Test assertion.

**Risk Level**: Low - test code only.

---

### Instance 12: Test for formatArg with array
**File**: `/apps/app/src/utils/formatArg.test.ts:48`
**Line**: 48

```typescript
it('JSON-stringifies arrays', () => {
  const arr = [1, 'two', true];
  expect(formatArg(arr)).toBe(JSON.stringify(arr, null, 2));
});
```

**Context**: Unit test assertion.

**Data Being Serialized**: Simple test array.

**Why**: Test assertion.

**Risk Level**: Low - test code only.

---

### Instance 13: Websocket Message Transmission (1)
**File**: `/packages/devtools/src/connection.ts:29`
**Line**: 29

```typescript
const send = (message: RadarMessage) => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));  // LINE 29
  } else if (messageQueue.length < MAX_QUEUE_SIZE) {
    messageQueue.push(message);
  }
};
```

**Context**: Sending radar messages over websocket to device.

**Data Being Serialized**: `RadarMessage` type.

**Why**: Websocket transmission requires string serialization.

**Risk Level**: HIGH - Depends on RadarMessage content. Could contain:
- Non-JSON-safe values that are silently dropped
- This is critical path for device communication

---

## 3. JSON.parse() Usage [8 instances]

### Instance 1: Request Body Parsing
**File**: `/packages/devtools/src/services/network/parseRequestBody.ts:8`
**Line**: 8

```typescript
export const parseRequestBody = (
  body: BodyInit | null | undefined,
): unknown => {
  if (!body) return undefined;

  if (typeof body === 'string') {
    try {
      return JSON.parse(body);  // LINE 8
    } catch {
      return body;
    }
  }

  return '[Binary/FormData]';
};
```

**Context**: Parsing HTTP request body strings to objects.

**Data Being Parsed**: HTTP request body as string (typically JSON, but could be invalid).

**Why**: Attempting to parse JSON request bodies for display in devtools.

**Risk Level**: Low - Has fallback to raw string.

---

### Instance 2: Response Body Parsing
**File**: `/packages/devtools/src/services/network/parseResponseBody.ts:11`
**Line**: 11

```typescript
export const parseResponseBody = async (
  response: Response,
): Promise<unknown> => {
  const clone = response.clone();

  try {
    const text = await clone.text();
    try {
      return JSON.parse(text);  // LINE 11
    } catch {
      return text.length > MAX_TEXT_LENGTH
        ? text.slice(0, MAX_TEXT_LENGTH) + '...'
        : text;
    }
  } catch {
    return '[Could not read body]';
  }
};
```

**Context**: Parsing HTTP response body to object.

**Data Being Parsed**: HTTP response body text (typically JSON).

**Why**: Attempting to parse JSON responses for display.

**Risk Level**: Low - Has nested try-catch fallback.

---

### Instance 3: Editor Preferences Reading
**File**: `/apps/app/electron/editors.ts:102`
**Line**: 102

```typescript
export const getPreferredEditor = (): string | null => {
  try {
    const data = JSON.parse(readFileSync(getPreferencePath(), 'utf-8')) as {
      editorId: string;
    };
    return data.editorId;
  } catch {
    return null;
  }
};
```

**Context**: Reading stored editor preference from file.

**Data Being Parsed**: JSON from editor preference file.

**Why**: Retrieving user configuration.

**Risk Level**: Low - Has try-catch fallback, typed cast.

---

### Instance 4: Device Detection simctl Output Parsing
**File**: `/apps/app/electron/deviceDetection.ts:68`
**Line**: 68

```typescript
const parsed = JSON.parse(output) as SimctlOutput;
const devices: DetectedDevice[] = [];
const platform: DevicePlatform = 'ios';

for (const [runtimeKey, runtimeDevices] of Object.entries(parsed.devices)) {
  // ...
}
```

**Context**: Parsing `xcrun simctl list devices --json` output.

**Data Being Parsed**: JSON output from Apple's simctl tool.

**Why**: Extracting available iOS simulators for device selection.

**Risk Level**: Medium - No try-catch visible in snippet. Depends on external tool output.

---

### Instance 5: Websocket Command Reception
**File**: `/packages/devtools/src/connection.ts:79`
**Line**: 79

```typescript
ws.onmessage = (event: MessageEvent) => {
  if (!onMessage) return;
  try {
    const command = JSON.parse(event.data as string) as RadarCommand;  // LINE 79
    onMessage(command);
  } catch (err) {
    logger.error('[radar] Failed to parse incoming command:', err);
  }
};
```

**Context**: Receiving and parsing commands from websocket.

**Data Being Parsed**: Websocket message string (should be serialized RadarCommand).

**Why**: IPC serialization for inter-process communication.

**Risk Level**: Low - Has try-catch with error logging.

---

### Instance 6: Websocket Message Reception (Server)
**File**: `/apps/app/electron/websocketServer.ts:65`
**Line**: 65

```typescript
socket.on('message', data => {
  try {
    const message = JSON.parse(data.toString()) as ParsedMessage;  // LINE 65

    if (isMetadataMessage(message)) {
      // ...
    }
    // ...
  } catch (err) {
    logger.error('[radar:ws] Failed to parse message:', err);
  }
});
```

**Context**: Websocket server receiving messages from connected devices.

**Data Being Parsed**: Websocket message from device (string to be parsed).

**Why**: Device-to-server communication protocol.

**Risk Level**: Medium - Depends on what ParsedMessage contains and device implementations.

---

### Instance 7: Device Detection Test Mock Parsing
**File**: `/packages/devtools/src/services/network/parseRequestBody.test.ts:14`
**Line**: 14

```typescript
it('parses JSON string into object', () => {
  const body = JSON.stringify({ key: 'value' });
  expect(parseRequestBody(body)).toEqual({ key: 'value' });
});
```

**Context**: Test parsing of request body.

**Data Being Parsed**: Test mock JSON string.

**Why**: Unit test assertion.

**Risk Level**: Low - Test code only.

---

### Instance 8: Response Body Parsing Test
**File**: `/packages/devtools/src/services/network/parseResponseBody.test.ts:6`
**Line**: 6

```typescript
it('parses JSON body', async () => {
  const response = new Response(JSON.stringify({ ok: true }), {
    headers: { 'content-type': 'application/json' },
  });
  expect(await parseResponseBody(response)).toEqual({ ok: true });
});
```

**Context**: Test parsing response body.

**Data Being Parsed**: Test response with JSON body.

**Why**: Unit test assertion.

**Risk Level**: Low - Test code only.

---

## Critical Findings Summary

### High Priority Issues (for TRO-17 custom serializer):

1. **`serialize()` in console/serialize.ts** - Missing data representation for:
   - Functions (mapped to placeholder)
   - Symbols (mapped to placeholder)
   - BigInt (mapped to placeholder)
   - undefined (mapped to placeholder)
   - Circular references (currently fails)

2. **`groupConsecutiveLogs()` key generation** - Log grouping fails with non-JSON-safe values in arguments

3. **`formatArg()` in display utility** - Pretty printing loses information

4. **Websocket message serialization** - Critical path for device communication, unknown content structure

### Medium Priority:

5. **Device detection parsing** - No visible error handling for simctl output

6. **IPC command transmission** - Unknown RadarCommand structure

### Recommendations:

- Create custom serializer that replaces `JSON.parse(JSON.stringify())` with placeholder handling
- Update websocket message senders to use custom serializer
- Add better error handling to device detection
- Consider applying custom serializer to `formatArg()` for better display of complex objects
