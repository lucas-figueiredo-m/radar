import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpContext } from '../types';

export const registerGetStateSnapshot = (
  server: McpServer,
  ctx: McpContext,
): void => {
  server.tool(
    'get_state_snapshot',
    'Get current state snapshot for a state management store (Redux, Zustand, etc.). Without storeName, returns the list of available stores. With storeName, returns the current state. Without deviceId, returns stores from all devices.',
    {
      storeName: z
        .string()
        .optional()
        .describe('Store name to get state for. Omit to list available stores.'),
      deviceId: z
        .string()
        .optional()
        .describe('Device ID to filter by. Omit to get stores from all devices.'),
    },
    async ({ storeName, deviceId }) => {
      if (!storeName) {
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
            hasSnapshot: !!snapshot,
          };
        });

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({ stores }, null, 2),
            },
          ],
        };
      }

      if (deviceId) {
        const snapshot = ctx.db.state.getSnapshot(deviceId, storeName);
        if (!snapshot) {
          return {
            content: [
              {
                type: 'text' as const,
                text: `No snapshot available for store "${storeName}" on device "${deviceId}".`,
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
                  deviceId: snapshot.device_id,
                  storeName: snapshot.store_name,
                  state: JSON.parse(snapshot.state),
                  timestamp: snapshot.timestamp,
                },
                null,
                2,
              ),
            },
          ],
        };
      }

      // No deviceId — return snapshots from all devices for this store
      const allSnapshots = ctx.db.state.getSnapshots();
      const matching = allSnapshots.filter((s) => s.store_name === storeName);

      if (matching.length === 0) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `No snapshots available for store "${storeName}".`,
            },
          ],
        };
      }

      const parsed = matching.map((s) => ({
        deviceId: s.device_id,
        storeName: s.store_name,
        state: JSON.parse(s.state),
        timestamp: s.timestamp,
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
