# Fix: Profiler phase detection mismatch with React DevTools

## Problem

Radar's profiler flamegraph shows 2 components as "did not render" (gray/striped) that React DevTools shows as "rendered" (colored with duration). The affected components are the inner `View` and `Text` inside a `TouchableOpacity > Animated(View)` subtree.

### What DevTools shows (correct behavior)

Below `TouchableOpacity`:

```
View (Animated) (2.9ms of 6.2ms) — colored (rendered)
  View (0.6ms of 3.3ms) — colored (rendered)
    View (0.1ms of 0.2ms) — colored (rendered)     ← THIS ONE
    Text (0.1ms of 0.1ms) — colored (rendered)      ← AND THIS ONE
```

### What Radar shows (incorrect behavior)

Below `TouchableOpacity`:

```
Animated(View) (6.2ms) — colored (rendered)  ✓
  View (3.3ms) — colored (rendered)           ✓
    View — GRAY (did not render)               ✗ WRONG
    Text — GRAY (did not render)               ✗ WRONG
```

### Reproduction steps

1. Start profiling in BOTH React DevTools and Radar simultaneously
2. Press a `ConsoleOption` button (e.g. "console.log") in the React Native test app — this triggers an `Animated.View` animation
3. Stop profiling in both tools
4. Compare the flamegraph for any commit involving the `ConsoleOption > TouchableOpacity > Animated(View)` subtree
5. Observe: DevTools shows 4 colored components (Animated View, View, View, Text), Radar shows only 2 colored (Animated View, View) and 2 gray (View, Text)

---

## Required materials BEFORE planning

Before writing any plan, the following **must** be collected:

1. **Fresh screenshots** of both DevTools and Radar flamegraphs for the SAME profiling session, zoomed into the problematic subtree
2. **Exported profiling data** from React DevTools (use the export button in the Profiler tab) — save as JSON in `/tmp/` or `~/Downloads/`
3. **Decoded component tree** from the profiling data showing: component IDs, types (Function=5, Host=6, Class=1, ForwardRef=9, Memo=8), parent-child relationships, and `hocDisplayNames`

---

## Architecture & key files

### Hook registration & timing

**`packages/devtools/src/services/componentTree/index.ts`** (lines 87-114)

Radar hooks into `__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberRoot`. When React DevTools is also installed, Radar wraps the existing hook — DevTools fires first, then Radar:

```typescript
const originalOnCommit = existingHook.onCommitFiberRoot;
existingHook.onCommitFiberRoot = (rendererID: number, root: FiberRoot) => {
  originalOnCommit.call(existingHook, rendererID, root); // DevTools first
  onCommitRoot(root); // Radar second
};
```

Both read the same fiber tree state synchronously during `onCommitFiberRoot`.

### Snapshot capture

**`packages/devtools/src/services/profiler/index.ts`** (lines 13-20)

`snapshotCommit(root)` is called from `handleCommit` which is registered as a commit listener. It runs synchronously during `onCommitFiberRoot`.

### Fiber snapshot — the core algorithm

**`packages/devtools/src/services/profiler/snapshotCommit.ts`** (full file, 80 lines)

```typescript
import type { FiberNode, FiberRoot } from '../componentTree/fiberTypes';
import { USER_COMPONENT_TAGS } from '../componentTree/constants';

export type FiberSnapshot = {
  fiber: FiberNode;
  actualDuration: number;
  selfBaseDuration: number;
  treeBaseDuration: number;
  hasAlternate: boolean;
  isFresh: boolean;
  didRender: boolean;
  children: FiberSnapshot[];
};

export type CommitSnapshot = {
  timestamp: number;
  rootSnapshots: FiberSnapshot[];
};

const getChildren = (fiber: FiberNode): FiberNode[] => {
  const children: FiberNode[] = [];
  let child = fiber.child;
  while (child !== null) {
    children.push(child);
    child = child.sibling;
  }
  return children;
};

const snapshotFiber = (
  fiber: FiberNode,
  parentChildrenFresh: boolean,
): FiberSnapshot[] => {
  try {
    const children = getChildren(fiber);
    const isUserComponent = USER_COMPONENT_TAGS.includes(fiber.tag);

    const isFresh = parentChildrenFresh;

    const alternate = fiber.alternate;
    const childrenFresh =
      isFresh && (alternate === null || fiber.child !== alternate.child);

    if (isUserComponent) {
      const childSnapshots = children.flatMap((c) =>
        snapshotFiber(c, childrenFresh),
      );
      return [
        {
          fiber,
          actualDuration: fiber.actualDuration ?? 0,
          selfBaseDuration: fiber.selfBaseDuration ?? 0,
          treeBaseDuration: fiber.treeBaseDuration ?? 0,
          hasAlternate: !!alternate,
          isFresh,
          didRender:
            alternate !== null &&
            (fiber.memoizedProps !== alternate.memoizedProps ||
              fiber.memoizedState !== alternate.memoizedState),
          children: childSnapshots,
        },
      ];
    }

    return children.flatMap((c) => snapshotFiber(c, childrenFresh));
  } catch {
    return [];
  }
};

export const snapshotCommit = (root: FiberRoot): CommitSnapshot => ({
  timestamp: Date.now(),
  rootSnapshots: getChildren(root.current).flatMap((c) =>
    snapshotFiber(c, true),
  ),
});
```

