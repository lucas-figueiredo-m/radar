import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpContext } from '../types';

export const registerGetPerformanceMetrics = (
  server: McpServer,
  ctx: McpContext,
): void => {
  server.tool(
    'get_performance_metrics',
    'Query performance metrics time-series data: JS FPS, UI FPS, JS heap, native RAM, CPU usage, dropped frames, and GC events. Supports time range filtering. Without deviceId, returns metrics from all devices.',
    {
      fromTimestamp: z
        .number()
        .optional()
        .describe('Start of time range (unix ms)'),
      toTimestamp: z
        .number()
        .optional()
        .describe('End of time range (unix ms)'),
      limit: z
        .number()
        .optional()
        .default(100)
        .describe('Max results (default 100)'),
      offset: z
        .number()
        .optional()
        .default(0)
        .describe('Offset for pagination'),
      deviceId: z
        .string()
        .optional()
        .describe(
          'Device ID to filter by. Omit to get metrics from all devices.',
        ),
    },
    async ({ fromTimestamp, toTimestamp, limit, offset, deviceId }) => {
      const metrics = ctx.db.performance.query({
        device_id: deviceId,
        from_timestamp: fromTimestamp,
        to_timestamp: toTimestamp,
        limit,
        offset,
      });
      const total = ctx.db.performance.count({
        device_id: deviceId,
        from_timestamp: fromTimestamp,
        to_timestamp: toTimestamp,
      });

      const parsed = metrics.map(m => ({
        deviceId: m.device_id,
        jsFps: m.js_fps,
        uiFps: m.ui_fps,
        jsHeapMB: m.js_heap ? +(m.js_heap / 1024 / 1024).toFixed(2) : null,
        nativeRamMB: m.native_ram
          ? +(m.native_ram / 1024 / 1024).toFixed(2)
          : null,
        cpuUsage: m.cpu_usage,
        droppedFrames: m.dropped_frames,
        gcEvents: m.gc_events,
        timestamp: m.timestamp,
      }));

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({ total, metrics: parsed }, null, 2),
          },
        ],
      };
    },
  );
};
