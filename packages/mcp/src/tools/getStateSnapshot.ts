import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpContext } from '../types';
import { resolveDeviceId } from '../types';

export const registerGetStateSnapshot = (
  server: McpServer,
  ctx: McpContext,
): void => {
  server.tool(
    'get_state_snapshot',
    'Get current state snapshot for a state management store (Redux, Zustand, etc.). Without storeName, returns the list of available stores. With storeName, returns the current state.',
    {
      storeName: z
        .string()
        .optional()
        .describe('Store name to get state for. Omit to list available stores.'),
      deviceId: z
        .string()
        .optional()
        .describe('Device ID (auto-resolved if only one device connected)'),
    },
    async ({ storeName, deviceId }) => {
      const resolvedId = resolveDeviceId(ctx.wsHandle, deviceId);

      if (!storeName) {
        const capabilities = ctx.db.state.getCapabilities(resolvedId);
        const snapshots = ctx.db.state.getSnapshots(resolvedId);

        const stores = capabilities.map((c) => {
          const snapshot = snapshots.find((s) => s.store_name === c.store_name);
          return {
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

      const snapshot = ctx.db.state.getSnapshot(resolvedId, storeName);
      if (!snapshot) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `No snapshot available for store "${storeName}". It may not have been initialized yet.`,
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
    },
  );
};