**Key behavior:** Only fibers with tags in `USER_COMPONENT_TAGS` are captured as nodes in the snapshot tree. Non-user fibers (including **host components**, tag 5) are **skipped** — their children are flattened into the nearest user-component ancestor.

### Phase detection

**`packages/devtools/src/services/profiler/buildProfilingData.ts`** (full file, 89 lines)

```typescript
import type { ProfilerCommitData, ProfilerComponentData, ProfilerPhase } from '@radar/types';
import { getComponentName } from '../componentTree/getComponentName';
import { fiberIdMap } from '../componentTree/fiberIdMap';
import { detectRenderTriggers } from './detectRenderTriggers';
import type { CommitSnapshot, FiberSnapshot } from './snapshotCommit';

const buildComponentData = (
  snapshot: FiberSnapshot,
): ProfilerComponentData | null => {
  try {
    const name = getComponentName(snapshot.fiber) ?? 'Unknown';
    const id = fiberIdMap.getFiberId(snapshot.fiber);

    let phase: ProfilerPhase;
    let skipped = false;

    if (!snapshot.isFresh) {
      phase = 'did-not-render';
      skipped = true;
    } else if (!snapshot.hasAlternate) {
      phase = 'mount';
    } else if (snapshot.didRender) {
      phase = 'update';
    } else {
      phase = 'did-not-render';
    }

    let triggers: ProfilerComponentData['triggers'] = [];
    if (phase === 'update') {
      try {
        triggers = detectRenderTriggers(snapshot.fiber);
      } catch {
        triggers = [{ type: 'unknown' }];
      }
    }

    const children = snapshot.children
      .map(buildComponentData)
      .filter((c): c is ProfilerComponentData => c !== null);

    const didNotRender = phase === 'did-not-render';

    return {
      id,
      name,
      actualDuration: didNotRender ? 0 : snapshot.actualDuration,
      selfBaseDuration: didNotRender ? 0 : snapshot.selfBaseDuration,
      treeBaseDuration: snapshot.treeBaseDuration,
      phase,
      skipped,
      triggers: didNotRender ? [] : triggers,
      children,
    };
  } catch {
    return null;
  }
};

const computeCommitDuration = (components: ProfilerComponentData[]): number => {
  let max = 0;
  for (const c of components) {
    if (c.actualDuration > max) max = c.actualDuration;
  }
  return max;
};

export const buildProfilingData = (
  snapshots: CommitSnapshot[],
): ProfilerCommitData[] =>
  snapshots.map((snapshot, index) => {
    const components = snapshot.rootSnapshots
      .map(buildComponentData)
      .filter((c): c is ProfilerComponentData => c !== null);
    return {
      index,
      timestamp: snapshot.timestamp,
      duration: computeCommitDuration(components),
      components,
    };
  });
```

### Component tag filtering

**`packages/devtools/src/services/componentTree/constants.ts`**

```typescript
export const FUNCTION_COMPONENT = 0;
export const CLASS_COMPONENT = 1;
export const HOST_ROOT = 3;
export const CONTEXT_PROVIDER = 10;
export const FORWARD_REF = 11;
export const MEMO = 14;
export const SIMPLE_MEMO = 15;

export const USER_COMPONENT_TAGS = [
  FUNCTION_COMPONENT,   // 0
  CLASS_COMPONENT,      // 1
  CONTEXT_PROVIDER,     // 10
  FORWARD_REF,          // 11
  MEMO,                 // 14
  SIMPLE_MEMO,          // 15
];
```

