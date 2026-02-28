import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockExecSync,
  mockSpawn,
  mockReadFileSync,
  mockWriteFileSync,
  mockMkdirSync,
} = vi.hoisted(() => ({
  mockExecSync: vi.fn(),
  mockSpawn: vi.fn(() => ({ unref: vi.fn() })),
  mockReadFileSync: vi.fn(),
  mockWriteFileSync: vi.fn(),
  mockMkdirSync: vi.fn(),
}));

vi.mock('node:child_process', () => ({
  default: { execSync: mockExecSync, spawn: mockSpawn },
  execSync: mockExecSync,
  spawn: mockSpawn,
}));

vi.mock('node:fs', () => ({
  default: {
    readFileSync: mockReadFileSync,
    writeFileSync: mockWriteFileSync,
    mkdirSync: mockMkdirSync,
  },
  readFileSync: mockReadFileSync,
  writeFileSync: mockWriteFileSync,
  mkdirSync: mockMkdirSync,
}));

vi.mock('electron', () => ({
  app: { getPath: vi.fn(() => '/mock/user-data') },
}));

import {
  detectEditors,
  getPreferredEditor,
  setPreferredEditor,
  openInEditor,
} from './editors';

describe('editors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('detectEditors', () => {
    it('returns only editors whose CLI is available', () => {
      mockExecSync.mockImplementation((cmd: string) => {
        if (cmd === 'which code' || cmd === 'which vim') return '';
        throw new Error('not found');
      });

      const editors = detectEditors();
      const ids = editors.map(e => e.id);

      expect(ids).toContain('vscode');
      expect(ids).toContain('vim');
      expect(ids).not.toContain('webstorm');
      expect(ids).not.toContain('cursor');
    });

    it('returns empty array when no editors are available', () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('not found');
      });

      const editors = detectEditors();
      expect(editors).toEqual([]);
    });

    it('returns editor info with id, name, and cli', () => {
      mockExecSync.mockImplementation((cmd: string) => {
        if (cmd === 'which code') return '/usr/local/bin/code';
        throw new Error('not found');
      });

      const editors = detectEditors();
      expect(editors).toHaveLength(1);
      expect(editors[0]).toEqual({
        id: 'vscode',
        name: 'VS Code',
        cli: 'code',
      });
    });
  });

  describe('getPreferredEditor', () => {
    it('reads and parses JSON file returning editorId', () => {
      mockReadFileSync.mockReturnValue(JSON.stringify({ editorId: 'vscode' }));

      const result = getPreferredEditor();
      expect(result).toBe('vscode');
    });

    it('returns null on missing file', () => {
      mockReadFileSync.mockImplementation(() => {
        throw new Error('ENOENT');
      });

      const result = getPreferredEditor();
      expect(result).toBeNull();
    });

    it('returns null on corrupt JSON', () => {
      mockReadFileSync.mockReturnValue('not-json');

      const result = getPreferredEditor();
      expect(result).toBeNull();
    });
  });

  describe('setPreferredEditor', () => {
    it('writes JSON to correct path and creates directory', () => {
      setPreferredEditor('vscode');

      expect(mockMkdirSync).toHaveBeenCalledWith('/mock/user-data', {
        recursive: true,
      });
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        '/mock/user-data/editor-preference.json',
        JSON.stringify({ editorId: 'vscode' }),
        'utf-8',
      );
    });
  });

  describe('openInEditor', () => {
    it('spawns vscode with --goto flag', () => {
      openInEditor('vscode', '/path/file.ts', 10);

      expect(mockSpawn).toHaveBeenCalledWith(
        'code',
        ['--goto', '/path/file.ts:10'],
        { detached: true, stdio: 'ignore' },
      );
    });

    it('spawns webstorm with --line flag', () => {
      openInEditor('webstorm', '/path/file.ts', 5);

      expect(mockSpawn).toHaveBeenCalledWith(
        'webstorm',
        ['--line', '5', '/path/file.ts'],
        { detached: true, stdio: 'ignore' },
      );
    });

    it('spawns vim with +line format', () => {
      openInEditor('vim', '/path/file.ts', 3);

      expect(mockSpawn).toHaveBeenCalledWith('vim', ['+3', '/path/file.ts'], {
        detached: true,
        stdio: 'ignore',
      });
    });

    it('spawns zed with file:line format', () => {
      openInEditor('zed', '/path/file.ts', 7);

      expect(mockSpawn).toHaveBeenCalledWith('zed', ['/path/file.ts:7'], {
        detached: true,
        stdio: 'ignore',
      });
    });

    it('does nothing for unknown editor', () => {
      openInEditor('unknown-editor', '/path/file.ts', 1);

      expect(mockSpawn).not.toHaveBeenCalled();
    });

    it('defaults to line 1 when line is not provided', () => {
      openInEditor('vscode', '/path/file.ts');

      expect(mockSpawn).toHaveBeenCalledWith(
        'code',
        ['--goto', '/path/file.ts:1'],
        { detached: true, stdio: 'ignore' },
      );
    });
  });
});
