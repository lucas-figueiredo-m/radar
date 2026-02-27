<package-manager>
 - This project use bun, exclusively.
 - **NEVER** use npm, yarn, pnpm or any other package manager.
</package-manager>

<code-style>
 - This project use typescript, exclusively.
 - **NEVER** use javascript.
 - Prefer arrow functions over traditional functions.
 - **NEVER** use class components. Use functional components instead.
 - **NEVER** use `any` , `unknown` or `never`. **ALWAYS** type things properly.
 - **NEVER** type cast to any type. Use proper type annotations instead.
 - **ALWAYS** use barrel files to export components, hooks, etc.
 - **PREFER** named exports over default exports.
 - **NEVER** use `interface`. **ALWAYS** use `type` for object type declarations.
 - EVERY file must export ONLY ONE thing.
</code-style>

<naming-conventions>
 - **Components**: PascalCase for both file names and component names. e.g. `ConsolePanel.tsx`, `CopyButton.tsx`.
 - **Component folders**: PascalCase matching the component name. e.g. `ConsolePanel/`, `ValueRenderer/`.
 - **Hooks**: camelCase prefixed with `use`. e.g. `useDevTools.ts`.
 - **Utilities**: camelCase. e.g. `formatDuration.ts`, `truncateUrl.ts`.
 - **Services**: camelCase. e.g. `ipc.ts`.
 - **Types files**: camelCase. e.g. `network.ts`, `console.ts`.
 - **Constants files**: `constants.ts` inside the folder that owns them.
 - **Constants**: UPPER_SNAKE_CASE. e.g. `LEVEL_STYLES`, `METHOD_COLORS`, `NAV_ITEMS`.
 - **Types**: PascalCase. e.g. `LogEntry`, `NetworkEntry`, `SidebarProps`.
 - **Props types**: PascalCase, suffixed with `Props`. e.g. `HeaderProps`, `ConsolePanelProps`.
 - **Barrel files**: `index.ts` or `index.tsx`.
</naming-conventions>
