# Contributing to Radar

Thanks for your interest in contributing to Radar! This guide will help you get started.

## Prerequisites

- [Bun](https://bun.sh) v1.3.3+
- [Node.js](https://nodejs.org) v22.11.0+
- macOS, Windows, or Linux

## Getting Started

1. Fork and clone the repository:

```bash
git clone https://github.com/trontechnologies/radar.git
cd radar
```

2. Install dependencies:

```bash
bun install
```

3. Start the Electron app in dev mode:

```bash
bun run dev:app
```

4. (Optional) Start one of the example apps to test with:

```bash
# React Native example
cd apps/example
bun run start

# Expo example
cd apps/expo-example
bun run start
```

## Project Structure

```
radar/
  apps/
    app/            # Electron desktop app (main UI)
    landing/        # Next.js marketing & docs site
    example/        # React Native test app
    expo-example/   # Expo test app
  packages/
    devtools/       # Client SDK (published as radar-devtools on npm)
    database/       # SQLite persistence layer
    mcp/            # MCP server for AI tool integration
    types/          # Shared TypeScript types
    designSystem/   # Tailwind design tokens
```

## Development Workflow

### Running Tests

```bash
# Run all tests
bun run test

# Run tests for a specific package
cd apps/app && bun run test
cd packages/devtools && bun run test
```

### Linting & Type Checking

```bash
# Lint
bun run lint

# Type check
bun run typecheck
```

### Commit Messages

This project uses [Conventional Commits](https://www.conventionalcommits.org/). Commit messages are validated by commitlint on the `commit-msg` hook.

Examples:
- `feat: add storage inspector panel`
- `fix: resolve profiler children display issue`
- `docs: update installation instructions`
- `chore: bump devtools SDK to v0.4.0`

### Pre-push Checks

Husky runs lint, typecheck, and tests automatically before each push. If any check fails, the push is blocked until you fix the issue.

## Code Style

- **TypeScript only** - no JavaScript files
- **Arrow functions** preferred over traditional functions
- **Functional components** only - no class components
- **`type`** for object type declarations - never `interface`
- **Named exports** only - no default exports
- **One export per file** - use barrel files (`index.ts`) for re-exports
- **No `any`, `unknown`, or `never`** - type everything properly

See [CLAUDE.md](./CLAUDE.md) for the full style guide.

## Submitting a Pull Request

1. Create a feature branch from `main`
2. Make your changes following the code style above
3. Add/update tests for your changes
4. Ensure all checks pass (`bun run lint && bun run typecheck && bun run test`)
5. Open a PR against `main` with a clear description of the change

## Reporting Issues

Use [GitHub Issues](https://github.com/trontechnologies/radar/issues) to report bugs or request features. Include:

- Steps to reproduce (for bugs)
- Expected vs actual behavior
- Your environment (OS, React Native version, Expo version if applicable)

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](./LICENSE).
