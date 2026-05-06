# Radar Security Audit — Resolved & Dropped Items

> Companion to [SECURITY_AUDIT.md](./SECURITY_AUDIT.md). Holds items that are completed (DONE), dropped after threat-model review, or moved out of audit scope. Kept for historical reference and rationale; the active audit excludes these.
>
> **Threat-model context for the drops:** Radar is a *local* React Native debugging tool. Developers install the `radar-devtools` SDK in their own RN app; the Electron app on the dev's laptop receives captured data over a LAN WebSocket; an MCP server feeds the same data to local LLMs (Claude Code, Cursor). Several findings from the original parallel-subagent audit (default header redaction, ReDoS in the user's own search box, PATH-resolution hardening, source maps in an open-source SDK) were reframed against this model and dropped as not-issues.

---

## Completed

### B1 — DONE 2026-05-04 — Git history squashed; secrets and personal/client data wiped

**Status:** Squashed entire history into a single fresh `chore: initial public release` commit (`d393496`) using the `git checkout --orphan` recipe. Force-pushed to `origin/main` after a safety bundle (`~/Downloads/radar-pre-squash-2026-05-04.bundle`, 17 MB).

**Cleanup also done:**
- Deleted all 9 historical tags (`v0.2.0` … `v0.4.6`) locally and on origin.
- Deleted 15 stale local branches and 4 remaining remote branches; pruned 11 stale remote-tracking refs.
- Pruned the abandoned `.claude/worktrees/tro-17` worktree.
- `git gc --aggressive --prune=now` shrank `.git` from 43 MB → 16 MB.
- Next.js preview key rotation was moot — `apps/landing/` had been removed before the squash, so the offending commit `c33fb02` no longer exists in any reachable form and there's no `.next/` to regenerate.

**Resolved leaks:** `trontechnologies` × 71, `truckAtlasMobile`, `.claude/` agent state, personal absolute paths, Next.js preview keys.

**Backup retention:** keep `~/Downloads/radar-pre-squash-2026-05-04.bundle` until comfortable (GitHub also retains unreachable objects via reflog for ~90 days).

---

### B9 — DONE 2026-05-04 — Tag-name command injection in release workflow closed

**Where (was):** `.github/workflows/release.yml` (multiple `${{ ... }}`-in-`run:` sites) + `scripts/sync-version.ts:16`

**Status (commit `c738756`):**
- `scripts/sync-version.ts` regex anchored: `/^\d+\.\d+\.\d+(-[\w.]+)?$/` — `1.2.3$(rm)` no longer matches.
- All 5 vulnerable interpolation sites in `release.yml` converted from `${{ ... }}` directly in `run:` to env-var pattern (`env: { VERSION: ${{ ... }} }` then `"$VERSION"`):
  - "Sync version across packages" (main job)
  - "Publish to npm" (`npm view radar-devtools@$VERSION`)
  - "Create GitHub Release" (`$REF_NAME`)
  - "Commit version bump back to main"
  - "Sync version" (build-electron job)
- Verified: a tag like `v1.2.3$(touch /tmp/PWNED)` is rejected by the regex and `/tmp/PWNED` is not created. Even if the regex were bypassed, env-var expansion in the shell substitutes literal text — `$(...)` inside a substituted env value is never re-parsed as command substitution.

---

### B10 — DONE 2026-05-03 — `RELEASES_GITHUB_TOKEN` rotated

**Where:** `.github/workflows/release.yml:121`

**Status:** Rotated to a fine-grained PAT scoped only to `radar-releases` (Contents: Read & Write, Metadata: Read), 30-day expiry. Original classic PAT revoked.

**Future hardening:** consider migrating to a GitHub App installation token via `actions/create-github-app-token` for shorter-lived credentials.

---

### N1 — DONE 2026-05-05 — `.gitignore` extended to cover secrets and signing artifacts

**Where:** `.gitignore`

**Status:** Added a "Secrets and signing artifacts" block:
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
Negative patterns (`!.env.example`, `!**/android/app/debug.keystore`) preserve the public example env and the React Native debug keystore that's intentionally shared.

---

### N2 — DONE 2026-05-05 — CI audit threshold tightened to `low`

**Where:** `.github/workflows/ci.yml:60`

**Status:** `bun audit --audit-level=moderate` → `bun audit --audit-level=low`. Verified clean locally — `No vulnerabilities found` at the stricter threshold, so CI won't go red.

---

### Dependabot 2026-05-05 — 5 Ruby-gem CVEs in `examples/react-native/Gemfile.lock` patched

