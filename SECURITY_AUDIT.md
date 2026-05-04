# Radar — Open-Source Readiness Security Audit

> Pre-release audit conducted by 10 parallel security subagents covering: secrets/git history, Electron hardening, WebSocket transport, devtools-package privacy, dependency/supply-chain, CI/CD & release, code injection, path traversal, DoS/resource exhaustion, and MCP+database packages.
>
> **Revision 2026-05-04:** reframed against the actual product threat model — Radar is a *local* React Native debugging tool. Developers install the `radar-devtools` SDK in their own RN app; the Electron app on the dev's laptop receives captured data over a LAN WebSocket; an MCP server feeds the same data to local LLMs (Claude Code, Cursor). Several findings (default header redaction, ReDoS in the user's own search box, PATH-resolution hardening, source maps in an open-source SDK) were dropped as not-issues for that model. B2's "fix" was rewritten to keep the `0.0.0.0` binding (real-device wifi debugging needs it) and require auth + origin check + payload cap on top instead.

## Verdict

**Still NOT safe to publish in current state**, but the surface is smaller than the original audit suggested. The remaining real chain is: git history with secrets and personal data + an unauthenticated LAN WebSocket + Electron with Node in the renderer + path traversal in editor open + an unsigned auto-updater. A focused week of work closes the lot.

### Per-audit grades

| # | Audit area | Grade | One-line verdict |
|---|---|---|---|
| 1 | Secrets & git history | **F** | Multiple history leaks; squash recommended |
| 2 | Electron hardening | **F** | nodeIntegration on, no CSP, no preload |
| 3 | WebSocket transport | **D** | 0.0.0.0 is intentional; no auth/origin/cap is not |
| 4 | Devtools capture / privacy | **B** | Full capture is by design for a debugger; B5 + transport hardening is the real fix |
| 5 | Dependency / supply chain | **A−** | `bun audit` clean, zero runtime deps in published bundle |
| 6 | CI/CD & release | **C+** | Cmd-injection in tag flow remains; PAT rotated 2026-05-03 |
| 7 | Code injection patterns | **C+** | No eval/innerHTML/SQLi; one cmd-injection sink |
| 8 | Path traversal / FS | **C** | Real bug, downgraded once B2 has auth |
| 9 | DoS / resource exhaustion | **C** | In-memory SQLite no eviction → stability, not security |
| 10 | MCP + Database | MCP **D**, DB **B+** | MCP needs loopback + token; DB layer is sound |

### Threat model — who is at risk

**You (the maintainer)**
- Personal home paths, prior employer name (`trontechnologies` × 71), private client app name (`truckAtlasMobile`), Linear ticket IDs, internal prompts, and `.claude/` agent state are all in git history and inside published tags.
- ~~`RELEASES_GITHUB_TOKEN` is a classic PAT with `repo` scope~~ — **rotated 2026-05-03 to a fine-grained PAT scoped to `radar-releases`.**
- Apple signing creds reused across two env vars; deprecated env name.

**The repo**
- Next.js preview-mode signing/encryption keys baked into commit `c33fb02` — burned for that build, must be rotated.
- No SHA-pinning of third-party GitHub Actions; tag-pinning was the `tj-actions/changed-files` 2025 vector.
- Self-push of version bumps to `main` from a tag-triggered job — bypasses any future branch protection.
- Command injection in `scripts/sync-version.ts` via tag name (`v1.2.3$(rm -rf /)`).

