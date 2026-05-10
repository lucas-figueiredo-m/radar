import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { BrowserWindow } from 'electron';

const { mockExecFileSync } = vi.hoisted(() => ({
  mockExecFileSync: vi.fn(),
}));

vi.mock('node:child_process', () => ({
  default: { execFileSync: mockExecFileSync },
  execFileSync: mockExecFileSync,
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

const argsEqual = (a: string[], b: string[]): boolean =>
  a.length === b.length && a.every((v, i) => v === b[i]);

describe('startDeviceDetection', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const setupExecFileSync = ({
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
    mockExecFileSync.mockImplementation(
      (command: string, args: string[] = []) => {
        if (
          command === 'xcrun' &&
          argsEqual(args, ['simctl', 'list', '--json'])
        ) {
          if (!xcrunCheckOk) throw new Error('xcrun not found');
          return '';
        }

        if (command === 'adb' && argsEqual(args, ['version'])) {
          if (!adbCheckOk) throw new Error('adb not found');
          return '';
        }

        if (
          command === 'xcrun' &&
          argsEqual(args, ['simctl', 'list', 'devices', 'booted', '--json'])
        ) {
          return simctlJson;
        }

        if (command === 'adb' && argsEqual(args, ['devices', '-l'])) {
          return adbOutput;
        }

        if (
          command === 'adb' &&
          args[0] === '-s' &&
          args[2] === 'shell' &&
          args[3] === 'getprop' &&
          args[4] === 'ro.build.version.sdk'
        ) {
          const serial = args[1];
          if (serial === 'emulator-5554') return '34\n';
          if (serial === 'emulator-5556') return '33\n';
          return '34\n';
        }

        return '';
      },
    );
  };

  it('sends cli-status with both tools available', () => {
    setupExecFileSync();
    const win = createMockWin();

    startDeviceDetection(win);

    expect(win.webContents.send).toHaveBeenCalledWith('radar:cli-status', [
      { tool: 'xcrun', available: true, error: null },
      { tool: 'adb', available: true, error: null },
    ]);
  });

  it('marks xcrun unavailable when check throws', () => {
    setupExecFileSync({ xcrunCheckOk: false });
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
    setupExecFileSync({ adbCheckOk: false });
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
    setupExecFileSync();
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
    setupExecFileSync();
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
    setupExecFileSync();
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
        osVersion: '34',
      },
      {
        id: 'emulator-5556',
        name: 'emulator-5556',
        platform: 'android',
        osVersion: '33',
      },
    ]);
  });

  it('falls back to serial as name when model is missing in adb output', () => {
    setupExecFileSync({
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
    setupExecFileSync({ xcrunCheckOk: false });
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
    setupExecFileSync({ adbCheckOk: false });
    const win = createMockWin();

    startDeviceDetection(win);

    const devices = (win.webContents.send as ReturnType<typeof vi.fn>).mock
      .calls[1][1];
    const androidDevices = devices.filter(
      (d: { platform: string }) => d.platform === 'android',
    );

    expect(androidDevices).toHaveLength(0);
  });

  it('sends detected-devices on every poll', () => {
    setupExecFileSync();
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

    expect(afterPollCount).toBe(2);
  });

  it('returns a cleanup function that clears the interval', () => {
    setupExecFileSync();
    const win = createMockWin();

    const { cleanup } = startDeviceDetection(win);
    const sendMock = win.webContents.send as ReturnType<typeof vi.fn>;

    cleanup();

    const callCountBefore = sendMock.mock.calls.length;
    vi.advanceTimersByTime(10000);
    const callCountAfter = sendMock.mock.calls.length;

    expect(callCountAfter).toBe(callCountBefore);
  });

  it('exposes current detected devices via getDetectedDevices', () => {
    setupExecFileSync();
    const win = createMockWin();

    const { getDetectedDevices } = startDeviceDetection(win);
    const devices = getDetectedDevices();

    const iosDevices = devices.filter(d => d.platform === 'ios');
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

  it('handles invalid JSON from simctl gracefully', () => {
    setupExecFileSync({ simctlJson: 'not-json' });
    const win = createMockWin();

    expect(() => startDeviceDetection(win)).not.toThrow();

    const devices = (win.webContents.send as ReturnType<typeof vi.fn>).mock
      .calls[1][1];
    const iosDevices = devices.filter(
      (d: { platform: string }) => d.platform === 'ios',
    );

    expect(iosDevices).toHaveLength(0);
  });

  it('uses execFileSync (no shell) when probing Android os version (B8)', () => {
    setupExecFileSync();
    const win = createMockWin();

    startDeviceDetection(win);

    const adbCalls = mockExecFileSync.mock.calls.filter(
      ([command, args]) =>
        command === 'adb' &&
        Array.isArray(args) &&
        (args as string[])[0] === '-s',
    );

    expect(adbCalls.length).toBeGreaterThan(0);
    for (const call of adbCalls) {
      expect(call[0]).toBe('adb');
      expect(call[1]).toEqual([
        '-s',
        expect.any(String),
        'shell',
        'getprop',
        'ro.build.version.sdk',
      ]);
    }
  });

  it('skips Android devices whose serial fails the safe-character regex (B8)', () => {
    setupExecFileSync({
      adbOutput: `List of devices attached
1;touch/tmp/pwn          device product:evil model:Evil_Phone transport_id:1
emulator-5554          device product:sdk_gphone model:Pixel_6 transport_id:2
`,
    });
    const win = createMockWin();

    startDeviceDetection(win);

    const devices = (win.webContents.send as ReturnType<typeof vi.fn>).mock
      .calls[1][1];
    const androidIds = devices
      .filter((d: { platform: string }) => d.platform === 'android')
      .map((d: { id: string }) => d.id);

    expect(androidIds).not.toContain('1;touch/tmp/pwn');
    expect(androidIds).toContain('emulator-5554');

    const adbProbeCalls = mockExecFileSync.mock.calls.filter(
      ([command, args]) =>
        command === 'adb' &&
        Array.isArray(args) &&
        (args as string[])[0] === '-s',
    );
    for (const [, args] of adbProbeCalls) {
      expect((args as string[])[1]).toMatch(/^[A-Za-z0-9._:-]+$/);
    }
  });
});
