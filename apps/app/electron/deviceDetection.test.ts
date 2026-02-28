import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { BrowserWindow } from 'electron';

const { mockExecSync } = vi.hoisted(() => ({
  mockExecSync: vi.fn(),
}));

vi.mock('node:child_process', () => ({
  default: { execSync: mockExecSync },
  execSync: mockExecSync,
}));

vi.mock('electron', () => ({
  default: {},
}));

import { startDeviceDetection } from './deviceDetection';

const createMockWin = (): BrowserWindow =>
  ({ webContents: { send: vi.fn() } } as unknown as BrowserWindow);

const SIMCTL_BOOTED_JSON = JSON.stringify({
  devices: {
    'com.apple.CoreSimulator.SimRuntime.iOS-17-4': [
      { udid: 'ABC-123', name: 'iPhone 15', state: 'Booted' },
      { udid: 'DEF-456', name: 'iPhone 14', state: 'Shutdown' },
    ],
    'com.apple.CoreSimulator.SimRuntime.iOS-18-0-1': [
      { udid: 'GHI-789', name: 'iPhone 16', state: 'Booted' },
    ],
  },
});

const ADB_DEVICES_OUTPUT = `List of devices attached
emulator-5554          device product:sdk_gphone model:Pixel_6 transport_id:1
emulator-5556          device product:sdk_gphone transport_id:2
`;

