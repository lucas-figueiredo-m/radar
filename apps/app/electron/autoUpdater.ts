// Auto-updates DISABLED until app signing + notarization land (audit B13).
// The unsigned .dmg/.app means a compromised RELEASES_GITHUB_TOKEN could
// silently swap every Radar user's binary. Re-enable only when the macOS
// hardenedRuntime + notarize block in package.json is wired AND APPLE_API_KEY
// env vars are set. See SECURITY_AUDIT.md → B13 option B for the requirements.
export const setupAutoUpdater = (): void => {
  return;
};
