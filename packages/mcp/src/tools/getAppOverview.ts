import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpContext } from '../types';

export const registerGetAppOverview = (
  server: McpServer,
  ctx: McpContext,
): void => {
  server.tool(
    'get_app_overview',
    'Get a summary of the connected React Native app state: devices, data counts per type, latest performance metrics. Use this as an entry point to understand what data is available.',
    {},
    async () => {
      const { db, wsHandle } = ctx;
      const deviceIds = wsHandle.getConnectedDeviceIds();

      const devices = deviceIds.map((id) => {
        const device = wsHandle.getDevice(id);
        return {
          deviceId: id,
          deviceName: device?.deviceName ?? 'Unknown',
          platform: device?.platform ?? 'unknown',
          osVersion: device?.osVersion ?? 'unknown',
          projectRoot: device?.projectRoot ?? null,
        };
      });

      const overview: Record<string, unknown> = {
        connectedDevices: devices,
        deviceCount: devices.length,
      };

      if (deviceIds.length > 0) {
        const deviceId = deviceIds[0];

        const consoleCounts = {
          total: db.console.count({ device_id: deviceId }),
          error: db.console.count({ device_id: deviceId, level: 'error' }),
          warn: db.console.count({ device_id: deviceId, level: 'warn' }),
          log: db.console.count({ device_id: deviceId, level: 'log' }),
          debug: db.console.count({ device_id: deviceId, level: 'debug' }),
        };

        const networkCount = db.network.count({ device_id: deviceId });
        const performanceCount = db.performance.count({
          device_id: deviceId,
        });

        const latestMetrics = db.performance.query({
          device_id: deviceId,
          limit: 1,
          offset: 0,
        });

        const stateCapabilities = db.state.getCapabilities(deviceId);
        const storageCapabilities = db.storage.getCapabilities(deviceId);
        const startupMetrics = db.startup.get(deviceId);

        overview.dataCounts = {
          consoleLogs: consoleCounts,
          networkRequests: networkCount,
          performanceSamples: performanceCount,
          stateStores: stateCapabilities.map((c) => ({
            name: c.store_name,
            type: c.store_type,
          })),
          storageBackends: storageCapabilities.map((c) => ({
            backend: c.backend,
            available: c.available === 1,
            instanceId: c.instance_id,
          })),
        };

        if (latestMetrics.length > 0) {
          const m = latestMetrics[latestMetrics.length - 1];
          overview.latestPerformance = {
            jsFps: m.js_fps,
            uiFps: m.ui_fps,
            jsHeapMB: m.js_heap ? +(m.js_heap / 1024 / 1024).toFixed(2) : null,
            nativeRamMB: m.native_ram
              ? +(m.native_ram / 1024 / 1024).toFixed(2)
              : null,
            cpuUsage: m.cpu_usage,
            droppedFrames: m.dropped_frames,
            gcEvents: m.gc_events,
          };
        }

        if (startupMetrics) {
          overview.startupMetrics = {
            jsBundleEvalMs: startupMetrics.js_bundle_eval,
            nativeLaunchMs: startupMetrics.native_launch,
            ttiMs: startupMetrics.tti,
          };
        }
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(overview, null, 2),
          },
        ],
      };
    },
  );
};
