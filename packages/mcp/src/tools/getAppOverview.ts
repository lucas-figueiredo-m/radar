import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpContext } from '../types';
import { fenceUntrusted } from './fenceUntrusted';
import { UNTRUSTED_DATA_WARNING } from './untrustedDataWarning';

export const registerGetAppOverview = (
  server: McpServer,
  ctx: McpContext,
): void => {
  server.tool(
    'get_app_overview',
    'Get a summary of the connected React Native app state: devices, data counts per type, latest performance metrics. Use this as an entry point to understand what data is available. Without deviceId, returns info for all connected devices.',
    {
      deviceId: z
        .string()
        .optional()
        .describe(
          'Device ID to get overview for. Omit to get overview for all connected devices.',
        ),
    },
    async ({ deviceId }) => {
      const { db, wsHandle } = ctx;
      const connectedIds = wsHandle.getConnectedDeviceIds();

      const devices = connectedIds.map(id => {
        const device = wsHandle.getDevice(id);
        return {
          deviceId: id,
          deviceName: fenceUntrusted(
            device?.deviceName ?? 'Unknown',
            `device[${id}].deviceName`,
          ),
          platform: device?.platform ?? 'unknown',
          osVersion: device?.osVersion ?? 'unknown',
          projectRoot:
            device?.projectRoot != null
              ? fenceUntrusted(device.projectRoot, `device[${id}].projectRoot`)
              : null,
        };
      });

      const overview: Record<string, unknown> = {
        connectedDevices: devices,
        deviceCount: devices.length,
      };

      const targetIds = deviceId ? [deviceId] : connectedIds;

      if (targetIds.length > 0) {
        const perDevice = targetIds.map(id => {
          const consoleCounts = {
            total: db.console.count({ device_id: id }),
            error: db.console.count({ device_id: id, level: 'error' }),
            warn: db.console.count({ device_id: id, level: 'warn' }),
            log: db.console.count({ device_id: id, level: 'log' }),
            debug: db.console.count({ device_id: id, level: 'debug' }),
          };

          const networkCount = db.network.count({ device_id: id });
          const performanceCount = db.performance.count({ device_id: id });

          const latestMetrics = db.performance.query({
            device_id: id,
            limit: 1,
            offset: 0,
          });

          const stateCapabilities = db.state.getCapabilities(id);
          const storageCapabilities = db.storage.getCapabilities(id);
          const startupMetrics = db.startup.get(id);

          const deviceData: Record<string, unknown> = {
            deviceId: id,
            dataCounts: {
              consoleLogs: consoleCounts,
              networkRequests: networkCount,
              performanceSamples: performanceCount,
              stateStores: stateCapabilities.map(c => ({
                name: fenceUntrusted(
                  c.store_name,
                  `device[${id}].state.store.name`,
                ),
                type: c.store_type,
              })),
              storageBackends: storageCapabilities.map(c => ({
                backend: c.backend,
                available: c.available === 1,
                instanceId:
                  c.instance_id != null
                    ? fenceUntrusted(
                        c.instance_id,
                        `device[${id}].storage.${c.backend}.instanceId`,
                      )
                    : null,
              })),
            },
          };

          if (latestMetrics.length > 0) {
            const m = latestMetrics[latestMetrics.length - 1];
            deviceData.latestPerformance = {
              jsFps: m.js_fps,
              uiFps: m.ui_fps,
              jsHeapMB: m.js_heap
                ? +(m.js_heap / 1024 / 1024).toFixed(2)
                : null,
              nativeRamMB: m.native_ram
                ? +(m.native_ram / 1024 / 1024).toFixed(2)
                : null,
              cpuUsage: m.cpu_usage,
              droppedFrames: m.dropped_frames,
              gcEvents: m.gc_events,
            };
          }

          if (startupMetrics) {
            deviceData.startupMetrics = {
              jsBundleEvalMs: startupMetrics.js_bundle_eval,
              nativeLaunchMs: startupMetrics.native_launch,
              ttiMs: startupMetrics.tti,
            };
          }

          return deviceData;
        });

        overview.devices = perDevice;
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: `${UNTRUSTED_DATA_WARNING}\n${JSON.stringify(
              overview,
              null,
              2,
            )}`,
          },
        ],
      };
    },
  );
};
