import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { DocsLayout } from "@/components/DocsLayout";
import { CodeBlock } from "@/components/CodeBlock";

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
              Add the Radar devtools package to your React Native project. Radar works with both bare React Native and Expo projects.
            </p>

            <h2 className="font-semibold text-lg mb-3">Step 1: Install the package</h2>
            <CodeBlock code="bun add radar-devtools" className="mb-6" />

            <h2 className="font-semibold text-lg mb-3">Step 2: Initialize in your app</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              Add the following to your app&apos;s entry point (e.g., <code className="font-mono text-sm bg-bg-surface px-1.5 py-0.5 rounded">App.tsx</code> or <code className="font-mono text-sm bg-bg-surface px-1.5 py-0.5 rounded">index.ts</code>):
            </p>
            <CodeBlock
              code={`import { init } from 'radar-devtools';\n\n// Initialize Radar devtools\ninit();`}
              className="mb-6"
            />

            <div className="bg-bg-surface border border-border-default rounded-xl p-4">
              <p className="text-sm text-text-secondary">
                <strong className="text-text-primary">Note:</strong> Make sure to call <code className="font-mono text-xs bg-bg-elevated px-1.5 py-0.5 rounded">init()</code> before any other code in your app to ensure all console logs and network requests are captured.
              </p>
            </div>
          </section>

          {/* Quick Start */}
          <section id="quick-start" className="scroll-mt-24">
            <h1 className="font-display font-bold text-3xl tracking-tight mb-6">
              Quick Start
            </h1>
            <p className="text-text-secondary leading-relaxed mb-6">
              Once you&apos;ve installed and initialized the devtools package, connecting to Radar is automatic.
            </p>

            <ol className="space-y-4 mb-6">
              <li className="flex gap-3">
                <span className="text-accent font-bold font-mono">1.</span>
                <div>
                  <p className="text-text-primary font-medium">Open the Radar desktop app</p>
                  <p className="text-text-secondary text-sm">Download and launch Radar on your development machine.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="text-accent font-bold font-mono">2.</span>
                <div>
                  <p className="text-text-primary font-medium">Run your React Native app</p>
                  <p className="text-text-secondary text-sm">Start your app on a simulator, emulator, or physical device.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="text-accent font-bold font-mono">3.</span>
                <div>
                  <p className="text-text-primary font-medium">Start debugging</p>
                  <p className="text-text-secondary text-sm">Your app will automatically connect to Radar. You&apos;ll see console logs, network requests, and more in real time.</p>
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
              Radar works out of the box with zero configuration for most setups. For advanced use cases, you can customize the connection settings.
            </p>

            <h2 className="font-semibold text-lg mb-3">Custom Host</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              If your development machine is on a different network or you need to specify an IP address:
            </p>
            <CodeBlock
              code={`import { init } from 'radar-devtools';\n\ninit({\n  host: '192.168.1.100',\n  port: 8347,\n});`}
              className="mb-8"
            />

            <h2 className="font-semibold text-lg mb-3">Platform-Specific Setup</h2>

            <h3 className="font-medium text-text-primary mt-4 mb-2">iOS Simulator</h3>
            <p className="text-text-secondary text-sm leading-relaxed mb-4">
              Connects automatically via <code className="font-mono text-xs bg-bg-surface px-1.5 py-0.5 rounded">localhost</code>. No additional configuration needed.
            </p>

            <h3 className="font-medium text-text-primary mt-4 mb-2">Android Emulator</h3>
            <p className="text-text-secondary text-sm leading-relaxed mb-4">
              Uses <code className="font-mono text-xs bg-bg-surface px-1.5 py-0.5 rounded">10.0.2.2</code> to reach the host machine. This is handled automatically by Radar.
            </p>

            <h3 className="font-medium text-text-primary mt-4 mb-2">Physical Device</h3>
            <p className="text-text-secondary text-sm leading-relaxed mb-4">
              Ensure your device is on the same Wi-Fi network as your development machine. You may need to specify the host IP address in the init options.
            </p>
          </section>

          {/* Features Overview */}
          <section id="features-overview" className="scroll-mt-24">
            <h1 className="font-display font-bold text-3xl tracking-tight mb-6">
              Features
            </h1>
            <p className="text-text-secondary leading-relaxed mb-8">
              Radar provides four main debugging panels, all accessible from a unified interface.
            </p>

            <div className="space-y-8">
              <div className="border border-border-default rounded-xl p-6 bg-bg-secondary">
                <h2 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-status-success" />
                  Console
                </h2>
                <p className="text-text-secondary text-sm leading-relaxed">
                  Captures all console output (log, warn, error, debug) with rich serialization. Supports functions, Symbols, BigInt, circular references, and React elements. Features syntax highlighting, log grouping, and stack traces.
                </p>
              </div>

              <div className="border border-border-default rounded-xl p-6 bg-bg-secondary">
                <h2 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-status-info" />
                  Network
                </h2>
                <p className="text-text-secondary text-sm leading-relaxed">
                  Automatically intercepts all fetch requests. View HTTP methods, status codes, timing, headers, and full request/response bodies in a clean, color-coded interface.
                </p>
              </div>

              <div className="border border-border-default rounded-xl p-6 bg-bg-secondary">
                <h2 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-status-warning" />
                  Component Tree
                </h2>
                <p className="text-text-secondary text-sm leading-relaxed">
                  Fiber-based component inspection with real-time updates. Search components, trace to source code, and inspect resolved styles. See your app&apos;s component hierarchy in a visual tree view.
                </p>
              </div>

              <div className="border border-border-default rounded-xl p-6 bg-bg-secondary">
                <h2 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-status-error" />
                  Profiler
                </h2>
                <p className="text-text-secondary text-sm leading-relaxed">
                  Interactive flamegraph, ranked component view, and render trigger analysis. See exactly which props changed, which state updated, and which hooks caused each render. Navigate commits with the timeline view.
                </p>
              </div>
            </div>
          </section>
        </div>
      </DocsLayout>
      <Footer />
    </>
  );
};

export default DocsPage;
