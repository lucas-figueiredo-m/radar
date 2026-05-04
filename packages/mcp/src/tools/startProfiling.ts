import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpContext } from '../types';
import { resolveDeviceId } from '../types';

export const registerStartProfiling = (
  server: McpServer,
  ctx: McpContext,
): void => {
  server.tool(
    'start_profiling',
    'Start recording React render profiling on the connected device. Use stop_profiling to end the session and get_profiler_data to retrieve results.',
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
        JSON.stringify({ type: 'startProfiling' }),
      );
      return {
        content: [
          { type: 'text' as const, text: 'Profiling started on device.' },
        ],
      };
    },
  );
};
