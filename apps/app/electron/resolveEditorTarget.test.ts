import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  rmSync,
  realpathSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { resolveEditorTarget } from './resolveEditorTarget';

describe('resolveEditorTarget', () => {
  let projectRoot: string;
  let realProjectRoot: string;
  let outsideDir: string;

  beforeAll(() => {
    projectRoot = mkdtempSync(path.join(tmpdir(), 'radar-root-'));
    outsideDir = mkdtempSync(path.join(tmpdir(), 'radar-outside-'));
    realProjectRoot = realpathSync(projectRoot);

    mkdirSync(path.join(projectRoot, 'src'), { recursive: true });
    writeFileSync(path.join(projectRoot, 'src', 'app.ts'), '// app');
    writeFileSync(path.join(outsideDir, 'secret.txt'), 'pwned');
  });

  afterAll(() => {
    rmSync(projectRoot, { recursive: true, force: true });
    rmSync(outsideDir, { recursive: true, force: true });
  });

  it('resolves a relative file inside the project root', () => {
    const result = resolveEditorTarget(projectRoot, 'src/app.ts', 42);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.absolutePath).toBe(
        path.join(realProjectRoot, 'src', 'app.ts'),
      );
      expect(result.line).toBe(42);
    }
  });

  it('rejects an absolute path payload', () => {
    const result = resolveEditorTarget(projectRoot, '/etc/passwd', 1);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('Invalid file path');
  });

  it('rejects a path containing a NUL byte', () => {
    const result = resolveEditorTarget(projectRoot, 'src/app.ts\0.png', 1);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('Invalid file path');
  });

  it('rejects an empty path', () => {
    const result = resolveEditorTarget(projectRoot, '', 1);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('Invalid file path');
  });

  it('rejects a relative path that escapes the root via ..', () => {
    const escapeTarget = path.relative(
      projectRoot,
      path.join(outsideDir, 'secret.txt'),
    );
    const result = resolveEditorTarget(projectRoot, escapeTarget, 1);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('Path escapes project root');
  });

  it('rejects a non-existent file', () => {
    const result = resolveEditorTarget(projectRoot, 'src/nope.ts', 1);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('File does not exist');
  });

  it('defaults line to 1 when undefined', () => {
    const result = resolveEditorTarget(projectRoot, 'src/app.ts', undefined);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.line).toBe(1);
  });

  it('defaults line to 1 when not a positive integer', () => {
    const cases = [0, -5, 1.5, Number.NaN, Number.POSITIVE_INFINITY];
    for (const line of cases) {
      const result = resolveEditorTarget(projectRoot, 'src/app.ts', line);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.line).toBe(1);
    }
  });

  it('rejects when project root itself does not exist', () => {
    const result = resolveEditorTarget(
      path.join(tmpdir(), 'radar-missing-root-xyz'),
      'src/app.ts',
      1,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe('File does not exist');
  });
});
