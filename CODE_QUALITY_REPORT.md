# Radar - Code Quality Report

> Generated on 2026-02-28 by analyzing every file in the codebase across 22 parallel audit agents.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Overall Scores](#2-overall-scores)
3. [Coding Style Consistency](#3-coding-style-consistency)
4. [Code Reusability](#4-code-reusability)
5. [Testing](#5-testing)
6. [Good Practices](#6-good-practices)
7. [Bad Smells](#7-bad-smells)
8. [Clean Code Evaluation](#8-clean-code-evaluation)
9. [Package-by-Package Breakdown](#9-package-by-package-breakdown)
10. [Prioritized Recommendations](#10-prioritized-recommendations)

---

## 1. Executive Summary

Radar is a well-architected monorepo containing an Electron-based React DevTools app (`apps/app`), a client SDK for React Native (`packages/devtools`), a shared types package (`packages/types`), a design system (`packages/designSystem`), and a React Native example app (`apps/example`).

**The codebase demonstrates strong fundamentals**: consistent TypeScript usage, functional component patterns, proper monorepo structure, good separation of concerns, and a well-designed design token system. Utility functions are exemplary -- pure, well-typed, and thoroughly tested.

**Key areas of concern**: accessibility gaps across all UI components, missing virtualization for large lists/trees, `unknown`/`any` type violations against project conventions, inconsistent test coverage (utilities are excellent, components and hooks have zero tests), missing root-level configurations, and security issues in the Electron setup.

**Overall Quality: 7.2 / 10**

---

## 2. Overall Scores

| Category | Score | Status |
|----------|-------|--------|
| Coding Style Consistency | 7.5/10 | Good with notable exceptions |
| Code Reusability | 8/10 | Strong design system and utility layer |
| Testing | 6/10 | Excellent utility tests, zero component/hook tests |
| Good Practices | 7.5/10 | Solid architecture, good patterns |
| Bad Smells | 6.5/10 | Several identified across the codebase |
| Clean Code | 7.5/10 | Generally clean, some complexity hotspots |

---

## 3. Coding Style Consistency

### 3.1 CLAUDE.md Convention Adherence

The project has a well-defined `CLAUDE.md` with strict coding conventions. Here's how well they're followed:

| Convention | Compliance | Notes |
|-----------|-----------|-------|
| TypeScript exclusively | 95% | Babel plugin is JavaScript (deliberate but violates rule) |
| Arrow functions only | 100% | Perfect adherence across entire codebase |
| No class components | 100% | All functional components |
| No `any`/`unknown`/`never` | 70% | Multiple violations (see below) |
| `type` over `interface` | 100% | No interfaces found anywhere |
| Single export per file | 85% | Several files export multiple things |
| Named exports over default | 90% | Example app uses default exports throughout |
| PascalCase components | 100% | All components follow convention |
| camelCase utilities/hooks | 100% | Perfect adherence |
| UPPER_SNAKE_CASE constants | 90% | Design system uses kebab-case (CSS convention) |
| Props suffixed with `Props` | 100% | All props types properly named |
| Barrel files | 95% | Properly implemented throughout |

### 3.2 Forbidden Type Violations (`any`/`unknown`/`never`)

This is the most frequently violated convention:

| File | Type | Justification |
|------|------|---------------|
| `packages/types/src/network.ts` | `unknown` (x2) | requestBody/responseBody -- needs SerializedValue |
| `packages/types/src/console.ts` | `unknown` | args: unknown[] -- should be SerializedValue[] |
| `packages/devtools/src/index.ts` | `any` | globalThis cast -- eslint-disabled |
| `packages/devtools/src/services/network/index.ts` | `unknown` (x2) | requestBody/responseBody variables |
| `packages/devtools/src/services/console/serialize.ts` | `unknown` (x2) | parameter and return type |
| `packages/devtools/src/services/console/index.ts` | `unknown` | console args spread |
| `packages/devtools/src/services/componentTree/fiberTypes.ts` | `unknown` (x3) | stateNode, queue, memoizedProps |
| `packages/devtools/src/services/componentTree/serializeValue.ts` | `unknown` | function parameter |
| `packages/devtools/src/services/componentTree/serializeHooks.ts` | `unknown` (x3) | hookState parameters |
| `apps/app/src/services/ipc.ts` | `any` | window.require cast -- eslint-disabled |

**Total: ~18 violations across the codebase**

While some are justified (React fiber internals, dynamic globalThis access), many could be replaced with proper discriminated unions or specific types.

### 3.3 Single Export Per File Violations

| File | Exports | Should Be |
|------|---------|-----------|
| `packages/devtools/src/index.ts` | `init` + `RadarConfig` type | Separate files |
| `apps/app/src/types/console.ts` | `LogLevel` + `LogEntry` + `GroupedLogEntry` | Separate files |
| `apps/app/src/types/componentTree.ts` | `ComponentTreeNode` + `ComponentTreeState` | Separate files |
| `packages/devtools/src/services/componentTree/fiberIdMap.ts` | Object with 3 methods | Single exported object (acceptable) |

### 3.4 Styling Approach

The codebase uses **Tailwind CSS + inline styles + design system tokens**. This is mostly consistent, but there are deviations:

- **Hardcoded Tailwind colors** in several components (`bg-amber-400`, `bg-neutral-500`, `text-amber-400`) instead of design system semantic tokens
- **Inconsistent spacing values**: `py-[7px]`, `py-[3px]`, `text-[11px]` scattered across components without constants
- **Mixed patterns**: Some components use inline `style={{}}` for dynamic values, others use Tailwind arbitrary values

### 3.5 Example App Inconsistencies

The example app (`apps/example`) significantly deviates from CLAUDE.md:
- Uses **default exports** everywhere (convention says prefer named)
- Uses **flat file structure** instead of folder-based components
- Constants defined inline instead of in `constants.ts` files
- No barrel file pattern

---

## 4. Code Reusability

### 4.1 Strengths

- **Design System** (`packages/designSystem`): Excellent dual-export strategy (CSS variables + literal values), well-organized tokens, actively used across 14+ components. Score: **9/10**

- **Shared Types** (`packages/types`): Clean type definitions for wire protocol, properly shared between SDK and app. Score: **8/10**

- **Utility Functions** (`apps/app/src/utils`): 17 pure, focused utilities with proper barrel file. Highly composable and testable. Score: **9/10**

- **Component Composition**: DetailSection/DetailRow are properly abstracted and reused. CopyButton duplication was resolved with barrel re-export. Score: **8/10**

### 4.2 Weaknesses

- ~~**No shared Dropdown component**: EditorPicker and DeviceList implement nearly identical dropdown patterns independently~~ **Resolved**: Shared `useClickOutside` hook extracted; dropdowns differ enough that a shared component would over-abstract
- ~~**Duplicated React fiber constants**: `FUNCTION_COMPONENT`, `CLASS_COMPONENT`, etc. defined in 3 separate files instead of centralized in `constants.ts`~~ **Resolved**: Consolidated in `componentTree/constants.ts`
- ~~**Duplicated type guards**: `isFiberComponentType` defined in both `inspectComponent.ts` and `getSourceFile.ts`~~ **Resolved**: Extracted to `componentTree/isFiberComponentType.ts`
- ~~**Missing generic components**: No shared ListItem, Badge, or StatusIndicator components despite similar patterns across panels~~ **Partially resolved**: `StatusDot` component extracted for connection status indicators

### 4.3 Design System Gaps

| Category | Status | Notes |
|----------|--------|-------|
| Colors | Complete (48 tokens) | Excellent semantic naming |
| Typography families | Complete (3 tokens) | mono, ui, display |
| Font sizes | Missing | Not defined as tokens |
| Font weights | Missing | Not defined as tokens |
| Line heights | Missing | Not defined as tokens |
| Spacing | Complete (14 tokens) | Tailwind-like scale |
| Border radius | Complete (6 tokens) | Good semantic scale |
| Shadows | Complete (4 tokens) | Good hierarchy |
| Z-index | Missing | Critical for layering |
| Animation/transitions | Missing | No timing/easing tokens |
| Status warning color | Missing | Using hardcoded `amber-400` |

---

## 5. Testing

### 5.1 Coverage Overview

| Area | Test Files | Coverage | Quality |
|------|-----------|----------|---------|
| App utilities | 13 test files | ~95% of utilities | Excellent |
| Devtools componentTree | 6 test files | ~70% of functions | Good with gaps |
| Devtools console | 1 test file | ~70% of serialize | Good |
| Devtools network | 1 test file | ~30% (only headers util) | Poor -- patchFetch untested |
| Devtools babel plugin | 1 test file | ~85% | Good |
| App components | 0 test files | 0% | None |
| App hooks | 0 test files | 0% | None |
| App services | 0 test files | 0% | None |
| Electron main process | 0 test files | 0% | None |
| Example app | 1 test file | Trivial smoke test | Poor |

### 5.2 What's Tested Well

**Utility functions** are the highlight of the test suite:
- 13 test files covering formatting, filtering, searching, color mapping
- Excellent edge case coverage (boundary values, null/undefined, invalid inputs)
- Proper test naming with describe/it blocks
- Good use of factory helpers (`makeNode`, `makeEntry`)
- Pure functions make testing straightforward

**ComponentTree service tests** are solid:
- walkFiber, fiberIdMap, getComponentName, getSourceFile, serializeValue, inspectComponent all tested
- Covers React fiber traversal, serialization, component identification
- 18 babel plugin tests with 100% pass rate

### 5.3 What's NOT Tested

**Critical gaps:**

1. **Zero component tests**: No rendering tests for any React component (ConsolePanel, NetworkPanel, ComponentTreePanel, Sidebar, Header, etc.)
2. **Zero hook tests**: useDevTools, useDeviceManager, useEditorPreference have no tests despite complex state logic
3. **Zero service tests**: IPC communication, command sending, editor opening untested
4. **patchFetch untested**: The main network interception function has zero coverage
5. **patchConsole untested**: The console interception function has zero coverage
6. **Electron main process untested**: WebSocket server, device detection IPC, all untested
7. **countNodes.ts**: The only utility function without a test file

### 5.4 Test Quality Issues

- **fiberIdMap.test.ts**: Tests are order-dependent due to shared module state (no reset between tests)
- **formatTime.test.ts**: Timezone-dependent tests could fail in different locales
- **No coverage configuration**: vitest has no coverage thresholds or reporter setup
- **No integration tests**: No end-to-end flow testing
- **Missing mock infrastructure**: vitest.setup.ts only imports jest-dom; no mocks for WebSocket, fetch, Electron IPC, or localStorage

---

## 6. Good Practices

### 6.1 Architecture

- **Clean monorepo structure**: Proper workspace separation (apps/packages), workspace protocol dependencies
- **Strong type system**: Shared types package prevents drift between SDK and app
- **Design token strategy**: Dual-export (CSS vars + literal values) enables flexible consumption
- **Service layer**: Clear separation between IPC, commands, and editor integration
- **Barrel file pattern**: Consistently applied for clean import paths

### 6.2 Code Patterns

- **Pure utility functions**: All 17 utilities are pure, focused, and well-typed
- **Proper React patterns**: useCallback, useMemo, useEffect with correct dependency arrays
- **Defensive programming**: Try-catch in URL parsing, JSON.parse, and serialization
- **Proper cleanup**: useEffect cleanup functions for event listeners and timers
- **Semantic color system**: Design tokens with meaningful names (`bg-surface`, `text-primary`)

### 6.3 Development Workflow

- **Conventional commits**: Enforced via commitlint + husky
- **Pre-push checks**: Lint, typecheck, and test gates before push
- **Strict TypeScript**: `strict: true` in all tsconfig files
- **ESLint + Prettier**: Configured in all workspaces
- **Bun exclusively**: Package manager enforced via CLAUDE.md

---

## 7. Bad Smells

### 7.1 Critical

| Smell | Location | Impact |
|-------|----------|--------|
| **Electron security: nodeIntegration: true** | `apps/app/electron/main.ts:49-50` | Disables Electron's security model. Should use preload scripts with contextIsolation: true |
| **No virtualization** | ConsolePanel, NetworkPanel, ComponentTreePanel | Lists grow unbounded in DOM. Will cause severe performance issues with 1000+ items |
| **Unbounded state growth** | `useDevTools.ts` (logs, requests, componentTrees) | Arrays grow infinitely. No pruning, max size, or circular buffer |
| **Global mutable counter** | `useDevTools.ts:20` (`let nextLogId = 0`) | Module-level state persists across instances, never resets |
| **Missing error handling in hooks** | `useEditorPreference.ts` | IPC Promise chains have no `.catch()` handlers |

### 7.2 High

| Smell | Location | Impact |
|-------|----------|--------|
| No recursion depth limit | ValueRenderer components | Deeply nested objects can cause stack overflow |
| No circular reference detection | ValueRenderer components | Could infinitely recurse |
| WebSocket no max retry/backoff | `packages/devtools/src/connection.ts` | Infinite reconnection attempts, no exponential backoff |
| Message queue unbounded | `packages/devtools/src/connection.ts` | Queue grows without limit if connection is down |
| Package entry points wrong | `packages/devtools/package.json` | main/types point to `src/` instead of `dist/` |
| DOM lib in React Native tsconfig | `packages/devtools/tsconfig.json` | Allows incorrect DOM API usage in React Native code |
| Babel plugin in JavaScript | `packages/devtools/babel-plugin.js` | Violates TypeScript-only convention |

### 7.3 Medium

| Smell | Location | Impact |
|-------|----------|--------|
| ~~Duplicated fiber constants~~ | ~~3 files in componentTree~~ | **Resolved**: Consolidated in `constants.ts` |
| ~~Duplicated type guards~~ | ~~inspectComponent.ts + getSourceFile.ts~~ | **Resolved**: Extracted to `isFiberComponentType.ts` |
| Hardcoded colors | DeviceList, Header, CliToolAlert | Uses `amber-400`, `neutral-500` instead of design tokens |
| Inconsistent state patterns | DeviceSelector vs StatusBar | One manages own dropdown state, other delegates to parent |
| Magic numbers | Multiple components | `py-[7px]`, `text-[11px]`, `5000` (body truncation), `50` (max rendered-by depth) |
| CSS/TS manual sync | Design system | Token values must be manually kept in sync between CSS and TypeScript |
| No theme support | Design system | Hard-coded dark theme, no light mode variant |
| Missing React.memo | TreeNode, ObjectEntry, ArrayEntry | Recursive components re-render without memoization |

### 7.4 Low

| Smell | Location | Impact |
|-------|----------|--------|
| Silent error suppression | Multiple catch blocks | Errors swallowed without logging |
| Pre-push hook no fail-fast | `.husky/pre-push` | Commands don't chain with `&&` |
| No debouncing on search | ComponentTreePanel | Rapid typing causes performance issues |
| Nested try-catch in patchFetch | network/index.ts | Could be extracted to helpers |
| Inconsistent Props type export | Some exported, some not | Inconsistency across component files |

---

## 8. Clean Code Evaluation

### 8.1 Naming (9/10)

Naming is a strength of this codebase:
- Component names clearly describe purpose: `ConsolePanel`, `NetworkDetailPanel`, `ComponentTreePanel`
- Utility names are verb-based and descriptive: `formatDuration`, `statusColor`, `filterTreeBySource`
- Hook names follow React conventions: `useDevTools`, `useDeviceManager`
- Constants are semantic: `LEVEL_STYLES`, `METHOD_COLORS`, `NAV_ITEMS`
- Design tokens use semantic naming: `bg-surface`, `text-primary`, `border-subtle`

### 8.2 Functions (8/10)

- Utilities are small, pure, and single-purpose (5-28 lines each)
- Arrow functions used consistently
- Most components are reasonably sized (25-180 lines)
- Some functions could be extracted from larger components (ConsolePanel's filter bar, ComponentTreePanel's toolbar)

### 8.3 Single Responsibility (7.5/10)

- Good: Each utility file does one thing
- Good: Service files have clear responsibilities
- Mixed: `useDevTools` manages 5 state variables with interconnected logic (could be split)
- Mixed: `electron/main.ts` (272 lines) mixes WebSocket server, IPC handlers, device tracking, and auto-updater
- Weak: `patchFetch` handles URL extraction, header conversion, body parsing, timing, and message creation in one function

### 8.4 Error Handling (5.5/10)

This is the weakest area:
- Utilities handle errors well (try-catch in URL parsing, regex compilation)
- Services have inconsistent error handling
- Hooks are missing `.catch()` on Promises
- Components have no error boundaries
- Connection management silently fails
- No structured error types (just string messages)

### 8.5 DRY Principle (8/10)

- Good: Design system prevents color/spacing duplication
- Good: Shared types package
- Good: CopyButton duplication was resolved
- Good: React fiber constants consolidated in `componentTree/constants.ts`
- Good: `isFiberComponentType` type guard extracted to shared module
- Good: Shared `useClickOutside` hook and `StatusDot` component eliminate dropdown/status indicator duplication

### 8.6 Comments and Documentation (4/10)

- No JSDoc comments on any public API
- No README for the project (only generic React Native boilerplate in example)
- No ARCHITECTURE.md explaining the monorepo structure
- No CONTRIBUTING.md
- Code is generally self-documenting but complex areas (fiber traversal, serialization) would benefit from comments
- `improvements.md` exists but is informal

---

## 9. Package-by-Package Breakdown

### 9.1 `packages/types` -- Score: 8/10

**Strengths**: Clean type definitions, proper barrel file, good discriminated unions (SerializedValue), consistent `type` usage.

**Issues**: 3 `unknown` type violations, inconsistent semicolons in `device.ts`, `CliToolStatus` should be in its own file.

### 9.2 `packages/designSystem` -- Score: 8/10

**Strengths**: Excellent dual-export strategy, comprehensive color palette (48 tokens), consistent naming, proper `as const` usage, good CSS variable integration.

**Issues**: Missing font size/weight/line-height tokens, no z-index scale, no theme variants, manual CSS/TS sync risk, kebab-case deviates from UPPER_SNAKE_CASE convention.

### 9.3 `packages/devtools` -- Score: 6.5/10

**Strengths**: Clean service architecture, proper fiber traversal, good serialization strategy, comprehensive babel plugin with 18 tests.

**Issues**: 10+ `unknown`/`any` violations, package entry points reference `src/` instead of `dist/`, babel plugin in JavaScript, DOM lib in tsconfig, no error logging in connection management, patchFetch/patchConsole have zero tests.

### 9.4 `apps/app` -- Score: 7.5/10

**Strengths**: Well-structured components, excellent utility layer (17 utilities, 13 test files), clean hook design, proper barrel files, good design system integration.

**Issues**: Zero component/hook tests, accessibility gaps (no ARIA attributes, no keyboard navigation), no virtualization, Electron security misconfiguration, unbounded state growth in useDevTools.

### 9.5 `apps/example` -- Score: 3/10

**Strengths**: Demonstrates basic console and network features, uses real API endpoints.

**Issues**: Violates most CLAUDE.md conventions (default exports, flat structure, inline constants), single trivial test, no documentation, missing feature coverage (component tree, multi-device, editor integration), generic README.

---

## 10. Prioritized Recommendations

### P0 -- Critical (Security/Stability)

1. **Fix Electron security configuration**: Set `contextIsolation: true` and `nodeIntegration: false`. Use a preload script for IPC.
2. **Add state pruning to useDevTools**: Implement max size limits for logs, requests, and componentTrees arrays.
3. **Fix package entry points**: Update `packages/devtools/package.json` to point main/types/exports to `dist/` instead of `src/`.

### P1 -- High (Performance/Reliability)

4. **Add virtualization**: Implement `react-window` or equivalent for ConsolePanel, NetworkPanel, and ComponentTreePanel.
5. **Add recursion depth limit**: ValueRenderer needs a maxDepth prop and circular reference detection via WeakSet.
6. **Add WebSocket backoff**: Implement exponential backoff with max retry limit in connection.ts.
7. **Add error handling to hooks**: Add `.catch()` to all IPC Promise chains in useEditorPreference.
8. **Add React.memo to recursive components**: TreeNode, ObjectEntry, ArrayEntry.
9. **Fix pre-push hook**: Chain commands with `&&` for fail-fast behavior.

### P2 -- Medium (Code Quality)

10. **Replace `unknown`/`any` with proper types**: Create discriminated unions for serializable values, use `SerializedValue` consistently across console and network types.
11. ~~**Centralize React fiber constants**: Move FUNCTION_COMPONENT, CLASS_COMPONENT, etc. to a single `constants.ts` and import everywhere.~~ **Done**
12. **Add component/hook tests**: Start with useDevTools (most complex hook) and ConsolePanel (most used panel).
13. **Add vitest coverage configuration**: Set minimum thresholds and add coverage reporter.
14. **Create missing design tokens**: Add font sizes, font weights, z-index scale, warning status colors.
15. **Add accessibility attributes**: aria-label on buttons, role="tree"/role="treeitem" on tree components, aria-pressed on filter buttons, keyboard navigation.
16. **Migrate babel plugin to TypeScript**: Write in TypeScript, compile to JS for distribution.
17. **Add root-level configs**: tsconfig.base.json, .editorconfig, .gitattributes, .nvmrc.

### P3 -- Low (Polish)

18. ~~**Create shared Dropdown component**: Extract pattern from EditorPicker/DeviceList.~~ **Done**: Extracted `useClickOutside` hook instead (dropdowns differ too much for a shared component)
19. **Eliminate hardcoded colors**: Replace all `amber-400`, `neutral-500` with design system tokens.
20. **Add search debouncing**: 100-200ms debounce on ComponentTreePanel search input.
21. **Refactor electron/main.ts**: Extract WebSocket server, IPC handlers, and device tracking into separate modules.
22. **Move global counter to state**: Replace `let nextLogId = 0` with proper state management.
23. **Add documentation**: Create root README.md, CONTRIBUTING.md, ARCHITECTURE.md.
24. **Fix example app**: Align with CLAUDE.md conventions, add feature coverage, write proper tests.
25. **Add single source of truth for design tokens**: Build script to generate CSS from TypeScript (or vice versa).

---

*This report analyzed 130+ TypeScript/JavaScript files across 5 packages using 22 parallel audit agents examining every file in the codebase.*
