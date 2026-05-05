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
