import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpContext } from '../types';
import { resolveDeviceId } from '../types';

export const registerGetStartupMetrics = (
  server: McpServer,
  ctx: McpContext,
): void => {
  server.tool(
    'get_startup_metrics',
    'Get app startup timing data: JS bundle evaluation time, native launch time, and time to interactive (TTI).',
    {
      deviceId: z
        .string()
        .optional()
        .describe('Device ID (auto-resolved if only one device connected)'),
    },
    async ({ deviceId }) => {
      const resolvedId = resolveDeviceId(ctx.wsHandle, deviceId);
      const metrics = ctx.db.startup.get(resolvedId);

      if (!metrics) {
        return {
          content: [
            {
              type: 'text' as const,
              text: 'No startup metrics available. The app may not have reported startup data yet.',
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
    },
  );
};
