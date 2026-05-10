# Radar — Open-Source Readiness Security Audit

> Pre-release audit covering: secrets/git history, Electron hardening, WebSocket transport, devtools-package privacy, dependency/supply-chain, CI/CD & release, code injection, path traversal, DoS/resource exhaustion, and MCP+database packages.
>
> See [SECURITY_AUDIT_RESOLVED.md](./SECURITY_AUDIT_RESOLVED.md) for items completed, dropped after threat-model review, or moved out of audit scope (with full rationale).

## Verdict

**Safe to publish — closeout complete.** All BLOCKERS, SHOULD-FIX, and NICE-TO-FIX items from the active audit are closed. Eight PRs (#26–#33) plus a dep-override commit are stacked on the `security/b6-electron-preload-context-isolation` integration branch (PR #25 → `main`); the maintainer's smoke test of the integrated state is the last gate before merging B6 into `main`.

### Threat model — original concerns + status

**You (the maintainer)**
- ~~Apple signing creds reused across two env vars; deprecated env name.~~ — Auto-updater disabled by **B13 option A** (PR #27); when it's re-enabled via option B, the migration to App Store Connect API key is part of that follow-up.

**The repo**
- ~~Self-push of version bumps to `main` from a tag-triggered job.~~ — Closed by **S7** (PR #28): version computed in-memory only; commit-back step removed.

**Users who install `radar-devtools`**
- The default Android host is `10.0.2.2` (emulator's host alias); on a real phone that's a routable LAN IP. — Already closed by **B2** transport auth, see RESOLVED.md.

**Anyone running the Radar Electron app on a non-trusted network**
- ~~Auto-updater is unsigned.~~ — Closed by **B13 option A** (PR #27): the auto-update path is a no-op until full signing/notarization is wired.

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

## Active items

**None.** Every item from the active audit closed in the closeout sweep landed on the `security/b6-electron-preload-context-isolation` integration branch:

- **BLOCKERS:** B7, B8, B11, B12, B13 — closed in PRs #26, #27, #29, #30.
- **SHOULD-FIX:** S1, S6, S7, S9, S10, S12, S17 — closed in PRs #28, #29, #30, #31.
- **NICE-TO-FIX:** N4, N5, N6 — closed in PRs #32, #33; N11 closed by ad-hoc cleanup.

Plus a follow-on dep-override commit (`56c05af`) on the same branch closes 4 transitive vulns (`fast-xml-builder`, `fast-uri`, `@babel/plugin-transform-modules-systemjs`, `hono`) surfaced by `bun audit --audit-level=low` once the closeout sweep merged.

See [SECURITY_AUDIT_RESOLVED.md](./SECURITY_AUDIT_RESOLVED.md) for full per-item rationale and verification.

### Open follow-ups (out of audit scope)

- **B13 option B** — full Apple notarization + Windows signing setup, when ready to re-enable auto-update. Requires Apple Developer account configuration, entitlements plist, App Store Connect API key migration, and either Azure Trusted Signing or DigiCert KeyLocker for Windows.
- **S1 visual** — self-host Inter/JetBrains fonts if the system-font fallbacks introduced by PR #29 aren't acceptable visually.
- **S4, S11, S16, N9** — non-security correctness/perf items already moved out of audit scope (see RESOLVED.md → "Moved out of audit scope").

---

## What's already good

- `bun audit --audit-level=low` returns clean. All twelve `overrides` in root `package.json` resolve correctly.
- The published `radar-devtools` bundle ships **zero npm runtime dependencies** — best-in-class supply-chain isolation for end users.
- The `packages/database` layer is uniformly safe: every statement uses prepared bindings; no string-concatenated SQL anywhere.
- Zero `eval`, `new Function`, `vm.runIn*`, dynamic `require(userInput)`, `dangerouslySetInnerHTML`, prototype-pollution sinks, or template-injection sinks anywhere in source.
- Electron renderer is sandboxed with Node integration off and contextIsolation on; IPC crosses a narrow `radar:`-prefixed `contextBridge` surface (B6).
- Every captured-string field returned by an MCP tool is fenced with `<<<UNTRUSTED_DATA>>>` delimiters + a one-line LLM warning + a 16 KiB cap (S12).
- WebSocket transport: schema-validated, origin-allowlisted, 32 MiB payload cap (B2); 16-connection cap, 5 s metadata-deadline, 30 s heartbeat (S17); per-message 256 KB size guard + AFTER-INSERT eviction triggers on every high-volume table (B11).
- MCP transport: loopback-only bind, per-launch bearer token, constant-time comparison, origin allowlist (B3).
- Every shell-command exec uses `execFileSync` with arg arrays — no `/bin/sh -c` anywhere (B8).
- Auto-updater is a no-op until signing+notarization is wired (B13 option A).
- CI uses `pull_request` not `pull_request_target` — fork PRs run with no secrets. All third-party actions pinned to commit SHAs; Dependabot config in place (S5).
- iOS and Android native modules in `radar-devtools` only read process-local performance counters (no network, no FS, no permissions).
- SQLite is `:memory:` — nothing persists to disk; no encryption-at-rest concerns today.
- No `eval`-class or `pull_request_target` foot-guns; no self-hosted runners; no `actions/cache` to poison.
- `LICENSE`, `SECURITY.md`, `CONTRIBUTING.md`, `README.md` all present.
- `RELEASES_GITHUB_TOKEN` is a fine-grained PAT scoped only to `radar-releases`.
- Git history is clean — no secrets, personal data, or prior-employer/client references in any reachable ref.
- Release workflow has no `${{ ... }}`-in-`run:` interpolations; every value flows through env-var indirection.
- `.gitignore` covers `.env*`, signing certs (`*.pem`/`*.key`/`*.p12`/`*.keystore`/`*.mobileprovision`), and SSH keys.
- `release.yml` has top-level `permissions: {}` with per-job grants; `--ignore-scripts` on lint/typecheck/test; `trustedDependencies` allowlist; `environment: production` on publish jobs (S6/S7/S9/S10).

The encouraging signal: with the closeout complete, the audit lifts comfortably to A-/A.
