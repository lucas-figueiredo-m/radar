import { execSync, spawn } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { app } from 'electron';

export type EditorInfo = {
  id: string;
  name: string;
  cli: string;
};

type EditorDefinition = EditorInfo & {
  openCommand: (cli: string, file: string, line: number) => string[];
};

const EDITORS: EditorDefinition[] = [
  {
    id: 'vscode',
    name: 'VS Code',
    cli: 'code',
    openCommand: (cli, file, line) => [cli, '--goto', `${file}:${line}`],
  },
  {
    id: 'cursor',
    name: 'Cursor',
    cli: 'cursor',
    openCommand: (cli, file, line) => [cli, '--goto', `${file}:${line}`],
  },
  {
    id: 'antigravity',
    name: 'Antigravity',
    cli: 'antigravity',
    openCommand: (cli, file, line) => [cli, '--goto', `${file}:${line}`],
  },
  {
    id: 'zed',
    name: 'Zed',
    cli: 'zed',
    openCommand: (cli, file, line) => [cli, `${file}:${line}`],
  },
  {
    id: 'sublime',
    name: 'Sublime Text',
    cli: 'subl',
    openCommand: (cli, file, line) => [cli, `${file}:${line}`],
  },
  {
    id: 'webstorm',
    name: 'WebStorm',
    cli: 'webstorm',
    openCommand: (cli, file, line) => [cli, '--line', String(line), file],
  },
  {
    id: 'nova',
    name: 'Nova',
    cli: 'nova',
    openCommand: (cli, file, line) => [cli, `${file}:${line}`],
  },
  {
    id: 'neovim',
    name: 'Neovim',
    cli: 'nvim',
    openCommand: (cli, file, line) => [cli, `+${line}`, file],
  },
  {
    id: 'vim',
    name: 'Vim',
    cli: 'vim',
    openCommand: (cli, file, line) => [cli, `+${line}`, file],
  },
  {
    id: 'emacs',
    name: 'Emacs',
    cli: 'emacs',
    openCommand: (cli, file, line) => [cli, `+${line}`, file],
  },
];

const getPreferencePath = (): string =>
  path.join(app.getPath('userData'), 'editor-preference.json');

const isCliAvailable = (cli: string): boolean => {
  try {
    execSync(`which ${cli}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
};

export const detectEditors = (): EditorInfo[] =>
  EDITORS.filter(editor => isCliAvailable(editor.cli)).map(
    ({ id, name, cli }) => ({
      id,
      name,
      cli,
    }),
  );

export const getPreferredEditor = (): string | null => {
  try {
    const data = JSON.parse(readFileSync(getPreferencePath(), 'utf-8')) as {
      editorId: string;
    };
    return data.editorId;
  } catch {
    return null;
  }
};

export const setPreferredEditor = (editorId: string): void => {
  const dir = path.dirname(getPreferencePath());
  mkdirSync(dir, { recursive: true });
  writeFileSync(getPreferencePath(), JSON.stringify({ editorId }), 'utf-8');
};

export const openInEditor = (
  editorId: string,
  absolutePath: string,
  line: number = 1,
): void => {
  const editor = EDITORS.find(e => e.id === editorId);
  if (!editor) return;

  const [command, ...args] = editor.openCommand(editor.cli, absolutePath, line);
  spawn(command, args, { detached: true, stdio: 'ignore' }).unref();
};
