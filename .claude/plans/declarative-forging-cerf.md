# Two Tasks

## Task A: Wire `@radar/devtools-native` to Example App (prerequisite)

Add `"@radar/devtools-native": "workspace:*"` to `apps/example/package.json` `devDependencies`, run `bun install`, `pod install`, and `bun run ios` to rebuild with native module linked. Verify UI FPS, Native RAM, CPU charts show real values in Radar.

| File | Action |
|------|--------|
| `apps/example/package.json` | Add devDependency |

---

## Task B: Startup Metrics

### Context
The `StartupBreakdown` component is a hardcoded placeholder. This implements real startup metrics flowing through the existing message pipeline. Two metrics are captured automatically (`jsBundleEval` at `init()`, `nativeLaunch` via native module). A third (`tti`) requires the user to call `markInteractive()`.

No changes to the `init()` API.

### User-Facing API
```typescript
import { init, markInteractive } from 'radar-devtools';
init();

const App = () => {
  return <Navigation onReady={() => markInteractive()} />;
};
```

### Implementation

#### 1. Types — `StartupMetricsMessage`

**`packages/types/src/startup.ts`** (new)
```typescript
export type StartupMetricsMessage = {
  type: 'startupMetrics';
  jsBundleEval: number;
  nativeLaunch: number | null;
  tti: number | null;
  timestamp: number;
};
```

**`packages/types/src/radarMessage.ts`** — add to `RadarMessage` union
**`packages/types/src/index.ts`** — export

#### 2. Native Module — Add `getNativeLaunchTime()`

Extend existing `RadarPerformance` TurboModule:

**`packages/devtools-native/ios/RadarPerformance.mm`** — add method using `NSProcessInfo.processInfo.systemUptime`
**`packages/devtools-native/android/.../RadarPerformanceModule.kt`** — add method using `/proc/self/stat` field 22
**`packages/devtools-native/src/NativeRadarPerformance.ts`** — add to spec

#### 3. Devtools Service — Startup capture

**`packages/devtools/src/services/startup/index.ts`** (new)
- Captures `performance.now()` at creation → `jsBundleEval`
- Calls `getNativeLaunchTime()` → `nativeLaunch` (null if no native module)
- `markInteractive()` captures `tti` and sends message
- `sendWithoutTti()` fallback after 10s timeout

**`packages/devtools/src/services/startup/getNativeLaunchTime.ts`** (new)
- Same pattern as `getNativeMetrics.ts` — probe `__turboModuleProxy`, cache, try/catch

**`packages/devtools/src/services/index.ts`** — export

#### 4. Devtools Init — Wire + export `markInteractive`

**`packages/devtools/src/index.ts`**
- Create startup service: `const startup = createStartupService(send)`
- 10s timeout fallback: `setTimeout(() => startup.sendWithoutTti(), 10000)`
- Module-level `markInteractive` export that delegates to startup service

#### 5. App Types

**`apps/app/src/types/startup.ts`** (new) — `StartupData` type with `deviceId`
**`apps/app/src/types/index.ts`** — export

#### 6. App Hook — `useStartupMetrics`

**`apps/app/src/hooks/useStartupMetrics.ts`** (new)
- Listens for `type: 'startupMetrics'`
- Stores latest `StartupData` for selected device
- Returns `{ startupData, handleMessage, clearStartup }`

**`apps/app/src/hooks/index.ts`** — export

#### 7. App.tsx Integration

- Wire `useStartupMetrics` hook
- Add `handleStartupMessage` to `onMessage`
- Pass `startupData` to `PerformancePanel`
- Add `clearStartup` to `handleClear`

#### 8. UI — Replace StartupBreakdown placeholder

**`apps/app/src/components/PerformancePanel/StartupBreakdown.tsx`** — rewrite
- Props: `startupData: StartupData | null`, `connected: boolean`
- Horizontal bar chart: Native Launch (purple), JS Bundle Eval (blue), TTI (green)
- Bars proportional to each other with ms labels
- Shows "N/A" for null values, "Waiting..." when no data yet

**`apps/app/src/components/PerformancePanel/index.tsx`** — add `startupData` prop, pass to `StartupBreakdown`

#### 9. Example App — Call `markInteractive`

**`apps/example/App.tsx`** — add `markInteractive()` call on navigation ready

### Files Changed Summary

| File | Action |
|------|--------|
| `packages/types/src/startup.ts` | Create |
| `packages/types/src/radarMessage.ts` | Modify |
| `packages/types/src/index.ts` | Modify |
| `packages/devtools/src/services/startup/index.ts` | Create |
| `packages/devtools/src/services/startup/getNativeLaunchTime.ts` | Create |
| `packages/devtools/src/services/index.ts` | Modify |
| `packages/devtools/src/index.ts` | Modify |
| `packages/devtools-native/src/NativeRadarPerformance.ts` | Modify |
| `packages/devtools-native/ios/RadarPerformance.mm` | Modify |
| `packages/devtools-native/android/.../RadarPerformanceModule.kt` | Modify |
| `apps/app/src/types/startup.ts` | Create |
| `apps/app/src/types/index.ts` | Modify |
| `apps/app/src/hooks/useStartupMetrics.ts` | Create |
| `apps/app/src/hooks/index.ts` | Modify |
| `apps/app/src/App.tsx` | Modify |
| `apps/app/src/components/PerformancePanel/StartupBreakdown.tsx` | Rewrite |
| `apps/app/src/components/PerformancePanel/index.tsx` | Modify |
| `apps/example/App.tsx` | Modify |

### Verification

1. `bun run typecheck` — no errors
2. `bun run lint` — no violations
3. `bun run test` — all pass
4. Electron + example app → Performance tab shows startup bars with real ms values
5. Native Launch shows value (after Task A wires native package)
6. TTI shows value (after `markInteractive()` in example app)
7. Without `markInteractive()`, data still appears after 10s timeout (without TTI)