**Where:** `examples/react-native/Gemfile` + `Gemfile.lock` (Ruby gems used by CocoaPods on iOS for the example RN app — surfaced by GitHub Dependabot, not the original parallel audit, because `bun audit` only scans the Node/JS ecosystem).

**Alerts closed:**
| Gem | Severity | Issue | Was → Now |
|---|---|---|---|
| `addressable` | HIGH | ReDoS in URI templates | 2.8.8 → 2.9.0 |
| `json` | HIGH | Format-string injection | 2.18.1 → 2.19.5 |
| `activesupport` | MEDIUM ×3 | DoS in number helpers, XSS in `SafeBuffer#%`, ReDoS in `number_to_delimited` | 7.2.3 → 7.2.3.1 |

**Side effects from the resolution:**
- `minitest` 6.0.2 → 5.27.0 — required because `activesupport 7.2.3.1` depends on `minitest >= 5.1, < 6`. Added `gem 'minitest', '< 6'` to the Gemfile (with a comment explaining the constraint) so the resolver picks the right version.
- `bigdecimal` 4.0.1 → 4.1.2 — transitive bump, harmless.
- `prism` removed — it was a `minitest 6.x` dependency and isn't needed under 5.x.

**Verification:** `bundle install` resolves cleanly. The example app's CocoaPods setup (`pod install`) was not re-run; gem changes are within minor/patch ranges so risk to the example is negligible. Re-scan from Dependabot will close the 5 alerts on next workflow run.

---

### B5 — DONE 2026-05-05 — `radar-devtools` `init()` now refuses to run in production builds

**Where:** `packages/devtools/src/index.ts`

**Status:** Two early-return guards added at the top of `init()`, before any state mutation or service creation:
```ts
const dev = (globalThis as { __DEV__?: boolean }).__DEV__;
if (dev === false) return;
const nodeEnv = (
  globalThis as { process?: { env?: { NODE_ENV?: string } } }
).process?.env?.NODE_ENV;
if (nodeEnv === 'production') return;
```
Plus a single `console.warn` when `__DEV__` is undefined and the configured host is not in `{localhost, 127.0.0.1, ::1}` — flags the suspicious "unknown environment + remote host" combination without blocking the call.

**Why two guards:** RN's Metro sets `__DEV__ === false` on production builds; bundlers in other ecosystems (Expo web, plain webpack) replace `process.env.NODE_ENV` with `'production'`. Either signal is enough to abort. The `globalThis` casts avoid pulling in `@types/node` for a package that targets React Native.

**Behaviour:**
- RN dev (`__DEV__ === true`): init runs normally.
- RN production (`__DEV__ === false`): init returns immediately, no globals patched, no WebSocket connection attempted, no `[radar] devtools initialized` log.
- Non-RN consumer with `NODE_ENV === 'production'`: same — init returns immediately.
- Unknown environment (no `__DEV__`, no `NODE_ENV === 'production'`) with a remote host: init runs but logs a single warning so the developer notices.

**Verified:** typecheck + lint clean; all 171 existing devtools tests pass.

---

### GitHub UI 2026-05-05 — Repo, branch/tag protection, environment, secret scoping, and npm publishing locked down

**Status:** All items from the original "GitHub UI checklist" configured.

- **Settings → Actions → General → Workflow permissions:** read-only; "Allow GitHub Actions to create and approve pull requests" disabled.
- **Settings → Actions → General → Allow … actions and reusable workflows:** `selected` mode. Sub-toggle "Allow actions created by GitHub" enabled (covers `actions/checkout`, `actions/setup-node`, …). Allowlist contains `oven-sh/setup-bun@*`. "Require actions to be pinned to a full-length commit SHA" enabled — enforces S5 at the orchestrator level: any workflow with a tag-ref slipped past review fails at startup before code runs.
- **Settings → Actions → General → Fork pull request workflows:** "Require approval for first-time contributors".
- **Settings → Rules → Branch ruleset for `main`:** require PR with 1 approving review and dismiss stale approvals on new push, require conversation resolution, require status checks (Lint, Typecheck, Test, Dependency Audit) with branches up to date, require signed commits, block force pushes, restrict deletions, squash-merge only. Repo admin (maintainer) on bypass list — pragmatic for solo maintenance; revisit when adding co-maintainers.
- **Settings → Rules → Tag ruleset for `v*`:** restrict creations, restrict updates, restrict deletions, require signed commits (= signed tags), block force pushes.
- **Settings → Environments → `production`:** required reviewer = maintainer; `MAC_CERTIFICATE`, `MAC_CERTIFICATE_PASSWORD`, `APPLE_API_KEY*`, `APPLE_TEAM_ID`, `RELEASES_GITHUB_TOKEN` moved into the environment; repo-level copies deleted.
- **Settings → Code security and analysis:** Dependabot alerts + security updates + version updates, secret scanning + push protection, CodeQL (default setup), and Private vulnerability reporting all enabled.
- **npmjs.com → radar-devtools → Settings → Publishing access:** Trusted Publisher (GitHub Actions OIDC) bound to `lucas-figueiredo-m/radar`, workflow `release.yml`, environment `production`. Classic automation tokens removed.
- **npmjs.com account:** 2FA "Authorization and writes" enabled.
- **Settings → Pull Requests:** squash-only (merge + rebase disabled).
- **Settings → Collaborators:** only maintainer has admin.
- **Settings → Moderation:** "Limit to existing users" enabled for the first 30 days.

