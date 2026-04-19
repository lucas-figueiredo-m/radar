# SEO & Discoverability Checklist

Tasks to make Radar easier to find via search engines, social sharing, and AI tools.

Current state: `apps/landing/src/app/layout.tsx` has basic `<title>`, `<meta description>`, and minimal Open Graph tags. Everything below is missing.

---

## 1. Open Graph Image

**What:** The preview image that shows when links are shared on Twitter, Slack, Discord, LinkedIn, iMessage, etc.

**Spec:**
- Size: 1200×630px
- Format: PNG or JPG
- Max 1MB
- Location: `apps/landing/public/og-image.png`

**What to put on it:**
- Radar logo
- Tagline: "Unified DevTools for React Native"
- Small screenshot of the app (optional but boosts CTR)
- Dark background to match the brand

**Code to add to `layout.tsx`:**
```typescript
openGraph: {
  title: 'Radar — Unified React Native Developer Tools',
  description: '...',
  type: 'website',
  url: 'https://radar.trontech.io', // or wherever it's deployed
  siteName: 'Radar',
  images: [
    {
      url: '/og-image.png',
      width: 1200,
      height: 630,
      alt: 'Radar — Unified DevTools for React Native',
    },
  ],
},
```

---

## 2. Twitter Card Metadata

**What:** Twitter-specific preview card. Without it, Twitter shows a plain link with no image.

**Code to add to `layout.tsx`:**
```typescript
twitter: {
  card: 'summary_large_image',
  title: 'Radar — Unified React Native Developer Tools',
  description: 'One tool to replace React DevTools, Flipper, and Reactotron...',
  images: ['/og-image.png'],
  creator: '@trontechnologies', // or your actual handle
},
```

---

## 3. Schema.org JSON-LD (SoftwareApplication)

**What:** Structured data that tells Google this is a software product. Enables rich results in search (install buttons, ratings, etc.) and helps Google AI Overviews understand what Radar is.

**Where to add:** Inside the `<head>` of `layout.tsx`, as a `<script type="application/ld+json">` tag.

```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Radar',
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'macOS, Windows, Linux',
      description: 'Unified DevTools for React Native. Console, network, components, profiler, performance, state, storage — and AI integration via MCP.',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      softwareVersion: '0.4.1',
      downloadUrl: 'https://github.com/trontechnologies/radar-releases/releases/latest',
      author: {
        '@type': 'Organization',
        name: 'Trontech',
        url: 'https://radar.trontech.io',
      },
    }),
  }}
/>
```

---

## 4. robots.txt

**What:** Tells search engines what to crawl and where the sitemap is.

**Where:** `apps/landing/src/app/robots.ts` (Next.js convention — auto-generates `/robots.txt`)

```typescript
import { MetadataRoute } from 'next';

const robots = (): MetadataRoute.Robots => ({
  rules: {
    userAgent: '*',
    allow: '/',
  },
  sitemap: 'https://radar.trontech.io/sitemap.xml',
});

export default robots;
```

---

## 5. sitemap.xml

**What:** Tells search engines every URL on the site. Helps with indexing.

**Where:** `apps/landing/src/app/sitemap.ts` (Next.js auto-generates `/sitemap.xml`)

```typescript
import { MetadataRoute } from 'next';

const sitemap = (): MetadataRoute.Sitemap => [
  {
    url: 'https://radar.trontech.io',
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 1,
  },
  {
    url: 'https://radar.trontech.io/docs',
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  },
];

export default sitemap;
```

---

## 6. llms.txt

**What:** Markdown-formatted summary of the site for LLMs. Proposed standard — not officially honored by any major provider yet, but cheap insurance.

**Where:** `apps/landing/public/llms.txt` (served at `/llms.txt`)

```markdown
# Radar

> Unified DevTools for React Native. Replaces React DevTools, Flipper, and Reactotron with a single Electron app. Includes built-in MCP server for AI-assisted debugging.

## Overview

Radar is a desktop debugging tool for React Native and Expo apps. It consolidates 8 debugging panels (Console, Network, Component Tree, Profiler, Performance, State Management, Storage, AI) into one interface.

## Key Features

- **Console** — Log viewer with recursive serialization and syntax highlighting
- **Network** — Fetch + XHR interception with GraphQL detection
- **Component Tree** — React fiber tree explorer with source tracing
- **Profiler** — Flamegraph with render trigger analysis
- **Performance** — Real-time native metrics (UI FPS, CPU, RAM, JS Heap)
- **State Management** — Redux and Zustand inspection
- **Storage** — AsyncStorage and MMKV browser
- **MCP Integration** — 18 tools exposed to AI assistants via Model Context Protocol

## Links

- Website: https://radar.trontech.io
- GitHub: https://github.com/trontechnologies/radar
- Docs: https://radar.trontech.io/docs
- npm: https://www.npmjs.com/package/radar-devtools
- Releases: https://github.com/trontechnologies/radar-releases/releases

## Installation

```bash
bun add -d radar-devtools
```

```typescript
import { init } from 'radar-devtools';
if (__DEV__) init();
```

## License

MIT
```

---

## 7. Additional Meta Tags (Optional)

```typescript
// In layout.tsx metadata
metadataBase: new URL('https://radar.trontech.io'),
alternates: {
  canonical: '/',
},
keywords: [
  'react native',
  'devtools',
  'debugging',
  'flipper alternative',
  'reactotron',
  'mcp',
  'ai debugging',
  'expo',
],
authors: [{ name: 'Trontech', url: 'https://radar.trontech.io' }],
icons: {
  icon: '/favicon.ico',
  apple: '/apple-touch-icon.png',
},
```

---

## Order of Implementation (by effort/impact)

1. **robots.ts + sitemap.ts** — 5 min, zero design work required
2. **Schema.org JSON-LD** — 10 min, immediate Google benefit
3. **Twitter card tags + extra Open Graph** — 5 min (requires og-image)
4. **og-image.png** — needs design work (30 min in Figma/Pencil)
5. **llms.txt** — 5 min, speculative benefit
6. **Extra meta tags (keywords, canonical, icons)** — 10 min, minor SEO boost

---

## What NOT to bother with

- Meta `keywords` tag for Google (they don't use it anymore, but Bing does — still worth including)
- Over-optimizing title length — Google changes these frequently anyway
- Hyper-specific schema types (`MobileApplication`, `WebApplication`) — `SoftwareApplication` is broad enough