describe('startDeviceDetection', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const setupExecSync = ({
    xcrunCheckOk = true,
    adbCheckOk = true,
    simctlJson = SIMCTL_BOOTED_JSON,
    adbOutput = ADB_DEVICES_OUTPUT,
  }: {
    xcrunCheckOk?: boolean;
    adbCheckOk?: boolean;
    simctlJson?: string;
    adbOutput?: string;
  } = {}) => {
    mockExecSync.mockImplementation((command: string) => {
      const cmd = String(command);

      if (cmd === 'xcrun simctl list --json') {
        if (!xcrunCheckOk) throw new Error('xcrun not found');
        return '';
      }

      if (cmd === 'adb version') {
        if (!adbCheckOk) throw new Error('adb not found');
        return '';
      }

      if (cmd === 'xcrun simctl list devices booted --json') {
        return simctlJson;
      }

      if (cmd === 'adb devices -l') {
        return adbOutput;
      }

      return '';
    });
  };

  it('sends cli-status with both tools available', () => {
    setupExecSync();
    const win = createMockWin();

    startDeviceDetection(win);

    expect(win.webContents.send).toHaveBeenCalledWith('radar:cli-status', [
      { tool: 'xcrun', available: true, error: null },
      { tool: 'adb', available: true, error: null },
    ]);
  });

  it('marks xcrun unavailable when check throws', () => {
    setupExecSync({ xcrunCheckOk: false });
    const win = createMockWin();

    startDeviceDetection(win);

    const cliStatus = (win.webContents.send as ReturnType<typeof vi.fn>).mock
      .calls[0];
    expect(cliStatus[0]).toBe('radar:cli-status');
    expect(cliStatus[1]).toEqual(
      expect.arrayContaining([
        { tool: 'xcrun', available: false, error: 'xcrun not found' },
      ]),
    );
  });

  it('marks adb unavailable when check throws', () => {
    setupExecSync({ adbCheckOk: false });
    const win = createMockWin();

    startDeviceDetection(win);

    const cliStatus = (win.webContents.send as ReturnType<typeof vi.fn>).mock
      .calls[0];
    expect(cliStatus[1]).toEqual(
      expect.arrayContaining([
        { tool: 'adb', available: false, error: 'adb not found' },
      ]),
    );
  });

  it('parses booted iOS simulators with correct OS versions', () => {
    setupExecSync();
    const win = createMockWin();

    startDeviceDetection(win);

    const deviceCall = (win.webContents.send as ReturnType<typeof vi.fn>).mock
      .calls[1];
    expect(deviceCall[0]).toBe('radar:detected-devices');

    const devices = deviceCall[1];
    const iosDevices = devices.filter(
      (d: { platform: string }) => d.platform === 'ios',
    );

    expect(iosDevices).toEqual([
      { id: 'ABC-123', name: 'iPhone 15', platform: 'ios', osVersion: '17.4' },
      {
        id: 'GHI-789',
        name: 'iPhone 16',
        platform: 'ios',
        osVersion: '18.0.1',
      },
    ]);
  });

  it('filters out non-booted iOS simulators', () => {
    setupExecSync();
    const win = createMockWin();

    startDeviceDetection(win);

    const devices = (win.webContents.send as ReturnType<typeof vi.fn>).mock
      .calls[1][1];
    const iosIds = devices
      .filter((d: { platform: string }) => d.platform === 'ios')
      .map((d: { id: string }) => d.id);

    expect(iosIds).not.toContain('DEF-456');
  });

  it('parses Android devices from adb output', () => {
    setupExecSync();
    const win = createMockWin();

    startDeviceDetection(win);

    const devices = (win.webContents.send as ReturnType<typeof vi.fn>).mock
      .calls[1][1];
    const androidDevices = devices.filter(
      (d: { platform: string }) => d.platform === 'android',
    );

    expect(androidDevices).toEqual([
      {
        id: 'emulator-5554',
        name: 'Pixel 6',
        platform: 'android',
        osVersion: '',
      },
      {
        id: 'emulator-5556',
        name: 'emulator-5556',
        platform: 'android',
        osVersion: '',
      },
    ]);
  });

  it('falls back to serial as name when model is missing in adb output', () => {
    setupExecSync({
      adbOutput: `List of devices attached
emulator-5554          device transport_id:1
`,
    });
    const win = createMockWin();

    startDeviceDetection(win);

    const devices = (win.webContents.send as ReturnType<typeof vi.fn>).mock
      .calls[1][1];
    const androidDevices = devices.filter(
      (d: { platform: string }) => d.platform === 'android',
    );

    expect(androidDevices[0].name).toBe('emulator-5554');
  });

  it('skips iOS detection when xcrun is unavailable', () => {
    setupExecSync({ xcrunCheckOk: false });
    const win = createMockWin();

    startDeviceDetection(win);

    const devices = (win.webContents.send as ReturnType<typeof vi.fn>).mock
      .calls[1][1];
    const iosDevices = devices.filter(
      (d: { platform: string }) => d.platform === 'ios',
    );

    expect(iosDevices).toHaveLength(0);
  });

  it('skips Android detection when adb is unavailable', () => {
    setupExecSync({ adbCheckOk: false });
    const win = createMockWin();

    startDeviceDetection(win);

    const devices = (win.webContents.send as ReturnType<typeof vi.fn>).mock
      .calls[1][1];
    const androidDevices = devices.filter(
      (d: { platform: string }) => d.platform === 'android',
    );

    expect(androidDevices).toHaveLength(0);
  });

  it('only sends detected-devices when devices change', () => {
    setupExecSync();
    const win = createMockWin();

    startDeviceDetection(win);

    const sendMock = win.webContents.send as ReturnType<typeof vi.fn>;
    const initialCallCount = sendMock.mock.calls.filter(
      (c: string[]) => c[0] === 'radar:detected-devices',
    ).length;

    expect(initialCallCount).toBe(1);

    vi.advanceTimersByTime(2000);

    const afterPollCount = sendMock.mock.calls.filter(
      (c: string[]) => c[0] === 'radar:detected-devices',
    ).length;

    expect(afterPollCount).toBe(1);
  });

  it('sends detected-devices again when devices change on poll', () => {
    let pollCount = 0;
    mockExecSync.mockImplementation((command: string) => {
      const cmd = String(command);

      if (cmd === 'xcrun simctl list --json') return '';
      if (cmd === 'adb version') return '';

      if (cmd === 'xcrun simctl list devices booted --json') {
        pollCount++;
        if (pollCount <= 1) {
          return JSON.stringify({
            devices: {
              'com.apple.CoreSimulator.SimRuntime.iOS-17-4': [
                { udid: 'ABC-123', name: 'iPhone 15', state: 'Booted' },
              ],
            },
          });
        }
        return JSON.stringify({
          devices: {
            'com.apple.CoreSimulator.SimRuntime.iOS-17-4': [
              { udid: 'ABC-123', name: 'iPhone 15', state: 'Booted' },
              { udid: 'NEW-111', name: 'iPhone 16', state: 'Booted' },
            ],
          },
        });
      }

      if (cmd === 'adb devices -l') return 'List of devices attached\n';

      return '';
    });

    const win = createMockWin();
    startDeviceDetection(win);

    const sendMock = win.webContents.send as ReturnType<typeof vi.fn>;

    vi.advanceTimersByTime(2000);

    const deviceCalls = sendMock.mock.calls.filter(
      (c: string[]) => c[0] === 'radar:detected-devices',
    );
    expect(deviceCalls).toHaveLength(2);
  });

  it('returns a cleanup function that clears the interval', () => {
    setupExecSync();
    const win = createMockWin();

    const cleanup = startDeviceDetection(win);
    const sendMock = win.webContents.send as ReturnType<typeof vi.fn>;

    cleanup();

    const callCountBefore = sendMock.mock.calls.length;
    vi.advanceTimersByTime(10000);
    const callCountAfter = sendMock.mock.calls.length;

    expect(callCountAfter).toBe(callCountBefore);
  });

  it('handles invalid JSON from simctl gracefully', () => {
    setupExecSync({ simctlJson: 'not-json' });
    const win = createMockWin();

    expect(() => startDeviceDetection(win)).not.toThrow();

    const devices = (win.webContents.send as ReturnType<typeof vi.fn>).mock
      .calls[1][1];
    const iosDevices = devices.filter(
      (d: { platform: string }) => d.platform === 'ios',
    );

    expect(iosDevices).toHaveLength(0);
  });
});
