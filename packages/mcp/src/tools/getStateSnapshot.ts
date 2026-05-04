import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpContext } from '../types';

export const registerGetStateSnapshot = (
  server: McpServer,
  ctx: McpContext,
): void => {
  server.tool(
    'get_state_snapshot',
    'Get current state snapshot for a state management store (Redux, Zustand, etc.). Without storeName, returns snapshots for all stores. Use sliceName to return only a specific Redux slice from the state (e.g. "todos" returns just the todos portion). Without deviceId, returns stores from all devices.',
    {
      storeName: z
        .string()
        .optional()
        .describe(
          'Store name to get state for. Omit to get snapshots for all stores.',
        ),
      sliceName: z
        .string()
        .optional()
        .describe(
          'Redux slice name to extract from the state (e.g. "todos" returns only state.todos). Omit to get the full state.',
        ),
      deviceId: z
        .string()
        .optional()
        .describe(
          'Device ID to filter by. Omit to get stores from all devices.',
        ),
    },
    async ({ storeName, sliceName, deviceId }) => {
      const capabilities = ctx.db.state.getCapabilities(deviceId);
      const snapshots = ctx.db.state.getSnapshots(deviceId);

      const stores = capabilities.map(c => {
        const snapshot = snapshots.find(
          s => s.store_name === c.store_name && s.device_id === c.device_id,
        );

        const fullState = snapshot ? JSON.parse(snapshot.state) : null;
        const state =
          sliceName && fullState && typeof fullState === 'object'
            ? (fullState as Record<string, unknown>)[sliceName] ?? null
            : fullState;

        return {
          deviceId: c.device_id,
          name: c.store_name,
          type: c.store_type,
          sliceName: sliceName ?? null,
          state,
          timestamp: snapshot?.timestamp ?? null,
        };
      });

      const filtered = storeName
        ? stores.filter(s => s.name === storeName)
        : stores;

      if (storeName && filtered.length === 0) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `No snapshot available for store "${storeName}".`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({ stores: filtered }, null, 2),
          },
        ],
      };
    },
  );
};
