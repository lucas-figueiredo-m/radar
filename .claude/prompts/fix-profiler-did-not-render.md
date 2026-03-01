# Fix Profiler: Distinguish "Did Not Render" from "Update" Components

## Problem

Radar's profiler currently shows ALL components in every commit as either "mount" or "update", even components that **did not re-render** (bailed out). React DevTools correctly distinguishes these — it shows grey "Did not client render" bars for components that exist in the fiber tree but whose render function was NOT called during that commit.

### Side-by-side comparison (same profiling session, same device, same interactions):

**React DevTools**: `RootComponent` shows "Did not client render" — grey bar, no timing.
**Radar**: `RadarTestApp(RootComponent)` shows "Phase: Update, Parent re-render (8.7ms)" — colored bar with stale timing data.

This happens because:

1. **`snapshotCommit.ts`** walks the **entire fiber tree** on every commit, capturing ALL user components — including ones that React skipped (bailed out).
2. Every mounted component has a `fiber.alternate`, so our `hasAlternate` check marks them all as "update".
3. `fiber.actualDuration` retains **stale values** from the component's last actual render — React does NOT zero it out for bailed-out fibers. So we capture non-zero durations for components that didn't render, making them appear active.

### How React DevTools solves this

React tracks which fibers had work performed during a commit via internal flags on `fiber.flags`. The `PerformedWork` flag (bitmask value `1`) indicates the component's render function was actually called. React DevTools uses this to filter out bailed-out components.

## Expected Behavior

Components that bailed out should **still appear** in the flamegraph and ranked view — but displayed differently from components that actually rendered:

- **Rendered components**: colored bar (green/yellow/orange/red based on duration), show timing, phase (mount/update), and render triggers — exactly as they work today.
- **Did-not-render components**: grey bar, no timing displayed, tooltip says "Did not render". They must remain in the tree hierarchy so the flamegraph structure matches React DevTools.

**Do NOT hide or filter out** bailed-out components. They must be visible as grey bars, just like React DevTools shows them.

## Task

### Phase 1: Deep Investigation

Before writing any code, investigate thoroughly. **Spin up at least 6 subagents** to research these areas in parallel:

1. **React source code investigation**: Search the React reconciler source code (GitHub react repo) for how `PerformedWork`, `fiber.flags`, and `fiber.subtreeFlags` work. Understand the exact bitmask values and how React DevTools reads them. Check if these flags are available on the fiber objects we have access to at `onCommitFiberRoot` time, or if React clears them before/after commit.

2. **React DevTools profiler backend investigation**: Search the React DevTools source code (GitHub `facebook/react/packages/react-devtools-shared`) for how it determines "did not render" in its profiler. Look at `renderer.js`, `ReactFiberFlags`, and the profiling data collection path. Understand exactly what data React DevTools receives vs what we're reading directly from fibers.

3. **Current Radar snapshot pipeline review**: Read and analyze these files to understand the full data flow from fiber tree to UI:
   - `packages/devtools/src/services/profiler/snapshotCommit.ts`
   - `packages/devtools/src/services/profiler/buildProfilingData.ts`
   - `packages/devtools/src/services/profiler/detectRenderTriggers.ts`
   - `packages/devtools/src/services/profiler/index.ts`

4. **Fiber types and flags audit**: Read `packages/devtools/src/services/componentTree/fiberTypes.ts` and check what fiber properties we currently track. Research what additional properties (`flags`, `subtreeFlags`, `pendingProps`, `memoizedProps`, etc.) are available on real React Native fibers and could help identify bail-outs. Check React versions 18/19 for any differences.

5. **UI/rendering impact analysis**: Read the app-side rendering code to understand what changes are needed to display "did not render" state:
   - `apps/app/src/components/ProfilerPanel/FlamegraphLayout.ts`
   - `apps/app/src/components/ProfilerPanel/FlamegraphCanvas.ts`
   - `apps/app/src/components/ProfilerPanel/FlamegraphView.tsx`
   - `apps/app/src/components/ProfilerPanel/RankedView.tsx`
   - `apps/app/src/components/ProfilerPanel/ComponentStats.tsx`
   - `apps/app/src/components/ProfilerPanel/constants.ts`

