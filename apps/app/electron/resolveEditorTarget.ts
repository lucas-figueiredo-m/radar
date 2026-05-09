import path from 'node:path';
import { realpathSync } from 'node:fs';

export type EditorTargetResolution =
  | { ok: true; absolutePath: string; line: number }
  | { ok: false; error: string };

export const resolveEditorTarget = (
  root: string,
  file: string,
  line: number | undefined,
): EditorTargetResolution => {
  if (
    typeof file !== 'string' ||
    file.length === 0 ||
    path.isAbsolute(file) ||
    file.includes('\0')
  ) {
    return { ok: false, error: 'Invalid file path' };
  }

  let realRoot: string;
  let realTarget: string;
  try {
    realRoot = realpathSync(root);
    realTarget = realpathSync(path.resolve(realRoot, file));
  } catch {
    return { ok: false, error: 'File does not exist' };
  }

  if (realTarget !== realRoot && !realTarget.startsWith(realRoot + path.sep)) {
    return { ok: false, error: 'Path escapes project root' };
  }

  const safeLine =
    typeof line === 'number' && Number.isInteger(line) && line > 0 ? line : 1;

  return { ok: true, absolutePath: realTarget, line: safeLine };
};