**NOT included:** `HOST_COMPONENT` (tag 5), `HOST_TEXT` (tag 6). These are native elements like `RCTView`, `RCTText` in React Native.

### Fiber types

**`packages/devtools/src/services/componentTree/fiberTypes.ts`**

```typescript
export type FiberNode = {
  tag: number;
  type: FiberComponentType | string | null;
  child: FiberNode | null;
  sibling: FiberNode | null;
  return: FiberNode | null;
  key: string | null;
  memoizedProps: Record<string, unknown> | null;
  memoizedState: MemoizedState | null;
  stateNode: unknown;
  _debugHookTypes: string[] | null;
  actualDuration?: number;
  selfBaseDuration?: number;
  actualStartTime?: number;
  treeBaseDuration?: number;
  alternate: FiberNode | null;
  flags?: number;
};
```

### Flamegraph layout

**`apps/app/src/components/ProfilerPanel/FlamegraphLayout.ts`** — Uses `treeBaseDuration` for bar widths, `actualDuration` for colors/labels. `phase === 'did-not-render'` gets gray color and no duration label.

### Shared types

**`packages/types/src/profiler.ts`** — `ProfilerPhase = 'mount' | 'update' | 'did-not-render'`

---

## Root cause analysis (what we know so far)

### The fundamental mismatch

React DevTools and Radar capture **different fibers** with the **same display name**:

| Tool | "View" refers to | Fiber tag | Captured? |
|------|------------------|-----------|-----------|
| DevTools | Host `RCTView` | 5 (HostComponent) | Yes (DevTools captures all) |
| Radar | ForwardRef `View` wrapper | 11 (ForwardRef) | Yes (in USER_COMPONENT_TAGS) |

DevTools **collapses ForwardRef wrappers** (hides them from the tree) and shows the host component directly. Radar **captures ForwardRef wrappers** and **skips host components**.

### The fiber tree (decoded from profiling data)

```
DevTools tree (ForwardRef wrappers collapsed):
  ID 33: View (Animated) [type=5, Function]    ← updater (source of re-render)
    ID 34: View [type=6, Host]                  ← host RCTView
      ID 35: View [type=6, Host]                ← host RCTView
      ID 36: Text [type=5, Function]            ← function component
      ID 37: PressabilityDebugView [type=5, Function]

Actual fiber tree (with ForwardRef wrappers, what our code walks):
  Animated(View) [func, tag 0]                  ← DevTools ID 33
    ForwardRef(View) [tag 11]                   ← HIDDEN by DevTools, CAPTURED by Radar
      RCTView [host, tag 5]                     ← DevTools ID 34, SKIPPED by Radar
        ForwardRef(View) [tag 11]               ← HIDDEN by DevTools, CAPTURED by Radar
          RCTView [host, tag 5]                 ← DevTools ID 35, SKIPPED by Radar
        Text [func/forwardRef]                  ← CAPTURED by Radar
        PressabilityDebugView [func, tag 0]     ← CAPTURED by Radar
```

### Why the ForwardRef wrappers show as "did not render"

When `Animated(View)` re-renders due to an animated value:

1. `Animated(View)` renders → returns `<View style={animatedStyle}>{this.props.children}</View>`
2. The outer `<View>` gets **new props** (new animated style) → ForwardRef View renders → `didRender = true` ✓
3. The host RCTView below it also renders (new props from ForwardRef)
4. **But `this.props.children`** (inner `<View>`, `<Text>`, etc.) are **stable elements** from the parent `TouchableOpacity`'s previous render — same references
5. The inner ForwardRef View wrapper gets `pendingProps === memoizedProps` (same ref) → **bails out** → `didRender = false`
6. The inner Text also bails out for the same reason

Our code correctly detects the bail-out. But DevTools shows the host components (which we skip) instead, and those show as "rendered" due to React's double-buffering keeping stale `memoizedProps !== alternate.memoizedProps` from a previous commit where they DID render.

---

## Previous failed attempts

### Attempt 1: `actualDuration > 0` as secondary signal

```typescript
} else if (snapshot.didRender || snapshot.actualDuration > 0) {
  phase = 'update';
```

**Result:** MASSIVE REGRESSION. `actualDuration` includes ALL subtree time. Every ancestor of a rendered component has `actualDuration > 0`, so the entire tree lit up as "update" (orange).

