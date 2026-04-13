import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpContext } from '../types';

export const registerGetStartupMetrics = (
  server: McpServer,
  ctx: McpContext,
): void => {
  server.tool(
    'get_startup_metrics',
    'Get app startup timing data: JS bundle evaluation time, native launch time, and time to interactive (TTI). Without deviceId, returns startup data from all devices.',
    {
      deviceId: z
        .string()
        .optional()
        .describe('Device ID to filter by. Omit to get startup metrics from all devices.'),
    },
    async ({ deviceId }) => {
      if (deviceId) {
        const metrics = ctx.db.startup.get(deviceId);
        if (!metrics) {
          return {
            content: [
              {
                type: 'text' as const,
                text: 'No startup metrics available for this device.',
              },
            ],
          };
        }
        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify(
                {
                  deviceId: metrics.device_id,
                  jsBundleEvalMs: metrics.js_bundle_eval,
                  nativeLaunchMs: metrics.native_launch,
                  ttiMs: metrics.tti,
                  timestamp: metrics.timestamp,
                },
                null,
                2,
              ),
            },
          ],
        };
      }

      const allMetrics = ctx.db.startup.getAll();
      if (allMetrics.length === 0) {
        return {
          content: [
            {
              type: 'text' as const,
              text: 'No startup metrics available.',
            },
          ],
        };
      }

      const parsed = allMetrics.map((m) => ({
        deviceId: m.device_id,
        jsBundleEvalMs: m.js_bundle_eval,
        nativeLaunchMs: m.native_launch,
        ttiMs: m.tti,
        timestamp: m.timestamp,
      }));

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(parsed, null, 2),
          },
        ],
      };
    },
  );
};
