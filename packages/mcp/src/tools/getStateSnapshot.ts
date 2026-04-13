import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpContext } from '../types';

export const registerGetStateSnapshot = (
  server: McpServer,
  ctx: McpContext,
): void => {
  server.tool(
    'get_state_snapshot',
    'Get current state snapshot for a state management store (Redux, Zustand, etc.). Without storeName, returns snapshots for all stores. With storeName, returns the snapshot for that specific store. Without deviceId, returns stores from all devices.',
    {
      storeName: z
        .string()
        .optional()
        .describe('Store name to get state for. Omit to get snapshots for all stores.'),
      deviceId: z
        .string()
        .optional()
        .describe('Device ID to filter by. Omit to get stores from all devices.'),
    },
    async ({ storeName, deviceId }) => {
      const capabilities = ctx.db.state.getCapabilities(deviceId);
      const snapshots = ctx.db.state.getSnapshots(deviceId);

      const stores = capabilities.map((c) => {
        const snapshot = snapshots.find(
          (s) =>
            s.store_name === c.store_name && s.device_id === c.device_id,
        );
        return {
          deviceId: c.device_id,
          name: c.store_name,
          type: c.store_type,
          state: snapshot ? JSON.parse(snapshot.state) : null,
          timestamp: snapshot?.timestamp ?? null,
        };
      });

      const filtered = storeName
        ? stores.filter((s) => s.name === storeName)
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
