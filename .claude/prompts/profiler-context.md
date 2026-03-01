# Profiler — Context & Status

## What Radar's Profiler Does

Radar is a React Native DevTools desktop app. Its profiler captures per-commit data from a connected React Native device, similar to React DevTools' profiler. It shows which components rendered, how long they took, and what triggered each render.

## Architecture Overview

### Device side (`packages/devtools`)

1. **`profiler/index.ts`** — `createProfilerService(send)` factory. Hooks into `onCommitFiberRoot` via the React DevTools global hook. While profiling is active, each commit triggers `snapshotCommit(root)` and the snapshot is pushed to an array. On stop, `buildProfilingData(snapshots)` converts them to `ProfilerCommitData[]` and sends via IPC.

2. **`profiler/snapshotCommit.ts`** — Walks `root.current` post-commit, captures `FiberSnapshot` objects for user components only (filtered by `USER_COMPONENT_TAGS`). Each snapshot stores:
   - `fiber` — direct reference to the actual `FiberNode` object (not a copy)
   - `hasAlternate` — `!!fiber.alternate` at snapshot time
   - `flags` — `fiber.flags` at snapshot time
   - `actualDuration`, `selfBaseDuration`
   - `children` — recursive snapshots

3. **`profiler/buildProfilingData.ts`** — Converts `FiberSnapshot` trees into `ProfilerComponentData` trees. Determines the phase of each component (`mount`, `update`, `did-not-render`) and detects render triggers. This is where the main bug was.

4. **`profiler/detectRenderTriggers.ts`** — Compares `fiber.memoizedProps` vs `fiber.alternate.memoizedProps` (shallow key comparison) and checks `memoizedState` changes to determine what triggered a render (props, state, hooks, parent).

### Desktop app side (`apps/app`)

5. **`hooks/useProfiler.ts`** — Manages profiler state (sessions, commits, selected commit). Computes `componentStats` (aggregate stats across all commits per component).

6. **`ProfilerPanel/index.tsx`** — Main panel with three views: Flamegraph, Ranked, Component Stats. Has a toolbar for start/stop profiling and commit navigation.

