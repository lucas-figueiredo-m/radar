# Release Setup Guide

Manual setup steps required to make the CI/CD pipeline work.

---

## 1. npm Trusted Publishing

Uses OIDC — no token needed. GitHub Actions authenticates directly with npm.

1. Publish `radar-devtools` manually once (if not already published):
   ```bash
   cd packages/devtools && bun run build && npm publish
   ```
2. Go to [npmjs.com](https://www.npmjs.com) → find **`radar-devtools`** → **Settings**
3. Under **"Trusted Publisher"**, click **GitHub Actions**
4. Fill in:
   - **Repository owner**: `lucas-figueiredo-m`
   - **Repository name**: `radar`
   - **Workflow filename**: `release.yml`
   - **Environment**: leave empty

---

## 2. Apple Code Signing Certificate

1. Open **Keychain Access** on your Mac
2. Find your **Apple Developer ID Application** certificate (or create one at [developer.apple.com](https://developer.apple.com) → Certificates, Identifiers & Profiles)
3. Export the certificate + private key as a `.p12` file with a password
4. Base64-encode it:
   ```bash
   base64 -i certificate.p12 | pbcopy
   ```
5. Add as GitHub secrets:
   - `MAC_CERTIFICATE` ← the base64 string
   - `MAC_CERTIFICATE_PASSWORD` ← the password you set during export

---

## 3. Apple Notarization Credentials

1. Go to [appleid.apple.com](https://appleid.apple.com) → Sign-In and Security → App-Specific Passwords
2. Generate an app-specific password
3. Find your Team ID at [developer.apple.com](https://developer.apple.com) → Membership
4. Add as GitHub secrets:
   - `APPLE_ID` ← your Apple Developer email
   - `APPLE_ID_PASSWORD` ← the app-specific password
   - `APPLE_TEAM_ID` ← your Team ID (e.g., `ABC123DEF4`)

---

## 4. Public Releases Repository

Electron app binaries are published to a **separate public repo** so users can download them without authentication.

1. Create a new **public** repo: [`lucas-figueiredo-m/radar-releases`](https://github.com/lucas-figueiredo-m/radar-releases)
   - No code needed — it's only used to host GitHub Releases
   - Add a short README explaining its purpose
2. Create a **Personal Access Token (PAT)** with `repo` scope (or fine-grained with `contents: write` on `radar-releases`)
   - Go to GitHub → Settings → Developer settings → Personal access tokens
3. Add as GitHub secret on the **`radar`** repo: `RELEASES_GITHUB_TOKEN`

---

## 5. GitHub Branch Protection

1. Go to repo **Settings → Branches → Add rule** for `main`
2. Enable:
   - "Require status checks to pass before merging" → select the `quality` job from CI workflow
   - "Require branches to be up to date before merging"
   - Under "Restrict who can push to matching branches" → allow **GitHub Actions** bot (so the release workflow can push the version bump commit back to `main`)

---

## 6. GitHub Repository Permissions

1. Go to repo **Settings → Actions → General**
2. Under "Workflow permissions", select **"Read and write permissions"** (needed for electron-builder to create releases and upload assets)

---

## GitHub Secrets Summary

| Secret | Purpose |
|--------|---------|
| `MAC_CERTIFICATE` | Base64-encoded Apple Developer `.p12` certificate |
| `MAC_CERTIFICATE_PASSWORD` | Certificate password |
| `APPLE_ID` | Apple Developer email |
| `APPLE_ID_PASSWORD` | App-specific password for notarization |
| `APPLE_TEAM_ID` | Apple Developer Team ID |
| `RELEASES_GITHUB_TOKEN` | PAT with write access to `lucas-figueiredo-m/radar-releases` |

> `GITHUB_TOKEN` is provided automatically by GitHub Actions (only has access to the source repo).

---

## Release Process

Once everything is configured:

```bash
git tag v0.2.0
git push origin v0.2.0
```

This triggers the release workflow which:
1. Updates versions across packages
2. Publishes `radar-devtools` to npm
3. Creates a GitHub Release with auto-generated changelog
4. Builds the macOS Electron app (signed + notarized) and uploads to the release
5. Commits the version bump back to `main`

---

## Forking This Project

If you fork Radar and want to publish your own builds, you'll need to set up your own infrastructure. The release pipeline is tightly coupled to the original maintainer's accounts.

### What you need to provide

1. **Your own Apple Developer account** — for code-signing and notarizing macOS builds. Without this, you can still build unsigned `.dmg` files locally, but auto-update won't work and macOS will warn users about an unidentified developer.
2. **Your own `radar-releases` repo** — create an empty public repo under your GitHub account (any name works; update `apps/app/package.json` `build.publish.owner` and `build.publish.repo` to match).
3. **Your own npm account** — if you want to publish a fork of `radar-devtools` to npm, you'll need to publish under a different package name (since `radar-devtools` is taken). Update `packages/devtools/package.json` `name` field.

### Setup steps for forks

Repeat sections 1–6 above with your own accounts:

- **npm Trusted Publishing**: configure for `<your-username>/<your-fork-name>`
- **Apple Code Signing**: use your own `.p12` certificate
- **Apple Notarization**: use your own Apple ID and Team ID
- **Public Releases Repository**: create your own
- **Branch Protection** and **Repository Permissions**: configure on your fork

### Skipping the release pipeline

If you only want to develop locally without publishing, you can ignore all of the above. Run:

```bash
bun install
bun run dev:app
```

Local development doesn't require any of the release secrets.
