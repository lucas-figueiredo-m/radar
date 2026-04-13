"use client";

import { Sparkles, ArrowRight } from "lucide-react";
import { AnimatedSection } from "../AnimatedSection";
import { GradientText } from "../GradientText";
import { McpProviderSwitcher } from "../McpProviderSwitcher";

const TOOL_CATEGORIES = [
  {
    label: "Observe",
    description: "Read console logs, network requests, component trees, profiler data, and performance metrics",
    count: 10,
    color: "#60A5FA",
  },
  {
    label: "Inspect",
    description: "Dive into component props, state snapshots, storage entries, and startup metrics",
    count: 5,
    color: "#A78BFA",
  },
  {
    label: "Act",
    description: "Modify storage, start/stop profiling, reload and profile, refresh state, and reset data",
    count: 3,
    color: "#34D399",
  },
];

const PROMPT_EXAMPLES = [
  {
    prompt: "Why is my app re-rendering so much?",
    result: "AI reads profiler data, identifies triggers, and suggests fixes",
  },
  {
    prompt: "Show me all failed network requests",
    result: "AI filters requests by status code and highlights errors",
  },
  {
    prompt: "What does the Redux state look like for the todos slice?",
    result: "AI reads the state snapshot and returns the current slice data",
  },
];

export const McpSection = () => {
  return (
    <section id="ai" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <AnimatedSection>
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/20 bg-accent/5 text-accent text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" aria-hidden="true" />
              New
            </div>
            <h2 className="font-display font-bold text-3xl md:text-4xl tracking-tight mb-4">
              Let AI debug <GradientText>for you</GradientText>
            </h2>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto">
              Radar ships a built-in MCP server with 18 tools for any AI coding
              assistant. Claude, Cursor, Windsurf, or any MCP client can read
              your app&apos;s runtime data and act on it.
            </p>
          </div>
        </AnimatedSection>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Config code */}
          <AnimatedSection>
            <div>
              <span className="text-accent text-xs uppercase tracking-[0.2em] font-mono font-medium">
                Setup
              </span>
              <h3 className="font-display font-bold text-xl md:text-2xl tracking-tight mt-3 mb-2">
                One line to connect
              </h3>
              <p className="text-text-secondary text-sm mb-6">
                Add Radar as an MCP server in your AI tool&apos;s config.
                That&apos;s it — your assistant can now see everything your app does at runtime.
              </p>
              <McpProviderSwitcher />
            </div>
          </AnimatedSection>

          {/* Tool categories */}
          <AnimatedSection delay={0.2}>
            <div className="space-y-4">
              {TOOL_CATEGORIES.map((category) => (
                <div
                  key={category.label}
                  className="group relative bg-bg-secondary border border-border-default rounded-xl p-6 hover:border-border-strong transition-all duration-300"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <h4 className="font-semibold">{category.label}</h4>
                    <span className="text-text-tertiary text-xs font-mono">
                      {category.count} tools
                    </span>
                  </div>
                  <p className="text-text-secondary text-sm leading-relaxed">
                    {category.description}
                  </p>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>

        {/* Prompt examples */}
        <AnimatedSection delay={0.3}>
          <div className="mt-12 space-y-4">
            {PROMPT_EXAMPLES.map((example) => (
              <div
                key={example.prompt}
                className="rounded-xl border border-border-default bg-bg-secondary p-6 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6"
              >
                <p className="font-mono text-sm text-text-primary shrink-0">
                  &ldquo;{example.prompt}&rdquo;
                </p>
                <ArrowRight className="w-4 h-4 text-accent shrink-0 hidden sm:block" aria-hidden="true" />
                <p className="text-text-secondary text-sm">
                  {example.result}
                </p>
              </div>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};
