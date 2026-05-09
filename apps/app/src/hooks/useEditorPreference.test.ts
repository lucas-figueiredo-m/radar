import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useEditorPreference } from './useEditorPreference';
import { ipcRenderer } from '../services';

vi.mock('../services', () => ({
  ipcRenderer: {
    on: vi.fn(),
    removeListener: vi.fn(),
    invoke: vi.fn(),
  },
  sendCommand: vi.fn(),
}));

const mockedIpc = ipcRenderer as unknown as {
  on: ReturnType<typeof vi.fn>;
  removeListener: ReturnType<typeof vi.fn>;
  invoke: ReturnType<typeof vi.fn>;
};

const EDITORS = [
  { id: 'vscode', name: 'VS Code', cli: 'code' },
  { id: 'cursor', name: 'Cursor', cli: 'cursor' },
];

describe('useEditorPreference', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('populates editors and preferredEditor on mount', async () => {
    mockedIpc.invoke.mockResolvedValueOnce({
      editors: EDITORS,
      preferred: 'vscode',
    });

    const { result } = renderHook(() => useEditorPreference());

    expect(mockedIpc.invoke).toHaveBeenCalledWith('radar:get-editor-info');

    await waitFor(() => {
      expect(result.current.editors).toEqual(EDITORS);
      expect(result.current.preferredEditor).toBe('vscode');
    });
  });

  it('setPreferredEditor invokes IPC and updates state', async () => {
    mockedIpc.invoke
      .mockResolvedValueOnce({
        editors: EDITORS,
        preferred: 'vscode',
      })
      .mockResolvedValueOnce({
        editors: EDITORS,
        preferred: 'cursor',
      });

    const { result } = renderHook(() => useEditorPreference());

    await waitFor(() => {
      expect(result.current.preferredEditor).toBe('vscode');
    });

    act(() => {
      result.current.setPreferredEditor('cursor');
    });

    expect(mockedIpc.invoke).toHaveBeenCalledWith(
      'radar:set-editor-preference',
      'cursor',
    );

    await waitFor(() => {
      expect(result.current.preferredEditor).toBe('cursor');
    });
  });

  it('returns defaults when invoke never resolves', () => {
    // Simulate a pending promise that never settles
    mockedIpc.invoke.mockReturnValueOnce(new Promise(() => {}));

    const { result } = renderHook(() => useEditorPreference());

    expect(result.current.editors).toEqual([]);
    expect(result.current.preferredEditor).toBeNull();
  });
});
