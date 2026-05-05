import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const PACKAGE_PATHS = [
  "apps/app/package.json",
  "packages/devtools/package.json",
];

const version = process.argv[2];

if (!version) {
  console.error("Usage: bun run scripts/sync-version.ts <version>");
  process.exit(1);
}

if (!/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(version)) {
  console.error(`Invalid version format: ${version}`);
  process.exit(1);
}

for (const relPath of PACKAGE_PATHS) {
  const absPath = resolve(relPath);
  const pkg = JSON.parse(readFileSync(absPath, "utf-8"));
  const oldVersion = pkg.version;
  pkg.version = version;
  writeFileSync(absPath, JSON.stringify(pkg, null, 2) + "\n");
  console.log(`${relPath}: ${oldVersion} → ${version}`);
}
