import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpContext } from '../types';
import { resolveDeviceId } from '../types';

export const registerReloadAndProfile = (
  server: McpServer,
  ctx: McpContext,
): void => {
  server.tool(
    'reload_and_profile',
    'Reload the React Native app and immediately start profiling from app launch. Useful for measuring startup render performance.',
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
        JSON.stringify({ type: 'reloadAndProfile' }),
      );
      return {
        content: [
          {
            type: 'text' as const,
            text: 'App reloading with profiling enabled. Use get_profiler_data after reload completes.',
          },
        ],
      };
    },
  );
};
