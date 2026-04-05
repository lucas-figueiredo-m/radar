export const DOWNLOAD_URL =
  "https://github.com/trontechnologies/radar-releases/releases/latest/download/Radar.dmg";

import type {
  NavItem,
  Feature,
  FeatureDeepDive,
  HowItWorksStep,
  ComparisonRow,
} from "@/types";

export const NAV_ITEMS: NavItem[] = [
  { label: "Features", href: "/#features" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Docs", href: "/docs" },
];

export const FEATURES: Feature[] = [
  {
    icon: "Terminal",
    title: "Console",
    description:
      "Rich serialization for every type — functions, Symbols, BigInt, circular refs. Grouped logs, syntax highlighting, and stack traces.",
    color: "#4ADE80",
  },
  {
    icon: "Globe",
    title: "Network",
    description:
      "Intercept every fetch request. Color-coded methods, request/response detail panel with headers and body inspection.",
    color: "#60A5FA",
  },
  {
    icon: "TreePine",
    title: "Component Tree",
    description:
      "Fiber-based component inspection with search, source tracing, and full style resolution. See your app's structure in real time.",
    color: "#FBBF24",
  },
  {
    icon: "Activity",
    title: "Profiler",
    description:
      "Flamegraph visualization, ranked view, render trigger analysis showing exactly which props, state, or hooks caused re-renders.",
    color: "#F87171",
  },
  {
    icon: "Gauge",
    title: "Performance",
    description:
      "Real-time native metrics — UI FPS, CPU usage, memory, and JS heap. Startup breakdown with bundle eval, native launch, and TTI.",
    color: "#A78BFA",
  },
];

export const FEATURE_DEEP_DIVES: FeatureDeepDive[] = [
  {
    title: "Console",
    headline: "See everything your app logs",
    description:
      "Radar's custom recursive serializer captures what others can't. Functions, Symbols, BigInt, circular references, even React elements — all rendered with syntax highlighting and proper formatting.",
    highlights: [
      "Rich serialization for non-JSON-safe types",
      "Log grouping and filtering by level",
      "Syntax-highlighted output with Catppuccin theme",
      "Full stack trace support",
    ],
    imagePosition: "right",
  },
  {
    title: "Network",
    headline: "Every request, every response",
    description:
      "Automatically intercepts fetch calls with zero configuration. See method, status, timing, headers, and full request/response bodies in a clean, color-coded interface.",
    highlights: [
      "Automatic fetch interception",
      "Color-coded HTTP methods",
      "Request/response detail panel",
      "Headers and body inspection",
    ],
    imagePosition: "left",
  },
  {
    title: "Profiler",
    headline: "Know why it re-rendered",
    description:
      "Interactive flamegraph, ranked component view, and render trigger detection. See exactly which props changed, which state updated, and which hooks caused each render cycle.",
    highlights: [
      "Interactive flamegraph visualization",
      "Render trigger detection (props/state/hooks)",
      "Ranked view for performance bottlenecks",
      "Commit timeline navigation",
    ],
    imagePosition: "right",
  },
  {
    title: "Performance",
    headline: "Native metrics, real-time charts",
    description:
      "Monitor your app's health with native-level precision. Real UI frame rate, memory usage, CPU load, and a full startup breakdown — all streamed live to interactive charts with hover inspection.",
    highlights: [
      "UI FPS, Native RAM, and CPU usage in real time",
      "JS FPS and heap size tracking",
      "Startup breakdown: bundle eval, native launch, TTI",
      "Pause, hover, and inspect any moment in time",
    ],
    imagePosition: "left",
  },
];

export const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
  {
    step: 1,
    title: "Install",
    description: "Add the devtools package to your React Native project.",
    code: "bun add radar-devtools",
  },
  {
    step: 2,
    title: "Initialize",
    description: "Import and call init in your app's entry point.",
    code: `import { init } from 'radar-devtools';\n\ninit();`,
  },
  {
    step: 3,
    title: "Debug",
    description:
      "Open the Radar desktop app and start debugging. Your app connects automatically.",
  },
];

export const COMPARISON_DATA: ComparisonRow[] = [
  {
    feature: "Console",
    radar: true,
    reactDevTools: false,
    flipper: true,
    reactotron: true,
  },
  {
    feature: "Network Inspector",
    radar: true,
    reactDevTools: false,
    flipper: true,
    reactotron: true,
  },
  {
    feature: "Component Tree",
    radar: true,
    reactDevTools: true,
    flipper: false,
    reactotron: false,
  },
  {
    feature: "Profiler",
    radar: true,
    reactDevTools: true,
    flipper: false,
    reactotron: false,
  },
  {
    feature: "Source Tracing",
    radar: true,
    reactDevTools: false,
    flipper: false,
    reactotron: false,
  },
  {
    feature: "Style Inspection",
    radar: true,
    reactDevTools: false,
    flipper: false,
    reactotron: false,
  },
  {
    feature: "Native Performance Metrics",
    radar: true,
    reactDevTools: false,
    flipper: false,
    reactotron: false,
  },
  {
    feature: "Startup Analysis",
    radar: true,
    reactDevTools: false,
    flipper: false,
    reactotron: false,
  },
  {
    feature: "Multi-Device",
    radar: true,
    reactDevTools: false,
    flipper: true,
    reactotron: true,
  },
  {
    feature: "Unified UI",
    radar: true,
    reactDevTools: false,
    flipper: false,
    reactotron: false,
  },
];

export const TECH_LOGOS = [
  "React Native",
  "Expo",
  "Hermes",
  "TypeScript",
];
