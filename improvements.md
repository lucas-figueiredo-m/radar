# Radar — Improvements

## radar-devtools

### Custom serializer for non-JSON-safe values
Currently using `JSON.parse(JSON.stringify(value))` which silently drops non-serializable properties (functions, undefined, Symbols, BigInt). When logging an object like `{ name: "test", onClick: () => {} }`, the `onClick` property vanishes with no indication.

Replace with a custom recursive serializer that walks the object and substitutes descriptive placeholders:
- Functions → `"[Function: onClick]"`
- undefined → `"[undefined]"`
- Symbol → `"[Symbol: description]"`
- BigInt → `"[BigInt: 123n]"`
- Circular references → `"[Circular]"`

### Patch XMLHttpRequest for broader network coverage
Currently only `global.fetch` is intercepted. Libraries like axios use `XMLHttpRequest` by default in React Native, so those requests are invisible. Monkey-patch `XMLHttpRequest.prototype.open` and `send` to capture method, URL, headers, body, status, and response for XHR-based traffic. This would cover virtually all JS-level HTTP libraries (axios, older jQuery-style code, etc.).

Additionally, native-level network calls (OkHttp on Android, URLSession on iOS) bypass JS entirely. These require native interceptors (OkHttp `Interceptor`, iOS `URLProtocol` subclass) built into the SDK as native modules — a separate, larger effort.

## radar-app

### Customizable dashboard layout
Replace the tab-only UI with a dual-mode approach:
- **Tabs (default):** Current behavior — familiar, zero learning curve, good for new users.
- **Dashboard mode:** A grid-based canvas where users can add panels, resize them (with snap), and see multiple tools side by side. This is where the real value lives — correlating a network request, console error, and CPU spike at the same time.

Each tab's content becomes a panel component that works in either mode. Toggle between modes via a button in the top bar.

### Layout presets (paid tier)
Predefined panel arrangements optimized for common workflows:
- **"Network Debug"** — network panel large on the left, console on the right, request detail below
- **"Performance"** — profiler flame chart on top, CPU/memory graphs bottom left, component tree bottom right
- **"General"** — balanced split of console, network, and component tree

Free users can build any custom layout manually but get one slot. Paid users get one-click templates, the ability to save multiple custom layouts, share layouts with their team, and project-specific layouts.

### Collapsible object/array expansion in log viewer
When logging objects or arrays, the console viewer should ellipsize the content and show a disclosure arrow. Tapping the arrow expands to show the full object content with proper indentation. Collapsing hides it again. Similar to how Chrome DevTools and Safari console handle object inspection.