6. **Types and message contract review**: Check what type changes are needed across the full pipeline:
   - `packages/types/src/profiler.ts` — shared types between SDK and app
   - `apps/app/src/types/profiler.ts` — app-side profiler types
   - `apps/app/src/hooks/useProfiler.ts` — state management and stats computation
   - `apps/app/src/utils/getDurationColor.ts` — color mapping
   - `apps/app/src/utils/flattenProfilerComponents.ts` — component flattening

### Phase 2: Implementation Plan

After investigation, produce a detailed plan. **Request an agent team** to implement the changes in parallel across these tracks:

- **Track A (SDK/Types)**: Update fiber types, modify snapshot pipeline to detect bail-outs, update shared types
- **Track B (UI/Rendering)**: Update flamegraph (grey bars for did-not-render), ranked view (show but de-emphasize), stats (exclude from timing aggregates), and constants (add grey color for did-not-render)
- **Track C (Hook/Wiring)**: Update useProfiler stats computation, type changes in app-side types

## Key Files Reference

### SDK — Profiler Service
- `packages/devtools/src/services/profiler/index.ts` — profiler lifecycle (start/stop/handleCommit)
- `packages/devtools/src/services/profiler/snapshotCommit.ts` — **PRIMARY FIX TARGET**: walks fiber tree, creates snapshots
- `packages/devtools/src/services/profiler/buildProfilingData.ts` — converts snapshots to ProfilerCommitData
- `packages/devtools/src/services/profiler/detectRenderTriggers.ts` — determines why a component re-rendered

### SDK — Component Tree / Fiber Infrastructure
- `packages/devtools/src/services/componentTree/fiberTypes.ts` — FiberNode type definition (**needs `flags` field**)
- `packages/devtools/src/services/componentTree/index.ts` — commit listener hook
- `packages/devtools/src/services/componentTree/constants.ts` — fiber tag constants (USER_COMPONENT_TAGS)
- `packages/devtools/src/services/componentTree/getComponentName.ts` — component name resolution
- `packages/devtools/src/services/componentTree/walkFiber.ts` — fiber tree walking
- `packages/devtools/src/services/componentTree/fiberIdMap.ts` — fiber-to-ID mapping

### SDK — Entry Point
- `packages/devtools/src/index.ts` — main init, wires profiler to commit listener

### Shared Types
- `packages/types/src/profiler.ts` — ProfilerComponentData, ProfilerCommitData, ProfilerPhase, RenderTrigger

### App — Profiler UI
- `apps/app/src/components/ProfilerPanel/index.tsx` — main panel layout
- `apps/app/src/components/ProfilerPanel/FlamegraphLayout.ts` — bar position/size computation
- `apps/app/src/components/ProfilerPanel/FlamegraphCanvas.ts` — canvas draw calls
- `apps/app/src/components/ProfilerPanel/FlamegraphView.tsx` — React wrapper, tooltip, hover
- `apps/app/src/components/ProfilerPanel/RankedView.tsx` — sorted component list
- `apps/app/src/components/ProfilerPanel/ComponentStats.tsx` — aggregate stats table
- `apps/app/src/components/ProfilerPanel/CommitTimeline.tsx` — commit bar chart
- `apps/app/src/components/ProfilerPanel/ProfilerToolbar.tsx` — toolbar controls
- `apps/app/src/components/ProfilerPanel/constants.ts` — thresholds, colors, sizing

### App — Hook, Types, Utils
- `apps/app/src/hooks/useProfiler.ts` — profiler state management, stats computation
- `apps/app/src/types/profiler.ts` — ProfilerView, ComponentStatsEntry
- `apps/app/src/utils/getDurationColor.ts` — duration-to-color mapping
- `apps/app/src/utils/flattenProfilerComponents.ts` — tree flattening for ranked view

### App — Electron/Transport
- `apps/app/electron/main.ts` — IPC command forwarding
- `apps/app/electron/websocketServer.ts` — WS server, message stamping

### Test Files (need `alternate` mock updates)
- `packages/devtools/src/services/componentTree/fiberIdMap.test.ts`
- `packages/devtools/src/services/componentTree/getComponentName.test.ts`
- `packages/devtools/src/services/componentTree/getSourceFile.test.ts`
- `packages/devtools/src/services/componentTree/inspectComponent.test.ts`
- `packages/devtools/src/services/componentTree/walkFiber.test.ts`
