import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpContext } from '../types';

export const registerGetStateActions = (
  server: McpServer,
  ctx: McpContext,
): void => {
  server.tool(
    'get_state_actions',
    'Get the action history for a state management store. Shows dispatched actions with their type, payload, and resulting state. Without storeName, returns actions from all stores. Use sliceName to filter by Redux slice (e.g. "counter" matches "counter/increment"). Without deviceId, returns actions from all devices.',
    {
      storeName: z
        .string()
        .optional()
        .describe('Store name to get actions for. Omit to get actions from all stores.'),
      sliceName: z
        .string()
        .optional()
        .describe('Redux slice name to filter by (e.g. "todos" matches actions like "todos/addTodo"). Omit to get actions from all slices.'),
      deviceId: z
        .string()
        .optional()
        .describe('Device ID to filter by. Omit to get actions from all devices.'),
    },
    async ({ storeName, sliceName, deviceId }) => {
      const actions = ctx.db.state.getActions(storeName, deviceId);

      const filtered = sliceName
        ? actions.filter((a) => a.action_type.startsWith(`${sliceName}/`))
        : actions;

      const parsed = filtered.map((a) => ({
        id: a.id,
        deviceId: a.device_id,
        storeName: a.store_name,
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
              {
                storeName: storeName ?? 'all',
                sliceName: sliceName ?? 'all',
                actionCount: parsed.length,
                actions: parsed,
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
