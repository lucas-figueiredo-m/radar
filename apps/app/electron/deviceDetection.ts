import { execSync } from 'node:child_process';
import type { BrowserWindow } from 'electron';
import type {
  DetectedDevice,
  CliToolStatus,
  DevicePlatform,
} from '@radar/types';

const POLL_INTERVAL_MS = 2000;
const EXEC_TIMEOUT_MS = 5000;

type SimctlDevice = {
  udid: string;
  name: string;
  state: string;
};

type SimctlOutput = {
  devices: Record<string, SimctlDevice[]>;
};

const checkXcrun = (): CliToolStatus => {
  try {
    execSync('xcrun simctl list --json', {
      encoding: 'utf-8',
      timeout: EXEC_TIMEOUT_MS,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { tool: 'xcrun', available: true, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[radar] xcrun check failed:', message);
    return { tool: 'xcrun', available: false, error: message };
  }
};

const checkAdb = (): CliToolStatus => {
  try {
    execSync('adb version', {
      encoding: 'utf-8',
      timeout: EXEC_TIMEOUT_MS,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { tool: 'adb', available: true, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[radar] adb check failed:', message);
    return { tool: 'adb', available: false, error: message };
  }
};

const checkCliTools = (): CliToolStatus[] => [checkXcrun(), checkAdb()];

const parseOsVersionFromRuntime = (runtimeKey: string): string => {
  const match = runtimeKey.match(/iOS-(\d+(?:-\d+)*)/);
  if (!match) return '';
  return match[1].replace(/-/g, '.');
};

const detectIosSimulators = (): DetectedDevice[] => {
  try {
    const output = execSync('xcrun simctl list devices booted --json', {
      encoding: 'utf-8',
      timeout: EXEC_TIMEOUT_MS,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const parsed = JSON.parse(output) as SimctlOutput;
    const devices: DetectedDevice[] = [];
    const platform: DevicePlatform = 'ios';

    for (const [runtimeKey, runtimeDevices] of Object.entries(parsed.devices)) {
      const osVersion = parseOsVersionFromRuntime(runtimeKey);

      for (const device of runtimeDevices) {
        if (device.state === 'Booted') {
          devices.push({
            id: device.udid,
            name: device.name,
            platform,
            osVersion,
          });
        }
      }
    }

    return devices;
  } catch (err) {
    console.error(
      '[radar] iOS simulator detection failed:',
      err instanceof Error ? err.message : String(err),
    );
    return [];
  }
};

const detectAndroidEmulators = (): DetectedDevice[] => {
  try {
    const output = execSync('adb devices -l', {
      encoding: 'utf-8',
      timeout: EXEC_TIMEOUT_MS,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const lines = output.split('\n');
    const devices: DetectedDevice[] = [];
    const platform: DevicePlatform = 'android';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('List of devices attached')) continue;
      if (!trimmed.includes('device')) continue;

      const parts = trimmed.split(/\s+/);
      const serial = parts[0];

      if (!serial || parts[1] !== 'device') continue;

      const modelMatch = trimmed.match(/model:(\S+)/);
      const name = modelMatch ? modelMatch[1].replace(/_/g, ' ') : serial;

      devices.push({
        id: serial,
        name,
        platform,
        osVersion: '',
      });
    }

    return devices;
  } catch (err) {
    console.error(
      '[radar] Android emulator detection failed:',
      err instanceof Error ? err.message : String(err),
    );
    return [];
  }
};

const detectAllDevices = (cliStatuses: CliToolStatus[]): DetectedDevice[] => {
  const devices: DetectedDevice[] = [];

  const xcrunAvailable = cliStatuses.find(s => s.tool === 'xcrun')?.available;
  const adbAvailable = cliStatuses.find(s => s.tool === 'adb')?.available;

  if (xcrunAvailable) {
    devices.push(...detectIosSimulators());
  }

  if (adbAvailable) {
    devices.push(...detectAndroidEmulators());
  }

  return devices;
};

type DeviceDetectionHandle = {
  cleanup: () => void;
  getDetectedDevices: () => DetectedDevice[];
};

export const startDeviceDetection = (
  win: BrowserWindow,
  onPoll?: () => void,
): DeviceDetectionHandle => {
  const cliStatuses = checkCliTools();
  win.webContents.send('radar:cli-status', cliStatuses);

  let currentDevices: DetectedDevice[] = [];

  const pollDevices = () => {
    const devices = detectAllDevices(cliStatuses);
    currentDevices = devices;
    win.webContents.send('radar:detected-devices', devices);
    onPoll?.();
  };

  pollDevices();

  const intervalId = setInterval(pollDevices, POLL_INTERVAL_MS);

  return {
    cleanup: () => {
      clearInterval(intervalId);
    },
    getDetectedDevices: () => currentDevices,
  };
};