7. **`ProfilerPanel/FlamegraphLayout.ts`** — Pure layout computation. Takes `ProfilerComponentData[]` + container dimensions → `FlamegraphBar[]`. Handles both full view and zoomed view (click to zoom into a component's subtree). Uses `DID_NOT_RENDER_COLOR` for did-not-render bars, `getDurationColor()` for rendered bars.

8. **`ProfilerPanel/FlamegraphCanvas.ts`** — Canvas 2D renderer. Draws bars, hover highlights, text labels. Draws diagonal stripe pattern on `skipped` bars (see below).

9. **`ProfilerPanel/FlamegraphView.tsx`** — React component wrapping the canvas. Handles mouse interaction (hover, click-to-zoom, double-click-to-reset), tooltips, and zoom animation with eased transitions.

10. **`ProfilerPanel/RankedView.tsx`** — Sorted list of components by render duration. Did-not-render components sorted to the bottom.

## Types (`packages/types/src/profiler.ts`)

```typescript
type ProfilerPhase = 'mount' | 'update' | 'did-not-render';

type ProfilerComponentData = {
  id: string;
  name: string;
  actualDuration: number;
  selfBaseDuration: number;
  phase: ProfilerPhase;
  skipped: boolean;        // true = fiber was never checked (parent bailed out entirely)
  triggers: RenderTrigger[];
  children: ProfilerComponentData[];
};
```

## The Main Bug: Incorrect `did-not-render` Detection

### Problem

React's double-buffering means that when a subtree is completely unchanged, React **reuses the same fiber objects** — no work-in-progress is created. These reused fibers have `alternate = null` and retain the stale `PERFORMED_WORK` flag from their original mount.

The original phase logic was:
```
if (!hasAlternate) → 'mount'           // WRONG for reused fibers
if (hasAlternate && PERFORMED_WORK) → 'update'
if (hasAlternate && !PERFORMED_WORK) → 'did-not-render'
```

This caused ALL reused fibers (the vast majority of the tree) to show as colored "mount" bars, when they should be gray "did not render" bars.

### Failed Attempt 1: `seenFiberIds` across commits

Tracked fiber IDs (from `fiberIdMap` WeakMap) in a `Set<string>` across commits. If `!hasAlternate` but the ID was seen in a prior commit → `did-not-render`.

**Why it failed:** This approach can't help on **commit 0** (the first profiling commit) because the set is empty. Since profiling typically starts on a running app, the first commit already has most fibers as reused — and they all get misclassified as `mount`.

### Fix (current): `parentRendered` context propagation

The key insight comes from React's reconciliation:

- When a parent **renders**, `reconcileChildFibers` calls `useFiber` / `createWorkInProgress` on ALL existing children, giving them alternates. So a child with `!hasAlternate` under a rendered parent is **genuinely new** (a real mount).
- When a parent **bails out** entirely (no `childLanes`), children are untouched — same fiber objects, no alternates. A child with `!hasAlternate` here is a **reused/skipped** fiber.

Current phase logic:
```
if (!hasAlternate && (seenFibers.has(fiber) || !parentRendered)) → 'did-not-render' (skipped=true)
if (!hasAlternate && parentRendered) → 'mount'
if (hasAlternate && PERFORMED_WORK) → 'update'
if (hasAlternate && !PERFORMED_WORK) → 'did-not-render' (skipped=false)
```

`parentRendered` propagates through the tree: root level gets `true` (root always renders during a commit), and each component passes `phase === 'mount' || phase === 'update'` to its children.

A `WeakSet<FiberNode>` (`seenFibers`) is kept across commits as a safety net — if the same fiber object appears in a later commit, it's definitely not a new mount.

### Two visual patterns for did-not-render

- **Solid gray** (`skipped = false`): Component was checked by React but bailed out (has alternate, no `PERFORMED_WORK`). React considered it but found no work.
- **Striped gray** (`skipped = true`): Component was never even checked (no alternate, parent bailed out entirely). Diagonal stripe pattern drawn via canvas clip + stroke.

## What's Working Now

- The multiple ConsoleOptions (and similar deep components) no longer incorrectly show as mounts/updates. Only the component that actually changed shows as re-rendered.
- Flamegraph correctly shows colored bars only for components that rendered, gray for everything else.
- Zoom animation works with eased transitions.
- Render triggers detection works (props changed keys, state, hooks, parent).
- Ranked view and component stats aggregate correctly.

## Remaining Known Issues

These were observed but not yet fixed:

1. **Some components may still show incorrect phases in edge cases** — The `parentRendered = true` at root level assumes the root always renders, which is correct for React's architecture but hasn't been exhaustively tested across all React Native versions.

2. **Stripe pattern visual refinement** — The current stripe (6px step, `rgba(255,255,255,0.12)`) may need tweaking for visual clarity. React DevTools uses a slightly different pattern.

3. **First commit accuracy** — When profiling starts mid-session, the very first commit classifies all `!hasAlternate` fibers under rendered parents as `mount`. In rare cases where a rendered parent has old children that somehow kept `!hasAlternate` (shouldn't happen per React's reconciliation, but worth monitoring), these would be false mounts.

4. **`actualDuration` staleness** — Reused fibers retain stale `actualDuration` from their original mount. We zero it out for `did-not-render` components, but if phase detection is wrong, the stale duration leaks through.

5. **Fiber ID stability** — `fiberIdMap` uses a `WeakMap<FiberNode, string>`. When fibers are garbage collected and new ones created (across navigations, etc.), IDs are not stable. This affects component stats aggregation across commits where the "same" logical component gets different IDs.

## Key Files Quick Reference

| File | Package | Role |
|------|---------|------|
| `profiler/index.ts` | devtools | Service factory, start/stop, IPC |
| `profiler/snapshotCommit.ts` | devtools | Walks fiber tree at commit time |
| `profiler/buildProfilingData.ts` | devtools | Phase detection, data transform |
| `profiler/detectRenderTriggers.ts` | devtools | Props/state/hooks diff |
| `types/profiler.ts` | types | Shared type definitions |
| `ProfilerPanel/index.tsx` | app | Main panel UI |
| `ProfilerPanel/FlamegraphView.tsx` | app | Flamegraph interaction + animation |
| `ProfilerPanel/FlamegraphLayout.ts` | app | Bar layout computation |
| `ProfilerPanel/FlamegraphCanvas.ts` | app | Canvas 2D rendering + stripes |
| `ProfilerPanel/RankedView.tsx` | app | Sorted component list |
| `ProfilerPanel/ComponentStats.tsx` | app | Aggregate stats table |
| `ProfilerPanel/CommitTimeline.tsx` | app | Commit bar timeline |
| `ProfilerPanel/constants.ts` | app | Colors, dimensions |
| `hooks/useProfiler.ts` | app | Profiler state management |

## Relevant Commits

```
15f0831 fix: correct did-not-render phase detection using parent render context
6f291e2 feat: distinguish "did not render" components and add flamegraph zoom
7948ed4 chore: remove profiler debug logs
9dc040f feat: add Profiler panel with flamegraph, ranked view, and component stats
```
