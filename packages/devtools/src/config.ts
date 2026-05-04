export type RadarConfig = {
  host?: string;
  port?: number;
  projectRoot?: string;
  deviceId?: string;
  deviceName?: string;
  mmkvInstances?: Record<string, unknown>;
  stores?: Record<string, unknown>;
};