**Net effect:** Phase 1 of the recommended order of operations is complete. Repo flip-public is no longer gated on GitHub-UI configuration; remaining gating is N7 (README SECURITY section) before npm publish, and Phase 2 (Electron hardening) before promoting to general users.

---

### B2 — DONE 2026-05-05 — WebSocket transport hardened

**Where:** `apps/app/electron/websocketServer.ts`, `apps/app/electron/verifyOrigin.ts` (new), `packages/types/src/schemas.ts` (new)

**Status (PR #18, squash `b923f1e`):** Four layered protections on the same `0.0.0.0:8347` binding. The bind stays public on purpose — a real iPhone/Android device on the same wifi as the dev's laptop needs LAN reachability:

- **Schema validation** — every incoming `RadarMessage` flows through a zod `discriminatedUnion` over the 13 inbound types (`packages/types/src/schemas.ts`). Malformed payloads are dropped with `result.error.issues` logged; they never reach the DB layer or the renderer. Replaces the previous cast-and-pray pattern in `persistMessage`.
- **Payload cap** — `maxPayload: 32 MiB` on the WebSocket server. Frames exceeding the cap are rejected with WebSocket close code 1009. Verified: a 33 MiB frame is rejected in ~4.8 s and radar's main thread remains responsive (fresh handshakes complete in 3 ms during and after the attack).
- **Origin allowlist** — `verifyClient` accepts an `Origin` header only when its `host:port` equals the request's `Host` header. Blocks browser tabs from `evil.com` (or any other-origin page) while allowing React Native's auto-derived `Origin` (RN's WebSocket polyfill sets `Origin` equal to the WS server URL itself). Extracted into a pure `verifyOrigin()` helper with 9 unit tests covering native/RN/LAN/IPv6/evil.com/port-mismatch/loopback-alias/malformed-URL/missing-host cases.
- **Metadata-impersonation guards** — reject a second `metadata` message on a socket that's already registered, and reject `metadata` claiming a `deviceId` already held by another live socket. Stops a malicious peer from displacing a legitimate device entry.

**Decision deliberately deferred from the audit's original recommendation:** no per-launch shared secret. None of Reactotron / Flipper / React DevTools require one — they all assume "the dev's LAN is trusted" and the friction of re-pasting a fresh token into `radar-devtools` config every session would tank adoption. Tracking "informed consent" UI (tray surfaces the listening interface, opt-in toggle for LAN-vs-loopback, warning on non-private networks) as a future S-tier item rather than blocking on it.

**Residual risk (acknowledged):** without auth, a determined LAN peer can still send well-formed `RadarCommand`s (e.g. `storageClear`). The Origin check rejects browser tabs but not native WS clients on the LAN. This is a known gap inherited from the comparable-tools threat model; mitigated in practice by the dev usually being on a trusted home/office wifi and the captured-data TTL being short. B12's "zod-validate `RadarCommand` in SDK" is the next layer (still TODO) — restricts the command shape but doesn't gate on identity.

**Verified end-to-end:** booted `examples/react-native` on iPhone 17 Pro Max sim; device registered cleanly, console panel UI live, no spurious rejections. Six synthetic smoke tests exercise the rejection paths (origin, schema, dup metadata, cross-socket impersonation, oversized frame, fresh-handshake-survives-cap).

---

### S5 — DONE 2026-05-05 — All GitHub Actions pinned to commit SHAs + Dependabot config

**Where:** `.github/workflows/ci.yml`, `.github/workflows/release.yml`, `.github/dependabot.yml` (new)

**Status (PR #18, squash `b923f1e`):** All three third-party action references replaced with 40-char commit SHAs:

| Action | SHA | Tag comment |
|---|---|---|
| `actions/checkout` | `93cb6efe18208431cddfb8368fd83d5badbf9bfd` | `# v5` |
| `oven-sh/setup-bun` | `0c5077e51419868618aeaa5fe8019c62421857d6` | `# v2` |
| `actions/setup-node` | `a0853c24544627f65ddf259abe73b1d18a591444` | `# v5` |

Forced by the repo-level "Require actions to be pinned to a full-length commit SHA" setting (now enabled — see S14). Tag-pinned references were rejected at startup; CI ran `startup_failure` for the two pushes preceding this commit until every `uses:` resolved to a 40-char SHA.

**Dependabot:** added `.github/dependabot.yml` registering the `github-actions` ecosystem on a weekly schedule. New SHAs land as reviewable PRs whenever upstream cuts a release; we don't lose security updates by pinning.

**Defends against:** the `tj-actions/changed-files` 2025 attack class — a maintainer-account compromise re-points an existing tag to a malicious commit, every consumer's CI silently runs the new code on next push.

---

### Dependabot/CI 2026-05-05 — `ip-address` GHSA-v2v4-37r5-5v8g closed

**Where:** root `package.json` `overrides`, `bun.lock`

**Status (PR #18, squash `b923f1e`):** Fresh advisory against `ip-address <=10.1.0` (XSS in `Address6` HTML-emitting methods) reached the workspace transitively through `@radar/mcp → @modelcontextprotocol/sdk`. Surfaced as a `bun audit --audit-level=low` failure on PR #18's first green-CI run; the audit had been clean as of N2 earlier the same day, so this was published in a tight window.

**Resolution:** Added `"ip-address": ">=10.1.1"` to root `package.json` `overrides`, taking the count from seven to eight. `bun audit --audit-level=low` returns `No vulnerabilities found` again.

---

### B3 — DONE 2026-05-05 — MCP transport hardened (loopback + bearer token)

**Where:** `packages/mcp/src/index.ts`, `packages/mcp/src/verifyMcpOrigin.ts` (new), `packages/mcp/src/verifyMcpToken.ts` (new), `apps/app/electron/main.ts`

**Status (PR #23, squash `28f680d`):** Four protections layered on the MCP HTTP server. Unlike B2's WebSocket binding, the MCP doesn't need LAN reachability — its consumers (Claude Code, Cursor, etc.) run on the developer's own machine — so loopback is the correct exposure:

- **Loopback bind** — `httpServer.listen(8348, '127.0.0.1', …)`. Removes the LAN-reach that let any peer on the same network call the MCP, read captured network/console/state data, or invoke the destructive write tools (`modify_storage`, `reset_data`, `reload_and_profile`).
- **Per-launch bearer token** — every `/mcp` request requires `Authorization: Bearer <token>`. Reads from `RADAR_MCP_TOKEN` env var if set, else auto-generates a UUID at process start. Surfaced in the system tray as a "Copy MCP Token" entry. Constant-time comparison via `crypto.timingSafeEqual` on equal-length buffers.
- **1 MiB body cap** — POST bodies over 1 MiB get a `413 Payload Too Large` and the request is `req.destroy()`-ed so a hostile client can't keep buffering memory.
- **Origin allowlist** — every method (POST/GET/DELETE) checks `Origin`: undefined / empty / `"null"` / loopback hostnames (`localhost`, `127.0.0.1`, `[::1]`) accepted; everything else gets `403`. Defense-in-depth against browser DNS-rebinding even though the loopback bind already blocks it.

Origin and token checks are extracted into pure helpers (`verifyMcpOrigin`, `verifyMcpToken`) with 18 unit tests covering the cases that matter (undefined/empty/`"null"` Origin, loopback variants, public domains, malformed URLs; missing/empty/wrong-scheme Authorization, off-by-one tokens, prefix/suffix tokens, case-sensitive scheme prefix). Mirrors the B2 `verifyOrigin` pattern. Adds vitest to `@radar/mcp` and wires it into the root `test` script — total 423 passing (radar-app 234 + devtools 171 + mcp 18).

**Verified end-to-end:** Claude Code (the MCP client) successfully authenticated against the new bearer-token gate and pulled live `get_app_overview` data from a connected iPhone 17 Pro Max sim. Manual smokes for the 401 path (no token) and `RADAR_MCP_TOKEN=foo` env override are still pending but trivial.

**Note on B12:** with B3 done, `RadarCommand` dispatch on the Electron side is now identity-gated. The remaining B12 action item — zod-validating the command shape on the SDK side before it dispatches `storageSet`/`storageRemove`/`storageClear` — is still open in the active audit.

---

### S2/S6 (ci half)/S8/S13/N8/N10 — DONE 2026-05-06 — Defense-in-depth sweep landed (PR #24)

**Where:** `apps/app/electron/main.ts`, `packages/database/src/createDatabase.ts`, `packages/mcp/src/index.ts`, `.github/workflows/ci.yml`, `.github/workflows/release.yml`

**Status (PR #24):** Six cheap defense-in-depth items from the trivial bucket landed as a single sweep:

- **S2** — Electron renderer navigation locked down. `setWindowOpenHandler` denies all popups; `will-navigate` blocks anything outside the Vite dev server / `file://`. A future XSS-equivalent gadget in the renderer can no longer `window.open` or navigate to an attacker URL.
- **S13** — `radar:toggle-devtools` IPC only registers when `!app.isPackaged`. Packaged users no longer have a path to the renderer devtools.
- **S6 (ci.yml half)** — top-level `permissions: { contents: read }` on `ci.yml`. The reusable workflow now starts read-only by default. The `release.yml` per-job restructure remains open in the active audit under the same ID.
- **S8** — `npm publish --access public --provenance`. The published `radar-devtools` tarball now carries a Sigstore attestation tied to the exact workflow run that built it. A leaked publish credential can't forge the attestation; consumers can verify with `npm audit signatures`.
- **N8** — dropped the `journal_mode = WAL` pragma — no-op on `:memory:` SQLite databases.
- **N10** — MCP `parseBody` now distinguishes `too_large` (413) from `invalid_json` (400). A malformed body is no longer silently coerced to `{}` and routed into the MCP transport.

**Verified:** typecheck + lint clean across `apps/app`, `packages/database`, `packages/mcp`; pre-push hook ran the full test suite (`apps/app` 234 passed, `radar-devtools` 171 passed).

---

## Dropped after threat-model review

### B4 — Default header/body redaction in `radar-devtools` capture
A debugger that hides `Authorization`/`Cookie`/bodies is broken; Chrome DevTools, Reactotron, Charles, mitmproxy all show full requests. Captured creds are dev-account tokens against staging APIs (especially after B5 lands the `__DEV__` guard). The real defense is locking the *transport* (B2/B3); full capture is correct behaviour. Optional opt-in redaction config can be added later as a config knob.

### S3 — Source maps in `radar-devtools/dist`
Open-source SDK; maps help downstream devs debug their integration. Not a leak.

### S14 — `adb`/`xcrun`/editors resolved via `$PATH`
PATH hijacking presupposes the attacker can already write to a PATH directory (= local code exec already). Resolving paths at startup adds complexity for no real protection.

### S15 — ReDoS in search regex
User searching their own captured data; only victim is themselves. Bug, not security.

### N3 — Persistent `deviceId` UUID
Per-launch nonce is correct for ephemeral debug sessions. Persisting it adds storage with no clear win.

### N7 — `radar-devtools` README SECURITY section
Reframed as not necessary on threat-model review. (1) The proposed LAN-exposure warning would be redundant with what comparable RN debug tools (Reactotron, Flipper) don't say — they share the same LAN model and devs accept this; once B2 lands transport auth the warning would be wrong anyway. (2) `__DEV__` gating is enforced in code by B5; a brief `if (__DEV__) { init(...) }` example belongs in the standard Usage section as a tree-shaking/bundle-size note, not a SECURITY section.

---

## Moved out of audit scope (correctness/performance, not security)

These are real bugs/perf concerns worth fixing, but don't belong in a security audit. Track separately.

### S4 — Capture-before-handshake in the SDK
The SDK starts patching globals at `init()` regardless of WS connection state, buffering payloads in memory while disconnected. Correctness/perf concern.

### S11 — Missing `LIMIT` clauses in DB/MCP read queries
Affected: `packages/database/src/repositories/stateRepository.ts` (`getActions`), `storageRepository.ts` (`getEntries`), `profilerRepository.ts` (`getCommitsBySession`); MCP tools `getStateActions`, `getStorageEntries`, `getProfilerData`. Add `LIMIT @limit` (default 500); add `limit`/`offset` to MCP tool inputs (default 100, max 1000). Convert `state.getActions` to named bindings.

### S16 — Aggressive 3 s reconnect backoff
`packages/devtools/src/connection.ts:70-93`. Switch to exponential backoff capped at 30–60 s with jitter; cap max attempts; reset on successful connect. Battery/CPU concern.

### N9 — `inspected_components` upsert key missing `session_id`
`packages/database/src/schema.ts:61`. Key on `(device_id, session_id, component_id)` to avoid stale cache hits across reloads.