### Attempt 2: Walk non-user child chain for stale host render state

In `snapshotFiber`, when a user component bails, walk `fiber.child` through non-user components checking `memoizedProps !== alternate.memoizedProps`:

```typescript
let hostDidRender = false;
if (!selfDidRender && isFresh) {
  let child = fiber.child;
  while (child !== null && !USER_COMPONENT_TAGS.includes(child.tag)) {
    const childAlt = child.alternate;
    if (childAlt !== null && child.memoizedProps !== childAlt.memoizedProps) {
      hostDidRender = true;
      break;
    }
    child = child.child;
  }
}
```

**Result:** Small regression — some components that correctly showed as "did not render" started showing as rendered. The stale `memoizedProps` check on hosts is too broad; the double-buffering means hosts that rendered in ANY previous commit (not just the current one) show stale differences.

---

## What needs investigation during planning

### Critical research tasks

1. **Read React DevTools source code** for `didFiberRender` — the EXACT implementation in `packages/react-devtools-shared/src/backend/fiber/renderer.js`. Find the function, understand how it handles different fiber tags (Function, ForwardRef, Host, Memo, Class). URL: https://github.com/facebook/react/blob/main/packages/react-devtools-shared/src/backend/fiber/renderer.js

2. **Read React DevTools profiler data collection** — how does DevTools collect `fiberActualDurations` and determine which fibers to include? Does it filter by fiber tag? Does it use `actualDuration > 0`? Search in `packages/react-devtools-shared/src/backend/fiber/renderer.js` for `recordProfilingDurations` or similar.

3. **Read React DevTools flamegraph rendering** — how does DevTools determine the color of each bar in the flamegraph? Does it call `didFiberRender` or use something else? Search `packages/react-devtools-timeline/` and `packages/react-devtools-shared/src/devtools/views/Profiler/`.

4. **Understand DevTools component filtering** — how does DevTools collapse ForwardRef wrappers? Search for `collapseNodesByDefault`, `componentFilters`, or filter logic in the DevTools backend. This affects which fibers appear in the profiling tree.

5. **Understand React's double-buffering for `memoizedProps`** — trace through `createWorkInProgress`, `beginWork`, `completeWork`, and `commitWork` to understand exactly when `memoizedProps` is set and how it differs between current and alternate for bailed-out fibers across multiple commits.

6. **Check React's profiling timer reset** — when `actualDuration` is reset vs kept stale. Look at `beginWork` and `completeUnitOfWork` in React's reconciler source. Are stale durations from previous commits visible in `onCommitFiberRoot`?

7. **Check if DevTools applies component filters to profiling data** — when ForwardRef is "collapsed" in the component tree, does it also get excluded from the profiling flamegraph? Or does the profiling tree show ALL fibers regardless of filters?

8. **Compare DevTools profiler data vs our data** — decode the exported profiling JSON and compare the component tree structure (IDs, types, children) with what our `snapshotFiber` produces. Identify exactly which fibers are in DevTools but not in Radar, and vice versa.

---

## Relevant commits

| Commit | Description |
|--------|-------------|
| `22e5b40` | Current state: `treeBaseDuration` for widths + `isFresh`/`didRender` stale fiber detection |
| `15f0831` | Previous approach: `parentRendered` context + `PERFORMED_WORK` flags (had false positives) |
| `6f291e2` | Original profiler: distinguished "did not render" + flamegraph zoom |

---

## Constraints

- **DO NOT use `actualDuration > 0`** as a rendered signal — it includes subtree time and lights up the entire ancestor chain
- **DO NOT blindly check host children's `memoizedProps`** — double-buffering makes this unreliable across commits
- The fix must NOT cause regressions: components that correctly show as "did not render" must stay gray
- Only files in `packages/devtools/src/services/profiler/` and `packages/types/src/profiler.ts` should be modified for the detection logic
- The flamegraph layout (`FlamegraphLayout.ts`) should only change if the data shape changes

---

## Execution strategy

### Phase 1: Research (use a team of 10 subagents)

Spawn a team of 10 research agents in parallel. Each agent should focus on ONE of these tasks:

1. **Agent: DevTools `didFiberRender`** — Read the React DevTools source on GitHub. Find `didFiberRender` in `packages/react-devtools-shared/src/backend/fiber/renderer.js`. Copy the exact implementation. Document how it handles each fiber tag type.

