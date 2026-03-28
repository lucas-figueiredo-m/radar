# Profiler: Children Not Detected as Re-rendered

## Problem

When a parent component re-renders (mount or update), Radar's profiler shows some of its children as "did-not-render" (gray), while React DevTools correctly shows them as "update" (colored).

Example from the user's testing:

```
TouchableOpacity (did-not-render)     ← correct
  Animated(View) (update, 14.2ms)     ← correct
    View (update, 8.0ms)              ← correct
      View (did-not-render)           ← WRONG — React DevTools shows "update"
      Text (did-not-render)           ← WRONG — React DevTools shows "update"
      PressabilityDebugView (did-not-render) ← correct
```

## React Re-render Rules

When a parent component re-renders, ALL its children re-render too unless they have an explicit bailout mechanism:

1. **`React.memo`** — bails out if props are shallowly equal (fiber tag `SimpleMemoComponent=15` or `MemoComponent=14`)
2. **`useMemo` on JSX** — keeps the same element reference, so React skips reconciliation
3. **Children passed from above** — stable element references from a non-re-rendering ancestor
4. **ForwardRef built-in shallowEqual** — ForwardRef components have a built-in `shallowEqual(prevProps, nextProps)` check; if all props are referentially equal, they bail out without calling the render function
5. **`!didReceiveUpdate` path** — if `oldProps === newProps` (same object reference, e.g., from a stable element), React bails out in `beginWork` before even calling the component function. This is how `PressabilityDebugView` avoids re-rendering without being wrapped in `React.memo`.

## How React DevTools Detects Renders

React DevTools uses `didFiberRender(prevFiber, nextFiber)`:

```javascript
function didFiberRender(prevFiber, nextFiber) {
  switch (nextFiber.tag) {
    case ClassComponent:
    case FunctionComponent:
    case ContextConsumer:
    case MemoComponent:
    case SimpleMemoComponent:
    case ForwardRef:
      // PerformedWork flag is the authoritative signal
      return (nextFiber.flags & PerformedWork) === PerformedWork;
    default:
      // Host components: compare props/state references
      return (
        prevFiber.memoizedProps !== nextFiber.memoizedProps ||
        prevFiber.memoizedState !== nextFiber.memoizedState ||
        prevFiber.ref !== nextFiber.ref
      );
  }
}
```

Key insight: `PerformedWork` (bit 0 of `fiber.flags`) is the ground truth for user components. React sets it in `beginWork` when the component function actually executes. It is NOT set when a component bails out.

## How Radar Currently Detects Renders

Radar uses a two-phase approach:

### Phase 1: Snapshot (`snapshotCommit.ts`)

Walks the committed fiber tree and captures `FiberSnapshot` objects. Two key fields:

- **`isFresh`** — whether the fiber was part of this commit's work (not stale from a previous commit)
- **`didRender`** — whether `PerformedWork` flag is set on the fiber

**`isFresh` detection** uses `childrenFresh` propagated from parent to child:

```typescript
const childrenFresh =
  isFresh && (alternate === null || fiber.child !== alternate.child);
```

This checks if the fiber's child pointer differs from its alternate's child pointer. When React runs `reconcileChildren` or `cloneChildFibers`, it creates new child fibers, changing the pointer. When React bails out completely, `createWorkInProgress` copies `current.child` to `workInProgress.child`, keeping the same pointer.

### Phase 2: Build (`buildProfilingData.ts`)

Converts snapshots to `ProfilerComponentData` with a `phase`:

```
!isFresh                         → "did-not-render" (stale, skipped)
!hasAlternate                    → "mount" (new fiber)
didRender (PerformedWork set)    → "update"
else                             → "did-not-render" (bailed out)
```

## The Bug

The `childrenFresh` propagation via `fiber.child !== alternate.child` breaks for the children of rendered components. Specifically, after the outer `View` renders, its children `View` and `Text` are incorrectly marked as `isFresh = false`, which causes them to hit the first branch ("stale") before the `PerformedWork` check is even reached.

The `childrenFresh` chain passes through intermediate non-user-component fibers (e.g., `HostComponent` wrappers like `ViewNativeComponent` in React Native). If ANY intermediate fiber has `fiber.child === alternate.child`, the chain breaks and all downstream children appear stale.

## Approaches Tried (and why they failed)

### 1. Parent-based inference in `buildProfilingData`

**Idea:** If a parent rendered (mount/update) and a child is not a memo component, infer that the child also rendered.

**Problem:** False positives. `PressabilityDebugView` is NOT a memo component (tag is not 14 or 15), but it bails out via the `!didReceiveUpdate` path (stable props reference from parent). Parent inference incorrectly marked it as "update". Also, it didn't help View/Text because they were caught by `!isFresh` before reaching the inference logic.

### 2. `actualStartTime`-based freshness

**Idea:** React's `beginWork` sets `fiber.actualStartTime = now()` on every fiber it processes, and `createWorkInProgress` resets it to `-1`. Compare each fiber's `actualStartTime` against the root's to determine if it was processed in this commit.

**Problem:** Did not resolve the issue in testing. Needs further investigation — `actualStartTime` may not behave as expected in all React Native runtime configurations, or the comparison threshold may be off.

## Key Files

- `packages/devtools/src/services/profiler/snapshotCommit.ts` — fiber tree walking and freshness detection
- `packages/devtools/src/services/profiler/buildProfilingData.ts` — phase determination (mount/update/did-not-render)
- `packages/devtools/src/services/componentTree/constants.ts` — fiber tags and `PERFORMED_WORK` flag
- `packages/devtools/src/services/componentTree/fiberTypes.ts` — FiberNode type definition

## Relevant Fiber Properties

```typescript
type FiberNode = {
  tag: number;              // Component type (0=Function, 1=Class, 11=ForwardRef, 14=Memo, 15=SimpleMemo)
  child: FiberNode | null;  // First child fiber
  sibling: FiberNode | null;
  alternate: FiberNode | null; // Previous version (double-buffering)
  flags?: number;           // Work flags, bit 0 = PerformedWork
  actualDuration?: number;  // Time spent rendering (profiling mode)
  actualStartTime?: number; // When beginWork started (profiling mode)
  treeBaseDuration?: number;
  memoizedProps: Record<string, unknown> | null;
};
```

## What Needs to Happen

The core issue is **reliably detecting whether a fiber was processed in the current commit**. The `fiber.child !== alternate.child` heuristic fails for certain React Native fiber tree structures. A working solution needs to either:

1. **Fix the freshness detection** — find a reliable signal that a fiber was part of this commit's work (not carried over from a previous commit with stale flags)
2. **Or bypass freshness entirely** — use a different approach that doesn't require knowing if a fiber is "fresh", while still avoiding false positives from stale `PerformedWork` flags on unprocessed fibers

The constraint: stale fibers (not processed in this commit) can have `PerformedWork` set from a PREVIOUS commit. `createWorkInProgress` resets flags, but fibers inherited without processing retain their old flags. So `PerformedWork` alone is not sufficient — there must be some mechanism to filter out stale fibers.
