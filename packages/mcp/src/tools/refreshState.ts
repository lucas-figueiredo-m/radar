import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpContext } from '../types';
import { resolveDeviceId } from '../types';

export const registerRefreshState = (
  server: McpServer,
  ctx: McpContext,
): void => {
  server.tool(
    'refresh_state',
    'Request a fresh state snapshot from a specific store on the device. Use get_state_snapshot to retrieve the updated state afterwards.',
    {
      storeName: z.string().describe('The store name to refresh'),
      deviceId: z
        .string()
        .optional()
        .describe('Device ID (auto-resolved if only one device connected)'),
    },
    async ({ storeName, deviceId }) => {
      const resolvedId = resolveDeviceId(ctx.wsHandle, deviceId);
      ctx.wsHandle.sendToDevice(
        resolvedId,
        JSON.stringify({ type: 'stateGet', storeName }),
      );
      return {
        content: [
          {
            type: 'text' as const,
            text: `Requested fresh state snapshot for "${storeName}". Use get_state_snapshot to retrieve it.`,
          },
        ],
      };
    },
  );
};