**Users who install `radar-devtools`**
- The SDK has **no internal `__DEV__` guard**. If a downstream developer forgets the README's `if (__DEV__)` wrapper, every one of their end users ships the devtools client, which connects to whatever host is configured. (See B5.)
- The default Android host is `10.0.2.2` (emulator's host alias); on a real phone that's a routable LAN IP. Goes away with B2 transport auth.

**Anyone running the Radar Electron app on a non-trusted network**
- WebSocket server binds to `0.0.0.0:8347` (intentional — needed so a real iPhone/Android device on the same wifi can reach the dev's laptop) **but** with no auth, no Origin check, no payload cap, no schema validation.
- MCP HTTP server binds to `0.0.0.0:8348`. MCP consumers (Claude Code, Cursor) live on the dev's own machine, so this should be `127.0.0.1`. Plus it currently has no auth.
- Auto-updater is unsigned. If the GitHub release-publishing token is ever compromised, every Radar user gets silently swapped to attacker-controlled binaries.
- Browser tabs on `evil.com` can WebSocket to `localhost:8347` (cross-site WS hijacking — CORS doesn't apply).

---

## Severity legend

| Severity | Meaning |
|---|---|
| **CRITICAL** | Direct attacker-controlled RCE / credential exfil / account compromise. Fix before publishing. |
| **HIGH** | Trivially exploitable with one hop, or significant privacy/integrity loss. Fix before promoting to general users. |
| **MEDIUM** | Requires a precondition (physical/local access, prior compromise) or limited blast radius. |
| **LOW** | Hardening / defense-in-depth. Won't directly cause harm but should land. |
| **INFO** | Documentation, hygiene, future-proofing. |

---

## Items dropped after threat-model review

These were in the original audit but reframed as not-issues for a *local* React Native dev tool:

- ~~**B4** — default header/body redaction in `radar-devtools` capture.~~ A debugger that hides `Authorization`/`Cookie`/bodies is broken; Chrome DevTools, Reactotron, Charles, mitmproxy all show full requests. Captured creds are dev-account tokens against staging APIs (especially after B5). The real defense is locking the *transport* (B2/B3); full capture is correct behaviour. Optional opt-in redaction config can be added later.
- ~~**S3** — source maps in `radar-devtools/dist`.~~ Open-source SDK; maps help downstream devs debug their integration.
- ~~**S14** — `adb`/`xcrun`/editors resolved via `$PATH`.~~ PATH hijacking presupposes the attacker can already write to a PATH dir = local code exec already.
- ~~**S15** — ReDoS in search regex.~~ User searching their own captured data; only victim is themselves.
- ~~**N3** — persistent `deviceId` UUID.~~ Per-launch nonce is correct for ephemeral debug sessions.

Items reframed as correctness/performance rather than security (still worth fixing, just not in this doc):

- **S4** capture-before-handshake → correctness
- **S11** missing `LIMIT` clauses → performance/robustness
- **S16** reconnect backoff → battery/CPU
- **N9** `inspected_components` upsert key missing `session_id` → correctness bug

---

## BLOCKERS — must fix before flipping the repo public

### B1 — CRITICAL — Git history contains secrets and personal/client data

**Where:**
- `apps/landing/.next/prerender-manifest.json` (commit `c33fb02`) leaks Next.js `previewModeSigningKey` and `previewModeEncryptionKey`.
- `.claude/` history exposes internal prompts, Linear ticket IDs, and the private client app name `truckAtlasMobile`.
- `trontechnologies` appears in 71 historical references across podspec, package.json, README, autoupdater download URLs, and rendered HTML.
- Personal absolute paths (`/Users/lucasfigueiredo/...`) baked into committed `.next/` source maps.

**Risk:** Permanent public exposure once the repo goes public; ex-employer / client IP issues; preview-mode key reuse.

**Fix (recommended):** squash entire history into a single fresh "Initial public release" commit. Cleanest option, kills four findings at once.
```bash
git checkout --orphan fresh
git add -A
git commit -m "Initial public release"
git branch -M main
git push --force-with-lease origin main
```

**Fix (alternative):** rewrite history with `git filter-repo`:
```bash
git filter-repo \
  --path apps/landing/.next --invert-paths \
  --path .claude --invert-paths \
  --replace-text replacements.txt
# replacements.txt: trontechnologies==>lfigueiredo
```

After either: rotate Next.js preview keys (delete `apps/landing/.next` and rebuild), and delete pre-`v0.4.6` tags that still contain `.claude/`.

---

### B2 — CRITICAL — WebSocket server has no auth, no origin check, no payload cap, no schema validation

**Where:** `apps/app/electron/websocketServer.ts:287`
```ts
const wss = new WebSocketServer({ port: WS_PORT });
```

**Note:** binding to `0.0.0.0` is **intentional** — a real iPhone/Android device on the same wifi as the dev's laptop needs LAN access. Don't switch to `127.0.0.1`. Add auth + origin + cap on top instead.

**Risk:** Anyone on the same LAN/wifi can passively read every captured `Authorization` header from the developer's app, or connect from a browser tab on `evil.com` (CORS does not protect WebSockets). A 100 MiB JSON frame OOMs the Electron main process.

**Fix:**
```ts
const wss = new WebSocketServer({
  host: '0.0.0.0',
  port: WS_PORT,
  maxPayload: 4 * 1024 * 1024,
  verifyClient: ({ origin }, cb) => {
    // Reject browser-tab origins (cross-site WS hijack guard).
    if (origin) return cb(false, 403, 'Origin not allowed');
    cb(true);
  },
});
```
Plus: require a per-launch shared secret in the metadata handshake (auto-generated at app start, surfaced in the tray UI for the dev to copy into their `radar-devtools` config). Zod-validate every incoming `RadarMessage` before persisting/forwarding. Reject any second metadata message that overwrites an existing `deviceId`.

---

### B3 — CRITICAL — MCP HTTP server binds 0.0.0.0, no auth

**Where:** `packages/mcp/src/index.ts:104`

**Note:** Unlike B2, MCP consumers (Claude Code, Cursor, etc.) live on the developer's own machine. Loopback is correct here.

**Risk:** Anyone on the same LAN can call the MCP and read captured network/console/state data, or invoke `modify_storage` / `reset_data` / `reload_and_profile` to wipe MMKV/AsyncStorage on the device-under-test.

**Fix:**
```ts
httpServer.listen(port, '127.0.0.1', () => { ... });
```
Plus in `parseBody`: cap total body size at 1 MiB and abort with 413. Add an Origin allowlist check on `POST /mcp`. Require a per-launch token (env var or auto-generated, surfaced in the tray) — gates the entire MCP, not per-call.

The write tools (`modify_storage`, `reset_data`, `reload_and_profile`) are *features* for LLM-driven debugging; one MCP-level token is sufficient, no per-call user confirmation needed (the original B12's confirmation requirement was reframed for the same reason).

---

### ~~B4~~ — DROPPED after threat-model review

Default header/body redaction in `radar-devtools` capture would break the tool — full capture is the design intent. Closing B2/B3 (transport) and B5 (`__DEV__` guard) is what actually protects users. Optional opt-in redaction config can be added later as a config knob.

---

### B5 — CRITICAL — `radar-devtools` `init()` has no internal production gating

**Where:** `packages/devtools/src/index.ts:62-144`

**Risk:** README *recommends* `if (__DEV__) init()` but doesn't enforce. A developer who forgets the guard, copies an unguarded snippet, or hits an Expo prod-build `__DEV__` bug ships the devtools client to every customer. The visible `console.log('[radar] devtools initialized')` confirms execution.

**Fix:** guard the entry point itself:
```ts
declare const __DEV__: boolean | undefined;

export const init = (config: RadarConfig = {}) => {
  if (typeof __DEV__ !== 'undefined' && __DEV__ === false) return;
  if (process.env.NODE_ENV === 'production') return;
  // ... rest of init
};
```
Also fail loudly (single `console.warn`) if invoked when `host` is not loopback and `__DEV__` is unknown.

---

### B6 — CRITICAL — Electron renderer has Node integration on, contextIsolation off, no preload, no sandbox

**Where:** `apps/app/electron/main.ts:44-47`
```ts
webPreferences: {
  nodeIntegration: true,
  contextIsolation: false,
},
```

**Risk:** Any XSS-equivalent gadget anywhere in the renderer (a future markdown viewer, a JSON viewer that uses `eval`, a captured URL in an `<a href>`, or a renderer-side dependency compromise) becomes RCE on the developer's machine via `window.require('child_process').exec(...)`. Captured data is *untrusted* — a malicious dep in the dev's RN app could send poisoned payloads.

**Fix:**
```ts
webPreferences: {
  nodeIntegration: false,
  contextIsolation: true,
  sandbox: true,
  webSecurity: true,
  allowRunningInsecureContent: false,
  experimentalFeatures: false,
  preload: path.join(__dirname, 'preload.js'),
},
```
Write a preload that exposes a typed surface via `contextBridge.exposeInMainWorld('radar', { invoke, on, off, send })`. Convert `apps/app/src/services/ipc.ts:1-4`'s `(window as any).require('electron').ipcRenderer` to `window.radar.*`.

---

### B7 — MEDIUM (downgraded from CRITICAL) — Path traversal in `radar:open-in-editor`

**Where:** `apps/app/electron/main.ts:316-343`
```ts
const root = wsHandle?.getDevice(payload.deviceId)?.projectRoot ?? null;
const absolutePath = path.join(root, payload.file);
openInEditor(preferred, absolutePath, payload.line);
```

**Note:** Once B2 is auth'd, `payload.deviceId`/`payload.file` come only from authenticated peers. Severity drops from CRITICAL to MEDIUM, but the fix is still cheap and worth landing as defense-in-depth.

**Risk:** Both `root` (from WS metadata) and `payload.file` are unvalidated. `path.join('/', '/etc/passwd')` → `/etc/passwd`; with `..` traversal it escapes any base. Vim/Emacs also expose modeline/file-local-variable code execution.

**Fix:**
```ts
import { realpathSync } from 'node:fs';

if (path.isAbsolute(payload.file) || payload.file.includes('\0')) {
  return { success: false, error: 'Invalid file path' };
}
let realRoot: string, realTarget: string;
try {
  realRoot = realpathSync(root);
  realTarget = realpathSync(path.resolve(realRoot, payload.file));
} catch {
  return { success: false, error: 'File does not exist' };
}
if (realTarget !== realRoot && !realTarget.startsWith(realRoot + path.sep)) {
  return { success: false, error: 'Path escapes project root' };
}
const line = Number.isInteger(payload.line) && payload.line! > 0 ? payload.line : 1;
openInEditor(preferred, realTarget, line);
```
Also strip leading `+`/`-` characters before passing to vim/emacs/nvim. Better: stop trusting `projectRoot` from the WebSocket entirely — require local config or a user-confirmed dialog.

---

### B8 — CRITICAL — Shell command injection via Android device serial

**Where:** `apps/app/electron/deviceDetection.ts:124-131`
```ts
osVersion = execSync(`adb -s ${serial} shell getprop ro.build.version.sdk`, ...);
```

**Risk:** `serial` is reported by the device (or a network adb endpoint). A malicious USB device or `adb connect 1.2.3.4:5555` to a hostile endpoint can present a serial like `1; touch /tmp/pwn ;` — `execSync` runs `/bin/sh -c`.

**Fix:**
```ts
import { execFileSync } from 'node:child_process';
if (!/^[A-Za-z0-9._:-]+$/.test(serial)) continue;
osVersion = execFileSync(
  'adb',
  ['-s', serial, 'shell', 'getprop', 'ro.build.version.sdk'],
  { encoding: 'utf-8', timeout: EXEC_TIMEOUT_MS },
).trim();
```
Apply the same pattern to all `execSync` shell-string calls (also `editors.ts:84` `which ${cli}`).

---

### B9 — CRITICAL — Command injection via tag name in release workflow

**Where:** `.github/workflows/release.yml:48,113` + `scripts/sync-version.ts:16`

**Risk:** `${GITHUB_REF_NAME#v}` is interpolated into bash, and `sync-version.ts`'s regex `/^\d+\.\d+\.\d+/` is unanchored — strings like `1.2.3$(rm -rf /)` pass validation. Anyone with tag-push access can RCE the runner.

**Fix:** anchor the regex and pass via env var instead of YAML interpolation:
```ts
// scripts/sync-version.ts
if (!/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(version)) throw new Error('bad version');
```
```yaml
# release.yml
- name: Sync version
  env:
    VERSION: ${{ steps.version.outputs.VERSION }}
  run: bun run scripts/sync-version.ts "$VERSION"
```

---

### B10 — DONE (2026-05-03) — `RELEASES_GITHUB_TOKEN` rotated

**Where:** `.github/workflows/release.yml:121`

**Status:** Rotated to a fine-grained PAT scoped only to `radar-releases` (Contents: Read & Write, Metadata: Read), 30-day expiry. Original classic PAT revoked.

**Future hardening:** consider migrating to a GitHub App installation token via `actions/create-github-app-token` for shorter-lived credentials.

---

### B11 — MEDIUM (downgraded from HIGH) — In-memory SQLite has no eviction

**Where:**
- `apps/app/electron/database.ts:11` — `new Database(':memory:')`
- `packages/database/src/repositories/{console,network,profiler,state,performance}Repository.ts` — `insert` has no rotation
- `apps/app/electron/websocketServer.ts:91-264` — every WS message inserts a row, no quota check

**Note:** The buggy `setInterval(console.log)` scenario crashes the dev's own Electron app, recoverable by restart. This is robustness, not security. Land it before promoting to general users; not blocking the public-repo flip.

**Fix:** add `AFTER INSERT` triggers per table:
```sql
CREATE TRIGGER trim_console AFTER INSERT ON console_logs
  WHEN (SELECT count(*) FROM console_logs WHERE device_id = NEW.device_id) > 10000
BEGIN
  DELETE FROM console_logs WHERE id IN (
    SELECT id FROM console_logs WHERE device_id = NEW.device_id
    ORDER BY id ASC LIMIT 1000
  );
END;
```
Same for `network_requests`, `profiler_commits`, `state_actions`, `performance_metrics`. Plus a per-message size guard in `persistMessage` (drop if `JSON.stringify(msg).length > 256 * 1024`).

---

### B12 — Covered by B2 + B3

**Where:** `packages/devtools/src/services/storage/index.ts:81-165` handles `storageSet` / `storageRemove` / `storageClear` from any WS peer.

**Status:** Once the WS has auth (B2) and the MCP is loopback + token-gated (B3), only authenticated peers reach storage writes. Per-call user confirmation isn't needed — the MCP write tools are LLM-debugging features. Just zod-validate the `RadarCommand` shape in the SDK before dispatching.

---

### B13 — CRITICAL — Auto-updater enabled with no signing or notarization

**Where:** `apps/app/electron/autoUpdater.ts` + `apps/app/package.json:114-119`

**Risk:** Unsigned `.dmg`/`.app` is replaced silently with whatever the GitHub release ships. If `RELEASES_GITHUB_TOKEN` is ever compromised, every Radar user gets attacker-controlled binaries with no warning. `APPLE_ID_PASSWORD` is also reused in two env vars (deprecated env name).

**Fix (option A — recommended for now):** disable auto-update until signing+notarization is wired.

**Fix (option B):** in `apps/app/package.json` `build.mac` add:
```json
"hardenedRuntime": true,
"gatekeeperAssess": false,
"entitlements": "build/entitlements.mac.plist",
"entitlementsInherit": "build/entitlements.mac.plist",
"notarize": { "teamId": "XXXXXXXXXX" }
```
Migrate to App Store Connect API key (`APPLE_API_KEY`, `APPLE_API_KEY_ID`, `APPLE_API_ISSUER`) instead of `APPLE_ID_PASSWORD`. For Windows, plan Azure Trusted Signing or DigiCert KeyLocker — never a `.pfx` in a secret.

---

## SHOULD-FIX before promoting to general users

### S1 — HIGH — No Content-Security-Policy
**Where:** `apps/app/index.html`
**Fix:** add a strict CSP and self-host the Inter/JetBrains fonts:
```html
<meta http-equiv="Content-Security-Policy"
  content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' ws://127.0.0.1:8347; font-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none';" />
```
Also enforce via `session.defaultSession.webRequest.onHeadersReceived` so it covers the dev server.

### S2 — HIGH — No `setWindowOpenHandler` / `will-navigate` lockdown
**Where:** `apps/app/electron/main.ts:39-62`
**Fix:**
```ts
win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
win.webContents.on('will-navigate', (e, url) => {
  if (url !== VITE_DEV_SERVER_URL && !url.startsWith('file://')) e.preventDefault();
});
```

### ~~S3~~ — DROPPED
Source maps in `radar-devtools/dist` are fine for an open-source SDK; they help downstream devs debug their integration.

### ~~S4~~ — Moved out of audit scope (correctness)
Capture-before-handshake is a correctness/perf concern in the SDK, not a security issue. Track separately.

### S5 — HIGH — GitHub Actions not SHA-pinned
**Where:** all `uses:` in `.github/workflows/*.yml`
**Fix:** pin every `uses:` to a 40-char SHA with version comment, e.g. `oven-sh/setup-bun@4bc047ad...c5d4c7e # v2.0.2`. Add `.github/dependabot.yml` for `github-actions` ecosystem.

### S6 — HIGH — `release.yml` permissions workflow-wide; `ci.yml` has no `permissions:` block
**Where:** `.github/workflows/{ci,release}.yml`
**Fix:** add `permissions: { contents: read }` at top of `ci.yml`. Move `release.yml` permissions into per-job blocks; strip `contents: write` from `build-electron`.

### S7 — HIGH — Self-push of version bump to `main` from a tag-triggered job
**Where:** `.github/workflows/release.yml:72-82`
**Fix:** stop pushing to `main` from CI. Either compute version in-memory for the release artifact, or use `peter-evans/create-pull-request` to open a PR. Remove `[skip ci]`.

### S8 — MEDIUM — `npm publish` missing `--provenance`
**Where:** `.github/workflows/release.yml:59`
**Fix:** `npm publish --access public --provenance` (you already have `id-token: write`).

### S9 — MEDIUM — CI installs without `--ignore-scripts`
**Where:** `.github/workflows/{ci,release}.yml` `bun install` steps
**Fix:** add `--ignore-scripts` on CI installs; only allow scripts on the publish/build job. Add a `trustedDependencies` allowlist to root `package.json`:
```json
"trustedDependencies": ["electron", "better-sqlite3", "fsevents", "@parcel/watcher", "esbuild"]
```

### S10 — MEDIUM — No GitHub Environment for production publishes
**Fix:** create environment `production` with required reviewer = maintainer. Add `environment: production` to publish jobs. Move `MAC_*`, `APPLE_*`, `RELEASES_GITHUB_TOKEN` into the environment.

### ~~S11~~ — Moved out of audit scope (perf)
Missing `LIMIT` clauses in DB/MCP read queries are a robustness/perf concern. Track separately.

### S12 — MEDIUM — MCP returns raw captured strings without prompt-injection fencing
**Where:** every MCP read tool in `packages/mcp/src/tools/`
**Note:** This matters specifically because Radar's MCP feeds LLMs (the tool's primary purpose). Captured request/response bodies can contain attacker-influenced strings that try to redirect the LLM.
**Fix:** wrap captured-string fields in tagged delimiters, e.g.
```
<<<UNTRUSTED_DATA id="…">>> ... <<<END>>>
```
Prepend a one-line LLM warning in tool results. Truncate each field to a fixed cap before returning.

### S13 — MEDIUM — DevTools toggle reachable in packaged build
**Where:** `apps/app/electron/main.ts:118-124`
**Fix:** `if (!app.isPackaged) ipcMain.on('radar:toggle-devtools', ...)`.

### ~~S14~~ — DROPPED
PATH hijacking presupposes the attacker can already write to a PATH directory (= local code exec). Resolving paths at startup adds complexity for no real protection.

### ~~S15~~ — DROPPED
Self-DoS in a search box: the user is searching their own data. Bug, not security.

### ~~S16~~ — Moved out of audit scope (battery/CPU)
Aggressive 3 s reconnect loop is a battery/CPU concern. Track separately.

### S17 — LOW (downgraded from MEDIUM) — No cap on concurrent WS clients, no idle timeout
**Where:** `apps/app/electron/websocketServer.ts:293-356`
**Note:** With B2 auth in place, untrusted peers can't connect, so this is defense-in-depth.
**Fix:** cap concurrent connections (e.g. 16); enforce a metadata deadline (close after 5 s without valid metadata); add ws heartbeat (ping/pong with terminate on no-pong).

---

## NICE-TO-FIX

### N1 — `.gitignore` doesn't cover `.env*` and signing artifacts
**Fix:** add to `.gitignore`:
```
.env
.env.*
!.env.example
*.pem
*.key
*.p12
*.keystore
!**/android/app/debug.keystore
.netrc
id_rsa*
*.mobileprovision
```

### N2 — Tighten `bun audit` to `--audit-level=low`
**Where:** `.github/workflows/ci.yml:60`

### ~~N3~~ — DROPPED
Per-launch `deviceId` nonce is correct for ephemeral debug sessions.

### N4 — Migrate to `eslint@9` (current is EOL `8.57.1`, dev-time only)

### N5 — Move `examples/expo` to its own lockfile
Stops canary Expo deps from polluting the root audit graph.

### N6 — Rename `packages/designSystem/` → `packages/design-system/`
Avoids case-sensitive Linux-CI gotchas.

### N7 — Add a SECURITY section to `radar-devtools` README
Warn about LAN exposure (until B2 ships); explicitly state `__DEV__` gating is required even after B5.

### N8 — Remove dead `journal_mode = WAL` pragma on `:memory:` DB
**Where:** `packages/database/src/createDatabase.ts:43`

### ~~N9~~ — Moved out of audit scope (correctness)
`inspected_components` upsert key missing `session_id` is a correctness bug. Track separately.

### N10 — `parseBody` swallows JSON parse errors silently
**Where:** `packages/mcp/src/index.ts:29-31`
**Fix:** reject with `400 Bad Request` on `JSON.parse` failure.

### N11 — Local `git stash` could be pushed accidentally before publishing
**Fix:** `git stash drop` before flipping public.

---

## GitHub UI checklist (do immediately before flipping public)

- [ ] **Settings → Actions → General → Workflow permissions**: "Read repository contents and packages permissions". Disable "Allow GitHub Actions to create and approve pull requests".
- [ ] **Settings → Actions → General → Fork pull request workflows**: "Require approval for first-time contributors".
- [ ] **Settings → Branches → Rules for `main`**: require PR with 1+ approving review, require status checks (Lint, Typecheck, Test, Dependency Audit), require branches up to date, require conversation resolution, require signed commits, block force pushes, block deletions, include administrators.
- [ ] **Settings → Tags → Rules for `v*`**: require signed tags; restrict who can push tags.
- [ ] **Settings → Environments → Create `production`**: required reviewer = maintainer. Move `MAC_CERTIFICATE`, `MAC_CERTIFICATE_PASSWORD`, `APPLE_API_KEY*`, `APPLE_TEAM_ID`, `RELEASES_GITHUB_TOKEN` into this environment. Delete repo-level copies.
- [x] **Settings → Secrets**: rotate `RELEASES_GITHUB_TOKEN` to a fine-grained PAT or GitHub App token scoped only to `radar-releases`. 30-day expiry. **Done 2026-05-03.**
- [ ] **Settings → Code security and analysis**: enable Dependabot alerts, Dependabot security updates, Dependabot version updates, Secret scanning, Push protection, CodeQL (default setup), Private vulnerability reporting.
- [ ] **npmjs.com → radar-devtools → Settings → Publishing access**: configure Trusted Publisher (GitHub Actions OIDC) bound to `lucas-figueiredo-m/radar`, workflow `release.yml`, environment `production`. Delete any classic automation tokens.
- [ ] **npmjs.com account**: enable 2FA "Authorization and writes".
- [ ] **Settings → Pull Requests**: enforce squash-only.
- [ ] **Settings → Collaborators**: confirm only maintainer has admin.
- [ ] **Settings → Moderation**: limit interactions to existing users for the first 30 days.

---

## Recommended order of operations

### Phase 1 — make the repo publishable (1 day)
1. **B1** — squash history into a single commit (kills 4 history findings at once).
2. **B9** — fix release-workflow command injection.
3. ~~**B10**~~ — done 2026-05-03.
4. Configure GitHub UI checklist above.

### Phase 2 — make `radar-devtools` safe to publish to npm (~1 day)
5. **B5** — internal `__DEV__` guard in `init()`.
6. **N7** — README SECURITY section warning about LAN exposure + reinforcing `__DEV__`.

### Phase 3 — make the Electron app safe to install (3-5 days)
7. **B2** — keep `0.0.0.0` binding, add per-launch token + Origin check + payload cap + zod schema validation.
8. **B3** — bind MCP to `127.0.0.1`, add MCP-level token, body cap, Origin check.
9. **B6** — Electron preload + contextIsolation + sandbox.
10. **B7** — path-traversal hardening (downgraded but cheap).
11. **B8** — `adb` shell-injection fix (`execFileSync` + serial regex).
12. **B11** — DB eviction triggers + per-message size guard (robustness).
13. **B12** — zod-validate `RadarCommand` in SDK (auth itself comes from B2).
14. **B13** — wire signing+notarization, OR turn off auto-update for now.
15. **S1, S2, S5–S10, S12, S13, S17** — defense-in-depth.

After Phase 1+2 you can flip the repo public and `npm publish` the SDK with confidence. Phase 3 should land before promoting the Electron desktop app to general users.

---

## What's already good

- `bun audit` returns clean. All seven `overrides` in root `package.json` resolve correctly.
- The published `radar-devtools` bundle ships **zero npm runtime dependencies** — best-in-class supply-chain isolation for end users.
- The `packages/database` layer is uniformly safe: every statement uses prepared bindings; no string-concatenated SQL anywhere.
- Zero `eval`, `new Function`, `vm.runIn*`, dynamic `require(userInput)`, `dangerouslySetInnerHTML`, prototype-pollution sinks, or template-injection sinks anywhere in source.
- CI uses `pull_request` not `pull_request_target` — fork PRs run with no secrets.
- CI gates `bun audit --audit-level=moderate` on every PR.
- iOS and Android native modules in `radar-devtools` only read process-local performance counters (no network, no FS, no permissions).
- SQLite is `:memory:` — nothing persists to disk; no encryption-at-rest concerns today.
- No `eval`-class or `pull_request_target` foot-guns; no self-hosted runners; no `actions/cache` to poison.
- `LICENSE`, `SECURITY.md`, `CONTRIBUTING.md`, `README.md` all present.
- `RELEASES_GITHUB_TOKEN` rotated to a fine-grained, scope-limited PAT (2026-05-03).

The encouraging signal: the codebase clearly avoids the *flashy* sins. Closing the remaining transport-and-Electron-hardening items lifts it comfortably to A-/A.
