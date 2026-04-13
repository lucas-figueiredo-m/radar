import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpContext } from '../types';
import { resolveDeviceId } from '../types';

export const registerGetStateActions = (
  server: McpServer,
  ctx: McpContext,
): void => {
  server.tool(
    'get_state_actions',
    'Get the action history for a state management store. Shows dispatched actions with their type, payload, and resulting state — useful for debugging state changes over time.',
    {
      storeName: z.string().describe('The store name to get actions for'),
      deviceId: z
        .string()
        .optional()
        .describe('Device ID (auto-resolved if only one device connected)'),
    },
    async ({ storeName, deviceId }) => {
      const resolvedId = resolveDeviceId(ctx.wsHandle, deviceId);
      const actions = ctx.db.state.getActions(resolvedId, storeName);

      const parsed = actions.map((a) => ({
        id: a.id,
        actionType: a.action_type,
        payload: JSON.parse(a.payload),
        state: JSON.parse(a.state),
        timestamp: a.timestamp,
      }));

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              { storeName, actionCount: parsed.length, actions: parsed },
              null,
              2,
            ),
          },
        ],
      };
    },
  );
};
