import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpContext } from '../types';
import { resolveDeviceId } from '../types';

export const registerStopProfiling = (
  server: McpServer,
  ctx: McpContext,
): void => {
  server.tool(
    'stop_profiling',
    'Stop the current React profiling session. Use get_profiler_data to retrieve the recorded render data.',
    {
      deviceId: z
        .string()
        .optional()
        .describe('Device ID (auto-resolved if only one device connected)'),
    },
    async ({ deviceId }) => {
      const resolvedId = resolveDeviceId(ctx.wsHandle, deviceId);
      ctx.wsHandle.sendToDevice(
        resolvedId,
        JSON.stringify({ type: 'stopProfiling' }),
      );
      return {
        content: [
          {
            type: 'text' as const,
            text: 'Profiling stopped. Use get_profiler_data to retrieve results.',
          },
        ],
      };
    },
  );
};
