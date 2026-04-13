import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { DocsLayout } from '@/components/DocsLayout';
import { CodeBlock } from '@/components/CodeBlock';
import { McpProviderSwitcher } from '@/components/McpProviderSwitcher';
import { PackageManagerSwitcher } from '@/components/PackageManagerSwitcher';

const DocsPage = () => {
  return (
    <>
      <Navbar />
      <DocsLayout>
        <div className="space-y-16">
          {/* Installation */}
          <section id="installation" className="scroll-mt-24">
            <h1 className="font-display font-bold text-3xl tracking-tight mb-6">
              Installation
            </h1>
            <p className="text-text-secondary leading-relaxed mb-6">
              Add the Radar devtools package to your React Native project. Radar
              works with both bare React Native and Expo projects.
            </p>

            <p className="text-text-secondary text-sm leading-relaxed mb-8">
              Requires <strong className="text-text-primary">React 18+</strong>,{' '}
              <strong className="text-text-primary">React Native 0.72+</strong>,
              and{' '}
              <strong className="text-text-primary">New Architecture</strong>{' '}
              enabled. Works with both bare React Native and Expo.
            </p>

            <h2 className="font-semibold text-lg mb-3">
              Step 1: Install the package
            </h2>
            <div className="mb-6">
              <PackageManagerSwitcher />
            </div>

            <h2 className="font-semibold text-lg mb-3">
              Step 2: Initialize in your app
            </h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              Add the following to your app&apos;s entry point (e.g.,{' '}
              <code className="font-mono text-sm bg-bg-surface px-1.5 py-0.5 rounded">
                App.tsx
              </code>{' '}
              or{' '}
              <code className="font-mono text-sm bg-bg-surface px-1.5 py-0.5 rounded">
                index.ts
              </code>
              ):
            </p>
            <CodeBlock
              code={`if (__DEV__) {\n  const { init } = require('radar-devtools');\n  init();\n}`}
              className="mb-6"
            />

            <div className="bg-bg-surface border border-border-default rounded-xl p-4">
              <p className="text-sm text-text-secondary">
                <strong className="text-text-primary">Note:</strong> Wrapping in{' '}
                <code className="font-mono text-xs bg-bg-elevated px-1.5 py-0.5 rounded">
                  __DEV__
                </code>{' '}
                ensures Radar is fully tree-shaken from production builds. Call{' '}
                <code className="font-mono text-xs bg-bg-elevated px-1.5 py-0.5 rounded">
                  init()
                </code>{' '}
                before any other code to capture all console logs and network
                requests.
              </p>
            </div>
          </section>

          {/* Quick Start */}
          <section id="quick-start" className="scroll-mt-24">
            <h1 className="font-display font-bold text-3xl tracking-tight mb-6">
              Quick Start
            </h1>
            <p className="text-text-secondary leading-relaxed mb-6">
              Once you&apos;ve installed and initialized the devtools package,
              connecting to Radar is automatic.
            </p>

            <ol className="space-y-4 mb-6">
              <li className="flex gap-3">
                <span className="text-accent font-bold font-mono">1.</span>
                <div>
                  <p className="text-text-primary font-medium">
                    Open the Radar desktop app
                  </p>
                  <p className="text-text-secondary text-sm">
                    Download and launch Radar on your development machine.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="text-accent font-bold font-mono">2.</span>
                <div>
                  <p className="text-text-primary font-medium">
                    Run your React Native app
                  </p>
                  <p className="text-text-secondary text-sm">
                    Start your app on a simulator, emulator, or physical device.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="text-accent font-bold font-mono">3.</span>
                <div>
                  <p className="text-text-primary font-medium">
                    Start debugging
                  </p>
                  <p className="text-text-secondary text-sm">
                    Your app will automatically connect to Radar. You&apos;ll
                    see console logs, network requests, and more in real time.
                  </p>
                </div>
              </li>
            </ol>
          </section>

          {/* Configuration */}
          <section id="configuration" className="scroll-mt-24">
            <h1 className="font-display font-bold text-3xl tracking-tight mb-6">
              Configuration
            </h1>
            <p className="text-text-secondary leading-relaxed mb-6">
              Radar works out of the box with zero configuration for most
              setups. For advanced use cases, you can customize the connection
              and enable additional features.
            </p>

            <h2 className="font-semibold text-lg mb-3">State Management</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              To inspect Redux, Zustand, or other stores, pass them to{' '}
              <code className="font-mono text-xs bg-bg-surface px-1.5 py-0.5 rounded">
                init()
              </code>{' '}
              via the{' '}
              <code className="font-mono text-xs bg-bg-surface px-1.5 py-0.5 rounded">
                stores
              </code>{' '}
              option:
            </p>
            <CodeBlock
              code={`import { counterStore } from './stores/counterStore';\n\nif (__DEV__) {\n  const { init } = require('radar-devtools');\n  init({\n    stores: { counter: counterStore },\n  });\n}`}
              className="mb-4"
            />
            <p className="text-text-secondary text-sm leading-relaxed mb-4">
              For Zustand, pass the store hook directly:
            </p>
            <CodeBlock
              code={`import { useTodoStore } from './stores/todoStore';\n\nif (__DEV__) {\n  const { init } = require('radar-devtools');\n  init({\n    stores: { todos: useTodoStore },\n  });\n}`}
              className="mb-8"
            />

            <h2 className="font-semibold text-lg mb-3">Storage</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              AsyncStorage is detected automatically. For MMKV, pass your
              instances to{' '}
              <code className="font-mono text-xs bg-bg-surface px-1.5 py-0.5 rounded">
                init()
              </code>
              :
            </p>
            <CodeBlock
              code={`import { createMMKV } from 'react-native-mmkv';\n\nconst defaultStorage = createMMKV();\nconst settingsStorage = createMMKV({ id: 'settings' });\n\nif (__DEV__) {\n  const { init } = require('radar-devtools');\n  init({\n    mmkvInstances: {\n      default: defaultStorage,\n      settings: settingsStorage,\n    },\n  });\n}`}
              className="mb-8"
            />

            <h2 className="font-semibold text-lg mb-3">
              Startup Metrics and TTI
            </h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              Radar automatically measures JS bundle eval time. To track Time To
              Interactive (TTI), call{' '}
              <code className="font-mono text-xs bg-bg-surface px-1.5 py-0.5 rounded">
                markInteractive()
              </code>{' '}
              when your app&apos;s main UI is ready:
            </p>
            <CodeBlock
              code={`if (__DEV__) {\n  const { init } = require('radar-devtools');\n  init();\n}\n\nconst onReady = () => {\n  if (__DEV__) {\n    const { markInteractive } = require('radar-devtools');\n    markInteractive();\n  }\n};\n\nconst App = () => (\n  <NavigationContainer onReady={onReady}>\n    {/* ... */}\n  </NavigationContainer>\n);`}
              className="mb-4"
            />
            <div className="bg-bg-surface border border-border-default rounded-xl p-4 mb-8">
              <p className="text-sm text-text-secondary">
                <strong className="text-text-primary">Tip:</strong> If{' '}
                <code className="font-mono text-xs bg-bg-elevated px-1.5 py-0.5 rounded">
                  markInteractive()
                </code>{' '}
                is not called within 10 seconds, startup metrics are sent
                without TTI.
              </p>
            </div>

            <h2 className="font-semibold text-lg mb-3">Custom Host and Port</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              By default, Radar connects to{' '}
              <code className="font-mono text-xs bg-bg-surface px-1.5 py-0.5 rounded">
                localhost:8347
              </code>{' '}
              on iOS and{' '}
              <code className="font-mono text-xs bg-bg-surface px-1.5 py-0.5 rounded">
                10.0.2.2:8347
              </code>{' '}
              on Android emulators. You can override these:
            </p>
            <CodeBlock
              code={`if (__DEV__) {\n  const { init } = require('radar-devtools');\n  init({\n    host: '192.168.1.100',\n    port: 8347,\n  });\n}`}
              className="mb-8"
            />

            <h2 className="font-semibold text-lg mb-3">Platform Support</h2>

            <h3 className="font-medium text-text-primary mt-4 mb-2">
              iOS Simulator
            </h3>
            <p className="text-text-secondary text-sm leading-relaxed mb-4">
              All features work automatically. No additional configuration
              needed.
            </p>

            <h3 className="font-medium text-text-primary mt-4 mb-2">
              Android Emulator
            </h3>
            <p className="text-text-secondary text-sm leading-relaxed mb-4">
              All features work automatically. Radar uses{' '}
              <code className="font-mono text-xs bg-bg-surface px-1.5 py-0.5 rounded">
                10.0.2.2
              </code>{' '}
              to reach your host machine.
            </p>

            <h3 className="font-medium text-text-primary mt-4 mb-2">
              Physical Device
            </h3>
            <p className="text-text-secondary text-sm leading-relaxed mb-4">
              Physical devices require your device and development machine to be
              on the same Wi-Fi network. You must specify your machine&apos;s IP
              address via the{' '}
              <code className="font-mono text-xs bg-bg-surface px-1.5 py-0.5 rounded">
                host
              </code>{' '}
              option.
            </p>
            <div className="bg-bg-surface border border-border-default rounded-xl p-4 mb-4">
              <p className="text-sm text-text-secondary mb-3">
                <strong className="text-text-primary">
                  Feature availability on physical devices:
                </strong>
              </p>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-status-success shrink-0 mt-0.5">
                    &#10003;
                  </span>
                  <p className="text-text-secondary">
                    Console, Network, Component Tree, Profiler, State
                    Management, Storage
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-status-warning shrink-0 mt-0.5">
                    &#9888;
                  </span>
                  <p className="text-text-secondary">
                    Performance metrics (UI FPS, native RAM, CPU) and startup
                    native launch time require the{' '}
                    <code className="font-mono text-xs bg-bg-elevated px-1.5 py-0.5 rounded">
                      RadarPerformance
                    </code>{' '}
                    TurboModule. JS heap and JS FPS work with Hermes.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Features Overview */}
          <section id="features-overview" className="scroll-mt-24">
            <h1 className="font-display font-bold text-3xl tracking-tight mb-6">
              Features
            </h1>
            <p className="text-text-secondary leading-relaxed mb-8">
              Radar provides eight debugging panels, all accessible from a
              unified interface.
            </p>

            <div className="space-y-8">
              <div className="border border-border-default rounded-xl p-6 bg-bg-secondary">
                <h2 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-status-success" />
                  Console
                </h2>
                <p className="text-text-secondary text-sm leading-relaxed">
                  Captures all console output (log, warn, error, debug) with
                  rich serialization. Supports functions, Symbols, BigInt,
                  circular references, and React elements. Features syntax
                  highlighting, log grouping, and stack traces.
                </p>
              </div>

              <div className="border border-border-default rounded-xl p-6 bg-bg-secondary">
                <h2 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-status-info" />
                  Network
                </h2>
                <p className="text-text-secondary text-sm leading-relaxed">
                  Automatically intercepts all fetch requests. View HTTP
                  methods, status codes, timing, headers, and full
                  request/response bodies in a clean, color-coded interface.
                </p>
              </div>

              <div className="border border-border-default rounded-xl p-6 bg-bg-secondary">
                <h2 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-status-warning" />
                  Component Tree
                </h2>
                <p className="text-text-secondary text-sm leading-relaxed">
                  Fiber-based component inspection with real-time updates.
                  Search components, trace to source code, and inspect resolved
                  styles. See your app&apos;s component hierarchy in a visual
                  tree view.
                </p>
              </div>

              <div className="border border-border-default rounded-xl p-6 bg-bg-secondary">
                <h2 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-status-error" />
                  Profiler
                </h2>
                <p className="text-text-secondary text-sm leading-relaxed">
                  Interactive flamegraph, ranked component view, and render
                  trigger analysis. See exactly which props changed, which state
                  updated, and which hooks caused each render. Navigate commits
                  with the timeline view.
                </p>
              </div>

              <div className="border border-border-default rounded-xl p-6 bg-bg-secondary">
                <h2 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: '#A78BFA' }}
                  />
                  Performance
                </h2>
                <p className="text-text-secondary text-sm leading-relaxed">
                  Real-time native metrics including UI FPS, CPU usage, memory,
                  and JS heap. Startup breakdown with bundle eval time, native
                  launch time, and TTI. All streamed live to interactive charts
                  with hover inspection.
                </p>
              </div>

              <div className="border border-border-default rounded-xl p-6 bg-bg-secondary">
                <h2 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: '#E879F9' }}
                  />
                  State Management
                </h2>
                <p className="text-text-secondary text-sm leading-relaxed">
                  Inspect Redux, Zustand, and other state management stores.
                  View live state snapshots, filter by slice name, track
                  dispatched actions with full payload inspection, and see diffs
                  between state changes.
                </p>
              </div>

              <div className="border border-border-default rounded-xl p-6 bg-bg-secondary">
                <h2 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: '#FB923C' }}
                  />
                  Storage
                </h2>
                <p className="text-text-secondary text-sm leading-relaxed">
                  Browse, edit, and clear AsyncStorage and MMKV entries directly
                  from Radar. Supports multi-instance MMKV setups with typed
                  values (string, number, boolean). Changes are applied to the
                  device in real time.
                </p>
              </div>

              <div className="border border-border-default rounded-xl p-6 bg-bg-secondary">
                <h2 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: '#34D399' }}
                  />
                  AI Integration (MCP)
                </h2>
                <p className="text-text-secondary text-sm leading-relaxed">
                  Built-in MCP server exposes 18 tools to AI coding assistants.
                  Let Claude, Cursor, Windsurf, or any MCP-compatible client
                  read your app&apos;s runtime data and act on it. See the{' '}
                  <a href="#mcp" className="text-accent hover:underline">
                    AI Integration
                  </a>{' '}
                  section for setup.
                </p>
              </div>
            </div>
          </section>

          {/* AI Integration (MCP) */}
          <section id="mcp" className="scroll-mt-24">
            <h1 className="font-display font-bold text-3xl tracking-tight mb-6">
              AI Integration (MCP)
            </h1>
            <p className="text-text-secondary leading-relaxed mb-6">
              Radar includes a built-in{' '}
              <a
                href="https://modelcontextprotocol.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                Model Context Protocol
              </a>{' '}
              (MCP) server that exposes all devtools data as tools for AI coding
              assistants. When Radar is running, your AI can read console logs,
              inspect network requests, browse component trees, analyze profiler
              data, and more.
            </p>

            <h2 className="font-semibold text-lg mb-3">Setup</h2>
            <p className="text-text-secondary leading-relaxed mb-6">
              The MCP server starts automatically when you open Radar and
              listens on port{' '}
              <code className="font-mono text-xs bg-bg-surface px-1.5 py-0.5 rounded">
                8348
              </code>
              . Pick your AI tool below and run the CLI command or add the
              config manually:
            </p>

            <McpProviderSwitcher />

            <h2 className="font-semibold text-lg mt-10 mb-3">
              What Can You Ask?
            </h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              Once connected, you can ask your AI assistant natural language
              questions like:
            </p>
            <div className="space-y-3 mb-6">
              {[
                '"Why is my app re-rendering so much?"',
                '"Show me all failed network requests"',
                '"What\'s in AsyncStorage right now?"',
                '"Profile my app startup and tell me what\'s slow"',
                '"What does the Redux state look like for the todos slice?"',
              ].map(example => (
                <div
                  key={example}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg bg-bg-surface border border-border-subtle"
                >
                  <span className="text-accent font-mono text-sm">&gt;</span>
                  <span className="text-text-secondary text-sm font-mono">
                    {example}
                  </span>
                </div>
              ))}
            </div>

            <div className="bg-bg-surface border border-border-default rounded-xl p-4">
              <p className="text-sm text-text-secondary">
                <strong className="text-text-primary">Note:</strong> The MCP
                server requires Radar to be running and connected to at least
                one device. All tools accept an optional{' '}
                <code className="font-mono text-xs bg-bg-elevated px-1.5 py-0.5 rounded">
                  deviceId
                </code>{' '}
                parameter — if omitted, they return data from all connected
                devices.
              </p>
            </div>
          </section>
        </div>
      </DocsLayout>
      <Footer />
    </>
  );
};

export default DocsPage;