2. **Agent: DevTools profiler data collection** — Find how DevTools collects per-commit profiling data. Search for `handleCommitFiberRoot`, `recordProfilingDurations`, `getCommitTree` in the DevTools source. How are `fiberActualDurations` and `fiberSelfDurations` populated?

3. **Agent: DevTools flamegraph coloring** — Find the flamegraph component in DevTools (`CommitFlamegraph`, `ChartNode`, or similar in `packages/react-devtools-shared/src/devtools/views/Profiler/`). How does it determine bar color? Does it use `didFiberRender` or compare durations?

4. **Agent: DevTools component filtering for profiling** — Find how component filters (the ones that collapse ForwardRef) affect the profiling tree. Search for `componentFilters`, `getElementTypeForFiber`, `shouldFilterFiber` in the DevTools backend.

5. **Agent: React `createWorkInProgress` and `memoizedProps`** — Read React's reconciler source. Trace `createWorkInProgress`, `beginWork`, `bailoutOnAlreadyFinishedWork`. When exactly is `memoizedProps` set? What value does `alternate.memoizedProps` have after a bail-out?

6. **Agent: React profiler timer** — Find where `actualDuration` is reset/accumulated in React's reconciler. Search for `actualDuration`, `actualStartTime`, `transferActualDuration` in React source. When is a stale `actualDuration` visible in `onCommitFiberRoot`?

7. **Agent: Decode profiling JSON** — Read the exported profiling JSON file. Decode the operations array to build the full component tree with IDs, types, parent-child relationships. Cross-reference with `fiberActualDurations` for each commit.

8. **Agent: Compare our snapshot tree with DevTools tree** — Analyze the profiling JSON component tree and compare it with what our `snapshotFiber` would produce. Document exactly which fibers appear in one but not the other.

9. **Agent: Explore `cloneChildFibers` and bail-out paths** — Read React's `bailoutOnAlreadyFinishedWork` and `cloneChildFibers`. What happens to `.child` references? How does this affect our `childrenFresh` detection?

10. **Agent: Study how React Native's `View` and `Text` are defined** — Read the React Native source for `View` and `Text` components. Are they ForwardRef, Function, or something else? How does `createAnimatedComponent` wrap them?

### Phase 2: Planning

Based on research findings, design the implementation approach. Key questions to answer:

- Should we change WHAT we capture (include host components)? Or HOW we detect render state?
- If including host components, how do we avoid doubling "View" entries (ForwardRef wrapper + host)?
- If changing detection logic, what signal reliably indicates "this component did work" without false positives on ancestor components?
- How does DevTools handle the same situation internally?

### Phase 3: Implementation (use a team of 10 agents)

Spawn a team of 10 implementation agents to work in parallel on isolated worktrees:

1. **Agent: Core detection logic** — Implement the chosen approach in `snapshotCommit.ts` and `buildProfilingData.ts`
2. **Agent: Type changes** — Update `FiberSnapshot`, `ProfilerComponentData`, and `ProfilerPhase` types as needed
3. **Agent: Constants** — Add any new fiber tag constants (e.g., `HOST_COMPONENT`) to `constants.ts`
4. **Agent: Flamegraph layout** — Update `FlamegraphLayout.ts` if data shape changes
5. **Agent: Duration attribution** — Ensure `actualDuration` and `selfBaseDuration` are correct for the new approach
6. **Agent: Build verification** — Run `bun run build:devtools` continuously to catch type errors
7. **Agent: Edge case testing** — Consider: first mount, animation frames, context changes, memo bail-outs
8. **Agent: Regression testing** — Verify ancestor components (SafeAreaProvider, AppContainer, etc.) still show as gray
9. **Agent: Duration display** — Verify labels show correct "Xms" values, not stale/zero values
10. **Agent: Integration review** — Review the full data pipeline from `snapshotCommit` → `buildProfilingData` → `FlamegraphLayout` → rendering

---

## Success criteria

1. The inner `View` and `Text` show as **colored/rendered** in Radar's flamegraph, matching DevTools
2. Ancestor components (RootComponent, AppContainer, SafeAreaProvider, ScrollView, etc.) still show as **gray/did-not-render** — no false positives
3. Components that genuinely did not render (e.g., `PressabilityDebugView`, `NetworkSection`) remain gray
4. Duration labels on rendered components show meaningful values (not 0ms)
5. `bun run build:devtools` passes with no type errors
